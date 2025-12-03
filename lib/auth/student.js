import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const TOKEN_EXPIRY_HOURS = 24 * 7 // 7 days

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function authenticateStudent(credentials) {
  // Use service_role key to bypass RLS for authentication
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: student, error } = await supabase
    .from('students')
    .select('id, login_id, password_hash, nickname')
    .eq('login_id', credentials.login_id)
    .single()

  if (error) {
    console.error('Supabase error in authenticateStudent:', error)
    return null
  }

  if (!student) {
    console.error('Student not found for login_id:', credentials.login_id)
    return null
  }

  const isValid = await verifyPassword(credentials.password, student.password_hash)
  if (!isValid) {
    console.error('Password verification failed for login_id:', credentials.login_id)
    return null
  }

  // Update last_activity
  await supabase
    .from('students')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', student.id)

  return {
    student_id: student.id,
    nickname: student.nickname,
  }
}

export function generateStudentToken(studentId) {
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  const token = Buffer.from(
    `${studentId}:${expiresAt}:${Math.random()}`
  ).toString('base64')

  return {
    student_id: studentId,
    token,
    expires_at: expiresAt,
  }
}

export function validateStudentToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [studentId, expiresAtStr] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)

    if (Date.now() > expiresAt) {
      return null
    }

    return studentId
  } catch {
    return null
  }
}

