import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, generateStudentToken } from '@/lib/auth/student'

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
      console.error('Authentication failed for login_id:', login_id)
      return NextResponse.json(
        { error: 'ログインIDまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    const token = generateStudentToken(result.student_id)

    return NextResponse.json({
      student_id: result.student_id,
      nickname: result.nickname,
      token: token.token,
      expires_at: token.expires_at,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}

