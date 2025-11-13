package com.ultrabms.entity.enums;

/**
 * User role enumeration for RBAC.
 * Defines the six primary user roles in the Ultra BMS system.
 */
public enum UserRole {
    /**
     * Super Administrator - Full system access and configuration
     */
    SUPER_ADMIN,

    /**
     * Property Manager - Property-specific management and oversight
     */
    PROPERTY_MANAGER,

    /**
     * Maintenance Supervisor - Work order and vendor management
     */
    MAINTENANCE_SUPERVISOR,

    /**
     * Finance Manager - Financial operations and reporting
     */
    FINANCE_MANAGER,

    /**
     * Tenant - Self-service portal access
     */
    TENANT,

    /**
     * Vendor - Job assignment and completion tracking
     */
    VENDOR
}
