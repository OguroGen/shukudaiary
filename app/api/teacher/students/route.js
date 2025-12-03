import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/student'
import { validateStudentData } from '@/lib/validation/student'

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

    // Get teacher's school_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Check student count limit (10 for Free plan)
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', teacher.school_id)

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { error: 'Freeプランでは10人まで登録できます' },
        { status: 400 }
      )
    }

    // Check if login_id already exists in this school
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', teacher.school_id)
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

    // Create student
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        school_id: teacher.school_id,
        login_id,
        password_hash: passwordHash,
        nickname,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Create student API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

