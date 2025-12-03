import { NextRequest, NextResponse } from 'next/server'
import { validateStudentToken } from '@/lib/auth/student'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 })
    }

    const studentId = validateStudentToken(token)

    if (!studentId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: student, error } = await supabase
      .from('students')
      .select('id, nickname')
      .eq('id', studentId)
      .single()

    if (error) {
      console.error('Supabase error in verify:', error)
      return NextResponse.json(
        { error: '生徒情報が見つかりません' },
        { status: 404 }
      )
    }

    if (!student) {
      console.error('Student not found for id:', studentId)
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

