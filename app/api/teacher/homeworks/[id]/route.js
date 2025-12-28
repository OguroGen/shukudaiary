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
    // Next.js 15: params might be a Promise
    const resolvedParams = params instanceof Promise ? await params : await Promise.resolve(params)
    const homeworkId = resolvedParams.id
    
    if (!homeworkId) {
      console.error('No homework ID in params:', resolvedParams)
      return NextResponse.json(
        { error: 'Homework ID is required' },
        { status: 400 }
      )
    }
    
    console.log('DELETE request for homework ID:', homeworkId)
    
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session found for user:', session.user.id)

    // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
    const { data: teacherBranch, error: branchError } = await supabase
      .from('teacher_branches')
      .select('branch_id')
      .eq('teacher_id', session.user.id)
      .limit(1)
      .single()

    if (branchError) {
      console.error('Teacher branch error:', branchError)
    }

    if (!teacherBranch) {
      console.log('Teacher branch not found')
      return NextResponse.json({ error: 'Teacher branch not found' }, { status: 404 })
    }

    console.log('Teacher branch_id:', teacherBranch.branch_id)

    // Get homework and verify it belongs to teacher's branch
    const { data: homework, error: homeworkError } = await supabase
      .from('homeworks')
      .select('*, students(branch_id)')
      .eq('id', homeworkId)
      .single()

    if (homeworkError) {
      console.error('Homework fetch error:', homeworkError)
    }

    if (!homework) {
      console.log('Homework not found for ID:', homeworkId)
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    console.log('Homework found:', homework.id, 'Student branch_id:', homework.students?.branch_id)

    if (homework.students?.branch_id !== teacherBranch.branch_id) {
      console.log('Branch mismatch:', homework.students?.branch_id, 'vs', teacherBranch.branch_id)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete homework (answers will be deleted automatically due to ON DELETE CASCADE)
    console.log('Attempting to delete homework:', homeworkId)
    const { data, error } = await supabase
      .from('homeworks')
      .delete()
      .eq('id', homeworkId)
      .select()

    if (error) {
      console.error('Delete homework error:', error)
      return NextResponse.json(
        { error: 'Failed to delete homework', details: error.message },
        { status: 500 }
      )
    }

    console.log('Delete result:', data)

    // Check if homework was actually deleted
    if (!data || data.length === 0) {
      console.log('No rows deleted')
      return NextResponse.json(
        { error: 'Homework not found or already deleted' },
        { status: 404 }
      )
    }

    console.log('Successfully deleted homework')
    return NextResponse.json({ success: true, deleted: data })
  } catch (error) {
    console.error('DELETE catch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

