-- Add 'test' plan type to schools table CHECK constraint
-- This allows test plan for testing purposes with unlimited students and presets

-- Drop the existing CHECK constraint (PostgreSQL auto-generates constraint names)
-- We need to find and drop the constraint by checking the constraint name
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'schools'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%plan_type%';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE schools DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Add new CHECK constraint that includes 'test' plan
ALTER TABLE schools 
ADD CONSTRAINT schools_plan_type_check 
CHECK (plan_type IN ('free', 'basic', 'standard', 'premium', 'test'));

