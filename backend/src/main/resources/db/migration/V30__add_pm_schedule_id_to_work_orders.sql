-- ============================================================================
-- V30: Add PM Schedule ID to Work Orders Table
-- Story 4.2: Preventive Maintenance Scheduling
-- ============================================================================

-- Add pm_schedule_id column to work_orders table
ALTER TABLE work_orders
ADD COLUMN pm_schedule_id UUID REFERENCES pm_schedules(id) ON DELETE SET NULL;

-- Create index for efficient lookup of work orders by PM schedule
CREATE INDEX idx_work_orders_pm_schedule_id ON work_orders(pm_schedule_id);

-- Add comment for documentation
COMMENT ON COLUMN work_orders.pm_schedule_id IS 'PM Schedule that generated this work order, NULL if not PM-generated';
