-- Add role column to teachers table
-- 先生の役割を管理するためのroleカラムを追加
-- サインアップ時に作成される最初の先生は'owner'、その他は'teacher'

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'teacher' 
CHECK (role IN ('owner', 'teacher'));

-- Create index for role (将来のクエリ最適化のため)
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);

-- Note: 既存の先生にはデフォルトで'teacher'が設定される
-- サインアップ時に作成される最初の先生には'owner'を設定

