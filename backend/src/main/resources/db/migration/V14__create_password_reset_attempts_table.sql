-- V14: Create Password Reset Attempts Table
-- Description: Creates password_reset_attempts table for rate limiting password reset requests (Story 2.3 - AC7)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-14

-- =====================================================
-- TABLE: password_reset_attempts
-- Description: Tracks password reset attempts per email for rate limiting (max 3 per hour)
-- =====================================================
CREATE TABLE password_reset_attempts (
    id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    first_attempt_at TIMESTAMP NOT NULL,
    last_attempt_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_password_reset_attempts PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_attempts_email UNIQUE (email)
);

-- Index for fast email-based rate limit lookups
CREATE INDEX idx_password_reset_attempts_email ON password_reset_attempts(email);

-- Index for cleanup of old attempts (>7 days)
CREATE INDEX idx_password_reset_attempts_first_attempt_at ON password_reset_attempts(first_attempt_at);

-- Table comment
COMMENT ON TABLE password_reset_attempts IS 'Rate limiting tracking for password reset requests - max 3 attempts per hour per email';

-- Column comments
COMMENT ON COLUMN password_reset_attempts.email IS 'Email address attempting password reset';
COMMENT ON COLUMN password_reset_attempts.attempt_count IS 'Number of reset attempts within current window (resets after 1 hour)';
COMMENT ON COLUMN password_reset_attempts.first_attempt_at IS 'Timestamp of first attempt in current window (rolling 1-hour window)';
COMMENT ON COLUMN password_reset_attempts.last_attempt_at IS 'Timestamp of most recent attempt for tracking';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V14 completed successfully
-- Created: password_reset_attempts table
-- Indexes: email (unique lookup), first_attempt_at (cleanup)
-- Constraints: Unique email constraint
