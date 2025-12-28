/**
 * 数値を3桁ごとにコンマで区切ってフォーマット
 * @param {number | string | null | undefined} num - フォーマットする数値
 * @returns {string} フォーマットされた文字列
 */
export function formatNumber(num) {
  if (num == null || num === '') return ''
  return Number(num).toLocaleString('ja-JP')
}

/**
 * 日付を日本語形式でフォーマット
 * @param {string | Date} date - フォーマットする日付
 * @param {object} options - Intl.DateTimeFormat のオプション
 * @returns {string} フォーマットされた日付文字列
 */
export function formatDate(date, options = {}) {
  if (!date) return ''
  const defaultOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...options
  }
  return new Date(date).toLocaleDateString('ja-JP', defaultOptions)
}

/**
 * 宿題の問題をフォーマット（生徒向け表示用）
 * @param {object} question - 問題オブジェクト
 * @returns {string} フォーマットされた問題文字列
 */
export function formatQuestion(question) {
  if (!question) return ''

  if (question.type === 'mul') {
    return `${formatNumber(question.left)} × ${formatNumber(question.right)}`
  } else if (question.type === 'div') {
    return `${formatNumber(question.dividend)} ÷ ${formatNumber(question.divisor)}`
  } else if (question.type === 'mitori') {
    return question.numbers?.map(num => formatNumber(num)).join(' + ') || ''
  }

  return ''
}

