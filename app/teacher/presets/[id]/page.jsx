'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getPlanLimits, checkPresetLimit, getLimitErrorMessage } from '@/lib/plans'
import { getProblemType, getDefaultParameters } from '@/lib/problem-types'

export default function PresetEditPage() {
  const router = useRouter()
  const params = useParams()
  const presetId = params.id
  const isNew = presetId === 'new'

  const [name, setName] = useState('')
  const [type, setType] = useState('mul')
  const [parameters, setParameters] = useState(getDefaultParameters('mul'))
  const [questionCount, setQuestionCount] = useState(5)
  const [presetCount, setPresetCount] = useState(0)
  const [planType, setPlanType] = useState('free')
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

  // 種目が変わった時にパラメーターをリセット
  useEffect(() => {
    setParameters(getDefaultParameters(type))
  }, [type])

  const loadPresetCount = async (supabase, teacherId) => {
    try {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (teacher) {
        // Get plan type
        const { data: school } = await supabase
          .from('schools')
          .select('plan_type')
          .eq('id', teacher.school_id)
          .single()

        const plan = school?.plan_type || 'free'
        setPlanType(plan)
        
        // Get preset count
        const { count } = await supabase
          .from('presets')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', teacher.school_id)

        setPresetCount(count || 0)
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
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
        const hasParameters = preset.parameter1 !== null && preset.parameter1 !== undefined
        setParameters(hasParameters ? {
          parameter1: preset.parameter1,
          parameter2: preset.parameter2,
          parameter3: preset.parameter3,
          parameter4: preset.parameter4,
          parameter5: preset.parameter5,
          parameter6: preset.parameter6,
          parameter7: preset.parameter7,
          parameter8: preset.parameter8,
          parameter9: preset.parameter9,
          parameter10: preset.parameter10,
        } : getDefaultParameters(preset.type))
        setQuestionCount(preset.question_count)
      }
    } catch (error) {
      console.error('Failed to load preset:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (isNew && !checkPresetLimit(planType, presetCount)) {
      const errorMessage = getLimitErrorMessage(planType, 'presets', presetCount)
      setErrors({
        general: errorMessage,
      })
      return
    }

    if (!name.trim()) {
      setErrors({ name: '名前を入力してください' })
      return
    }

    if (questionCount < 1 || questionCount > 20) {
      setErrors({ questionCount: '問題数は1から20の間で入力してください' })
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
          parameter1: parameters.parameter1,
          parameter2: parameters.parameter2,
          parameter3: parameters.parameter3,
          parameter4: parameters.parameter4,
          parameter5: parameters.parameter5,
          parameter6: parameters.parameter6,
          parameter7: parameters.parameter7,
          parameter8: parameters.parameter8,
          parameter9: parameters.parameter9,
          parameter10: parameters.parameter10,
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">
            {isNew ? 'プリセットを新規作成' : 'プリセットを編集'}
          </h1>
          <Link
            href="/teacher/home"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            ホームに戻る
          </Link>
        </div>

        {isNew && !checkPresetLimit(planType, presetCount) && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
            {getLimitErrorMessage(planType, 'presets', presetCount)}
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
                見取算
              </label>
            </div>
          </div>

          {(() => {
            const problemType = getProblemType(type)
            if (!problemType) return null
            
            return Object.entries(problemType.parameters).map(([key, config]) => (
              <div key={key}>
                <label
                  htmlFor={key}
                  className="block text-sm font-medium mb-1"
                >
                  {config.label}
                </label>
                <input
                  id={key}
                  type="number"
                  min={config.min}
                  max={config.max}
                  value={parameters[key] ?? config.default}
                  onChange={(e) => setParameters({
                    ...parameters,
                    [key]: parseInt(e.target.value, 10) || null
                  })}
                  required={config.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))
          })()}

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
              max="20"
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(parseInt(e.target.value, 10))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.questionCount && (
              <p className="text-red-600 text-sm mt-1">{errors.questionCount}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || (isNew && !checkPresetLimit(planType, presetCount))}
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

