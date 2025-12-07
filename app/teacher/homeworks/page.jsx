'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
        // Initial filter: show only incomplete (not completed)
        const filtered = formatted.filter((hw) => {
          const status = getCompletionStatus(hw)
          return status !== 'completed'
        })
        setHomeworks(filtered)
      }
    } catch (error) {
      console.error('Failed to load homeworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionStatus = (homework) => {
    const answerCount = homework.answerCount || 0
    const questionCount = homework.question_count || 0

    if (answerCount === 0) {
      return 'not_started'
    } else if (answerCount < questionCount) {
      return 'in_progress'
    } else {
      return 'completed'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'not_started':
        return '未解答'
      case 'in_progress':
        return '解答中'
      case 'completed':
        return '完了'
      default:
        return '不明'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started':
        return 'text-gray-600'
      case 'in_progress':
        return 'text-yellow-600'
      case 'completed':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allHomeworks]

    // Status filter (initial: show only incomplete)
    if (!showAll) {
      filtered = filtered.filter((hw) => {
        const status = getCompletionStatus(hw)
        return status !== 'completed'
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
        const status = getCompletionStatus(hw)
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">読み込み中...</p>
        </div>
      </div>
    )
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
                <option value="mitori">見取り算</option>
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
                const typeName =
                  homework.type === 'mul'
                    ? 'かけ算'
                    : homework.type === 'div'
                    ? 'わり算'
                    : '見取り算'
                const status = getCompletionStatus(homework)
                const statusText = getStatusText(status)
                const statusColor = getStatusColor(status)
                const answerCount = homework.answerCount || 0
                const questionCount = homework.question_count || 0

                const statusBgColor = 
                  status === 'completed' 
                    ? 'from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700'
                    : status === 'in_progress'
                    ? 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700'
                    : 'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600'

                return (
                  <div
                    key={homework.id}
                    className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200">
                            宿題 #{homework.id.slice(0, 8)}
                          </h3>
                          <span className={`px-3 py-1 bg-gradient-to-r ${statusBgColor} text-white rounded-lg text-xs font-bold shadow-sm`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold">{homework.student?.nickname}</span> - {typeName}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-500">
                            <span className="font-medium">期間:</span> {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
                            {new Date(homework.end_date).toLocaleDateString('ja-JP')}
                          </p>
                          {status === 'in_progress' && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-medium">進捗:</span> {answerCount} / {questionCount}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/teacher/homeworks/${homework.id}`}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
                      >
                        詳細を見る
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

