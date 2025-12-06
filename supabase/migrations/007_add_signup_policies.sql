-- ============================================
-- サインアップ時のRLSポリシー追加
-- ============================================
-- サインアップ時に、認証されたユーザーがschool、teacher、branch、teacher_branchesを作成できるようにする

-- Schools: 認証されたユーザーがschoolを作成できる
-- サインアップ時、まだteacherレコードが存在しないため、auth.uid()のみでチェック
CREATE POLICY "Authenticated users can create schools"
  ON schools FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Teachers: 認証されたユーザーが自分のteacherレコードを作成できる
CREATE POLICY "Users can create their own teacher record"
  ON teachers FOR INSERT
  WITH CHECK (id = auth.uid());

-- Branches: 認証されたユーザーがbranchを作成できる
-- 1. 自分のschoolに属するbranchを作成できる（通常のケース）
-- 2. まだteacherが存在しないschoolにbranchを作成できる（サインアップ時）
-- 注意: WITH CHECK句では、挿入される行のカラム（school_id）を直接参照できる
CREATE POLICY "Users can create branches"
  ON branches FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- 自分のschoolに属するbranchを作成できる
      school_id IN (
        SELECT school_id FROM teachers WHERE id = auth.uid()
      )
      OR
      -- サインアップ時：まだteacherが存在しないschoolにbranchを作成できる
      -- (school_idは挿入される行のカラムを参照)
      NOT EXISTS (
        SELECT 1 FROM teachers t WHERE t.school_id = school_id
      )
    )
  );

-- TeacherBranches: 認証されたユーザーが、自分のteacher_branchレコードを作成できる
CREATE POLICY "Teachers can create their own teacher_branch records"
  ON teacher_branches FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

