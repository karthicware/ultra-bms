-- ============================================================================
-- V53: Create Announcements Table
-- Story 9.2: Internal Announcement Management
-- ============================================================================
-- Creates the announcements table for internal announcements to tenants.
-- Includes indexes on status, expiresAt, and createdBy for query performance.
-- ============================================================================

-- Create sequence for announcement numbers
CREATE SEQUENCE IF NOT EXISTS announcement_number_seq START WITH 1 INCREMENT BY 1;

-- Create announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Announcement identification
    announcement_number VARCHAR(20) NOT NULL UNIQUE,

    -- Content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    template_used VARCHAR(30),

    -- Timing
    expires_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    -- Attachment
    attachment_file_path VARCHAR(500),

    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_announcements_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED')),
    CONSTRAINT chk_announcements_template CHECK (template_used IS NULL OR template_used IN ('OFFICE_CLOSURE', 'MAINTENANCE_SCHEDULE', 'POLICY_UPDATE')),
    CONSTRAINT chk_announcements_title_length CHECK (LENGTH(title) <= 200),
    CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create indexes for common queries
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_status_expires ON announcements(status, expires_at);
CREATE INDEX idx_announcements_number ON announcements(announcement_number);

-- Add comments
COMMENT ON TABLE announcements IS 'Internal announcements sent to all tenants via email and displayed on tenant portal';
COMMENT ON COLUMN announcements.announcement_number IS 'Unique identifier in format ANN-YYYY-NNNN';
COMMENT ON COLUMN announcements.title IS 'Announcement title (max 200 characters)';
COMMENT ON COLUMN announcements.message IS 'HTML formatted announcement message body';
COMMENT ON COLUMN announcements.template_used IS 'Optional template type used for this announcement';
COMMENT ON COLUMN announcements.expires_at IS 'DateTime when announcement should be hidden from tenant portal';
COMMENT ON COLUMN announcements.published_at IS 'DateTime when announcement was published and emails sent';
COMMENT ON COLUMN announcements.status IS 'Current status: DRAFT, PUBLISHED, EXPIRED, or ARCHIVED';
COMMENT ON COLUMN announcements.attachment_file_path IS 'S3 path for optional PDF attachment';
COMMENT ON COLUMN announcements.created_by IS 'User ID who created the announcement';
