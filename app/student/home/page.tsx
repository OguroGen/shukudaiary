'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Homework } from '@/types/homework'

export default function StudentHomePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    const storedNickname = localStorage.getItem('student_nickname')
    const studentId = localStorage.getItem('student_id')

    if (!token || !studentId) {
      router.push('/student/login')
      return
    }

    // Verify token and load homeworks in parallel
    Promise.all([
      fetch('/api/student/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).then((res) => res.json()),
      loadHomeworks(studentId),
    ])
      .then(([verifyData]) => {
        if (verifyData.error) {
          localStorage.removeItem('student_token')
          localStorage.removeItem('student_id')
          localStorage.removeItem('student_nickname')
          router.push('/student/login')
        } else {
          setNickname(verifyData.nickname || storedNickname || '')
        }
      })
      .catch(() => {
        router.push('/student/login')
      })
  }, [router])

  const loadHomeworks = async (studentId: string) => {
    try {
      const token = localStorage.getItem('student_token')
      const response = await fetch(`/api/student/homeworks?student_id=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store', // Ensure fresh data
      })
      if (response.ok) {
        const data = await response.json()
        setHomeworks(data.homeworks || [])
      }
    } catch (error) {
      console.error('Failed to load homeworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('student_token')
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_nickname')
    router.push('/student/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-orange-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-orange-300">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-orange-500">
              👋 こんにちは、{nickname}さん！
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 bg-gray-100 px-4 py-2 rounded-2xl font-semibold hover:bg-gray-200"
            >
              ログアウト
            </button>
          </div>
        </div>

        <div className={`rounded-3xl shadow-xl p-6 mb-6 border-4 transition-all ${
          homeworks.length === 0 
            ? 'bg-white border-blue-300' 
            : 'bg-red-50 border-red-400'
        }`}>
          {homeworks.length === 0 ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-blue-600">📚 しゅくだいナシー</h2>
              <p className="text-gray-600 text-lg">宿題はありません。🎉</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-6 text-red-600 animate-bounce">
                📚 しゅくだいアリー
              </h2>
              <div className="space-y-4">
                {homeworks.map((homework) => (
                <div
                  key={homework.id}
                  className="border-4 border-yellow-300 rounded-3xl p-5 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                >
                  <h3 className="font-bold text-xl mb-3 text-gray-800">
                    📝 宿題 #{homework.id.slice(0, 8)} -{' '}
                    {homework.type === 'mul'
                      ? '✖️ かけ算'
                      : homework.type === 'div'
                      ? '➗ わり算'
                      : '➕ 見取り算'}
                  </h3>
                  <p className="text-base text-gray-700 mb-2 font-semibold">
                    {homework.question_count}問
                    {homework.type !== 'mitori' &&
                      ` / ${homework.left_digits}桁 × ${homework.right_digits}桁`}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    期間: {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
                    {new Date(homework.end_date).toLocaleDateString('ja-JP')}
                  </p>
                  <Link
                    href={`/student/homework/${homework.id}/start`}
                    className="inline-block px-6 py-3 bg-orange-400 text-white rounded-2xl hover:bg-orange-500 font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
                  >
                    🚀 開始
                  </Link>
                </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-green-300">
          <h2 className="text-2xl font-bold mb-6 text-green-600">🎯 自主練習</h2>
          <div className="space-y-4">
            <Link
              href="/student/practice?type=mitori"
              className="block w-full px-6 py-4 bg-green-400 text-white rounded-2xl hover:bg-green-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              ➕ 見取り算の練習
            </Link>
            <Link
              href="/student/practice?type=mul"
              className="block w-full px-6 py-4 bg-blue-400 text-white rounded-2xl hover:bg-blue-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              ✖️ かけ算の練習
            </Link>
            <Link
              href="/student/practice?type=div"
              className="block w-full px-6 py-4 bg-purple-400 text-white rounded-2xl hover:bg-purple-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              ➗ わり算の練習
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-gray-300">
          <h2 className="text-2xl font-bold mb-6 text-gray-700">⚙️ アカウント</h2>
          <Link
            href="/student/password"
            className="block w-full px-6 py-4 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
          >
            🔑 パスワードを変更
          </Link>
        </div>
      </div>
    </div>
  )
}

