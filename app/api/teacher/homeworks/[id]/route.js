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

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'questions array cannot be empty' },
        { status: 400 }
      )
    }

    // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
    const { data: teacherBranch } = await supabase
      .from('teacher_branches')
      .select('branch_id')
      .eq('teacher_id', session.user.id)
      .limit(1)
      .single()

    if (!teacherBranch) {
      return NextResponse.json({ error: 'Teacher branch not found' }, { status: 404 })
    }

    // Get homework and verify it belongs to teacher's branch
    const { data: homework } = await supabase
      .from('homeworks')
      .select('*, students(branch_id)')
      .eq('id', homeworkId)
      .single()

    if (!homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    if (homework.students?.branch_id !== teacherBranch.branch_id) {
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

    // Update homework questions and question_count to match
    const { data: updatedHomework, error } = await supabase
      .from('homeworks')
      .update({ 
        questions: questions,
        question_count: questions.length
      })
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

export async function DELETE(request, { params }) {
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

    // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
    const { data: teacherBranch } = await supabase
      .from('teacher_branches')
      .select('branch_id')
      .eq('teacher_id', session.user.id)
      .limit(1)
      .single()

    if (!teacherBranch) {
      return NextResponse.json({ error: 'Teacher branch not found' }, { status: 404 })
    }

    // Get homework and verify it belongs to teacher's branch
    const { data: homework } = await supabase
      .from('homeworks')
      .select('*, students(branch_id)')
      .eq('id', homeworkId)
      .single()

    if (!homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    if (homework.students?.branch_id !== teacherBranch.branch_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete homework (answers will be deleted automatically due to ON DELETE CASCADE)
    const { error } = await supabase
      .from('homeworks')
      .delete()
      .eq('id', homeworkId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete homework' },
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

