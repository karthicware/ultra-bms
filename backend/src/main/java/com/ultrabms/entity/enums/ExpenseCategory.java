package com.ultrabms.entity.enums;

/**
 * Expense category enumeration.
 * Categories for classifying expenses in the system.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #2: ExpenseCategory enum with display names
 */
public enum ExpenseCategory {
    /**
     * Maintenance and repair costs
     */
    MAINTENANCE("Maintenance"),

    /**
     * Utility bills (electricity, water, gas)
     */
    UTILITIES("Utilities"),

    /**
     * Staff salaries and wages
     */
    SALARIES("Salaries"),

    /**
     * Office and building supplies
     */
    SUPPLIES("Supplies"),

    /**
     * Insurance premiums
     */
    INSURANCE("Insurance"),

    /**
     * Property and other taxes
     */
    TAXES("Taxes"),

    /**
     * Miscellaneous expenses
     */
    OTHER("Other");

    private final String displayName;

    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Get the display name for this category
     *
     * @return Human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }
}
