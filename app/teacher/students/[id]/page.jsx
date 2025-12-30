'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTodayString, isDateInPeriod } from '@/lib/utils/date'
import { getTypeName } from '@/lib/problem-types'
import { getTypeColor, getCompletionStatus } from '@/lib/utils/homework'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import HomeworkCard from '@/components/teacher/HomeworkCard'

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id

  const [student, setStudent] = useState(null)
  const [homeworks, setHomeworks] = useState([])
  const [todayHomeworks, setTodayHomeworks] = useState([])
  const [historyHomeworks, setHistoryHomeworks] = useState([])
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [stats, setStats] = useState(null)
  const [weaknessAnalysis, setWeaknessAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null) // null = 全て表示

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/teacher/login')
        return
      }

      loadStudentData(supabase, studentId)
    })
  }, [studentId, router])

  const loadStudentData = async (supabase, id) => {
    try {
      // Get student
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (studentData) {
        setStudent(studentData)
      }

      // Get homeworks
      const { data: homeworksData } = await supabase
        .from('homeworks')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false })

      if (homeworksData) {
        setHomeworks(homeworksData)
        
        // Get correct counts for all homeworks
        const homeworkIds = homeworksData.map((hw) => hw.id)
        const correctCountMap = new Map()
        
        if (homeworkIds.length > 0) {
          const { data: correctAnswers } = await supabase
            .from('answers')
            .select('homework_id')
            .in('homework_id', homeworkIds)
            .eq('is_correct', true)
          
          if (correctAnswers) {
            correctAnswers.forEach((answer) => {
              if (answer?.homework_id) {
                const count = correctCountMap.get(answer.homework_id) || 0
                correctCountMap.set(answer.homework_id, count + 1)
              }
            })
          }
        }
        
        // Use answer_count column directly (updated by database trigger)
        const homeworksWithAnswerCount = homeworksData.map((hw) => ({
          ...hw,
          answerCount: hw.answer_count || 0,
          correctCount: correctCountMap.get(hw.id) || 0
        }))

        // Separate into today's homeworks and history
        const today = getTodayString()
        const todayHw = []
        const historyHw = []

        homeworksWithAnswerCount.forEach((hw) => {
          const startDate = hw.due_date_start || ''
          const endDate = hw.due_date_end || ''
          const status = hw.status || 'not_started'
          
          const isInPeriod = isDateInPeriod(today, startDate, endDate)
          const isCompleted = status === 'completed'
          
          if (isInPeriod && !isCompleted) {
            // 今日の宿題：期限が今日を含んでまだ終了していないもの
            todayHw.push(hw)
          } else {
            // 宿題履歴：期限が過ぎているものと終了しているもの
            historyHw.push(hw)
          }
        })

        setTodayHomeworks(todayHw)
        setHistoryHomeworks(historyHw)
      }

      // Get all answers for statistics
      const { data: allAnswers } = await supabase
        .from('answers')
        .select('*, homeworks(type)')
        .eq('student_id', id)
        .order('created_at', { ascending: false })

      // Calculate statistics
      if (allAnswers && allAnswers.length > 0) {
        const totalAnswers = allAnswers.length
        const correctAnswers = allAnswers.filter(a => a.is_correct).length
        const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers * 100).toFixed(1) : 0

        // Get homework types for answers
        const homeworkIds = [...new Set(allAnswers.map(a => a.homework_id).filter(Boolean))]
        const { data: homeworkTypes } = await supabase
          .from('homeworks')
          .select('id, type')
          .in('id', homeworkIds)

        const homeworkTypeMap = new Map()
        if (homeworkTypes) {
          homeworkTypes.forEach(hw => {
            homeworkTypeMap.set(hw.id, hw.type)
          })
        }

        // Statistics by type
        const typeStats = {
          mul: { total: 0, correct: 0 },
          div: { total: 0, correct: 0 },
          mitori: { total: 0, correct: 0 }
        }

        allAnswers.forEach(answer => {
          const hwType = answer.homework_id ? homeworkTypeMap.get(answer.homework_id) : null
          if (hwType && typeStats[hwType]) {
            typeStats[hwType].total++
            if (answer.is_correct) {
              typeStats[hwType].correct++
            }
          }
        })

        const typeAccuracies = {
          mul: typeStats.mul.total > 0 ? (typeStats.mul.correct / typeStats.mul.total * 100).toFixed(1) : 0,
          div: typeStats.div.total > 0 ? (typeStats.div.correct / typeStats.div.total * 100).toFixed(1) : 0,
          mitori: typeStats.mitori.total > 0 ? (typeStats.mitori.correct / typeStats.mitori.total * 100).toFixed(1) : 0
        }

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentAnswers = allAnswers.filter(a => new Date(a.created_at) >= sevenDaysAgo)
        const recentCorrect = recentAnswers.filter(a => a.is_correct).length
        const recentAccuracy = recentAnswers.length > 0 ? (recentCorrect / recentAnswers.length * 100).toFixed(1) : 0

        setStats({
          totalAnswers,
          correctAnswers,
          accuracy: parseFloat(accuracy),
          typeAccuracies,
          typeStats,
          recentAnswers: recentAnswers.length,
          recentAccuracy: parseFloat(recentAccuracy),
          totalHomeworks: homeworksData?.length || 0
        })

        // Weakness analysis
        const wrongAnswersByType = {
          mul: [],
          div: [],
          mitori: []
        }

        allAnswers.filter(a => !a.is_correct).forEach(answer => {
          const hwType = answer.homework_id ? homeworkTypeMap.get(answer.homework_id) : null
          if (hwType && wrongAnswersByType[hwType]) {
            wrongAnswersByType[hwType].push(answer)
          }
        })

        // Find most common wrong patterns
        const wrongPatterns = {}
        allAnswers.filter(a => !a.is_correct).forEach(answer => {
          const q = answer.question
          let pattern = ''
          if (q.type === 'mul') {
            pattern = `${q.left}×${q.right}`
          } else if (q.type === 'div') {
            pattern = `${q.dividend}÷${q.divisor}`
          } else if (q.type === 'mitori') {
            pattern = q.numbers?.join('+') || ''
          }
          if (pattern) {
            wrongPatterns[pattern] = (wrongPatterns[pattern] || 0) + 1
          }
        })

        const topWeaknesses = Object.entries(wrongPatterns)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([pattern, count]) => ({ pattern, count }))

        setWeaknessAnalysis({
          wrongByType: wrongAnswersByType,
          topWeaknesses
        })
      } else {
        setStats({
          totalAnswers: 0,
          correctAnswers: 0,
          accuracy: 0,
          typeAccuracies: { mul: 0, div: 0, mitori: 0 },
          typeStats: { mul: { total: 0, correct: 0 }, div: { total: 0, correct: 0 }, mitori: { total: 0, correct: 0 } },
          recentAnswers: 0,
          recentAccuracy: 0,
          totalHomeworks: homeworksData?.length || 0
        })
      }

      // Get recent wrong answers
      const { data: wrongAnswersData } = await supabase
        .from('answers')
        .select('*')
        .eq('student_id', id)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (wrongAnswersData) {
        setWrongAnswers(wrongAnswersData)
      }
    } catch (error) {
      console.error('Failed to load student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('パスワードをリセットしますか？')) return

    setResettingPassword(true)
    try {
      const response = await fetch('/api/teacher/students/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`新しいパスワード: ${data.new_password}`)
      } else {
        alert(data.error || 'パスワードリセットに失敗しました')
      }
    } catch (error) {
      alert('パスワードリセットに失敗しました')
    } finally {
      setResettingPassword(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-slate-600 dark:text-slate-400 font-medium">生徒が見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              生徒カルテ
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {student.nickname.charAt(0)}
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {student.nickname}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1 font-mono text-sm">ID: {student.login_id}</p>
                {student.last_activity && (
                  <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                    最終活動: {new Date(student.last_activity).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/teacher/home"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                ホーム
              </Link>
              <Link
                href="/teacher/students"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                生徒一覧
              </Link>
              <Link
                href={`/teacher/homeworks/create?student_id=${studentId}&from=student`}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                宿題を作成
              </Link>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {resettingPassword ? 'リセット中...' : 'パスワードリセット'}
              </button>
            </div>
          </div>
        </div>

        {/* 宿題履歴 */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              宿題履歴
            </h2>
            {/* 種目フィルターボタン */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTypeFilter(null)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                  selectedTypeFilter === null
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                全て
              </button>
              {[
                { type: 'mul', name: getTypeName('mul'), color: getTypeColor('mul') },
                { type: 'div', name: getTypeName('div'), color: getTypeColor('div') },
                { type: 'mitori', name: getTypeName('mitori'), color: getTypeColor('mitori') }
              ].map(({ type, name, color }) => (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                    selectedTypeFilter === type
                      ? `bg-gradient-to-r ${color} text-white`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          {(() => {
            const filteredHomeworks = selectedTypeFilter
              ? historyHomeworks.filter((hw) => hw.type === selectedTypeFilter)
              : historyHomeworks

            if (filteredHomeworks.length === 0) {
              return (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {selectedTypeFilter
                      ? `${getTypeName(selectedTypeFilter)}の宿題履歴はまだありません。`
                      : '宿題履歴はまだありません。'}
                  </p>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {filteredHomeworks.map((homework) => {
                  return (
                    <HomeworkCard
                      key={homework.id}
                      homework={homework}
                      showType={true}
                      showStatus={true}
                      showCreatedDate={false}
                      detailLink={`/teacher/homeworks/${homework.id}?from=student&student_id=${student.id}`}
                    />
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* 統計サマリー */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl shadow-xl p-6 border border-blue-400/20 dark:border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/90">総正答率</h3>
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-4xl font-bold text-white">{stats.accuracy}%</p>
              <p className="text-white/70 text-sm mt-2">{stats.correctAnswers} / {stats.totalAnswers} 問正解</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl shadow-xl p-6 border border-emerald-400/20 dark:border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/90">総回答数</h3>
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalAnswers}</p>
              <p className="text-white/70 text-sm mt-2">問題に回答</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-2xl shadow-xl p-6 border border-purple-400/20 dark:border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/90">宿題数</h3>
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-4xl font-bold text-white">{stats.totalHomeworks}</p>
              <p className="text-white/70 text-sm mt-2">宿題を作成</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-2xl shadow-xl p-6 border border-amber-400/20 dark:border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/90">直近7日間</h3>
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-4xl font-bold text-white">{stats.recentAccuracy}%</p>
              <p className="text-white/70 text-sm mt-2">{stats.recentAnswers} 問回答</p>
            </div>
          </div>
        )}

        {/* 種目別成績 */}
        {stats && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              種目別成績
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'mul', name: getTypeName('mul'), color: getTypeColor('mul') },
                { type: 'div', name: getTypeName('div'), color: getTypeColor('div') },
                { type: 'mitori', name: getTypeName('mitori'), color: getTypeColor('mitori') }
              ].map(({ type, name, color }) => {
                const accuracy = parseFloat(stats.typeAccuracies[type] || 0)
                const typeStat = stats.typeStats[type]
                const total = typeStat?.total || 0
                const correct = typeStat?.correct || 0
                return (
                  <div key={type} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">{name}</h3>
                      <span className={`px-3 py-1 bg-gradient-to-r ${color} text-white rounded-lg text-sm font-bold`}>
                        {accuracy}%
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                          style={{ width: `${Math.min(accuracy, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {correct} / {total} 問正解
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 弱点分析 */}
        {weaknessAnalysis && weaknessAnalysis.topWeaknesses.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              弱点分析
            </h2>
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">よく間違える問題</h3>
              <div className="space-y-2">
                {weaknessAnalysis.topWeaknesses.map((weakness, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <span className="font-mono text-slate-800 dark:text-slate-200">{weakness.pattern}</span>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-semibold">
                      {weakness.count}回
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 今日の宿題 */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            今日の宿題
          </h2>
          {todayHomeworks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-600 dark:text-slate-400 font-medium">今日の宿題はありません。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayHomeworks.map((homework) => {
                return (
                  <HomeworkCard
                    key={homework.id}
                    homework={homework}
                    showType={true}
                    showStatus={false}
                    showCreatedDate={false}
                    detailLink={`/teacher/homeworks/${homework.id}?from=student&student_id=${student.id}`}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* 直近の誤答 */}
        {wrongAnswers.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              直近の誤答
            </h2>
            <div className="space-y-3">
              {wrongAnswers.map((answer, idx) => {
                const q = answer.question
                let questionText = ''
                if (q.type === 'mul') {
                  questionText = `${q.left} × ${q.right}`
                } else if (q.type === 'div') {
                  questionText = `${q.dividend} ÷ ${q.divisor}`
                } else {
                  questionText = q.numbers?.join(' + ') || ''
                }
                const answerDateTime = answer.created_at
                  ? new Date(answer.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : ''
                return (
                  <div
                    key={answer.id || idx}
                    className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {answerDateTime && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{answerDateTime}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-lg font-bold text-slate-800 dark:text-slate-200">{questionText}</span>
                          <span className="text-slate-500 dark:text-slate-400">=</span>
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded font-mono font-semibold">
                            {answer.student_answer}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded font-mono font-semibold">
                            {answer.correct_answer}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

