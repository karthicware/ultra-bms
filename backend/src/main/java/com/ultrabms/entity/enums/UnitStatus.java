package com.ultrabms.entity.enums;

/**
 * Unit status enumeration.
 * Tracks the current availability and operational status of a unit.
 */
public enum UnitStatus {
    /**
     * Unit is available for new tenants
     */
    AVAILABLE,

    /**
     * Unit is currently occupied by a tenant
     */
    OCCUPIED,

    /**
     * Unit is under maintenance and unavailable
     */
    UNDER_MAINTENANCE
}
