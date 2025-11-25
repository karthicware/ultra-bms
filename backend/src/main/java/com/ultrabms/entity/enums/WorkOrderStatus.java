package com.ultrabms.entity.enums;

/**
 * Work order status enumeration
 * Tracks the lifecycle of a work order from creation to closure
 *
 * Story 4.1: Work Order Creation and Management
 */
public enum WorkOrderStatus {
    /**
     * Work order created but not yet assigned to vendor/staff
     * Initial status when property manager creates a work order
     */
    OPEN,

    /**
     * Work order assigned to vendor or internal staff
     * Assignee has been notified but work has not started
     */
    ASSIGNED,

    /**
     * Work is actively being performed
     * Vendor/staff has started working on the issue
     */
    IN_PROGRESS,

    /**
     * Work has been completed
     * Vendor/staff has marked the work as done with completion notes
     */
    COMPLETED,

    /**
     * Work order is closed
     * Final status after manager review and approval
     */
    CLOSED
}
