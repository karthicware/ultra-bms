-- V63: Remove identity document fields from leads table
-- SCP-2025-12-06: Identity documents are now collected during quotation workflow, not lead creation
-- These fields are stored in the quotations table instead

-- Drop the identity columns from leads table
ALTER TABLE leads DROP COLUMN IF EXISTS emirates_id;
ALTER TABLE leads DROP COLUMN IF EXISTS passport_number;
ALTER TABLE leads DROP COLUMN IF EXISTS passport_expiry_date;
ALTER TABLE leads DROP COLUMN IF EXISTS home_country;

-- Add comment documenting this change
COMMENT ON TABLE leads IS 'Lead management table - identity documents collected during quotation workflow (SCP-2025-12-06)';
