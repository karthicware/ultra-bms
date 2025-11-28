package com.ultrabms.entity.enums;

/**
 * Status of checkout process.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public enum CheckoutStatus {
    /**
     * Checkout initiated, awaiting inspection scheduling
     */
    PENDING,

    /**
     * Inspection has been scheduled
     */
    INSPECTION_SCHEDULED,

    /**
     * Inspection completed, awaiting deposit calculation
     */
    INSPECTION_COMPLETE,

    /**
     * Deposit calculation done, awaiting approval
     */
    DEPOSIT_CALCULATED,

    /**
     * Requires approval (for high-value refunds)
     */
    PENDING_APPROVAL,

    /**
     * Approved, ready for refund processing
     */
    APPROVED,

    /**
     * Refund is being processed
     */
    REFUND_PROCESSING,

    /**
     * Refund has been processed
     */
    REFUND_PROCESSED,

    /**
     * Checkout fully completed (tenant terminated, unit available)
     */
    COMPLETED,

    /**
     * On hold due to disputes or pending documentation
     */
    ON_HOLD
}
