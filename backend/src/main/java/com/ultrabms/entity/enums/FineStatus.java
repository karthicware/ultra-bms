package com.ultrabms.entity.enums;

/**
 * Fine status enumeration
 * Payment status of violation fines
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #10: FineStatus enum
 */
public enum FineStatus {
    /**
     * Fine payment is pending
     */
    PENDING,

    /**
     * Fine has been paid
     */
    PAID,

    /**
     * Fine is under appeal
     */
    APPEALED,

    /**
     * Fine has been waived
     */
    WAIVED
}
