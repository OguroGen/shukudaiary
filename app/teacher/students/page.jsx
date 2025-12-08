'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StudentsListPage() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [resettingPassword, setResettingPassword] = useState(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadStudents(supabase, session.user.id)
    })
  }, [router])

  const loadStudents = async (supabase, teacherId) => {
    try {
      // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
      const { data: teacherBranch } = await supabase
        .from('teacher_branches')
        .select('branch_id')
        .eq('teacher_id', teacherId)
        .limit(1)
        .single()

      if (!teacherBranch) return

      // Get students in teacher's branch
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('branch_id', teacherBranch.branch_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load students:', error)
        return
      }

      const students = data || []
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      
      // Check for active and finished homeworks for each student
      const studentsWithHomeworkStatus = await Promise.all(
        students.map(async (student) => {
          // Check for active homeworks (期間が今日を含み終了していない = end_date > 今日)
          const { data: activeHomeworks } = await supabase
            .from('homeworks')
            .select('id')
            .eq('student_id', student.id)
            .lte('start_date', today)
            .gt('end_date', today)
            .limit(1)
          
          const hasActiveHomework = (activeHomeworks && activeHomeworks.length > 0) || false
          
          // Check for finished homeworks (今日終了した宿題 = end_date = 今日)
          // ただし、アクティブな宿題がない場合のみチェック
          let hasFinishedHomework = false
          if (!hasActiveHomework) {
            const { data: finishedHomeworks } = await supabase
              .from('homeworks')
              .select('id')
              .eq('student_id', student.id)
              .lte('start_date', today)
              .eq('end_date', today)
              .limit(1)
            
            hasFinishedHomework = (finishedHomeworks && finishedHomeworks.length > 0) || false
          }
          
          return {
            ...student,
            hasActiveHomework,
            hasFinishedHomework
          }
        })
      )

      setStudents(studentsWithHomeworkStatus)
    } catch (error) {
      console.error('Failed to load students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (studentId) => {
    if (!confirm('パスワードをリセットしますか？')) return

    setResettingPassword(studentId)
    try {
      const response = await fetch('/api/teacher/students/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`新しいパスワード: ${data.new_password}`)
      } else {
        alert(data.error || 'パスワードリセットに失敗しました')
      }
    } catch (error) {
      alert('パスワードリセットに失敗しました')
    } finally {
      setResettingPassword(null)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.login_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              生徒一覧
            </h1>
            <div className="flex gap-3">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                ホームに戻る
              </Link>
              <Link
                href="/teacher/students/new"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  生徒を追加
                </span>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ニックネームまたはログインIDで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-slate-600 dark:text-slate-400 font-medium">生徒が見つかりません。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">ニックネーム</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">ログインID</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">最終活動日</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr 
                      key={student.id} 
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {student.nickname.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{student.nickname}</span>
                          {student.hasActiveHomework && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              しゅくだいアリー
                            </span>
                          )}
                          {!student.hasActiveHomework && student.hasFinishedHomework && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-lg text-xs font-bold shadow-sm">
                              しゅくだいオワリー
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded">
                          {student.login_id}
                        </code>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {student.last_activity
                          ? new Date(student.last_activity).toLocaleDateString('ja-JP')
                          : <span className="text-slate-400">なし</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/teacher/students/${student.id}`}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            詳細
                          </Link>
                          <Link
                            href={`/teacher/homeworks/create?student_id=${student.id}&from=students`}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            宿題を作成
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

