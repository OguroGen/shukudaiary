'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function TeacherHomePage() {
  const router = useRouter()
  const [teacherName, setTeacherName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [stats, setStats] = useState<{
    todaySubmissions: number
    todayAnswers: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      // Get teacher and school info
      supabase
        .from('teachers')
        .select('id, school_id, email, schools(name)')
        .eq('id', session.user.id)
        .single()
        .then(({ data: teacher }) => {
          if (teacher) {
            setTeacherName(teacher.email)
            if (teacher.schools && typeof teacher.schools === 'object') {
              const school = teacher.schools as { name: string }
              setSchoolName(school.name)
            }
          }
        })

      // Get teacher's school_id and today's stats
      supabase
        .from('teachers')
        .select('school_id')
        .eq('id', session.user.id)
        .single()
        .then(({ data: teacher }) => {
          if (!teacher) {
            setLoading(false)
            return
          }

          const today = new Date().toISOString().split('T')[0]

          // Get students in school
          supabase
            .from('students')
            .select('id')
            .eq('school_id', teacher.school_id)
            .then(({ data: students }) => {
              if (!students || students.length === 0) {
                setStats({ todayAnswers: 0, todaySubmissions: 0 })
                setLoading(false)
                return
              }

              const studentIds = students.map((s: any) => s.id)

              Promise.all([
                supabase
                  .from('answers')
                  .select('id', { count: 'exact', head: true })
                  .in('student_id', studentIds)
                  .gte('created_at', today),
                supabase
                  .from('homeworks')
                  .select('id', { count: 'exact', head: true })
                  .in('student_id', studentIds)
                  .gte('created_at', today),
              ]).then(([answersRes, homeworksRes]) => {
                setStats({
                  todayAnswers: answersRes.count || 0,
                  todaySubmissions: homeworksRes.count || 0,
                })
                setLoading(false)
              })
            })
        })
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/teacher/login')
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
            <div>
              <h1 className="text-2xl font-semibold">
                Welcome, {teacherName}
              </h1>
              {schoolName && (
                <p className="text-gray-600 mt-1">School: {schoolName}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                Today&apos;s shukudai submissions
              </h3>
              <p className="text-3xl font-bold">{stats.todaySubmissions}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                Today&apos;s answers
              </h3>
              <p className="text-3xl font-bold">{stats.todayAnswers}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/teacher/students"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              Students
            </Link>
            <Link
              href="/teacher/homeworks"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              Homeworks
            </Link>
            <Link
              href="/teacher/presets"
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              Presets
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

