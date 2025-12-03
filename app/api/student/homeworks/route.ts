import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateStudentToken } from '@/lib/auth/student'

export async function GET(request: NextRequest) {
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

    // Verify token if provided
    if (token) {
      const validatedId = validateStudentToken(token)
      if (!validatedId || validatedId !== studentId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createClient()

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
    const answerCountMap = new Map<string, number>()
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

