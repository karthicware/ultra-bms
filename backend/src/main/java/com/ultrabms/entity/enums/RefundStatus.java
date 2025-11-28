package com.ultrabms.entity.enums;

/**
 * Status of deposit refund.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public enum RefundStatus {
    /**
     * Initial calculation done
     */
    CALCULATED,

    /**
     * Requires manager approval (amount > threshold)
     */
    PENDING_APPROVAL,

    /**
     * Approved for processing
     */
    APPROVED,

    /**
     * Refund being processed (bank transfer initiated, etc.)
     */
    PROCESSING,

    /**
     * Refund completed and confirmed
     */
    COMPLETED,

    /**
     * On hold (awaiting bank details, dispute, etc.)
     */
    ON_HOLD
}
