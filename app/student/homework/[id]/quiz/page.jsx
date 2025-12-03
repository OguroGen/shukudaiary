'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NumericKeypad from '@/components/student/NumericKeypad'
import QuestionDisplay from '@/components/student/QuestionDisplay'
import {
  generateMultiplicationQuestions,
} from '@/lib/problems/multiplication'
import {
  generateDivisionQuestions,
} from '@/lib/problems/division'
import {
  generateMitoriQuestions,
} from '@/lib/problems/mitori'

export default function HomeworkQuizPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id

  const [homework, setHomework] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState([])
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
          generateQuestions(data.homework)
        }
      })
      .catch(() => {
        router.push('/student/home')
      })
      .finally(() => setLoading(false))
  }, [homeworkId, router])

  const generateQuestions = (hw) => {
    let generated = []

    if (hw.type === 'mul' && hw.left_digits && hw.right_digits) {
      generated = generateMultiplicationQuestions(
        hw.question_count,
        hw.left_digits,
        hw.right_digits
      )
    } else if (hw.type === 'div' && hw.left_digits && hw.right_digits) {
      generated = generateDivisionQuestions(
        hw.question_count,
        hw.left_digits,
        hw.right_digits
      )
    } else if (hw.type === 'mitori' && hw.rows) {
      const digitsPerRow = hw.left_digits || 3
      generated = generateMitoriQuestions(
        hw.question_count,
        digitsPerRow,
        hw.rows
      )
    }

    setQuestions(generated)
  }

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
    if (studentId) {
      await fetch('/api/student/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer('')
    } else {
      // All questions answered, go to result
      router.push(`/student/homework/${homeworkId}/result`)
    }
  }

  if (loading || !homework || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-orange-500">読み込み中...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-blue-300">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-blue-600">
              📝 宿題 #{homework.id.slice(0, 8)}
            </h1>
            <div className="text-xl font-bold text-orange-500 bg-orange-100 px-4 py-2 rounded-2xl">
              問題 {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-yellow-300">
          <QuestionDisplay
            type={homework.type}
            question={currentQuestion}
            currentAnswer={currentAnswer}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-green-300">
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

