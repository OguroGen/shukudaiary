'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { validateStudentData } from '@/lib/validation/student'

export default function NewStudentPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [studentCount, setStudentCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      // Check student count
      supabase
        .from('teachers')
        .select('school_id')
        .eq('id', session.user.id)
        .single()
        .then(({ data: teacher }) => {
          if (teacher) {
            supabase
              .from('students')
              .select('id', { count: 'exact', head: true })
              .eq('school_id', teacher.school_id)
              .then(({ count }) => {
                setStudentCount(count || 0)
              })
          }
        })
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Check limit
    if (studentCount >= 10) {
      setErrors({
        general: 'Freeプランでは10人まで登録できます',
      })
      return
    }

    // Validate
    const validationErrors = validateStudentData({
      login_id: loginId,
      nickname,
      password,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: loginId,
          nickname,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || '生徒の追加に失敗しました' })
        return
      }

      router.push('/teacher/students')
    } catch (error) {
      setErrors({ general: '生徒の追加に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">Add student</h1>

        {studentCount >= 10 && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
            Freeプランでは10人まで登録できます（現在: {studentCount}人）
          </div>
        )}

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login_id" className="block text-sm font-medium mb-1">
              Login ID
            </label>
            <input
              id="login_id"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.login_id && (
              <p className="text-red-600 text-sm mt-1">{errors.login_id}</p>
            )}
          </div>
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium mb-1">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nickname && (
              <p className="text-red-600 text-sm mt-1">{errors.nickname}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Initial Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || studentCount >= 10}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <Link
              href="/teacher/students"
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

