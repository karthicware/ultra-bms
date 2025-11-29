package com.ultrabms.entity.enums;

/**
 * Inspection status enumeration
 * Status of an inspection
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #7: InspectionStatus enum
 */
public enum InspectionStatus {
    /**
     * Inspection has been scheduled but not started
     */
    SCHEDULED,

    /**
     * Inspection is currently in progress
     */
    IN_PROGRESS,

    /**
     * Inspection completed and passed
     */
    PASSED,

    /**
     * Inspection completed and failed
     */
    FAILED,

    /**
     * Inspection was cancelled
     */
    CANCELLED
}
