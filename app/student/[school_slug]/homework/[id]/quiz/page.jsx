'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useStudentAuth } from '@/hooks/useStudentAuth'
import { getStudentUrl } from '@/lib/utils/student'
import NumericKeypad from '@/components/student/NumericKeypad'
import QuestionDisplay from '@/components/student/QuestionDisplay'
import LoadingState from '@/components/student/LoadingState'

export default function HomeworkQuizPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id
  const schoolSlug = params.school_slug
  const { loading: authLoading, isAuthenticated, getToken, getStudentId, requireAuth } = useStudentAuth()

  const [homework, setHomework] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [homeworkStartTime, setHomeworkStartTime] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      requireAuth()
      return
    }

    if (authLoading) return

    const token = getToken()
    if (!token) {
      requireAuth()
      return
    }

    const loadHomework = async () => {
      try {
        const res = await fetch(`/api/student/homework/${homeworkId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        const data = await res.json()

        if (data.error) {
          router.push(getStudentUrl(schoolSlug, 'home'))
          return
        }

        // Check if homework is cancelled
        if (data.homework.status === 'cancelled') {
          router.push(getStudentUrl(schoolSlug, 'home'))
          return
        }

        setHomework(data.homework)
        // Use questions from database
        if (data.homework.questions && Array.isArray(data.homework.questions)) {
          setQuestions(data.homework.questions)
          
          // Record homework start time
          const startRes = await fetch(`/api/student/homework/${homeworkId}/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          if (startRes.ok) {
            setHomeworkStartTime(Date.now())
            setQuestionStartTime(Date.now())
          }
        } else {
          // Fallback: if questions don't exist, redirect to home
          router.push(getStudentUrl(schoolSlug, 'home'))
        }
      } catch (error) {
        router.push(getStudentUrl(schoolSlug, 'home'))
      } finally {
        setLoading(false)
      }
    }

    loadHomework()
  }, [homeworkId, router, schoolSlug, authLoading, isAuthenticated, getToken, requireAuth])

  // Record question start time when question changes
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      setQuestionStartTime(Date.now())
      setIsSubmitting(false) // 次の問題に進んだらsubmitを再有効化
    }
  }, [currentIndex, questions.length])

  const handleNumberClick = (num) => {
    setCurrentAnswer((prev) => prev + num.toString())
  }

  const handleClear = () => {
    setCurrentAnswer('')
  }

  const handleCancel = async () => {
    if (!confirm('宿題をやめますか？')) {
      return
    }

    const token = getToken()
    if (!token) {
      router.push(getStudentUrl(schoolSlug, 'home'))
      return
    }

    try {
      const res = await fetch(`/api/student/homework/${homeworkId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        router.push(getStudentUrl(schoolSlug, 'home'))
      } else {
        // エラーが発生してもホームに戻る
        router.push(getStudentUrl(schoolSlug, 'home'))
      }
    } catch (error) {
      console.error('Error cancelling homework:', error)
      // エラーが発生してもホームに戻る
      router.push(getStudentUrl(schoolSlug, 'home'))
    }
  }

  const handleSubmit = async () => {
    if (!currentAnswer || questions.length === 0 || isSubmitting) return

    // すぐにsubmitボタンを無効化して連打を防止
    setIsSubmitting(true)

    const question = questions[currentIndex]
    const studentAnswer = parseInt(currentAnswer, 10)
    const correctAnswer = question.answer
    const isCorrect = studentAnswer === correctAnswer

    // Calculate time spent on this question (in milliseconds)
    const timeSpent = questionStartTime ? 
      Date.now() - questionStartTime : null

    const newAnswers = [
      ...answers,
      { question, studentAnswer, isCorrect },
    ]
    setAnswers(newAnswers)

    // 保存処理をバックグラウンドで実行（awaitしない）
    const studentId = getStudentId()
    const token = getToken()
    if (studentId && token) {
      fetch('/api/student/answer', {
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
          time_spent_milliseconds: timeSpent,
        }),
      }).catch(error => {
        console.error('Error saving answer:', error)
      })
    }

    // すぐに次の問題に移動
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer('')
      // isSubmittingはuseEffectでcurrentIndex変更時にリセットされる
    } else {
      // 全問題完了時、完了処理もバックグラウンドで実行してすぐに結果ページへ
      if (token) {
        fetch(`/api/student/homework/${homeworkId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(error => {
          console.error('Error recording completion time:', error)
        })
      }
      // すぐに結果ページへ遷移
      router.push(getStudentUrl(schoolSlug, `homework/${homeworkId}/result`))
    }
  }

  if (authLoading || loading || !homework || questions.length === 0) {
    return <LoadingState />
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-yellow-50 p-2 relative">
      <div className="max-w-2xl mx-auto pb-20">
        <div className="bg-white rounded-xl shadow-lg p-3 mb-3 border-2 border-blue-300">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-sm font-bold text-blue-600">
              📝 宿題
            </h1>
            <div className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-xl">
              問題 {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 border-2 border-green-300 mb-6">
          <QuestionDisplay
            type={homework.type}
            question={currentQuestion}
            currentAnswer={currentAnswer}
          />

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onClear={handleClear}
            onSubmit={handleSubmit}
            submitDisabled={!currentAnswer || isSubmitting}
          />
        </div>
      </div>

      {/* やめるボタンを左下に固定配置 */}
      <div className="fixed bottom-4 left-4">
        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl border-2 border-gray-300 transition-colors shadow-md"
        >
          やめる
        </button>
      </div>
    </div>
  )
}

