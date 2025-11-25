-- V27: Create work_orders table
-- Story 4.1: Work Order Creation and Management
-- Creates work_orders table for maintenance work order management

CREATE TABLE IF NOT EXISTS work_orders (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Work Order Identification
    work_order_number VARCHAR(20) NOT NULL UNIQUE,

    -- Relationships
    property_id UUID NOT NULL,
    unit_id UUID,
    requested_by UUID NOT NULL,
    assigned_to UUID,
    maintenance_request_id UUID,

    -- Work Order Details
    category VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    -- Scheduling and Access
    scheduled_date TIMESTAMP,
    access_instructions VARCHAR(500),

    -- Timestamps
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Cost Tracking (visible only to managers/supervisors)
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),

    -- Work Completion Details
    total_hours DECIMAL(5, 2),
    completion_notes VARCHAR(2000),
    follow_up_notes VARCHAR(1000),

    -- Attachments (JSONB for photo URLs)
    attachments JSONB DEFAULT '[]'::jsonb,
    completion_photos JSONB DEFAULT '[]'::jsonb,

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_work_orders_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_work_orders_unit FOREIGN KEY (unit_id) REFERENCES units(id),
    CONSTRAINT fk_work_orders_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_work_orders_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT ck_work_orders_estimated_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    CONSTRAINT ck_work_orders_actual_cost CHECK (actual_cost IS NULL OR actual_cost >= 0),
    CONSTRAINT ck_work_orders_total_hours CHECK (total_hours IS NULL OR total_hours >= 0)
);

-- Indexes for performance
CREATE INDEX idx_work_orders_property_id ON work_orders(property_id);
CREATE INDEX idx_work_orders_unit_id ON work_orders(unit_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_category ON work_orders(category);
CREATE INDEX idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX idx_work_orders_scheduled_date ON work_orders(scheduled_date DESC);
CREATE INDEX idx_work_orders_requested_by ON work_orders(requested_by);
CREATE INDEX idx_work_orders_work_order_number ON work_orders(work_order_number);
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at DESC);

-- Comments
COMMENT ON TABLE work_orders IS 'Work orders for maintenance and repair work';
COMMENT ON COLUMN work_orders.work_order_number IS 'Unique work order number (format: WO-YYYY-NNNN)';
COMMENT ON COLUMN work_orders.status IS 'Work order status: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED';
COMMENT ON COLUMN work_orders.priority IS 'Priority level: HIGH, MEDIUM, LOW';
COMMENT ON COLUMN work_orders.category IS 'Work category: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER';
COMMENT ON COLUMN work_orders.estimated_cost IS 'Estimated cost in AED (visible only to managers/supervisors)';
COMMENT ON COLUMN work_orders.actual_cost IS 'Actual cost in AED (visible only to managers/supervisors)';
COMMENT ON COLUMN work_orders.attachments IS 'JSON array of photo URLs uploaded when creating work order';
COMMENT ON COLUMN work_orders.completion_photos IS 'JSON array of photo URLs uploaded after work completion';
