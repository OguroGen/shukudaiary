'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [schoolName, setSchoolName] = useState('')
  const [schoolSlug, setSchoolSlug] = useState('')
  const [planType, setPlanType] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingSlug, setSavingSlug] = useState(false)
  const [errorName, setErrorName] = useState('')
  const [errorSlug, setErrorSlug] = useState('')
  const [successName, setSuccessName] = useState(false)
  const [successSlug, setSuccessSlug] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      // 教室情報を取得
      supabase
        .from('teachers')
        .select('school_id, schools(name, slug, plan_type)')
        .eq('id', session.user.id)
        .single()
        .then(({ data: teacher, error }) => {
          if (error || !teacher) {
            setLoading(false)
            return
          }

          if (teacher.schools) {
            setSchoolName(teacher.schools.name || '')
            setSchoolSlug(teacher.schools.slug)
            setPlanType(teacher.schools.plan_type || 'free')
          }
          setLoading(false)
        })
    })
  }, [router])

  const handleNameSubmit = async (e) => {
    e.preventDefault()
    setErrorName('')
    setSuccessName(false)
    setSavingName(true)

    try {
      const response = await fetch('/api/teacher/school/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: schoolName }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorName(data.error || '教室名の変更に失敗しました')
        return
      }

      setSuccessName(true)
      setTimeout(() => setSuccessName(false), 3000)
    } catch (err) {
      setErrorName('教室名の変更に失敗しました')
    } finally {
      setSavingName(false)
    }
  }

  const handleSlugSubmit = async (e) => {
    e.preventDefault()
    setErrorSlug('')
    setSuccessSlug(false)
    setSavingSlug(true)

    try {
      const response = await fetch('/api/teacher/school/slug', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: schoolSlug }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorSlug(data.error || 'スラッグの変更に失敗しました')
        return
      }

      setSuccessSlug(true)
      setTimeout(() => setSuccessSlug(false), 3000)
    } catch (err) {
      setErrorSlug('スラッグの変更に失敗しました')
    } finally {
      setSavingSlug(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/teacher/home"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← ホームに戻る
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-semibold mb-6">教室設定</h1>

          {/* 教室名変更 */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">教室名</h2>
            <form onSubmit={handleNameSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="school_name"
                  className="block text-sm font-medium mb-2"
                >
                  教室名
                </label>
                <input
                  id="school_name"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="教室名を入力"
                />
                <p className="text-sm text-gray-500 mt-1">
                  100文字以内で入力してください
                </p>
              </div>
              {errorName && (
                <p className="text-red-600 text-sm mb-2">{errorName}</p>
              )}
              {successName && (
                <p className="text-green-600 text-sm mb-2">
                  教室名を更新しました
                </p>
              )}
              <button
                type="submit"
                disabled={savingName}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {savingName ? '保存中...' : '教室名を保存'}
              </button>
            </form>
          </div>

          {/* スラッグ変更 */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">教室URL</h2>
            <form onSubmit={handleSlugSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="school_slug"
                  className="block text-sm font-medium mb-2"
                >
                  教室URL
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    shukudaiary.anzan.online/student/
                  </span>
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
                    pattern="[a-z0-9-]+"
                    minLength={3}
                    maxLength={50}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tokyo-soroban"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  英数字とハイフンのみ使用可能（3文字以上50文字以内）
                </p>
              </div>
              {errorSlug && (
                <p className="text-red-600 text-sm mb-2">{errorSlug}</p>
              )}
              {successSlug && (
                <p className="text-green-600 text-sm mb-2">
                  教室URLを更新しました
                </p>
              )}
              <button
                type="submit"
                disabled={savingSlug}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {savingSlug ? '保存中...' : '教室URLを保存'}
              </button>
            </form>
          </div>

          {/* プラン情報（将来の実装用） */}
          <div>
            <h2 className="text-xl font-semibold mb-4">プラン</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                現在のプラン: <span className="font-semibold">{planType}</span>
              </p>
              <p className="text-sm text-gray-500">
                プラン変更機能は今後実装予定です
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

