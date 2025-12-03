export function validateHomeworkData(data) {
  const errors = {}

  if (!data.student_id) {
    errors.student_id = '生徒を選択してください'
  }

  if (!data.type || !['mul', 'div', 'mitori'].includes(data.type)) {
    errors.type = '種目を選択してください'
  }

  if (data.type === 'mul' || data.type === 'div') {
    if (!data.left_digits || data.left_digits < 1 || data.left_digits > 10) {
      errors.left_digits = '左側の桁数は1〜10の範囲で入力してください'
    }
    if (!data.right_digits || data.right_digits < 1 || data.right_digits > 10) {
      errors.right_digits = '右側の桁数は1〜10の範囲で入力してください'
    }
  }

  if (data.type === 'mitori') {
    if (!data.rows || data.rows < 2 || data.rows > 10) {
      errors.rows = '行数は2〜10の範囲で入力してください'
    }
  }

  if (!data.question_count || data.question_count < 1 || data.question_count > 100) {
    errors.question_count = '問題数は1〜100の範囲で入力してください'
  }

  if (!data.start_date) {
    errors.start_date = '開始日を入力してください'
  }

  if (!data.end_date) {
    errors.end_date = '終了日を入力してください'
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    if (end < start) {
      errors.end_date = '終了日は開始日以降である必要があります'
    }
  }

  return errors
}

