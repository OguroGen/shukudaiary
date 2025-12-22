'use client'

import Link from 'next/link'

/**
 * ページヘッダーコンポーネント
 * @param {object} props
 * @param {string} props.title - タイトル
 * @param {string} props.subtitle - サブタイトル（オプション）
 * @param {React.ReactNode} props.children - 右側に表示するコンテンツ
 * @param {string} props.backHref - 戻るボタンのリンク（オプション）
 * @param {string} props.backLabel - 戻るボタンのラベル（デフォルト: "ホームに戻る"）
 */
export default function PageHeader({ 
  title, 
  subtitle, 
  children, 
  backHref = '/teacher/home',
  backLabel = 'ホームに戻る'
}) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">{subtitle}</p>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          {backHref && (
            <Link
              href={backHref}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {backLabel}
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

