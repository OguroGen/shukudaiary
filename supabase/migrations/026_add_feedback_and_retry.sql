-- Add feedback_mode and retry_count columns to homeworks table
ALTER TABLE homeworks 
ADD COLUMN IF NOT EXISTS feedback_mode TEXT DEFAULT 'all_at_once' 
CHECK (feedback_mode IN ('all_at_once', 'immediate'));

ALTER TABLE homeworks 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 
CHECK (retry_count >= 0);

-- Add retry_attempt column to answers table to track which retry attempt this answer is
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS retry_attempt INTEGER DEFAULT 0 
CHECK (retry_attempt >= 0);

