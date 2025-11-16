-- Add active column to properties table for soft delete functionality
-- This column tracks whether a property is active (true) or archived/deleted (false)

ALTER TABLE properties
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Add index for filtering active properties
CREATE INDEX idx_properties_active ON properties(active);

-- Add comment to document the column
COMMENT ON COLUMN properties.active IS 'Soft delete flag - false means property is deleted/archived';
