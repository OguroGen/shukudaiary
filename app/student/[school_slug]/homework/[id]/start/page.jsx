'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useStudentAuth } from '@/hooks/useStudentAuth'
import { getStudentUrl, getHomeworkTypeDisplayName } from '@/lib/utils/student'
import { formatDate } from '@/lib/utils/format'
import LoadingState from '@/components/student/LoadingState'

export default function HomeworkStartPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id
  const schoolSlug = params.school_slug
  const { loading: authLoading, isAuthenticated, getToken, requireAuth } = useStudentAuth()
  const [homework, setHomework] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      requireAuth()
      return
    }

    if (authLoading) return

    const token = getToken()
    if (!token) {
      requireAuth()
      return
    }

    fetch(`/api/student/homework/${homeworkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push(getStudentUrl(schoolSlug, 'home'))
        } else {
          setHomework(data.homework)
        }
      })
      .catch(() => {
        router.push(getStudentUrl(schoolSlug, 'home'))
      })
      .finally(() => setLoading(false))
  }, [homeworkId, router, schoolSlug, authLoading, isAuthenticated, getToken, requireAuth])

  const handleStart = () => {
    router.push(getStudentUrl(schoolSlug, `homework/${homeworkId}/quiz`))
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!homework) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-base font-bold text-red-500">宿題が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-2">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-4 border-2 border-blue-300">
        <h1 className="text-lg font-bold mb-4 text-center text-blue-600">
          📝 宿題
        </h1>

        <div className="space-y-3 mb-4 bg-yellow-50 rounded-xl p-3 border-2 border-yellow-300">
          <div className="text-sm font-bold text-gray-800">
            <span className="text-orange-500">種目:</span> {getHomeworkTypeDisplayName(homework.type)}
          </div>
          <div className="text-sm font-bold text-gray-800">
            <span className="text-orange-500">問題数:</span> {homework.question_count}問
          </div>
          {homework.type !== 'mitori' && homework.parameter1 && homework.parameter2 && (
            <div className="text-sm font-bold text-gray-800">
              <span className="text-orange-500">桁数:</span>{' '}
              {homework.parameter1}桁 × {homework.parameter2}桁
            </div>
          )}
          {homework.type === 'mitori' && homework.parameter2 && (
            <div className="text-sm font-bold text-gray-800">
              <span className="text-orange-500">行数:</span> {homework.parameter2}行
            </div>
          )}
          <div className="text-xs text-gray-700">
            <span className="font-bold text-orange-500">解答可能期間:</span>{' '}
            {formatDate(homework.start_date)} ~ {formatDate(homework.end_date)}
          </div>
        </div>

        {homework.message && (
          <div className="mb-4 bg-blue-50 rounded-xl p-5 border-4 border-blue-400 shadow-lg">
            <div className="text-base font-bold text-blue-700 mb-3">
              💬 先生からのメッセージ
            </div>
            <div className="text-lg font-semibold text-gray-900 whitespace-pre-wrap leading-relaxed">
              {homework.message}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
          >
            🚀 開始する
          </button>
          <Link
            href={getStudentUrl(schoolSlug, 'home')}
            className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-xl hover:bg-gray-500 text-center font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
          >
            🏠 ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

