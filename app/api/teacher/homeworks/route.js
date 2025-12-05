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

    // Get teacher's school_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Verify student belongs to teacher's school
    const { data: student } = await supabase
      .from('students')
      .select('school_id')
      .eq('id', homeworkData.student_id)
      .single()

    if (!student || student.school_id !== teacher.school_id) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Generate questions
    let questions = []
    if (homeworkData.type === 'mul' && homeworkData.left_digits && homeworkData.right_digits) {
      questions = generateMultiplicationQuestions(
        homeworkData.question_count,
        homeworkData.left_digits,
        homeworkData.right_digits
      )
    } else if (homeworkData.type === 'div' && homeworkData.left_digits && homeworkData.right_digits) {
      questions = generateDivisionQuestions(
        homeworkData.question_count,
        homeworkData.left_digits,
        homeworkData.right_digits
      )
    } else if (homeworkData.type === 'mitori' && homeworkData.rows && homeworkData.left_digits) {
      questions = generateMitoriQuestions(
        homeworkData.question_count,
        homeworkData.left_digits,
        homeworkData.rows
      )
    }

    // Create homework
    const { data: homework, error } = await supabase
      .from('homeworks')
      .insert({
        student_id: homeworkData.student_id,
        type: homeworkData.type,
        left_digits: homeworkData.left_digits,
        right_digits: homeworkData.right_digits,
        rows: homeworkData.rows,
        question_count: homeworkData.question_count,
        start_date: homeworkData.start_date,
        end_date: homeworkData.end_date,
        questions: questions,
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

