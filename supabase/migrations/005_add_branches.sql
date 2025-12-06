-- ============================================
-- 教場（branches）機能の追加
-- ============================================

-- Create branches table
-- 教場テーブルを作成（1つのSchoolに複数の教場を持つことが可能）
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Create index for school_id lookup
CREATE INDEX idx_branches_school_id ON branches(school_id);

-- Create default branch for each existing school
-- 既存の各学校にデフォルト教場「本教場」を作成
INSERT INTO branches (school_id, name)
SELECT id, '本教場'
FROM schools
WHERE NOT EXISTS (
  SELECT 1 FROM branches WHERE branches.school_id = schools.id
);

-- ============================================
-- Students: Add branch_id
-- ============================================

-- Add branch_id column to students table
ALTER TABLE students 
ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Migrate existing students to default branch of their school
UPDATE students s
SET branch_id = (
  SELECT b.id 
  FROM branches b 
  WHERE b.school_id = s.school_id 
  ORDER BY b.created_at ASC
  LIMIT 1
)
WHERE branch_id IS NULL;

-- Make branch_id NOT NULL after migration
ALTER TABLE students 
ALTER COLUMN branch_id SET NOT NULL;

-- Update unique constraint: 同じ教場内でlogin_idの重複を防ぐ
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_school_id_login_id_key;

ALTER TABLE students
ADD CONSTRAINT students_branch_id_login_id_key UNIQUE(branch_id, login_id);

-- Add index for branch_id
CREATE INDEX idx_students_branch_id ON students(branch_id);

-- ============================================
-- Teachers: Add teacher_branches table
-- ============================================

-- Create teacher_branches table (中間テーブル)
-- 先生と教場の多対多の関係を表現（将来的に先生が複数教場を担当できるように）
CREATE TABLE teacher_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, branch_id)
);

-- Create indexes for teacher_branches
CREATE INDEX idx_teacher_branches_teacher_id ON teacher_branches(teacher_id);
CREATE INDEX idx_teacher_branches_branch_id ON teacher_branches(branch_id);

-- Migrate existing teachers to default branch of their school
-- 既存の先生を各学校のデフォルト教場に割り当て
INSERT INTO teacher_branches (teacher_id, branch_id)
SELECT 
  t.id as teacher_id,
  b.id as branch_id
FROM teachers t
INNER JOIN branches b ON b.school_id = t.school_id
WHERE NOT EXISTS (
  SELECT 1 FROM teacher_branches tb 
  WHERE tb.teacher_id = t.id AND tb.branch_id = b.id
)
AND b.name = '本教場';  -- デフォルト教場のみ

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Branches: Teachers can view branches in their school
CREATE POLICY "Teachers can view branches in their school"
  ON branches FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Enable RLS on teacher_branches table
ALTER TABLE teacher_branches ENABLE ROW LEVEL SECURITY;

-- Teacher_branches: Teachers can view their own branch assignments
CREATE POLICY "Teachers can view their own branch assignments"
  ON teacher_branches FOR SELECT
  USING (teacher_id = auth.uid());

-- Teacher_branches: Teachers can view branch assignments for teachers in their school
CREATE POLICY "Teachers can view branch assignments in their school"
  ON teacher_branches FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE school_id IN (
        SELECT school_id FROM teachers WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- 将来の拡張への備え
-- ============================================

-- Note: 
-- 1. students テーブルには school_id と branch_id の両方を保持
--    - プラン制限チェックは school_id で行う
--    - 教場単位の管理は branch_id で行う
--    - パフォーマンス向上のため両方保持
--
-- 2. teacher_branches テーブルで先生と教場の関係を管理
--    - MVP段階では先生1人 = 1教場（1行のみ）
--    - 将来的に先生が複数教場を担当できる（複数行）
--
-- 3. 将来的に管理者アカウント機能を追加する際は、
--    schools.owner_id や teachers.role を追加する予定

