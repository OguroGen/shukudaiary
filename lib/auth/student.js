import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

const TOKEN_EXPIRY_HOURS = 24 * 7 // 7 days

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export async function authenticateStudent(credentials) {
  const supabase = await createClient()

  const { data: student, error } = await supabase
    .from('students')
    .select('id, login_id, password_hash, nickname')
    .eq('login_id', credentials.login_id)
    .single()

  if (error || !student) {
    return null
  }

  const isValid = await verifyPassword(credentials.password, student.password_hash)
  if (!isValid) {
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

