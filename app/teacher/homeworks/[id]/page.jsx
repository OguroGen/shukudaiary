'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function HomeworkDetailPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const homeworkId = params.id
  const from = searchParams.get('from') // 'student' or null
  const studentId = searchParams.get('student_id')

  const [homework, setHomework] = useState(null)
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingQuestions, setEditingQuestions] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadHomeworkData(supabase, homeworkId)
    })
  }, [homeworkId, router])

  const loadHomeworkData = async (supabase, id) => {
    try {
      // Get homework with student
      const { data: homeworkData } = await supabase
        .from('homeworks')
        .select('*, students(id, nickname)')
        .eq('id', id)
        .single()

      if (homeworkData) {
        setHomework(homeworkData)
        if (homeworkData.students) {
          setStudentName(homeworkData.students.nickname)
        }
        // Initialize editing questions
        if (homeworkData.questions) {
          setEditingQuestions([...homeworkData.questions])
        }
      }

      // Get answers
      const { data: answersData } = await supabase
        .from('answers')
        .select('*')
        .eq('homework_id', id)
        .order('question_index', { ascending: true })

      if (answersData) {
        setAnswers(answersData)
      }
    } catch (error) {
      console.error('Failed to load homework data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>宿題が見つかりません</div>
      </div>
    )
  }

  const typeName =
    homework.type === 'mul'
      ? 'かけ算'
      : homework.type === 'div'
      ? 'わり算'
      : '見取算'

  const correctCount = answers.filter((a) => a.is_correct).length

  const formatQuestion = (answer) => {
    const q = answer.question
    if (q.type === 'mul') {
      return `${q.left} × ${q.right}`
    } else if (q.type === 'div') {
      return `${q.dividend} ÷ ${q.divisor}`
    } else {
      return q.numbers?.join(' + ') || ''
    }
  }

  const formatQuestionFromObject = (question) => {
    if (question.type === 'mul') {
      return `${question.left} × ${question.right} = ${question.answer}`
    } else if (question.type === 'div') {
      return `${question.dividend} ÷ ${question.divisor} = ${question.answer}`
    } else {
      return `${question.numbers?.join(' + ')} = ${question.answer}`
    }
  }

  const handleQuestionEdit = (index, field, value) => {
    const updated = [...editingQuestions]
    if (updated[index]) {
      if (field === 'left' || field === 'right' || field === 'dividend' || field === 'divisor') {
        updated[index][field] = parseInt(value, 10) || 0
        // Recalculate answer
        if (homework.type === 'mul') {
          updated[index].answer = updated[index].left * updated[index].right
        } else if (homework.type === 'div') {
          updated[index].answer = Math.floor(updated[index].dividend / updated[index].divisor)
        }
      } else if (field.startsWith('numbers_')) {
        const numValue = parseInt(value, 10) || 0
        const numIndex = parseInt(field.split('_')[1], 10)
        if (updated[index].numbers && updated[index].numbers[numIndex] !== undefined) {
          updated[index].numbers[numIndex] = numValue
          updated[index].answer = updated[index].numbers.reduce((sum, num) => sum + num, 0)
        }
      }
      setEditingQuestions(updated)
    }
  }

  const handleSaveQuestions = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/teacher/homeworks/${homeworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: editingQuestions }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '問題の更新に失敗しました')
        return
      }

      setHomework({ ...homework, questions: editingQuestions })
      setIsEditing(false)
      alert('問題を更新しました')
    } catch (error) {
      alert('問題の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    let confirmMessage = ''
    if (answers.length > 0) {
      confirmMessage = `⚠️ 警告：この宿題には回答が${answers.length}件あります。\n\n削除すると以下が全て削除されます：\n- 宿題データ\n- ${answers.length}件の回答データ\n\nこの操作は取り消せません。本当に削除しますか？`
    } else {
      confirmMessage = 'この宿題を削除しますか？'
    }

    if (!confirm(confirmMessage)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/teacher/homeworks/${homeworkId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '宿題の削除に失敗しました')
        return
      }

      // 削除成功後、元のページに戻る
      if (from === 'student' && studentId) {
        router.push(`/teacher/students/${studentId}`)
      } else {
        router.push('/teacher/homeworks')
      }
    } catch (error) {
      alert('宿題の削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const canEdit = answers.length === 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-semibold">
                宿題 #{homework.id.slice(0, 8)} - {studentName}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                {from === 'student' && studentId ? (
                  <Link
                    href={`/teacher/students/${studentId}`}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    生徒詳細に戻る
                  </Link>
                ) : (
                  <Link
                    href="/teacher/homeworks"
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    宿題一覧に戻る
                  </Link>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
              {answers.length > 0 && (
                <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold">
                    ⚠️ 注意：この宿題には回答が{answers.length}件あります。削除すると回答も全て削除されます。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
          <div className="space-y-2 mb-4">
            <div>
              <span className="font-semibold">種目:</span> {typeName}
            </div>
            <div>
              <span className="font-semibold">問題数:</span> {homework.question_count}
            </div>
            {answers.length > 0 ? (
              <>
                <div>
                  <span className="font-semibold">スコア:</span> {correctCount} /{' '}
                  {answers.length}
                </div>
                <div>
                  <span className="font-semibold">解答日時:</span>{' '}
                  {new Date(answers[0].created_at).toLocaleString('ja-JP')}
                </div>
              </>
            ) : (
              <div className="text-gray-600">未解答</div>
            )}
          </div>
        </div>

        {homework.questions && homework.questions.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">問題一覧</h2>
              {canEdit && (
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      編集
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveQuestions}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuestions([...homework.questions])
                          setIsEditing(false)
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                      >
                        キャンセル
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {(isEditing ? editingQuestions : homework.questions).map(
                (question, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded p-3 bg-gray-50 dark:bg-zinc-800"
                  >
                    {isEditing && canEdit ? (
                      <>
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
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span>×</span>
                            <input
                              type="number"
                              value={question.right}
                              onChange={(e) =>
                                handleQuestionEdit(index, 'right', e.target.value)
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span>=</span>
                            <span className="font-semibold">{question.answer}</span>
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
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span>÷</span>
                            <input
                              type="number"
                              value={question.divisor}
                              onChange={(e) =>
                                handleQuestionEdit(index, 'divisor', e.target.value)
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span>=</span>
                            <span className="font-semibold">{question.answer}</span>
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
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  {numIndex < question.numbers.length - 1 && (
                                    <span>+</span>
                                  )}
                                </div>
                              ))}
                              <span>=</span>
                              <span className="font-semibold">{question.answer}</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm">
                        問題 {index + 1}: {formatQuestionFromObject(question)}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {answers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">回答一覧</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">問題</th>
                    <th className="text-left p-2">正答</th>
                    <th className="text-left p-2">生徒の答え</th>
                    <th className="text-left p-2">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map((answer) => (
                    <tr
                      key={answer.id}
                      className={
                        answer.is_correct
                          ? 'bg-green-50 dark:bg-green-900'
                          : 'bg-red-50 dark:bg-red-900'
                      }
                    >
                      <td className="p-2">{answer.question_index + 1}</td>
                      <td className="p-2">{formatQuestion(answer)}</td>
                      <td className="p-2">{answer.correct_answer}</td>
                      <td className="p-2">{answer.student_answer}</td>
                      <td className="p-2">
                        {answer.is_correct ? '✓' : '✗'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomeworkDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div>読み込み中...</div>
      </div>
    }>
      <HomeworkDetailPageContent />
    </Suspense>
  )
}

