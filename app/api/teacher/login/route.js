import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      // メール認証が未完了の場合のエラーメッセージを改善
      const errorMessage = error?.message?.toLowerCase() || ''
      if (
        errorMessage.includes('email not confirmed') ||
        errorMessage.includes('email_not_confirmed') ||
        errorMessage.includes('email address not confirmed')
      ) {
        return NextResponse.json(
          { error: 'メールアドレスの認証が完了していません。メールボックスを確認して、確認メールのリンクをクリックしてください。' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // Get teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id, email')
      .eq('id', data.user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher record not found' },
        { status: 404 }
      )
    }

    // Get school info
    const { data: school } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', teacher.school_id)
      .single()

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        email: teacher.email,
        school_id: teacher.school_id,
      },
      school: school || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

