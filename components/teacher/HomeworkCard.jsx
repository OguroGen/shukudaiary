'use client'

import Link from 'next/link'
import { getTypeName, getTypeColor, getStatusText, getCompletionStatus } from '@/lib/utils/homework'
import { formatParameters, getProblemType } from '@/lib/problem-types'

export default function HomeworkCard({
  homework,
  showStudentName = false,
  showStatus = false,
  showProgress = false,
  showCreatedDate = false,
  showCompletedBadge = false,
  detailLink,
  className = ''
}) {
  const typeName = getTypeName(homework.type)
  const typeColors = {
    mul: getTypeColor('mul'),
    div: getTypeColor('div'),
    mitori: getTypeColor('mitori')
  }

  // 状態の計算（showStatusがtrueの場合）
  let status = null
  let statusText = null
  let statusBgColor = null
  if (showStatus) {
    const answerCount = homework.answerCount || 0
    const questionCount = homework.question_count || 0
    status = getCompletionStatus(answerCount, questionCount)
    statusText = getStatusText(status)
    statusBgColor = 
      status === 'completed' 
        ? 'from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700'
        : status === 'in_progress'
        ? 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700'
        : 'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600'
  }

  // 完了状態の計算（showCompletedBadgeがtrueの場合）
  const answerCount = homework.answerCount || 0
  const questionCount = homework.question_count || 0
  const isCompleted = answerCount >= questionCount

  return (
    <div
      className={`bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all duration-200 ${showStatus ? 'hover:border-blue-300 dark:hover:border-blue-600' : ''} ${className}`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {showStatus ? (
              <>
                <span className={`px-3 py-1 bg-gradient-to-r ${statusBgColor} text-white rounded-lg text-xs font-bold shadow-sm`}>
                  {statusText}
                </span>
              </>
            ) : (
              <>
                <span className={`px-3 py-1 bg-gradient-to-r ${typeColors[homework.type]} text-white rounded-lg text-sm font-bold`}>
                  {typeName}
                </span>
                {showCompletedBadge && isCompleted && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs font-semibold">
                    完了
                  </span>
                )}
              </>
            )}
          </div>
          <div className="space-y-1">
            {showStudentName && homework.student?.nickname && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold">{homework.student.nickname}</span> - {typeName}
              </p>
            )}
            {/* 問題情報（桁数・行数） */}
            {(() => {
              const problemType = getProblemType(homework.type)
              if (!problemType) return null
              
              // わり算の場合: "÷1桁=2桁" の形式
              if (homework.type === 'div') {
                const divisorDigits = homework.parameter1
                const quotientDigits = homework.parameter2
                if (divisorDigits && quotientDigits) {
                  return (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">桁数:</span> ÷{divisorDigits}桁={quotientDigits}桁
                    </p>
                  )
                }
                return null
              }
              
              // 見取算の場合: "3桁4口" の形式
              if (homework.type === 'mitori') {
                const digits = homework.parameter1
                const rows = homework.parameter2
                if (digits && rows) {
                  return (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">桁数・行数:</span> {digits}桁{rows}口
                    </p>
                  )
                }
                return null
              }
              
              // かけ算の場合: "2桁 × 1桁" の形式
              if (homework.type === 'mul') {
                const leftDigits = homework.parameter1
                const rightDigits = homework.parameter2
                if (leftDigits && rightDigits) {
                  return (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">桁数:</span> {leftDigits}桁 × {rightDigits}桁
                    </p>
                  )
                }
                return null
              }
              
              return null
            })()}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {showStatus ? (
                <>
                  <span className="font-medium">期間:</span> {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~{' '}
                  {new Date(homework.end_date).toLocaleDateString('ja-JP')}
                </>
              ) : (
                <>
                  期間: {new Date(homework.start_date).toLocaleDateString('ja-JP')} ~ {new Date(homework.end_date).toLocaleDateString('ja-JP')}
                </>
              )}
            </p>
            {showProgress && status === 'in_progress' && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">進捗:</span> {answerCount} / {questionCount}
              </p>
            )}
            {showCreatedDate && (
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                作成日: {new Date(homework.created_at).toLocaleDateString('ja-JP')}
              </p>
            )}
          </div>
        </div>
        {detailLink && (
          <Link
            href={detailLink}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            詳細を見る
          </Link>
        )}
      </div>
    </div>
  )
}

