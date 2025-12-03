'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BarcodeScanner from './BarcodeScanner'

export default function LoginForm() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const loginIdRef = useRef(null)
  const passwordRef = useRef(null)

  // コンポーネントマウント時にログインIDフィールドにフォーカス
  useEffect(() => {
    if (loginIdRef.current) {
      loginIdRef.current.focus()
    }
  }, [])

  const handleLoginIdKeyDown = (e) => {
    // バーコードリーダーからの入力を検知（Enterキーが押された場合）
    if (e.key === 'Enter' && loginId.trim()) {
      e.preventDefault()
      // パスワードフィールドにフォーカスを移動
      if (passwordRef.current) {
        passwordRef.current.focus()
      }
    }
  }

  const handleBarcodeScan = (scannedText) => {
    setLoginId(scannedText.trim())
    setShowScanner(false)
    // パスワードフィールドにフォーカスを移動
    setTimeout(() => {
      if (passwordRef.current) {
        passwordRef.current.focus()
      }
    }, 100)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'ログインに失敗しました')
        return
      }

      // Save token to localStorage
      localStorage.setItem('student_token', data.token)
      localStorage.setItem('student_id', data.student_id)
      localStorage.setItem('student_nickname', data.nickname)

      // Redirect to home
      router.push('/student/home')
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">
        🎯 しゅくだいありー
      </h1>
      <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">
        ログイン
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login_id" className="block text-base font-semibold mb-2 text-gray-700">
            ログインID
          </label>
          <div className="relative">
            <input
              ref={loginIdRef}
              id="login_id"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              onKeyDown={handleLoginIdKeyDown}
              required
              autoFocus
              placeholder="バーコードスキャンまたは手入力"
              className="w-full px-5 py-3 border-4 border-yellow-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-200 text-lg pr-16"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-yellow-400 hover:bg-yellow-500 rounded-xl text-white font-bold transition-colors"
              title="カメラでバーコードをスキャン"
            >
              📷
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-base font-semibold mb-2 text-gray-700">
            パスワード
          </label>
          <input
            ref={passwordRef}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-3 border-4 border-yellow-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-200 text-lg"
          />
        </div>
        {error && (
          <div className="text-red-700 text-base bg-red-100 p-4 rounded-2xl border-2 border-red-300 font-semibold">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-orange-400 text-white rounded-2xl hover:bg-orange-500 active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold shadow-lg transform hover:scale-105 transition-transform"
        >
          {loading ? 'ログイン中...' : '🚀 ログイン'}
        </button>
        <p className="text-sm text-gray-600 text-center mt-4">
          パスワードを忘れた場合は、先生に聞いてください。
        </p>
      </form>
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}

