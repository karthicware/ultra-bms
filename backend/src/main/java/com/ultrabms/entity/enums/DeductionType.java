package com.ultrabms.entity.enums;

/**
 * Types of deductions from security deposit.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public enum DeductionType {
    /**
     * Outstanding rent payments
     */
    UNPAID_RENT,

    /**
     * Outstanding utility bills
     */
    UNPAID_UTILITIES,

    /**
     * Damage repair costs from inspection
     */
    DAMAGE_REPAIRS,

    /**
     * Cleaning fee for unit
     */
    CLEANING_FEE,

    /**
     * Key or access card replacement
     */
    KEY_REPLACEMENT,

    /**
     * Penalty for breaking lease early
     */
    EARLY_TERMINATION_PENALTY,

    /**
     * Other deduction (requires description)
     */
    OTHER
}
