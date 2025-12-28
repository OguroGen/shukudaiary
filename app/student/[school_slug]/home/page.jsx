'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useStudentAuth } from '@/hooks/useStudentAuth'
import { useStudentHomeworks } from '@/hooks/useStudentHomeworks'
import { getStudentUrl, getHomeworkTypeDisplayName } from '@/lib/utils/student'
import { formatDate } from '@/lib/utils/format'
import LoadingState from '@/components/student/LoadingState'

export default function StudentHomePage() {
  const params = useParams()
  const schoolSlug = params.school_slug
  const { nickname, loading: authLoading, isAuthenticated, getToken, getStudentId, logout, requireAuth } = useStudentAuth()
  const token = getToken()
  const studentId = getStudentId()
  const { homeworks, loading: homeworksLoading } = useStudentHomeworks(studentId, token)

  const loading = authLoading || homeworksLoading

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      requireAuth()
    }
  }, [authLoading, isAuthenticated, requireAuth])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-2">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-3 mb-3 border-2 border-orange-300">
          <h1 className="text-lg font-bold text-orange-500">
            👋 こんにちは、{nickname}さん！
          </h1>
        </div>

        <div className={`rounded-xl shadow-lg p-3 mb-3 border-2 transition-all ${
          homeworks.length === 0 
            ? 'bg-white border-blue-300' 
            : 'bg-red-50 border-red-400'
        }`}>
          {homeworks.length === 0 ? (
            <>
              <h2 className="text-base font-bold mb-3 text-blue-600">📚 しゅくだいナシー</h2>
              <p className="text-gray-600 text-sm">宿題はありません。🎉</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-3 text-red-600 animate-bounce">
                📚 しゅくだいアリー
              </h2>
              <div className="space-y-2">
                {homeworks.map((homework) => (
                <div
                  key={homework.id}
                  className="border-2 border-yellow-300 rounded-xl p-3 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                >
                  <h3 className="font-bold text-sm mb-2 text-gray-800">
                    📝 {getHomeworkTypeDisplayName(homework.type)}
                  </h3>
                  <p className="text-xs text-gray-700 mb-1 font-semibold">
                    {homework.question_count}問
                    {homework.type !== 'mitori' && homework.parameter1 && homework.parameter2 &&
                      ` / ${homework.parameter1}桁 × ${homework.parameter2}桁`}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    期間: {formatDate(homework.due_date_start)} ~ {formatDate(homework.due_date_end)}
                  </p>
                  <Link
                    href={getStudentUrl(schoolSlug, `homework/${homework.id}/start`)}
                    className="inline-block px-4 py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
                  >
                    🚀 開始
                  </Link>
                </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 border-2 border-gray-300">
          <h2 className="text-base font-bold mb-3 text-gray-700">⚙️ アカウント</h2>
          <div className="space-y-2">
            <Link
              href={getStudentUrl(schoolSlug, 'password')}
              className="block w-full px-4 py-2 bg-gray-400 text-white rounded-xl hover:bg-gray-500 text-center font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
            >
              🔑 パスワードを変更
            </Link>
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-400 text-white rounded-xl hover:bg-red-500 font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
            >
              🚪 ログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

