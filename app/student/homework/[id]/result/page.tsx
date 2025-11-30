'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Homework, Answer } from '@/types/homework'

export default function HomeworkResultPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id as string

  const [homework, setHomework] = useState<Homework | null>(null)
  const [result, setResult] = useState<{
    total: number
    correct: number
    wrongAnswers: Answer[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    if (!token) {
      router.push('/student/login')
      return
    }

    const studentId = localStorage.getItem('student_id')
    Promise.all([
      fetch(`/api/student/homework/${homeworkId}`).then((res) => res.json()),
      fetch(`/api/student/homework/${homeworkId}/answers?student_id=${studentId}`).then((res) =>
        res.json()
      ),
    ])
      .then(([homeworkData, answersData]) => {
        if (homeworkData.error) {
          router.push('/student/home')
          return
        }

        setHomework(homeworkData.homework)

        if (answersData.answers) {
          const total = answersData.answers.length
          const correct = answersData.answers.filter(
            (a: Answer) => a.is_correct
          ).length
          const wrongAnswers = answersData.answers.filter(
            (a: Answer) => !a.is_correct
          )

          setResult({ total, correct, wrongAnswers })
        }
      })
      .catch(() => {
        router.push('/student/home')
      })
      .finally(() => setLoading(false))
  }, [homeworkId, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!homework || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Result not found</div>
      </div>
    )
  }

  const formatQuestion = (answer: Answer) => {
    const q = answer.question as any
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
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">Shukudai result</h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="text-3xl font-semibold text-center">
            Correct: {result.correct} / {result.total}
          </div>
        </div>

        {result.wrongAnswers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Wrong answers</h2>
            <div className="space-y-2">
              {result.wrongAnswers.map((answer, idx) => (
                <div
                  key={answer.id || idx}
                  className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900"
                >
                  <div className="text-sm">
                    <strong>Q{answer.question_index + 1}:</strong>{' '}
                    {formatQuestion(answer)} → Correct: {answer.correct_answer}{' '}
                    / You: {answer.student_answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/student/home"
          className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

