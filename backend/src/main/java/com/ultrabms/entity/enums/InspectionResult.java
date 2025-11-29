package com.ultrabms.entity.enums;

/**
 * Inspection result enumeration
 * Result of a completed inspection
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #8: InspectionResult enum
 */
public enum InspectionResult {
    /**
     * Inspection passed all requirements
     */
    PASSED,

    /**
     * Inspection failed one or more requirements
     */
    FAILED,

    /**
     * Inspection passed some requirements but not all
     */
    PARTIAL_PASS
}
