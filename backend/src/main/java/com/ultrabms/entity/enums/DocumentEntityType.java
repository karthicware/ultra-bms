package com.ultrabms.entity.enums;

/**
 * Document entity type enumeration
 * Story 7.2: Document Management System
 *
 * Defines which entity type a document is associated with.
 */
public enum DocumentEntityType {
    /**
     * Document associated with a property
     */
    PROPERTY("Property"),

    /**
     * Document associated with a tenant
     */
    TENANT("Tenant"),

    /**
     * Document associated with a vendor
     */
    VENDOR("Vendor"),

    /**
     * Document associated with an asset
     */
    ASSET("Asset"),

    /**
     * General document not associated with any specific entity
     */
    GENERAL("General");

    private final String displayName;

    DocumentEntityType(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Get the display name for this entity type
     *
     * @return human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Check if this entity type requires an entity ID
     *
     * @return true if entityId is required, false for GENERAL
     */
    public boolean requiresEntityId() {
        return this != GENERAL;
    }
}
