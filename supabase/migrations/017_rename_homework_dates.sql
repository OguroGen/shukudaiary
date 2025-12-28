-- Rename start_date and end_date to due_date_start and due_date_end
ALTER TABLE homeworks RENAME COLUMN start_date TO due_date_start;
ALTER TABLE homeworks RENAME COLUMN end_date TO due_date_end;

-- Update the CHECK constraint
ALTER TABLE homeworks DROP CONSTRAINT IF EXISTS homeworks_end_date_check;
ALTER TABLE homeworks ADD CONSTRAINT homeworks_due_date_check CHECK (due_date_end >= due_date_start);

-- Recreate the index with new column names
DROP INDEX IF EXISTS idx_homeworks_dates;
CREATE INDEX idx_homeworks_dates ON homeworks(due_date_start, due_date_end);

