package com.ultrabms.entity.enums;

/**
 * Rent adjustment type enumeration
 * Defines how rent is adjusted during lease extension
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
public enum RentAdjustmentType {
    /**
     * No change to current rent
     */
    NO_CHANGE,

    /**
     * Percentage increase/decrease from current rent
     */
    PERCENTAGE,

    /**
     * Flat amount increase/decrease from current rent
     */
    FLAT,

    /**
     * Custom rent amount (replacing current rent)
     */
    CUSTOM
}
