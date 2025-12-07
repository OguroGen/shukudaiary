'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function StudentLayout({ children }) {
  const params = useParams()
  const [schoolName, setSchoolName] = useState('')

  useEffect(() => {
    const schoolSlug = params?.school_slug
    if (!schoolSlug) return

    fetch(`/api/schools/${schoolSlug}`)
      .then(res => {
        if (!res.ok) {
          console.error('Failed to fetch school:', res.status, res.statusText)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data && data.name) {
          setSchoolName(data.name)
        }
      })
      .catch((error) => {
        console.error('Error fetching school name:', error)
      })
  }, [params])

  return (
    <div>
      {schoolName && (
        <div className="bg-blue-100 p-2 text-center text-sm font-bold border-b-2 border-blue-300">
          🏫 {schoolName}
        </div>
      )}
      {children}
    </div>
  )
}

