package com.ultrabms.security;

import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.Permission;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.UUID;

/**
 * Custom permission evaluator for fine-grained access control.
 * Enables complex permission checks in @PreAuthorize annotations using hasPermission().
 *
 * Example usage:
 * @PreAuthorize("hasPermission(#propertyId, 'Property', 'READ')")
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final UserRepository userRepository;
    private final RolePermissionService rolePermissionService;

    /**
     * Evaluate permission on a domain object.
     *
     * @param authentication the current authentication
     * @param targetDomainObject the target object (e.g., Property, Tenant)
     * @param permission the permission to check
     * @return true if permission is granted
     */
    @Override
    public boolean hasPermission(Authentication authentication,
                                Object targetDomainObject,
                                Object permission) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !user.getActive()) {
            return false;
        }

        // Super admin has all permissions
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }

        // Check if user has the required permission
        String permissionString = permission.toString();
        return hasPermission(user.getRole(), permissionString);
    }

    /**
     * Evaluate permission on a domain object by ID.
     *
     * @param authentication the current authentication
     * @param targetId the target object ID
     * @param targetType the target object type (e.g., "Property", "Tenant")
     * @param permission the permission to check
     * @return true if permission is granted
     */
    @Override
    public boolean hasPermission(Authentication authentication,
                                Serializable targetId,
                                String targetType,
                                Object permission) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !user.getActive()) {
            return false;
        }

        // Super admin has all permissions
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }

        String permissionString = permission.toString();

        // Entity-specific permission checks
        switch (targetType) {
            case "Property":
                return checkPropertyPermission(user, targetId, permissionString);
            case "Tenant":
                return checkTenantPermission(user, targetId, permissionString);
            case "WorkOrder":
                return checkWorkOrderPermission(user, targetId, permissionString);
            case "Financial":
                return checkFinancialPermission(user, targetId, permissionString);
            default:
                // Default to role-based permission check
                return hasPermission(user.getRole(), permissionString);
        }
    }

    /**
     * Check if a role has a specific permission.
     */
    private boolean hasPermission(UserRole role, String permissionString) {
        try {
            // Try to match the permission string to a Permission enum
            return rolePermissionService.getPermissionsForRole(role).stream()
                .anyMatch(p -> p.getPermission().equalsIgnoreCase(permissionString));
        } catch (Exception e) {
            log.warn("Invalid permission string: {}", permissionString);
            return false;
        }
    }

    /**
     * Check property-specific permissions.
     * Property managers can only access properties assigned to them.
     */
    private boolean checkPropertyPermission(User user, Serializable propertyId, String permission) {
        // Check if user has the base permission for properties
        if (!hasPermission(user.getRole(), permission)) {
            return false;
        }

        // Property managers can only access assigned properties
        if (user.getRole() == UserRole.PROPERTY_MANAGER) {
            // TODO: Implement property assignment check when property management is implemented
            // For now, property managers with PROPERTY_READ_ASSIGNED can read any property
            // This will be enhanced in Epic 3 with actual property assignments
            return hasPermission(user.getRole(), "property:read:assigned");
        }

        return true;
    }

    /**
     * Check tenant-specific permissions.
     * Tenants can only access their own data.
     */
    private boolean checkTenantPermission(User user, Serializable tenantId, String permission) {
        // Check if user has the base permission for tenants
        if (!hasPermission(user.getRole(), permission)) {
            return false;
        }

        // Tenants can only access their own data
        if (user.getRole() == UserRole.TENANT) {
            // TODO: Implement tenant ownership check when tenant management is implemented
            // For now, allow if user has TENANT_READ_OWN permission
            return hasPermission(user.getRole(), "tenant:read:own");
        }

        return true;
    }

    /**
     * Check work order-specific permissions.
     */
    private boolean checkWorkOrderPermission(User user, Serializable workOrderId, String permission) {
        // Check if user has the base permission for work orders
        if (!hasPermission(user.getRole(), permission)) {
            return false;
        }

        // Maintenance supervisors and property managers have work order access
        // Tenants can only see their own work orders
        if (user.getRole() == UserRole.TENANT) {
            // TODO: Implement work order ownership check
            return hasPermission(user.getRole(), "workorder:read");
        }

        return true;
    }

    /**
     * Check financial data permissions.
     */
    private boolean checkFinancialPermission(User user, Serializable financialId, String permission) {
        // Only finance manager and super admin can access financial data
        return user.getRole() == UserRole.FINANCE_MANAGER ||
               user.getRole() == UserRole.SUPER_ADMIN;
    }
}
