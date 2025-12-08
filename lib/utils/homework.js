/**
 * 種目名を日本語で返す
 * @param {string} type - 種目タイプ（'mul', 'div', 'mitori'）
 * @returns {string} 種目名
 */
export function getTypeName(type) {
  const typeMap = {
    mul: 'かけ算',
    div: 'わり算',
    mitori: '見取算'
  }
  return typeMap[type] || type
}

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
 * 宿題の完了状態を判定
 * @param {number} answerCount - 回答数
 * @param {number} questionCount - 問題数
 * @returns {string} 'not_started', 'in_progress', 'completed'
 */
export function getCompletionStatus(answerCount, questionCount) {
  const answers = answerCount || 0
  const questions = questionCount || 0

  if (answers === 0) {
    return 'not_started'
  } else if (answers < questions) {
    return 'in_progress'
  } else {
    return 'completed'
  }
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
    default:
      return '不明'
  }
}

