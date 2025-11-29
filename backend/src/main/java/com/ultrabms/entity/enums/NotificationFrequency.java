package com.ultrabms.entity.enums;

/**
 * Notification delivery frequency enumeration.
 * Controls how often notifications are sent to users.
 *
 * Story 9.1: Email Notification System
 */
public enum NotificationFrequency {
    /**
     * Send notification immediately when event occurs
     */
    IMMEDIATE,

    /**
     * Batch notifications and send daily digest
     */
    DAILY_DIGEST,

    /**
     * Batch notifications and send weekly digest
     */
    WEEKLY_DIGEST
}
