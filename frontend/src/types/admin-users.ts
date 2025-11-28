/**
 * Admin User Management Types and Interfaces
 * Story 2.6: Admin User Management
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * User status enum
 * Controls user login eligibility and visibility
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

/**
 * User role names
 * System-defined roles with different permission levels
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  MAINTENANCE_SUPERVISOR = 'MAINTENANCE_SUPERVISOR',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  TENANT = 'TENANT',
  VENDOR = 'VENDOR',
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Admin user entity
 * Complete user information from admin API
 */
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  roleId: number;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role entity for dropdown selection
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Create user request
 * Used in POST /api/v1/admin/users
 */
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleId: number;
  temporaryPassword: string;
}

/**
 * Update user request
 * Used in PUT /api/v1/admin/users/{id}
 * Note: Email is immutable
 */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Paginated admin users response
 */
export interface AdminUsersPageResponse {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filter parameters for user list
 */
export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Create user form data (includes confirmPassword for validation)
 */
export interface CreateUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleId: number;
  temporaryPassword: string;
  confirmPassword: string;
}

/**
 * Edit user form data
 */
export interface EditUserFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Dialog state for user management modals
 */
export interface UserDialogState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'deactivate' | 'reactivate';
  user?: AdminUser;
}

/**
 * User status badge styling
 */
export const USER_STATUS_STYLES: Record<
  UserStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [UserStatus.ACTIVE]: { label: 'Active', variant: 'default' },
  [UserStatus.INACTIVE]: { label: 'Inactive', variant: 'destructive' },
  [UserStatus.PENDING]: { label: 'Pending', variant: 'secondary' },
};

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROPERTY_MANAGER: 'Property Manager',
  MAINTENANCE_SUPERVISOR: 'Maintenance Supervisor',
  FINANCE_MANAGER: 'Finance Manager',
  TENANT: 'Tenant',
  VENDOR: 'Vendor',
};
