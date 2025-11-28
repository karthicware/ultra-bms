/**
 * Company Profile Validation Schemas
 * Zod schemas for company profile forms
 * Story 2.8: Company Profile Settings
 */

import { z } from 'zod';
import {
  ALLOWED_LOGO_TYPES,
  MAX_LOGO_SIZE,
  MAX_LOGO_SIZE_MB,
} from '@/types/company-profile';

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * UAE TRN format: 15 digits starting with 100
 */
export const TRN_REGEX = /^100\d{12}$/;

/**
 * UAE phone format: +971 followed by 9 digits
 */
export const UAE_PHONE_REGEX = /^\+971\d{9}$/;

/**
 * Email validation (RFC 5322 simplified)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// COMPANY PROFILE SCHEMA
// ============================================================================

/**
 * Company profile form validation schema
 * Validates all fields per AC12 requirements
 */
export const companyProfileSchema = z.object({
  /**
   * Legal company name (required, max 255 chars)
   */
  legalCompanyName: z
    .string()
    .min(1, 'Legal company name is required')
    .max(255, 'Legal company name must be less than 255 characters')
    .transform((val) => val.trim()),

  /**
   * Company address (required, max 500 chars)
   */
  companyAddress: z
    .string()
    .min(1, 'Company address is required')
    .max(500, 'Company address must be less than 500 characters')
    .transform((val) => val.trim()),

  /**
   * City (required, max 100 chars)
   */
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters')
    .transform((val) => val.trim()),

  /**
   * Country (required, max 100 chars)
   */
  country: z
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters')
    .transform((val) => val.trim()),

  /**
   * TRN - Tax Registration Number (required, 15 digits starting with 100)
   */
  trn: z
    .string()
    .min(1, 'TRN is required')
    .regex(TRN_REGEX, 'TRN must be 15 digits starting with 100 (e.g., 100123456789012)'),

  /**
   * Phone number (required, UAE format +971XXXXXXXXX)
   */
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(UAE_PHONE_REGEX, 'Phone must be in UAE format (+971XXXXXXXXX)'),

  /**
   * Email address (required, valid email format)
   */
  emailAddress: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform((val) => val.trim().toLowerCase()),
});

/**
 * Type inference from company profile schema
 */
export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

/**
 * Default values for company profile form
 */
export const companyProfileDefaults: CompanyProfileFormData = {
  legalCompanyName: '',
  companyAddress: '',
  city: '',
  country: 'United Arab Emirates',
  trn: '',
  phoneNumber: '+971',
  emailAddress: '',
};

// ============================================================================
// LOGO FILE VALIDATION
// ============================================================================

/**
 * Validate logo file schema
 */
export const logoFileSchema = z.object({
  file: z
    .instanceof(File, { message: 'Please select a file' })
    .refine((file) => file.size > 0, 'Please select a file')
    .refine(
      (file) => ALLOWED_LOGO_TYPES.includes(file.type),
      'Logo must be PNG or JPG format'
    )
    .refine(
      (file) => file.size <= MAX_LOGO_SIZE,
      `Logo must be less than ${MAX_LOGO_SIZE_MB}MB`
    ),
});

export type LogoFileFormData = z.infer<typeof logoFileSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a single TRN value
 */
export function validateTRN(trn: string): boolean {
  return TRN_REGEX.test(trn);
}

/**
 * Validate a single UAE phone number
 */
export function validateUAEPhone(phone: string): boolean {
  return UAE_PHONE_REGEX.test(phone);
}

/**
 * Validate a single email address
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Convert form data to API request format
 */
export function toCompanyProfileRequest(data: CompanyProfileFormData) {
  return {
    legalCompanyName: data.legalCompanyName,
    companyAddress: data.companyAddress,
    city: data.city,
    country: data.country,
    trn: data.trn,
    phoneNumber: data.phoneNumber,
    emailAddress: data.emailAddress,
  };
}

/**
 * Map API response to form data
 */
export function toCompanyProfileFormData(response: {
  legalCompanyName: string;
  companyAddress: string;
  city: string;
  country: string;
  trn: string;
  phoneNumber: string;
  emailAddress: string;
}): CompanyProfileFormData {
  return {
    legalCompanyName: response.legalCompanyName || '',
    companyAddress: response.companyAddress || '',
    city: response.city || '',
    country: response.country || 'United Arab Emirates',
    trn: response.trn || '',
    phoneNumber: response.phoneNumber || '+971',
    emailAddress: response.emailAddress || '',
  };
}
