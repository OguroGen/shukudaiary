import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateStudentToken } from '@/lib/auth/student'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('student_id')
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // Verify token if provided
    if (token) {
      const validatedId = validateStudentToken(token)
      if (!validatedId || validatedId !== studentId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createClient()

    const today = new Date().toISOString().split('T')[0]

    const { data: homeworks, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_id', studentId)
      .gte('end_date', today)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching homeworks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch homeworks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ homeworks: homeworks || [] })
  } catch (error) {
    console.error('Homeworks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

