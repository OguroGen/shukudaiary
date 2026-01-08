'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function FixedQuestionEditPage() {
  const router = useRouter()
  const params = useParams()
  const fixedQuestionId = params.id
  const isNew = fixedQuestionId === 'new'

  const [name, setName] = useState('')
  const [type, setType] = useState('mul')
  const [questions, setQuestions] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!isNew)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      if (!isNew) {
        loadFixedQuestion(supabase, fixedQuestionId)
      } else {
        setLoadingData(false)
        // 初期問題を1つ追加
        addQuestion()
      }
    })
  }, [fixedQuestionId, isNew, router])

  const loadFixedQuestion = async (supabase, id) => {
    try {
      const response = await fetch(`/api/teacher/fixedquestions/${id}`)
      const data = await response.json()

      if (data.fixed_question) {
        setName(data.fixed_question.name)
        setType(data.fixed_question.type)
        setQuestions(data.fixed_question.questions || [])
      }
    } catch (error) {
      console.error('Failed to load fixed question:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const addQuestion = () => {
    let newQuestion
    if (type === 'mul') {
      newQuestion = { type: 'mul', left: 1, right: 1, answer: 1 }
    } else if (type === 'div') {
      newQuestion = { type: 'div', dividend: 1, divisor: 1, answer: 1 }
    } else if (type === 'mitori') {
      newQuestion = { type: 'mitori', numbers: [1, 1], answer: 2 }
    } else {
      return
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated)
  }

  const handleQuestionEdit = (index, field, value) => {
    const updated = [...questions]
    if (updated[index]) {
      if (field === 'left' || field === 'right' || field === 'dividend' || field === 'divisor') {
        updated[index][field] = parseInt(value, 10) || 0
        // Recalculate answer
        if (type === 'mul') {
          updated[index].answer = updated[index].left * updated[index].right
        } else if (type === 'div') {
          updated[index].answer = Math.floor(updated[index].dividend / updated[index].divisor)
        }
      } else if (field.startsWith('numbers_')) {
        // For mitori, update numbers array (負の数も許容)
        const numValue = value === '' ? 0 : parseInt(value, 10) || 0
        const numIndex = parseInt(field.split('_')[1], 10)
        if (updated[index].numbers && updated[index].numbers[numIndex] !== undefined) {
          updated[index].numbers[numIndex] = numValue
          updated[index].answer = updated[index].numbers.reduce((sum, num) => sum + num, 0)
        }
      }
      setQuestions(updated)
    }
  }

  const addMitoriTerm = (questionIndex) => {
    const updated = [...questions]
    if (updated[questionIndex] && updated[questionIndex].type === 'mitori') {
      if (!updated[questionIndex].numbers) {
        updated[questionIndex].numbers = []
      }
      updated[questionIndex].numbers.push(1)
      updated[questionIndex].answer = updated[questionIndex].numbers.reduce((sum, num) => sum + num, 0)
      setQuestions(updated)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (!name.trim()) {
      setErrors({ name: '名前を入力してください' })
      return
    }

    if (questions.length === 0) {
      setErrors({ questions: '問題を1つ以上追加してください' })
      return
    }

    setLoading(true)

    try {
      const url = isNew
        ? '/api/teacher/fixedquestions'
        : `/api/teacher/fixedquestions/${fixedQuestionId}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          questions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || '保存に失敗しました' })
        return
      }

      router.push('/teacher/fixedquestions')
    } catch (error) {
      setErrors({ general: '保存に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  // 種目が変わった時に問題をクリア
  useEffect(() => {
    if (questions.length > 0) {
      setQuestions([])
      // 新しい種目の問題を1つ追加
      let newQuestion
      if (type === 'mul') {
        newQuestion = { type: 'mul', left: 1, right: 1, answer: 1 }
      } else if (type === 'div') {
        newQuestion = { type: 'div', dividend: 1, divisor: 1, answer: 1 }
      } else if (type === 'mitori') {
        newQuestion = { type: 'mitori', numbers: [1, 1], answer: 2 }
      }
      if (newQuestion) {
        setQuestions([newQuestion])
      }
    }
  }, [type])

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isNew ? '固定問題を新規作成' : '固定問題を編集'}
            </h1>
            <Link
              href="/teacher/fixedquestions"
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              一覧に戻る
            </Link>
          </div>
        </div>

        {/* フォーム */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                固定問題名
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              />
              {errors.name && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label htmlFor="type" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                種目
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="mul"
                    checked={type === 'mul'}
                    onChange={(e) => setType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300">かけ算</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="div"
                    checked={type === 'div'}
                    onChange={(e) => setType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300">わり算</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="mitori"
                    checked={type === 'mitori'}
                    onChange={(e) => setType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300">見取算</span>
                </label>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">問題一覧</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm"
                >
                  問題を追加
                </button>
              </div>
              {errors.questions && (
                <p className="text-red-600 dark:text-red-400 text-sm mb-2">{errors.questions}</p>
              )}
              <div className={type === 'mitori' ? "flex flex-wrap gap-3 max-h-96 overflow-y-auto" : "space-y-3 max-h-96 overflow-y-auto"}>
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className={`border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 ${type === 'mitori' ? 'w-auto min-w-fit p-2' : 'p-3'}`}
                  >
                    <div className={`flex items-center justify-between ${type === 'mitori' ? 'mb-1' : 'mb-2'}`}>
                      <span className={`font-semibold ${type === 'mitori' ? 'text-xs' : 'text-sm'}`}>問題 {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className={`${type === 'mitori' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} bg-red-500 text-white rounded hover:bg-red-600`}
                      >
                        削除
                      </button>
                    </div>
                    {question.type === 'mul' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={question.left}
                          onChange={(e) =>
                            handleQuestionEdit(index, 'left', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                        />
                        <span className="text-slate-700 dark:text-slate-300">×</span>
                        <input
                          type="number"
                          value={question.right}
                          onChange={(e) =>
                            handleQuestionEdit(index, 'right', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                        />
                        <span className="text-slate-700 dark:text-slate-300">=</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{question.answer}</span>
                      </div>
                    )}
                    {question.type === 'div' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={question.dividend}
                          onChange={(e) =>
                            handleQuestionEdit(index, 'dividend', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                        />
                        <span className="text-slate-700 dark:text-slate-300">÷</span>
                        <input
                          type="number"
                          value={question.divisor}
                          onChange={(e) =>
                            handleQuestionEdit(index, 'divisor', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                        />
                        <span className="text-slate-700 dark:text-slate-300">=</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{question.answer}</span>
                      </div>
                    )}
                    {question.type === 'mitori' && (
                      <div className="space-y-2">
                        <div className="flex items-end gap-1">
                          <div className="flex flex-col items-end gap-1">
                            {question.numbers?.map((num, numIndex) => (
                              <div key={numIndex} className="flex items-center gap-1">
                                {num < 0 && (
                                  <span className="text-slate-700 dark:text-slate-300 text-sm w-4 text-center">-</span>
                                )}
                                {num >= 0 && (
                                  <span className="text-slate-700 dark:text-slate-300 text-sm w-4 text-center"> </span>
                                )}
                                <input
                                  type="number"
                                  value={num}
                                  onChange={(e) =>
                                    handleQuestionEdit(
                                      index,
                                      `numbers_${numIndex}`,
                                      e.target.value
                                    )
                                  }
                                  className="w-16 px-1.5 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm text-right"
                                />
                              </div>
                            ))}
                            <div className="border-t border-slate-400 dark:border-slate-500 my-1" style={{ width: 'calc(1rem + 4rem)' }}></div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-700 dark:text-slate-300 text-sm w-4 text-center"> </span>
                              <div className="w-16 px-1.5 py-1 text-right font-semibold text-slate-800 dark:text-slate-200 text-sm border border-transparent">
                                {question.answer}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {question.numbers?.map((num, numIndex) => (
                              <div key={numIndex} className="h-8"></div>
                            ))}
                            <div className="h-6"></div>
                            <button
                              type="button"
                              onClick={() => addMitoriTerm(index)}
                              className="px-2 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded whitespace-nowrap"
                            >
                              口の追加
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <Link
                href="/teacher/fixedquestions"
                className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

