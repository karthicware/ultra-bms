/**
 * Vendor Validation Schemas
 * Story 5.1: Vendor Registration and Profile Management
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { VendorStatus, PaymentTerms, ServiceCategory } from '@/types/vendors';

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * E.164 phone number format
 * UAE numbers: +971 followed by 9 digits
 * Also accepts other international formats
 */
export const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * UAE Tax Registration Number (TRN) format
 * 15-digit number
 */
export const UAE_TRN_REGEX = /^\d{15}$/;

/**
 * RFC 5322 simplified email regex
 * More permissive than strict RFC 5322 but catches common errors
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const vendorStatusSchema = z.nativeEnum(VendorStatus);
export const paymentTermsSchema = z.nativeEnum(PaymentTerms);
export const serviceCategorySchema = z.nativeEnum(ServiceCategory);

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for vendor registration and edit forms
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(vendorSchema),
 *   defaultValues: {
 *     companyName: '',
 *     contactPersonName: '',
 *     email: '',
 *     phoneNumber: '',
 *     ...
 *   }
 * });
 * ```
 */
export const vendorSchema = z.object({
  // Company Information
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters')
    .trim(),

  contactPersonName: z
    .string()
    .min(1, 'Contact person name is required')
    .max(100, 'Contact person name must be less than 100 characters')
    .trim(),

  emiratesIdOrTradeLicense: z
    .string()
    .min(1, 'Emirates ID or Trade License number is required')
    .max(50, 'Emirates ID or Trade License must be less than 50 characters')
    .trim(),

  trn: z
    .string()
    .regex(UAE_TRN_REGEX, 'TRN must be a 15-digit number')
    .optional()
    .or(z.literal('')),

  // Contact Information
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(E164_PHONE_REGEX, 'Phone number must be in E.164 format (e.g., +971501234567)'),

  secondaryPhoneNumber: z
    .string()
    .regex(E164_PHONE_REGEX, 'Phone number must be in E.164 format (e.g., +971501234567)')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  // Service Information
  serviceCategories: z
    .array(serviceCategorySchema)
    .min(1, 'At least one service category is required'),

  serviceAreas: z.array(z.string()).default([]),

  // Payment Information
  hourlyRate: z
    .number({ message: 'Hourly rate must be a number' })
    .min(0, 'Hourly rate must be 0 or greater'),

  emergencyCalloutFee: z
    .number({ message: 'Emergency callout fee must be a number' })
    .min(0, 'Emergency callout fee must be 0 or greater')
    .optional()
    .nullable(),

  paymentTerms: paymentTermsSchema.refine((val) => val !== undefined, {
    message: 'Please select payment terms'
  })
});

/**
 * Type inference from vendor schema (output type - after parsing)
 */
export type VendorFormData = z.output<typeof vendorSchema>;

/**
 * Input type for vendor schema (input type - before parsing)
 * Used for form default values where defaults haven't been applied yet
 */
export type VendorFormInput = z.input<typeof vendorSchema>;

/**
 * Default values for vendor form
 */
export const vendorFormDefaults: VendorFormData = {
  companyName: '',
  contactPersonName: '',
  emiratesIdOrTradeLicense: '',
  trn: '',
  email: '',
  phoneNumber: '',
  secondaryPhoneNumber: '',
  address: '',
  serviceCategories: [],
  serviceAreas: [],
  hourlyRate: 0,
  emergencyCalloutFee: null,
  paymentTerms: PaymentTerms.NET_30
};

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for vendor list filters
 */
export const vendorFilterSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  status: z
    .enum(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .optional()
    .default('ALL'),

  serviceCategories: z
    .array(serviceCategorySchema)
    .optional()
    .default([]),

  minRating: z
    .number()
    .min(0, 'Minimum rating must be at least 0')
    .max(5, 'Minimum rating cannot exceed 5')
    .optional()
    .nullable(),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sortBy: z
    .enum(['vendorNumber', 'companyName', 'rating', 'status', 'createdAt'])
    .optional()
    .default('companyName'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('ASC')
});

/**
 * Type inference from filter schema
 */
export type VendorFilterFormData = z.infer<typeof vendorFilterSchema>;

/**
 * Default values for vendor filter form
 */
export const vendorFilterDefaults: VendorFilterFormData = {
  search: '',
  status: 'ALL',
  serviceCategories: [],
  minRating: null,
  page: 0,
  size: 20,
  sortBy: 'companyName',
  sortDirection: 'ASC'
};

// ============================================================================
// STATUS UPDATE SCHEMA
// ============================================================================

/**
 * Validation schema for updating vendor status
 */
export const updateVendorStatusSchema = z.object({
  status: vendorStatusSchema.refine((val) => val !== undefined, {
    message: 'Please select a status'
  })
});

/**
 * Type inference from status update schema
 */
export type UpdateVendorStatusFormData = z.infer<typeof updateVendorStatusSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a single email address
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate E.164 phone number format
 */
export function isValidE164Phone(phone: string): boolean {
  return E164_PHONE_REGEX.test(phone);
}

/**
 * Validate UAE TRN format
 */
export function isValidUaeTrn(trn: string): boolean {
  if (!trn || trn === '') return true; // TRN is optional
  return UAE_TRN_REGEX.test(trn);
}

/**
 * Format phone number to E.164 (if not already)
 * Assumes UAE number if no country code
 */
export function formatToE164(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If already in E.164 format, return as-is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 0, assume UAE and replace with +971
  if (cleaned.startsWith('0')) {
    return '+971' + cleaned.substring(1);
  }

  // If starts with 971, add +
  if (cleaned.startsWith('971')) {
    return '+' + cleaned;
  }

  // Otherwise, assume UAE number and add +971
  return '+971' + cleaned;
}
