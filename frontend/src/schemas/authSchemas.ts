/**
 * Authentication Validation Schemas
 * Zod schemas for all authentication-related forms with comprehensive validation rules
 */

import { z } from 'zod';

// ===========================
// Common Validation Rules
// ===========================

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format')
  .optional()
  .or(z.literal(''));

// ===========================
// Login Schema
// ===========================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ===========================
// Registration Schema
// ===========================

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    phone: phoneSchema,
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ===========================
// Forgot Password Schema
// ===========================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ===========================
// Reset Password Schema
// ===========================

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ===========================
// Change Password Schema
// ===========================

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ===========================
// Password Requirements
// ===========================

export const passwordRequirements = [
  {
    id: 'minLength',
    label: 'At least 8 characters',
    regex: /.{8,}/,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    regex: /[A-Z]/,
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    regex: /[a-z]/,
  },
  {
    id: 'number',
    label: 'At least one number',
    regex: /[0-9]/,
  },
  {
    id: 'special',
    label: 'At least one special character',
    regex: /[^A-Za-z0-9]/,
  },
] as const;

/**
 * Check password against all requirements
 */
export function checkPasswordRequirements(password: string) {
  return passwordRequirements.map((req) => ({
    ...req,
    met: req.regex.test(password),
  }));
}

/**
 * Check if password meets all requirements
 */
export function isPasswordValid(password: string): boolean {
  return passwordRequirements.every((req) => req.regex.test(password));
}
