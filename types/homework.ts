export type HomeworkType = 'mul' | 'div' | 'mitori'

export interface Homework {
  id: string
  student_id: string
  type: HomeworkType
  left_digits: number | null
  right_digits: number | null
  rows: number | null
  question_count: number
  start_date: string
  end_date: string
  created_at: string
}

export interface HomeworkWithStudent extends Homework {
  student: {
    id: string
    nickname: string
  }
}

export interface Answer {
  id: string
  homework_id: string | null
  student_id: string
  question: {
    type: HomeworkType
    left?: number
    right?: number
    numbers?: number[]
  }
  correct_answer: number
  student_answer: number
  is_correct: boolean
  question_index: number
  created_at: string
}

export interface HomeworkResult {
  homework: Homework
  total_questions: number
  correct_count: number
  wrong_answers: Answer[]
}

