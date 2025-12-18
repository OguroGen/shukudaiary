'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StudentHomePage() {
  const router = useRouter()
  const params = useParams()
  const schoolSlug = params.school_slug
  const [nickname, setNickname] = useState('')
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    const storedNickname = localStorage.getItem('student_nickname')
    const studentId = localStorage.getItem('student_id')

    if (!token || !studentId) {
      router.push(`/student/${schoolSlug}/login`)
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
          router.push(`/student/${schoolSlug}/login`)
        } else {
          setNickname(verifyData.nickname || storedNickname || '')
        }
      })
      .catch(() => {
        router.push(`/student/${schoolSlug}/login`)
      })

    // Set up Supabase Realtime subscription
    const supabase = createClient()
    
    // Subscribe to homeworks table changes for this student
    // Using a custom channel with student_id filter
    const channel = supabase
      .channel(`homeworks:student:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'homeworks',
          filter: `student_id=eq.${studentId}`, // Only listen to changes for this student
        },
        (payload) => {
          // Reload homeworks when changes are detected
          loadHomeworks(studentId)
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [router, schoolSlug])

  const loadHomeworks = async (studentId) => {
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
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('student_token')
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_nickname')
    router.push(`/student/${schoolSlug}/login`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-base font-bold text-orange-500">読み込み中...</div>
      </div>
    )
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
                    📝 宿題 #{homework.id.slice(0, 8)} -{' '}
                    {homework.type === 'mul'
                      ? '✖️ かけ算'
                      : homework.type === 'div'
                      ? '➗ わり算'
                      : '➕ 見取算'}
                  </h3>
                  <p className="text-xs text-gray-700 mb-1 font-semibold">
                    {homework.question_count}問
                    {homework.type !== 'mitori' && homework.parameter1 && homework.parameter2 &&
                      ` / ${homework.parameter1}桁 × ${homework.parameter2}桁`}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    期間: {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
                    {new Date(homework.end_date).toLocaleDateString('ja-JP')}
                  </p>
                  <Link
                    href={`/student/${schoolSlug}/homework/${homework.id}/start`}
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
              href={`/student/${schoolSlug}/password`}
              className="block w-full px-4 py-2 bg-gray-400 text-white rounded-xl hover:bg-gray-500 text-center font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
            >
              🔑 パスワードを変更
            </Link>
            <button
              onClick={handleLogout}
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

