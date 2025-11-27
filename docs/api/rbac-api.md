# Role-Based Access Control (RBAC) API Documentation

**Version:** 1.0
**Date:** 2025-11-27
**Story:** 2.2 - Role-Based Access Control (RBAC) Implementation

---

## Overview

The RBAC system provides fine-grained access control based on user roles and permissions. It supports both functional permissions (e.g., `user:create`) and data-level permissions (e.g., `property:read:123`).

## Roles and Permissions

The system defines the following standard roles:

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **SUPER_ADMIN** | Full system access | `*` (All permissions) |
| **PROPERTY_MANAGER** | Manages properties and tenants | `property:read`, `property:update`, `tenant:read`, `tenant:create`, `workorder:read`, `workorder:update` |
| **MAINTENANCE_SUPERVISOR** | Oversees maintenance operations | `workorder:read`, `workorder:update`, `vendor:read`, `vendor:create` |
| **FINANCE_MANAGER** | Manages financial records | `invoice:read`, `invoice:create`, `payment:read`, `payment:update` |
| **TENANT** | Access to own data only | `tenant:read:self`, `workorder:create:self`, `invoice:read:self` |
| **VENDOR** | Access to assigned work orders | `workorder:read:assigned`, `workorder:update:assigned` |

## Authorization Mechanisms

### 1. Functional Authorization
Checks if a user has a specific authority (permission) granted by their role.
- **Usage:** `@PreAuthorize("hasAuthority('user:create')")`
- **Scope:** Controller endpoints, Service methods.

### 2. Data-Level Authorization
Checks if a user has permission on a specific resource instance.
- **Usage:** `@PreAuthorize("hasPermission(#id, 'Property', 'read')")`
- **Evaluator:** `CustomPermissionEvaluator`
- **Logic:**
  - **SUPER_ADMIN:** Always allowed.
  - **PROPERTY_MANAGER:** Allowed if assigned to the property.
  - **TENANT:** Allowed if resource belongs to them.

## Caching

User permissions are cached to improve performance.
- **Cache Name:** `userPermissions`
- **TTL:** 10 minutes
- **Eviction:**
  - On role update
  - On permission assignment change
  - On user logout

## Error Handling

### 403 Forbidden
Returned when a user is authenticated but lacks the necessary permission.

**Response Body:**
```json
{
  "timestamp": "2025-11-27T10:30:00.000+00:00",
  "status": 403,
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. You do not have permission to access this resource.",
    "requiredPermission": "user:create" // Optional, if extractable
  },
  "path": "/api/v1/users",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 401 Unauthorized
Returned when authentication is missing or invalid.

**Response Body:**
```json
{
  "timestamp": "2025-11-27T10:30:00.000+00:00",
  "status": 401,
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide valid credentials."
  },
  "path": "/api/v1/users",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Frontend Integration

The frontend uses the `usePermission` hook to check permissions and conditionally render UI elements.

```typescript
const { hasPermission, hasRole } = usePermission();

if (hasPermission('user:create')) {
  return <CreateUserButton />;
}

if (hasRole('SUPER_ADMIN')) {
  return <AdminPanel />;
}
```

## Related Documentation
- [Story 2.2: RBAC Implementation](../sprint-artifacts/epic-2/2-2-role-based-access-control-rbac-implementation.md)
- [Session Management API](./session-management-api.md)
