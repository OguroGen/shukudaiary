'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Preset } from '@/types/database'

export default function PresetsListPage() {
  const router = useRouter()
  const [presets, setPresets] = useState<Preset[]>([])
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

  const loadPresets = async (supabase: any, teacherId: string) => {
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
      console.error('Error loading presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (presetId: string) => {
    if (!confirm('このプリセットを削除しますか？')) return

    try {
      const response = await fetch(`/api/teacher/presets/${presetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadPresets(createClient(), router)
      } else {
        const data = await response.json()
        alert(data.error || '削除に失敗しました')
      }
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'mul':
        return 'Multiplication'
      case 'div':
        return 'Division'
      case 'mitori':
        return 'Mitori'
      default:
        return type
    }
  }

  const getDetails = (preset: Preset) => {
    if (preset.type === 'mitori') {
      return `rows=${preset.rows}, count=${preset.question_count}`
    } else {
      return `left=${preset.left_digits}, right=${preset.right_digits}, count=${preset.question_count}`
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Difficulty presets</h1>
            <Link
              href="/teacher/presets/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add preset
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {presets.length === 0 ? (
            <p className="text-gray-600">No presets yet.</p>
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
                        Name: {preset.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Type: {getTypeName(preset.type)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Details: {getDetails(preset)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/teacher/presets/${preset.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
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

