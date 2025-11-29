package com.ultrabms.entity.enums;

/**
 * Compliance category enumeration
 * Categories of regulatory compliance requirements
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #2: ComplianceCategory enum
 */
public enum ComplianceCategory {
    /**
     * General safety compliance requirements
     */
    SAFETY,

    /**
     * Fire safety and prevention requirements
     */
    FIRE,

    /**
     * Electrical safety compliance
     */
    ELECTRICAL,

    /**
     * Plumbing compliance requirements
     */
    PLUMBING,

    /**
     * Building structural integrity requirements
     */
    STRUCTURAL,

    /**
     * Environmental regulations compliance
     */
    ENVIRONMENTAL,

    /**
     * Business and operating licenses
     */
    LICENSING,

    /**
     * Other compliance requirements
     */
    OTHER
}
