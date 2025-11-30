import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth/student'
import { createClient } from '@/lib/supabase/server'
import { validateStudentToken } from '@/lib/auth/student'

export async function POST(request: NextRequest) {
  try {
    const { student_id, token, new_password } = await request.json()

    if (!student_id || !token || !new_password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate token
    const validatedId = validateStudentToken(token)
    if (!validatedId || validatedId !== student_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (new_password.length < 4) {
      return NextResponse.json(
        { error: 'パスワードは4文字以上で入力してください' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(new_password)

    const supabase = await createClient()

    const { error } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('id', student_id)

    if (error) {
      console.error('Error updating password:', error)
      return NextResponse.json(
        { error: 'パスワード変更に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password change API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

