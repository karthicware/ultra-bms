-- V15: Create User Sessions Table
-- Description: Creates user_sessions table for session management and security tracking (Story 2.4 - AC2)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-14

-- =====================================================
-- TABLE: user_sessions
-- Description: Tracks active user sessions with IP address, device type, and activity timestamps
--              Enforces max 3 concurrent sessions per user via application logic
--              Supports idle timeout (30 min) and absolute timeout (12 hours)
-- =====================================================
CREATE TABLE user_sessions (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    access_token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    device_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_user_sessions PRIMARY KEY (id),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_sessions_session_id UNIQUE (session_id)
);

-- Unique index on session_id for fast session lookup
CREATE UNIQUE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- Index for querying user's active sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Index for efficient cleanup of expired sessions (scheduled job)
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Index for idle timeout detection (last_activity_at checks)
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity_at);

-- Table comment
COMMENT ON TABLE user_sessions IS 'Active user sessions with device tracking and timeout management - max 3 concurrent sessions enforced per user';

-- Column comments
COMMENT ON COLUMN user_sessions.user_id IS 'User owning this session - cascades on delete';
COMMENT ON COLUMN user_sessions.session_id IS 'Unique session identifier (UUID) returned on login';
COMMENT ON COLUMN user_sessions.access_token_hash IS 'BCrypt hash of access token for security (not stored in plain text)';
COMMENT ON COLUMN user_sessions.refresh_token_hash IS 'BCrypt hash of refresh token for security (not stored in plain text)';
COMMENT ON COLUMN user_sessions.created_at IS 'Session creation timestamp - used for absolute timeout (12 hours)';
COMMENT ON COLUMN user_sessions.last_activity_at IS 'Last authenticated request timestamp - used for idle timeout (30 minutes)';
COMMENT ON COLUMN user_sessions.expires_at IS 'Session expiration timestamp (created_at + 12 hours absolute timeout)';
COMMENT ON COLUMN user_sessions.ip_address IS 'Client IP address for security tracking and anomaly detection';
COMMENT ON COLUMN user_sessions.user_agent IS 'Client User-Agent header for device type detection and security';
COMMENT ON COLUMN user_sessions.device_type IS 'Detected device type (Desktop/Mobile/Tablet) parsed from User-Agent';
COMMENT ON COLUMN user_sessions.is_active IS 'Active session flag - false when logged out or expired';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V15 completed successfully
-- Created: user_sessions table
-- Indexes: session_id (unique lookup), user_id (user query), expires_at (cleanup), last_activity_at (idle check)
-- Constraints: Foreign key to users with CASCADE delete, unique session_id
