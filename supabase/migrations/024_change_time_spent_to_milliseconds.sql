-- Change time_spent_seconds to time_spent_milliseconds in answers table
-- Convert existing seconds values to milliseconds (multiply by 1000)

-- First, convert existing data: convert seconds to milliseconds
UPDATE answers 
SET time_spent_seconds = time_spent_seconds * 1000
WHERE time_spent_seconds IS NOT NULL;

-- Then rename the column
ALTER TABLE answers 
  RENAME COLUMN time_spent_seconds TO time_spent_milliseconds;

