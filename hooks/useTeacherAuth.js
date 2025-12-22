'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * 先生の認証状態を管理するカスタムフック
 * @returns {{ session: object | null, loading: boolean, teacherId: string | null }}
 */
export function useTeacherAuth() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teacherId, setTeacherId] = useState(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      setSession(session)
      setTeacherId(session.user.id)
      setLoading(false)
    })
  }, [router])

  return { session, loading, teacherId }
}

