import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { validateTeacherSignupData } from '@/lib/validation/teacher'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { school_name, email, password, plan_type = 'free' } = await request.json()

    // ============================================
    // 1. バリデーション
    // ============================================
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

    // ============================================
    // 2. メールアドレスの重複チェック
    // ============================================
    // 2-1. teachersテーブルで既に登録されているかチェック
    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingTeacher) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // 2-2. Supabase Authで既存ユーザーをチェック（メール確認が完了していないユーザーを検出）
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // メールアドレスで既存ユーザーを検索（より効率的な方法）
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find((user) => user.email === email)

    if (existingAuthUser) {
      // メール確認が完了している場合
      if (existingAuthUser.email_confirmed_at) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        )
      }

      // メール確認が完了していない場合、既存のユーザーIDを使用してデータを作成
      // （既にSchoolやTeacherが作成されている可能性があるため、チェックが必要）
      const { data: existingTeacherByUserId } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', existingAuthUser.id)
        .maybeSingle()

      if (existingTeacherByUserId) {
        // 既にTeacherレコードが存在する場合、エラーを返す
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています。メール確認が完了していない場合は、確認メールを再送信してください。' },
          { status: 400 }
        )
      }

      // メール確認が完了していないが、Teacherレコードが存在しない場合
      // 既存のAuthユーザーIDを使用してデータを作成
      // Service Role Keyを使ってRLSをバイパス（メール確認が有効な場合、セッションが確立されていないため）
      const result = await createSchoolAndTeacher(
        adminSupabase,
        existingAuthUser.id,
        email,
        school_name,
        plan_type
      )

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status || 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'アカウントが作成されました。メール確認を完了してください。',
        requiresLogin: true,
        requiresEmailConfirmation: true,
        ...result.data,
      })
    }

    // ============================================
    // 3. 新規ユーザーの作成
    // ============================================
    // 3-1. Supabase Authでユーザー作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      const errorMessage = authError?.message || ''
      const errorStatus = authError?.status
      const errorCode = authError?.code || ''

      // メールアドレス重複などのエラーハンドリング
      if (
        errorStatus === 422 ||
        errorCode === 'signup_disabled' ||
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('user already registered') ||
        errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('email address is already') ||
        errorMessage.toLowerCase().includes('user with this email already exists')
      ) {
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

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'アカウント作成に失敗しました' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 3-2. School、Branch、Teacher、TeacherBranchの作成
    // Service Role Keyを使ってRLSをバイパス（メール確認が有効な場合、セッションが確立されていないため）
    const result = await createSchoolAndTeacher(
      adminSupabase,
      userId,
      email,
      school_name,
      plan_type
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'アカウントが作成されました。メール確認を完了してください。',
      requiresLogin: true,
      requiresEmailConfirmation: true,
      ...result.data,
    })
  } catch (error) {
    console.error('Signup error:', {
      message: error?.message,
      stack: error?.stack,
      error: error,
    })
    return NextResponse.json(
      { error: 'アカウント作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * School、Branch、Teacher、TeacherBranchを作成する共通関数
 * @param {Object} supabase - Service Role Keyを使ったSupabaseクライアント（RLSをバイパス）
 * @param {string} userId - Supabase AuthのユーザーID
 * @param {string} email - メールアドレス
 * @param {string} school_name - 教室名
 * @param {string} plan_type - プランタイプ
 */
async function createSchoolAndTeacher(supabase, userId, email, school_name, plan_type) {
  try {
    // 1. School作成
    // Service Role Keyを使っているため、RLSをバイパスして作成可能
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: school_name,
        plan_type: plan_type || 'free',
      })
      .select()
      .single()

    if (schoolError || !school) {
      console.error('School creation error:', schoolError)
      return { error: '教室の作成に失敗しました', status: 500 }
    }

    // 2. Branch作成（システムデフォルト）
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        school_id: school.id,
        name: '__DEFAULT__',
      })
      .select()
      .single()

    if (branchError || !branch) {
      console.error('Branch creation error:', branchError)
      return { error: '教場の作成に失敗しました', status: 500 }
    }

    // 3. Teacher作成（role='owner'）
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
      console.error('Teacher creation error:', teacherError)
      return { error: '先生アカウントの作成に失敗しました', status: 500 }
    }

    // 4. TeacherBranch作成（TeacherとBranchを紐付け）
    const { data: teacherBranch, error: teacherBranchError } = await supabase
      .from('teacher_branches')
      .insert({
        teacher_id: userId,
        branch_id: branch.id,
      })
      .select()
      .single()

    if (teacherBranchError || !teacherBranch) {
      console.error('TeacherBranch creation error:', teacherBranchError)
      return { error: '先生と教場の紐付けに失敗しました', status: 500 }
    }

    return {
      data: {
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
      },
    }
  } catch (error) {
    console.error('createSchoolAndTeacher error:', error)
    return { error: 'データの作成に失敗しました', status: 500 }
  }
}
