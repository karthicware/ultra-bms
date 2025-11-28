package com.ultrabms.entity.enums;

/**
 * Lease extension workflow status enumeration
 * Tracks the lifecycle of a lease extension from creation to application
 *
 * Story 3.6: Tenant Lease Extension and Renewal
 */
public enum LeaseExtensionStatus {
    /**
     * Extension is being drafted, not yet submitted
     */
    DRAFT,

    /**
     * Extension submitted for approval
     */
    PENDING_APPROVAL,

    /**
     * Extension approved by admin/manager
     */
    APPROVED,

    /**
     * Extension was rejected
     */
    REJECTED,

    /**
     * Extension has been applied to tenant record
     */
    APPLIED
}
