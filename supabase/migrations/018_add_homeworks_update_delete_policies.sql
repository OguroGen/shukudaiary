-- Add UPDATE and DELETE policies for homeworks table
-- Teachers can update and delete homeworks for students in their branch

-- Homeworks: Teachers can update homeworks for students in their branch
CREATE POLICY "Teachers can update homeworks in their branch"
  ON homeworks FOR UPDATE
  USING (
    student_id IN (
      SELECT s.id 
      FROM students s
      INNER JOIN teacher_branches tb ON s.branch_id = tb.branch_id
      WHERE tb.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT s.id 
      FROM students s
      INNER JOIN teacher_branches tb ON s.branch_id = tb.branch_id
      WHERE tb.teacher_id = auth.uid()
    )
  );

-- Homeworks: Teachers can delete homeworks for students in their branch
CREATE POLICY "Teachers can delete homeworks in their branch"
  ON homeworks FOR DELETE
  USING (
    student_id IN (
      SELECT s.id 
      FROM students s
      INNER JOIN teacher_branches tb ON s.branch_id = tb.branch_id
      WHERE tb.teacher_id = auth.uid()
    )
  );

-- ============================================
-- Update answers table RLS policies
-- ============================================

-- Drop the old school-based SELECT policy
DROP POLICY IF EXISTS "Teachers can view answers in their school" ON answers;

-- Answers: Teachers can view answers for students in their branch
CREATE POLICY "Teachers can view answers in their branch"
  ON answers FOR SELECT
  USING (
    student_id IN (
      SELECT s.id 
      FROM students s
      INNER JOIN teacher_branches tb ON s.branch_id = tb.branch_id
      WHERE tb.teacher_id = auth.uid()
    )
  );

-- Answers: Teachers can delete answers for students in their branch
-- Note: CASCADE deletes bypass RLS, but this policy allows direct deletion if needed
CREATE POLICY "Teachers can delete answers in their branch"
  ON answers FOR DELETE
  USING (
    student_id IN (
      SELECT s.id 
      FROM students s
      INNER JOIN teacher_branches tb ON s.branch_id = tb.branch_id
      WHERE tb.teacher_id = auth.uid()
    )
  );

