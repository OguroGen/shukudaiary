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

    // Calculate total time if started_at exists
    const completedAt = new Date()
    let totalTimeSeconds = null

    if (homework.started_at) {
      const startedAt = new Date(homework.started_at)
      totalTimeSeconds = Math.floor((completedAt - startedAt) / 1000)
    }

    // Update completed_at and total_time_seconds
    const { error: updateError } = await supabase
      .from('homeworks')
      .update({
        completed_at: completedAt.toISOString(),
        total_time_seconds: totalTimeSeconds
      })
      .eq('id', homeworkId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to record completion time' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      completed_at: completedAt.toISOString(),
      total_time_seconds: totalTimeSeconds
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

