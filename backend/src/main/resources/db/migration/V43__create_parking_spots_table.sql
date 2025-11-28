-- V43: Create parking_spots table
-- Story 3.8: Parking Spot Inventory Management
-- Supports parking spot CRUD with status management and tenant allocation

-- Create parking spot status enum type
CREATE TYPE parking_spot_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE');

-- Create parking_spots table
CREATE TABLE parking_spots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_number VARCHAR(20) NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    default_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    status parking_spot_status NOT NULL DEFAULT 'AVAILABLE',
    assigned_tenant_id UUID REFERENCES tenants(id),
    assigned_at TIMESTAMP,
    notes VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indexes for common queries
CREATE INDEX idx_parking_spots_property_id ON parking_spots(property_id);
CREATE INDEX idx_parking_spots_status ON parking_spots(status);
CREATE INDEX idx_parking_spots_assigned_tenant_id ON parking_spots(assigned_tenant_id);
CREATE INDEX idx_parking_spots_active ON parking_spots(active);

-- Create unique constraint for spot_number within property (only for active spots)
CREATE UNIQUE INDEX uk_parking_spots_property_spot_number
    ON parking_spots(property_id, spot_number)
    WHERE active = TRUE;

-- Add comment for documentation
COMMENT ON TABLE parking_spots IS 'Parking spots inventory for properties with allocation tracking';
COMMENT ON COLUMN parking_spots.spot_number IS 'Unique identifier within building (e.g., P2-115, A-101)';
COMMENT ON COLUMN parking_spots.default_fee IS 'Monthly fee in AED';
COMMENT ON COLUMN parking_spots.status IS 'AVAILABLE, ASSIGNED, or UNDER_MAINTENANCE';
COMMENT ON COLUMN parking_spots.assigned_tenant_id IS 'Currently assigned tenant (null if not assigned)';
COMMENT ON COLUMN parking_spots.assigned_at IS 'When current assignment was made';
COMMENT ON COLUMN parking_spots.active IS 'Soft delete flag';
