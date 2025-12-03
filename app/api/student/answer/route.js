import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Use service_role key for server-side operations to bypass RLS
    // This is safe because we validate the student_id from the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const insertData = {
      homework_id: homework_id || null,
      student_id,
      question,
      correct_answer,
      student_answer,
      is_correct,
      question_index,
    }

    const { data, error } = await supabase
      .from('answers')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error saving answer:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { 
          error: 'Failed to save answer',
          details: error.message,
          code: error.code,
        },
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

