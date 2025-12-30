-- ============================================
-- 固定問題（fixed_questions）テーブルの作成
-- ============================================
-- 新しい算法を教えるときに使う、毎回同じ問題を保存するためのテーブル

CREATE TABLE fixed_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mul', 'div', 'mitori')),
  name TEXT NOT NULL,
  questions JSONB NOT NULL, -- 問題の配列を保存
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fixed_questions_school_id ON fixed_questions(school_id);
CREATE INDEX idx_fixed_questions_type ON fixed_questions(type);
CREATE INDEX idx_fixed_questions_questions ON fixed_questions USING GIN (questions);

-- Row Level Security (RLS) Policies
ALTER TABLE fixed_questions ENABLE ROW LEVEL SECURITY;

-- Teachers can view fixed questions in their school
CREATE POLICY "Teachers can view fixed questions in their school"
  ON fixed_questions FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

-- Teachers can manage fixed questions in their school
CREATE POLICY "Teachers can manage fixed questions in their school"
  ON fixed_questions FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    )
  );

