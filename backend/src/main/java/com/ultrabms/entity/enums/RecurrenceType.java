package com.ultrabms.entity.enums;

/**
 * Recurrence type enumeration for preventive maintenance schedules.
 * Defines how often work orders are automatically generated.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
public enum RecurrenceType {
    /**
     * Monthly recurrence - work order generated every month
     */
    MONTHLY(1),

    /**
     * Quarterly recurrence - work order generated every 3 months
     */
    QUARTERLY(3),

    /**
     * Semi-annual recurrence - work order generated every 6 months
     */
    SEMI_ANNUALLY(6),

    /**
     * Annual recurrence - work order generated every year
     */
    ANNUALLY(12);

    private final int monthsInterval;

    RecurrenceType(int monthsInterval) {
        this.monthsInterval = monthsInterval;
    }

    /**
     * Get the number of months between generations for this recurrence type.
     *
     * @return Number of months between work order generations
     */
    public int getMonthsInterval() {
        return monthsInterval;
    }

    /**
     * Get display label for this recurrence type.
     *
     * @return Human-readable label
     */
    public String getLabel() {
        return switch (this) {
            case MONTHLY -> "Every month";
            case QUARTERLY -> "Every 3 months";
            case SEMI_ANNUALLY -> "Every 6 months";
            case ANNUALLY -> "Every year";
        };
    }
}
