-- Add plan_type column to schools table
-- Default is 'free' for existing schools
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free' 
CHECK (plan_type IN ('free', 'basic', 'standard', 'premium'));

-- Create index for plan_type
CREATE INDEX IF NOT EXISTS idx_schools_plan_type ON schools(plan_type);

