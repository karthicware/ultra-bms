/**
 * Tenant Onboarding Validation Schemas
 * Zod schemas for 6-step tenant onboarding wizard with comprehensive validation rules
 * SCP-2025-12-07: Reduced from 7 steps to 6 - Payment Schedule (Step 5) eliminated,
 * paymentDueDate moved to Step 3 (Rent Breakdown)
 */

import { z } from 'zod';
import { differenceInYears, differenceInDays } from 'date-fns';
import { LeaseType, PaymentFrequency, PaymentMethod } from '@/types/tenant';

// ===========================
// Common Validation Rules
// ===========================

/**
 * E.164 phone number format
 * Must start with + followed by country code and number
 * Example: +971501234567
 */
const e164PhoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Email validation (RFC 5322 compliant via Zod)
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase();

/**
 * Phone number validation (E.164 format)
 */
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(e164PhoneRegex, 'Please enter a valid phone number (e.g., +971501234567)');

/**
 * Name validation
 */
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Full name validation (SCP-2025-12-12: Replaces firstName/lastName)
 * Full name from Emirates ID OCR - allows more characters
 */
const fullNameSchema = z
  .string()
  .min(1, 'Full name is required')
  .max(255, 'Full name must be less than 255 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * National ID validation
 */
const nationalIdSchema = z
  .string()
  .min(1, 'National ID / Passport number is required')
  .max(50, 'National ID must be less than 50 characters');

/**
 * Date of birth validation (must be 18+ years)
 */
const dateOfBirthSchema = z
  .date()
  .refine(
    (date) => {
      const age = differenceInYears(new Date(), date);
      return age >= 18;
    },
    {
      message: 'Tenant must be at least 18 years old',
    }
  );

/**
 * File validation (PDF/JPG/PNG, max 5MB)
 */
const fileSchema5MB = z
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
  );

/**
 * File validation (PDF only, max 10MB for lease agreement)
 */
const fileSchema10MB = z
  .instanceof(File, { message: 'Please select a file' })
  .refine(
    (file) => file.size <= 10 * 1024 * 1024,
    {
      message: 'File size must be less than 10MB',
    }
  )
  .refine(
    (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
    {
      message: 'File must be PDF, JPG, or PNG',
    }
  );

// ===========================
// Step 1: Personal Information Schema
// ===========================

// SCP-2025-12-12: Replaced firstName/lastName with fullName from Emirates ID OCR
export const personalInfoSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: dateOfBirthSchema,
  nationalId: nationalIdSchema,
  nationality: z
    .string()
    .min(1, 'Nationality is required')
    .max(100, 'Nationality must be less than 100 characters'),
  emergencyContactName: z
    .string()
    .min(1, 'Emergency contact name is required')
    .max(100, 'Emergency contact name must be less than 100 characters'),
  emergencyContactPhone: phoneSchema,
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

// ===========================
// Step 2: Lease Information Schema
// ===========================

export const leaseInfoSchema = z.object({
  propertyId: z
    .string()
    .min(1, 'Property selection is required'),
  unitId: z
    .string()
    .min(1, 'Unit selection is required'),
  leaseStartDate: z
    .date()
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        return date >= today;
      },
      {
        message: 'Lease start date must be today or in the future',
      }
    ),
  leaseEndDate: z
    .date(),
  leaseType: z.nativeEnum(LeaseType),
  renewalOption: z.boolean(),
}).refine(
  (data) => {
    // SCP-2025-12-07: Lease must be at least 30 days
    const daysDiff = differenceInDays(data.leaseEndDate, data.leaseStartDate);
    return daysDiff >= 30;
  },
  {
    message: 'Lease duration must be at least 30 days',
    path: ['leaseEndDate'],
  }
);

export type LeaseInfoFormData = z.infer<typeof leaseInfoSchema>;

// ===========================
// Step 3: Rent Breakdown Schema
// ===========================

export const rentBreakdownSchema = z.object({
  baseRent: z
    .number()
    .min(0, 'Base rent must be 0 or greater')
    .max(999999.99, 'Base rent must be less than 1,000,000'),
  adminFee: z
    .number()
    .min(0, 'Admin fee must be 0 or greater')
    .max(999999.99, 'Admin fee must be less than 1,000,000'),
  serviceCharge: z
    .number()
    .min(0, 'Service charge must be 0 or greater')
    .max(999999.99, 'Service charge must be less than 1,000,000'),
  securityDeposit: z
    .number()
    .min(0.01, 'Security deposit must be greater than 0')
    .max(999999.99, 'Security deposit must be less than 1,000,000'),
});

export type RentBreakdownFormData = z.infer<typeof rentBreakdownSchema>;

// ===========================
// Step 4: Parking Allocation Schema (Optional)
// SCP-2025-12-02: Changed to single parking spot selection from inventory
// ===========================

