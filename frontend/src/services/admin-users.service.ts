/**
 * Admin Users API Service
 * Story 2.6: Admin User Management
 *
 * All admin user management API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  AdminUser,
  AdminUsersPageResponse,
  AdminUserFilters,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
} from '@/types/admin-users';

const ADMIN_USERS_BASE_PATH = '/v1/admin/users';
const ROLES_BASE_PATH = '/v1/roles';

// ============================================================================
// LIST USERS
// ============================================================================

/**
 * Get paginated list of users with optional filters
 *
 * @param filters - Optional filters (search, role, status, page, size)
 *
 * @returns Promise that resolves to paginated list of AdminUser
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks users:read permission (403)
 *
 * @example
 * ```typescript
 * // Get all active users
 * const response = await getAdminUsers({
 *   status: 'ACTIVE',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Search users by name or email
 * const searchResults = await getAdminUsers({
 *   search: 'john',
 *   role: 'PROPERTY_MANAGER'
 * });
 * ```
 */
export async function getAdminUsers(
  filters?: AdminUserFilters
): Promise<AdminUsersPageResponse> {
  const params = new URLSearchParams();

  if (filters?.page !== undefined) {
    params.append('page', String(filters.page));
  }
  if (filters?.size !== undefined) {
    params.append('size', String(filters.size));
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.role) {
    params.append('role', filters.role);
  }
  if (filters?.status) {
    params.append('status', filters.status);
  }

  const queryString = params.toString();
  const url = queryString
    ? `${ADMIN_USERS_BASE_PATH}?${queryString}`
    : ADMIN_USERS_BASE_PATH;

  const response = await apiClient.get<AdminUsersPageResponse>(url);
  return response.data;
}

// ============================================================================
// GET USER BY ID
// ============================================================================

/**
 * Get a single user by ID
 *
 * @param userId - User UUID
 *
 * @returns Promise that resolves to AdminUser
 *
 * @throws {NotFoundException} When user not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks users:read permission (403)
 *
 * @example
 * ```typescript
 * const user = await getAdminUserById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(user.email); // "john@example.com"
 * ```
 */
export async function getAdminUserById(userId: string): Promise<AdminUser> {
  const response = await apiClient.get<AdminUser>(
    `${ADMIN_USERS_BASE_PATH}/${userId}`
  );
  return response.data;
}

// ============================================================================
// CREATE USER
// ============================================================================

/**
 * Create a new user account
 * Sends welcome email with temporary password
 *
 * @param data - User creation data (firstName, lastName, email, roleId, temporaryPassword)
 *
 * @returns Promise that resolves to the created AdminUser
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {DuplicateResourceException} When email already exists (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks users:create permission or cannot create SUPER_ADMIN (403)
 *
 * @example
 * ```typescript
 * const user = await createAdminUser({
 *   firstName: 'John',
 *   lastName: 'Smith',
 *   email: 'john.smith@example.com',
 *   roleId: 2,
 *   temporaryPassword: 'TempPass123!'
 * });
 *
 * console.log(user.id); // "550e8400-e29b-41d4-a716-446655440000"
 * console.log(user.status); // "ACTIVE"
 * ```
 */
export async function createAdminUser(
  data: CreateUserRequest
): Promise<AdminUser> {
  const response = await apiClient.post<AdminUser>(ADMIN_USERS_BASE_PATH, data);
  return response.data;
}

// ============================================================================
// UPDATE USER
// ============================================================================

/**
 * Update an existing user account
 * Note: Email is immutable and cannot be changed
 *
 * @param userId - User UUID to update
 * @param data - User update data (firstName, lastName, phone, roleId)
 *
 * @returns Promise that resolves to the updated AdminUser
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When user not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks users:update permission (403)
 *
 * @example
 * ```typescript
 * const updatedUser = await updateAdminUser(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     phone: '+971501234567',
 *     roleId: 3
 *   }
 * );
 * ```
 */
export async function updateAdminUser(
  userId: string,
  data: UpdateUserRequest
): Promise<AdminUser> {
  const response = await apiClient.put<AdminUser>(
    `${ADMIN_USERS_BASE_PATH}/${userId}`,
    data
  );
  return response.data;
}

// ============================================================================
// DEACTIVATE USER
// ============================================================================

/**
 * Deactivate a user account (soft delete)
 * Sets status to INACTIVE, user cannot log in
 *
 * @param userId - User UUID to deactivate
 *
 * @throws {ValidationException} When trying to deactivate own account (400)
 * @throws {NotFoundException} When user not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks users:delete permission (403)
 *
 * @example
 * ```typescript
 * await deactivateAdminUser('550e8400-e29b-41d4-a716-446655440000');
 * // User is now inactive and cannot log in
 * ```
 */
export async function deactivateAdminUser(userId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_USERS_BASE_PATH}/${userId}`);
}

// ============================================================================
// REACTIVATE USER
// ============================================================================

/**
 * Reactivate a deactivated user account
 * Sets status to ACTIVE, user can log in again
 *
 * @param userId - User UUID to reactivate
 *
 * @returns Promise that resolves to the reactivated AdminUser
 *
 * @throws {ValidationException} When user is already active (400)
 * @throws {NotFoundException} When user not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks users:update permission (403)
 *
 * @example
 * ```typescript
 * const reactivatedUser = await reactivateAdminUser('550e8400-e29b-41d4-a716-446655440000');
 * console.log(reactivatedUser.status); // "ACTIVE"
 * ```
 */
export async function reactivateAdminUser(userId: string): Promise<AdminUser> {
  const response = await apiClient.post<AdminUser>(
    `${ADMIN_USERS_BASE_PATH}/${userId}/reactivate`
  );
  return response.data;
}

// ============================================================================
// GET ROLES (for dropdowns)
// ============================================================================

/**
 * Get list of available roles for user assignment
 *
 * @returns Promise that resolves to array of Role
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const roles = await getRoles();
 * // [
 * //   { id: 1, name: 'SUPER_ADMIN', description: 'Full system access' },
 * //   { id: 2, name: 'PROPERTY_MANAGER', description: 'Manage properties' },
 * //   ...
 * // ]
 * ```
 */
export async function getRoles(): Promise<Role[]> {
  const response = await apiClient.get<Role[]>(ROLES_BASE_PATH);
  return response.data;
}
