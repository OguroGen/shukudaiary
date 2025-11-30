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

    // Verify token
    fetch('/api/student/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          localStorage.removeItem('student_token')
          localStorage.removeItem('student_id')
          localStorage.removeItem('student_nickname')
          router.push('/student/login')
        } else {
          setNickname(data.nickname || storedNickname || '')
          loadHomeworks(studentId)
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
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Hello, {nickname}!</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Your Shukudai</h2>
          {homeworks.length === 0 ? (
            <p className="text-gray-600">No shukudai available.</p>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => (
                <div
                  key={homework.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold mb-2">
                    Shukudai #{homework.id.slice(0, 8)} -{' '}
                    {homework.type === 'mul'
                      ? 'Multiplication'
                      : homework.type === 'div'
                      ? 'Division'
                      : 'Mitori'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {homework.question_count} questions
                    {homework.type !== 'mitori' &&
                      ` / ${homework.left_digits}-digit × ${homework.right_digits}-digit`}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Period: {new Date(homework.start_date).toLocaleDateString()} ~{' '}
                    {new Date(homework.end_date).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/student/homework/${homework.id}/start`}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Free Practice</h2>
          <div className="space-y-3">
            <Link
              href="/student/practice?type=mitori"
              className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
            >
              Practice Mitori
            </Link>
            <Link
              href="/student/practice?type=mul"
              className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
            >
              Practice Multiplication
            </Link>
            <Link
              href="/student/practice?type=div"
              className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
            >
              Practice Division
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <Link
            href="/student/password"
            className="block w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center"
          >
            Change password
          </Link>
        </div>
      </div>
    </div>
  )
}

