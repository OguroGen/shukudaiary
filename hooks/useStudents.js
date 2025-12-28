'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDateInPeriod, getTodayString } from '@/lib/utils/date'

/**
 * 宿題のステータスを判定するヘルパー関数
 * @param {Array} homeworks - 宿題の配列
 * @param {string} today - 今日の日付（YYYY-MM-DD）
 * @returns {{ hasActiveHomework: boolean, hasFinishedHomework: boolean }}
 */
function calculateHomeworkStatus(homeworks, today) {
  if (!homeworks || homeworks.length === 0) {
    return {
      hasActiveHomework: false,
      hasFinishedHomework: false
    }
  }

  const hasActiveHomework = homeworks.some((hw) => {
    const startDate = hw.start_date || ''
    const endDate = hw.end_date || ''
    const status = hw.status || 'not_started'
    const isInPeriod = isDateInPeriod(today, startDate, endDate)
    return isInPeriod && status !== 'completed'
  })

  const hasFinishedHomework = homeworks.some((hw) => {
    if (!hw.completed_at) return false
    const completedDate = new Date(hw.completed_at).toISOString().split('T')[0]
    return completedDate === today
  })

  return {
    hasActiveHomework,
    hasFinishedHomework
  }
}

/**
 * 生徒一覧を取得するカスタムフック
 * @param {string} branchId - 教場のID
 * @param {object} options - オプション
 * @param {boolean} options.includeHomeworkStatus - 宿題ステータスを含めるか
 * @returns {{ students: Array, loading: boolean, error: string | null, refetch: function }}
 */
export function useStudents(branchId, options = {}) {
  const { includeHomeworkStatus = false } = options
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStudents = useCallback(async () => {
    if (!branchId) {
      setLoading(false)
      setStudents([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 生徒データを取得
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })

      if (studentsError) {
        throw new Error(`生徒データの取得に失敗しました: ${studentsError.message}`)
      }

      if (!studentsData || studentsData.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      // 宿題ステータスを含める場合
      if (includeHomeworkStatus) {
        const today = getTodayString()
        const studentIds = studentsData.map((student) => student.id)

        // すべての宿題を一度に取得（N+1問題を解決）
        const { data: allHomeworks, error: homeworksError } = await supabase
          .from('homeworks')
          .select('id, student_id, status, start_date, end_date, completed_at')
          .in('student_id', studentIds)

        if (homeworksError) {
          throw new Error(`宿題データの取得に失敗しました: ${homeworksError.message}`)
        }

        // 生徒IDごとに宿題をグループ化
        const homeworksByStudentId = new Map()
        if (allHomeworks) {
          allHomeworks.forEach((homework) => {
            const studentId = homework.student_id
            if (!homeworksByStudentId.has(studentId)) {
              homeworksByStudentId.set(studentId, [])
            }
            homeworksByStudentId.get(studentId).push(homework)
          })
        }

        // 各生徒に宿題ステータスを追加
        const studentsWithStatus = studentsData.map((student) => {
          const studentHomeworks = homeworksByStudentId.get(student.id) || []
          const status = calculateHomeworkStatus(studentHomeworks, today)

          return {
            ...student,
            ...status
          }
        })

        setStudents(studentsWithStatus)
      } else {
        setStudents(studentsData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの読み込みに失敗しました'
      setError(errorMessage)
      console.error('Failed to load students:', err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [branchId, includeHomeworkStatus])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  return { students, loading, error, refetch: loadStudents }
}

