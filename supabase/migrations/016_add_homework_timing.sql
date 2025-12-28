-- Add timing columns to homeworks table
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS total_time_seconds INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER; -- For future time limit feature

-- Add timing column to answers table
ALTER TABLE answers ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_homeworks_started_at ON homeworks(started_at);
CREATE INDEX IF NOT EXISTS idx_homeworks_completed_at ON homeworks(completed_at);

