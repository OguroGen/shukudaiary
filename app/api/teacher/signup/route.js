import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateTeacherSignupData } from '@/lib/validation/teacher'

export async function POST(request) {
  try {
    const supabase = await createClient()

    const { school_name, email, password, plan_type = 'free' } = await request.json()

    // バリデーション
    const validationErrors = validateTeacherSignupData({
      school_name,
      email,
      password,
    })

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: Object.values(validationErrors)[0] },
        { status: 400 }
      )
    }

    // プランタイプの検証（現状はfreeのみ許可）
    if (plan_type !== 'free') {
      return NextResponse.json(
        { error: '現在はFreeプランのみ選択可能です' },
        { status: 400 }
      )
    }

    // 1. Supabase Authでユーザー作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      // メールアドレス重複などのエラーハンドリング
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: authError?.message || 'アカウント作成に失敗しました' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. School作成（plan_type='free'固定）
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: school_name,
        plan_type: 'free',
      })
      .select()
      .single()

    if (schoolError || !school) {
      // School作成に失敗した場合、Authユーザーも削除すべきだが、
      // 現時点では手動で削除する必要がある
      return NextResponse.json(
        { error: '教室の作成に失敗しました' },
        { status: 500 }
      )
    }

    // 3. Branch作成（デフォルト「本教場」）
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        school_id: school.id,
        name: '本教場',
      })
      .select()
      .single()

    if (branchError || !branch) {
      return NextResponse.json(
        { error: '教場の作成に失敗しました' },
        { status: 500 }
      )
    }

    // 4. Teacher作成（role='owner'）
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: userId,
        school_id: school.id,
        email: email,
        role: 'owner',
      })
      .select()
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: '先生アカウントの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 5. TeacherBranch作成（TeacherとBranchを紐付け）
    const { data: teacherBranch, error: teacherBranchError } = await supabase
      .from('teacher_branches')
      .insert({
        teacher_id: userId,
        branch_id: branch.id,
      })
      .select()
      .single()

    if (teacherBranchError || !teacherBranch) {
      return NextResponse.json(
        { error: '先生と教場の紐付けに失敗しました' },
        { status: 500 }
      )
    }

    // 6. 自動ログイン処理（セッション作成）
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (sessionError || !sessionData.session) {
      // ログインに失敗しても、アカウントは作成されているので、ログインページにリダイレクト
      return NextResponse.json({
        success: true,
        message: 'アカウントが作成されました。ログインしてください。',
        requiresLogin: true,
      })
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        school_id: teacher.school_id,
        role: teacher.role,
      },
      school: {
        id: school.id,
        name: school.name,
        plan_type: school.plan_type,
      },
      branch: {
        id: branch.id,
        name: branch.name,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'アカウント作成に失敗しました' },
      { status: 500 }
    )
  }
}

