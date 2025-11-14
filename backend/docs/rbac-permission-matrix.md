# Role-Based Access Control (RBAC) Permission Matrix

## Overview

This document defines the permission matrix for Ultra BMS's Role-Based Access Control system. Each role is assigned a specific set of permissions that control access to features and data.

## User Roles

The system supports six user roles:

1. **SUPER_ADMIN** - Full system access and configuration
2. **PROPERTY_MANAGER** - Property-specific management
3. **MAINTENANCE_SUPERVISOR** - Maintenance operations and vendor management
4. **FINANCE_MANAGER** - Financial operations and reporting
5. **TENANT** - Self-service portal access
6. **VENDOR** - Work order completion tracking

## Permission Categories

### User Management Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `user:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user:read` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user:update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user:manage:all` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Property Management Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `property:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `property:read` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `property:update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `property:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `property:read:all` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `property:read:assigned` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Note:** Property Managers can only read and update properties assigned to them.

### Tenant Management Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `tenant:create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `tenant:read` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `tenant:update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `tenant:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `tenant:read:own` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

**Note:** Tenants can only access their own tenant data.

### Work Order Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `workorder:create` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `workorder:read` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `workorder:update` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `workorder:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workorder:assign` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `workorder:approve` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Notes:**
- Tenants can create work orders (maintenance requests) and view their own work orders
- Vendors can read and update work orders assigned to them

### Financial Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `financial:read` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `financial:create` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `financial:update` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `financial:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `financial:report` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `financial:pdc` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

**Note:** Property Managers can view financial reports for their assigned properties only.

### Vendor Management Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `vendor:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `vendor:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `vendor:update` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `vendor:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `vendor:performance` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### System Configuration Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `system:config` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `system:admin` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Amenity Booking Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `amenity:book` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `amenity:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Payment Permissions

| Permission | SUPER_ADMIN | PROPERTY_MANAGER | MAINTENANCE_SUPERVISOR | FINANCE_MANAGER | TENANT | VENDOR |
|------------|-------------|------------------|------------------------|-----------------|--------|--------|
| `payment:make` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `payment:process` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `payment:refund` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

## Role Descriptions

### SUPER_ADMIN
**Full system access** - Can perform all operations across all modules. Has access to:
- User management (create, update, delete users)
- System configuration
- All properties and data
- All financial operations
- All work orders
- All vendor management
- All amenity management

### PROPERTY_MANAGER
**Property-specific management** - Can manage assigned properties and associated data:
- Manage tenants for their properties
- Create and assign work orders
- View financial reports for their properties
- Manage amenity bookings
- Read vendor information
- **Cannot**: Delete properties, modify system settings, access other properties

### MAINTENANCE_SUPERVISOR
**Maintenance operations** - Focused on work order and vendor management:
- View and manage work orders
- Assign jobs to vendors
- Update work order status
- View and update vendor information
- View vendor performance metrics
- **Cannot**: Access financial data or tenant contracts

### FINANCE_MANAGER
**Financial operations** - Manages all financial aspects:
- View and manage all financial transactions
- Generate financial reports
- Process payments and invoices
- PDC (Post-Dated Check) management
- View tenant information
- View all properties
- **Cannot**: Manage maintenance operations

### TENANT
**Self-service portal** - Limited to their own data and services:
- View their own lease and payment history
- Submit maintenance requests
- Make online payments
- Book amenities
- **Cannot**: Access other tenants' data or administrative functions

### VENDOR
**Basic authenticated access** - Minimal permissions:
- View and update work orders assigned to them
- **Cannot**: Access other vendors' work or administrative functions

## Data-Level Access Control

### Property-Level Access
- **SUPER_ADMIN**: Access to all properties
- **PROPERTY_MANAGER**: Only properties assigned to them
- **FINANCE_MANAGER**: All properties (read-only for reports)
- **Others**: No direct property access

### Tenant-Level Access
- **SUPER_ADMIN**: All tenants
- **PROPERTY_MANAGER**: Tenants in their assigned properties
- **FINANCE_MANAGER**: All tenants (for financial operations)
- **TENANT**: Only their own tenant record
- **Others**: No tenant access

### Work Order Access
- **SUPER_ADMIN**: All work orders
- **PROPERTY_MANAGER**: Work orders for their properties
- **MAINTENANCE_SUPERVISOR**: All work orders
- **TENANT**: Only their own work orders
- **VENDOR**: Only work orders assigned to them

### Financial Data Access
- **SUPER_ADMIN**: All financial data
- **PROPERTY_MANAGER**: Financial data for their properties
- **FINANCE_MANAGER**: All financial data
- **Others**: No financial data access

## Implementation Notes

1. **Permission Inheritance**: SUPER_ADMIN role inherits all permissions automatically
2. **Caching**: User permissions are cached in Ehcache to reduce database queries
3. **Method Security**: Permissions are enforced using Spring Security's `@PreAuthorize` annotations
4. **Custom Evaluator**: Fine-grained access control uses `CustomPermissionEvaluator` for property-level checks
5. **Audit Logging**: All authentication and authorization attempts are logged for security auditing

## Usage Examples

### Controller Method Protection
```java
@PreAuthorize("hasAuthority('user:create') or hasRole('SUPER_ADMIN')")
public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto userDto) {
    // Method implementation
}
```

### Property-Specific Access Check
```java
@PreAuthorize("hasPermission(#propertyId, 'Property', 'READ')")
public ResponseEntity<PropertyDto> getProperty(@PathVariable UUID propertyId) {
    // Method implementation
}
```

### Multiple Permission Check
```java
@PreAuthorize("hasAnyAuthority('tenant:read', 'tenant:update') and hasRole('PROPERTY_MANAGER')")
public ResponseEntity<TenantDto> updateTenant(@PathVariable UUID id, @RequestBody TenantDto dto) {
    // Method implementation
}
```

## API Response Codes

- **401 Unauthorized**: Invalid or expired authentication token
- **403 Forbidden**: Valid token but insufficient permissions
  - Response includes required permission in error message
  - Example: "Access denied: user:create permission required"

## Future Enhancements

1. **Dynamic Role Assignment**: Allow custom roles with configurable permissions
2. **Permission Groups**: Group related permissions for easier management
3. **Time-Based Access**: Permissions that expire or activate at specific times
4. **Location-Based Access**: Restrict access based on user location
5. **Multi-Factor Authentication**: Enhanced security for sensitive operations

## References

- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)
- Story 2.2: Role-Based Access Control Implementation
