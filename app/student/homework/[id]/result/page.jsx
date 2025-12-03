'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function HomeworkResultPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id

  const [homework, setHomework] = useState(null)
  const [result, setResult] = useState(null)
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
            (a) => a.is_correct
          ).length
          const wrongAnswers = answersData.answers.filter(
            (a) => !a.is_correct
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
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-orange-500">読み込み中...</div>
      </div>
    )
  }

  if (!homework || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-red-500">結果が見つかりません</div>
      </div>
    )
  }

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

  const percentage = Math.round((result.correct / result.total) * 100)

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border-4 border-green-300">
        <h1 className="text-3xl font-bold mb-8 text-center text-green-600">
          🎉 宿題の結果 🎉
        </h1>

        <div className="mb-8 p-8 bg-green-100 rounded-3xl border-4 border-green-400">
          <div className="text-5xl font-bold text-center text-green-700 mb-2">
            正解: {result.correct} / {result.total}
          </div>
          <div className="text-3xl font-bold text-center text-green-600">
            {percentage}% できました！
          </div>
        </div>

        {result.wrongAnswers.length > 0 && (
          <div className="mb-8 bg-red-50 rounded-3xl p-6 border-4 border-red-300">
            <h2 className="text-2xl font-bold mb-4 text-red-600">❌ 間違えた問題</h2>
            <div className="space-y-3">
              {result.wrongAnswers.map((answer, idx) => (
                <div
                  key={answer.id || idx}
                  className="p-4 border-4 border-red-300 rounded-2xl bg-white"
                >
                  <div className="text-base font-semibold text-gray-800">
                    <span className="text-red-500">問題{answer.question_index + 1}:</span>{' '}
                    {formatQuestion(answer)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="text-green-600 font-bold">正答: {answer.correct_answer}</span>
                    {' / '}
                    <span className="text-red-600 font-bold">あなたの答え: {answer.student_answer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/student/home"
          className="block w-full px-6 py-4 bg-orange-400 text-white rounded-2xl hover:bg-orange-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
        >
          🏠 ホームに戻る
        </Link>
      </div>
    </div>
  )
}

