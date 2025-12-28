'use client'

/**
 * 生徒向けエラーメッセージコンポーネント
 */
export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null

  return (
    <div className={`text-red-700 text-xs bg-red-100 p-2 rounded-xl border-2 border-red-300 font-semibold ${className}`}>
      {message}
    </div>
  )
}

