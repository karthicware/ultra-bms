-- =====================================================================
-- Migration: V44__create_pdcs_table.sql
-- Story 6.3: Post-Dated Cheque (PDC) Management
-- Description: Creates the pdcs table for managing post-dated cheques
-- =====================================================================

-- Create PDC table
CREATE TABLE IF NOT EXISTS pdcs (
    -- Primary key
    id UUID PRIMARY KEY,

    -- Cheque identification
    cheque_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,

    -- Tenant relationship (required)
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Invoice relationship (optional, for payment recording)
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    -- Lease reference (optional)
    lease_id UUID,

    -- Amount
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),

    -- Dates
    cheque_date DATE NOT NULL,
    deposit_date DATE,
    cleared_date DATE,
    bounced_date DATE,
    withdrawal_date DATE,

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'
        CHECK (status IN ('RECEIVED', 'DUE', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED', 'REPLACED', 'WITHDRAWN')),

    -- Bounce handling
    bounce_reason VARCHAR(255),

    -- Withdrawal handling
    withdrawal_reason VARCHAR(255),
    new_payment_method VARCHAR(20)
        CHECK (new_payment_method IS NULL OR new_payment_method IN ('BANK_TRANSFER', 'CASH', 'NEW_CHEQUE')),
    transaction_id VARCHAR(100),

    -- Replacement chain
    replacement_pdc_id UUID REFERENCES pdcs(id) ON DELETE SET NULL,
    original_pdc_id UUID REFERENCES pdcs(id) ON DELETE SET NULL,

    -- Bank account for deposit (from Story 6.5)
    bank_account_id UUID,

    -- Notes
    notes VARCHAR(500),

    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Unique constraint: cheque number per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uk_pdc_cheque_tenant
    ON pdcs(cheque_number, tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_pdcs_tenant_id ON pdcs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pdcs_status ON pdcs(status);
CREATE INDEX IF NOT EXISTS idx_pdcs_cheque_date ON pdcs(cheque_date);
CREATE INDEX IF NOT EXISTS idx_pdcs_cheque_number ON pdcs(cheque_number);
CREATE INDEX IF NOT EXISTS idx_pdcs_deposit_date ON pdcs(deposit_date);
CREATE INDEX IF NOT EXISTS idx_pdcs_invoice_id ON pdcs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_pdcs_lease_id ON pdcs(lease_id);
CREATE INDEX IF NOT EXISTS idx_pdcs_bank_name ON pdcs(bank_name);
CREATE INDEX IF NOT EXISTS idx_pdcs_status_cheque_date ON pdcs(status, cheque_date);
CREATE INDEX IF NOT EXISTS idx_pdcs_created_at ON pdcs(created_at);

-- Composite index for dashboard queries (upcoming due PDCs)
CREATE INDEX IF NOT EXISTS idx_pdcs_status_cheque_date_upcoming
    ON pdcs(status, cheque_date)
    WHERE status IN ('RECEIVED', 'DUE');

-- Index for withdrawal history queries
CREATE INDEX IF NOT EXISTS idx_pdcs_withdrawn_date
    ON pdcs(withdrawal_date)
    WHERE status = 'WITHDRAWN';

-- Comments for documentation
COMMENT ON TABLE pdcs IS 'Post-Dated Cheques received from tenants';
COMMENT ON COLUMN pdcs.cheque_number IS 'Physical cheque number (unique per tenant)';
COMMENT ON COLUMN pdcs.bank_name IS 'Issuing bank name';
COMMENT ON COLUMN pdcs.tenant_id IS 'Tenant who issued the cheque';
COMMENT ON COLUMN pdcs.invoice_id IS 'Linked invoice for auto-payment recording';
COMMENT ON COLUMN pdcs.lease_id IS 'Associated lease reference';
COMMENT ON COLUMN pdcs.amount IS 'Cheque amount in AED';
COMMENT ON COLUMN pdcs.cheque_date IS 'Post-dated cheque date';
COMMENT ON COLUMN pdcs.deposit_date IS 'Date deposited to bank';
COMMENT ON COLUMN pdcs.cleared_date IS 'Date payment confirmed';
COMMENT ON COLUMN pdcs.bounced_date IS 'Date payment failed';
COMMENT ON COLUMN pdcs.withdrawal_date IS 'Date returned to tenant';
COMMENT ON COLUMN pdcs.status IS 'Current PDC status: RECEIVED, DUE, DEPOSITED, CLEARED, BOUNCED, CANCELLED, REPLACED, WITHDRAWN';
COMMENT ON COLUMN pdcs.bounce_reason IS 'Reason for bounce (insufficient funds, signature mismatch, etc.)';
COMMENT ON COLUMN pdcs.withdrawal_reason IS 'Reason for withdrawal';
COMMENT ON COLUMN pdcs.new_payment_method IS 'Alternative payment method when withdrawn';
COMMENT ON COLUMN pdcs.transaction_id IS 'Transaction ID for alternative payment';
COMMENT ON COLUMN pdcs.replacement_pdc_id IS 'Reference to replacement PDC when bounced';
COMMENT ON COLUMN pdcs.original_pdc_id IS 'Reference to original PDC when this is a replacement';
COMMENT ON COLUMN pdcs.bank_account_id IS 'Company bank account where deposited (from Story 6.5)';
