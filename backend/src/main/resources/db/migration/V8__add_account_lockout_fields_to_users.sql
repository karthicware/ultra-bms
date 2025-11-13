-- V8: Add Account Lockout Fields to Users Table
-- Description: Adds account lockout fields for rate limiting and security (Story 2.1 - AC5)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-13

-- =====================================================
-- ALTER TABLE: users
-- Description: Add fields for tracking and managing account lockouts after failed login attempts
-- =====================================================
ALTER TABLE users
ADD COLUMN account_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN locked_until TIMESTAMP,
ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;

-- Column comments
COMMENT ON COLUMN users.account_locked IS 'Whether the account is currently locked due to failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Timestamp until which the account is locked (null if not locked)';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V8 completed successfully
-- Added: account_locked, locked_until, failed_login_attempts columns to users table
-- Purpose: Enable rate limiting and account lockout after 5 failed attempts within 15 minutes
