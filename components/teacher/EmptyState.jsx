'use client'

/**
 * 空の状態を表示するコンポーネント
 * @param {object} props
 * @param {string} props.message - メッセージ
 * @param {React.ReactNode} props.icon - アイコン（SVG要素）
 */
export default function EmptyState({ message, icon }) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <p className="text-slate-600 dark:text-slate-400 font-medium">{message}</p>
    </div>
  )
}

