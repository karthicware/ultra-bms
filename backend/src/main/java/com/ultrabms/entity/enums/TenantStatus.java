package com.ultrabms.entity.enums;

/**
 * Tenant status enumeration
 * Tracks the lifecycle status of a tenant
 */
public enum TenantStatus {
    /**
     * Tenant registration pending (not yet active)
     */
    PENDING,

    /**
     * Tenant is active with current lease
     */
    ACTIVE,

    /**
     * Lease expiring soon (within 60 days)
     * Story 3.6: Added for expiry monitoring
     */
    EXPIRING_SOON,

    /**
     * Lease has expired
     */
    EXPIRED,

    /**
     * Lease was terminated early
     */
    TERMINATED
}
