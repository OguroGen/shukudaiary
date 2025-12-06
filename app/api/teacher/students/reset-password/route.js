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
    // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
    const { data: teacherBranch } = await supabase
      .from('teacher_branches')
      .select('branch_id')
      .eq('teacher_id', session.user.id)
      .limit(1)
      .single()

    if (!teacherBranch) {
      return NextResponse.json({ error: 'Teacher branch not found' }, { status: 404 })
    }

    const { data: student } = await supabase
      .from('students')
      .select('branch_id')
      .eq('id', student_id)
      .single()

    if (!student || student.branch_id !== teacherBranch.branch_id) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Generate new password (fixed initial value)
    const newPassword = '8888'
    const passwordHash = await hashPassword(newPassword)

    // Update password
    const { error } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('id', student_id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ new_password: newPassword })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

