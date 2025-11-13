package com.ultrabms.security;

import com.ultrabms.entity.enums.Permission;
import com.ultrabms.entity.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for RolePermissionService.
 * Tests role-to-permission mappings for RBAC implementation.
 */
@DisplayName("RolePermissionService Tests")
class RolePermissionServiceTest {

    private RolePermissionService rolePermissionService;

    @BeforeEach
    void setUp() {
        rolePermissionService = new RolePermissionService();
    }

    @Nested
    @DisplayName("SUPER_ADMIN Role Tests")
    class SuperAdminRoleTests {

        @Test
        @DisplayName("Should have all permissions")
        void shouldHaveAllPermissions() {
            Set<Permission> permissions = rolePermissionService.getPermissionsForRole(UserRole.SUPER_ADMIN);

            // Super admin should have all permission categories
            assertThat(permissions).contains(
                Permission.USER_MANAGE_ALL,
                Permission.PROPERTY_READ_ALL,
                Permission.FINANCIAL_CREATE,
                Permission.SYSTEM_ADMIN,
                Permission.VENDOR_DELETE
            );
        }

        @Test
        @DisplayName("Should have user management permissions")
        void shouldHaveUserManagementPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.SUPER_ADMIN, Permission.USER_CREATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.SUPER_ADMIN, Permission.USER_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.SUPER_ADMIN, Permission.USER_UPDATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.SUPER_ADMIN, Permission.USER_DELETE)).isTrue();
        }
    }

    @Nested
    @DisplayName("PROPERTY_MANAGER Role Tests")
    class PropertyManagerRoleTests {

        @Test
        @DisplayName("Should have property read assigned permission")
        void shouldHavePropertyReadAssignedPermission() {
            assertThat(rolePermissionService.hasPermission(
                UserRole.PROPERTY_MANAGER,
                Permission.PROPERTY_READ_ASSIGNED
            )).isTrue();
        }

        @Test
        @DisplayName("Should have tenant management permissions")
        void shouldHaveTenantManagementPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.TENANT_CREATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.TENANT_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.TENANT_UPDATE)).isTrue();
        }

        @Test
        @DisplayName("Should have work order permissions")
        void shouldHaveWorkOrderPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.WORKORDER_CREATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.WORKORDER_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.WORKORDER_ASSIGN)).isTrue();
        }

        @Test
        @DisplayName("Should not have financial write permissions")
        void shouldNotHaveFinancialWritePermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.FINANCIAL_CREATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.FINANCIAL_UPDATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.FINANCIAL_PDC)).isFalse();
        }

        @Test
        @DisplayName("Should have financial read permissions")
        void shouldHaveFinancialReadPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.FINANCIAL_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.FINANCIAL_REPORT)).isTrue();
        }

        @Test
        @DisplayName("Should not have system admin permissions")
        void shouldNotHaveSystemAdminPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.SYSTEM_ADMIN)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.PROPERTY_MANAGER, Permission.SYSTEM_CONFIG)).isFalse();
        }
    }

    @Nested
    @DisplayName("MAINTENANCE_SUPERVISOR Role Tests")
    class MaintenanceSupervisorRoleTests {

        @Test
        @DisplayName("Should have work order management permissions")
        void shouldHaveWorkOrderManagementPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.WORKORDER_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.WORKORDER_UPDATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.WORKORDER_ASSIGN)).isTrue();
        }

        @Test
        @DisplayName("Should have vendor management permissions")
        void shouldHaveVendorManagementPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.VENDOR_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.VENDOR_UPDATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.VENDOR_PERFORMANCE)).isTrue();
        }

        @Test
        @DisplayName("Should not have financial permissions")
        void shouldNotHaveFinancialPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.FINANCIAL_READ)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.FINANCIAL_CREATE)).isFalse();
        }

        @Test
        @DisplayName("Should not have tenant management permissions")
        void shouldNotHaveTenantManagementPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.TENANT_CREATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.MAINTENANCE_SUPERVISOR, Permission.TENANT_UPDATE)).isFalse();
        }
    }

    @Nested
    @DisplayName("FINANCE_MANAGER Role Tests")
    class FinanceManagerRoleTests {

        @Test
        @DisplayName("Should have all financial permissions")
        void shouldHaveAllFinancialPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.FINANCIAL_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.FINANCIAL_CREATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.FINANCIAL_UPDATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.FINANCIAL_REPORT)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.FINANCIAL_PDC)).isTrue();
        }

        @Test
        @DisplayName("Should have payment processing permissions")
        void shouldHavePaymentProcessingPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.PAYMENT_PROCESS)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.PAYMENT_REFUND)).isTrue();
        }

        @Test
        @DisplayName("Should have property and tenant read permissions")
        void shouldHavePropertyAndTenantReadPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.PROPERTY_READ_ALL)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.TENANT_READ)).isTrue();
        }

        @Test
        @DisplayName("Should not have maintenance permissions")
        void shouldNotHaveMaintenancePermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.WORKORDER_CREATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.WORKORDER_ASSIGN)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.FINANCE_MANAGER, Permission.VENDOR_UPDATE)).isFalse();
        }
    }

    @Nested
    @DisplayName("TENANT Role Tests")
    class TenantRoleTests {

        @Test
        @DisplayName("Should have self-service permissions")
        void shouldHaveSelfServicePermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.TENANT_READ_OWN)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.WORKORDER_CREATE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.WORKORDER_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.PAYMENT_MAKE)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.AMENITY_BOOK)).isTrue();
        }

        @Test
        @DisplayName("Should not have administrative permissions")
        void shouldNotHaveAdministrativePermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.USER_CREATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.PROPERTY_CREATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.FINANCIAL_READ)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.TENANT, Permission.VENDOR_READ)).isFalse();
        }

        @Test
        @DisplayName("Should have minimal permission set")
        void shouldHaveMinimalPermissionSet() {
            Set<Permission> permissions = rolePermissionService.getPermissionsForRole(UserRole.TENANT);
            assertThat(permissions).hasSize(5); // Only 5 permissions for tenants
        }
    }

    @Nested
    @DisplayName("VENDOR Role Tests")
    class VendorRoleTests {

        @Test
        @DisplayName("Should have work order access")
        void shouldHaveWorkOrderAccess() {
            assertThat(rolePermissionService.hasPermission(UserRole.VENDOR, Permission.WORKORDER_READ)).isTrue();
            assertThat(rolePermissionService.hasPermission(UserRole.VENDOR, Permission.WORKORDER_UPDATE)).isTrue();
        }

        @Test
        @DisplayName("Should not have other permissions")
        void shouldNotHaveOtherPermissions() {
            assertThat(rolePermissionService.hasPermission(UserRole.VENDOR, Permission.WORKORDER_CREATE)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.VENDOR, Permission.FINANCIAL_READ)).isFalse();
            assertThat(rolePermissionService.hasPermission(UserRole.VENDOR, Permission.PROPERTY_READ)).isFalse();
        }

        @Test
        @DisplayName("Should have minimal permission set")
        void shouldHaveMinimalPermissionSet() {
            Set<Permission> permissions = rolePermissionService.getPermissionsForRole(UserRole.VENDOR);
            assertThat(permissions).hasSize(2); // Only 2 permissions for vendors
        }
    }

    @Nested
    @DisplayName("Permission Query Methods Tests")
    class PermissionQueryMethodsTests {

        @Test
        @DisplayName("hasAnyPermission should return true if role has at least one permission")
        void hasAnyPermissionShouldReturnTrueIfRoleHasAtLeastOne() {
            boolean result = rolePermissionService.hasAnyPermission(
                UserRole.PROPERTY_MANAGER,
                Permission.TENANT_CREATE,
                Permission.VENDOR_DELETE,
                Permission.SYSTEM_ADMIN
            );
            assertThat(result).isTrue(); // Has TENANT_CREATE
        }

        @Test
        @DisplayName("hasAnyPermission should return false if role has none of the permissions")
        void hasAnyPermissionShouldReturnFalseIfRoleHasNone() {
            boolean result = rolePermissionService.hasAnyPermission(
                UserRole.TENANT,
                Permission.USER_CREATE,
                Permission.PROPERTY_DELETE,
                Permission.SYSTEM_ADMIN
            );
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("hasAllPermissions should return true if role has all permissions")
        void hasAllPermissionsShouldReturnTrueIfRoleHasAll() {
            boolean result = rolePermissionService.hasAllPermissions(
                UserRole.TENANT,
                Permission.TENANT_READ_OWN,
                Permission.PAYMENT_MAKE,
                Permission.AMENITY_BOOK
            );
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("hasAllPermissions should return false if role is missing any permission")
        void hasAllPermissionsShouldReturnFalseIfRoleMissingAny() {
            boolean result = rolePermissionService.hasAllPermissions(
                UserRole.TENANT,
                Permission.TENANT_READ_OWN,
                Permission.USER_CREATE
            );
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("getPermissionStrings should return list of permission strings")
        void getPermissionStringsShouldReturnListOfPermissionStrings() {
            var permissions = rolePermissionService.getPermissionStrings(UserRole.TENANT);

            assertThat(permissions).contains(
                "tenant:read:own",
                "workorder:create",
                "workorder:read",
                "payment:make",
                "amenity:book"
            );
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should return empty set for null role")
        void shouldReturnEmptySetForNullRole() {
            Set<Permission> permissions = rolePermissionService.getPermissionsForRole(null);
            assertThat(permissions).isEmpty();
        }

        @Test
        @DisplayName("Should return false for null permission check")
        void shouldReturnFalseForNullPermissionCheck() {
            boolean result = rolePermissionService.hasPermission(UserRole.TENANT, null);
            assertThat(result).isFalse();
        }
    }
}
