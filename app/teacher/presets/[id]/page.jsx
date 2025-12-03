'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function PresetEditPage() {
  const router = useRouter()
  const params = useParams()
  const presetId = params.id
  const isNew = presetId === 'new'

  const [name, setName] = useState('')
  const [type, setType] = useState('mul')
  const [leftDigits, setLeftDigits] = useState(2)
  const [rightDigits, setRightDigits] = useState(1)
  const [rows, setRows] = useState(4)
  const [questionCount, setQuestionCount] = useState(20)
  const [presetCount, setPresetCount] = useState(0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!isNew)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      if (isNew) {
        loadPresetCount(supabase, session.user.id)
      } else {
        loadPreset(supabase, presetId)
      }
    })
  }, [presetId, isNew, router])

  const loadPresetCount = async (supabase, teacherId) => {
    try {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (teacher) {
        const { count } = await supabase
          .from('presets')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', teacher.school_id)

        setPresetCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading preset count:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadPreset = async (supabase, id) => {
    try {
      const { data: preset } = await supabase
        .from('presets')
        .select('*')
        .eq('id', id)
        .single()

      if (preset) {
        setName(preset.name)
        setType(preset.type)
        setLeftDigits(preset.left_digits || 2)
        setRightDigits(preset.right_digits || 1)
        setRows(preset.rows || 4)
        setQuestionCount(preset.question_count)
      }
    } catch (error) {
      console.error('Error loading preset:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (isNew && presetCount >= 10) {
      setErrors({
        general: 'Freeプランでは10件まで登録できます',
      })
      return
    }

    if (!name.trim()) {
      setErrors({ name: '名前を入力してください' })
      return
    }

    setLoading(true)

    try {
      const url = isNew
        ? '/api/teacher/presets'
        : `/api/teacher/presets/${presetId}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          left_digits: type !== 'mitori' ? leftDigits : null,
          right_digits: type !== 'mitori' ? rightDigits : null,
          rows: type === 'mitori' ? rows : null,
          question_count: questionCount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || '保存に失敗しました' })
        return
      }

      router.push('/teacher/presets')
    } catch (error) {
      setErrors({ general: '保存に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">
          {isNew ? 'プリセットを新規作成' : 'プリセットを編集'}
        </h1>

        {isNew && presetCount >= 10 && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
            Freeプランでは10件まで登録できます（現在: {presetCount}件）
          </div>
        )}

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              プリセット名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              種目
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="mul"
                  checked={type === 'mul'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                かけ算
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="div"
                  checked={type === 'div'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                わり算
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="mitori"
                  checked={type === 'mitori'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                見取り算
              </label>
            </div>
          </div>

          {type !== 'mitori' && (
            <>
              <div>
                <label
                  htmlFor="left_digits"
                  className="block text-sm font-medium mb-1"
                >
                  左側の桁数
                </label>
                <input
                  id="left_digits"
                  type="number"
                  min="1"
                  max="10"
                  value={leftDigits}
                  onChange={(e) => setLeftDigits(parseInt(e.target.value, 10))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="right_digits"
                  className="block text-sm font-medium mb-1"
                >
                  右側の桁数
                </label>
                <input
                  id="right_digits"
                  type="number"
                  min="1"
                  max="10"
                  value={rightDigits}
                  onChange={(e) =>
                    setRightDigits(parseInt(e.target.value, 10))
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {type === 'mitori' && (
            <div>
              <label htmlFor="rows" className="block text-sm font-medium mb-1">
                行数
              </label>
              <input
                id="rows"
                type="number"
                min="2"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value, 10))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="question_count"
              className="block text-sm font-medium mb-1"
            >
              問題数
            </label>
            <input
              id="question_count"
              type="number"
              min="1"
              max="100"
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(parseInt(e.target.value, 10))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || (isNew && presetCount >= 10)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <Link
              href="/teacher/presets"
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

