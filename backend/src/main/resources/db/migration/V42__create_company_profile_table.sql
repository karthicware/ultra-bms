-- =============================================================================
-- Story 2.8: Company Profile Settings
-- Creates company_profile table for managing organization details
-- Single-record design - only one company profile allowed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: company_profile
-- Purpose: Store company information for invoices, PDC, emails, and documents
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_profile (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Company Information
    legal_company_name VARCHAR(255) NOT NULL,
    company_address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United Arab Emirates',

    -- Tax Registration
    trn VARCHAR(15) NOT NULL,

    -- Contact Information
    phone_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(255) NOT NULL,

    -- Logo (S3 key)
    logo_file_path VARCHAR(500),

    -- Audit fields
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT uk_company_profile_trn UNIQUE (trn),
    CONSTRAINT fk_company_profile_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    -- TRN format validation: 15 digits starting with 100
    CONSTRAINT chk_trn_format CHECK (trn ~ '^100[0-9]{12}$'),

    -- Phone format validation: +971 followed by 9 digits
    CONSTRAINT chk_phone_format CHECK (phone_number ~ '^\+971[0-9]{9}$')
);

-- -----------------------------------------------------------------------------
-- Singleton constraint: Only ONE company profile record allowed
-- This unique index on a constant ensures only one row can exist
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX idx_company_profile_singleton ON company_profile ((TRUE));

-- -----------------------------------------------------------------------------
-- Index for TRN lookups (if needed for validation)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_company_profile_trn ON company_profile(trn);

-- -----------------------------------------------------------------------------
-- Comments for documentation
-- -----------------------------------------------------------------------------
COMMENT ON TABLE company_profile IS 'Story 2.8: Company profile for invoices, PDC, emails, and official documents. Single-record design.';

COMMENT ON COLUMN company_profile.legal_company_name IS 'Legal company name as registered';
COMMENT ON COLUMN company_profile.trn IS 'UAE Tax Registration Number - 15 digits starting with 100';
COMMENT ON COLUMN company_profile.phone_number IS 'UAE phone format: +971 followed by 9 digits';
COMMENT ON COLUMN company_profile.logo_file_path IS 'S3 key for company logo (stored in /uploads/company/)';
