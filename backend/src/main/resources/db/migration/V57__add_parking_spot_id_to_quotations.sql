-- SCP-2025-12-02: Add parking_spot_id column to quotations table
-- Changes parking allocation from multiple spots (count) to single spot selection from inventory
-- The parking_spot_id references a ParkingSpot from the parking_spots table (Story 3.8)

-- Add parking_spot_id column (optional - can be null if no parking allocated)
ALTER TABLE quotations ADD COLUMN parking_spot_id UUID NULL;

-- Add foreign key constraint to parking_spots table
ALTER TABLE quotations ADD CONSTRAINT fk_quotations_parking_spot
    FOREIGN KEY (parking_spot_id) REFERENCES parking_spots(id)
    ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_quotations_parking_spot_id ON quotations(parking_spot_id);

-- Make parking_fee nullable (0 if no parking, otherwise the editable fee)
ALTER TABLE quotations ALTER COLUMN parking_fee DROP NOT NULL;
ALTER TABLE quotations ALTER COLUMN parking_fee SET DEFAULT 0;

-- Update existing quotations: set parking_spot_id to null (existing data uses manual entry)
-- Keep parking_spots and parking_fee values for backward compatibility
-- No data migration needed - new quotations will use the new flow

COMMENT ON COLUMN quotations.parking_spot_id IS 'Optional reference to parking_spots table. If set, parking_spots will be 1 and parking_fee is the editable fee for that spot.';
