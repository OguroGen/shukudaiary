'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * 生徒一覧を取得するカスタムフック
 * @param {string} branchId - 教場のID
 * @param {object} options - オプション
 * @param {boolean} options.includeHomeworkStatus - 宿題ステータスを含めるか
 * @returns {{ students: array, loading: boolean, error: string | null, refetch: function }}
 */
export function useStudents(branchId, options = {}) {
  const { includeHomeworkStatus = false } = options
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStudents = async () => {
    if (!branchId) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })

      if (error) {
        setError('生徒データの取得に失敗しました')
        setLoading(false)
        return
      }

      let studentsData = data || []

      // 宿題ステータスを含める場合
      if (includeHomeworkStatus) {
        const today = new Date().toISOString().split('T')[0]
        studentsData = await Promise.all(
          studentsData.map(async (student) => {
            // アクティブな宿題をチェック
            const { data: activeHomeworks } = await supabase
              .from('homeworks')
              .select('id')
              .eq('student_id', student.id)
              .lte('start_date', today)
              .gt('end_date', today)
              .limit(1)

            const hasActiveHomework = (activeHomeworks && activeHomeworks.length > 0) || false

            // 終了した宿題をチェック（アクティブな宿題がない場合のみ）
            let hasFinishedHomework = false
            if (!hasActiveHomework) {
              const { data: finishedHomeworks } = await supabase
                .from('homeworks')
                .select('id')
                .eq('student_id', student.id)
                .lte('start_date', today)
                .eq('end_date', today)
                .limit(1)

              hasFinishedHomework = (finishedHomeworks && finishedHomeworks.length > 0) || false
            }

            return {
              ...student,
              hasActiveHomework,
              hasFinishedHomework
            }
          })
        )
      }

      setStudents(studentsData)
    } catch (err) {
      setError('データの読み込みに失敗しました')
      console.error('Failed to load students:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [branchId])

  return { students, loading, error, refetch: loadStudents }
}

