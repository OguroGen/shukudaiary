import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { name, type, left_digits, right_digits, rows, question_count } =
      await request.json()

    if (!name || !type || !question_count) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check preset count limit (10 for Free plan)
    const { count } = await supabase
      .from('presets')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', teacher.school_id)

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { error: 'Freeプランでは10件まで登録できます' },
        { status: 400 }
      )
    }

    // Create preset
    const { data: preset, error } = await supabase
      .from('presets')
      .insert({
        school_id: teacher.school_id,
        name,
        type,
        left_digits,
        right_digits,
        rows,
        question_count,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preset })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

