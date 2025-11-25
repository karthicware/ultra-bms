package com.ultrabms.entity.enums;

/**
 * Type of assignee for work order assignment.
 * Determines whether the work order is assigned to internal staff or external vendor.
 *
 * Story 4.3: Work Order Assignment and Vendor Coordination
 */
public enum AssigneeType {
    /**
     * Work order assigned to internal maintenance staff (users with MAINTENANCE_SUPERVISOR role)
     */
    INTERNAL_STAFF,

    /**
     * Work order assigned to external vendor/contractor
     */
    EXTERNAL_VENDOR
}
