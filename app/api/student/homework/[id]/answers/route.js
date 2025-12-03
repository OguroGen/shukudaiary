import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const homeworkId = resolvedParams.id
    const studentId = request.nextUrl.searchParams.get('student_id')

    const supabase = await createClient()

    let query = supabase
      .from('answers')
      .select('*')
      .eq('homework_id', homeworkId)

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    const { data: answers, error } = await query.order('question_index', {
      ascending: true,
    })

    if (error) {
      console.error('Error fetching answers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    return NextResponse.json({ answers: answers || [] })
  } catch (error) {
    console.error('Answers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

