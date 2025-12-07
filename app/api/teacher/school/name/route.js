import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSchoolName } from '@/lib/validation/teacher'

export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    // バリデーション
    const validationError = validateSchoolName(name)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // 先生の教室IDを取得
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // 教室名を更新
    const { error } = await supabase
      .from('schools')
      .update({ name: name.trim() })
      .eq('id', teacher.school_id)

    if (error) {
      console.error('Error updating school name:', error)
      return NextResponse.json(
        { error: '教室名の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in school name update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

