package com.ultrabms.entity.enums;

/**
 * Permission enumeration for fine-grained access control.
 * Defines specific permissions that can be granted to roles.
 */
public enum Permission {

    // User Management Permissions
    USER_CREATE("user:create", "Create new users"),
    USER_READ("user:read", "View user information"),
    USER_UPDATE("user:update", "Update user information"),
    USER_DELETE("user:delete", "Delete users"),
    USER_MANAGE_ALL("user:manage:all", "Full user management access"),

    // Property Management Permissions
    PROPERTY_CREATE("property:create", "Create new properties"),
    PROPERTY_READ("property:read", "View property information"),
    PROPERTY_UPDATE("property:update", "Update property information"),
    PROPERTY_DELETE("property:delete", "Delete properties"),
    PROPERTY_READ_ALL("property:read:all", "View all properties"),
    PROPERTY_READ_ASSIGNED("property:read:assigned", "View assigned properties only"),

    // Tenant Management Permissions
    TENANT_CREATE("tenant:create", "Create tenant accounts"),
    TENANT_READ("tenant:read", "View tenant information"),
    TENANT_UPDATE("tenant:update", "Update tenant information"),
    TENANT_DELETE("tenant:delete", "Delete tenants"),
    TENANT_READ_OWN("tenant:read:own", "View own tenant data"),

    // Work Order Permissions
    WORKORDER_CREATE("workorder:create", "Create work orders"),
    WORKORDER_READ("workorder:read", "View work orders"),
    WORKORDER_UPDATE("workorder:update", "Update work orders"),
    WORKORDER_DELETE("workorder:delete", "Delete work orders"),
    WORKORDER_ASSIGN("workorder:assign", "Assign work orders to vendors"),
    WORKORDER_APPROVE("workorder:approve", "Approve work orders"),

    // Financial Permissions
    FINANCIAL_READ("financial:read", "View financial data"),
    FINANCIAL_CREATE("financial:create", "Create financial transactions"),
    FINANCIAL_UPDATE("financial:update", "Update financial transactions"),
    FINANCIAL_DELETE("financial:delete", "Delete financial transactions"),
    FINANCIAL_REPORT("financial:report", "Generate financial reports"),
    FINANCIAL_PDC("financial:pdc", "Manage post-dated checks"),

    // Vendor Management Permissions
    VENDOR_CREATE("vendor:create", "Create vendor accounts"),
    VENDOR_READ("vendor:read", "View vendor information"),
    VENDOR_UPDATE("vendor:update", "Update vendor information"),
    VENDOR_DELETE("vendor:delete", "Delete vendors"),
    VENDOR_PERFORMANCE("vendor:performance", "View vendor performance metrics"),

    // System Configuration Permissions
    SYSTEM_CONFIG("system:config", "Modify system configuration"),
    SYSTEM_ADMIN("system:admin", "Full system administration"),

    // Amenity Booking Permissions
    AMENITY_BOOK("amenity:book", "Book amenities"),
    AMENITY_MANAGE("amenity:manage", "Manage amenity bookings"),

    // Payment Permissions
    PAYMENT_MAKE("payment:make", "Make payments"),
    PAYMENT_PROCESS("payment:process", "Process payments"),
    PAYMENT_REFUND("payment:refund", "Issue refunds");

    private final String permission;
    private final String description;

    Permission(String permission, String description) {
        this.permission = permission;
        this.description = description;
    }

    public String getPermission() {
        return permission;
    }

    public String getDescription() {
        return description;
    }
}
