-- Remove old digit columns from presets and homeworks tables
-- These columns have been replaced by parameter1, parameter2, etc.

-- Remove from presets table
ALTER TABLE presets DROP COLUMN IF EXISTS left_digits;
ALTER TABLE presets DROP COLUMN IF EXISTS right_digits;
ALTER TABLE presets DROP COLUMN IF EXISTS rows;

-- Remove from homeworks table
ALTER TABLE homeworks DROP COLUMN IF EXISTS left_digits;
ALTER TABLE homeworks DROP COLUMN IF EXISTS right_digits;
ALTER TABLE homeworks DROP COLUMN IF EXISTS rows;

