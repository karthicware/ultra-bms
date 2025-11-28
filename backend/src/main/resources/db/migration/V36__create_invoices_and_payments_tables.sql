-- V36: Create invoices and payments tables
-- Story 6.1: Rent Invoicing and Payment Management
-- Creates tables for invoice generation, payment tracking, and financial management

-- ============================================================================
-- SEQUENCES
-- ============================================================================

-- Sequence for invoice number generation
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Sequence for payment number generation
CREATE SEQUENCE IF NOT EXISTS payment_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Invoice Identification
    invoice_number VARCHAR(20) NOT NULL UNIQUE,

    -- Tenant and Property References
    tenant_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    property_id UUID NOT NULL,
    lease_id UUID,

    -- Invoice Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,

    -- Amount Breakdown
    base_rent DECIMAL(12, 2) NOT NULL,
    service_charges DECIMAL(12, 2) DEFAULT 0.00,
    parking_fees DECIMAL(12, 2) DEFAULT 0.00,
    additional_charges JSONB DEFAULT '[]'::jsonb,
    late_fee DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    balance_amount DECIMAL(12, 2) NOT NULL,

    -- Status and Tracking
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    late_fee_applied BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(500),
    created_by UUID,

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign Key Constraints
    CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_invoices_unit FOREIGN KEY (unit_id) REFERENCES units(id),
    CONSTRAINT fk_invoices_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(id),

    -- Check Constraints
    CONSTRAINT ck_invoices_base_rent CHECK (base_rent >= 0),
    CONSTRAINT ck_invoices_service_charges CHECK (service_charges >= 0),
    CONSTRAINT ck_invoices_parking_fees CHECK (parking_fees >= 0),
    CONSTRAINT ck_invoices_late_fee CHECK (late_fee >= 0),
    CONSTRAINT ck_invoices_total_amount CHECK (total_amount >= 0),
    CONSTRAINT ck_invoices_paid_amount CHECK (paid_amount >= 0),
    CONSTRAINT ck_invoices_balance_amount CHECK (balance_amount >= 0),
    CONSTRAINT ck_invoices_due_after_invoice CHECK (due_date >= invoice_date),
    CONSTRAINT ck_invoices_status CHECK (status IN ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'))
);

-- Standard indexes for common query patterns
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_property_id ON invoices(property_id);
CREATE INDEX idx_invoices_unit_id ON invoices(unit_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Composite index for overdue query
CREATE INDEX idx_invoices_overdue ON invoices(status, due_date) WHERE status IN ('SENT', 'PARTIALLY_PAID');

-- Partial index for outstanding invoices
CREATE INDEX idx_invoices_outstanding ON invoices(tenant_id, due_date) WHERE status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE');

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Payment Identification
    payment_number VARCHAR(20) NOT NULL UNIQUE,

    -- Invoice and Tenant References
    invoice_id UUID NOT NULL,
    tenant_id UUID NOT NULL,

    -- Payment Details
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_date DATE NOT NULL,
    transaction_reference VARCHAR(100),
    notes VARCHAR(500),

    -- Receipt Information
    receipt_file_path VARCHAR(500),

    -- Audit Fields
    recorded_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign Key Constraints
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_payments_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id),

    -- Check Constraints
    CONSTRAINT ck_payments_amount CHECK (amount > 0),
    CONSTRAINT ck_payments_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'PDC', 'ONLINE'))
);

-- Standard indexes for common query patterns
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_payment_number ON payments(payment_number);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Composite index for payment history queries
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date DESC);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

-- Invoices table comments
COMMENT ON TABLE invoices IS 'Rent invoices for tenants with payment tracking';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number (format: INV-YYYY-NNNN)';
COMMENT ON COLUMN invoices.status IS 'Invoice status: DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED';
COMMENT ON COLUMN invoices.base_rent IS 'Base monthly rent amount in AED';
COMMENT ON COLUMN invoices.service_charges IS 'Monthly service charges in AED';
COMMENT ON COLUMN invoices.parking_fees IS 'Monthly parking fees in AED';
COMMENT ON COLUMN invoices.additional_charges IS 'JSON array of additional charge objects: [{description, amount}]';
COMMENT ON COLUMN invoices.late_fee IS 'Late fee amount applied in AED';
COMMENT ON COLUMN invoices.total_amount IS 'Total invoice amount (sum of all charges)';
COMMENT ON COLUMN invoices.paid_amount IS 'Amount paid so far';
COMMENT ON COLUMN invoices.balance_amount IS 'Outstanding balance (total_amount - paid_amount)';
COMMENT ON COLUMN invoices.late_fee_applied IS 'Flag indicating if late fee has been applied';
COMMENT ON SEQUENCE invoice_number_seq IS 'Sequence for generating unique invoice numbers per year';

-- Payments table comments
COMMENT ON TABLE payments IS 'Payment records against invoices';
COMMENT ON COLUMN payments.payment_number IS 'Unique payment number (format: PMT-YYYY-NNNN)';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: CASH, BANK_TRANSFER, CARD, CHEQUE, PDC, ONLINE';
COMMENT ON COLUMN payments.transaction_reference IS 'External reference (bank transfer ref, cheque number, etc.)';
COMMENT ON COLUMN payments.receipt_file_path IS 'S3 path to payment receipt PDF';
COMMENT ON COLUMN payments.recorded_by IS 'User who recorded this payment';
COMMENT ON SEQUENCE payment_number_seq IS 'Sequence for generating unique payment numbers per year';
