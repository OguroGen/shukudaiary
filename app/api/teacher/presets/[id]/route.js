import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const presetId = resolvedParams.id
    const { name, type, left_digits, right_digits, rows, question_count } =
      await request.json()

    if (!name || !type || !question_count) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (question_count < 1 || question_count > 20) {
      return NextResponse.json(
        { error: '問題数は1から20の間で入力してください' },
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

    // Verify preset belongs to teacher's school
    const { data: preset } = await supabase
      .from('presets')
      .select('school_id')
      .eq('id', presetId)
      .single()

    if (!preset || preset.school_id !== teacher.school_id) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Update preset
    const { data: updatedPreset, error } = await supabase
      .from('presets')
      .update({
        name,
        type,
        left_digits,
        right_digits,
        rows,
        question_count,
      })
      .eq('id', presetId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preset: updatedPreset })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const presetId = resolvedParams.id

    // Get teacher's school_id
    const { data: teacher } = await supabase
      .from('teachers')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Verify preset belongs to teacher's school
    const { data: preset } = await supabase
      .from('presets')
      .select('school_id')
      .eq('id', presetId)
      .single()

    if (!preset || preset.school_id !== teacher.school_id) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Delete preset
    const { error } = await supabase.from('presets').delete().eq('id', presetId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

