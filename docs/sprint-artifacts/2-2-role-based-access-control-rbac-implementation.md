# Story 2.2: Role-Based Access Control (RBAC) Implementation

Status: drafted

## Story

As a system administrator,
I want role-based permissions enforced across the application,
So that users can only access features appropriate to their role.

## Acceptance Criteria

1. **AC1 - Role and Permission Data Model:** Create normalized database schema with `roles` table (id, name, description), `permissions` table (id, name, resource, action), and `role_permissions` join table (role_id, permission_id). Roles include: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR. Permissions follow pattern: resource:action (e.g., "tenants:create", "work-orders:view", "invoices:edit"). SUPER_ADMIN role has ALL permissions. Flyway migration creates tables and seeds default roles with permission mappings.

2. **AC2 - Backend Method-Level Security:** Enable Spring Security method-level security with @EnableMethodSecurity annotation. Use @PreAuthorize annotations on controller methods (e.g., `@PreAuthorize("hasAuthority('tenants:create')")` on POST /api/v1/tenants). Use @Secured for role checks (e.g., `@Secured("ROLE_SUPER_ADMIN")` on system config endpoints). Return 403 Forbidden if user lacks required permission. Include required permission in error response message.

3. **AC3 - Custom Permission Evaluator:** Implement CustomPermissionEvaluator class implementing PermissionEvaluator interface for complex authorization rules. Support data-level access control (e.g., property managers can only access their assigned properties). Use @PreAuthorize with custom expressions like `@PreAuthorize("hasPermission(#propertyId, 'Property', 'read')")`. Cache permission checks in Ehcache to reduce database queries. Handle edge cases like SUPER_ADMIN always having access.

4. **AC4 - JWT Token Enhancement:** Extend JWT token payload to include permissions array. JwtTokenProvider.generateAccessToken() loads user's role permissions from database and adds to token claims. Token payload structure: { sub: userId, email, role: roleName, permissions: ["tenants:create", "work-orders:view"], iat, exp }. JwtAuthenticationFilter extracts permissions from token and populates Spring Security authorities. Refresh token flow reloads permissions from database to reflect permission changes.

5. **AC5 - User Service Permission Loading:** Create UserDetailsService implementation that loads user with authorities (permissions). On login, fetch user's role and associated permissions from role_permissions table. Convert permissions to GrantedAuthority objects for Spring Security. Cache user permissions in Ehcache with 10-minute TTL. Invalidate cache when user's role changes or permissions are updated.

6. **AC6 - Permission Matrix Documentation:** Create permission matrix as markdown table mapping roles to permissions. Document feature-level access (which roles can access which modules). Document data-level access rules (e.g., PROPERTY_MANAGER sees only assigned properties). Include special cases and permission inheritance rules. Store in docs/sprint-artifacts/rbac-permission-matrix.md. API endpoint GET /api/v1/permissions/matrix returns permission matrix JSON for admin UI.

7. **AC7 - Frontend Route Protection:** Implement Next.js middleware in middleware.ts for route-based authorization. Protected routes check JWT token for required role/permission. Redirect unauthorized users to /403 forbidden page. Create ProtectedRoute component wrapper for client-side route protection. Show loading state while checking permissions. Support role prop (e.g., `<ProtectedRoute role="SUPER_ADMIN">`) and permission prop (e.g., `<ProtectedRoute permission="tenants:create">`).

8. **AC8 - Frontend Permission Hook:** Create usePermission hook in hooks/usePermission.ts. Hook signature: `const { hasPermission, hasRole, isLoading } = usePermission()`. hasPermission(permission: string) checks if current user has specific permission. hasRole(role: string) checks if current user has specific role. Extract permissions from JWT token stored in memory/context. Return loading state while token is being validated. Use hook to conditionally render UI components (buttons, menu items, sections).

9. **AC9 - Role-Based Navigation Menu:** Update sidebar navigation to show/hide menu items based on user role. Define navigation structure with required permissions per menu item. Dynamically filter menu based on user's permissions from JWT token. Hide entire modules user cannot access (e.g., hide Finance menu for MAINTENANCE_SUPERVISOR). Show disabled state for features user can view but not edit. Admin users see all navigation items.

