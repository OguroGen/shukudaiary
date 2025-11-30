import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id, email')
      .eq('id', data.user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher record not found' },
        { status: 404 }
      )
    }

    // Get school info
    const { data: school } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', teacher.school_id)
      .single()

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        email: teacher.email,
        school_id: teacher.school_id,
      },
      school: school || null,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

