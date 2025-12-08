/**
 * 今日の日付をYYYY-MM-DD形式の文字列で返す
 * @returns {string} 今日の日付（YYYY-MM-DD）
 */
export function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

/**
 * 日付文字列が期間内かどうかを判定
 * @param {string} date - チェックする日付（YYYY-MM-DD）
 * @param {string} startDate - 開始日（YYYY-MM-DD）
 * @param {string} endDate - 終了日（YYYY-MM-DD）
 * @returns {boolean} 期間内の場合true
 */
export function isDateInPeriod(date, startDate, endDate) {
  return startDate <= date && date <= endDate
}

