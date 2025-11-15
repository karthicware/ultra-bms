/**
 * Quotation Management Validation Schemas
 * Zod schemas for quotation creation, editing, and status management with comprehensive validation rules
 */

import { z } from 'zod';
import { QuotationStatus, StayType } from '@/types/quotations';

// ===========================
// Common Validation Rules
// ===========================

/**
 * Positive number validation (must be > 0)
 */
const positiveNumberSchema = (fieldName: string) =>
  z
    .number({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a number`,
    })
    .positive(`${fieldName} must be greater than 0`);

/**
 * Non-negative number validation (must be >= 0)
 */
const nonNegativeNumberSchema = (fieldName: string) =>
  z
    .number({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a number`,
    })
    .nonnegative(`${fieldName} must be 0 or greater`);

/**
 * Future date validation
 */
const futureDateSchema = (fieldName: string) =>
  z
    .date({
      required_error: `${fieldName} is required`,
      invalid_type_error: 'Please enter a valid date',
    })
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
    leadId: z.string().min(1, 'Please select a lead'),
    issueDate: z.date({
      required_error: 'Issue date is required',
      invalid_type_error: 'Please enter a valid date',
    }),
    validityDate: z.date({
      required_error: 'Validity date is required',
      invalid_type_error: 'Please enter a valid date',
    }),
    propertyId: z.string().min(1, 'Please select a property'),
    unitId: z.string().min(1, 'Please select a unit'),
    stayType: z.nativeEnum(StayType, {
      errorMap: () => ({ message: 'Please select a stay type' }),
    }),
    baseRent: positiveNumberSchema('Base rent'),
    serviceCharges: nonNegativeNumberSchema('Service charges'),
    parkingSpots: nonNegativeNumberSchema('Parking spots')
      .int('Parking spots must be a whole number'),
    parkingFee: nonNegativeNumberSchema('Parking fee per spot'),
    securityDeposit: positiveNumberSchema('Security deposit'),
    adminFee: nonNegativeNumberSchema('Admin fee'),
    documentRequirements: z
      .array(z.string())
      .min(1, 'Please select at least one document requirement')
      .default([]),
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
  })
  .refine(
    (data) => data.validityDate > data.issueDate,
    {
      message: 'Validity date must be after issue date',
      path: ['validityDate'],
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
    stayType: z.nativeEnum(StayType).optional(),
    baseRent: positiveNumberSchema('Base rent').optional(),
    serviceCharges: nonNegativeNumberSchema('Service charges').optional(),
    parkingSpots: nonNegativeNumberSchema('Parking spots')
      .int('Parking spots must be a whole number')
      .optional(),
    parkingFee: nonNegativeNumberSchema('Parking fee per spot').optional(),
    securityDeposit: positiveNumberSchema('Security deposit').optional(),
    adminFee: nonNegativeNumberSchema('Admin fee').optional(),
    documentRequirements: z.array(z.string()).optional(),
    paymentTerms: z.string().min(10).max(5000).optional(),
    moveinProcedures: z.string().min(10).max(5000).optional(),
    cancellationPolicy: z.string().min(10).max(5000).optional(),
    specialTerms: z.string().max(5000).optional(),
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
 */
export function calculateTotalFirstPayment(data: {
  baseRent: number;
  serviceCharges: number;
  parkingSpots: number;
  parkingFee: number;
  securityDeposit: number;
  adminFee: number;
}): number {
  const parkingTotal = data.parkingSpots * data.parkingFee;
  return (
    data.securityDeposit +
    data.adminFee +
    data.baseRent +
    data.serviceCharges +
    parkingTotal
  );
}

/**
 * Calculate parking total
 */
export function calculateParkingTotal(parkingSpots: number, parkingFee: number): number {
  return parkingSpots * parkingFee;
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
 * Validate default validity date (30 days from issue date)
 */
export function getDefaultValidityDate(issueDate: Date): Date {
  const validity = new Date(issueDate);
  validity.setDate(validity.getDate() + 30);
  return validity;
}
