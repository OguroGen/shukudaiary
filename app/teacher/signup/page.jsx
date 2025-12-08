'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateTeacherSignupData } from '@/lib/validation/teacher'
import PlanSelector from '@/components/teacher/PlanSelector'

export default function TeacherSignupPage() {
  const router = useRouter()
  const [schoolName, setSchoolName] = useState('')
  const [schoolSlug, setSchoolSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // バリデーション
    const validationErrors = validateTeacherSignupData({
      school_name: schoolName,
      email,
      password,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // プランタイプの検証（現状はfreeのみ）
    if (selectedPlan !== 'free') {
      setErrors({
        general: '現在はFreeプランのみ選択可能です',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/teacher/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: schoolName,
          school_slug: schoolSlug,
          email,
          password,
          plan_type: selectedPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'アカウント作成に失敗しました' })
        return
      }

      // サインアップ成功後、自動的にホーム画面に遷移
      if (data.requiresLogin) {
        // メール認証が必要な場合とそうでない場合でメッセージを分ける
        if (data.requiresEmailConfirmation) {
          router.push('/teacher/login?message=アカウントが作成されました。メールアドレスに送信された確認メールを開いて認証を完了してください。認証完了後、ログインできます。')
        } else {
          router.push('/teacher/login?message=アカウントが作成されました。ログインしてください。')
        }
      } else {
        // 自動ログイン成功、ホーム画面に遷移
        router.push('/teacher/home')
      }
    } catch (error) {
      setErrors({ general: 'アカウント作成に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">新規登録</h1>
          <Link
            href="/teacher/login"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ログインはこちら
          </Link>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="school_name" className="block text-sm font-medium mb-1">
              教室名 <span className="text-red-500">*</span>
            </label>
            <input
              id="school_name"
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 〇〇そろばん教室"
            />
            {errors.school_name && (
              <p className="text-red-600 text-sm mt-1">{errors.school_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="school_slug" className="block text-sm font-medium mb-1">
              教室URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm whitespace-nowrap">shukudaiary.anzan.online/student/</span>
              <input
                id="school_slug"
                type="text"
                value={schoolSlug}
                onChange={(e) => {
                  const cleaned = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '')
                    .replace(/^-+|-+$/g, '')
                  setSchoolSlug(cleaned)
                }}
                required
                pattern="[a-z0-9\-]+"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tokyo-soroban"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              英数字とハイフンのみ使用可能（例: tokyo-soroban）
            </p>
            {errors.school_slug && (
              <p className="text-red-600 text-sm mt-1">{errors.school_slug}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="teacher@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="6文字以上"
            />
            <p className="text-sm text-gray-500 mt-1">
              パスワードは6文字以上で入力してください
            </p>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <PlanSelector
              selectedPlan={selectedPlan}
              onPlanChange={setSelectedPlan}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '作成中...' : 'アカウントを作成'}
            </button>
            <Link
              href="/teacher/login"
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

