-- SCP-2025-12-07: Add lease end date tracking for parking spot assignments
-- Parking spots are blocked until the tenant's lease ends

ALTER TABLE parking_spots ADD COLUMN assigned_until DATE;

-- Add index for efficient expired assignment queries
CREATE INDEX idx_parking_spots_assigned_until ON parking_spots(assigned_until) WHERE assigned_until IS NOT NULL;

COMMENT ON COLUMN parking_spots.assigned_until IS 'Lease end date - spot remains ASSIGNED and blocked until this date';
