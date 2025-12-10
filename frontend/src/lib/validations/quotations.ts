/**
 * Quotation Management Validation Schemas
 * Zod schemas for quotation creation, editing, and status management with comprehensive validation rules
 */

import { z } from 'zod';
import { addMonths, addYears } from 'date-fns';
import { QuotationStatus, FirstMonthPaymentMethod, type ChequeBreakdownItem } from '@/types/quotations';

// ===========================
// Cheque Breakdown Schemas (SCP-2025-12-06)
// ===========================

/**
 * Single cheque breakdown item validation
 */
export const chequeBreakdownItemSchema = z.object({
  chequeNumber: z.number().int().positive('Cheque number must be positive'),
  amount: z.number().positive('Cheque amount must be greater than 0'),
  dueDate: z.string().min(1, 'Due date is required'),
});

/**
 * First month payment method enum validation
 */
const firstMonthPaymentMethodSchema = z.nativeEnum(FirstMonthPaymentMethod);

// ===========================
// Common Validation Rules
// ===========================

/**
 * Positive number validation (must be > 0)
 */
const positiveNumberSchema = (fieldName: string) =>
  z
    .number()
    .positive(`${fieldName} must be greater than 0`);

/**
 * Non-negative number validation (must be >= 0)
 */
const nonNegativeNumberSchema = (fieldName: string) =>
  z
    .number()
    .nonnegative(`${fieldName} must be 0 or greater`);

/**
 * Future date validation
 */
const futureDateSchema = (fieldName: string) =>
  z
    .date()
    .refine(
      (date) => date > new Date(),
      {
        message: `${fieldName} must be in the future`,
      }
    );

// ===========================
// Create Quotation Schema
// ===========================

export const createQuotationSchema = z
  .object({
    leadId: z.string().uuid('Please provide a valid lead ID'),
    issueDate: z.date(),
    validityDate: futureDateSchema('Validity date'),
    propertyId: z.string().min(1, 'Please select a property'),
    unitId: z.string().min(1, 'Please select a unit'),
    baseRent: nonNegativeNumberSchema('Base rent').optional(), // Now calculated from yearly rent / cheques
    serviceCharges: nonNegativeNumberSchema('Service charges'),
    parkingSpotId: z.string().uuid().optional().nullable(),
    parkingFee: nonNegativeNumberSchema('Parking fee').optional(),
    securityDeposit: positiveNumberSchema('Security deposit'),
    adminFee: nonNegativeNumberSchema('Admin fee'),
    documentRequirements: z
      .array(z.string())
      .min(1, 'Please select at least one document requirement'),
    paymentTerms: z
      .string()
      .min(10, 'Payment terms must be at least 10 characters')
      .max(5000, 'Payment terms must be less than 5000 characters'),
    moveinProcedures: z
      .string()
      .min(10, 'Move-in procedures must be at least 10 characters')
      .max(5000, 'Move-in procedures must be less than 5000 characters'),
    cancellationPolicy: z
      .string()
      .min(10, 'Cancellation policy must be at least 10 characters')
      .max(5000, 'Cancellation policy must be less than 5000 characters'),
    specialTerms: z
      .string()
      .max(5000, 'Special terms must be less than 5000 characters')
      .optional(),
    // SCP-2025-12-06: Cheque breakdown fields
    yearlyRentAmount: positiveNumberSchema('Yearly rent amount').optional(),
    numberOfCheques: z
      .number()
      .int('Number of cheques must be a whole number')
      .min(1, 'Minimum 1 cheque required')
      .max(12, 'Maximum 12 cheques allowed')
      .optional(),
    firstMonthPaymentMethod: firstMonthPaymentMethodSchema.optional(),
    chequeBreakdown: z.array(chequeBreakdownItemSchema).optional(),
    // SCP-2025-12-04: Identity document fields
    // These are optional in schema as they are validated separately in step validation
    // and added to payload before submission
    emiratesIdNumber: z.string().optional(),
    emiratesIdExpiry: z.string().optional(),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional(),
    nationality: z.string().optional(),
    emiratesIdFrontPath: z.string().optional(),
    emiratesIdBackPath: z.string().optional(),
    passportFrontPath: z.string().optional(),
    passportBackPath: z.string().optional(),
    passportPath: z.string().optional(),
  })
  .refine(
    (data) => data.validityDate > data.issueDate,
    {
      message: 'Validity date must be after issue date',
      path: ['validityDate'],
    }
  )
  .refine(
    (data) => {
      // If yearly amount and number of cheques provided, validate cheque breakdown
      if (data.yearlyRentAmount && data.numberOfCheques && data.chequeBreakdown) {
        const totalChequeAmount = data.chequeBreakdown.reduce((sum, item) => sum + item.amount, 0);
        // Allow small rounding differences (within 1 AED)
        return Math.abs(totalChequeAmount - data.yearlyRentAmount) < 1;
      }
      return true;
    },
    {
      message: 'Cheque amounts must equal yearly rent amount',
      path: ['chequeBreakdown'],
    }
  );

