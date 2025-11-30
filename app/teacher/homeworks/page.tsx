'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HomeworkWithStudent } from '@/types/homework'

export default function HomeworksListPage() {
  const router = useRouter()
  const [homeworks, setHomeworks] = useState<HomeworkWithStudent[]>([])
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

  const loadHomeworks = async (supabase: any, teacherId: string) => {
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

      const studentIds = students.map((s: any) => s.id)

      // Get homeworks
      const { data } = await supabase
        .from('homeworks')
        .select('*, students(id, nickname)')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      if (data) {
        setHomeworks(
          data.map((hw: any) => ({
            ...hw,
            student: hw.students,
          }))
        )
      }
    } catch (error) {
      console.error('Error loading homeworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (homework: HomeworkWithStudent) => {
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
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Homeworks</h1>
            <Link
              href="/teacher/homeworks/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create shukudai
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {homeworks.length === 0 ? (
            <p className="text-gray-600">No homeworks yet.</p>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => {
                const typeName =
                  homework.type === 'mul'
                    ? 'Multiplication'
                    : homework.type === 'div'
                    ? 'Division'
                    : 'Mitori'
                const status = getStatus(homework)
                return (
                  <div
                    key={homework.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">
                          Shukudai #{homework.id.slice(0, 8)} -{' '}
                          {homework.student?.nickname} - {typeName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Period: {new Date(homework.start_date).toLocaleDateString()} ~{' '}
                          {new Date(homework.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm">
                          Status:{' '}
                          <span
                            className={
                              status === 'Active'
                                ? 'text-green-600'
                                : status === 'Expired'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }
                          >
                            {status}
                          </span>
                        </p>
                      </div>
                      <Link
                        href={`/teacher/homeworks/${homework.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Details
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

