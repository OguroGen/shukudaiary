'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
import { HomeworkType } from '@/types/homework'

type Question = MultiplicationQuestion | DivisionQuestion | MitoriQuestion

const PRACTICE_QUESTION_COUNT = 10

export default function PracticePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') as HomeworkType | null

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState<
    Array<{ question: Question; studentAnswer: number; isCorrect: boolean }>
  >([])
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('student_token')
    if (!token) {
      router.push('/student/login')
      return
    }

    if (!type || !['mul', 'div', 'mitori'].includes(type)) {
      router.push('/student/home')
      return
    }

    generateQuestions(type)
  }, [type, router])

  const generateQuestions = (practiceType: HomeworkType) => {
    let generated: Question[] = []

    if (practiceType === 'mul') {
      generated = generateMultiplicationQuestions(
        PRACTICE_QUESTION_COUNT,
        2,
        1
      )
    } else if (practiceType === 'div') {
      generated = generateDivisionQuestions(PRACTICE_QUESTION_COUNT, 2, 1)
    } else if (practiceType === 'mitori') {
      generated = generateMitoriQuestions(PRACTICE_QUESTION_COUNT, 3, 4)
    }

    setQuestions(generated)
    setLoading(false)
  }

  const handleNumberClick = (num: number) => {
    setCurrentAnswer((prev) => prev + num.toString())
  }

  const handleClear = () => {
    setCurrentAnswer('')
  }

  const handleSubmit = () => {
    if (!currentAnswer || questions.length === 0) return

    const question = questions[currentIndex]
    const studentAnswer = parseInt(currentAnswer, 10)
    const correctAnswer = question.answer
    const isCorrect = studentAnswer === correctAnswer

    const newAnswers = [
      ...answers,
      { question, studentAnswer, is_correct: isCorrect },
    ]
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer('')
    } else {
      // All questions answered, show result
      setShowResult(true)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  if (showResult) {
    const correctCount = answers.filter((a) => a.is_correct === true).length
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-semibold mb-6">練習の結果</h1>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-3xl font-semibold text-center">
              正解: {correctCount} / {PRACTICE_QUESTION_COUNT}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentIndex(0)
                setCurrentAnswer('')
                setAnswers([])
                setShowResult(false)
                generateQuestions(type!)
              }}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              もう一度練習する
            </button>
            <Link
              href="/student/home"
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const typeName =
    type === 'mul'
      ? 'かけ算の練習'
      : type === 'div'
      ? 'わり算の練習'
      : '見取り算の練習'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-semibold">{typeName}</h1>
            <div className="text-lg">
              問題 {currentIndex + 1} / {PRACTICE_QUESTION_COUNT}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <QuestionDisplay
            type={type!}
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

