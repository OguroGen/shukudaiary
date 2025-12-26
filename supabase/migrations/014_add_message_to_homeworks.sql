-- Add message column to homeworks table
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS message TEXT;

