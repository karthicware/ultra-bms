-- Add missing columns to units table to match Unit entity
-- These columns were added to the entity but migrations were not created

-- Add active column for soft delete functionality
ALTER TABLE units
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Add created_by column to track who created the unit
ALTER TABLE units
ADD COLUMN created_by UUID;

-- Add monthly_rent column to store unit rent amount
ALTER TABLE units
ADD COLUMN monthly_rent NUMERIC(12, 2);

-- Add features column to store unit features as JSON
ALTER TABLE units
ADD COLUMN features JSONB;

-- Add indexes
CREATE INDEX idx_units_active ON units(active);
CREATE INDEX idx_units_monthly_rent ON units(monthly_rent);
CREATE INDEX idx_units_features ON units USING GIN (features);

-- Add comments
COMMENT ON COLUMN units.active IS 'Soft delete flag - false means unit is deleted/archived';
COMMENT ON COLUMN units.created_by IS 'User who created this unit record';
COMMENT ON COLUMN units.monthly_rent IS 'Monthly rent amount for this unit';
COMMENT ON COLUMN units.features IS 'Unit features stored as JSON (e.g., balcony, city_view, etc.)';
