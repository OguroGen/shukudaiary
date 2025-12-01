'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types/student'
import { HomeworkWithStudent } from '@/types/homework'

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [homeworks, setHomeworks] = useState<HomeworkWithStudent[]>([])
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const loadStudentData = async (supabase: any, id: string) => {
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
          homeworksData.map((hw: any) => ({
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
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
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
            <Link
              href="/teacher/students"
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              生徒一覧に戻る
            </Link>
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
                const q = answer.question as any
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

