'use client'

/**
 * ローディング状態を表示するコンポーネント
 * @param {object} props
 * @param {string} props.message - ローディングメッセージ（デフォルト: "読み込み中..."）
 */
export default function LoadingState({ message = '読み込み中...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">{message}</p>
      </div>
    </div>
  )
}

