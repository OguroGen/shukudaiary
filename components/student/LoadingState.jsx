'use client'

/**
 * 生徒向けローディング状態コンポーネント
 */
export default function LoadingState({ message = '読み込み中...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-50">
      <div className="text-base font-bold text-orange-500">{message}</div>
    </div>
  )
}

