-- V50: Create email_notifications table for tracking all email sends
-- Story 9.1: Email Notification System

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indexes for efficient querying
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_recipient_email ON email_notifications(recipient_email);
CREATE INDEX idx_email_notifications_notification_type ON email_notifications(notification_type);
CREATE INDEX idx_email_notifications_entity_type_id ON email_notifications(entity_type, entity_id);
CREATE INDEX idx_email_notifications_created_at ON email_notifications(created_at);
CREATE INDEX idx_email_notifications_next_retry_at ON email_notifications(next_retry_at);
CREATE INDEX idx_email_notifications_status_retry ON email_notifications(status, retry_count) WHERE status IN ('PENDING', 'QUEUED', 'FAILED');

-- Add comments
COMMENT ON TABLE email_notifications IS 'Tracks all email notifications sent by the system';
COMMENT ON COLUMN email_notifications.notification_type IS 'Type of notification: PASSWORD_RESET, INVOICE_GENERATED, etc.';
COMMENT ON COLUMN email_notifications.status IS 'Email status: PENDING, QUEUED, SENT, FAILED';
COMMENT ON COLUMN email_notifications.retry_count IS 'Number of retry attempts (max 3)';
COMMENT ON COLUMN email_notifications.next_retry_at IS 'When to retry failed email (exponential backoff)';
