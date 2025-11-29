-- ============================================================================
-- V55: Add version column to announcements table
-- Adds optimistic locking support required by BaseEntity
-- ============================================================================

ALTER TABLE announcements ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN announcements.version IS 'Version field for optimistic locking';
