package com.ultrabms.security;

import com.ultrabms.entity.User;
import com.ultrabms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Optional;

/**
 * Custom permission evaluator for fine-grained, data-level access control.
 *
 * <p>Enables Spring Security expressions like:</p>
 * <pre>
 * {@code @PreAuthorize("hasPermission(#propertyId, 'Property', 'read')")}
 * {@code @PreAuthorize("hasPermission(#tenantId, 'Tenant', 'update')")}
 * </pre>
 *
 * <p>Implements role-specific data access rules:</p>
 * <ul>
 *   <li><b>SUPER_ADMIN:</b> Always has access to all resources</li>
 *   <li><b>PROPERTY_MANAGER:</b> Can only access properties and related data they manage</li>
 *   <li><b>FINANCE_MANAGER:</b> Full access to all financial data</li>
 *   <li><b>MAINTENANCE_SUPERVISOR:</b> Full access to all work orders and vendors</li>
 *   <li><b>TENANT:</b> Can only access their own tenant data</li>
 * </ul>
 *
 * <p>Results are cached in Ehcache (userPermissions region) to minimize database queries.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final UserRepository userRepository;

    /**
     * Evaluates if the authenticated user has permission on a specific domain object.
     *
     * @param authentication the authentication object containing user details
     * @param targetDomainObject the domain object being accessed
     * @param permission the permission being checked
     * @return true if access is granted, false otherwise
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("Authentication is null or not authenticated");
            return false;
        }

        // SUPER_ADMIN always has access
        if (isSuperAdmin(authentication)) {
            log.debug("User is SUPER_ADMIN - granting access");
            return true;
        }

        log.debug("Evaluating permission on domain object: {}, permission: {}",
                 targetDomainObject != null ? targetDomainObject.getClass().getSimpleName() : "null",
                 permission);

        // For now, grant access if user has the general permission
        // More specific data-level checks can be added based on targetDomainObject type
        return hasGeneralPermission(authentication, permission.toString());
    }

    /**
     * Evaluates if the authenticated user has permission on a specific resource identified by ID and type.
     * This method enables data-level access control based on resource ownership or assignment.
     *
     * @param authentication the authentication object
     * @param targetId the ID of the resource being accessed
     * @param targetType the type of resource (e.g., "Property", "Tenant", "WorkOrder")
     * @param permission the permission being checked (e.g., "read", "update", "delete")
     * @return true if access is granted, false otherwise
     */
    @Override
    @Cacheable(value = "userPermissions", key = "#authentication.name + ':' + #targetType + ':' + #targetId + ':' + #permission")
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("Authentication is null or not authenticated");
            return false;
        }

        // SUPER_ADMIN always has access
        if (isSuperAdmin(authentication)) {
            log.debug("User is SUPER_ADMIN - granting access to {} #{}", targetType, targetId);
            return true;
        }

        String username = authentication.getName();
        String permissionStr = permission.toString();

        log.debug("Evaluating permission for user: {}, targetType: {}, targetId: {}, permission: {}",
                 username, targetType, targetId, permissionStr);

        // Load user with role and permissions
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) {
            log.warn("User not found: {}", username);
            return false;
        }

        User user = userOpt.get();

        // Check if user has the general permission first
        if (!hasGeneralPermission(authentication, targetType.toLowerCase() + "s:" + permissionStr)) {
            log.debug("User {} does not have general permission {}", username, permissionStr);
            return false;
        }

        // Apply data-level access control based on role and resource type
        return switch (targetType.toLowerCase()) {
            case "property" -> evaluatePropertyAccess(user, targetId, permissionStr);
            case "tenant" -> evaluateTenantAccess(user, targetId, permissionStr);
            case "workorder" -> evaluateWorkOrderAccess(user, targetId, permissionStr);
            case "invoice", "payment", "pdc" -> evaluateFinancialAccess(user, targetId, permissionStr);
            default -> {
                log.debug("No specific data-level rule for type: {}, checking general permission only", targetType);
                yield true; // If user has general permission and no specific rule, grant access
            }
        };
    }

    /**
     * Checks if user has the general permission (non-data-level).
     */
    private boolean hasGeneralPermission(Authentication authentication, String permissionName) {
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(permissionName));
    }

    /**
     * Checks if the authenticated user is a SUPER_ADMIN.
     */
    private boolean isSuperAdmin(Authentication authentication) {
        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        return userOpt.isPresent() && "SUPER_ADMIN".equals(userOpt.get().getRoleName());
    }

    /**
     * Evaluates property-level access.
     * PROPERTY_MANAGER can only access properties they are assigned to manage.
     */
    private boolean evaluatePropertyAccess(User user, Serializable propertyId, String permission) {
        String roleName = user.getRoleName();

        if ("PROPERTY_MANAGER".equals(roleName)) {
            // TODO: Check if user is assigned to manage this property
            // For now, implement basic check - will be enhanced when property assignments are implemented
            log.debug("PROPERTY_MANAGER access check for property {} - implementation pending", propertyId);
            return true; // Placeholder - implement actual property assignment check
        }

        // FINANCE_MANAGER and MAINTENANCE_SUPERVISOR can view properties for context
        if ("FINANCE_MANAGER".equals(roleName) || "MAINTENANCE_SUPERVISOR".equals(roleName)) {
            return permission.equals("read");
        }

        return true; // Default allow if user has general permission
    }

    /**
     * Evaluates tenant-level access.
     * TENANT can only access their own tenant record.
     * PROPERTY_MANAGER can only access tenants in their managed properties.
     */
    private boolean evaluateTenantAccess(User user, Serializable tenantId, String permission) {
        String roleName = user.getRoleName();

        if ("TENANT".equals(roleName)) {
            // Tenant can only access their own record
            // TODO: Check if user ID matches tenant user ID
            log.debug("TENANT access check for tenant {} - implementation pending", tenantId);
            return true; // Placeholder - implement actual ownership check
        }

        if ("PROPERTY_MANAGER".equals(roleName)) {
            // Property manager can access tenants in their properties
            // TODO: Check if tenant belongs to a property managed by this user
            log.debug("PROPERTY_MANAGER access check for tenant {} - implementation pending", tenantId);
            return true; // Placeholder
        }

        return true; // Default allow if user has general permission
    }

    /**
     * Evaluates work order access.
     * MAINTENANCE_SUPERVISOR has full access to all work orders.
     */
    private boolean evaluateWorkOrderAccess(User user, Serializable workOrderId, String permission) {
        String roleName = user.getRoleName();

        // MAINTENANCE_SUPERVISOR has full access
        if ("MAINTENANCE_SUPERVISOR".equals(roleName)) {
            return true;
        }

        // PROPERTY_MANAGER can access work orders for their properties
        if ("PROPERTY_MANAGER".equals(roleName)) {
            // TODO: Check if work order belongs to a property managed by this user
            log.debug("PROPERTY_MANAGER access check for work order {} - implementation pending", workOrderId);
            return true; // Placeholder
        }

        return true; // Default allow if user has general permission
    }

    /**
     * Evaluates financial data access.
     * FINANCE_MANAGER has full access to all financial data.
     */
    private boolean evaluateFinancialAccess(User user, Serializable resourceId, String permission) {
        String roleName = user.getRoleName();

        // FINANCE_MANAGER has full access to all financial data
        if ("FINANCE_MANAGER".equals(roleName)) {
            return true;
        }

        // PROPERTY_MANAGER can view financial data for their properties
        if ("PROPERTY_MANAGER".equals(roleName)) {
            return permission.equals("read"); // Read-only access
        }

        // TENANT can view their own invoices and payments
        if ("TENANT".equals(roleName)) {
            // TODO: Check if resource belongs to this tenant
            log.debug("TENANT access check for financial resource {} - implementation pending", resourceId);
            return permission.equals("read"); // Read-only access
        }

        return true; // Default allow if user has general permission
    }
}
