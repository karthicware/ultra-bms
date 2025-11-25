-- ============================================================================
-- V29: Create PM Schedules Table
-- Story 4.2: Preventive Maintenance Scheduling
-- ============================================================================

-- Create PM Schedules table
CREATE TABLE pm_schedules (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Schedule Identification
    schedule_name VARCHAR(100) NOT NULL,

    -- Relationships
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    default_assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Schedule Details
    category VARCHAR(20) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    default_priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',

    -- Recurrence Settings
    recurrence_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,

    -- Status and Tracking
    status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',
    next_generation_date DATE,
    last_generated_date DATE,

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT chk_pm_schedules_category CHECK (
        category IN ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'CARPENTRY',
                     'PEST_CONTROL', 'CLEANING', 'PAINTING', 'LANDSCAPING', 'OTHER')
    ),
    CONSTRAINT chk_pm_schedules_priority CHECK (
        default_priority IN ('HIGH', 'MEDIUM', 'LOW')
    ),
    CONSTRAINT chk_pm_schedules_recurrence_type CHECK (
        recurrence_type IN ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY')
    ),
    CONSTRAINT chk_pm_schedules_status CHECK (
        status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'DELETED')
    ),
    CONSTRAINT chk_pm_schedules_end_date CHECK (
        end_date IS NULL OR end_date > start_date
    ),
    CONSTRAINT chk_pm_schedules_description_length CHECK (
        LENGTH(description) >= 20
    )
);

-- Create indexes for common query patterns
CREATE INDEX idx_pm_schedules_property_id ON pm_schedules(property_id);
CREATE INDEX idx_pm_schedules_status ON pm_schedules(status);
CREATE INDEX idx_pm_schedules_next_generation_date ON pm_schedules(next_generation_date);
CREATE INDEX idx_pm_schedules_category ON pm_schedules(category);
CREATE INDEX idx_pm_schedules_recurrence_type ON pm_schedules(recurrence_type);
CREATE INDEX idx_pm_schedules_created_by ON pm_schedules(created_by);

-- Composite index for scheduled job query (find active schedules due for generation)
CREATE INDEX idx_pm_schedules_status_next_gen ON pm_schedules(status, next_generation_date)
    WHERE status = 'ACTIVE';

-- Add comments for documentation
COMMENT ON TABLE pm_schedules IS 'Preventive maintenance schedules for automatic work order generation';
COMMENT ON COLUMN pm_schedules.schedule_name IS 'Name of the PM schedule (e.g., HVAC Quarterly Inspection)';
COMMENT ON COLUMN pm_schedules.property_id IS 'Property for this schedule, NULL for All Properties';
COMMENT ON COLUMN pm_schedules.default_assignee_id IS 'Default assignee for generated work orders, NULL for unassigned';
COMMENT ON COLUMN pm_schedules.recurrence_type IS 'How often work orders are generated: MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY';
COMMENT ON COLUMN pm_schedules.next_generation_date IS 'Date when next work order will be generated';
COMMENT ON COLUMN pm_schedules.last_generated_date IS 'Date when last work order was generated';
COMMENT ON COLUMN pm_schedules.status IS 'Schedule status: ACTIVE, PAUSED, COMPLETED, DELETED';
