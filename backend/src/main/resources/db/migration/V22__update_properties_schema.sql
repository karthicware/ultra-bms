-- Update properties table schema to match Property entity
-- This migration fixes column name mismatches and adds missing columns

-- Rename 'type' column to 'property_type' to match entity mapping
ALTER TABLE properties
RENAME COLUMN type TO property_type;

-- Rename 'total_units' column to 'total_units_count' to match entity mapping
ALTER TABLE properties
RENAME COLUMN total_units TO total_units_count;

-- Add missing columns
ALTER TABLE properties
ADD COLUMN year_built INTEGER,
ADD COLUMN total_square_footage NUMERIC(12, 2),
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Add index for property_type
CREATE INDEX idx_properties_type ON properties(property_type);

-- Add index for status
CREATE INDEX idx_properties_status ON properties(status);

-- Add comments to document the columns
COMMENT ON COLUMN properties.property_type IS 'Property type enum: RESIDENTIAL, COMMERCIAL, MIXED_USE';
COMMENT ON COLUMN properties.total_units_count IS 'Total number of rental units in the property';
COMMENT ON COLUMN properties.year_built IS 'Year the property was built';
COMMENT ON COLUMN properties.total_square_footage IS 'Total square footage of the entire property';
COMMENT ON COLUMN properties.status IS 'Property status enum: ACTIVE or INACTIVE';
