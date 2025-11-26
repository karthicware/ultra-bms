package com.ultrabms.entity.enums;

/**
 * Vendor document type enumeration
 * Story 5.2: Vendor Document and License Management
 *
 * Defines different types of vendor compliance documents.
 * TRADE_LICENSE and INSURANCE are critical documents that affect vendor status.
 */
public enum VendorDocumentType {
    /**
     * Business trade license document (critical)
     * Required for vendor compliance, expiry triggers auto-suspension
     */
    TRADE_LICENSE,

    /**
     * Liability or professional insurance certificate (critical)
     * Required for vendor compliance, expiry triggers auto-suspension
     */
    INSURANCE,

    /**
     * Professional or trade certification
     * Optional, does not affect vendor status
     */
    CERTIFICATION,

    /**
     * Emirates ID or passport copy of contact person
     * Optional, does not affect vendor status
     */
    ID_COPY;

    /**
     * Check if this document type is critical for vendor compliance.
     * Critical documents trigger auto-suspension when expired.
     *
     * @return true if document type is critical
     */
    public boolean isCritical() {
        return this == TRADE_LICENSE || this == INSURANCE;
    }

    /**
     * Check if this document type requires an expiry date.
     * Critical documents (TRADE_LICENSE, INSURANCE) require expiry dates.
     *
     * @return true if expiry date is required
     */
    public boolean requiresExpiryDate() {
        return this == TRADE_LICENSE || this == INSURANCE;
    }
}
