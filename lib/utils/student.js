/**
 * 生徒向けURLを生成するヘルパー関数
 * @param {string} schoolSlug - 学校のスラッグ
 * @param {string} path - パス（例: 'home', 'homework/123/start'）
 * @returns {string} 完全なURL
 */
export function getStudentUrl(schoolSlug, path = '') {
  if (!schoolSlug) {
    return path ? `/student/${path}` : '/student'
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return cleanPath ? `/student/${schoolSlug}/${cleanPath}` : `/student/${schoolSlug}`
}

/**
 * 宿題の型名を絵文字付きで取得（生徒向け表示用）
 * @param {string} type - 宿題の型（'mul', 'div', 'mitori'）
 * @returns {string} 絵文字付きの型名
 */
export function getHomeworkTypeDisplayName(type) {
  const typeMap = {
    mul: '✖️ かけ算',
    div: '➗ わり算',
    mitori: '➕ 見取算'
  }
  return typeMap[type] || type
}

