package com.ultrabms.entity.enums;

/**
 * Payment terms enumeration
 * Defines vendor payment schedule (net days)
 *
 * Story 5.1: Vendor Registration and Profile Management
 */
public enum PaymentTerms {
    /**
     * Payment due within 15 days of invoice
     */
    NET_15,

    /**
     * Payment due within 30 days of invoice (default)
     */
    NET_30,

    /**
     * Payment due within 45 days of invoice
     */
    NET_45,

    /**
     * Payment due within 60 days of invoice
     */
    NET_60
}
