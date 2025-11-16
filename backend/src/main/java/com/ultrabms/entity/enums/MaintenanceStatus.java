package com.ultrabms.entity.enums;

/**
 * Maintenance request status enumeration
 * Tracks the lifecycle of a maintenance request from submission to closure
 */
public enum MaintenanceStatus {
    /**
     * Request submitted by tenant, awaiting property manager assignment
     */
    SUBMITTED,

    /**
     * Request assigned to a vendor, awaiting vendor to start work
     */
    ASSIGNED,

    /**
     * Vendor has started work on the request
     */
    IN_PROGRESS,

    /**
     * Work completed by vendor, awaiting tenant feedback
     */
    COMPLETED,

    /**
     * Request closed after tenant feedback or auto-closure
     */
    CLOSED,

    /**
     * Request cancelled by tenant (only possible in SUBMITTED status)
     */
    CANCELLED
}
