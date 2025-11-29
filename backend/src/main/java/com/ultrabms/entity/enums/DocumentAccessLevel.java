package com.ultrabms.entity.enums;

/**
 * Document access level enumeration
 * Story 7.2: Document Management System
 *
 * Defines access control levels for documents.
 */
public enum DocumentAccessLevel {
    /**
     * Public access - all authenticated users can view/download
     */
    PUBLIC("Public", "All authenticated users can access"),

    /**
     * Internal access - staff members only (Property Manager, Maintenance Supervisor, Finance Manager, Super Admin)
     */
    INTERNAL("Internal", "Staff members only"),

    /**
     * Restricted access - specific role check based on entity type
     */
    RESTRICTED("Restricted", "Specific roles only");

    private final String displayName;
    private final String description;

    DocumentAccessLevel(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    /**
     * Get the display name for this access level
     *
     * @return human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get the description for this access level
     *
     * @return access level description
     */
    public String getDescription() {
        return description;
    }
}
