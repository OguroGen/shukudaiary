'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Homework } from '@/types/homework'

export default function HomeworkStartPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id as string
  const [homework, setHomework] = useState<Homework | null>(null)
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">
          宿題 #{homework.id.slice(0, 8)}
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <span className="font-semibold">種目:</span> {typeName}
          </div>
          <div>
            <span className="font-semibold">問題数:</span> {homework.question_count}問
          </div>
          {homework.type !== 'mitori' && (
            <div>
              <span className="font-semibold">桁数:</span>{' '}
              {homework.left_digits}桁 × {homework.right_digits}桁
            </div>
          )}
          {homework.type === 'mitori' && (
            <div>
              <span className="font-semibold">行数:</span> {homework.rows}行
            </div>
          )}
          <div>
            <span className="font-semibold">解答可能期間:</span>{' '}
            {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
            {new Date(homework.end_date).toLocaleDateString('ja-JP')}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleStart}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            開始する
          </button>
          <Link
            href="/student/home"
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

