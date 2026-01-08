import { getProblemType } from '@/lib/problem-types'

export function validateHomeworkData(data) {
  const errors = {}

  if (!data.student_id) {
    errors.student_id = '生徒を選択してください'
  }

  if (!data.type || !['mul', 'div', 'mitori'].includes(data.type)) {
    errors.type = '種目を選択してください'
  }

  const problemType = getProblemType(data.type)
  if (problemType) {
    Object.entries(problemType.parameters).forEach(([key, config]) => {
      const value = data[key]
      if (config.required && (value === null || value === undefined)) {
        errors[key] = `${config.label}を入力してください`
      } else if (value !== null && value !== undefined) {
        if (config.type === 'integer') {
          const numValue = parseInt(value, 10)
          if (isNaN(numValue) || numValue < config.min || numValue > config.max) {
            errors[key] = `${config.label}は${config.min}〜${config.max}の範囲で入力してください`
          }
        }
      }
    })
  }

  if (!data.question_count || data.question_count < 1 || data.question_count > 100) {
    errors.question_count = '問題数は1〜100の範囲で入力してください'
  }

  if (!data.due_date_start) {
    errors.due_date_start = '期限開始日を入力してください'
  }

  if (!data.due_date_end) {
    errors.due_date_end = '期限終了日を入力してください'
  }

  if (data.due_date_start && data.due_date_end) {
    const start = new Date(data.due_date_start)
    const end = new Date(data.due_date_end)
    if (end < start) {
      errors.due_date_end = '期限終了日は期限開始日以降である必要があります'
    }
  }

  // nameは任意だが、指定されている場合は長さをチェック
  if (data.name && data.name.length > 100) {
    errors.name = '宿題名は100文字以内で入力してください'
  }

  // retry_countのバリデーション
  if (data.retry_count !== undefined && (data.retry_count < 0 || data.retry_count > 10)) {
    errors.retry_count = '繰り返し回数は0〜10の範囲で入力してください'
  }

  // feedback_modeのバリデーション
  if (data.feedback_mode && !['all_at_once', 'immediate'].includes(data.feedback_mode)) {
    errors.feedback_mode = 'フィードバックモードが不正です'
  }

  return errors
}

