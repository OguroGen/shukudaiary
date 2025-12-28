'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * 生徒の宿題一覧を取得するカスタムフック
 * @param {string} studentId - 生徒のID
 * @param {string} token - 認証トークン
 * @returns {{ homeworks: Array, loading: boolean, error: string | null, refetch: function }}
 */
export function useStudentHomeworks(studentId, token) {
  const [homeworks, setHomeworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  const loadHomeworks = useCallback(async () => {
    if (!studentId || !token) {
      setLoading(false)
      setHomeworks([])
      return
    }

    try {
      const response = await fetch(`/api/student/homeworks?student_id=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('宿題の取得に失敗しました')
      }

      const data = await response.json()
      setHomeworks(data.homeworks || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '宿題の読み込みに失敗しました')
      console.error('Failed to load homeworks:', err)
      setHomeworks([])
    } finally {
      setLoading(false)
    }
  }, [studentId, token])

  useEffect(() => {
    loadHomeworks()

    // Set up Supabase Realtime subscription
    if (studentId) {
      const supabase = createClient()
      const channel = supabase
        .channel(`homeworks:student:${studentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'homeworks',
            filter: `student_id=eq.${studentId}`,
          },
          () => {
            loadHomeworks()
          }
        )
        .subscribe()

      channelRef.current = channel

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
      }
    }
  }, [studentId, loadHomeworks])

  return { homeworks, loading, error, refetch: loadHomeworks }
}

