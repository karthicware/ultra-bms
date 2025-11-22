-- Fix units table constraints to match entity definition
-- This migration adds NOT NULL constraints that were missing in previous migrations

-- Step 1: Update any NULL values to defaults (if any exist)
UPDATE units SET bedroom_count = 0 WHERE bedroom_count IS NULL;
UPDATE units SET bathroom_count = 0 WHERE bathroom_count IS NULL;
UPDATE units SET monthly_rent = 0 WHERE monthly_rent IS NULL;

-- Step 2: Add NOT NULL constraints to match entity definition
ALTER TABLE units ALTER COLUMN bedroom_count SET NOT NULL;
ALTER TABLE units ALTER COLUMN bathroom_count SET NOT NULL;
ALTER TABLE units ALTER COLUMN monthly_rent SET NOT NULL;

-- Step 3: Add constraint to ensure monthly_rent is positive
ALTER TABLE units ADD CONSTRAINT chk_monthly_rent_positive CHECK (monthly_rent > 0);

-- Add comments
COMMENT ON CONSTRAINT chk_monthly_rent_positive ON units IS 'Ensures monthly rent is always a positive value';
