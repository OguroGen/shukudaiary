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
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-semibold">
                ようこそ、{teacherName}さん
              </h1>
              {schoolName && (
                <p className="text-gray-600 mt-1">教室: {schoolName}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* 生徒用URL表示 */}
        {schoolSlug && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-lg p-6 mb-4">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <span>📋</span>
              <span>生徒用ログインURL</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              このURLを生徒に配布してください
            </p>
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {baseUrl}/student/
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold text-lg">
                  {schoolSlug}/login
                </span>
              </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              📋 URLをコピー
            </button>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                今日の宿題提出数
              </h3>
              <p className="text-3xl font-bold">{stats.todaySubmissions}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                今日の回答数
              </h3>
              <p className="text-3xl font-bold">{stats.todayAnswers}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">メニュー</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/teacher/students"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              生徒管理
            </Link>
            <Link
              href="/teacher/homeworks"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              宿題管理
            </Link>
            <Link
              href="/teacher/presets"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              プリセット管理
            </Link>
            <Link
              href="/teacher/settings"
              className="px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
            >
              設定
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

