import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateHomeworkData } from '@/lib/validation/homework'
import {
  generateMultiplicationQuestions,
} from '@/lib/problems/multiplication'
import {
  generateDivisionQuestions,
} from '@/lib/problems/division'
import {
  generateMitoriQuestions,
} from '@/lib/problems/mitori'

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

    const homeworkData = await request.json()

    // Validate
    const validationErrors = validateHomeworkData(homeworkData)
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: Object.values(validationErrors)[0] },
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

    // Verify student belongs to teacher's branch
    const { data: student } = await supabase
      .from('students')
      .select('branch_id')
      .eq('id', homeworkData.student_id)
      .single()

    if (!student || student.branch_id !== teacherBranch.branch_id) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Generate questions
    let questions = []
    const parameters = {
      parameter1: homeworkData.parameter1,
      parameter2: homeworkData.parameter2,
      parameter3: homeworkData.parameter3,
      parameter4: homeworkData.parameter4,
      parameter5: homeworkData.parameter5,
      parameter6: homeworkData.parameter6,
      parameter7: homeworkData.parameter7,
      parameter8: homeworkData.parameter8,
      parameter9: homeworkData.parameter9,
      parameter10: homeworkData.parameter10,
    }
    
    if (homeworkData.type === 'mul') {
      questions = generateMultiplicationQuestions(
        homeworkData.question_count,
        parameters
      )
    } else if (homeworkData.type === 'div') {
      questions = generateDivisionQuestions(
        homeworkData.question_count,
        parameters
      )
    } else if (homeworkData.type === 'mitori') {
      questions = generateMitoriQuestions(
        homeworkData.question_count,
        parameters
      )
    }

    // Create homework
    const { data: homework, error } = await supabase
      .from('homeworks')
      .insert({
        student_id: homeworkData.student_id,
        type: homeworkData.type,
        parameter1: homeworkData.parameter1,
        parameter2: homeworkData.parameter2,
        parameter3: homeworkData.parameter3,
        parameter4: homeworkData.parameter4,
        parameter5: homeworkData.parameter5,
        parameter6: homeworkData.parameter6,
        parameter7: homeworkData.parameter7,
        parameter8: homeworkData.parameter8,
        parameter9: homeworkData.parameter9,
        parameter10: homeworkData.parameter10,
        question_count: homeworkData.question_count,
        start_date: homeworkData.start_date,
        end_date: homeworkData.end_date,
        message: homeworkData.message || null,
        questions: questions,
        status: 'not_started',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create homework' },
        { status: 500 }
      )
    }

    return NextResponse.json({ homework })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

