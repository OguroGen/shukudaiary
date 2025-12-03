import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateStudentToken } from '@/lib/auth/student'

export async function GET(request, { params }) {
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

    const { data: homework, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('id', homeworkId)
      .single()

    if (error || !homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    // Strictly verify that the homework belongs to the authenticated student
    if (homework.student_id !== validatedStudentId) {
      return NextResponse.json(
        { error: 'Unauthorized: homework does not belong to this student' },
        { status: 403 }
      )
    }

    return NextResponse.json({ homework })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

