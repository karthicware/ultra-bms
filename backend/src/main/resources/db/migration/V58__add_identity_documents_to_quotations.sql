-- V58: Add identity document fields to quotations table
-- SCP-2025-12-04: Moving identity document collection from Leads to Quotations
-- This allows document collection during quotation creation instead of lead creation

-- Add identity document fields
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS emirates_id_number VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS emirates_id_expiry DATE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Add document file paths (stored in S3)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS emirates_id_front_path VARCHAR(500);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS emirates_id_back_path VARCHAR(500);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS passport_path VARCHAR(500);

-- Make stay_type nullable (being removed from frontend)
ALTER TABLE quotations ALTER COLUMN stay_type DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN quotations.emirates_id_number IS 'Emirates ID number (format: 784-XXXX-XXXXXXX-X)';
COMMENT ON COLUMN quotations.emirates_id_expiry IS 'Emirates ID expiry date';
COMMENT ON COLUMN quotations.passport_number IS 'Passport number';
COMMENT ON COLUMN quotations.passport_expiry IS 'Passport expiry date';
COMMENT ON COLUMN quotations.nationality IS 'Lead nationality/home country';
COMMENT ON COLUMN quotations.emirates_id_front_path IS 'S3 path to Emirates ID front image';
COMMENT ON COLUMN quotations.emirates_id_back_path IS 'S3 path to Emirates ID back image';
COMMENT ON COLUMN quotations.passport_path IS 'S3 path to passport image';
