'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function TeacherHomePage() {
  const router = useRouter()
  const [teacherName, setTeacherName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolSlug, setSchoolSlug] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ベースURLを取得（クライアントサイドのみ）
    // 生徒用URLはstudentサブドメインを使用
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      // teacherサブドメインの場合はstudentサブドメインに変換
      const studentBaseUrl = origin.replace('teacher.shukudaiary.anzan.online', 'shukudaiary.anzan.online')
      setBaseUrl(studentBaseUrl)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      // Get teacher and school info in one query
      supabase
        .from('teachers')
        .select('id, school_id, email, schools(name, slug)')
        .eq('id', session.user.id)
        .single()
        .then(({ data: teacher, error }) => {
          if (error || !teacher) {
            setLoading(false)
            return
          }

          setTeacherName(teacher.email)
          if (teacher.schools && typeof teacher.schools === 'object') {
            const school = teacher.schools
            setSchoolName(school.name)
            setSchoolSlug(school.slug)
          }

          const today = new Date().toISOString().split('T')[0]

          // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
          supabase
            .from('teacher_branches')
            .select('branch_id')
            .eq('teacher_id', session.user.id)
            .limit(1)
            .single()
            .then(({ data: teacherBranch }) => {
              if (!teacherBranch) {
                setStats({ todayAnswers: 0, todaySubmissions: 0 })
                setLoading(false)
                return
              }

              // Get students in teacher's branch and stats in parallel
              Promise.all([
                supabase
                  .from('students')
                  .select('id')
                  .eq('branch_id', teacherBranch.branch_id),
              ]).then(([studentsRes]) => {
            const students = studentsRes.data || []
            if (students.length === 0) {
              setStats({ todayAnswers: 0, todaySubmissions: 0 })
              setLoading(false)
              return
            }

            const studentIds = students.map((s) => s.id)

            // Get stats in parallel
            Promise.all([
              supabase
                .from('answers')
                .select('id', { count: 'exact', head: true })
                .in('student_id', studentIds)
                .gte('created_at', today),
              supabase
                .from('homeworks')
                .select('id', { count: 'exact', head: true })
                .in('student_id', studentIds)
                .gte('created_at', today),
            ]).then(([answersRes, homeworksRes]) => {
                setStats({
                  todayAnswers: answersRes.count || 0,
                  todaySubmissions: homeworksRes.count || 0,
                })
                setLoading(false)
              })
            })
          })
        })
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/teacher/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                ようこそ、{teacherName}さん
              </h1>
              {schoolName && (
                <p className="text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">{schoolName}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* 生徒用URL表示 */}
        {schoolSlug && (
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl shadow-xl p-6 mb-6 border border-blue-400/20 dark:border-blue-500/20">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>生徒用ログインURL</span>
            </h2>
            <p className="text-blue-100 dark:text-blue-200 mb-4 text-sm">
              このURLを生徒に配布してください
            </p>
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-blue-100 dark:text-blue-200 text-sm font-mono">
                    {baseUrl}/student/
                  </span>
                  <span className="text-white font-mono font-bold text-lg">
                    {schoolSlug}/login
                  </span>
                </div>
                <button
                  onClick={() => {
                    const url = `${baseUrl}/student/${schoolSlug}/login`
                    navigator.clipboard.writeText(url).then(() => {
                      alert('URLをクリップボードにコピーしました')
                    }).catch(() => {
                      // フォールバック: テキストを選択
                      const textArea = document.createElement('textarea')
                      textArea.value = url
                      document.body.appendChild(textArea)
                      textArea.select()
                      document.execCommand('copy')
                      document.body.removeChild(textArea)
                      alert('URLをクリップボードにコピーしました')
                    })
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md flex-shrink-0"
                  title="URLをコピー"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 統計カード */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl shadow-xl p-6 border border-emerald-400/20 dark:border-emerald-500/20 transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  今日の宿題提出数
                </h3>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{stats.todaySubmissions}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-2xl shadow-xl p-6 border border-amber-400/20 dark:border-amber-500/20 transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  今日の回答数
                </h3>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{stats.todayAnswers}</p>
            </div>
          </div>
        )}

        {/* メニュー */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">メニュー</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/teacher/students"
              className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">生徒管理</h3>
              </div>
            </Link>
            <Link
              href="/teacher/homeworks"
              className="group relative bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">宿題一覧</h3>
              </div>
            </Link>
            <Link
              href="/teacher/presets"
              className="group relative bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">プリセット管理</h3>
              </div>
            </Link>
            <Link
              href="/teacher/settings"
              className="group relative bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 rounded-xl p-6 text-white hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">設定</h3>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

