-- Add status column to homeworks table
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started' 
  CHECK (status IN ('not_started', 'in_progress', 'completed'));

-- Create index for status column
CREATE INDEX IF NOT EXISTS idx_homeworks_status ON homeworks(status);

-- Initialize status for existing homeworks based on answer_count
UPDATE homeworks
SET status = CASE
  WHEN answer_count = 0 THEN 'not_started'
  WHEN answer_count < question_count THEN 'in_progress'
  WHEN answer_count >= question_count THEN 'completed'
  ELSE 'not_started'
END
WHERE status IS NULL OR status = 'not_started';

-- Update the existing trigger function to also update status
CREATE OR REPLACE FUNCTION update_homework_answer_count()
RETURNS TRIGGER AS $$
DECLARE
  new_answer_count INTEGER;
  question_count_val INTEGER;
BEGIN
  -- Get question_count first
  SELECT question_count INTO question_count_val
  FROM homeworks
  WHERE id = NEW.homework_id;
  
  -- Update answer_count and get the new value
  UPDATE homeworks
  SET answer_count = answer_count + 1
  WHERE id = NEW.homework_id
  RETURNING answer_count INTO new_answer_count;
  
  -- Update status based on new answer_count
  UPDATE homeworks
  SET status = CASE
    WHEN new_answer_count = 0 THEN 'not_started'
    WHEN new_answer_count < question_count_val THEN 'in_progress'
    WHEN new_answer_count >= question_count_val THEN 'completed'
    ELSE status
  END
  WHERE id = NEW.homework_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the delete trigger function to also update status
CREATE OR REPLACE FUNCTION update_homework_answer_count_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  new_answer_count INTEGER;
  question_count_val INTEGER;
BEGIN
  -- Get question_count first
  SELECT question_count INTO question_count_val
  FROM homeworks
  WHERE id = OLD.homework_id;
  
  -- Update answer_count and get the new value
  UPDATE homeworks
  SET answer_count = GREATEST(0, answer_count - 1)
  WHERE id = OLD.homework_id
  RETURNING answer_count INTO new_answer_count;
  
  -- Update status based on new answer_count
  UPDATE homeworks
  SET status = CASE
    WHEN new_answer_count = 0 THEN 'not_started'
    WHEN new_answer_count < question_count_val THEN 'in_progress'
    WHEN new_answer_count >= question_count_val THEN 'completed'
    ELSE status
  END
  WHERE id = OLD.homework_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

