package com.ultrabms.entity.enums;

/**
 * Property status enumeration.
 * Tracks whether a property is actively being managed.
 */
public enum PropertyStatus {
    /**
     * Property is actively being managed
     */
    ACTIVE,

    /**
     * Property is inactive (soft deleted or temporarily disabled)
     */
    INACTIVE
}
