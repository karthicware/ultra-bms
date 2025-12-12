-- V72: Refactor tenant name columns - replace first_name/last_name with full_name
-- SCP-2025-12-12: Store full name from Emirates ID OCR directly without splitting

-- Step 1: Add full_name column (nullable initially for migration)
ALTER TABLE tenants ADD COLUMN full_name VARCHAR(255);

-- Step 2: Migrate existing data by concatenating first_name and last_name
UPDATE tenants SET full_name = CONCAT(first_name, ' ', last_name) WHERE full_name IS NULL;

-- Step 3: Make full_name NOT NULL after data migration
ALTER TABLE tenants ALTER COLUMN full_name SET NOT NULL;

-- Step 4: Drop the old columns
ALTER TABLE tenants DROP COLUMN first_name;
ALTER TABLE tenants DROP COLUMN last_name;

-- Add comment for clarity
COMMENT ON COLUMN tenants.full_name IS 'Full name from Emirates ID OCR (replaces first_name/last_name)';
