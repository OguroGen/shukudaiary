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

      // スラッグがある場合は新しいURL形式にリダイレクト
      // ない場合は旧URL形式を維持
      if (data.school_slug) {
        router.push(`/student/${data.school_slug}/home`)
      } else {
        router.push('/student/home')
      }
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-4 text-center text-orange-500">
        🎯 しゅくだいありー
      </h1>
      <h2 className="text-base font-semibold mb-4 text-center text-gray-700">
        ログイン
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
        <div>
          <label htmlFor="login_id" className="block text-sm font-semibold mb-1 text-gray-700">
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
              autoComplete="off"
              placeholder="バーコードスキャンまたは手入力"
              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-200 text-sm pr-12"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-white font-bold transition-colors text-sm"
              title="カメラでバーコードをスキャン"
            >
              📷
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold mb-1 text-gray-700">
            パスワード
          </label>
          <input
            ref={passwordRef}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-3 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-200 text-sm"
          />
        </div>
        {error && (
          <div className="text-red-700 text-xs bg-red-100 p-2 rounded-xl border-2 border-red-300 font-semibold">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-md transform hover:scale-105 transition-transform"
        >
          {loading ? 'ログイン中...' : '🚀 ログイン'}
        </button>
        <p className="text-xs text-gray-600 text-center mt-2">
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

