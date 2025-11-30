/**
 * User Profile API Service
 * Story 2.9: User Profile Customization
 *
 * All user profile management API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  UserProfile,
  UserProfileUpdateRequest,
  UserProfileApiResponse,
  AvatarApiResponse,
  AvatarUploadResponse,
} from '@/types/user-profile';

const USER_PROFILE_BASE_PATH = '/v1/users/me';

// ============================================================================
// GET USER PROFILE
// ============================================================================

/**
 * Get the current user's profile
 *
 * @returns Promise that resolves to UserProfile
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have required role (403)
 *
 * @example
 * ```typescript
 * const profile = await getMyProfile();
 * console.log(profile.displayName ?? `${profile.firstName} ${profile.lastName}`);
 * ```
 */
export async function getMyProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfileApiResponse>(
    `${USER_PROFILE_BASE_PATH}/profile`
  );
  return response.data.data;
}

// ============================================================================
// UPDATE USER PROFILE
// ============================================================================

/**
 * Update the current user's profile
 *
 * @param request - The profile update data (displayName, contactPhone)
 *
 * @returns Promise that resolves to updated UserProfile
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have required role (403)
 * @throws {ValidationException} When request body fails validation (400)
 *
 * @example
 * ```typescript
 * const profile = await updateMyProfile({
 *   displayName: "John D.",
 *   contactPhone: "+1234567890"
 * });
 * console.log(profile.displayName);
 * ```
 */
export async function updateMyProfile(
  request: UserProfileUpdateRequest
): Promise<UserProfile> {
  const response = await apiClient.put<UserProfileApiResponse>(
    `${USER_PROFILE_BASE_PATH}/profile`,
    request
  );
  return response.data.data;
}

// ============================================================================
// AVATAR OPERATIONS
// ============================================================================

/**
 * Upload user avatar
 *
 * Accepts PNG/JPG images up to 2MB.
 * Automatically deletes existing avatar if present.
 *
 * @param file - The avatar file to upload
 *
 * @returns Promise that resolves to AvatarUploadResponse with presigned URL
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have required role (403)
 * @throws {ValidationException} When file type/size is invalid (400)
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input[type="file"]');
 * const file = input.files[0];
 * const response = await uploadAvatar(file);
 * console.log(response.avatarUrl);
 * ```
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<AvatarApiResponse>(
    `${USER_PROFILE_BASE_PATH}/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * Delete user avatar
 *
 * Removes avatar from S3 and clears avatar path.
 * UI will show initials fallback after deletion.
 *
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have required role (403)
 *
 * @example
 * ```typescript
 * await deleteAvatar();
 * console.log("Avatar deleted, showing initials");
 * ```
 */
export async function deleteAvatar(): Promise<void> {
  await apiClient.delete(`${USER_PROFILE_BASE_PATH}/avatar`);
}
