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
            <div className="flex gap-2">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                ホームに戻る
              </Link>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">表示</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="mr-2"
                />
                全部表示
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">生徒</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">すべて</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nickname}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">種目</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">すべて</option>
                <option value="mul">かけ算</option>
                <option value="div">わり算</option>
                <option value="mitori">見取り算</option>
              </select>
            </div>

            {showAll && (
              <div>
                <label className="block text-sm font-medium mb-1">状態</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
            <div>
              <label className="block text-sm font-medium mb-1">ソート</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="created_at">作成日</option>
                <option value="start_date">開始日</option>
                <option value="end_date">終了日</option>
                <option value="student">生徒名</option>
                <option value="type">種目</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">順序</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
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
                const status = getCompletionStatus(homework)
                const statusText = getStatusText(status)
                const statusColor = getStatusColor(status)
                const answerCount = homework.answerCount || 0
                const questionCount = homework.question_count || 0

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
                          <span className={statusColor}>
                            {statusText}
                          </span>
                          {status === 'in_progress' && (
                            <span className="text-gray-500 ml-2">
                              ({answerCount} / {questionCount})
                            </span>
                          )}
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

