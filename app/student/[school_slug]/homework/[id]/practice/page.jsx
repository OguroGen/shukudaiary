'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useStudentAuth } from '@/hooks/useStudentAuth'
import { getStudentUrl } from '@/lib/utils/student'
import { formatNumber } from '@/lib/utils/format'
import NumericKeypad from '@/components/student/NumericKeypad'
import QuestionDisplay from '@/components/student/QuestionDisplay'
import LoadingState from '@/components/student/LoadingState'

export default function HomeworkPracticePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
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
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswerResult, setLastAnswerResult] = useState(null)
  const isRetryMode = searchParams.get('retry') === 'true'
  const retryAttempt = parseInt(searchParams.get('attempt') || '0', 10)

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
        
        // 繰り返しモードの場合、最初の回答（retry_attempt = 0）の間違った問題のみを取得
        if (isRetryMode && retryAttempt > 0) {
          const studentId = getStudentId()
          const answersRes = await fetch(`/api/student/homework/${homeworkId}/answers?student_id=${studentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          const answersData = await answersRes.json()
          
          if (answersData.answers) {
            // 最初の回答（retry_attempt = 0）の間違った問題を取得
            const wrongAnswers = answersData.answers.filter(
              a => !a.is_correct && a.retry_attempt === 0
            )
            if (wrongAnswers.length > 0) {
              // 重複を除去（同じ問題を複数回間違えた場合）
              const uniqueQuestions = []
              const seenQuestionKeys = new Set()
              wrongAnswers.forEach(a => {
                const questionKey = JSON.stringify(a.question)
                if (!seenQuestionKeys.has(questionKey)) {
                  seenQuestionKeys.add(questionKey)
                  uniqueQuestions.push(a.question)
                }
              })
              setQuestions(uniqueQuestions)
            } else {
              // 繰り返す問題がない場合は結果ページへ
              router.push(getStudentUrl(schoolSlug, `homework/${homeworkId}/result`))
              return
            }
          } else {
            router.push(getStudentUrl(schoolSlug, 'home'))
            return
          }
        } else {
          // Use questions from database
          if (data.homework.questions && Array.isArray(data.homework.questions)) {
            setQuestions(data.homework.questions)
          } else {
            // Fallback: if questions don't exist, redirect to home
            router.push(getStudentUrl(schoolSlug, 'home'))
            return
          }
        }
        
        // Record homework start time (繰り返しモードの場合は記録しない)
        if (!isRetryMode) {
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
          setQuestionStartTime(Date.now())
        }
      } catch (error) {
        router.push(getStudentUrl(schoolSlug, 'home'))
      } finally {
        setLoading(false)
      }
    }

    loadHomework()
  }, [homeworkId, router, schoolSlug, authLoading, isAuthenticated, getToken, getStudentId, requireAuth, isRetryMode, retryAttempt])

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

  const saveAnswer = async (question, studentAnswer, correctAnswer, isCorrect, questionIndex, timeSpent, retryAttemptValue) => {
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
          question_index: questionIndex,
          time_spent_milliseconds: timeSpent,
          retry_attempt: retryAttemptValue,
        }),
      }).catch(error => {
        console.error('Error saving answer:', error)
      })
    }
  }

  const moveToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer('')
    } else {
      // 全問題完了時
      const token = getToken()
      if (!isRetryMode && token) {
        // 通常モードの場合のみ完了処理を実行
        fetch(`/api/student/homework/${homeworkId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(error => {
          console.error('Error recording completion time:', error)
        })
      }
      // 結果ページへ遷移
      router.push(getStudentUrl(schoolSlug, `homework/${homeworkId}/result`))
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

    // フィードバックモードが'immediate'の場合、正誤を表示
    if (homework.feedback_mode === 'immediate') {
      setLastAnswerResult({ isCorrect, correctAnswer, studentAnswer })
      setShowFeedback(true)
      
      // 回答を保存
      await saveAnswer(question, studentAnswer, correctAnswer, isCorrect, currentIndex, timeSpent, isRetryMode ? retryAttempt : 0)
      
      // 2秒後に次の問題へ
      setTimeout(() => {
        setShowFeedback(false)
        setLastAnswerResult(null)
        moveToNextQuestion()
      }, 2000)
      return
    }

    // 'all_at_once'の場合は従来通り
    // 回答を保存
    await saveAnswer(question, studentAnswer, correctAnswer, isCorrect, currentIndex, timeSpent, isRetryMode ? retryAttempt : 0)

    // すぐに次の問題に移動
    moveToNextQuestion()
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
              {isRetryMode ? '🔄 間違った問題を再度解く' : '📝 宿題'}
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
            submitDisabled={!currentAnswer || isSubmitting || showFeedback}
          />
        </div>
      </div>

      {/* フィードバック表示 */}
      {showFeedback && lastAnswerResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 shadow-2xl">
            {lastAnswerResult.isCorrect ? (
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-3xl font-bold text-green-600 mb-2">正解！</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <div className="text-3xl font-bold text-red-600 mb-2">不正解</div>
                <div className="mt-4 text-lg text-gray-700">
                  <div>正答: <span className="font-bold text-green-600">{formatNumber(lastAnswerResult.correctAnswer)}</span></div>
                  <div className="mt-2">あなたの答え: <span className="font-bold text-red-600">{formatNumber(lastAnswerResult.studentAnswer)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* やめるボタンを左下に固定配置 */}
      {!showFeedback && (
        <div className="fixed bottom-4 left-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl border-2 border-gray-300 transition-colors shadow-md"
          >
            やめる
          </button>
        </div>
      )}
    </div>
  )
}


