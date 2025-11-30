/**
 * User Profile Types and Interfaces
 * Story 2.9: User Profile Customization
 */

// ============================================================================
// API INTERFACES
// ============================================================================

/**
 * User profile response from API
 * GET /api/v1/users/me/profile
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  contactPhone: string | null;
  role: string;
}

/**
 * User profile update request
 * PUT /api/v1/users/me/profile
 */
export interface UserProfileUpdateRequest {
  displayName?: string | null;
  contactPhone?: string | null;
}

/**
 * Avatar upload response
 * POST /api/v1/users/me/avatar
 */
export interface AvatarUploadResponse {
  avatarUrl: string;
  message: string;
}

/**
 * API response wrapper for profile
 */
export interface UserProfileApiResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
  timestamp: string;
}

/**
 * API response wrapper for avatar operations
 */
export interface AvatarApiResponse {
  success: boolean;
  data: AvatarUploadResponse;
  message?: string;
  timestamp: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * User profile form values
 */
export interface UserProfileFormValues {
  displayName: string;
  contactPhone: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Allowed avatar file types
 */
export const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

/**
 * Maximum avatar file size in bytes (2MB)
 */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

/**
 * Maximum avatar file size in MB for display
 */
export const MAX_AVATAR_SIZE_MB = 2;

/**
 * Maximum display name length
 */
export const MAX_DISPLAY_NAME_LENGTH = 100;

/**
 * Maximum contact phone length
 */
export const MAX_CONTACT_PHONE_LENGTH = 30;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate avatar file type and size
 * @param file File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return 'Avatar must be PNG or JPG format';
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return `Avatar must be less than ${MAX_AVATAR_SIZE_MB}MB`;
  }
  return null;
}

/**
 * Get user initials for avatar fallback
 * @param displayName Display name (preferred)
 * @param firstName First name (fallback)
 * @param lastName Last name (fallback)
 * @returns Initials (1-2 characters)
 */
export function getUserInitials(
  displayName: string | null,
  firstName: string,
  lastName: string
): string {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName[0].toUpperCase();
  }
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

/**
 * Get display name or full name
 * @param displayName Display name (preferred)
 * @param firstName First name (fallback)
 * @param lastName Last name (fallback)
 * @returns Display name or full name
 */
export function getDisplayNameOrFullName(
  displayName: string | null,
  firstName: string,
  lastName: string
): string {
  if (displayName && displayName.trim()) {
    return displayName;
  }
  return `${firstName} ${lastName}`;
}

/**
 * Format role name for display
 * @param role Role name from API (e.g., "PROPERTY_MANAGER")
 * @returns Formatted role name (e.g., "Property Manager")
 */
export function formatRoleName(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
