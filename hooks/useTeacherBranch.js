'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * 先生の教場情報を取得するカスタムフック
 * @param {string} teacherId - 先生のID
 * @returns {{ branchId: string | null, loading: boolean, error: string | null }}
 */
export function useTeacherBranch(teacherId) {
  const [branchId, setBranchId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!teacherId) {
      setLoading(false)
      return
    }

    const loadBranch = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('teacher_branches')
          .select('branch_id')
          .eq('teacher_id', teacherId)
          .limit(1)
          .single()

        if (error || !data) {
          setError('教場情報の取得に失敗しました')
          setLoading(false)
          return
        }

        setBranchId(data.branch_id)
      } catch (err) {
        setError('データの読み込みに失敗しました')
        console.error('Failed to load branch data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBranch()
  }, [teacherId])

  return { branchId, loading, error }
}

