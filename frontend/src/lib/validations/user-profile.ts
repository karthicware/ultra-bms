/**
 * User Profile Validation Schemas
 * Zod schemas for user profile forms
 * Story 2.9: User Profile Customization
 */

import { z } from 'zod';
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE,
  MAX_AVATAR_SIZE_MB,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_CONTACT_PHONE_LENGTH,
} from '@/types/user-profile';

// ============================================================================
// USER PROFILE SCHEMA
// ============================================================================

/**
 * User profile form validation schema
 * Validates displayName and contactPhone per AC15 requirements
 */
export const userProfileSchema = z.object({
  /**
   * Display name (max 100 chars)
   * Empty string is allowed (clears display name)
   */
  displayName: z
    .string()
    .max(MAX_DISPLAY_NAME_LENGTH, `Display name must be less than ${MAX_DISPLAY_NAME_LENGTH} characters`)
    .transform((val) => val.trim()),

  /**
   * Contact phone (max 30 chars)
   * No format validation - supports international formats
   */
  contactPhone: z
    .string()
    .max(MAX_CONTACT_PHONE_LENGTH, `Contact phone must be less than ${MAX_CONTACT_PHONE_LENGTH} characters`)
    .transform((val) => val.trim()),
});

/**
 * Type inference for user profile form
 */
export type UserProfileFormData = z.infer<typeof userProfileSchema>;

// ============================================================================
// AVATAR SCHEMA
// ============================================================================

/**
 * Avatar file validation schema
 * Validates PNG/JPG format and max 2MB size per AC15 requirements
 */
export const avatarFileSchema = z
  .instanceof(File)
  .refine(
    (file) => ALLOWED_AVATAR_TYPES.includes(file.type),
    'Avatar must be PNG or JPG format'
  )
  .refine(
    (file) => file.size <= MAX_AVATAR_SIZE,
    `Avatar must be less than ${MAX_AVATAR_SIZE_MB}MB`
  );

/**
 * Optional avatar file schema (for forms where avatar is not required)
 */
export const optionalAvatarFileSchema = z
  .instanceof(File)
  .refine(
    (file) => ALLOWED_AVATAR_TYPES.includes(file.type),
    'Avatar must be PNG or JPG format'
  )
  .refine(
    (file) => file.size <= MAX_AVATAR_SIZE,
    `Avatar must be less than ${MAX_AVATAR_SIZE_MB}MB`
  )
  .optional()
  .nullable();

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate avatar file and return error message if invalid
 * @param file File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateAvatarFileSync(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return 'Avatar must be PNG or JPG format';
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return `Avatar must be less than ${MAX_AVATAR_SIZE_MB}MB`;
  }
  return null;
}

/**
 * Validate display name and return error message if invalid
 * @param displayName Display name to validate
 * @returns Error message if invalid, null if valid
 */
export function validateDisplayName(displayName: string): string | null {
  if (displayName && displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return `Display name must be less than ${MAX_DISPLAY_NAME_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate contact phone and return error message if invalid
 * @param contactPhone Contact phone to validate
 * @returns Error message if invalid, null if valid
 */
export function validateContactPhone(contactPhone: string): string | null {
  if (contactPhone && contactPhone.length > MAX_CONTACT_PHONE_LENGTH) {
    return `Contact phone must be less than ${MAX_CONTACT_PHONE_LENGTH} characters`;
  }
  return null;
}

// ============================================================================
// API RESPONSE VALIDATION
// ============================================================================

/**
 * User profile response validation schema
 */
export const userProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  contactPhone: z.string().nullable(),
  role: z.string(),
});

/**
 * Avatar upload response validation schema
 */
export const avatarUploadResponseSchema = z.object({
  avatarUrl: z.string().url(),
  message: z.string(),
});

/**
 * User profile API response validation schema
 */
export const userProfileApiResponseSchema = z.object({
  success: z.boolean(),
  data: userProfileResponseSchema,
  message: z.string().optional(),
  timestamp: z.string(),
});

/**
 * Avatar API response validation schema
 */
export const avatarApiResponseSchema = z.object({
  success: z.boolean(),
  data: avatarUploadResponseSchema,
  message: z.string().optional(),
  timestamp: z.string(),
});
