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
      console.error('Token student_id mismatch:', { validatedId, studentId })
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

    // Get all homeworks for the student
    const { data: homeworks, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_id', studentId)
      .gte('end_date', today)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching homeworks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch homeworks' },
        { status: 500 }
      )
    }

    if (!homeworks || homeworks.length === 0) {
      return NextResponse.json({ homeworks: [] })
    }

    // Get answer counts for each homework
    const homeworkIds = homeworks.map((h) => h.id)
    const { data: answerCounts, error: answerError } = await supabase
      .from('answers')
      .select('homework_id')
      .in('homework_id', homeworkIds)
      .eq('student_id', studentId)

    if (answerError) {
      console.error('Error fetching answer counts:', answerError)
      return NextResponse.json(
        { error: 'Failed to fetch answer counts' },
        { status: 500 }
      )
    }

    // Count answers per homework
    const answerCountMap = new Map()
    if (answerCounts) {
      answerCounts.forEach((answer) => {
        if (answer.homework_id) {
          const count = answerCountMap.get(answer.homework_id) || 0
          answerCountMap.set(answer.homework_id, count + 1)
        }
      })
    }

    // Filter out completed homeworks (where answer count equals question_count)
    const incompleteHomeworks = homeworks.filter((homework) => {
      const answerCount = answerCountMap.get(homework.id) || 0
      return answerCount < homework.question_count
    })

    return NextResponse.json({ homeworks: incompleteHomeworks })
  } catch (error) {
    console.error('Homeworks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

