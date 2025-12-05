'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function PresetsListPage() {
  const router = useRouter()
  const [presets, setPresets] = useState([])
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
      // Error handling
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  const getTypeName = (type) => {
    switch (type) {
      case 'mul':
        return 'かけ算'
      case 'div':
        return 'わり算'
      case 'mitori':
        return '見取り算'
      default:
        return type
    }
  }

  const getDetails = (preset) => {
    if (preset.type === 'mitori') {
      return `行数=${preset.rows}, 問題数=${preset.question_count}`
    } else {
      return `左=${preset.left_digits}桁, 右=${preset.right_digits}桁, 問題数=${preset.question_count}`
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">難度プリセット</h1>
            <div className="flex gap-2">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                ホームに戻る
              </Link>
              <Link
                href="/teacher/presets/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                プリセットを追加
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {presets.length === 0 ? (
            <p className="text-gray-600">プリセットはまだありません。</p>
          ) : (
            <div className="space-y-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        名前: {preset.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        種目: {getTypeName(preset.type)}
                      </p>
                      <p className="text-sm text-gray-600">
                        詳細: {getDetails(preset)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/teacher/presets/${preset.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

