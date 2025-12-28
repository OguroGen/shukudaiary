import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateStudentToken } from '@/lib/auth/student'

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('student_id')
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // Token verification is required
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      )
    }

    // Verify token and validate student_id
    const validatedId = validateStudentToken(token)
    if (!validatedId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Strictly verify that the token's student_id matches the request's student_id
    if (validatedId !== studentId) {
      return NextResponse.json(
        { error: 'Unauthorized: student_id mismatch' },
        { status: 403 }
      )
    }

    // Use service_role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const today = new Date().toISOString().split('T')[0]

    // Get all homeworks for the student where today is within the period
    const { data: homeworks, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_id', studentId)
      .lte('due_date_start', today)  // 開始日が今日以前
      .gte('due_date_end', today)     // 終了日が今日以降
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch homeworks' },
        { status: 500 }
      )
    }

    if (!homeworks || homeworks.length === 0) {
      return NextResponse.json({ homeworks: [] })
    }

    // Filter out completed homeworks using status column
    const incompleteHomeworks = homeworks.filter((homework) => {
      return homework.status !== 'completed'
    })

    return NextResponse.json({ homeworks: incompleteHomeworks })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

