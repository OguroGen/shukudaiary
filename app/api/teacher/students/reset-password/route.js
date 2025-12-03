import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/student'

export async function POST(request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { student_id } = await request.json()

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // Verify teacher has access to this student
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { data: student } = await supabase
      .from('students')
      .select('school_id')
      .eq('id', student_id)
      .single()

    if (!student || student.school_id !== teacher.school_id) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8)
    const passwordHash = await hashPassword(newPassword)

    // Update password
    const { error } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('id', student_id)

    if (error) {
      console.error('Error resetting password:', error)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ new_password: newPassword })
  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

