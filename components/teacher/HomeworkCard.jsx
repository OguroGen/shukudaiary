'use client'

import Link from 'next/link'
import { getTypeName, getTypeColor, getStatusText, getCompletionStatus } from '@/lib/utils/homework'

// ステータスの背景色を取得
function getStatusBgColor(status) {
  const colorMap = {
    completed: 'from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700',
    in_progress: 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700',
    not_started: 'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600'
  }
  return colorMap[status] || colorMap.not_started
}

// 問題情報をフォーマット
function formatProblemInfo(type, param1, param2) {
  if (!param1 || !param2) return null

  switch (type) {
    case 'div':
      return `（÷${param1}桁=${param2}桁）`
    case 'mitori':
      return `（${param1}桁${param2}口）`
    case 'mul':
      return `（${param1}桁 × ${param2}桁）`
    default:
      return null
  }
}

// サブコンポーネント
function StudentName({ name }) {
  return (
    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
      {name}
    </span>
  )
}

function TypeBadge({ typeName, color }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 bg-gradient-to-r ${color} text-white rounded text-xs font-medium`}>
      {typeName}
    </span>
  )
}

function ProblemInfo({ info }) {
  return (
    <span className="text-sm text-slate-600 dark:text-slate-300">
      {info}
    </span>
  )
}

function Period({ startDate, endDate, formatDate }) {
  return (
    <span className="text-sm text-slate-600 dark:text-slate-400">
      {formatDate(startDate)} ~ {formatDate(endDate)}
    </span>
  )
}

function StatusBadge({ text, color }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 bg-gradient-to-r ${color} text-white rounded text-xs font-medium`}>
      {text}
    </span>
  )
}

function CreatedDate({ date, formatDate }) {
  return (
    <span className="text-xs text-slate-500 dark:text-slate-500">
      {formatDate(date)}
    </span>
  )
}

function ScoreInfo({ correctCount, questionCount }) {
  if (questionCount === 0) return null
  
  const accuracy = questionCount > 0 ? ((correctCount / questionCount) * 100).toFixed(1) : 0
  
  return (
    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
      {correctCount}問正解／{questionCount}問中（正答率{accuracy}％）
    </span>
  )
}

function DetailButton({ href }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 text-sm font-medium whitespace-nowrap"
    >
      詳細を見る
    </Link>
  )
}

export default function HomeworkCard({
  homework,
  showStudentName = false,
  showType = true,
  showStatus = false,
  showCreatedDate = false,
  detailLink,
  className = ''
}) {
  // 基本情報
  const typeName = getTypeName(homework.type)
  const typeColor = getTypeColor(homework.type)

  // 状態の取得（statusカラムから直接取得）
  const homeworkStatus = homework.status || 'not_started'
  const status = getCompletionStatus(homeworkStatus)
  const statusText = getStatusText(status)
  const statusBgColor = getStatusBgColor(status)
  const correctCount = homework.correctCount || 0
  const questionCount = homework.question_count || 0

  // 問題情報のフォーマット
  const problemInfo = formatProblemInfo(homework.type, homework.parameter1, homework.parameter2)

  // 日付フォーマット
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  return (
    <div
      className={`bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 ${className}`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
            {showStudentName && homework.student?.nickname && (
              <StudentName name={homework.student.nickname} />
            )}
            {showType && <TypeBadge typeName={typeName} color={typeColor} />}
            {problemInfo && <ProblemInfo info={problemInfo} />}
            <Period startDate={homework.start_date} endDate={homework.end_date} formatDate={formatDate} />
            {showStatus && <StatusBadge text={statusText} color={statusBgColor} />}
            {questionCount > 0 && <ScoreInfo correctCount={correctCount} questionCount={questionCount} />}
            {showCreatedDate && <CreatedDate date={homework.created_at} formatDate={formatDate} />}
          </div>
        </div>
        {detailLink && <DetailButton href={detailLink} />}
      </div>
    </div>
  )
}
