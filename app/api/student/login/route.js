import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, generateStudentToken } from '@/lib/auth/student'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { login_id, password } = await request.json()

    if (!login_id || !password) {
      return NextResponse.json(
        { error: 'ログインIDとパスワードを入力してください' },
        { status: 400 }
      )
    }

    const result = await authenticateStudent({ login_id, password })

    if (!result) {
      return NextResponse.json(
        { error: 'ログインIDまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // 生徒の所属教室のスラッグを取得
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: student } = await supabase
      .from('students')
      .select('school_id, schools(slug)')
      .eq('id', result.student_id)
      .single()

    if (!student || !student.schools || !student.schools.slug) {
      return NextResponse.json(
        { error: '教室のスラッグが設定されていません' },
        { status: 500 }
      )
    }

    const schoolSlug = student.schools.slug

    const token = generateStudentToken(result.student_id)

    return NextResponse.json({
      student_id: result.student_id,
      nickname: result.nickname,
      token: token.token,
      expires_at: token.expires_at,
      school_slug: schoolSlug,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}

