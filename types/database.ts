export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          school_id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          email?: string
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          school_id: string
          login_id: string
          password_hash: string
          nickname: string
          last_activity: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          login_id: string
          password_hash: string
          nickname: string
          last_activity?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          login_id?: string
          password_hash?: string
          nickname?: string
          last_activity?: string | null
          created_at?: string
        }
      }
      presets: {
        Row: {
          id: string
          school_id: string
          type: 'mul' | 'div' | 'mitori'
          name: string
          left_digits: number | null
          right_digits: number | null
          rows: number | null
          question_count: number
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          type: 'mul' | 'div' | 'mitori'
          name: string
          left_digits?: number | null
          right_digits?: number | null
          rows?: number | null
          question_count: number
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          type?: 'mul' | 'div' | 'mitori'
          name?: string
          left_digits?: number | null
          right_digits?: number | null
          rows?: number | null
          question_count?: number
          created_at?: string
        }
      }
      homeworks: {
        Row: {
          id: string
          student_id: string
          type: 'mul' | 'div' | 'mitori'
          left_digits: number | null
          right_digits: number | null
          rows: number | null
          question_count: number
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          type: 'mul' | 'div' | 'mitori'
          left_digits?: number | null
          right_digits?: number | null
          rows?: number | null
          question_count: number
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          type?: 'mul' | 'div' | 'mitori'
          left_digits?: number | null
          right_digits?: number | null
          rows?: number | null
          question_count?: number
          start_date?: string
          end_date?: string
          created_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          homework_id: string | null
          student_id: string
          question: Json
          correct_answer: number
          student_answer: number
          is_correct: boolean
          question_index: number
          created_at: string
        }
        Insert: {
          id?: string
          homework_id?: string | null
          student_id: string
          question: Json
          correct_answer: number
          student_answer: number
          is_correct: boolean
          question_index: number
          created_at?: string
        }
        Update: {
          id?: string
          homework_id?: string | null
          student_id?: string
          question?: Json
          correct_answer?: number
          student_answer?: number
          is_correct?: boolean
          question_index?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

