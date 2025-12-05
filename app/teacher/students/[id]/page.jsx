'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id

  const [student, setStudent] = useState(null)
  const [homeworks, setHomeworks] = useState([])
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadStudentData(supabase, studentId)
    })
  }, [studentId, router])

  const loadStudentData = async (supabase, id) => {
    try {
      // Get student
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (studentData) {
        setStudent(studentData)
      }

      // Get homeworks
      const { data: homeworksData } = await supabase
        .from('homeworks')
        .select('*, students(id, nickname)')
        .eq('student_id', id)
        .order('created_at', { ascending: false })

      if (homeworksData) {
        setHomeworks(
          homeworksData.map((hw) => ({
            ...hw,
            student: hw.students,
          }))
        )
      }

      // Get recent wrong answers
      const { data: wrongAnswersData } = await supabase
        .from('answers')
        .select('*, homeworks(id)')
        .eq('student_id', id)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (wrongAnswersData) {
        setWrongAnswers(wrongAnswersData)
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('パスワードをリセットしますか？')) return

    setResettingPassword(true)
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
      setResettingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>生徒が見つかりません</div>
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
                生徒: {student.nickname} (ID: {student.login_id})
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                ホームに戻る
              </Link>
              <Link
                href="/teacher/students"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                生徒一覧に戻る
              </Link>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resettingPassword ? 'リセット中...' : 'パスワードリセット'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">宿題履歴</h2>
          {homeworks.length === 0 ? (
            <p className="text-gray-600">宿題はまだありません。</p>
          ) : (
            <div className="space-y-2">
              {homeworks.map((homework) => {
                const typeName =
                  homework.type === 'mul'
                    ? 'かけ算'
                    : homework.type === 'div'
                    ? 'わり算'
                    : '見取り算'
                return (
                  <div
                    key={homework.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">
                          宿題 #{homework.id.slice(0, 8)} - {typeName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          解答日時:{' '}
                          {new Date(homework.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <Link
                        href={`/teacher/homeworks/${homework.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        開く
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {wrongAnswers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">直近の誤答</h2>
            <div className="space-y-2">
              {wrongAnswers.map((answer, idx) => {
                const q = answer.question
                let questionText = ''
                if (q.type === 'mul') {
                  questionText = `${q.left} × ${q.right}`
                } else if (q.type === 'div') {
                  questionText = `${q.dividend} ÷ ${q.divisor}`
                } else {
                  questionText = q.numbers?.join(' + ') || ''
                }
                return (
                  <div
                    key={answer.id || idx}
                    className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900"
                  >
                    <div className="text-sm">
                      {questionText} → 正答: {answer.correct_answer} / 生徒の答え:{' '}
                      {answer.student_answer}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

