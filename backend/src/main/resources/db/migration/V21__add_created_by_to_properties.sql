-- Add created_by column to properties table to track who created the property
-- This column stores the UUID of the user who created the property

ALTER TABLE properties
ADD COLUMN created_by UUID;

-- Add index for filtering/searching by creator
CREATE INDEX idx_properties_created_by ON properties(created_by);

-- Add comment to document the column
COMMENT ON COLUMN properties.created_by IS 'User who created this property';
