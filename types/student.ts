export interface Student {
  id: string
  school_id: string
  login_id: string
  nickname: string
  last_activity: string | null
  created_at: string
}

export interface StudentLoginCredentials {
  login_id: string
  password: string
}

export interface StudentToken {
  student_id: string
  token: string
  expires_at: number
}

