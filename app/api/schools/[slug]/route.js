import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const slug = resolvedParams.slug

    if (!slug) {
      return NextResponse.json(
        { error: 'スラッグが必要です' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: school, error } = await supabase
      .from('schools')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    if (error || !school) {
      return NextResponse.json(
        { error: '教室が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: school.id,
      name: school.name,
      slug: school.slug,
    })
  } catch (error) {
    console.error('Get school by slug error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

