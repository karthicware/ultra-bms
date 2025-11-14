-- V13: Create Password Reset Tokens Table
-- Description: Creates password_reset_tokens table for secure password recovery workflow (Story 2.3 - AC4)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-14

-- =====================================================
-- TABLE: password_reset_tokens
-- Description: Stores secure tokens for password reset workflow with 15-minute expiration
-- =====================================================
CREATE TABLE password_reset_tokens (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_password_reset_tokens_token UNIQUE (token)
);

-- Index for fast token lookup during validation
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Index for efficient cleanup of expired tokens
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Index for querying user's active tokens
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Table comment
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens with 15-minute expiration for secure account recovery workflow';

-- Column comments
COMMENT ON COLUMN password_reset_tokens.user_id IS 'User requesting password reset - cascades on delete';
COMMENT ON COLUMN password_reset_tokens.token IS 'Cryptographically secure random token (64-char hex from 32 bytes)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration timestamp - tokens valid for 15 minutes';
COMMENT ON COLUMN password_reset_tokens.used IS 'Single-use flag - true after password successfully reset';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'Token generation timestamp for audit trail';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V13 completed successfully
-- Created: password_reset_tokens table
-- Indexes: token (unique lookup), expires_at (cleanup job), user_id (user query)
-- Constraints: Foreign key to users with CASCADE delete, unique token
