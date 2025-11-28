-- ============================================================================
-- V39: Create Lease Extension and Renewal Request Tables
-- Story 3.6: Tenant Lease Extension and Renewal
-- ============================================================================

-- Lease Extension Status: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, APPLIED
-- Renewal Request Status: PENDING, APPROVED, REJECTED
-- Rent Adjustment Type: NO_CHANGE, PERCENTAGE, FLAT, CUSTOM

-- ============================================================================
-- LEASE EXTENSIONS TABLE
-- ============================================================================

CREATE TABLE lease_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_number VARCHAR(20) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Date fields
    previous_end_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    effective_date DATE NOT NULL,

    -- Rent fields (AED)
    previous_rent DECIMAL(12,2) NOT NULL,
    new_rent DECIMAL(12,2) NOT NULL,
    adjustment_type VARCHAR(20) NOT NULL,
    adjustment_value DECIMAL(12,2) DEFAULT 0,

    -- Terms
    renewal_type VARCHAR(20),
    auto_renewal BOOLEAN DEFAULT FALSE,
    special_terms TEXT,
    payment_due_date INTEGER,

    -- Workflow
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason VARCHAR(500),
    applied_at TIMESTAMP,

    -- Document
    amendment_document_path VARCHAR(500),

    -- Audit
    extended_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_lease_extensions_tenant_id ON lease_extensions(tenant_id);
CREATE INDEX idx_lease_extensions_status ON lease_extensions(status);
CREATE INDEX idx_lease_extensions_effective_date ON lease_extensions(effective_date);
CREATE INDEX idx_lease_extensions_extension_number ON lease_extensions(extension_number);

-- ============================================================================
-- RENEWAL REQUESTS TABLE
-- ============================================================================

CREATE TABLE renewal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(20) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Request details
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    preferred_term VARCHAR(20) NOT NULL,
    comments VARCHAR(500),

    -- Workflow
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejected_reason TEXT,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),

    -- Conversion tracking
    lease_extension_id UUID REFERENCES lease_extensions(id),

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_renewal_requests_tenant_id ON renewal_requests(tenant_id);
CREATE INDEX idx_renewal_requests_status ON renewal_requests(status);
CREATE INDEX idx_renewal_requests_requested_at ON renewal_requests(requested_at);

-- ============================================================================
-- ADD NOTIFICATION TRACKING AND AUTO-RENEWAL TO TENANTS
-- ============================================================================

-- Add auto-renewal field to tenants (if not exists)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT FALSE;

-- Add expiry notification tracking fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS expiry_60_day_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS expiry_30_day_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS expiry_14_day_notified BOOLEAN DEFAULT FALSE;

-- Add index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_tenants_lease_expiry_status
    ON tenants(lease_end_date, status)
    WHERE status = 'ACTIVE';
