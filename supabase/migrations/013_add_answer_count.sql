-- Add answer_count column to homeworks table
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS answer_count INTEGER DEFAULT 0;

-- Initialize answer_count for existing homeworks
UPDATE homeworks
SET answer_count = (
  SELECT COUNT(*)
  FROM answers
  WHERE answers.homework_id = homeworks.id
);

-- Create function to update answer_count when answer is inserted
CREATE OR REPLACE FUNCTION update_homework_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE homeworks
  SET answer_count = answer_count + 1
  WHERE id = NEW.homework_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update answer_count on insert
DROP TRIGGER IF EXISTS trigger_update_answer_count ON answers;
CREATE TRIGGER trigger_update_answer_count
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_homework_answer_count();

-- Create function to update answer_count when answer is deleted
CREATE OR REPLACE FUNCTION update_homework_answer_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE homeworks
  SET answer_count = GREATEST(0, answer_count - 1)
  WHERE id = OLD.homework_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update answer_count on delete
DROP TRIGGER IF EXISTS trigger_update_answer_count_on_delete ON answers;
CREATE TRIGGER trigger_update_answer_count_on_delete
  AFTER DELETE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_homework_answer_count_on_delete();

