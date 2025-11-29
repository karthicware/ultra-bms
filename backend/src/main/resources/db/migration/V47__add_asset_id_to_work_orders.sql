-- V47: Add asset_id to work_orders table
-- Story 7.1: Asset Registry and Tracking
-- Adds FK to link work orders with assets for maintenance tracking

-- ============================================================================
-- ADD ASSET_ID COLUMN TO WORK_ORDERS
-- ============================================================================

-- Add asset_id column
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS asset_id UUID;

-- Add foreign key constraint
ALTER TABLE work_orders
ADD CONSTRAINT fk_work_orders_asset FOREIGN KEY (asset_id) REFERENCES assets(id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for asset-based work order queries
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);

-- Composite index for asset maintenance history queries
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_status ON work_orders(asset_id, status)
    WHERE asset_id IS NOT NULL;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON COLUMN work_orders.asset_id IS 'Optional asset link for equipment maintenance work orders';
