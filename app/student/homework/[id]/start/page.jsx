'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function HomeworkStartPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id
  const [homework, setHomework] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    if (!token) {
      router.push('/student/login')
      return
    }

    fetch(`/api/student/homework/${homeworkId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push('/student/home')
        } else {
          setHomework(data.homework)
        }
      })
      .catch(() => {
        router.push('/student/home')
      })
      .finally(() => setLoading(false))
  }, [homeworkId, router])

  const handleStart = () => {
    router.push(`/student/homework/${homeworkId}/quiz`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-orange-500">読み込み中...</div>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-red-500">宿題が見つかりません</div>
      </div>
    )
  }

  const typeName =
    homework.type === 'mul'
      ? '✖️ かけ算'
      : homework.type === 'div'
      ? '➗ わり算'
      : '➕ 見取り算'

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border-4 border-blue-300">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">
          📝 宿題 #{homework.id.slice(0, 8)}
        </h1>

        <div className="space-y-5 mb-8 bg-yellow-50 rounded-3xl p-6 border-4 border-yellow-300">
          <div className="text-xl font-bold text-gray-800">
            <span className="text-orange-500">種目:</span> {typeName}
          </div>
          <div className="text-xl font-bold text-gray-800">
            <span className="text-orange-500">問題数:</span> {homework.question_count}問
          </div>
          {homework.type !== 'mitori' && (
            <div className="text-xl font-bold text-gray-800">
              <span className="text-orange-500">桁数:</span>{' '}
              {homework.left_digits}桁 × {homework.right_digits}桁
            </div>
          )}
          {homework.type === 'mitori' && (
            <div className="text-xl font-bold text-gray-800">
              <span className="text-orange-500">行数:</span> {homework.rows}行
            </div>
          )}
          <div className="text-lg text-gray-700">
            <span className="font-bold text-orange-500">解答可能期間:</span>{' '}
            {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
            {new Date(homework.end_date).toLocaleDateString('ja-JP')}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleStart}
            className="flex-1 px-6 py-4 bg-orange-400 text-white rounded-2xl hover:bg-orange-500 font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
          >
            🚀 開始する
          </button>
          <Link
            href="/student/home"
            className="flex-1 px-6 py-4 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
          >
            🏠 ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

