# Story 2.6: Admin User Management

Status: ready

## Story

As a Super Admin or Admin,
I want to create, view, update, and deactivate user accounts,
So that I can onboard property managers, tenants, vendors, and other users (since self-registration is disabled).

## Acceptance Criteria

1. **AC1 - User List API:** GET /api/v1/admin/users returns paginated list with: id, firstName, lastName, email, phone, role, status, createdAt. Supports query params: page, size, search, role, status.

2. **AC2 - Create User API:** POST /api/v1/admin/users creates user with: firstName, lastName, email, phone, roleId, temporaryPassword. Returns 201 with created user. Validates email uniqueness.

3. **AC3 - Role Coverage:** Admin can create users with ANY role: SUPER_ADMIN (if caller is SUPER_ADMIN), PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR, FINANCE_MANAGER, TENANT, VENDOR. This is the ONLY mechanism for user creation in the system.

4. **AC4 - Update User API:** PUT /api/v1/admin/users/{id} updates: firstName, lastName, phone, roleId. Email is immutable. Returns 200 with updated user.

5. **AC5 - Deactivate User API:** DELETE /api/v1/admin/users/{id} soft-deletes user (sets status=INACTIVE). User cannot log in. Returns 204.

6. **AC6 - Reactivate User API:** POST /api/v1/admin/users/{id}/reactivate sets status=ACTIVE. Returns 200.

7. **AC7 - Welcome Email:** On user creation, send email with: welcome message, login URL, temporary password, prompt to change password on first login.

8. **AC8 - Force Password Change:** New admin-created users have mustChangePassword=true flag. After first login, redirect to change password.

9. **AC9 - Frontend User List Page:** /admin/users page with DataTable showing users. Search box, role filter dropdown, status filter. Pagination controls.

10. **AC10 - Frontend Create User Dialog:** Modal form with: firstName, lastName, email, phone, role dropdown (all roles), auto-generated temp password (or manual entry). Submit calls POST API.

11. **AC11 - Frontend Edit User Dialog:** Modal form pre-populated with user data. Save calls PUT API.

12. **AC12 - Frontend Deactivate Confirmation:** Confirm dialog before deactivation. Shows user name and warns about login access.

13. **AC13 - Audit Logging:** Log all actions (CREATE_USER, UPDATE_USER, DEACTIVATE_USER, REACTIVATE_USER) to audit_logs with userId, action, targetUserId, details.

14. **AC14 - Sidebar Navigation:** Add "Users" menu item under Settings section. Visible only to SUPER_ADMIN and users with users:read permission.

15. **AC15 - Disable Self-Registration:** Remove or disable the POST /api/v1/auth/signup endpoint. Return 403 Forbidden with message "Self-registration is disabled. Contact administrator." All users must be created by an admin through /api/v1/admin/users.

16. **AC16 - Unit Test Execution:** After all implementation tasks are complete, execute full backend unit test suite (mvn test) and frontend test suite (npm test). ALL tests must pass. Any failing tests must be fixed before story is marked complete.

17. **AC17 - Build Verification:** Backend build (mvn compile) and frontend build (npm run build) must complete with zero errors before story completion.

## Tasks / Subtasks

