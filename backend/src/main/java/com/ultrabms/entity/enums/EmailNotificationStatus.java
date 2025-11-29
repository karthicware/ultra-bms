package com.ultrabms.entity.enums;

/**
 * Email notification status enumeration.
 * Tracks the lifecycle of an email notification from creation to delivery.
 *
 * Story 9.1: Email Notification System
 */
public enum EmailNotificationStatus {
    /**
     * Email created and waiting to be processed
     */
    PENDING,

    /**
     * Email queued for sending by the scheduled job
     */
    QUEUED,

    /**
     * Email successfully sent
     */
    SENT,

    /**
     * Email failed to send (may be retried based on retry_count)
     */
    FAILED
}
