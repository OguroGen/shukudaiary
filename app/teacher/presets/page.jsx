'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTypeName } from '@/lib/problem-types'
import { getTypeColor } from '@/lib/utils/homework'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function PresetsListPage() {
  const router = useRouter()
  const [presets, setPresets] = useState([])
  const [selectedTypes, setSelectedTypes] = useState(['mul', 'div', 'mitori']) // 初期値はすべて選択
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadPresets(supabase, session.user.id)
    })
  }, [router])

  const loadPresets = async (supabase, teacherId) => {
    try {
      // Get teacher's school_id
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (!teacher) return

      // Get presets
      const { data } = await supabase
        .from('presets')
        .select('*')
        .eq('school_id', teacher.school_id)
        .order('name')

      if (data) {
        setPresets(data)
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (presetId) => {
    if (!confirm('このプリセットを削除しますか？')) return

    try {
      const response = await fetch(`/api/teacher/presets/${presetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const supabase = createClient()
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            loadPresets(supabase, session.user.id)
          }
        })
      } else {
        const data = await response.json()
        alert(data.error || '削除に失敗しました')
      }
    } catch (error) {
      alert('削除に失敗しました')
    }
  }


  const getDetails = (preset) => {
    if (preset.type === 'mitori') {
      return `行数: ${preset.parameter2 || ''}, 問題数: ${preset.question_count}`
    } else {
      return `パラメーター1: ${preset.parameter1 || ''}桁, パラメーター2: ${preset.parameter2 || ''}桁, 問題数: ${preset.question_count}`
    }
  }

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // 種目別にプリセットを分類（useMemoで最適化）
  const presetsByType = useMemo(() => ({
    mul: presets.filter(p => p.type === 'mul'),
    div: presets.filter(p => p.type === 'div'),
    mitori: presets.filter(p => p.type === 'mitori')
  }), [presets])

  const typeOptions = [
    { value: 'mul', name: getTypeName('mul'), color: getTypeColor('mul') },
    { value: 'div', name: getTypeName('div'), color: getTypeColor('div') },
    { value: 'mitori', name: getTypeName('mitori'), color: getTypeColor('mitori') }
  ]

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              プリセット管理
            </h1>
            <div className="flex gap-3">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                ホームに戻る
              </Link>
              <Link
                href="/teacher/presets/new"
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                プリセットを追加
              </Link>
            </div>
          </div>

          {/* 種目トグルボタン */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">表示する種目</h2>
            <div className="flex flex-wrap gap-3">
              {typeOptions.map((option) => {
                const isSelected = selectedTypes.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleType(option.value)}
                    aria-pressed={isSelected}
                    aria-label={`${option.name}を${isSelected ? '非表示' : '表示'}`}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                      isSelected
                        ? `bg-gradient-to-r ${option.color} text-white`
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {option.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* プリセット一覧（種目別） */}
        {presets.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              <p className="text-slate-600 dark:text-slate-400 font-medium">プリセットはまだありません。</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {typeOptions.map((option) => {
              const typePresets = presetsByType[option.value]
              if (!selectedTypes.includes(option.value) || typePresets.length === 0) {
                return null
              }

              return (
                <div
                  key={option.value}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6"
                >
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <span className={`px-3 py-1 bg-gradient-to-r ${option.color} text-white rounded-lg text-sm font-bold`}>
                      {option.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                      ({typePresets.length}件)
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {typePresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                              {preset.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {getDetails(preset)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/teacher/presets/${preset.id}`}
                              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
                            >
                              編集
                            </Link>
                            <button
                              onClick={() => handleDelete(preset.id)}
                              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

