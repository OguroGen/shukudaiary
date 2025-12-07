'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NumericKeypad from '@/components/student/NumericKeypad'
import QuestionDisplay from '@/components/student/QuestionDisplay'

export default function HomeworkQuizPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id
  const schoolSlug = params.school_slug

  const [homework, setHomework] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    if (!token) {
      router.push(schoolSlug ? `/student/${schoolSlug}/login` : '/student/login')
      return
    }

    fetch(`/api/student/homework/${homeworkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push(schoolSlug ? `/student/${schoolSlug}/home` : '/student/home')
        } else {
          setHomework(data.homework)
          // Use questions from database
          if (data.homework.questions && Array.isArray(data.homework.questions)) {
            setQuestions(data.homework.questions)
          } else {
            // Fallback: if questions don't exist, redirect to home
            router.push(schoolSlug ? `/student/${schoolSlug}/home` : '/student/home')
          }
        }
      })
      .catch(() => {
        router.push(schoolSlug ? `/student/${schoolSlug}/home` : '/student/home')
      })
      .finally(() => setLoading(false))
  }, [homeworkId, router, schoolSlug])

  const handleNumberClick = (num) => {
    setCurrentAnswer((prev) => prev + num.toString())
  }

  const handleClear = () => {
    setCurrentAnswer('')
  }

  const handleSubmit = async () => {
    if (!currentAnswer || questions.length === 0) return

    const question = questions[currentIndex]
    const studentAnswer = parseInt(currentAnswer, 10)
    const correctAnswer = question.answer
    const isCorrect = studentAnswer === correctAnswer

    const newAnswers = [
      ...answers,
      { question, studentAnswer, isCorrect },
    ]
    setAnswers(newAnswers)

    // Save answer to database
    const studentId = localStorage.getItem('student_id')
    const token = localStorage.getItem('student_token')
    if (studentId && token) {
      try {
        const response = await fetch('/api/student/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            homework_id: homeworkId,
            student_id: studentId,
            question: question,
            correct_answer: correctAnswer,
            student_answer: studentAnswer,
            is_correct: isCorrect,
            question_index: currentIndex,
          }),
        })
        if (!response.ok) {
          console.error('Failed to save answer')
        }
      } catch (error) {
        console.error('Error saving answer:', error)
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer('')
    } else {
      // All questions answered, go to result
      router.push(schoolSlug ? `/student/${schoolSlug}/homework/${homeworkId}/result` : `/student/homework/${homeworkId}/result`)
    }
  }

  if (loading || !homework || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-base font-bold text-orange-500">読み込み中...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-yellow-50 p-2">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-3 mb-3 border-2 border-blue-300">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-sm font-bold text-blue-600">
              📝 宿題 #{homework.id.slice(0, 8)}
            </h1>
            <div className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-xl">
              問題 {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 border-2 border-green-300">
          <QuestionDisplay
            type={homework.type}
            question={currentQuestion}
            currentAnswer={currentAnswer}
          />

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onClear={handleClear}
            onSubmit={handleSubmit}
            submitDisabled={!currentAnswer}
          />
        </div>
      </div>
    </div>
  )
}

