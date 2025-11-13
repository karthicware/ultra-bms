-- V6: Create Token Blacklist Table
-- Description: Creates token_blacklist table for secure logout implementation (Story 2.1 - AC7)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-13

-- =====================================================
-- TABLE: token_blacklist
-- Description: Stores blacklisted JWT tokens to prevent reuse after logout
-- =====================================================
CREATE TABLE token_blacklist (
    id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    blacklisted_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_token_blacklist PRIMARY KEY (id),
    CONSTRAINT uk_token_blacklist_token_hash UNIQUE (token_hash)
);

-- Index for checking if token is blacklisted (primary lookup)
CREATE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);

-- Index for cleanup job (delete expired tokens)
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Table comment
COMMENT ON TABLE token_blacklist IS 'Blacklisted JWT tokens for secure logout - prevents token reuse even if not expired';

-- Column comments
COMMENT ON COLUMN token_blacklist.token_hash IS 'SHA-256 hash of the JWT token for security';
COMMENT ON COLUMN token_blacklist.expires_at IS 'When the token expires (from token exp claim) - used for cleanup';
COMMENT ON COLUMN token_blacklist.blacklisted_at IS 'When the token was added to the blacklist (logout time)';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V6 completed successfully
-- Created: token_blacklist table
-- Indexes: token_hash lookup, expires_at for cleanup job
-- Constraints: Unique token_hash per entry
