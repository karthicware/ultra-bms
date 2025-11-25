/**
 * Tenant Portal Validation Schemas
 * Zod schemas for tenant portal forms
 */

import { z } from 'zod';

/**
 * Password complexity requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(8, 'Current password must be at least 8 characters'),

  newPassword: z
    .string()
    .min(12, 'New password must be at least 12 characters')
    .regex(
      passwordComplexityRegex,
      'Password must include uppercase, lowercase, number, and special character (@$!%*?&)'
    ),

  confirmPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type TenantChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Language preference validation
 */
export const languagePreferenceSchema = z.object({
  language: z.enum(['en', 'ar']),
});

export type LanguagePreferenceFormData = z.infer<typeof languagePreferenceSchema>;

/**
 * Document upload validation
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const documentUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 5MB')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only PDF, JPG, and PNG files are allowed'
    ),
  type: z.enum(['EMIRATES_ID', 'PASSPORT', 'VISA', 'SIGNED_LEASE', 'MULKIYA', 'OTHER']).optional(),
});

export type TenantPortalDocumentUploadFormData = z.infer<typeof documentUploadSchema>;
