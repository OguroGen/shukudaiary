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
      // Get teacher's school_id
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (!teacher) return

      // Get students
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', teacher.school_id)
        .order('created_at', { ascending: false })

      if (!error) {
        setStudents(data || [])
      }
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
            <h1 className="text-2xl font-semibold">生徒一覧</h1>
            <div className="flex gap-2">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                ホームに戻る
              </Link>
              <Link
                href="/teacher/students/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                生徒を追加
              </Link>
            </div>
          </div>
          <input
            type="text"
            placeholder="ニックネームまたはログインIDで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {filteredStudents.length === 0 ? (
            <p className="text-gray-600">生徒が見つかりません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ニックネーム</th>
                    <th className="text-left p-2">ログインID</th>
                    <th className="text-left p-2">最終活動日</th>
                    <th className="text-left p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="p-2">{student.nickname}</td>
                      <td className="p-2">{student.login_id}</td>
                      <td className="p-2">
                        {student.last_activity
                          ? new Date(student.last_activity).toLocaleDateString('ja-JP')
                          : 'なし'}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Link
                            href={`/teacher/students/${student.id}`}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            詳細
                          </Link>
                          <Link
                            href={`/teacher/homeworks/create?student_id=${student.id}`}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
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

