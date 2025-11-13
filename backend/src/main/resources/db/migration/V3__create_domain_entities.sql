-- V3: Create Core Domain Entities
-- Description: Creates users, properties, and units tables with relationships and constraints
-- Author: Ultra BMS Development Team
-- Date: 2025-11-13

-- =====================================================
-- TABLE: users
-- Description: System users with role-based access control
-- =====================================================
CREATE TABLE users (
    id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

-- Index for email lookups (authentication)
CREATE INDEX idx_users_email ON users(email);

-- Table comment
COMMENT ON TABLE users IS 'System users with role-based access control supporting six roles: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR';

-- Column comments
COMMENT ON COLUMN users.email IS 'User email address - unique identifier for authentication';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password - never exposed in API responses';
COMMENT ON COLUMN users.role IS 'User role enum stored as string for flexibility';
COMMENT ON COLUMN users.active IS 'Soft delete flag - false indicates deactivated account';
COMMENT ON COLUMN users.mfa_enabled IS 'Multi-factor authentication status';
COMMENT ON COLUMN users.version IS 'Optimistic locking version for concurrent update prevention';

-- =====================================================
-- TABLE: properties
-- Description: Real estate properties managed in the system
-- =====================================================
CREATE TABLE properties (
    id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500) NOT NULL,
    type VARCHAR(50),
    total_units INTEGER,
    manager_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_properties PRIMARY KEY (id),
    CONSTRAINT fk_properties_manager FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Index for manager lookups
CREATE INDEX idx_properties_manager_id ON properties(manager_id);

-- Table comment
COMMENT ON TABLE properties IS 'Real estate properties managed in the system - can be RESIDENTIAL, COMMERCIAL, or MIXED_USE';

-- Column comments
COMMENT ON COLUMN properties.name IS 'Property name or title';
COMMENT ON COLUMN properties.address IS 'Physical address of the property';
COMMENT ON COLUMN properties.type IS 'Property type enum: RESIDENTIAL, COMMERCIAL, MIXED_USE';
COMMENT ON COLUMN properties.total_units IS 'Total number of rental units in the property';
COMMENT ON COLUMN properties.manager_id IS 'Property manager assigned to this property';

-- =====================================================
-- TABLE: units
-- Description: Individual rental units within properties
-- =====================================================
CREATE TABLE units (
    id UUID NOT NULL,
    property_id UUID NOT NULL,
    unit_number VARCHAR(50) NOT NULL,
    floor INTEGER,
    bedroom_count INTEGER,
    bathroom_count INTEGER,
    square_footage NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_units PRIMARY KEY (id),
    CONSTRAINT fk_units_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT uk_unit_property_number UNIQUE (property_id, unit_number),
    CONSTRAINT chk_square_footage_positive CHECK (square_footage IS NULL OR square_footage > 0)
);

-- Indexes for property and status lookups
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status ON units(status);

-- Table comment
COMMENT ON TABLE units IS 'Individual rental units within properties - each unit has a unique unit_number per property';

-- Column comments
COMMENT ON COLUMN units.property_id IS 'Property this unit belongs to';
COMMENT ON COLUMN units.unit_number IS 'Unit identifier within the property (e.g., 101, A-1, etc.)';
COMMENT ON COLUMN units.floor IS 'Floor number where unit is located';
COMMENT ON COLUMN units.bedroom_count IS 'Number of bedrooms in the unit';
COMMENT ON COLUMN units.bathroom_count IS 'Number of bathrooms in the unit';
COMMENT ON COLUMN units.square_footage IS 'Unit size in square feet';
COMMENT ON COLUMN units.status IS 'Unit status enum: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V3 completed successfully
-- Created: users, properties, units tables
-- Relationships: properties.manager_id -> users.id, units.property_id -> properties.id
-- Indexes: Email lookup, manager assignments, property-unit relationships, status filtering
-- Constraints: Email uniqueness, unit number uniqueness per property, positive square footage
