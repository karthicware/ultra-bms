-- V16: Update Token Blacklist for Session Management
-- Description: Adds token_type and reason columns to token_blacklist for session tracking (Story 2.4 - AC5)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-14

-- =====================================================
-- UPDATE TABLE: token_blacklist
-- Description: Extends existing token_blacklist with token type distinction and logout reason tracking
--              for comprehensive session management (logout, logout-all, idle/absolute timeout)
-- =====================================================

-- Add token_type column to distinguish ACCESS vs REFRESH tokens
ALTER TABLE token_blacklist
ADD COLUMN token_type VARCHAR(20) NOT NULL DEFAULT 'ACCESS';

-- Add reason column to track why token was blacklisted
ALTER TABLE token_blacklist
ADD COLUMN reason VARCHAR(100);

-- Add CHECK constraint for token_type values
ALTER TABLE token_blacklist
ADD CONSTRAINT chk_token_blacklist_token_type
CHECK (token_type IN ('ACCESS', 'REFRESH'));

-- Add created_at column for consistency with other tables (maps to blacklisted_at)
-- Note: blacklisted_at already exists and serves this purpose, but adding created_at for uniformity
ALTER TABLE token_blacklist
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Update created_at for existing records to match blacklisted_at
UPDATE token_blacklist SET created_at = blacklisted_at WHERE created_at IS NULL;

-- Column comments for new fields
COMMENT ON COLUMN token_blacklist.token_type IS 'Type of token: ACCESS (short-lived 1h) or REFRESH (7 days)';
COMMENT ON COLUMN token_blacklist.reason IS 'Blacklist reason: LOGOUT, LOGOUT_ALL, IDLE_TIMEOUT, ABSOLUTE_TIMEOUT, PASSWORD_RESET, SECURITY_VIOLATION';
COMMENT ON COLUMN token_blacklist.created_at IS 'When the token was blacklisted (same as blacklisted_at, for table consistency)';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V16 completed successfully
-- Updated: token_blacklist table
-- Added columns: token_type (ACCESS/REFRESH), reason (tracking logout causes), created_at
-- Added constraint: CHECK token_type IN ('ACCESS', 'REFRESH')
