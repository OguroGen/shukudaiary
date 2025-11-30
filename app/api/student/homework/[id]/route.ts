import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const homeworkId = params.id

    const supabase = await createClient()

    const { data: homework, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('id', homeworkId)
      .single()

    if (error || !homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ homework })
  } catch (error) {
    console.error('Homework API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

