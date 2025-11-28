package com.ultrabms.entity.enums;

/**
 * Payment method enumeration
 * Defines different payment methods accepted for rent
 */
public enum PaymentMethod {
    /**
     * Bank transfer payment
     */
    BANK_TRANSFER,

    /**
     * Cheque payment
     */
    CHEQUE,

    /**
     * Post-dated cheques
     */
    PDC,

    /**
     * Cash payment
     */
    CASH,

    /**
     * Credit/Debit card payment
     */
    CARD,

    /**
     * Online payment (other electronic methods)
     */
    ONLINE
}
