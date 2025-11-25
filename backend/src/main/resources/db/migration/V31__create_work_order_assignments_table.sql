-- ============================================================================
-- Story 4.3: Work Order Assignment and Vendor Coordination
-- Creates work_order_assignments table for tracking assignment history
-- Adds assignee_type column to work_orders table
-- ============================================================================

-- Add assignee_type column to work_orders table
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS assignee_type VARCHAR(20);

-- Create index on assignee_type for filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_assignee_type ON work_orders(assignee_type);

-- Create work_order_assignments table for assignment history
CREATE TABLE IF NOT EXISTS work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    assignee_type VARCHAR(20) NOT NULL,
    assignee_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_date TIMESTAMP NOT NULL,
    reassignment_reason VARCHAR(200),
    assignment_notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Foreign key to work_orders table
    CONSTRAINT fk_wo_assignments_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON DELETE CASCADE,

    -- Foreign key to users table for assigned_by
    CONSTRAINT fk_wo_assignments_assigned_by
        FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    -- Constraint for valid assignee_type values
    CONSTRAINT chk_assignee_type
        CHECK (assignee_type IN ('INTERNAL_STAFF', 'EXTERNAL_VENDOR'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wo_assignments_work_order_id ON work_order_assignments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_assignee_id ON work_order_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_assigned_by ON work_order_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_assigned_date ON work_order_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_wo_assignments_assignee_type ON work_order_assignments(assignee_type);

-- Composite index for common query: find assignments by work order and date
CREATE INDEX IF NOT EXISTS idx_wo_assignments_wo_date
    ON work_order_assignments(work_order_id, assigned_date DESC);

-- Add comment for table documentation
COMMENT ON TABLE work_order_assignments IS 'Tracks work order assignment history including initial assignments and reassignments. Story 4.3: Work Order Assignment and Vendor Coordination';
COMMENT ON COLUMN work_order_assignments.work_order_id IS 'Reference to the work order being assigned';
COMMENT ON COLUMN work_order_assignments.assignee_type IS 'Type of assignee: INTERNAL_STAFF or EXTERNAL_VENDOR';
COMMENT ON COLUMN work_order_assignments.assignee_id IS 'UUID of assignee (polymorphic - references users or vendors table based on assignee_type)';
COMMENT ON COLUMN work_order_assignments.assigned_by IS 'User who made the assignment';
COMMENT ON COLUMN work_order_assignments.assigned_date IS 'Timestamp when assignment was made';
COMMENT ON COLUMN work_order_assignments.reassignment_reason IS 'Required for reassignments, explains why work order was reassigned';
COMMENT ON COLUMN work_order_assignments.assignment_notes IS 'Optional notes for the assignee';
