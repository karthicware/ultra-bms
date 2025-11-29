package com.ultrabms.entity.enums;

/**
 * New payment method enumeration for PDC withdrawal replacement
 * When a PDC is withdrawn, tenant may provide alternative payment
 *
 * Story 6.3: Post-Dated Cheque (PDC) Management
 */
public enum NewPaymentMethod {
    /**
     * Bank transfer replacement
     */
    BANK_TRANSFER,

    /**
     * Cash replacement
     */
    CASH,

    /**
     * New cheque replacement (not PDC, immediate cheque)
     */
    NEW_CHEQUE
}
