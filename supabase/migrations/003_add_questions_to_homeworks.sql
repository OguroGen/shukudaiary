-- Add questions column to homeworks table
ALTER TABLE homeworks ADD COLUMN questions JSONB;

-- Add index for questions column (optional, for performance)
CREATE INDEX idx_homeworks_questions ON homeworks USING GIN (questions);

