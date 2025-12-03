'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HomeworksListPage() {
  const router = useRouter()
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadHomeworks(supabase, session.user.id)
    })
  }, [router])

  const loadHomeworks = async (supabase, teacherId) => {
    try {
      // Get teacher's school_id
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (!teacher) return

      // Get all students in school
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', teacher.school_id)

      if (!students || students.length === 0) {
        setLoading(false)
        return
      }

      const studentIds = students.map((s) => s.id)

      // Get homeworks
      const { data } = await supabase
        .from('homeworks')
        .select('*, students(id, nickname)')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      if (data) {
        setHomeworks(
          data.map((hw) => ({
            ...hw,
            student: hw.students,
          }))
        )
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (homework) => {
    const today = new Date().toISOString().split('T')[0]
    if (homework.end_date < today) {
      return 'Expired'
    }
    if (homework.start_date > today) {
      return 'Not started'
    }
    return 'Active'
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">宿題一覧</h1>
            <Link
              href="/teacher/homeworks/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              宿題を作成
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {homeworks.length === 0 ? (
            <p className="text-gray-600">宿題はまだありません。</p>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => {
                const typeName =
                  homework.type === 'mul'
                    ? 'かけ算'
                    : homework.type === 'div'
                    ? 'わり算'
                    : '見取り算'
                const status = getStatus(homework)
                const statusText =
                  status === 'Active'
                    ? '期間内'
                    : status === 'Expired'
                    ? '期限切れ'
                    : '未開始'
                return (
                  <div
                    key={homework.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">
                          宿題 #{homework.id.slice(0, 8)} -{' '}
                          {homework.student?.nickname} - {typeName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          期間: {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
                          {new Date(homework.end_date).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-sm">
                          状態:{' '}
                          <span
                            className={
                              status === 'Active'
                                ? 'text-green-600'
                                : status === 'Expired'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }
                          >
                            {statusText}
                          </span>
                        </p>
                      </div>
                      <Link
                        href={`/teacher/homeworks/${homework.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        詳細
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