- [ ] **Task 1: Backend - Admin User DTOs** (AC: #1, #2, #4)
  - [ ] Create AdminUserCreateRequest DTO (firstName, lastName, email, phone, roleId, temporaryPassword)
  - [ ] Create AdminUserUpdateRequest DTO (firstName, lastName, phone, roleId)
  - [ ] Create AdminUserResponse DTO (id, firstName, lastName, email, phone, role, status, createdAt)
  - [ ] Create AdminUserListResponse DTO (Page wrapper)

- [ ] **Task 2: Backend - User Entity Updates** (AC: #5, #6, #8)
  - [ ] Add status field to User entity (enum: ACTIVE, INACTIVE, PENDING) if not exists
  - [ ] Add mustChangePassword boolean field (default false)
  - [ ] Create Flyway migration V__add_user_management_fields.sql
  - [ ] Update UserRepository with findByStatus, findByRole methods

- [ ] **Task 3: Backend - AdminUserService** (AC: #1-#6)
  - [ ] Create AdminUserService in com.ultrabms.service
  - [ ] Implement listUsers(page, size, search, role, status) with Specification
  - [ ] Implement createUser(AdminUserCreateRequest) with role validation
  - [ ] Implement updateUser(id, AdminUserUpdateRequest)
  - [ ] Implement deactivateUser(id) - soft delete
  - [ ] Implement reactivateUser(id)
  - [ ] Validate SUPER_ADMIN can only be created by SUPER_ADMIN

- [ ] **Task 4: Backend - AdminUserController** (AC: #1-#6)
  - [ ] Create AdminUserController with @RequestMapping("/api/v1/admin/users")
  - [ ] GET / - list users with @PreAuthorize("hasAuthority('users:read')")
  - [ ] POST / - create user with @PreAuthorize("hasAuthority('users:create')")
  - [ ] PUT /{id} - update user with @PreAuthorize("hasAuthority('users:update')")
  - [ ] DELETE /{id} - deactivate with @PreAuthorize("hasAuthority('users:delete')")
  - [ ] POST /{id}/reactivate with @PreAuthorize("hasAuthority('users:update')")
  - [ ] Add Swagger/OpenAPI annotations

- [ ] **Task 5: Backend - Welcome Email** (AC: #7)
  - [ ] Create welcome-email.html Thymeleaf template
  - [ ] Add sendWelcomeEmail(user, temporaryPassword) method to EmailService
  - [ ] Call from AdminUserService.createUser()
  - [ ] Include: welcome message, login URL, temp password, change password prompt

- [ ] **Task 6: Backend - Force Password Change** (AC: #8)
  - [ ] Update AuthService.login() to check mustChangePassword flag
  - [ ] Return requiresPasswordChange: true in login response DTO
  - [ ] Create/update POST /api/v1/auth/change-password endpoint
  - [ ] Set mustChangePassword=false after successful password change
  - [ ] Frontend redirect to change password page if flag is true

- [ ] **Task 7: Backend - Disable Self-Registration** (AC: #15)
  - [ ] Update AuthController: disable or remove POST /api/v1/auth/signup
  - [ ] Return 403 Forbidden with message "Self-registration is disabled. Contact administrator."
  - [ ] Update any frontend signup links/pages to show admin contact info
  - [ ] Update tests that relied on signup endpoint

- [ ] **Task 8: Backend - Audit Logging** (AC: #13)
  - [ ] Call AuditLogService from AdminUserService for all operations
  - [ ] Log CREATE_USER with: creatorId, newUserId, role assigned
  - [ ] Log UPDATE_USER with: updaterId, targetUserId, fields changed
  - [ ] Log DEACTIVATE_USER with: adminId, targetUserId, reason
  - [ ] Log REACTIVATE_USER with: adminId, targetUserId

- [ ] **Task 9: Frontend - Admin User Types & Validation** (AC: #9-#12)
  - [ ] Create types/admin-user.ts with interfaces (AdminUser, AdminUserCreateRequest, etc.)
  - [ ] Create lib/validations/admin-user.ts with Zod schemas
  - [ ] Validate: email format, required fields, password strength for temp password

- [ ] **Task 10: Frontend - Admin User Service** (AC: #9-#12)
  - [ ] Create services/admin-user.service.ts
  - [ ] Implement listUsers(params) with pagination
  - [ ] Implement createUser(data)
  - [ ] Implement updateUser(id, data)
  - [ ] Implement deactivateUser(id)
  - [ ] Implement reactivateUser(id)

- [ ] **Task 11: Frontend - User List Page** (AC: #9)
  - [ ] Create app/(dashboard)/admin/users/page.tsx
  - [ ] Implement DataTable with columns: Name, Email, Role, Status, Created, Actions
  - [ ] Add search input (debounced, searches name/email)
  - [ ] Add role filter dropdown (all roles)
  - [ ] Add status filter dropdown (ACTIVE, INACTIVE, PENDING)
  - [ ] Add pagination controls
  - [ ] Add "Create User" button (opens dialog)
  - [ ] Add row actions: Edit, Deactivate/Reactivate

- [ ] **Task 12: Frontend - Create User Dialog** (AC: #10)
  - [ ] Create components/admin/CreateUserDialog.tsx
  - [ ] Form fields: firstName, lastName, email, phone, role dropdown
  - [ ] Password field: auto-generate button + manual entry option
  - [ ] Form validation with Zod schema
  - [ ] Submit handler calls createUser API
  - [ ] Success toast: "User created. Welcome email sent."
  - [ ] Error handling with field-level errors

- [ ] **Task 13: Frontend - Edit User Dialog** (AC: #11)
  - [ ] Create components/admin/EditUserDialog.tsx
  - [ ] Pre-populate form with user data
  - [ ] Disable email field (immutable)
  - [ ] Role dropdown (with SUPER_ADMIN restriction check)
  - [ ] Submit handler calls updateUser API
  - [ ] Success toast: "User updated successfully."

- [ ] **Task 14: Frontend - Deactivate/Reactivate Dialogs** (AC: #12)
  - [ ] Create components/admin/DeactivateUserDialog.tsx
  - [ ] Show warning: "User will no longer be able to log in."
  - [ ] Confirm/Cancel buttons
  - [ ] Create Reactivate confirmation (simpler)
  - [ ] Success toasts for both actions

- [ ] **Task 15: Frontend - Sidebar Update** (AC: #14)
  - [ ] Add "Users" menu item to Sidebar.tsx in Settings section
  - [ ] Icon: Users from lucide-react
  - [ ] Permission check: hasPermission('users:read')
  - [ ] Path: /admin/users

- [ ] **Task 16: Testing & Validation** (AC: #16, #17)
  - [ ] Write backend unit tests for AdminUserService (all CRUD operations)
  - [ ] Write backend unit tests for role validation logic
  - [ ] Write backend integration tests for AdminUserController (all endpoints)
  - [ ] Write frontend validation tests for admin-user schemas
  - [ ] Execute full backend test suite: `mvn test` — ALL tests must pass
  - [ ] Execute full frontend test suite: `npm test` — ALL tests must pass
  - [ ] Fix any failing tests before marking story complete
  - [ ] Execute backend build: `mvn compile` — must succeed with 0 errors
  - [ ] Execute frontend build: `npm run build` — must succeed with 0 errors
  - [ ] Manual E2E testing: Create user, login as new user, change password

## Dev Notes

### Architecture Alignment

- Reuses existing RBAC infrastructure from Story 2.2 (roles, permissions, @PreAuthorize)
- Follows established patterns: DTOs, Service layer, Controller
- Extends User entity with status and mustChangePassword fields
- Uses existing EmailService pattern from Story 2.3 (password reset)

### Key Design Decisions

1. **No Self-Registration:** All users created by admin only. This ensures proper vetting and role assignment.
2. **Temporary Password:** Admin sets or generates temp password; user must change on first login.
3. **Soft Delete:** Deactivation sets status=INACTIVE rather than hard delete for audit trail.
4. **Role Hierarchy:** Only SUPER_ADMIN can create other SUPER_ADMIN users.

### Dependencies

- Story 2.2 (RBAC) - COMPLETED - provides roles, permissions infrastructure
- Story 2.3 (Password Reset) - COMPLETED - provides email template patterns
- Story 2.5 (Frontend Auth) - COMPLETED - provides auth context, usePermission hook

### Database Changes

```sql
-- Migration: V__add_user_management_fields.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Update existing users to ACTIVE status
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;
```

### API Endpoints Summary

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/admin/users | users:read | List users with pagination |
| POST | /api/v1/admin/users | users:create | Create new user |
| PUT | /api/v1/admin/users/{id} | users:update | Update user |
| DELETE | /api/v1/admin/users/{id} | users:delete | Deactivate user |
| POST | /api/v1/admin/users/{id}/reactivate | users:update | Reactivate user |
| POST | /api/v1/auth/signup | DISABLED | Returns 403 Forbidden |

### References

- PRD Section 3.1.2: User Roles
- Architecture: Security Architecture, RBAC
- Story 2.2: Role-Based Access Control Implementation
- Story 2.3: Password Reset and Recovery Workflow
- Sprint Change Proposal: 2025-11-28 (Admin User Management)

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-28 | Story created via correct-course workflow | SM (Bob) |
