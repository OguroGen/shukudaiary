'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTypeName } from '@/lib/utils/homework'
import { validateHomeworkData } from '@/lib/validation/homework'
import {
  generateMultiplicationQuestions,
} from '@/lib/problems/multiplication'
import {
  generateDivisionQuestions,
} from '@/lib/problems/division'
import {
  generateMitoriQuestions,
} from '@/lib/problems/mitori'
import { getProblemType, getDefaultParameters, getParameters } from '@/lib/problem-types'

function HomeworkCreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [students, setStudents] = useState([])
  const [presets, setPresets] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [type, setType] = useState('mul')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [parameters, setParameters] = useState(getDefaultParameters('mul'))
  
  // 種目が変わった時にパラメーターをリセット
  useEffect(() => {
    if (!selectedPreset) {
      setParameters(getDefaultParameters(type))
    }
  }, [type, selectedPreset])
  const [questionCount, setQuestionCount] = useState(5)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  // Initialize dates to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(today)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadData(supabase, session.user.id)
    })
  }, [router])

  // URLパラメータからstudent_idを取得して自動選択
  useEffect(() => {
    const studentIdFromUrl = searchParams.get('student_id')
    if (studentIdFromUrl && students.length > 0) {
      // 生徒が存在するか確認
      const studentExists = students.some((s) => s.id === studentIdFromUrl)
      if (studentExists) {
        setSelectedStudent(studentIdFromUrl)
      }
    }
  }, [searchParams, students])

  const loadData = async (supabase, teacherId) => {
    try {
      // Get teacher's school_id from teachers table
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (!teacher) return

      // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
      const { data: teacherBranch } = await supabase
        .from('teacher_branches')
        .select('branch_id')
        .eq('teacher_id', teacherId)
        .limit(1)
        .single()

      if (!teacherBranch) return

      // Get students in teacher's branch
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('branch_id', teacherBranch.branch_id)
        .order('nickname')

      if (studentsData) {
        setStudents(studentsData)
      }

      // Get presets
      const { data: presetsData } = await supabase
        .from('presets')
        .select('*')
        .eq('school_id', teacher.school_id)
        .order('name')

      if (presetsData) {
        setPresets(presetsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId)
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setType(preset.type)
      setParameters(getParameters(preset) || getDefaultParameters(preset.type))
      setQuestionCount(preset.question_count)
    }
  }

  const generatePreviewQuestions = () => {
    let generated = []
    if (type === 'mul') {
      generated = generateMultiplicationQuestions(questionCount, parameters)
    } else if (type === 'div') {
      generated = generateDivisionQuestions(questionCount, parameters)
    } else if (type === 'mitori') {
      generated = generateMitoriQuestions(questionCount, parameters)
    }
    setPreviewQuestions(generated)
    setShowPreview(true)
  }

  const handleQuestionEdit = (index, field, value) => {
    const updated = [...previewQuestions]
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
        // For mitori, update numbers array
        const numValue = parseInt(value, 10) || 0
        const numIndex = parseInt(field.split('_')[1], 10)
        if (updated[index].numbers && updated[index].numbers[numIndex] !== undefined) {
          updated[index].numbers[numIndex] = numValue
          updated[index].answer = updated[index].numbers.reduce((sum, num) => sum + num, 0)
        }
      }
      setPreviewQuestions(updated)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    const homeworkData = {
      student_id: selectedStudent,
      type,
      parameter1: parameters.parameter1,
      parameter2: parameters.parameter2,
      parameter3: parameters.parameter3,
      parameter4: parameters.parameter4,
      parameter5: parameters.parameter5,
      parameter6: parameters.parameter6,
      parameter7: parameters.parameter7,
      parameter8: parameters.parameter8,
      parameter9: parameters.parameter9,
      parameter10: parameters.parameter10,
      question_count: questionCount,
      start_date: startDate,
      end_date: endDate,
      message: message.trim() || null,
    }

    const validationErrors = validateHomeworkData(homeworkData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/teacher/homeworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeworkData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || '宿題の作成に失敗しました' })
        return
      }

      // If preview questions exist, update them
      if (previewQuestions.length > 0 && data.homework) {
        try {
          const updateResponse = await fetch(`/api/teacher/homeworks/${data.homework.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: previewQuestions }),
          })
          if (!updateResponse.ok) {
            console.error('Failed to update preview questions')
          }
        } catch (updateError) {
          console.error('Error updating preview questions:', updateError)
        }
      }

      // 元のページに戻る
      const from = searchParams.get('from')
      const studentIdFromUrl = searchParams.get('student_id')
      
      if (from === 'students') {
        // 生徒一覧から来た場合
        router.push('/teacher/students')
      } else if (from === 'student' && studentIdFromUrl) {
        // 生徒詳細から来た場合
        router.push(`/teacher/students/${studentIdFromUrl}`)
      } else {
        // その他の場合（宿題一覧からなど）
        router.push('/teacher/homeworks')
      }
    } catch (error) {
      setErrors({ general: '宿題の作成に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const getCancelHref = () => {
    const from = searchParams.get('from')
    const studentId = searchParams.get('student_id')
    if (from === 'students') {
      return '/teacher/students'
    } else if (from === 'student' && studentId) {
      return `/teacher/students/${studentId}`
    } else {
      return '/teacher/homeworks'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              宿題を作成
            </h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                ホームに戻る
              </Link>
              <Link
                href={getCancelHref()}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                キャンセル
              </Link>
            </div>
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
            <label htmlFor="student" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              生徒
            </label>
            <select
              id="student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="">生徒を選択</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nickname} ({student.login_id})
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.student_id}</p>
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
                <span className="text-slate-700 dark:text-slate-300">{getTypeName('mitori')}</span>
              </label>
            </div>
            {errors.type && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {presets.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <label
                htmlFor="preset"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                プリセット（任意）
              </label>
              <select
                id="preset"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="">なし（手動入力）</option>
                {presets
                  .filter((p) => p.type === type)
                  .map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {(() => {
            const problemType = getProblemType(type)
            if (!problemType) return null
            
            return Object.entries(problemType.parameters).map(([key, config]) => (
              <div key={key} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <label
                  htmlFor={key}
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  {config.label}
                </label>
                <input
                  id={key}
                  type="number"
                  min={config.min}
                  max={config.max}
                  value={parameters[key] ?? config.default}
                  onChange={(e) => setParameters({
                    ...parameters,
                    [key]: parseInt(e.target.value, 10) || null
                  })}
                  required={config.required}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
                />
                {errors[key] && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))
          })()}

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <label
              htmlFor="question_count"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              問題数
            </label>
              <input
                id="question_count"
                type="number"
                min="1"
                max="100"
                value={questionCount}
              onChange={(e) =>
                setQuestionCount(parseInt(e.target.value, 10))
              }
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
            />
            {errors.question_count && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.question_count}
              </p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <label
              htmlFor="start_date"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              開始日
            </label>
            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
            />
            {errors.start_date && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.start_date}</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <label
              htmlFor="end_date"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              終了日
            </label>
            <input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
            />
            {errors.end_date && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.end_date}</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <label
              htmlFor="message"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              メッセージ（任意）
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="指示や励ましの言葉などを入力してください"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-slate-700 dark:text-slate-300"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message.length}/500文字
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={generatePreviewQuestions}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              問題をプレビュー
            </button>
          </div>

          {showPreview && previewQuestions.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">問題プレビュー</h2>
                <button
                  type="button"
                  onClick={() => {
                    generatePreviewQuestions()
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm"
                >
                  再生成
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {previewQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">問題 {index + 1}:</span>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {question.numbers?.map((num, numIndex) => (
                            <div key={numIndex} className="flex items-center gap-1">
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
                                className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
                              />
                              {numIndex < question.numbers.length - 1 && (
                                <span className="text-slate-700 dark:text-slate-300">+</span>
                              )}
                            </div>
                          ))}
                          <span className="text-slate-700 dark:text-slate-300">=</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{question.answer}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {loading ? '作成中...' : '作成'}
            </button>
            <Link
              href={getCancelHref()}
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

export default function HomeworkCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    }>
      <HomeworkCreatePageContent />
    </Suspense>
  )
}