export type CreateQuotationFormData = z.infer<typeof createQuotationSchema>;

// ===========================
// Update Quotation Schema
// ===========================

export const updateQuotationSchema = z
  .object({
    issueDate: z.date().optional(),
    validityDate: z.date().optional(),
    propertyId: z.string().optional(),
    unitId: z.string().optional(),
    baseRent: positiveNumberSchema('Base rent').optional(),
    serviceCharges: nonNegativeNumberSchema('Service charges').optional(),
    parkingSpotId: z.string().uuid().optional().nullable(),
    parkingFee: nonNegativeNumberSchema('Parking fee').optional(),
    securityDeposit: positiveNumberSchema('Security deposit').optional(),
    adminFee: nonNegativeNumberSchema('Admin fee').optional(),
    documentRequirements: z.array(z.string()).optional(),
    paymentTerms: z.string().min(10).max(5000).optional(),
    moveinProcedures: z.string().min(10).max(5000).optional(),
    cancellationPolicy: z.string().min(10).max(5000).optional(),
    specialTerms: z.string().max(5000).optional(),
    // SCP-2025-12-06: Cheque breakdown fields
    yearlyRentAmount: positiveNumberSchema('Yearly rent amount').optional(),
    numberOfCheques: z.number().int().min(1).max(12).optional(),
    firstMonthPaymentMethod: firstMonthPaymentMethodSchema.optional(),
    chequeBreakdown: z.array(chequeBreakdownItemSchema).optional(),
    // SCP-2025-12-04: Identity document fields
    emiratesIdNumber: z.string().optional(),
    emiratesIdExpiry: z.string().optional(),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional(),
    nationality: z.string().optional(),
    emiratesIdFrontPath: z.string().optional(),
    emiratesIdBackPath: z.string().optional(),
    passportPath: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.validityDate && data.issueDate) {
        return data.validityDate > data.issueDate;
      }
      return true;
    },
    {
      message: 'Validity date must be after issue date',
      path: ['validityDate'],
    }
  );

export type UpdateQuotationFormData = z.infer<typeof updateQuotationSchema>;

// ===========================
// Reject Quotation Schema
// ===========================

export const rejectQuotationSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
});

export type RejectQuotationFormData = z.infer<typeof rejectQuotationSchema>;

// ===========================
// Quotation Search Schema
// ===========================

export const quotationSearchSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.array(z.string()).optional(),
  propertyId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type QuotationSearchFormData = z.infer<typeof quotationSearchSchema>;

// ===========================
// Quotation Calculation Helpers
// ===========================

/**
 * Calculate total first payment
 * Now calculates first month rent from yearly amount and number of cheques
 * parkingFee is now the total parking fee (single spot), not per-spot fee
 */
export function calculateTotalFirstPayment(data: {
  baseRent?: number; // Optional - for backwards compatibility
  serviceCharges: number;
  parkingFee?: number;
  securityDeposit: number;
  adminFee: number;
  yearlyRentAmount?: number;
  numberOfCheques?: number;
}): number {
  // Calculate first payment from yearly rent / number of cheques if available
  // Round to whole number - no decimals
  const firstPayment = data.yearlyRentAmount && data.numberOfCheques && data.numberOfCheques > 0
    ? Math.round(data.yearlyRentAmount / data.numberOfCheques)
    : Math.round(data.baseRent || 0);

  return Math.round(
    data.securityDeposit +
    data.adminFee +
    firstPayment +
    data.serviceCharges +
    (data.parkingFee || 0)
  );
}

/**
 * Get parking fee (now a direct value since only one spot allowed)
 */
export function getParkingFee(parkingFee?: number): number {
  return parkingFee || 0;
}

/**
 * Validate quotation can be edited (must be DRAFT status)
 */
export function canEditQuotation(status: QuotationStatus): boolean {
  return status === QuotationStatus.DRAFT;
}

/**
 * Validate quotation can be sent (must be DRAFT status)
 */
export function canSendQuotation(status: QuotationStatus): boolean {
  return status === QuotationStatus.DRAFT;
}

/**
 * Validate quotation can be accepted (must be SENT status and not expired)
 */
export function canAcceptQuotation(
  status: QuotationStatus,
  validityDate: Date | string
): boolean {
  if (status !== QuotationStatus.SENT) {
    return false;
  }

  const validity = typeof validityDate === 'string' ? new Date(validityDate) : validityDate;
  return validity > new Date();
}

