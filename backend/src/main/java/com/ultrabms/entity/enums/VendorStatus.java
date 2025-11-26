package com.ultrabms.entity.enums;

/**
 * Vendor status enumeration
 * Controls vendor visibility and assignment eligibility
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
public enum VendorStatus {
    /**
     * Vendor is active and can receive work orders
     * Default status on registration
     */
    ACTIVE,

    /**
     * Vendor is temporarily inactive (deactivated by manager)
     * Cannot receive new work orders but not a compliance issue
     */
    INACTIVE,

    /**
     * Vendor is suspended due to compliance issues
     * Cannot receive work orders until resolved
     * Requires manager action to reactivate
     */
    SUSPENDED
}
