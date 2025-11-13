package com.ultrabms.security;

import com.ultrabms.entity.enums.Permission;
import com.ultrabms.entity.enums.UserRole;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service to manage role-to-permission mappings for RBAC.
 * Implements the permission matrix as defined in Story 2.2.
 */
@Service
public class RolePermissionService {

    private static final Map<UserRole, Set<Permission>> ROLE_PERMISSIONS = new HashMap<>();

    static {
        // SUPER_ADMIN: Full system access
        ROLE_PERMISSIONS.put(UserRole.SUPER_ADMIN, Set.of(
            Permission.USER_MANAGE_ALL,
            Permission.USER_CREATE,
            Permission.USER_READ,
            Permission.USER_UPDATE,
            Permission.USER_DELETE,
            Permission.PROPERTY_CREATE,
            Permission.PROPERTY_READ,
            Permission.PROPERTY_UPDATE,
            Permission.PROPERTY_DELETE,
            Permission.PROPERTY_READ_ALL,
            Permission.TENANT_CREATE,
            Permission.TENANT_READ,
            Permission.TENANT_UPDATE,
            Permission.TENANT_DELETE,
            Permission.WORKORDER_CREATE,
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE,
            Permission.WORKORDER_DELETE,
            Permission.WORKORDER_ASSIGN,
            Permission.WORKORDER_APPROVE,
            Permission.FINANCIAL_READ,
            Permission.FINANCIAL_CREATE,
            Permission.FINANCIAL_UPDATE,
            Permission.FINANCIAL_DELETE,
            Permission.FINANCIAL_REPORT,
            Permission.FINANCIAL_PDC,
            Permission.VENDOR_CREATE,
            Permission.VENDOR_READ,
            Permission.VENDOR_UPDATE,
            Permission.VENDOR_DELETE,
            Permission.VENDOR_PERFORMANCE,
            Permission.SYSTEM_CONFIG,
            Permission.SYSTEM_ADMIN,
            Permission.AMENITY_BOOK,
            Permission.AMENITY_MANAGE,
            Permission.PAYMENT_MAKE,
            Permission.PAYMENT_PROCESS,
            Permission.PAYMENT_REFUND
        ));

        // PROPERTY_MANAGER: Manage assigned properties, tenants, work orders
        ROLE_PERMISSIONS.put(UserRole.PROPERTY_MANAGER, Set.of(
            Permission.PROPERTY_READ_ASSIGNED,
            Permission.PROPERTY_UPDATE,
            Permission.TENANT_CREATE,
            Permission.TENANT_READ,
            Permission.TENANT_UPDATE,
            Permission.WORKORDER_CREATE,
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE,
            Permission.WORKORDER_ASSIGN,
            Permission.FINANCIAL_READ,
            Permission.FINANCIAL_REPORT,
            Permission.VENDOR_READ,
            Permission.AMENITY_MANAGE
        ));

        // MAINTENANCE_SUPERVISOR: Manage work orders and vendors
        ROLE_PERMISSIONS.put(UserRole.MAINTENANCE_SUPERVISOR, Set.of(
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE,
            Permission.WORKORDER_ASSIGN,
            Permission.VENDOR_READ,
            Permission.VENDOR_UPDATE,
            Permission.VENDOR_PERFORMANCE
        ));

        // FINANCE_MANAGER: Financial operations and reporting
        ROLE_PERMISSIONS.put(UserRole.FINANCE_MANAGER, Set.of(
            Permission.FINANCIAL_READ,
            Permission.FINANCIAL_CREATE,
            Permission.FINANCIAL_UPDATE,
            Permission.FINANCIAL_REPORT,
            Permission.FINANCIAL_PDC,
            Permission.PAYMENT_PROCESS,
            Permission.PAYMENT_REFUND,
            Permission.TENANT_READ,
            Permission.PROPERTY_READ_ALL
        ));

        // TENANT: Self-service portal access
        ROLE_PERMISSIONS.put(UserRole.TENANT, Set.of(
            Permission.TENANT_READ_OWN,
            Permission.WORKORDER_CREATE,
            Permission.WORKORDER_READ,
            Permission.PAYMENT_MAKE,
            Permission.AMENITY_BOOK
        ));

        // VENDOR: Basic authenticated access (managed through vendor module)
        ROLE_PERMISSIONS.put(UserRole.VENDOR, Set.of(
            Permission.WORKORDER_READ,
            Permission.WORKORDER_UPDATE
        ));
    }

    /**
     * Get all permissions for a given role.
     *
     * @param role the user role
     * @return set of permissions for the role
     */
    public Set<Permission> getPermissionsForRole(UserRole role) {
        return ROLE_PERMISSIONS.getOrDefault(role, Collections.emptySet());
    }

    /**
     * Check if a role has a specific permission.
     *
     * @param role the user role
     * @param permission the permission to check
     * @return true if role has the permission
     */
    public boolean hasPermission(UserRole role, Permission permission) {
        return getPermissionsForRole(role).contains(permission);
    }

    /**
     * Check if a role has any of the specified permissions.
     *
     * @param role the user role
     * @param permissions the permissions to check
     * @return true if role has any of the permissions
     */
    public boolean hasAnyPermission(UserRole role, Permission... permissions) {
        Set<Permission> rolePermissions = getPermissionsForRole(role);
        return Arrays.stream(permissions).anyMatch(rolePermissions::contains);
    }

    /**
     * Check if a role has all of the specified permissions.
     *
     * @param role the user role
     * @param permissions the permissions to check
     * @return true if role has all of the permissions
     */
    public boolean hasAllPermissions(UserRole role, Permission... permissions) {
        Set<Permission> rolePermissions = getPermissionsForRole(role);
        return Arrays.stream(permissions).allMatch(rolePermissions::contains);
    }

    /**
     * Get all permissions as a list of strings for Spring Security.
     *
     * @param role the user role
     * @return list of permission strings
     */
    public List<String> getPermissionStrings(UserRole role) {
        return getPermissionsForRole(role).stream()
            .map(Permission::getPermission)
            .toList();
    }
}
