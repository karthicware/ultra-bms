-- V45: Create assets table
-- Story 7.1: Asset Registry and Tracking
-- Creates table for asset management, equipment tracking, and warranty monitoring

-- ============================================================================
-- SEQUENCES
-- ============================================================================

-- Sequence for asset number generation (reset per year)
CREATE SEQUENCE IF NOT EXISTS asset_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================================
-- ASSETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Asset Identification
    asset_number VARCHAR(15) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,

    -- Category and Status
    category VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    status_notes VARCHAR(500),

    -- Property Association
    property_id UUID NOT NULL,

    -- Location within Property
    location VARCHAR(200) NOT NULL,

    -- Equipment Details
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),

    -- Dates
    installation_date DATE,
    warranty_expiry_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,

    -- Financial Information
    purchase_cost DECIMAL(12, 2),
    estimated_useful_life INTEGER,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit Fields
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign Key Constraints
    CONSTRAINT fk_assets_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_assets_created_by FOREIGN KEY (created_by) REFERENCES users(id),

    -- Check Constraints
    CONSTRAINT ck_assets_category CHECK (category IN (
        'HVAC', 'ELEVATOR', 'GENERATOR', 'WATER_PUMP', 'FIRE_SYSTEM',
        'SECURITY_SYSTEM', 'ELECTRICAL_PANEL', 'PLUMBING_FIXTURE', 'APPLIANCE', 'OTHER'
    )),
    CONSTRAINT ck_assets_status CHECK (status IN (
        'ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DISPOSED'
    )),
    CONSTRAINT ck_assets_purchase_cost CHECK (purchase_cost IS NULL OR purchase_cost >= 0),
    CONSTRAINT ck_assets_useful_life CHECK (
        estimated_useful_life IS NULL OR (estimated_useful_life >= 1 AND estimated_useful_life <= 100)
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Standard indexes for common query patterns
CREATE INDEX idx_assets_property_id ON assets(property_id);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_asset_number ON assets(asset_number);
CREATE INDEX idx_assets_warranty_expiry ON assets(warranty_expiry_date);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);

-- Composite index for asset filtering (exclude soft deleted)
CREATE INDEX idx_assets_filter ON assets(property_id, category, status)
    WHERE is_deleted = FALSE AND status != 'DISPOSED';

-- Index for soft delete filtering
CREATE INDEX idx_assets_not_deleted ON assets(created_at DESC)
    WHERE is_deleted = FALSE;

-- Partial index for active assets
CREATE INDEX idx_assets_active ON assets(created_at DESC)
    WHERE is_deleted = FALSE AND status = 'ACTIVE';

-- Index for warranty expiry alerts (30-day window)
CREATE INDEX idx_assets_warranty_expiring ON assets(warranty_expiry_date)
    WHERE warranty_expiry_date IS NOT NULL AND status = 'ACTIVE';

-- Index for maintenance scheduling
CREATE INDEX idx_assets_next_maintenance ON assets(next_maintenance_date)
    WHERE next_maintenance_date IS NOT NULL AND status IN ('ACTIVE', 'UNDER_MAINTENANCE');

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE assets IS 'Asset registry for equipment and property assets';
COMMENT ON COLUMN assets.asset_number IS 'Unique asset number (format: AST-YYYY-NNNN)';
COMMENT ON COLUMN assets.asset_name IS 'Human-readable asset name/title';
COMMENT ON COLUMN assets.category IS 'Asset category: HVAC, ELEVATOR, GENERATOR, etc.';
COMMENT ON COLUMN assets.status IS 'Asset status: ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED';
COMMENT ON COLUMN assets.status_notes IS 'Notes explaining status changes (audit trail)';
COMMENT ON COLUMN assets.property_id IS 'Property where asset is located (required)';
COMMENT ON COLUMN assets.location IS 'Physical location within property (e.g., Rooftop, Basement)';
COMMENT ON COLUMN assets.manufacturer IS 'Manufacturer/brand name';
COMMENT ON COLUMN assets.model_number IS 'Model number/identifier';
COMMENT ON COLUMN assets.serial_number IS 'Serial number for identification';
COMMENT ON COLUMN assets.installation_date IS 'Date asset was installed/commissioned';
COMMENT ON COLUMN assets.warranty_expiry_date IS 'Date warranty expires (null if no warranty)';
COMMENT ON COLUMN assets.last_maintenance_date IS 'Date of last maintenance (auto-updated from work orders)';
COMMENT ON COLUMN assets.next_maintenance_date IS 'Scheduled date for next maintenance';
COMMENT ON COLUMN assets.purchase_cost IS 'Original purchase cost in AED';
COMMENT ON COLUMN assets.estimated_useful_life IS 'Expected useful life in years';
COMMENT ON SEQUENCE asset_number_seq IS 'Sequence for generating unique asset numbers per year';
