/**
 * Lease Extension and Renewal Validation Schemas
 * Story 3.6: Tenant Lease Extension and Renewal
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { RentAdjustmentType, RenewalRequestStatus } from '@/types/lease';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const rentAdjustmentTypeSchema = z.nativeEnum(RentAdjustmentType);
export const renewalRequestStatusSchema = z.nativeEnum(RenewalRequestStatus);

// ============================================================================
// LEASE EXTENSION SCHEMA
// ============================================================================

/**
 * Validation schema for lease extension form
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(leaseExtensionSchema),
 *   defaultValues: leaseExtensionFormDefaults
 * });
 * ```
 */
export const leaseExtensionSchema = z
  .object({
    // Required fields
    newEndDate: z
      .date({
        message: 'New end date is required'
      })
      .refine((date) => date > new Date(), {
        message: 'New end date must be in the future'
      }),

    rentAdjustmentType: rentAdjustmentTypeSchema.refine(
      (val) => val !== undefined,
      { message: 'Please select a rent adjustment type' }
    ),

    // Conditional fields based on adjustment type
    percentageIncrease: z
      .number({ message: 'Percentage must be a number' })
      .min(0, 'Percentage cannot be negative')
      .max(100, 'Percentage cannot exceed 100%')
      .optional()
      .nullable(),

    flatIncrease: z
      .number({ message: 'Amount must be a number' })
      .min(0, 'Amount cannot be negative')
      .optional()
      .nullable(),

    customRent: z
      .number({ message: 'Custom rent must be a number' })
      .min(1, 'Rent must be greater than 0')
      .optional()
      .nullable(),

    // Optional terms
    renewalType: z
      .enum(['FIXED_TERM', 'MONTH_TO_MONTH', 'YEARLY'])
      .optional()
      .nullable(),

    autoRenewal: z.boolean(),

    specialTerms: z
      .string()
      .max(2000, 'Special terms cannot exceed 2000 characters')
      .optional()
      .nullable()
      .or(z.literal('')),

    paymentDueDate: z
      .number()
      .int('Payment due date must be a whole number')
      .min(1, 'Payment due date must be between 1 and 28')
      .max(28, 'Payment due date must be between 1 and 28')
      .optional()
      .nullable()
  })
  .superRefine((data, ctx) => {
    // Validate percentage is provided when type is PERCENTAGE
    if (
      data.rentAdjustmentType === RentAdjustmentType.PERCENTAGE &&
      (data.percentageIncrease === null || data.percentageIncrease === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage increase is required when adjustment type is Percentage',
        path: ['percentageIncrease']
      });
    }

    // Validate flat amount is provided when type is FLAT
    if (
      data.rentAdjustmentType === RentAdjustmentType.FLAT &&
      (data.flatIncrease === null || data.flatIncrease === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Flat increase amount is required when adjustment type is Flat Amount',
        path: ['flatIncrease']
      });
    }

    // Validate custom rent is provided when type is CUSTOM
    if (
      data.rentAdjustmentType === RentAdjustmentType.CUSTOM &&
      (data.customRent === null || data.customRent === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom rent amount is required when adjustment type is Custom',
        path: ['customRent']
      });
    }
  });

/**
 * Type inference from lease extension schema
 */
export type LeaseExtensionFormData = z.infer<typeof leaseExtensionSchema>;

/**
 * Default values for lease extension form
 */
export const leaseExtensionFormDefaults: Partial<LeaseExtensionFormData> = {
  rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
  percentageIncrease: null,
  flatIncrease: null,
  customRent: null,
  renewalType: null,
  autoRenewal: false,
  specialTerms: '',
  paymentDueDate: null
};

// ============================================================================
// RENEWAL REQUEST SCHEMA
// ============================================================================

/**
 * Validation schema for tenant renewal request form
 */
