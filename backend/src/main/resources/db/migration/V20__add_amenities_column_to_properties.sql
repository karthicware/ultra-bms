-- Add amenities column to properties table
-- This column stores the list of amenities as a JSON array

ALTER TABLE properties
ADD COLUMN amenities JSONB;

-- Add index for JSONB column for better query performance
CREATE INDEX idx_properties_amenities ON properties USING GIN (amenities);

-- Add comment to document the column
COMMENT ON COLUMN properties.amenities IS 'List of amenities stored as JSON array';
