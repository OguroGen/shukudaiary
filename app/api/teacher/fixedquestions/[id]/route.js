import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const fixedQuestionId = resolvedParams.id

    // Get teacher's school_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get fixed question
    const { data: fixedQuestion, error } = await supabase
      .from('fixed_questions')
      .select('*')
      .eq('id', fixedQuestionId)
      .eq('school_id', teacher.school_id)
      .single()

    if (error || !fixedQuestion) {
      return NextResponse.json(
        { error: 'Fixed question not found' },
        { status: 404 }
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

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const fixedQuestionId = resolvedParams.id
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

    // Verify fixed question belongs to teacher's school
    const { data: fixedQuestion } = await supabase
      .from('fixed_questions')
      .select('school_id')
      .eq('id', fixedQuestionId)
      .single()

    if (!fixedQuestion || fixedQuestion.school_id !== teacher.school_id) {
      return NextResponse.json(
        { error: 'Fixed question not found' },
        { status: 404 }
      )
    }

    // Update fixed question
    const { data: updatedFixedQuestion, error } = await supabase
      .from('fixed_questions')
      .update({
        name,
        type,
        questions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fixedQuestionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update fixed question' },
        { status: 500 }
      )
    }

    return NextResponse.json({ fixed_question: updatedFixedQuestion })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const fixedQuestionId = resolvedParams.id

    // Get teacher's school_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Verify fixed question belongs to teacher's school
    const { data: fixedQuestion } = await supabase
      .from('fixed_questions')
      .select('school_id')
      .eq('id', fixedQuestionId)
      .single()

    if (!fixedQuestion || fixedQuestion.school_id !== teacher.school_id) {
      return NextResponse.json(
        { error: 'Fixed question not found' },
        { status: 404 }
      )
    }

    // Delete fixed question
    const { error } = await supabase
      .from('fixed_questions')
      .delete()
      .eq('id', fixedQuestionId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete fixed question' },
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

