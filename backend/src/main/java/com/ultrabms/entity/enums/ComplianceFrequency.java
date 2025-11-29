package com.ultrabms.entity.enums;

/**
 * Compliance frequency enumeration
 * How often compliance requirements need to be met
 *
 * Story 7.3: Compliance and Inspection Tracking
 * AC #3: ComplianceFrequency enum with months interval
 */
public enum ComplianceFrequency {
    /**
     * One-time compliance requirement (no recurring schedule)
     */
    ONE_TIME(0),

    /**
     * Monthly compliance check
     */
    MONTHLY(1),

    /**
     * Quarterly compliance check (every 3 months)
     */
    QUARTERLY(3),

    /**
     * Semi-annual compliance check (every 6 months)
     */
    SEMI_ANNUALLY(6),

    /**
     * Annual compliance check (every 12 months)
     */
    ANNUALLY(12),

    /**
     * Biannual compliance check (every 24 months)
     */
    BIANNUALLY(24);

    private final int months;

    ComplianceFrequency(int months) {
        this.months = months;
    }

    /**
     * Get the number of months between compliance checks
     * @return months interval (0 for ONE_TIME)
     */
    public int getMonths() {
        return months;
    }
}
