import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateStudentToken } from '@/lib/auth/student'

export async function POST(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const homeworkId = resolvedParams.id
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    // Token verification is required
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      )
    }

    // Verify token
    const validatedStudentId = validateStudentToken(token)
    if (!validatedStudentId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Use service_role key to bypass RLS (safe because we validate token first)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Verify homework belongs to student
    const { data: homework, error: homeworkError } = await supabase
      .from('homeworks')
      .select('student_id, started_at')
      .eq('id', homeworkId)
      .single()

    if (homeworkError || !homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    if (homework.student_id !== validatedStudentId) {
      return NextResponse.json(
        { error: 'Unauthorized: homework does not belong to this student' },
        { status: 403 }
      )
    }

    // Update started_at if not already set
    if (!homework.started_at) {
      const { error: updateError } = await supabase
        .from('homeworks')
        .update({ started_at: new Date().toISOString() })
        .eq('id', homeworkId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to record start time' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

