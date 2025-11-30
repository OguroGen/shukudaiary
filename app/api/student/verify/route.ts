import { NextRequest, NextResponse } from 'next/server'
import { validateStudentToken } from '@/lib/auth/student'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 })
    }

    const studentId = validateStudentToken(token)

    if (!studentId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: student, error } = await supabase
      .from('students')
      .select('id, nickname')
      .eq('id', studentId)
      .single()

    if (error || !student) {
      return NextResponse.json(
        { error: '生徒情報が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      student_id: student.id,
      nickname: student.nickname,
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: '認証に失敗しました' },
      { status: 500 }
    )
  }
}

