-- Add 'cancelled' status to homeworks table
ALTER TABLE homeworks DROP CONSTRAINT IF EXISTS homeworks_status_check;
ALTER TABLE homeworks ADD CONSTRAINT homeworks_status_check 
  CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled'));

-- Update the trigger function to not override 'cancelled' status
CREATE OR REPLACE FUNCTION update_homework_answer_count()
RETURNS TRIGGER AS $$
DECLARE
  new_answer_count INTEGER;
  question_count_val INTEGER;
  current_status TEXT;
BEGIN
  -- Get question_count and current status first
  SELECT question_count, status INTO question_count_val, current_status
  FROM homeworks
  WHERE id = NEW.homework_id;
  
  -- Don't update status if it's already cancelled
  IF current_status = 'cancelled' THEN
    -- Still update answer_count but don't change status
    UPDATE homeworks
    SET answer_count = answer_count + 1
    WHERE id = NEW.homework_id;
    RETURN NEW;
  END IF;
  
  -- Update answer_count and get the new value
  UPDATE homeworks
  SET answer_count = answer_count + 1
  WHERE id = NEW.homework_id
  RETURNING answer_count INTO new_answer_count;
  
  -- Update status based on new answer_count (only if not cancelled)
  UPDATE homeworks
  SET status = CASE
    WHEN new_answer_count = 0 THEN 'not_started'
    WHEN new_answer_count < question_count_val THEN 'in_progress'
    WHEN new_answer_count >= question_count_val THEN 'completed'
    ELSE status
  END
  WHERE id = NEW.homework_id AND status != 'cancelled';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the delete trigger function to not override 'cancelled' status
CREATE OR REPLACE FUNCTION update_homework_answer_count_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  new_answer_count INTEGER;
  question_count_val INTEGER;
  current_status TEXT;
BEGIN
  -- Get question_count and current status first
  SELECT question_count, status INTO question_count_val, current_status
  FROM homeworks
  WHERE id = OLD.homework_id;
  
  -- Don't update status if it's already cancelled
  IF current_status = 'cancelled' THEN
    -- Still update answer_count but don't change status
    UPDATE homeworks
    SET answer_count = GREATEST(0, answer_count - 1)
    WHERE id = OLD.homework_id;
    RETURN OLD;
  END IF;
  
  -- Update answer_count and get the new value
  UPDATE homeworks
  SET answer_count = GREATEST(0, answer_count - 1)
  WHERE id = OLD.homework_id
  RETURNING answer_count INTO new_answer_count;
  
  -- Update status based on new answer_count (only if not cancelled)
  UPDATE homeworks
  SET status = CASE
    WHEN new_answer_count = 0 THEN 'not_started'
    WHEN new_answer_count < question_count_val THEN 'in_progress'
    WHEN new_answer_count >= question_count_val THEN 'completed'
    ELSE status
  END
  WHERE id = OLD.homework_id AND status != 'cancelled';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