10. **AC10 - API Error Handling for Authorization:** Extend GlobalExceptionHandler to handle AccessDeniedException (thrown by Spring Security). Return 403 Forbidden with error response: { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to access this resource", requiredPermission: "tenants:delete" }, timestamp }. Handle both method-level (@PreAuthorize) and custom permission evaluator denials. Log authorization failures to audit_logs table with user ID, resource, action attempted, and IP address.

11. **AC11 - Permission Caching Strategy:** Configure Ehcache (from Story 1.3) with separate cache region for permissions. Cache key: userId, cache value: Set<String> permissions. TTL: 10 minutes, max entries: 10000. Evict cache entry when user's role changes or role permissions are modified. Implement @Cacheable("userPermissions") on permission loading method. Implement @CacheEvict for role/permission updates. Monitor cache hit rate via Spring Boot Actuator metrics.

12. **AC12 - Role Assignment API:** Create endpoint POST /api/v1/users/{userId}/role to assign role to user (SUPER_ADMIN only). Validate role exists in roles table. Update user.role_id foreign key. Invalidate user's permission cache. Log role change to audit_logs. Return updated user DTO with new role. Create endpoint GET /api/v1/roles to list all available roles (authenticated users). Include role description and permission count in response.

## Tasks / Subtasks

- [ ] **Task 1: Create Database Schema for RBAC** (AC: #1)
  - [ ] Create `roles` table Flyway migration: V9__create_roles_table.sql with columns (id, name UNIQUE, description, created_at)
  - [ ] Create `permissions` table migration: V10__create_permissions_table.sql with columns (id, name UNIQUE, resource, action, description, created_at)
  - [ ] Create `role_permissions` join table migration: V11__create_role_permissions_table.sql with composite PK (role_id, permission_id)
  - [ ] Seed roles data: Insert 6 default roles (SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR)
  - [ ] Seed permissions data: Insert permissions for all modules (tenants:create, tenants:read, tenants:update, tenants:delete, work-orders:create, etc.)
  - [ ] Seed role_permissions mappings: Assign permissions to each role per permission matrix
  - [ ] Add role_id foreign key to users table: V12__add_role_id_to_users.sql
  - [ ] Update existing users to reference roles table (migrate role string to role_id)

- [ ] **Task 2: Create JPA Entities for RBAC** (AC: #1, #5)
  - [ ] Create `Role` entity in com.ultrabms.entity package:
    - Fields: id (Long), name (String UNIQUE), description (String), createdAt (LocalDateTime)
    - Relationship: @ManyToMany with Permission (via role_permissions join table)
    - Named queries for findByName
  - [ ] Create `Permission` entity:
    - Fields: id (Long), name (String UNIQUE), resource (String), action (String), description (String), createdAt
    - Relationship: @ManyToMany(mappedBy="permissions") with Role
    - Method: String getAuthority() returns name (implements GrantedAuthority pattern)
  - [ ] Update `User` entity:
    - Add @ManyToOne relationship to Role: role (eager fetch)
    - Remove old role String field (replaced by role_id FK)
    - Add method: Collection<GrantedAuthority> getAuthorities() that returns role permissions
  - [ ] Create `RoleRepository` extending JpaRepository<Role, Long>:
    - findByName(String name): Optional<Role>
    - findAll(): List<Role> with @EntityGraph to fetch permissions
  - [ ] Create `PermissionRepository` extending JpaRepository<Permission, Long>:
    - findByName(String name): Optional<Permission>
    - findByResource(String resource): List<Permission>

- [ ] **Task 3: Enable Method-Level Security** (AC: #2)
  - [ ] Update SecurityConfig class with @EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
  - [ ] Configure MethodSecurityExpressionHandler bean with custom permission evaluator
  - [ ] Add @PreAuthorize annotations to controllers:
    - TenantController: "hasAuthority('tenants:create')" on POST, "hasAuthority('tenants:read')" on GET
    - WorkOrderController: "hasAuthority('work-orders:create')", "hasAuthority('work-orders:update')"
    - FinanceController: "hasAuthority('invoices:read')", "hasAuthority('pdcs:manage')"
    - UserController: "hasRole('SUPER_ADMIN')" on user management endpoints
  - [ ] Add @Secured("ROLE_SUPER_ADMIN") to system configuration endpoints
  - [ ] Test method security with MockMvc and @WithMockUser(authorities = {"tenants:read"})

- [ ] **Task 4: Implement Custom Permission Evaluator** (AC: #3)
  - [ ] Create `CustomPermissionEvaluator` class implementing PermissionEvaluator in com.ultrabms.security package
  - [ ] Implement hasPermission(Authentication auth, Object targetDomainObject, Object permission):
    - Extract user ID from authentication
    - Load user's permissions from cache or database
    - Check if user has required permission string
    - Handle SUPER_ADMIN special case (always return true)
  - [ ] Implement hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission):
    - Support data-level access control for Property, Tenant, WorkOrder entities
    - PROPERTY_MANAGER: check if targetId property is in user's assigned properties list
    - FINANCE_MANAGER: allow access to all financial data
    - MAINTENANCE_SUPERVISOR: allow access to all work orders
    - TENANT: allow access only to their own tenant ID
  - [ ] Register CustomPermissionEvaluator bean in SecurityConfig
  - [ ] Use in controllers: `@PreAuthorize("hasPermission(#propertyId, 'Property', 'read')")`
  - [ ] Add unit tests for permission evaluator with different roles and scenarios

- [ ] **Task 5: Enhance JWT Token with Permissions** (AC: #4)
  - [ ] Update JwtTokenProvider.generateAccessToken(User user) method:
    - Load user.getRole().getPermissions() (eager fetch or explicit query)
    - Extract permission names as String array: permissions = role.getPermissions().stream().map(Permission::getName).toArray()
    - Add permissions to JWT claims: .claim("permissions", permissions)
    - Add role name to claims: .claim("role", user.getRole().getName())
  - [ ] Update JwtTokenProvider.validateToken() to handle permissions claim
  - [ ] Update JwtAuthenticationFilter.doFilterInternal():
    - Extract permissions array from JWT token: List<String> permissions = jwtProvider.getPermissionsFromToken(token)
    - Convert to GrantedAuthority: authorities = permissions.stream().map(SimpleGrantedAuthority::new).collect()
    - Create UsernamePasswordAuthenticationToken with authorities
    - Set authentication in SecurityContextHolder
  - [ ] Update JwtTokenProvider with getPermissionsFromToken(String token) method extracting permissions claim
  - [ ] Update AuthService.refreshAccessToken() to reload user with role/permissions before generating new token
  - [ ] Test JWT token contains permissions array in payload

- [ ] **Task 6: Implement UserDetailsService with Permissions** (AC: #5)
  - [ ] Create `CustomUserDetailsService` class implementing UserDetailsService in com.ultrabms.service package
  - [ ] Implement loadUserByUsername(String email):
    - Find user by email with @EntityGraph(attributePaths = {"role", "role.permissions"}) for efficient loading
    - Convert user to Spring Security UserDetails object
    - Map role permissions to GrantedAuthority collection
    - Return UserDetails with username (email), password (hash), authorities (permissions)
  - [ ] Register CustomUserDetailsService bean in SecurityConfig
  - [ ] Update AuthService.login() to use UserDetailsService for authentication
  - [ ] Configure @Cacheable("userPermissions") on loadUserByUsername method
  - [ ] Add @CacheEvict on user role update methods
  - [ ] Configure Ehcache region in CacheConfig: userPermissions cache with 10-minute TTL, max 10000 entries

- [ ] **Task 7: Create Permission Matrix Documentation** (AC: #6)
  - [ ] Create docs/sprint-artifacts/rbac-permission-matrix.md file
  - [ ] Document markdown table: Rows = Roles, Columns = Permissions grouped by module
  - [ ] Mark permissions with ✓ (allowed), ✗ (denied), or ~ (data-level restricted)
  - [ ] Document data-level access rules:
    - PROPERTY_MANAGER: Only assigned properties, tenants in those properties, work orders for those properties
    - TENANT: Only their own tenant data, lease, payments, maintenance requests
  - [ ] Document permission inheritance: SUPER_ADMIN inherits all permissions
  - [ ] Create PermissionMatrixController with GET /api/v1/permissions/matrix endpoint:
    - Load all roles with permissions from database
    - Build JSON structure: { roles: [{ name, permissions: [{ resource, action, allowed }] }] }
    - Return 200 OK with permission matrix (SUPER_ADMIN only)
  - [ ] Add Swagger @Operation annotation for API documentation

- [ ] **Task 8: Implement Frontend Route Protection** (AC: #7)
  - [ ] Create middleware.ts in frontend src/ directory for Next.js middleware
  - [ ] Implement matcher config for protected routes: matcher: ['/dashboard/:path*', '/tenants/:path*', '/maintenance/:path*', '/finance/:path*']
  - [ ] Extract JWT token from cookies or Authorization header
  - [ ] Validate token and extract role/permissions
  - [ ] Check if current route requires specific role/permission (route configuration map)
  - [ ] Redirect to /403 if unauthorized, allow if authorized
  - [ ] Create app/(dashboard)/403/page.tsx - Forbidden error page with message and link to dashboard
  - [ ] Create components/auth/ProtectedRoute.tsx wrapper component:
    - Props: children, role?: string, permission?: string, fallback?: ReactNode
    - Use useAuth hook to get current user
    - Show loading skeleton while checking permissions
    - Render children if authorized, fallback or null if not
  - [ ] Test route protection with different roles

- [ ] **Task 9: Create Frontend Permission Hook** (AC: #8)
  - [ ] Create hooks/usePermission.ts custom React hook
  - [ ] Create useAuth hook (if not exists) to access current user and JWT token from context
  - [ ] Implement hasPermission(permission: string): boolean:
    - Extract permissions array from JWT token (stored in auth context)
    - Return permissions.includes(permission)
    - Return true if user is SUPER_ADMIN
  - [ ] Implement hasRole(role: string): boolean:
    - Extract role from JWT token
    - Return user.role === role
  - [ ] Return isLoading state while token is being validated (from auth context)
  - [ ] Example usage:
    ```tsx
    const { hasPermission } = usePermission()
    {hasPermission('tenants:delete') && <Button onClick={deleteTenant}>Delete</Button>}
    ```
  - [ ] Create HOC withPermission(Component, permission) for component-level protection

- [ ] **Task 10: Implement Role-Based Navigation Menu** (AC: #9)
  - [ ] Update sidebar navigation component (e.g., components/layout/Sidebar.tsx)
  - [ ] Define navigation structure with permissions:
    ```tsx
    const navItems = [
      { name: 'Dashboard', path: '/dashboard', icon: Home, permission: null }, // all roles
      { name: 'Tenants', path: '/tenants', icon: Users, permission: 'tenants:read' },
      { name: 'Maintenance', path: '/maintenance', icon: Wrench, permission: 'work-orders:read' },
      { name: 'Finance', path: '/finance', icon: DollarSign, permission: 'invoices:read' },
      { name: 'Settings', path: '/settings', icon: Settings, role: 'SUPER_ADMIN' }
    ]
    ```
  - [ ] Filter navItems based on usePermission hook:
    ```tsx
    const filteredNav = navItems.filter(item =>
      !item.permission || hasPermission(item.permission)
    ).filter(item =>
      !item.role || hasRole(item.role)
    )
    ```
  - [ ] Render only filtered navigation items in sidebar
  - [ ] Apply active state styling to current route
  - [ ] Show role badge in user profile section of sidebar

- [ ] **Task 11: Extend GlobalExceptionHandler for Authorization** (AC: #10)
  - [ ] Add @ExceptionHandler(AccessDeniedException.class) method to GlobalExceptionHandler
  - [ ] Return ResponseEntity with 403 status:
    - ErrorResponse DTO: { success: false, error: { code: "FORBIDDEN", message: "You do not have permission to access this resource", requiredPermission: extractFromException }, timestamp }
  - [ ] Extract required permission from exception message or annotation
  - [ ] Log authorization failure to audit_logs table:
    - Create AuditLogService.logAuthorizationFailure(userId, resource, action, ipAddress)
    - Save to audit_logs with action: "AUTHORIZATION_FAILED"
  - [ ] Handle MethodSecurityException (from @PreAuthorize failures)
  - [ ] Test with MockMvc: perform POST with insufficient permissions → expect 403

- [ ] **Task 12: Configure Permission Caching** (AC: #11)
  - [ ] Update CacheConfig to add "userPermissions" cache region
  - [ ] Configure Caffeine cache:
    - Cache name: "userPermissions"
    - TTL: 10 minutes (expireAfterWrite)
    - Max size: 10000 entries
    - Record stats: true (for monitoring)
  - [ ] Add @Cacheable("userPermissions", key = "#userId") to CustomUserDetailsService.loadUserByUsername()
  - [ ] Add @CacheEvict("userPermissions", key = "#userId") to UserService.updateUserRole(Long userId, Long roleId)
  - [ ] Add @CacheEvict("userPermissions", allEntries = true) to RoleService.updateRolePermissions(Long roleId, Set<Long> permissionIds)
  - [ ] Expose cache metrics via Spring Boot Actuator: /actuator/caches
  - [ ] Monitor cache hit rate in logs or metrics dashboard

- [ ] **Task 13: Create Role Assignment API** (AC: #12)
  - [ ] Create RoleService in com.ultrabms.service package:
    - assignRoleToUser(Long userId, Long roleId): UserDto
    - findAllRoles(): List<RoleDto>
  - [ ] Implement assignRoleToUser logic:
    - Find user by ID (throw ResourceNotFoundException if not found)
    - Find role by ID (throw ResourceNotFoundException if not found)
    - Set user.role = role
    - Save user
    - Evict user's permission cache
    - Log role change to audit_logs: { userId, action: "ROLE_CHANGED", details: { oldRole, newRole } }
    - Return updated UserDto
  - [ ] Create UserController endpoint: POST /api/v1/users/{userId}/role with @RequestBody { roleId }
    - Annotate with @PreAuthorize("hasRole('SUPER_ADMIN')")
    - Call RoleService.assignRoleToUser(userId, roleId)
    - Return 200 OK with updated UserDto
  - [ ] Create RoleController endpoint: GET /api/v1/roles
    - Annotate with @PreAuthorize("isAuthenticated()")
    - Return list of RoleDto: { id, name, description, permissionCount }
  - [ ] Create RoleDto record with id, name, description, permissionCount fields
  - [ ] Test role assignment: POST with SUPER_ADMIN → 200, POST with PROPERTY_MANAGER → 403

- [ ] **Task 14: Test RBAC End-to-End** (AC: All)
  - [ ] Test SUPER_ADMIN access:
    - Login as SUPER_ADMIN → Verify JWT contains all permissions
    - Access all modules → 200 OK
    - Perform all CRUD operations → Success
    - Access system settings → Success
  - [ ] Test PROPERTY_MANAGER access:
    - Login as PROPERTY_MANAGER → Verify JWT contains limited permissions
    - Access assigned property tenants → 200 OK
    - Access unassigned property tenants → 403 Forbidden
    - Create work orders → 200 OK
    - Access system settings → 403 Forbidden
  - [ ] Test FINANCE_MANAGER access:
    - Access invoices, PDCs, transactions → 200 OK
    - Access work orders → 403 Forbidden (if no work-orders:read permission)
  - [ ] Test MAINTENANCE_SUPERVISOR access:
    - Access work orders, vendors → 200 OK
    - Access financial data → 403 Forbidden
  - [ ] Test TENANT access:
    - Access own lease and payment history → 200 OK
    - Submit maintenance request → 200 OK
    - Access another tenant's data → 403 Forbidden
  - [ ] Test frontend navigation filtering:
    - Login as different roles → Verify sidebar shows only allowed menu items
  - [ ] Test permission caching:
    - Login → Check cache hit on second permission check
    - Update user role → Verify cache eviction
  - [ ] Test audit logging:
    - Attempt unauthorized action → Verify logged to audit_logs
  - [ ] Test authorization error messages:
    - Verify 403 response includes requiredPermission field

- [ ] **Task 15: Update API Documentation** (AC: All)
  - [ ] Update backend/README.md with "Authorization & RBAC" section
  - [ ] Document role hierarchy and permission model
  - [ ] Document how to add new roles or permissions
  - [ ] Document data-level access control rules
  - [ ] Provide examples of @PreAuthorize usage for developers
  - [ ] Document permission matrix structure and location
  - [ ] Document frontend permission check patterns (usePermission hook, ProtectedRoute)
  - [ ] Document cache configuration and invalidation strategy
  - [ ] Add Swagger examples showing 403 responses for unauthorized requests
  - [ ] Document role assignment API endpoints

## Dev Notes

### Architecture Alignment

This story implements Role-Based Access Control (RBAC) as specified in the Architecture Document and PRD:

**Authorization Pattern:**
- **Method-Level Security:** Spring Security @PreAuthorize and @Secured annotations enforce permissions at controller and service layers [Source: docs/architecture.md#security-architecture]
- **Permission Model:** Resource + Action pattern (e.g., tenants:create, work-orders:view) provides granular, flexible access control [Source: docs/architecture.md#role-based-access-control]
- **Custom Permission Evaluator:** Enables data-level access control where users can only access specific resources (e.g., property managers see only assigned properties) [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-22]
- **Permission Caching:** Ehcache caches user permissions to reduce database queries on every request, improving performance [Source: docs/architecture.md#performance-considerations]

**Role Hierarchy:**
- **6 User Roles:** SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR [Source: docs/prd.md#312-user-roles]
- **Permission Inheritance:** SUPER_ADMIN automatically has all permissions, other roles have subset [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-22]
- **Role-Permissions Mapping:** Many-to-many relationship allows flexible permission assignment and easy role updates [Source: docs/architecture.md#data-architecture]

**Frontend Authorization:**
- **Route Protection:** Next.js middleware guards routes based on role/permission requirements [Source: docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-22-frontend-route-protection]
- **Conditional Rendering:** usePermission hook enables UI elements to show/hide based on user permissions [Source: docs/ux-design-specification.md#ux-pattern-decisions]
- **Role-Based Navigation:** Sidebar dynamically filters menu items based on user's permissions [Source: docs/ux-design-specification.md#role-based-navigation-menu]

**Alignment with PRD:**
- **Access Control Requirements:** Implements RBAC as core security requirement [Source: docs/prd.md#31-authentication-access-control]
- **Role Definitions:** Matches all 6 roles defined in PRD with appropriate permission boundaries [Source: docs/prd.md#312-user-roles]
- **Data Isolation:** Property managers can only access their assigned properties, tenants see only their data [Source: docs/prd.md#user-experience-design]

### Project Structure Notes

**New Packages and Files:**
```
backend/
├── src/main/
│   ├── java/com/ultrabms/
│   │   ├── entity/
│   │   │   ├── Role.java (JPA entity for roles table)
│   │   │   ├── Permission.java (JPA entity for permissions table)
│   │   │   └── User.java (UPDATED: add role relationship, remove role String field)
│   │   ├── repository/
│   │   │   ├── RoleRepository.java (findByName, findAll with permissions)
│   │   │   └── PermissionRepository.java (findByName, findByResource)
│   │   ├── service/
│   │   │   ├── CustomUserDetailsService.java (UserDetailsService with permissions loading)
│   │   │   └── RoleService.java (role assignment, listing)
│   │   ├── security/
│   │   │   ├── CustomPermissionEvaluator.java (data-level access control)
│   │   │   ├── JwtTokenProvider.java (UPDATED: add permissions to JWT)
│   │   │   ├── JwtAuthenticationFilter.java (UPDATED: extract permissions from JWT)
│   │   │   └── SecurityConfig.java (UPDATED: enable method security)
│   │   ├── controller/
│   │   │   ├── RoleController.java (list roles)
│   │   │   ├── PermissionMatrixController.java (permission matrix API)
│   │   │   ├── TenantController.java (UPDATED: add @PreAuthorize)
│   │   │   ├── WorkOrderController.java (UPDATED: add @PreAuthorize)
│   │   │   ├── FinanceController.java (UPDATED: add @PreAuthorize)
│   │   │   └── UserController.java (UPDATED: add @PreAuthorize, role assignment endpoint)
│   │   ├── dto/
│   │   │   └── RoleDto.java (role data transfer object)
│   │   └── config/
│   │       └── CacheConfig.java (UPDATED: add userPermissions cache region)
│   └── resources/
│       └── db/migration/
│           ├── V9__create_roles_table.sql
│           ├── V10__create_permissions_table.sql
│           ├── V11__create_role_permissions_table.sql
│           └── V12__add_role_id_to_users.sql

frontend/
├── src/
│   ├── middleware.ts (Next.js route protection middleware)
│   ├── hooks/
│   │   └── usePermission.ts (permission check hook)
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx (client-side route wrapper)
│   │   └── layout/
│   │       └── Sidebar.tsx (UPDATED: role-based navigation filtering)
│   └── app/
│       └── (dashboard)/
│           └── 403/
│               └── page.tsx (Forbidden error page)

docs/
└── sprint-artifacts/
    └── rbac-permission-matrix.md (NEW: permission matrix documentation)
```

**Database Schema:**
```sql
-- roles table
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- permissions table
CREATE TABLE permissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- role_permissions join table
CREATE TABLE role_permissions (
  role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Add role_id to users table
ALTER TABLE users ADD COLUMN role_id BIGINT REFERENCES roles(id);
ALTER TABLE users DROP COLUMN role; -- remove old String role column
```

**Permission Naming Convention:**
- Format: `{resource}:{action}`
- Resources: tenants, properties, units, work-orders, vendors, invoices, pdcs, assets, users, system
- Actions: create, read, update, delete, manage, assign, approve
- Examples: `tenants:create`, `work-orders:assign`, `invoices:approve`, `system:configure`

### Learnings from Previous Story

**From Story 2-1-user-registration-and-login-with-jwt-authentication (Status: review):**

Story 2.1 established JWT authentication infrastructure that Story 2.2 extends with role-based permissions:

- **JWT Infrastructure Ready:** JwtTokenProvider and JwtAuthenticationFilter exist - extend to include permissions in token payload and extract them during authentication [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#project-structure-notes]
- **Spring Security Configured:** SecurityConfig with stateless session management, JWT filter chain - add @EnableMethodSecurity and permission evaluator [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-6]
- **User Entity with Role Field:** User entity has role field but as String enum - migrate to role_id foreign key for normalized RBAC [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#dev-notes]
- **GlobalExceptionHandler Available:** Can extend to handle AccessDeniedException for 403 Forbidden responses [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#learnings-from-previous-story]
- **Audit Logging Pattern:** AuditLog entity and repository exist - reuse for logging authorization failures [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-7]
- **Ehcache Configured:** Story 1.3 configured Ehcache - add userPermissions cache region for permission caching [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#learnings-from-previous-story]

**Key Architectural Continuity:**
- **Token Claims Extension:** JWT already includes userId, email, role - add permissions array claim [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#jwt-token-structure]
- **Authentication Filter Hook:** JwtAuthenticationFilter sets SecurityContext - extend to populate GrantedAuthority from permissions [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#authentication-flow]
- **Token Refresh Pattern:** Token refresh endpoint exists - ensure permissions are reloaded from database on refresh [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#task-5]
- **UserRepository Pattern:** UserRepository.findByEmail() exists - extend query with @EntityGraph to eagerly fetch role and permissions [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#files-to-reuse]

**Files to Extend:**
- `JwtTokenProvider` → Add permissions to token generation and extraction
- `JwtAuthenticationFilter` → Extract permissions from JWT and populate authorities
- `SecurityConfig` → Enable method security, register permission evaluator
- `User` entity → Replace role String with role_id FK, add getAuthorities() method
- `GlobalExceptionHandler` → Add AccessDeniedException handler for 403 responses
- `CacheConfig` → Add userPermissions cache region

**Technical Patterns to Follow:**
- **Constructor Injection:** Use @RequiredArgsConstructor for all services (established in Story 1.5, 2.1)
- **Java 17 Records:** Use records for DTOs (RoleDto) [Source: docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md#technical-patterns-to-follow]
- **@EntityGraph:** Use for efficient loading of role with permissions (avoid N+1 queries)
- **Cache Annotations:** Use @Cacheable and @CacheEvict for permission caching
- **Audit Logging:** Log all authorization failures with userId, action, resource, IP address

**No Technical Debt Carried Forward:**
- Story 2.1 completed JWT authentication cleanly
- RBAC builds on solid authentication foundation
- Migration from role String to role_id FK is straightforward database change

### Testing Strategy

**Unit Testing:**
- Test RoleRepository and PermissionRepository: findByName, findAll, relationships
- Test CustomPermissionEvaluator: hasPermission logic for different roles, data-level access
- Test JwtTokenProvider: permissions added to token, extracted correctly
- Test RoleService: assignRoleToUser, cache eviction
- Test permission caching: verify cache hit/miss behavior

**Integration Testing:**
- Test method-level security with MockMvc and @WithMockUser(authorities = {"tenants:read"}):
  - GET /api/v1/tenants with "tenants:read" → 200 OK
  - POST /api/v1/tenants with "tenants:read" (missing create) → 403 Forbidden
  - DELETE /api/v1/tenants/{id} with "tenants:delete" → 200 OK (if has permission)
- Test custom permission evaluator with @WithUserDetails:
  - PROPERTY_MANAGER accessing assigned property → 200 OK
  - PROPERTY_MANAGER accessing unassigned property → 403 Forbidden
  - SUPER_ADMIN accessing any property → 200 OK
- Test JWT authentication with permissions:
  - Login as SUPER_ADMIN → JWT contains all permissions
  - Login as FINANCE_MANAGER → JWT contains only finance permissions
  - Use JWT to access protected endpoints → verify authorization works
- Test role assignment API:
  - POST /api/v1/users/{id}/role as SUPER_ADMIN → 200 OK
  - POST /api/v1/users/{id}/role as PROPERTY_MANAGER → 403 Forbidden
- Test audit logging:
  - Unauthorized access attempt → verify audit_logs entry created

**Manual Testing Checklist:**
1. **SUPER_ADMIN Role:**
   - Login → Verify all navigation items visible in sidebar
   - Access all modules → 200 OK (Tenants, Maintenance, Finance, Settings)
   - Perform all CRUD operations → Success
   - Assign roles to users → Success
   - View permission matrix → Success

2. **PROPERTY_MANAGER Role:**
   - Login → Verify Finance and Settings hidden from navigation
   - View tenants for assigned property → 200 OK, see tenant list
   - View tenants for unassigned property → 403 Forbidden or filtered out
   - Create work order → 200 OK
   - Access system settings → 403 Forbidden
   - Create new user → 403 Forbidden

3. **MAINTENANCE_SUPERVISOR Role:**
   - Login → Verify Tenants and Finance hidden from navigation
   - View work orders → 200 OK, see all work orders
   - Assign vendor to work order → 200 OK
   - Update work order status → 200 OK
   - Access invoices → 403 Forbidden
   - View tenant contracts → 403 Forbidden

4. **FINANCE_MANAGER Role:**
   - Login → Verify Maintenance hidden from navigation
   - View invoices and PDCs → 200 OK
   - Process payments → 200 OK
   - Generate financial reports → 200 OK
   - Create work orders → 403 Forbidden
   - Manage tenants → 403 Forbidden

5. **TENANT Role:**
   - Login → Limited navigation (Dashboard, My Lease, Payments, Maintenance Requests)
   - View own lease details → 200 OK
   - View payment history → 200 OK
   - Submit maintenance request → 200 OK
   - Access another tenant's lease → 403 Forbidden
   - View all tenants list → 403 Forbidden

6. **Permission Caching:**
   - Login as user → Check database query logs (permissions loaded)
   - Make second request → Verify no database query (cache hit)
   - Update user role → Verify cache evicted
   - Make request → Verify database query (cache miss, reload permissions)

7. **Frontend Route Protection:**
   - Navigate to /finance as MAINTENANCE_SUPERVISOR → Redirect to /403
   - Navigate to /tenants as TENANT → Redirect to /403
   - Navigate to /settings as PROPERTY_MANAGER → Redirect to /403

8. **Error Handling:**
   - Attempt unauthorized action → Verify 403 response with requiredPermission field
   - Verify error message is clear and actionable
   - Check audit_logs table → Verify authorization failure logged

9. **API Documentation:**
   - Access /swagger-ui.html → Verify @PreAuthorize shown in endpoint docs
   - Test endpoints with "Try it out" → Verify 403 for unauthorized

10. **Role Assignment:**
    - Login as SUPER_ADMIN
    - GET /api/v1/roles → Verify all 6 roles listed
    - POST /api/v1/users/{id}/role with { roleId } → Verify user role updated
    - Logout and login as updated user → Verify new permissions applied

**Test Levels:**
- **L1 (Unit):** RoleRepository, PermissionRepository, CustomPermissionEvaluator, JwtTokenProvider, RoleService
- **L2 (Integration):** Controller method security with MockMvc, JWT authentication, permission caching, role assignment API
- **L3 (Manual):** Swagger UI, frontend navigation, role switching, data-level access control (REQUIRED for acceptance)

### References

- [Epic 2: Story 2.2 - Role-Based Access Control (RBAC) Implementation](docs/sprint-artifacts/epics/2-authentication-and-user-management.md#story-22)
- [Architecture: Security Architecture](docs/architecture.md#security-architecture)
- [Architecture: Role-Based Access Control (RBAC)](docs/architecture.md#role-based-access-control)
- [Architecture: Permission Model](docs/architecture.md#api-security)
- [Architecture: Performance Considerations - Caching](docs/architecture.md#performance-considerations)
- [PRD: User Roles](docs/prd.md#312-user-roles)
- [PRD: Security Requirements](docs/prd.md#54-security-requirements)
- [Story 2.1: User Registration and Login with JWT Authentication](docs/sprint-artifacts/2-1-user-registration-and-login-with-jwt-authentication.md)
- [Story 1.5: Basic REST API Structure](docs/sprint-artifacts/1-5-basic-rest-api-structure-and-exception-handling.md)
- [Story 1.3: Ehcache Configuration](docs/sprint-artifacts/1-3-ehcache-configuration-for-application-caching.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
