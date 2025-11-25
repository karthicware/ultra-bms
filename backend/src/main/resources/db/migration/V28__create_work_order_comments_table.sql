-- V28: Create work_order_comments table
-- Story 4.1: Work Order Creation and Management
-- Creates work_order_comments table for work order comments and status history

CREATE TABLE IF NOT EXISTS work_order_comments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    work_order_id UUID NOT NULL,
    created_by UUID NOT NULL,

    -- Comment Details
    comment_text VARCHAR(2000) NOT NULL,
    is_status_change BOOLEAN NOT NULL DEFAULT FALSE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),

    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT fk_work_order_comments_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_order_comments_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_work_order_comments_work_order_id ON work_order_comments(work_order_id);
CREATE INDEX idx_work_order_comments_created_by ON work_order_comments(created_by);
CREATE INDEX idx_work_order_comments_created_at ON work_order_comments(created_at DESC);
CREATE INDEX idx_work_order_comments_is_status_change ON work_order_comments(work_order_id, is_status_change);

-- Comments
COMMENT ON TABLE work_order_comments IS 'Comments and status history for work orders';
COMMENT ON COLUMN work_order_comments.is_status_change IS 'True if this comment represents a status transition';
COMMENT ON COLUMN work_order_comments.previous_status IS 'Previous status (only if is_status_change = true)';
COMMENT ON COLUMN work_order_comments.new_status IS 'New status (only if is_status_change = true)';
