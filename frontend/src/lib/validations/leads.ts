/**
 * Lead Management Validation Schemas
 * Zod schemas for lead creation, editing, and document upload with comprehensive validation rules
 */

import { z } from 'zod';
import { LeadSource, LeadDocumentType } from '@/types/leads';

// ===========================
// Common Validation Rules
// ===========================

/**
 * Emirates ID format: XXX-XXXX-XXXXXXX-X
 * Example: 784-1234-1234567-1
 */
const emiratesIdRegex = /^\d{3}-\d{4}-\d{7}-\d{1}$/;

/**
 * E.164 phone number format
 * Must start with + followed by country code and number (minimum 8 digits total)
 * Example: +971501234567
 */
const e164PhoneRegex = /^\+[1-9]\d{7,14}$/;

/**
 * Email validation (RFC 5322 compliant via Zod)
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters')
  .email('Please enter a valid email address')
  .toLowerCase();

/**
 * Emirates ID validation
 */
export const emiratesIdSchema = z
  .string()
  .min(1, 'Emirates ID is required')
  .max(50, 'Emirates ID must be less than 50 characters')
  .regex(emiratesIdRegex, 'Emirates ID must be in format XXX-XXXX-XXXXXXX-X (e.g., 784-1234-1234567-1)');

/**
 * Phone number validation (E.164 format)
 */
export const phoneSchema = z
  .string()
  .min(1, 'Contact number is required')
  .regex(e164PhoneRegex, 'Please enter a valid phone number (e.g., +971501234567)');

/**
 * Passport number validation
 */
export const passportNumberSchema = z
  .string()
  .min(6, 'Passport number must be at least 6 characters')
  .max(50, 'Passport number must be less than 50 characters')
  .regex(/^[A-Z0-9]+$/, 'Passport number must contain only uppercase letters and numbers');

/**
 * Passport expiry date validation (must be in future)
 */
const passportExpirySchema = z
  .date()
  .refine(
    (date) => date > new Date(),
    {
      message: 'Passport expiry date must be in the future',
    }
  );

/**
 * Full name validation
 */
export const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(200, 'Full name must be less than 200 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Home country validation
 */
const homeCountrySchema = z
  .string()
  .min(1, 'Home country is required')
  .max(100, 'Home country must be less than 100 characters');

/**
 * Notes validation
 */
const notesSchema = z
  .string()
  .max(1000, 'Notes must be less than 1000 characters')
  .optional();

// ===========================
// Create Lead Schema
// ===========================

export const createLeadSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  contactNumber: phoneSchema,
  leadSource: z.nativeEnum(LeadSource),
  notes: notesSchema,
  propertyInterest: z.string().optional(),
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;

// ===========================
// Update Lead Schema
// ===========================

export const updateLeadSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: emailSchema.optional(),
  contactNumber: phoneSchema.optional(),
  leadSource: z.nativeEnum(LeadSource).optional(),
  notes: notesSchema,
  propertyInterest: z.string().optional(),
});

export type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;

// ===========================
// Document Upload Schema
// ===========================

export const uploadDocumentSchema = z.object({
  file: z
    .instanceof(File, { message: 'Please select a file' })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      {
        message: 'File size must be less than 5MB',
      }
    )
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
      {
        message: 'File must be PDF, JPG, or PNG',
      }
    ),
  documentType: z.nativeEnum(LeadDocumentType),
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

// ===========================
// Lead Search Schema
// ===========================

export const leadSearchSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.array(z.string()).optional(),
  leadSource: z.array(z.string()).optional(),
  propertyId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type LeadSearchFormData = z.infer<typeof leadSearchSchema>;

// ===========================
// Validation Helpers
// ===========================

/**
 * Validate Emirates ID format
 */
export function isValidEmiratesId(emiratesId: string): boolean {
  return emiratesIdRegex.test(emiratesId);
}

/**
 * Validate E.164 phone number
 */
export function isValidE164Phone(phone: string): boolean {
  return e164PhoneRegex.test(phone);
}

/**
 * Check if passport is expired
 */
export function isPassportExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return expiry <= new Date();
}

/**
 * Format Emirates ID for display (add separators if not present)
 */
export function formatEmiratesId(emiratesId: string): string {
  // Remove any existing separators
  const clean = emiratesId.replace(/-/g, '');

  // Add separators in correct positions
  if (clean.length === 15) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 14)}-${clean.slice(14)}`;
  }

  return emiratesId;
}

/**
 * Format phone number for display (E.164 format)
 */
export function formatPhoneNumber(phone: string): string {
  // Ensure + prefix for E.164
  if (!phone.startsWith('+')) {
    return `+${phone}`;
  }
  return phone;
}
