-- V51: Create notification_settings table for system-level notification configuration
-- Story 9.1: Email Notification System

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    frequency VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE',
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create index on notification_type for fast lookups
CREATE INDEX idx_notification_settings_type ON notification_settings(notification_type);

-- Insert default settings for all notification types (all enabled by default)
INSERT INTO notification_settings (notification_type, email_enabled, frequency, description) VALUES
    -- Authentication
    ('PASSWORD_RESET_REQUESTED', true, 'IMMEDIATE', 'Password reset link email'),
    ('PASSWORD_CHANGED', true, 'IMMEDIATE', 'Password change confirmation email'),
    ('NEW_USER_CREATED', true, 'IMMEDIATE', 'Welcome email for new users'),

    -- Tenant
    ('TENANT_ONBOARDED', true, 'IMMEDIATE', 'Tenant onboarding welcome email'),
    ('LEASE_UPLOADED', true, 'IMMEDIATE', 'Lease document upload notification'),
    ('LEASE_EXPIRING_90', true, 'IMMEDIATE', 'Lease expiring in 90 days reminder'),
    ('LEASE_EXPIRING_60', true, 'IMMEDIATE', 'Lease expiring in 60 days reminder'),
    ('LEASE_EXPIRING_30', true, 'IMMEDIATE', 'Lease expiring in 30 days reminder'),

    -- Maintenance
    ('MAINTENANCE_REQUEST_SUBMITTED', true, 'IMMEDIATE', 'Maintenance request confirmation'),
    ('WORK_ORDER_ASSIGNED', true, 'IMMEDIATE', 'Work order assignment notification'),
    ('WORK_ORDER_STATUS_CHANGED', true, 'IMMEDIATE', 'Work order status update'),
    ('WORK_ORDER_COMPLETED', true, 'IMMEDIATE', 'Work order completion notification'),

    -- Financial
    ('INVOICE_GENERATED', true, 'IMMEDIATE', 'Invoice generation notification'),
    ('PAYMENT_RECEIVED', true, 'IMMEDIATE', 'Payment receipt confirmation'),
    ('INVOICE_OVERDUE_7', true, 'IMMEDIATE', 'Invoice overdue by 7 days reminder'),
    ('INVOICE_OVERDUE_14', true, 'IMMEDIATE', 'Invoice overdue by 14 days reminder'),
    ('INVOICE_OVERDUE_30', true, 'IMMEDIATE', 'Invoice overdue by 30 days reminder'),
    ('PDC_DUE_SOON', true, 'IMMEDIATE', 'PDC due for deposit reminder'),
    ('PDC_BOUNCED', true, 'IMMEDIATE', 'PDC bounced notification'),

    -- Vendor
    ('VENDOR_REGISTERED', true, 'IMMEDIATE', 'Vendor registration confirmation'),
    ('VENDOR_DOCUMENT_EXPIRING', true, 'IMMEDIATE', 'Vendor document expiry reminder'),
    ('VENDOR_LICENSE_EXPIRED', true, 'IMMEDIATE', 'Vendor license expired notification'),

    -- Compliance
    ('COMPLIANCE_DUE_SOON', true, 'IMMEDIATE', 'Compliance item due reminder'),
    ('COMPLIANCE_OVERDUE', true, 'IMMEDIATE', 'Compliance item overdue alert'),
    ('INSPECTION_SCHEDULED', true, 'IMMEDIATE', 'Inspection scheduled notification'),

    -- Document
    ('DOCUMENT_UPLOADED', true, 'DAILY_DIGEST', 'Document upload notification'),
    ('DOCUMENT_EXPIRING', true, 'IMMEDIATE', 'Document expiry reminder'),

    -- Announcement
    ('ANNOUNCEMENT_PUBLISHED', true, 'IMMEDIATE', 'Announcement publication notification')
ON CONFLICT (notification_type) DO NOTHING;

-- Add comments
COMMENT ON TABLE notification_settings IS 'System-level configuration for email notification types';
COMMENT ON COLUMN notification_settings.email_enabled IS 'Whether this notification type sends emails';
COMMENT ON COLUMN notification_settings.frequency IS 'Delivery frequency: IMMEDIATE, DAILY_DIGEST, WEEKLY_DIGEST';
