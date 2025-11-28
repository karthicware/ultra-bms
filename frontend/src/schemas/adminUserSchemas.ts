/**
 * Admin User Management Validation Schemas
 * Zod schemas for user CRUD forms with comprehensive validation rules
 * Story 2.6: Admin User Management
 */

import { z } from 'zod';

// ===========================
// Common Validation Rules
// ===========================

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(100, 'Must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Can only contain letters, spaces, hyphens, and apostrophes');

const phoneSchema = z
  .string()
  .max(20, 'Phone number must not exceed 20 characters')
  .refine(
    (val) => val === '' || /^\+?[1-9]\d{1,14}$/.test(val),
    'Please enter a valid phone number'
  )
  .optional();

// ===========================
// Create User Schema
// ===========================

export const createUserSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    roleId: z.number({ message: 'Role is required' }).min(1, 'Please select a role'),
    temporaryPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm the password'),
  })
  .refine((data) => data.temporaryPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;

// ===========================
// Edit User Schema
// ===========================

export const editUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  roleId: z.number({ message: 'Role is required' }).min(1, 'Please select a role'),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

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

/**
 * Get a cryptographically secure random integer in range [0, max)
 * Uses crypto.getRandomValues() for secure randomness
 */
function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Securely shuffle an array using Fisher-Yates algorithm with crypto.getRandomValues()
 */
function secureShuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a random temporary password
 * Ensures it meets all password requirements
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure at least one of each required character type
  let password = '';
  password += uppercase[secureRandomInt(uppercase.length)];
  password += lowercase[secureRandomInt(lowercase.length)];
  password += numbers[secureRandomInt(numbers.length)];
  password += special[secureRandomInt(special.length)];

  // Fill remaining with random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[secureRandomInt(allChars.length)];
  }

  // Shuffle the password using secure shuffle
  return secureShuffleArray(password.split('')).join('');
}
