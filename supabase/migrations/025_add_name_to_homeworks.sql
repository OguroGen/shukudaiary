-- Add name column to homeworks table
-- 宿題に名前を付けるためのカラムを追加

ALTER TABLE homeworks ADD COLUMN name TEXT;

-- Add index for name column (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_homeworks_name ON homeworks(name);

