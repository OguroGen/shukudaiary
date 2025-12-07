import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await request.json()

    // バリデーション
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'スラッグは英数字とハイフンのみ使用可能です' },
        { status: 400 }
      )
    }

    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: 'スラッグは3文字以上50文字以内で入力してください' },
        { status: 400 }
      )
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

    // 重複チェック（自分の教室以外）
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('slug', slug)
      .neq('id', teacher.school_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'このURLは既に使用されています' },
        { status: 400 }
      )
    }

    // スラッグを更新
    const { error } = await supabase
      .from('schools')
      .update({ slug })
      .eq('id', teacher.school_id)

    if (error) {
      console.error('Error updating school slug:', error)
      return NextResponse.json(
        { error: 'スラッグの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in school slug update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

