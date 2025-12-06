/**
 * 先生向けバリデーション関数
 */

export function validateSchoolName(schoolName) {
  if (!schoolName || schoolName.trim().length === 0) {
    return '教室名は必須です'
  }
  if (schoolName.length > 100) {
    return '教室名は100文字以内で入力してください'
  }
  return null
}

export function validateTeacherEmail(email) {
  if (!email || email.trim().length === 0) {
    return 'メールアドレスは必須です'
  }
  // 基本的なメールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '正しいメールアドレス形式で入力してください'
  }
  if (email.length > 255) {
    return 'メールアドレスは255文字以内で入力してください'
  }
  return null
}

export function validateTeacherPassword(password) {
  if (!password || password.length === 0) {
    return 'パスワードは必須です'
  }
  // Supabase Authのデフォルトルール: 6文字以上
  if (password.length < 6) {
    return 'パスワードは6文字以上で入力してください'
  }
  if (password.length > 100) {
    return 'パスワードは100文字以内で入力してください'
  }
  return null
}

export function validateTeacherSignupData(data) {
  const errors = {}

  if (data.school_name !== undefined) {
    const schoolNameError = validateSchoolName(data.school_name)
    if (schoolNameError) errors.school_name = schoolNameError
  }

  if (data.email !== undefined) {
    const emailError = validateTeacherEmail(data.email)
    if (emailError) errors.email = emailError
  }

  if (data.password !== undefined) {
    const passwordError = validateTeacherPassword(data.password)
    if (passwordError) errors.password = passwordError
  }

  return errors
}

