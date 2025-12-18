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

