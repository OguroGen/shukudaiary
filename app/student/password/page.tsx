'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentPasswordChangePage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    if (!token) {
      router.push('/student/login')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (newPassword.length < 4) {
      setError('パスワードは4文字以上で入力してください')
      return
    }

    setLoading(true)

    try {
      const studentId = localStorage.getItem('student_id')
      const token = localStorage.getItem('student_token')

      const response = await fetch('/api/student/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          token,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'パスワード変更に失敗しました')
        return
      }

      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('パスワード変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border-4 border-gray-300">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-700">
          🔑 パスワードを変更
        </h1>

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-2xl border-4 border-green-300 font-bold text-lg text-center">
            ✅ パスワードを変更しました
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new_password" className="block text-base font-bold mb-2 text-gray-700">
              新しいパスワード
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border-4 border-yellow-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-200 text-lg"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-base font-bold mb-2 text-gray-700"
            >
              新しいパスワード（確認）
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border-4 border-yellow-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-200 text-lg"
            />
          </div>
          {error && (
            <div className="text-red-700 text-base bg-red-100 p-4 rounded-2xl border-4 border-red-300 font-semibold">
              {error}
            </div>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-orange-400 text-white rounded-2xl hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              {loading ? '保存中...' : '💾 保存'}
            </button>
            <Link
              href="/student/home"
              className="flex-1 px-6 py-4 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              🏠 ホームに戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

