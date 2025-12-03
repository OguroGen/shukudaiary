'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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

const PRACTICE_QUESTION_COUNT = 10

function PracticePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState([])
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

  const generateQuestions = (practiceType) => {
    let generated = []

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

  const handleNumberClick = (num) => {
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
      { question, studentAnswer, isCorrect: isCorrect },
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
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-orange-500">読み込み中...</div>
      </div>
    )
  }

  if (showResult) {
    const correctCount = answers.filter((a) => a.isCorrect === true).length
    const percentage = Math.round((correctCount / PRACTICE_QUESTION_COUNT) * 100)
    return (
      <div className="min-h-screen bg-yellow-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border-4 border-green-300">
          <h1 className="text-3xl font-bold mb-8 text-center text-green-600">
            🎉 練習の結果 🎉
          </h1>
          <div className="mb-8 p-8 bg-green-100 rounded-3xl border-4 border-green-400">
            <div className="text-5xl font-bold text-center text-green-700 mb-2">
              正解: {correctCount} / {PRACTICE_QUESTION_COUNT}
            </div>
            <div className="text-3xl font-bold text-center text-green-600">
              {percentage}% できました！
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentIndex(0)
                setCurrentAnswer('')
                setAnswers([])
                setShowResult(false)
                generateQuestions(type)
              }}
              className="flex-1 px-6 py-4 bg-green-400 text-white rounded-2xl hover:bg-green-500 font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              🔄 もう一度練習する
            </button>
            <Link
              href="/student/home"
              className="flex-1 px-6 py-4 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 text-center font-bold text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              🏠 ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const typeName =
    type === 'mul'
      ? '✖️ かけ算の練習'
      : type === 'div'
      ? '➗ わり算の練習'
      : '➕ 見取り算の練習'

  return (
    <div className="min-h-screen bg-yellow-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-blue-300">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-blue-600">{typeName}</h1>
            <div className="text-xl font-bold text-orange-500 bg-orange-100 px-4 py-2 rounded-2xl">
              問題 {currentIndex + 1} / {PRACTICE_QUESTION_COUNT}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-yellow-300">
          <QuestionDisplay
            type={type}
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

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-2xl font-bold text-orange-500">読み込み中...</div>
      </div>
    }>
      <PracticePageContent />
    </Suspense>
  )
}