export const parkingAllocationSchema = z.object({
  // Single parking spot UUID (optional - from parking inventory)
  parkingSpotId: z
    .string()
    .uuid('Invalid parking spot ID')
    .nullable()
    .optional(),
  // Number of parking spots (0 or 1 for single spot)
  parkingSpots: z
    .number()
    .min(0, 'Parking spots must be 0 or greater')
    .max(1, 'Maximum 1 parking spot allowed'),
  // Editable parking fee (auto-filled from spot, can be overridden)
  parkingFeePerSpot: z
    .number()
    .min(0, 'Parking fee must be 0 or greater')
    .max(999999.99, 'Parking fee must be less than 1,000,000'),
  // Spot number (auto-filled from selected spot)
  spotNumbers: z
    .string()
    .max(200, 'Spot numbers must be less than 200 characters')
    .optional(),
  mulkiyaFile: z
    .instanceof(File)
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      {
        message: 'File size must be less than 5MB',
      }
    )
    .refine(
      (file) => !file || ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
      {
        message: 'File must be PDF, JPG, or PNG',
      }
    )
    .nullable()
    .optional(),
});

export type ParkingAllocationFormData = z.infer<typeof parkingAllocationSchema>;

// ===========================
// Step 5: Document Upload Schema
// SCP-2025-12-07: Was Step 6, now Step 5 after Payment Schedule was eliminated
// ===========================

export const documentUploadSchema = z.object({
  emiratesIdFile: fileSchema5MB,
  passportFile: fileSchema5MB,
  visaFile: fileSchema5MB.nullable().optional(),
  signedLeaseFile: fileSchema10MB,
  additionalFiles: z
    .array(fileSchema5MB)
    .max(5, 'Maximum 5 additional files allowed'),
});

export type TenantDocumentUploadFormData = z.infer<typeof documentUploadSchema>;

// ===========================
// Step 6: Review Schema (Combines all schemas)
// SCP-2025-12-07: Was Step 7, now Step 6 after Payment Schedule was eliminated
// ===========================

// SCP-2025-12-12: Updated to use fullName instead of firstName/lastName
export const createTenantSchema = z.object({
  // Step 1: Personal Information
  fullName: personalInfoSchema.shape.fullName,
  email: personalInfoSchema.shape.email,
  phone: personalInfoSchema.shape.phone,
  dateOfBirth: personalInfoSchema.shape.dateOfBirth,
  nationalId: personalInfoSchema.shape.nationalId,
  nationality: personalInfoSchema.shape.nationality,
  emergencyContactName: personalInfoSchema.shape.emergencyContactName,
  emergencyContactPhone: personalInfoSchema.shape.emergencyContactPhone,

  // Step 2: Lease Information
  propertyId: leaseInfoSchema.shape.propertyId,
  unitId: leaseInfoSchema.shape.unitId,
  leaseStartDate: leaseInfoSchema.shape.leaseStartDate,
  leaseEndDate: leaseInfoSchema.shape.leaseEndDate,
  leaseType: leaseInfoSchema.shape.leaseType,
  renewalOption: leaseInfoSchema.shape.renewalOption,

  // Step 3: Rent Breakdown
  baseRent: rentBreakdownSchema.shape.baseRent,
  adminFee: rentBreakdownSchema.shape.adminFee,
  serviceCharge: rentBreakdownSchema.shape.serviceCharge,
  securityDeposit: rentBreakdownSchema.shape.securityDeposit,

  // Step 4: Parking Allocation (SCP-2025-12-02: Single spot selection)
  parkingSpotId: parkingAllocationSchema.shape.parkingSpotId,
  parkingSpots: parkingAllocationSchema.shape.parkingSpots,
  parkingFeePerSpot: parkingAllocationSchema.shape.parkingFeePerSpot,
  spotNumbers: parkingAllocationSchema.shape.spotNumbers,

  // SCP-2025-12-07: Payment due date moved to Step 3 (Rent Breakdown)
  // These fields are kept for backward compatibility with backend
  paymentDueDate: z
    .number()
    .min(1, 'Due date must be between 1 and 31')
    .max(31, 'Due date must be between 1 and 31')
    .default(5),
  paymentFrequency: z.nativeEnum(PaymentFrequency).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  pdcChequeCount: z
    .number()
    .min(1)
    .max(12)
    .optional(),

  // Lead conversion (optional)
  leadId: z.string().optional(),
  quotationId: z.string().optional(),
}).refine(
  (data) => {
    // SCP-2025-12-07: Lease must be at least 30 days
    const daysDiff = differenceInDays(data.leaseEndDate, data.leaseStartDate);
    return daysDiff >= 30;
  },
  {
    message: 'Lease duration must be at least 30 days',
    path: ['leaseEndDate'],
  }
);

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;

// ===========================
// Validation Helpers
// ===========================

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  return differenceInYears(new Date(), dob);
}

/**
 * Validate if age is 18 or older
 */
export function isAgeValid(dateOfBirth: Date | string): boolean {
  return calculateAge(dateOfBirth) >= 18;
}

/**
 * Calculate lease duration in months
 */
export function calculateLeaseDuration(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months;
}

/**
 * Calculate total monthly rent (including parking)
 * SCP-2025-12-02: Updated for single parking spot
 */
export function calculateTotalMonthlyRent(
  baseRent: number,
  serviceCharge: number,
  parkingFee?: number
): number {
  return baseRent + serviceCharge + (parkingFee || 0);
}

/**
 * Format currency (AED)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate file size
 */
export function isFileSizeValid(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Validate file type
 */
export function isFileTypeValid(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
