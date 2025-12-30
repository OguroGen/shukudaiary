import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, type, questions } = await request.json()

    if (!name || !type || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.type || !question.answer) {
        return NextResponse.json(
          { error: 'Invalid question structure' },
          { status: 400 }
        )
      }
    }

    // Get teacher's school_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Create fixed question
    const { data: fixedQuestion, error } = await supabase
      .from('fixed_questions')
      .insert({
        school_id: teacher.school_id,
        name,
        type,
        questions,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create fixed question' },
        { status: 500 }
      )
    }

    return NextResponse.json({ fixed_question: fixedQuestion })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

