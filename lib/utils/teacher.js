/**
 * 先生関連のユーティリティ関数
 */

/**
 * 生徒用URLを生成
 * @param {string} schoolSlug - 教室のスラッグ
 * @returns {string} 生徒用ログインURL
 */
export function getStudentLoginUrl(schoolSlug) {
  if (typeof window === 'undefined') return ''
  
  const origin = window.location.origin
  // teacherサブドメインの場合はstudentサブドメインに変換
  const studentBaseUrl = origin.replace('teacher.shukudaiary.anzan.online', 'shukudaiary.anzan.online')
  return `${studentBaseUrl}/student/${schoolSlug}/login`
}

/**
 * URLをクリップボードにコピー
 * @param {string} url - コピーするURL
 * @returns {Promise<boolean>} 成功したかどうか
 */
export async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch (err) {
    // フォールバック: テキストを選択してコピー
    try {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackErr) {
      console.error('Failed to copy to clipboard:', fallbackErr)
      return false
    }
  }
}

/**
 * 日付を日本語形式でフォーマット
 * @param {string} dateString - 日付文字列
 * @returns {string} フォーマットされた日付
 */
export function formatDateJapanese(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ja-JP', { 
    month: 'numeric', 
    day: 'numeric' 
  })
}

/**
 * 日時を日本語形式でフォーマット
 * @param {string} dateString - 日時文字列
 * @returns {string} フォーマットされた日時
 */
export function formatDateTimeJapanese(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

