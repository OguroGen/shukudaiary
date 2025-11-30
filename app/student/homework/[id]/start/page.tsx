'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Homework } from '@/types/homework'

export default function HomeworkStartPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id as string
  const [homework, setHomework] = useState<Homework | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    if (!token) {
      router.push('/student/login')
      return
    }

    fetch(`/api/student/homework/${homeworkId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push('/student/home')
        } else {
          setHomework(data.homework)
        }
      })
      .catch(() => {
        router.push('/student/home')
      })
      .finally(() => setLoading(false))
  }, [homeworkId, router])

  const handleStart = () => {
    router.push(`/student/homework/${homeworkId}/quiz`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Homework not found</div>
      </div>
    )
  }

  const typeName =
    homework.type === 'mul'
      ? 'Multiplication'
      : homework.type === 'div'
      ? 'Division'
      : 'Mitori'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">
          Shukudai #{homework.id.slice(0, 8)}
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <span className="font-semibold">Type:</span> {typeName}
          </div>
          <div>
            <span className="font-semibold">Questions:</span> {homework.question_count}
          </div>
          {homework.type !== 'mitori' && (
            <div>
              <span className="font-semibold">Digits:</span>{' '}
              {homework.left_digits}-digit × {homework.right_digits}-digit
            </div>
          )}
          {homework.type === 'mitori' && (
            <div>
              <span className="font-semibold">Rows:</span> {homework.rows}
            </div>
          )}
          <div>
            <span className="font-semibold">Available:</span>{' '}
            {new Date(homework.start_date).toLocaleDateString()} ~{' '}
            {new Date(homework.end_date).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleStart}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start now
          </button>
          <Link
            href="/student/home"
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

