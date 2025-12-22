'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * 先生の基本情報を取得するカスタムフック
 * @param {string} teacherId - 先生のID
 * @returns {{ teacher: object | null, school: object | null, loading: boolean, error: string | null }}
 */
export function useTeacherData(teacherId) {
  const [teacher, setTeacher] = useState(null)
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!teacherId) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('teachers')
          .select('id, school_id, email, schools(name, slug, plan_type)')
          .eq('id', teacherId)
          .single()

        if (error || !data) {
          setError('先生情報の取得に失敗しました')
          setLoading(false)
          return
        }

        setTeacher(data)
        if (data.schools && typeof data.schools === 'object') {
          setSchool(data.schools)
        }
      } catch (err) {
        setError('データの読み込みに失敗しました')
        console.error('Failed to load teacher data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [teacherId])

  return { teacher, school, loading, error }
}

