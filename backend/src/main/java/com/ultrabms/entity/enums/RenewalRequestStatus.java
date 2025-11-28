package com.ultrabms.entity.enums;

/**
 * Renewal request status enumeration
 * Tracks tenant-initiated renewal requests
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
public enum RenewalRequestStatus {
    /**
     * Request submitted, awaiting property manager response
     */
    PENDING,

    /**
     * Request approved by property manager
     */
    APPROVED,

    /**
     * Request rejected by property manager
     */
    REJECTED
}
