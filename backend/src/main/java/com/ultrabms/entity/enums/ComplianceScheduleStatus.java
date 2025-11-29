package com.ultrabms.entity.enums;

/**
 * Compliance schedule status enumeration
 * Status of a compliance schedule item
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #5: ComplianceScheduleStatus enum
 */
public enum ComplianceScheduleStatus {
    /**
     * Compliance due date is more than 30 days away
     */
    UPCOMING,

    /**
     * Compliance due date is within 30 days
     */
    DUE,

    /**
     * Compliance has been completed
     */
    COMPLETED,

    /**
     * Compliance is past the due date
     */
    OVERDUE,

    /**
     * Property is exempt from this compliance requirement
     */
    EXEMPT
}
