-- =====================================================================
-- Migration: V52__create_bank_accounts_table.sql
-- Story 6.5: Bank Account Management
-- Description: Creates the bank_accounts table for managing company bank accounts
-- AC #11: BankAccount Entity with all required columns
-- AC #13: Flyway migration creates bank_accounts table
-- =====================================================================

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    -- Primary key (AC #11: id UUID)
    id UUID PRIMARY KEY,

    -- Bank identification (AC #11: bankName VARCHAR 100)
    bank_name VARCHAR(100) NOT NULL,

    -- Account identification (AC #11: accountName VARCHAR 255)
    account_name VARCHAR(255) NOT NULL,

    -- Account number - stored encrypted (AC #11, AC #12)
    -- VARCHAR(255) to accommodate encrypted value length
    account_number VARCHAR(255) NOT NULL,

    -- IBAN - stored encrypted, unique (AC #11, AC #12)
    -- UAE format: AE + 21 digits = 23 chars, but VARCHAR(255) for encrypted value
    iban VARCHAR(255) NOT NULL,

    -- SWIFT/BIC code (AC #11: swiftCode VARCHAR 11)
    swift_code VARCHAR(11) NOT NULL,

    -- Primary account flag (AC #11: isPrimary BOOLEAN default false)
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status (AC #11: status VARCHAR 20 default 'ACTIVE')
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    -- Audit fields (AC #11: createdBy UUID foreign key to users)
    created_by UUID NOT NULL REFERENCES users(id),

    -- Standard audit fields from BaseEntity
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Unique constraint on IBAN (AC #11: iban unique)
-- Note: Unique index on encrypted value - each encryption produces unique ciphertext
CREATE UNIQUE INDEX IF NOT EXISTS uk_bank_accounts_iban ON bank_accounts(iban);

-- Performance indexes (AC #13: indexes on iban, status)
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_primary ON bank_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_name ON bank_accounts(bank_name);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_created_by ON bank_accounts(created_by);

-- Composite index for active primary account lookup
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active_primary
    ON bank_accounts(status, is_primary)
    WHERE status = 'ACTIVE';

-- Add foreign key to pdcs table for bank_account_id (links to Story 6.3 PDC Management)
ALTER TABLE pdcs
    ADD CONSTRAINT fk_pdcs_bank_account
    FOREIGN KEY (bank_account_id)
    REFERENCES bank_accounts(id)
    ON DELETE SET NULL;

-- Comments for documentation
COMMENT ON TABLE bank_accounts IS 'Company bank accounts for financial operations (PDC deposits, payments)';
COMMENT ON COLUMN bank_accounts.id IS 'Primary key UUID';
COMMENT ON COLUMN bank_accounts.bank_name IS 'Name of the bank (max 100 chars)';
COMMENT ON COLUMN bank_accounts.account_name IS 'Account holder/name (max 255 chars)';
COMMENT ON COLUMN bank_accounts.account_number IS 'Bank account number - encrypted at rest with AES-256';
COMMENT ON COLUMN bank_accounts.iban IS 'International Bank Account Number - encrypted at rest, UAE format AE+21 digits';
COMMENT ON COLUMN bank_accounts.swift_code IS 'SWIFT/BIC code for international transfers (8 or 11 chars)';
COMMENT ON COLUMN bank_accounts.is_primary IS 'Only one account can be primary at a time';
COMMENT ON COLUMN bank_accounts.status IS 'Account status: ACTIVE or INACTIVE';
COMMENT ON COLUMN bank_accounts.created_by IS 'User who created this bank account';
