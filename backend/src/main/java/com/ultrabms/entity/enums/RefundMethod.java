package com.ultrabms.entity.enums;

/**
 * Method of deposit refund payment.
 *
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 */
public enum RefundMethod {
    /**
     * Bank transfer to tenant's account
     */
    BANK_TRANSFER,

    /**
     * Physical cheque issued to tenant
     */
    CHEQUE,

    /**
     * Cash payment to tenant
     */
    CASH
}
