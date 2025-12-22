'use client'

/**
 * エラーメッセージコンポーネント
 * @param {object} props
 * @param {string} props.message - エラーメッセージ
 * @param {string} props.className - 追加のクラス名
 */
export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null

  return (
    <div className={`flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl ${className}`}>
      <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-red-700 dark:text-red-300 text-sm font-medium">{message}</p>
    </div>
  )
}

