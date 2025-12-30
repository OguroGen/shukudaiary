-- Add last_preset_ids column to students table
-- 生徒ごと・種目ごとの最新プリセットIDを保存するためのJSONBカラム
ALTER TABLE students ADD COLUMN last_preset_ids JSONB DEFAULT '{}'::jsonb;

-- Add index for JSONB search performance
CREATE INDEX idx_students_last_preset_ids ON students USING GIN (last_preset_ids);

