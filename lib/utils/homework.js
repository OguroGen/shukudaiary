/**
 * 種目のグラデーションカラーを返す
 * @param {string} type - 種目タイプ（'mul', 'div', 'mitori'）
 * @returns {string} Tailwind CSSのグラデーションクラス
 */
export function getTypeColor(type) {
  const colorMap = {
    mul: 'from-blue-500 to-cyan-600',
    div: 'from-purple-500 to-pink-600',
    mitori: 'from-emerald-500 to-teal-600'
  }
  return colorMap[type] || 'from-slate-500 to-slate-600'
}

/**
 * 宿題の完了状態を取得（statusカラムから直接取得）
 * @param {string} status - 宿題の状態
 * @returns {string} 'not_started', 'in_progress', 'completed', 'cancelled'
 */
export function getCompletionStatus(status) {
  // statusが有効な値の場合はそのまま返す
  if (status === 'not_started' || status === 'in_progress' || status === 'completed' || status === 'cancelled') {
    return status
  }
  // フォールバック（既存データの互換性のため）
  return status || 'not_started'
}

/**
 * 完了状態のテキストを返す
 * @param {string} status - 完了状態
 * @returns {string} 状態テキスト
 */
export function getStatusText(status) {
  switch (status) {
    case 'not_started':
      return '未解答'
    case 'in_progress':
      return '解答中'
    case 'completed':
      return '完了'
    case 'cancelled':
      return '中止'
    default:
      return '不明'
  }
}

