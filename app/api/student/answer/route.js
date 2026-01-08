import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateStudentToken } from '@/lib/auth/student'

export async function POST(request) {
  try {
    const {
      homework_id,
      student_id,
      question,
      correct_answer,
      student_answer,
      is_correct,
      question_index,
      time_spent_milliseconds,
      retry_attempt,
    } = await request.json()

    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (
      !student_id ||
      !question ||
      correct_answer === undefined ||
      student_answer === undefined ||
      is_correct === undefined ||
      question_index === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify token
    const validatedStudentId = validateStudentToken(token)
    if (!validatedStudentId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Strictly verify that the token's student_id matches the request's student_id
    if (validatedStudentId !== student_id) {
      return NextResponse.json(
        { error: 'Unauthorized: student_id mismatch' },
        { status: 403 }
      )
    }

    // Use service_role key for server-side operations to bypass RLS
    // This is safe because we validate the student_id from the token first
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // If homework_id is provided, verify that the homework belongs to this student
    if (homework_id) {
      const { data: homework, error: homeworkError } = await supabase
        .from('homeworks')
        .select('student_id')
        .eq('id', homework_id)
        .single()

      if (homeworkError || !homework) {
        return NextResponse.json(
          { error: 'Homework not found' },
          { status: 404 }
        )
      }

      if (homework.student_id !== student_id) {
        return NextResponse.json(
          { error: 'Unauthorized: homework does not belong to this student' },
          { status: 403 }
        )
      }
    }

    const insertData = {
      homework_id: homework_id || null,
      student_id,
      question,
      correct_answer,
      student_answer,
      is_correct,
      question_index,
      time_spent_milliseconds: time_spent_milliseconds || null,
      retry_attempt: retry_attempt !== undefined ? retry_attempt : 0,
    }

    const { data, error } = await supabase
      .from('answers')
      .insert(insertData)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save answer' },
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

