import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const {
      homework_id,
      student_id,
      question,
      correct_answer,
      student_answer,
      is_correct,
      question_index,
    } = await request.json()

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

    const supabase = await createClient()

    const { error } = await supabase.from('answers').insert({
      homework_id: homework_id || null,
      student_id,
      question,
      correct_answer,
      student_answer,
      is_correct,
      question_index,
    })

    if (error) {
      console.error('Error saving answer:', error)
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Answer API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

