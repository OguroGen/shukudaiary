import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/student'
import { validateStudentData } from '@/lib/validation/student'
import { getPlanLimits, getLimitErrorMessage } from '@/lib/plans'

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

    const { login_id, nickname, password } = await request.json()

    // Validate
    const validationErrors = validateStudentData({
      login_id,
      nickname,
      password,
    })

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: Object.values(validationErrors)[0] },
        { status: 400 }
      )
    }

    // Get teacher's school_id and branch_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get teacher's branch_id from teacher_branches (MVP: 1教場固定)
    const { data: teacherBranch } = await supabase
      .from('teacher_branches')
      .select('branch_id')
      .eq('teacher_id', session.user.id)
      .limit(1)
      .single()

    if (!teacherBranch) {
      return NextResponse.json(
        { error: '教場が見つかりません' },
        { status: 404 }
      )
    }

    // Get school's plan_type
    const { data: school } = await supabase
      .from('schools')
      .select('plan_type')
      .eq('id', teacher.school_id)
      .single()

    // Get plan type (default to 'free' if not set)
    const planType = school?.plan_type || 'free'

    // Check student count limit based on plan (school単位でチェック)
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', teacher.school_id)

    const currentCount = count || 0
    const limits = getPlanLimits(planType)

    if (limits.maxStudents !== null && currentCount >= limits.maxStudents) {
      const errorMessage = getLimitErrorMessage(planType, 'students', currentCount)
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Check if login_id already exists in this branch (教場単位でチェック)
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('branch_id', teacherBranch.branch_id)
      .eq('login_id', login_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'このログインIDは既に使用されています' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create student with branch_id
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        school_id: teacher.school_id,
        branch_id: teacherBranch.branch_id,
        login_id,
        password_hash: passwordHash,
        nickname,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json({ student })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

