package com.ultrabms.entity.enums;

/**
 * Reasons for tenant checkout.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public enum CheckoutReason {
    /**
     * Normal checkout at lease end
     */
    LEASE_END,

    /**
     * Tenant leaving before lease end date
     */
    EARLY_TERMINATION,

    /**
     * Tenant evicted by property manager
     */
    EVICTION,

    /**
     * Both parties agree to end lease early
     */
    MUTUAL_AGREEMENT,

    /**
     * Other reason (requires notes)
     */
    OTHER
}
