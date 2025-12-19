'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTodayString, isDateInPeriod } from '@/lib/utils/date'
import { getTypeName, getTypeColor, getCompletionStatus, getStatusText } from '@/lib/utils/homework'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import HomeworkCard from '@/components/teacher/HomeworkCard'

export default function HomeworksListPage() {
  const router = useRouter()
  const [allHomeworks, setAllHomeworks] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [students, setStudents] = useState([])

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
      // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
      const { data: teacherBranch } = await supabase
        .from('teacher_branches')
        .select('branch_id')
        .eq('teacher_id', teacherId)
        .limit(1)
        .single()

      if (!teacherBranch) return

      // Get all students in teacher's branch
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, nickname, login_id')
        .eq('branch_id', teacherBranch.branch_id)
        .order('nickname')

      if (!studentsData || studentsData.length === 0) {
        setLoading(false)
        return
      }

      setStudents(studentsData)
      const studentIds = studentsData.map((s) => s.id)

      // Get all homeworks
      const { data } = await supabase
        .from('homeworks')
        .select('*, students(id, nickname)')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      if (data) {
        // Get answer counts for each homework
        const homeworkIds = data.map((h) => h.id)
        const { data: answerCounts } = await supabase
          .from('answers')
          .select('homework_id')
          .in('homework_id', homeworkIds)

        // Count answers per homework
        const answerCountMap = new Map()
        if (answerCounts) {
          answerCounts.forEach((answer) => {
            if (answer.homework_id) {
              const count = answerCountMap.get(answer.homework_id) || 0
              answerCountMap.set(answer.homework_id, count + 1)
            }
          })
        }

        const formatted = data.map((hw) => {
          const answerCount = answerCountMap.get(hw.id) || 0
          return {
            ...hw,
            student: hw.students,
            answerCount: answerCount,
          }
        })
        setAllHomeworks(formatted)
        // Initial filter: show only homeworks where today is within the period
        const today = getTodayString()
        const filtered = formatted.filter((hw) => {
          const startDate = hw.start_date || ''
          const endDate = hw.end_date || ''
          return isDateInPeriod(today, startDate, endDate)
        })
        setHomeworks(filtered)
      }
    } catch (error) {
      console.error('Failed to load homeworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHomeworkStatus = (homework) => {
    const answerCount = homework.answerCount || 0
    const questionCount = homework.question_count || 0
    return getCompletionStatus(answerCount, questionCount)
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allHomeworks]

    // Period filter (initial: show only homeworks where today is within the period)
    if (!showAll) {
      const today = getTodayString()
      filtered = filtered.filter((hw) => {
        const startDate = hw.start_date || ''
        const endDate = hw.end_date || ''
        return isDateInPeriod(today, startDate, endDate)
      })
    }

    // Student filter
    if (selectedStudent) {
      filtered = filtered.filter((hw) => hw.student_id === selectedStudent)
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter((hw) => hw.type === selectedType)
    }

    // Status filter (when showAll is true)
    if (showAll && selectedStatus) {
      filtered = filtered.filter((hw) => {
        const status = getHomeworkStatus(hw)
        return status === selectedStatus
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'start_date':
          aValue = a.start_date
          bValue = b.start_date
          break
        case 'end_date':
          aValue = a.end_date
          bValue = b.end_date
          break
        case 'created_at':
          aValue = a.created_at
          bValue = b.created_at
          break
        case 'student':
          aValue = a.student?.nickname || ''
          bValue = b.student?.nickname || ''
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (sortBy === 'student' || sortBy === 'type') {
        // String comparison
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } else {
        // Date comparison
        if (sortOrder === 'asc') {
          return new Date(aValue) - new Date(bValue)
        } else {
          return new Date(bValue) - new Date(aValue)
        }
      }
    })

    setHomeworks(filtered)
  }, [
    allHomeworks,
    showAll,
    selectedStudent,
    selectedType,
    selectedStatus,
    sortBy,
    sortOrder,
  ])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              宿題一覧
            </h1>
            <div className="flex gap-3">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                ホームに戻る
              </Link>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">表示</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">全部表示</span>
              </label>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">生徒</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="">すべて</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nickname}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">種目</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="">すべて</option>
                <option value="mul">かけ算</option>
                <option value="div">わり算</option>
                <option value="mitori">{getTypeName('mitori')}</option>
              </select>
            </div>

            {showAll && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">状態</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
                >
                  <option value="">すべて</option>
                  <option value="not_started">未解答</option>
                  <option value="in_progress">解答中</option>
                  <option value="completed">完了</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ソート</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="created_at">作成日</option>
                <option value="start_date">開始日</option>
                <option value="end_date">終了日</option>
                <option value="student">生徒名</option>
                <option value="type">種目</option>
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">順序</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          {homeworks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-600 dark:text-slate-400 font-medium">宿題はまだありません。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => {
                return (
                  <HomeworkCard
                    key={homework.id}
                    homework={homework}
                    showStudentName={true}
                    showStatus={true}
                    showProgress={true}
                    showCreatedDate={true}
                    showCompletedBadge={true}
                    detailLink={`/teacher/homeworks/${homework.id}`}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

