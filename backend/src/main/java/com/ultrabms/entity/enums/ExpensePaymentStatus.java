package com.ultrabms.entity.enums;

/**
 * Payment status enumeration for expenses.
 * Tracks the payment lifecycle of an expense.
 *
 * Story 6.2: Expense Management and Vendor Payments
 */
public enum ExpensePaymentStatus {
    /**
     * Expense recorded but not yet paid
     */
    PENDING("Pending"),

    /**
     * Expense has been paid
     */
    PAID("Paid");

    private final String displayName;

    ExpensePaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Get the display name for this status
     *
     * @return Human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }
}
