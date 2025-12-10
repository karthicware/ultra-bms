-- =====================================================
-- SCP-2025-12-10: Add quotation modification and conversion tracking
-- =====================================================
-- This migration adds fields to track:
-- 1. Whether a quotation was modified after being sent (isModified)
-- 2. Conversion tracking when quotation becomes a tenant (convertedTenantId, convertedAt)
-- =====================================================

-- Add is_modified field to track if quotation was edited after SENT status
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT FALSE;

-- Add converted_tenant_id to reference the tenant created from this quotation
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS converted_tenant_id UUID;

-- Add converted_at timestamp to track when the conversion happened
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP;

-- Add foreign key constraint for converted_tenant_id
-- Note: Using IF NOT EXISTS pattern for PostgreSQL compatibility
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotation_converted_tenant'
    ) THEN
        ALTER TABLE quotations
        ADD CONSTRAINT fk_quotation_converted_tenant
        FOREIGN KEY (converted_tenant_id)
        REFERENCES tenants(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups by converted_tenant_id
CREATE INDEX IF NOT EXISTS idx_quotations_converted_tenant_id
ON quotations(converted_tenant_id)
WHERE converted_tenant_id IS NOT NULL;

-- Create index for finding modified quotations
CREATE INDEX IF NOT EXISTS idx_quotations_is_modified
ON quotations(is_modified)
WHERE is_modified = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN quotations.is_modified IS 'SCP-2025-12-10: True if quotation was edited after being sent';
COMMENT ON COLUMN quotations.converted_tenant_id IS 'SCP-2025-12-10: Reference to tenant created from this quotation';
COMMENT ON COLUMN quotations.converted_at IS 'SCP-2025-12-10: Timestamp when quotation was converted to tenant';
