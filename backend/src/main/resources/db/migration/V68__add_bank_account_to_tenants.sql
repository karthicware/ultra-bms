-- =====================================================================
-- Migration: V68__add_bank_account_to_tenants.sql
-- Story 3.9: Tenant Onboarding Bank Account Integration
-- SCP: SCP-2025-12-10-bank-account-integration
-- Description: Adds bank_account_id foreign key to tenants table
-- AC #1: Add bank_account_id foreign key to tenants table (nullable)
-- AC #2: Foreign key references bank_accounts.id with ON DELETE SET NULL
-- =====================================================================

-- Add bank_account_id column to tenants table
-- Nullable field - tenants can exist without a linked bank account
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS bank_account_id UUID;

-- Add foreign key constraint
-- ON DELETE SET NULL: If bank account is deleted, set tenant's bank_account_id to NULL
-- This ensures tenant records remain intact even if the bank account is removed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenants_bank_account'
    ) THEN
        ALTER TABLE tenants
        ADD CONSTRAINT fk_tenants_bank_account
        FOREIGN KEY (bank_account_id)
        REFERENCES bank_accounts(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups by bank_account_id
-- Improves performance when querying tenants by bank account
CREATE INDEX IF NOT EXISTS idx_tenants_bank_account_id
ON tenants(bank_account_id)
WHERE bank_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tenants.bank_account_id IS 'Story 3.9: Optional reference to company bank account used for rent payment instructions on invoices';
