package com.ultrabms.entity.enums;

/**
 * Condition rating for inspection items.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public enum ItemCondition {
    /**
     * Item is in good condition, no issues
     */
    GOOD,

    /**
     * Item shows normal wear and tear, acceptable condition
     */
    FAIR,

    /**
     * Item needs repair but is not critically damaged
     */
    NEEDS_REPAIR,

    /**
     * Item is damaged and requires repair
     */
    DAMAGED,

    /**
     * Item is missing entirely
     */
    MISSING,

    /**
     * Item condition is not applicable for this inspection
     */
    NOT_APPLICABLE
}
