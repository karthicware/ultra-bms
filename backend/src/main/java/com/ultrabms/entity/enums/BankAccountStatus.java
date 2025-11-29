package com.ultrabms.entity.enums;

/**
 * Status enum for bank accounts.
 *
 * Story 6.5: Bank Account Management
 * AC #2: Status badge (ACTIVE/INACTIVE) in list table
 */
public enum BankAccountStatus {
    /**
     * Bank account is active and can be used for transactions
     */
    ACTIVE,

    /**
     * Bank account is inactive (soft deleted or disabled)
     */
    INACTIVE
}
