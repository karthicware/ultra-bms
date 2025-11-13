-- V7: Create Audit Logs Table
-- Description: Creates audit_logs table for tracking authentication events (Story 2.1 - AC5)
-- Author: Ultra BMS Development Team
-- Date: 2025-11-13

-- =====================================================
-- TABLE: audit_logs
-- Description: Tracks all authentication events for security monitoring and compliance
-- =====================================================
CREATE TABLE audit_logs (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    details JSONB,
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for querying logs by user
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Index for querying logs by action type
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Index for querying logs by time range
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Table comment
COMMENT ON TABLE audit_logs IS 'Audit logs for tracking authentication and security events - includes login attempts, registrations, logouts';

-- Column comments
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (null for failed login attempts)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: REGISTRATION, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN audit_logs.details IS 'Additional context in JSON format (e.g., failure reason, email for failed logins)';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration V7 completed successfully
-- Created: audit_logs table
-- Indexes: user_id, action, created_at for efficient querying
-- Constraints: Foreign key to users table
