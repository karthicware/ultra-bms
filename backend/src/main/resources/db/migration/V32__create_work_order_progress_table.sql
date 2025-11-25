-- Story 4.4: Job Progress Tracking and Completion
-- Create work_order_progress table and add completion fields to work_orders

-- ============================================================================
-- ADD COMPLETION FIELDS TO WORK_ORDERS TABLE
-- ============================================================================

-- Add recommendations field for vendor suggestions
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS recommendations VARCHAR(500);

-- Add follow-up tracking fields
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS follow_up_description VARCHAR(200);

-- Add photo arrays for before/during/after photos
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS before_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS after_photos JSONB DEFAULT '[]'::jsonb;

-- Add index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_work_orders_follow_up_required ON work_orders(follow_up_required) WHERE follow_up_required = TRUE;

-- ============================================================================
-- CREATE WORK_ORDER_PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS work_order_progress (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Progress Details
    progress_notes VARCHAR(500) NOT NULL,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    estimated_completion_date TIMESTAMP,

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0
);

-- ============================================================================
-- INDEXES FOR WORK_ORDER_PROGRESS TABLE
-- ============================================================================

-- Index for querying progress updates by work order
CREATE INDEX IF NOT EXISTS idx_work_order_progress_work_order_id ON work_order_progress(work_order_id);

-- Index for querying progress updates by user
CREATE INDEX IF NOT EXISTS idx_work_order_progress_user_id ON work_order_progress(user_id);

-- Index for chronological ordering of progress updates
CREATE INDEX IF NOT EXISTS idx_work_order_progress_created_at ON work_order_progress(created_at DESC);

-- Composite index for common query pattern: work order + created date
CREATE INDEX IF NOT EXISTS idx_work_order_progress_work_order_created ON work_order_progress(work_order_id, created_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE work_order_progress IS 'Tracks progress updates for work orders during job execution. Story 4.4: Job Progress Tracking and Completion';
COMMENT ON COLUMN work_order_progress.work_order_id IS 'Reference to the parent work order';
COMMENT ON COLUMN work_order_progress.user_id IS 'User who submitted this progress update (assignee)';
COMMENT ON COLUMN work_order_progress.progress_notes IS 'Progress notes describing work done, max 500 chars';
COMMENT ON COLUMN work_order_progress.photo_urls IS 'JSON array of S3 URLs for during photos';
COMMENT ON COLUMN work_order_progress.estimated_completion_date IS 'Updated estimated completion date (optional)';

COMMENT ON COLUMN work_orders.recommendations IS 'Recommendations from vendor after completing work';
COMMENT ON COLUMN work_orders.follow_up_required IS 'Flag indicating if follow-up work is needed';
COMMENT ON COLUMN work_orders.follow_up_description IS 'Description of required follow-up work';
COMMENT ON COLUMN work_orders.before_photos IS 'JSON array of S3 URLs for before photos uploaded when starting work';
COMMENT ON COLUMN work_orders.after_photos IS 'JSON array of S3 URLs for after photos uploaded on completion';
