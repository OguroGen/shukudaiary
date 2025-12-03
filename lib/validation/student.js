export function validateLoginId(loginId) {
  if (!loginId || loginId.trim().length === 0) {
    return 'ログインIDは必須です'
  }
  if (loginId.length > 50) {
    return 'ログインIDは50文字以内で入力してください'
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(loginId)) {
    return 'ログインIDは英数字、アンダースコア、ハイフンのみ使用できます'
  }
  return null
}

export function validateNickname(nickname) {
  if (!nickname || nickname.trim().length === 0) {
    return 'ニックネームは必須です'
  }
  if (nickname.length > 50) {
    return 'ニックネームは50文字以内で入力してください'
  }
  return null
}

export function validatePassword(password) {
  if (!password || password.length === 0) {
    return 'パスワードは必須です'
  }
  if (password.length < 4) {
    return 'パスワードは4文字以上で入力してください'
  }
  if (password.length > 100) {
    return 'パスワードは100文字以内で入力してください'
  }
  return null
}

export function validateStudentData(data) {
  const errors = {}

  const loginIdError = validateLoginId(data.login_id)
  if (loginIdError) errors.login_id = loginIdError

  const nicknameError = validateNickname(data.nickname)
  if (nicknameError) errors.nickname = nicknameError

  if (data.password !== undefined) {
    const passwordError = validatePassword(data.password)
    if (passwordError) errors.password = passwordError
  }

  return errors
}

