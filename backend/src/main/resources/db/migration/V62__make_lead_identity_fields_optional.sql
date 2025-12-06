-- V62: Make identity document fields optional on leads table
-- SCP-2025-12-04: Identity documents moved to quotation workflow
-- Leads can now be created without identity documents, which are collected later during quotation

-- Make emirates_id nullable
ALTER TABLE leads ALTER COLUMN emirates_id DROP NOT NULL;

-- Make passport_number nullable
ALTER TABLE leads ALTER COLUMN passport_number DROP NOT NULL;

-- Make passport_expiry_date nullable
ALTER TABLE leads ALTER COLUMN passport_expiry_date DROP NOT NULL;

-- Make home_country nullable
ALTER TABLE leads ALTER COLUMN home_country DROP NOT NULL;

-- Add comment to document this change
COMMENT ON COLUMN leads.emirates_id IS 'Optional - collected during quotation workflow (SCP-2025-12-04)';
COMMENT ON COLUMN leads.passport_number IS 'Optional - collected during quotation workflow (SCP-2025-12-04)';
COMMENT ON COLUMN leads.passport_expiry_date IS 'Optional - collected during quotation workflow (SCP-2025-12-04)';
COMMENT ON COLUMN leads.home_country IS 'Optional - collected during quotation workflow (SCP-2025-12-04)';
