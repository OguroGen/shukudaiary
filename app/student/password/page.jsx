'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentPasswordChangePage() {
  const router = useRouter()
  const [oldPassword, setOldPassword] = useState('')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!oldPassword) {
      setError('現在のパスワードを入力してください')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません')
      return
    }

    if (newPassword.length < 4) {
      setError('パスワードは4文字以上で入力してください')
      return
    }

    if (oldPassword === newPassword) {
      setError('新しいパスワードは現在のパスワードと異なる必要があります')
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
          old_password: oldPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'パスワード変更に失敗しました')
        return
      }

      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('パスワード変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-2">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-4 border-2 border-gray-300">
        <h1 className="text-lg font-bold mb-4 text-center text-gray-700">
          🔑 パスワードを変更
        </h1>

        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-xl border-2 border-green-300 font-bold text-sm text-center">
            ✅ パスワードを変更しました
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="old_password" className="block text-sm font-bold mb-1 text-gray-700">
              現在のパスワード
            </label>
            <input
              id="old_password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-200 text-sm"
            />
          </div>
          <div>
            <label htmlFor="new_password" className="block text-sm font-bold mb-1 text-gray-700">
              新しいパスワード
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-200 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-bold mb-1 text-gray-700"
            >
              新しいパスワード（確認）
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-200 text-sm"
            />
          </div>
          {error && (
            <div className="text-red-700 text-xs bg-red-100 p-2 rounded-xl border-2 border-red-300 font-semibold">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
            >
              {loading ? '保存中...' : '💾 保存'}
            </button>
            <Link
              href="/student/home"
              className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-xl hover:bg-gray-500 text-center font-bold text-sm shadow-md transform hover:scale-105 transition-transform"
            >
              🏠 ホームに戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

