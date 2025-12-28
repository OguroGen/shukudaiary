'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

/**
 * 生徒認証のカスタムフック
 * @returns {{ studentId: string | null, nickname: string | null, loading: boolean, isAuthenticated: boolean, logout: function, getToken: function }}
 */
export function useStudentAuth() {
  const router = useRouter()
  const params = useParams()
  const schoolSlug = params?.school_slug

  const [studentId, setStudentId] = useState(null)
  const [nickname, setNickname] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('student_token')
  }, [])

  const getStudentId = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('student_id')
  }, [])

  const getNickname = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('student_nickname')
  }, [])

  const verifyAuth = useCallback(async () => {
    const token = getToken()
    const storedStudentId = getStudentId()
    const storedNickname = getNickname()

    if (!token || !storedStudentId) {
      setStudentId(null)
      setNickname(null)
      setIsAuthenticated(false)
      setLoading(false)
      return false
    }

    try {
      const response = await fetch('/api/student/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (data.error || !data.student_id) {
        // トークンが無効な場合、localStorageをクリア
        localStorage.removeItem('student_token')
        localStorage.removeItem('student_id')
        localStorage.removeItem('student_nickname')
        setStudentId(null)
        setNickname(null)
        setIsAuthenticated(false)
        setLoading(false)
        return false
      }

      setStudentId(data.student_id)
      setNickname(data.nickname || storedNickname || '')
      setIsAuthenticated(true)
      setLoading(false)
      return true
    } catch (error) {
      console.error('Auth verification failed:', error)
      setStudentId(null)
      setNickname(null)
      setIsAuthenticated(false)
      setLoading(false)
      return false
    }
  }, [getToken, getStudentId, getNickname])

  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('student_token')
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_nickname')
    setStudentId(null)
    setNickname(null)
    setIsAuthenticated(false)

    const loginPath = schoolSlug ? `/student/${schoolSlug}/login` : '/student/login'
    router.push(loginPath)
  }, [router, schoolSlug])

  const requireAuth = useCallback((redirectTo = null) => {
    const token = getToken()
    const storedStudentId = getStudentId()

    if (!token || !storedStudentId) {
      const loginPath = redirectTo || (schoolSlug ? `/student/${schoolSlug}/login` : '/student/login')
      router.push(loginPath)
      return false
    }
    return true
  }, [getToken, getStudentId, router, schoolSlug])

  return {
    studentId,
    nickname,
    loading,
    isAuthenticated,
    logout,
    getToken,
    getStudentId,
    getNickname,
    verifyAuth,
    requireAuth,
  }
}

