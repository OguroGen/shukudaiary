'use client'

/**
 * 成功メッセージコンポーネント
 * @param {object} props
 * @param {string} props.message - 成功メッセージ
 * @param {string} props.className - 追加のクラス名
 */
export default function SuccessMessage({ message, className = '' }) {
  if (!message) return null

  return (
    <div className={`flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl ${className}`}>
      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">{message}</p>
    </div>
  )
}

