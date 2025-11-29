package com.ultrabms.entity.enums;

/**
 * Asset document type enumeration.
 * Types of documents that can be attached to assets.
 *
 * Story 7.1: Asset Registry and Tracking
 * AC #5: AssetDocument entity with documentType enum
 */
public enum AssetDocumentType {
    /**
     * User manual or operating guide
     */
    MANUAL("Manual"),

    /**
     * Warranty certificate or terms
     */
    WARRANTY("Warranty"),

    /**
     * Purchase invoice or receipt
     */
    PURCHASE_INVOICE("Purchase Invoice"),

    /**
     * Technical specifications
     */
    SPECIFICATION("Specification"),

    /**
     * Other documents
     */
    OTHER("Other");

    private final String displayName;

    AssetDocumentType(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Get the display name for this document type
     *
     * @return Human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }
}