export const renewalRequestSchema = z.object({
  preferredTerm: z
    .string()
    .min(1, 'Please select a preferred renewal term')
    .refine(
      (val) => ['12_MONTHS', '24_MONTHS', 'OTHER'].includes(val),
      { message: 'Invalid renewal term selected' }
    ),

  comments: z
    .string()
    .max(500, 'Comments cannot exceed 500 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
});

/**
 * Type inference from renewal request schema
 */
export type RenewalRequestFormData = z.infer<typeof renewalRequestSchema>;

/**
 * Default values for renewal request form
 */
export const renewalRequestFormDefaults: RenewalRequestFormData = {
  preferredTerm: '12_MONTHS',
  comments: ''
};

// ============================================================================
// REJECTION SCHEMA
// ============================================================================

/**
 * Validation schema for rejection dialog
 */
export const rejectionSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason cannot exceed 500 characters')
});

/**
 * Type inference from rejection schema
 */
export type RejectionFormData = z.infer<typeof rejectionSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for renewal request filters
 */
export const renewalRequestFilterSchema = z.object({
  status: z
    .enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
    .optional()
    .default('ALL'),

  propertyId: z.string().optional().or(z.literal('')),

  dateFrom: z.string().optional().or(z.literal('')),

  dateTo: z.string().optional().or(z.literal('')),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20)
});

/**
 * Type inference from filter schema
 */
export type RenewalRequestFilterFormData = z.infer<typeof renewalRequestFilterSchema>;

/**
 * Default values for renewal request filter form
 */
export const renewalRequestFilterDefaults: RenewalRequestFilterFormData = {
  status: 'ALL',
  propertyId: '',
  dateFrom: '',
  dateTo: '',
  page: 0,
  size: 20
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the number of months between two dates
 *
 * @param startDate - Lease start date
 * @param endDate - New lease end date
 * @returns Number of months
 */
export function calculateLeaseDuration(startDate: Date, endDate: Date): number {
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  return Math.max(0, months);
}

/**
 * Calculate new rent based on adjustment type
 *
 * @param currentRent - Current base rent
 * @param adjustmentType - Type of rent adjustment
 * @param adjustmentValue - Percentage, flat amount, or custom value
 * @returns New rent amount
 */
export function calculateNewRent(
  currentRent: number,
  adjustmentType: RentAdjustmentType,
  adjustmentValue: number
): number {
  switch (adjustmentType) {
    case RentAdjustmentType.NO_CHANGE:
      return currentRent;
    case RentAdjustmentType.PERCENTAGE:
      return currentRent * (1 + adjustmentValue / 100);
    case RentAdjustmentType.FLAT:
      return currentRent + adjustmentValue;
    case RentAdjustmentType.CUSTOM:
      return adjustmentValue;
    default:
      return currentRent;
  }
}

/**
 * Calculate rent adjustment percentage
 *
 * @param previousRent - Previous rent amount
 * @param newRent - New rent amount
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculateRentAdjustmentPercentage(
  previousRent: number,
  newRent: number
): number {
  if (previousRent === 0) return 0;
  return ((newRent - previousRent) / previousRent) * 100;
}

/**
 * Get days remaining until lease expiry
 *
 * @param leaseEndDate - Lease end date
 * @returns Number of days remaining (negative if expired)
 */
export function getDaysUntilExpiry(leaseEndDate: Date | string): number {
  const endDate = typeof leaseEndDate === 'string' ? new Date(leaseEndDate) : leaseEndDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get expiry urgency level for badge color
 *
 * @param daysRemaining - Days until lease expires
 * @returns Urgency level (critical, urgent, warning, normal)
 */
export function getExpiryUrgencyLevel(
  daysRemaining: number
): 'critical' | 'urgent' | 'warning' | 'normal' {
  if (daysRemaining <= 14) return 'critical';
  if (daysRemaining <= 30) return 'urgent';
  if (daysRemaining <= 60) return 'warning';
  return 'normal';
}

/**
 * Format default new end date (current end date + 12 months)
 *
 * @param currentEndDate - Current lease end date
 * @returns New end date 12 months from current end
 */
export function getDefaultNewEndDate(currentEndDate: Date | string): Date {
  const endDate =
    typeof currentEndDate === 'string' ? new Date(currentEndDate) : new Date(currentEndDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  return endDate;
}
