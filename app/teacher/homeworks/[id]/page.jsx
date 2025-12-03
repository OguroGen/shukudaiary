'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HomeworkDetailPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id

  const [homework, setHomework] = useState(null)
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadHomeworkData(supabase, homeworkId)
    })
  }, [homeworkId, router])

  const loadHomeworkData = async (supabase, id) => {
    try {
      // Get homework with student
      const { data: homeworkData } = await supabase
        .from('homeworks')
        .select('*, students(id, nickname)')
        .eq('id', id)
        .single()

      if (homeworkData) {
        setHomework(homeworkData)
        if (homeworkData.students) {
          setStudentName(homeworkData.students.nickname)
        }
      }

      // Get answers
      const { data: answersData } = await supabase
        .from('answers')
        .select('*')
        .eq('homework_id', id)
        .order('question_index', { ascending: true })

      if (answersData) {
        setAnswers(answersData)
      }
    } catch (error) {
      console.error('Error loading homework data:', error)
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

  if (!homework) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>宿題が見つかりません</div>
      </div>
    )
  }

  const typeName =
    homework.type === 'mul'
      ? 'かけ算'
      : homework.type === 'div'
      ? 'わり算'
      : '見取り算'

  const correctCount = answers.filter((a) => a.is_correct).length

  const formatQuestion = (answer) => {
    const q = answer.question
    if (q.type === 'mul') {
      return `${q.left} × ${q.right}`
    } else if (q.type === 'div') {
      return `${q.dividend} ÷ ${q.divisor}`
    } else {
      return q.numbers?.join(' + ') || ''
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-semibold">
                宿題 #{homework.id.slice(0, 8)} - {studentName}
              </h1>
            </div>
            <Link
              href="/teacher/homeworks"
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              宿題一覧に戻る
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="space-y-2 mb-4">
            <div>
              <span className="font-semibold">種目:</span> {typeName}
            </div>
            <div>
              <span className="font-semibold">スコア:</span> {correctCount} /{' '}
              {answers.length}
            </div>
            {answers.length > 0 && (
              <div>
                <span className="font-semibold">解答日時:</span>{' '}
                {new Date(answers[0].created_at).toLocaleString('ja-JP')}
              </div>
            )}
          </div>
        </div>

        {answers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">回答一覧</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">問題</th>
                    <th className="text-left p-2">正答</th>
                    <th className="text-left p-2">生徒の答え</th>
                    <th className="text-left p-2">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map((answer) => (
                    <tr
                      key={answer.id}
                      className={
                        answer.is_correct
                          ? 'bg-green-50 dark:bg-green-900'
                          : 'bg-red-50 dark:bg-red-900'
                      }
                    >
                      <td className="p-2">{answer.question_index + 1}</td>
                      <td className="p-2">{formatQuestion(answer)}</td>
                      <td className="p-2">{answer.correct_answer}</td>
                      <td className="p-2">{answer.student_answer}</td>
                      <td className="p-2">
                        {answer.is_correct ? '✓' : '✗'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

