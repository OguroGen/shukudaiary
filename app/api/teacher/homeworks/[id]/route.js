import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const homeworkId = resolvedParams.id
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questions } = await request.json()

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'questions array is required' },
        { status: 400 }
      )
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

    // Get homework and verify it belongs to teacher's school
    const { data: homework } = await supabase
      .from('homeworks')
      .select('*, students(school_id)')
      .eq('id', homeworkId)
      .single()

    if (!homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    if (homework.students?.school_id !== teacher.school_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if homework has been answered (if answers exist, don't allow editing)
    const { data: answers } = await supabase
      .from('answers')
      .select('id')
      .eq('homework_id', homeworkId)
      .limit(1)

    if (answers && answers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot edit homework that has been answered' },
        { status: 400 }
      )
    }

    // Update homework questions
    const { data: updatedHomework, error } = await supabase
      .from('homeworks')
      .update({ questions: questions })
      .eq('id', homeworkId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update homework' },
        { status: 500 }
      )
    }

    return NextResponse.json({ homework: updatedHomework })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

