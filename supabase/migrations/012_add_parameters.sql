-- Add parameter columns to homeworks and presets tables
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter1 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter2 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter3 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter4 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter5 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter6 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter7 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter8 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter9 INTEGER;
ALTER TABLE homeworks ADD COLUMN IF NOT EXISTS parameter10 INTEGER;

ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter1 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter2 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter3 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter4 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter5 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter6 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter7 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter8 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter9 INTEGER;
ALTER TABLE presets ADD COLUMN IF NOT EXISTS parameter10 INTEGER;

-- Migrate existing data
-- For mul: parameter1 = left_digits, parameter2 = right_digits
UPDATE homeworks 
SET parameter1 = left_digits, parameter2 = right_digits
WHERE type = 'mul' AND parameter1 IS NULL;

UPDATE presets 
SET parameter1 = left_digits, parameter2 = right_digits
WHERE type = 'mul' AND parameter1 IS NULL;

-- For div: parameter1 = right_digits (除数), parameter2 = left_digits (商)
UPDATE homeworks 
SET parameter1 = right_digits, parameter2 = left_digits
WHERE type = 'div' AND parameter1 IS NULL;

UPDATE presets 
SET parameter1 = right_digits, parameter2 = left_digits
WHERE type = 'div' AND parameter1 IS NULL;

-- For mitori: parameter1 = left_digits, parameter2 = rows
UPDATE homeworks 
SET parameter1 = left_digits, parameter2 = rows
WHERE type = 'mitori' AND parameter1 IS NULL;

UPDATE presets 
SET parameter1 = left_digits, parameter2 = rows
WHERE type = 'mitori' AND parameter1 IS NULL;

