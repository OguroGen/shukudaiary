import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, verifyPassword } from '@/lib/auth/student'
import { createClient } from '@supabase/supabase-js'
import { validateStudentToken } from '@/lib/auth/student'

export async function POST(request) {
  try {
    const { student_id, token, old_password, new_password } = await request.json()

    if (!student_id || !token || !old_password || !new_password) {
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

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Get current password hash
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('password_hash')
      .eq('id', student_id)
      .single()

    if (fetchError || !student) {
      return NextResponse.json(
        { error: '生徒情報が見つかりません' },
        { status: 404 }
      )
    }

    // Verify old password
    const isOldPasswordValid = await verifyPassword(old_password, student.password_hash)
    if (!isOldPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(new_password)

    // Update password
    const { error } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('id', student_id)

    if (error) {
      return NextResponse.json(
        { error: 'パスワード変更に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
