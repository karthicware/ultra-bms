-- V71: Add full_name and date_of_birth to quotations table
-- SCP-2025-12-12: Store Emirates ID OCR extracted data in quotation
-- These fields are extracted from Emirates ID front page during quotation creation

ALTER TABLE quotations ADD COLUMN full_name VARCHAR(255);
ALTER TABLE quotations ADD COLUMN date_of_birth DATE;

-- Add comment for clarity
COMMENT ON COLUMN quotations.full_name IS 'Full name extracted from Emirates ID OCR (overrides lead name)';
COMMENT ON COLUMN quotations.date_of_birth IS 'Date of birth extracted from Emirates ID OCR';
