package com.ultrabms.entity.enums;

/**
 * PDC (Post-Dated Cheque) status enumeration
 * Tracks PDC lifecycle from receipt to final state
 *
 * State machine:
 * RECEIVED -> DUE -> DEPOSITED -> CLEARED
 *                              -> BOUNCED -> REPLACED
 * RECEIVED -> CANCELLED
 * RECEIVED/DUE -> WITHDRAWN
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 */
public enum PDCStatus {
    /**
     * PDC received from tenant, not yet due for deposit
     */
    RECEIVED,

    /**
     * Cheque date is within 7 days - ready for deposit
     */
    DUE,

    /**
     * Submitted to bank for processing
     */
    DEPOSITED,

    /**
     * Payment confirmed by bank, funds received
     */
    CLEARED,

    /**
     * Payment failed (insufficient funds, signature mismatch, etc.)
     */
    BOUNCED,

    /**
     * PDC voided before deposit
     */
    CANCELLED,

    /**
     * Replaced with a new PDC (after bounce)
     */
    REPLACED,

    /**
     * Returned to tenant (before deposit)
     */
    WITHDRAWN
}
