'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { validateHomeworkData } from '@/lib/validation/homework'

export default function HomeworkCreatePage() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [presets, setPresets] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [type, setType] = useState('mul')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [leftDigits, setLeftDigits] = useState(2)
  const [rightDigits, setRightDigits] = useState(1)
  const [rows, setRows] = useState(4)
  const [questionCount, setQuestionCount] = useState(20)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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

  const loadData = async (supabase, teacherId) => {
    try {
      // Get teacher's school_id
      const { data: teacher } = await supabase
        .from('teachers')
        .select('school_id')
        .eq('id', teacherId)
        .single()

      if (!teacher) return

      // Get students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', teacher.school_id)
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
      // Error handling
    }
  }

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId)
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setType(preset.type)
      setLeftDigits(preset.left_digits || 2)
      setRightDigits(preset.right_digits || 1)
      setRows(preset.rows || 4)
      setQuestionCount(preset.question_count)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    const homeworkData = {
      student_id: selectedStudent,
      type,
      left_digits: type !== 'mitori' ? leftDigits : null,
      right_digits: type !== 'mitori' ? rightDigits : null,
      rows: type === 'mitori' ? rows : null,
      question_count: questionCount,
      start_date: startDate,
      end_date: endDate,
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

      router.push('/teacher/homeworks')
    } catch (error) {
      setErrors({ general: '宿題の作成に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-6">宿題を作成</h1>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student" className="block text-sm font-medium mb-1">
              生徒
            </label>
            <select
              id="student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">生徒を選択</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nickname} ({student.login_id})
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="text-red-600 text-sm mt-1">{errors.student_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              種目
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="mul"
                  checked={type === 'mul'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                かけ算
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="div"
                  checked={type === 'div'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                わり算
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="mitori"
                  checked={type === 'mitori'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                見取り算
              </label>
            </div>
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {presets.length > 0 && (
            <div>
              <label
                htmlFor="preset"
                className="block text-sm font-medium mb-1"
              >
                プリセット（任意）
              </label>
              <select
                id="preset"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {type !== 'mitori' && (
            <>
              <div>
                <label
                  htmlFor="left_digits"
                  className="block text-sm font-medium mb-1"
                >
                  左側の桁数
                </label>
                <input
                  id="left_digits"
                  type="number"
                  min="1"
                  max="10"
                  value={leftDigits}
                  onChange={(e) => setLeftDigits(parseInt(e.target.value, 10))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.left_digits && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.left_digits}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="right_digits"
                  className="block text-sm font-medium mb-1"
                >
                  右側の桁数
                </label>
                <input
                  id="right_digits"
                  type="number"
                  min="1"
                  max="10"
                  value={rightDigits}
                  onChange={(e) =>
                    setRightDigits(parseInt(e.target.value, 10))
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.right_digits && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.right_digits}
                  </p>
                )}
              </div>
            </>
          )}

          {type === 'mitori' && (
            <div>
              <label htmlFor="rows" className="block text-sm font-medium mb-1">
                行数
              </label>
              <input
                id="rows"
                type="number"
                min="2"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value, 10))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.rows && (
                <p className="text-red-600 text-sm mt-1">{errors.rows}</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="question_count"
              className="block text-sm font-medium mb-1"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.question_count && (
              <p className="text-red-600 text-sm mt-1">
                {errors.question_count}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium mb-1"
            >
              開始日
            </label>
            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_date && (
              <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="block text-sm font-medium mb-1"
            >
              終了日
            </label>
            <input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.end_date && (
              <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '作成中...' : '作成'}
            </button>
            <Link
              href="/teacher/homeworks"
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

