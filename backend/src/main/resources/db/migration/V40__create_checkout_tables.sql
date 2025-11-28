-- =============================================================================
-- Story 3.7: Tenant Checkout and Deposit Refund Processing
-- Creates tables for tenant checkout workflow and deposit refund management
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: tenant_checkouts
-- Purpose: Track tenant checkout process from notice to completion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_checkouts (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    checkout_number VARCHAR(20) NOT NULL,

    -- Foreign keys
    tenant_id UUID NOT NULL,
    property_id UUID NOT NULL,
    unit_id UUID NOT NULL,

    -- Notice details
    notice_date DATE NOT NULL,
    expected_move_out_date DATE NOT NULL,
    actual_move_out_date DATE,
    checkout_reason VARCHAR(30) NOT NULL,
    reason_notes VARCHAR(500),

    -- Inspection details
    inspection_date DATE,
    inspection_time VARCHAR(20),
    inspector_id UUID,
    inspection_checklist JSONB,
    inspection_photos JSONB,
    overall_condition INTEGER CHECK (overall_condition >= 1 AND overall_condition <= 5),
    inspection_notes TEXT,

    -- Settlement
    settlement_type VARCHAR(20),
    settlement_notes TEXT,

    -- Workflow status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMP,
    completed_by UUID,

    -- Documents
    inspection_report_path VARCHAR(500),
    deposit_statement_path VARCHAR(500),
    final_settlement_path VARCHAR(500),

    -- Audit fields
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT uk_checkout_number UNIQUE (checkout_number),
    CONSTRAINT fk_checkouts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_checkouts_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT,
    CONSTRAINT fk_checkouts_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
    CONSTRAINT fk_checkouts_inspector FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_checkout_reason CHECK (checkout_reason IN ('LEASE_END', 'EARLY_TERMINATION', 'EVICTION', 'MUTUAL_AGREEMENT', 'OTHER')),
    CONSTRAINT chk_checkout_status CHECK (status IN ('PENDING', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETE', 'DEPOSIT_CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'REFUND_PROCESSING', 'REFUND_PROCESSED', 'COMPLETED', 'ON_HOLD'))
);

-- Indexes for tenant_checkouts
CREATE INDEX IF NOT EXISTS idx_checkouts_tenant_id ON tenant_checkouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_property_id ON tenant_checkouts(property_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON tenant_checkouts(status);
CREATE INDEX IF NOT EXISTS idx_checkouts_move_out_date ON tenant_checkouts(expected_move_out_date);
CREATE INDEX IF NOT EXISTS idx_checkouts_created_at ON tenant_checkouts(created_at);

-- -----------------------------------------------------------------------------
-- Table: deposit_refunds
-- Purpose: Track deposit refund calculations and processing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposit_refunds (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to checkout
    checkout_id UUID NOT NULL,

    -- Amounts
    original_deposit DECIMAL(12, 2) NOT NULL,
    deductions JSONB,
    total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_refund DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_owed_by_tenant DECIMAL(12, 2),

    -- Refund method
    refund_method VARCHAR(20),
    refund_date DATE,
    refund_reference VARCHAR(30),

    -- Bank transfer details
    bank_name VARCHAR(100),
    account_holder_name VARCHAR(200),
    iban VARCHAR(50),
    swift_code VARCHAR(11),

    -- Cheque details
    cheque_number VARCHAR(50),
    cheque_date DATE,

    -- Status and workflow
    refund_status VARCHAR(20) NOT NULL DEFAULT 'CALCULATED',
    approved_by UUID,
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    transaction_id VARCHAR(100),
    notes VARCHAR(500),

    -- Document
    receipt_path VARCHAR(500),

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT uk_refund_reference UNIQUE (refund_reference),
    CONSTRAINT fk_refunds_checkout FOREIGN KEY (checkout_id) REFERENCES tenant_checkouts(id) ON DELETE CASCADE,
    CONSTRAINT chk_refund_method CHECK (refund_method IS NULL OR refund_method IN ('BANK_TRANSFER', 'CHEQUE', 'CASH')),
    CONSTRAINT chk_refund_status CHECK (refund_status IN ('CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'COMPLETED', 'ON_HOLD')),
    CONSTRAINT chk_amounts CHECK (original_deposit >= 0 AND total_deductions >= 0 AND net_refund >= 0)
);

-- Indexes for deposit_refunds
CREATE INDEX IF NOT EXISTS idx_refunds_checkout_id ON deposit_refunds(checkout_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON deposit_refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_date ON deposit_refunds(refund_date);

-- -----------------------------------------------------------------------------
-- Sequence for checkout numbers
-- Format: CHK-YYYY-NNNN (e.g., CHK-2025-0001)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS checkout_number_seq START WITH 1 INCREMENT BY 1;

-- -----------------------------------------------------------------------------
-- Sequence for refund reference numbers
-- Format: REF-YYYY-NNNN (e.g., REF-2025-0001)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS refund_reference_seq START WITH 1 INCREMENT BY 1;

-- -----------------------------------------------------------------------------
-- Function to generate checkout number
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_checkout_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    seq_val INTEGER;
    year_str VARCHAR(4);
BEGIN
    seq_val := nextval('checkout_number_seq');
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    RETURN 'CHK-' || year_str || '-' || LPAD(seq_val::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Function to generate refund reference
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_refund_reference()
RETURNS VARCHAR(30) AS $$
DECLARE
    seq_val INTEGER;
    year_str VARCHAR(4);
BEGIN
    seq_val := nextval('refund_reference_seq');
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    RETURN 'REF-' || year_str || '-' || LPAD(seq_val::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Comments for documentation
-- -----------------------------------------------------------------------------
COMMENT ON TABLE tenant_checkouts IS 'Story 3.7: Tracks tenant checkout process from notice to completion';
COMMENT ON TABLE deposit_refunds IS 'Story 3.7: Tracks deposit refund calculation, approval, and processing';

COMMENT ON COLUMN tenant_checkouts.checkout_number IS 'Unique checkout identifier (CHK-YYYY-NNNN)';
COMMENT ON COLUMN tenant_checkouts.inspection_checklist IS 'JSON: Room-by-room condition checklist';
COMMENT ON COLUMN tenant_checkouts.inspection_photos IS 'JSON: Array of photo metadata with S3 paths';

COMMENT ON COLUMN deposit_refunds.deductions IS 'JSON: Array of deduction items {type, description, amount, notes, autoCalculated}';
COMMENT ON COLUMN deposit_refunds.iban IS 'UAE IBAN format: AE + 21 alphanumeric characters';
COMMENT ON COLUMN deposit_refunds.refund_reference IS 'Unique refund reference (REF-YYYY-NNNN)';