/**
 * Validate quotation can be rejected (must be SENT status)
 */
export function canRejectQuotation(status: QuotationStatus): boolean {
  return status === QuotationStatus.SENT;
}

/**
 * Check if quotation is expired
 */
export function isQuotationExpired(validityDate: Date | string): boolean {
  const validity = typeof validityDate === 'string' ? new Date(validityDate) : validityDate;
  return validity <= new Date();
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(validityDate: Date | string): number {
  const validity = typeof validityDate === 'string' ? new Date(validityDate) : validityDate;
  const today = new Date();
  const diffTime = validity.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get urgency level based on days until expiry
 */
export function getExpiryUrgency(validityDate: Date | string): 'high' | 'medium' | 'low' {
  const days = daysUntilExpiry(validityDate);

  if (days < 7) return 'high';
  if (days < 14) return 'medium';
  return 'low';
}

/**
 * Format currency (AED)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate default validity date (1 year from issue date)
 */
export function getDefaultValidityDate(issueDate: Date): Date {
  return addYears(issueDate, 1);
}

/**
 * Default quotation terms and conditions
 */
export const DEFAULT_QUOTATION_TERMS = {
  paymentTerms: `1. The tenant shall pay rent monthly in advance on the 1st of each month.
2. Payment shall be made via bank transfer to the account specified by the landlord.
3. A security deposit equivalent to one month's rent is required before move-in.
4. Late payment will incur a penalty of 1% per day after the 5th of the month.
5. All payments are non-refundable except the security deposit, which will be returned within 30 days of lease termination, subject to property inspection.`,

  moveinProcedures: `1. Complete and submit all required documentation including Emirates ID, passport, and visa copies.
2. Pay the security deposit and first month's rent in full.
3. Schedule a move-in inspection with the property manager.
4. Receive the keys and access cards at the property management office.
5. Sign the move-in condition report during the inspection.
6. Register utility accounts (DEWA, internet, etc.) in your name within 7 days.`,

  cancellationPolicy: `1. The tenant must provide written notice at least 30 days before the intended move-out date.
2. For cancellation before the lease start date, the security deposit will be forfeited.
3. For cancellation during the lease period, the tenant is responsible for rent until a replacement tenant is found or the lease expires, whichever comes first.
4. Early termination fees may apply as per UAE tenancy laws.
5. The security deposit will be refunded after property inspection and settlement of all outstanding bills, less any damages.`,
};

// ===========================
// Cheque Breakdown Helpers (SCP-2025-12-06)
// ===========================

/**
 * Calculate cheque breakdown based on yearly amount and number of cheques
 * Auto-splits the yearly rent amount evenly across all cheques
 *
 * @param yearlyAmount - Total yearly rent amount
 * @param numberOfCheques - Number of cheques to split payment into (1-12)
 * @param leaseStartDate - Date of first cheque (lease start)
 * @returns Array of cheque breakdown items with amounts and due dates
 */
export function calculateChequeBreakdown(
  yearlyAmount: number,
  numberOfCheques: number,
  leaseStartDate: Date
): ChequeBreakdownItem[] {
  if (numberOfCheques < 1 || numberOfCheques > 12) {
    throw new Error('Number of cheques must be between 1 and 12');
  }

  // Use floor for base amount to ensure we don't exceed total
  const baseAmount = Math.floor(yearlyAmount / numberOfCheques);
  const remainder = yearlyAmount - (baseAmount * numberOfCheques);
  const breakdown: ChequeBreakdownItem[] = [];

  for (let i = 0; i < numberOfCheques; i++) {
    const dueDate = addMonths(leaseStartDate, i);
    // Distribute the remainder across the first 'remainder' cheques (+1 each)
    const amount = i < remainder ? baseAmount + 1 : baseAmount;

    breakdown.push({
      chequeNumber: i + 1,
      amount: amount, // Already a whole number
      dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
    });
  }

  return breakdown;
}

/**
 * Get default number of cheques based on common UAE rental practices
 */
export function getDefaultNumberOfCheques(): number {
  return 12; // Monthly payments is standard
}

/**
 * Validate cheque breakdown totals
 */
export function validateChequeBreakdownTotal(
  breakdown: ChequeBreakdownItem[],
  expectedTotal: number
): boolean {
  const actualTotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
  // Allow for small rounding differences (within 1 AED)
  return Math.abs(actualTotal - expectedTotal) < 1;
}

/**
 * Format cheque due date for display
 */
export function formatChequeDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  return new Intl.DateTimeFormat('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
