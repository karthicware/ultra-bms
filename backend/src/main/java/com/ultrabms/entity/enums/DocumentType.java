package com.ultrabms.entity.enums;

/**
 * Document type enumeration
 * Defines different types of tenant documents
 */
public enum DocumentType {
    /**
     * Emirates ID or National ID document
     */
    EMIRATES_ID,

    /**
     * Passport copy
     */
    PASSPORT,

    /**
     * Visa copy
     */
    VISA,

    /**
     * Signed lease agreement
     */
    SIGNED_LEASE,

    /**
     * Mulkiya (vehicle registration) document
     */
    MULKIYA,

    /**
     * Other documents (salary certificate, bank statements, etc.)
     */
    OTHER
}
