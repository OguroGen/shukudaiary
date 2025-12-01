'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NumericKeypad from '@/components/student/NumericKeypad'
import QuestionDisplay from '@/components/student/QuestionDisplay'
import {
  generateMultiplicationQuestions,
  MultiplicationQuestion,
} from '@/lib/problems/multiplication'
import {
  generateDivisionQuestions,
  DivisionQuestion,
} from '@/lib/problems/division'
import {
  generateMitoriQuestions,
  MitoriQuestion,
} from '@/lib/problems/mitori'
import { Homework, HomeworkType } from '@/types/homework'

type Question = MultiplicationQuestion | DivisionQuestion | MitoriQuestion

export default function HomeworkQuizPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id as string

  const [homework, setHomework] = useState<Homework | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState<
    Array<{ question: Question; studentAnswer: number; isCorrect: boolean }>
  >([])
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

  const generateQuestions = (hw: Homework) => {
    let generated: Question[] = []

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

  const handleNumberClick = (num: number) => {
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
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-semibold">
              宿題 #{homework.id.slice(0, 8)}
            </h1>
            <div className="text-lg">
              問題 {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <QuestionDisplay
            type={homework.type}
            question={currentQuestion}
            currentAnswer={currentAnswer}
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onClear={handleClear}
            onSubmit={handleSubmit}
            disabled={!currentAnswer}
          />
        </div>
      </div>
    </div>
  )
}

