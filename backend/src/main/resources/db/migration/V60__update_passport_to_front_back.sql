-- V60: Update passport document storage to support front and back sides
-- Previously had single passport_path, now split into passport_front_path and passport_back_path
-- Note: This migration is idempotent - safe to run if columns already exist

-- Add new columns for passport front and back (IF NOT EXISTS ensures idempotence)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS passport_front_path VARCHAR(500);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS passport_back_path VARCHAR(500);

-- Migrate existing data: copy passport_path to passport_front_path (if passport_path column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'passport_path') THEN
        UPDATE quotations SET passport_front_path = passport_path WHERE passport_path IS NOT NULL AND passport_front_path IS NULL;
        ALTER TABLE quotations DROP COLUMN passport_path;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN quotations.passport_front_path IS 'S3 path to passport front side image';
COMMENT ON COLUMN quotations.passport_back_path IS 'S3 path to passport back side image';
