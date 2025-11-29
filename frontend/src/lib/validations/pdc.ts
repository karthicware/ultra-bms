/**
 * PDC (Post-Dated Cheque) Validation Schemas
 * Story 6.3: Post-Dated Cheque (PDC) Management
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { PDCStatus, NewPaymentMethod } from '@/types/pdc';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const pdcStatusSchema = z.nativeEnum(PDCStatus);
export const newPaymentMethodSchema = z.nativeEnum(NewPaymentMethod);

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const MIN_CHEQUE_NUMBER_LENGTH = 3;
const MAX_CHEQUE_NUMBER_LENGTH = 50;
const MAX_BANK_NAME_LENGTH = 100;
const MAX_AMOUNT = 99999999.99;
const MIN_AMOUNT = 0.01;
const MAX_NOTES_LENGTH = 500;
const MAX_REASON_LENGTH = 255;
const MAX_TRANSACTION_ID_LENGTH = 100;
const MAX_CHEQUES_PER_BULK = 24;
const MIN_CHEQUES_PER_BULK = 1;

// Cheque number format: alphanumeric, may include hyphens
const CHEQUE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

/**
 * Cheque number validation
 * - Required
 * - 3-50 characters
 * - Alphanumeric with hyphens allowed
 */
const chequeNumberSchema = z
  .string()
  .min(MIN_CHEQUE_NUMBER_LENGTH, `Cheque number must be at least ${MIN_CHEQUE_NUMBER_LENGTH} characters`)
  .max(MAX_CHEQUE_NUMBER_LENGTH, `Cheque number must be less than ${MAX_CHEQUE_NUMBER_LENGTH} characters`)
  .regex(CHEQUE_NUMBER_REGEX, 'Cheque number must contain only letters, numbers, and hyphens')
  .trim();

/**
 * Bank name validation
 * - Required
 * - Max 100 characters
 */
const bankNameSchema = z
  .string()
  .min(1, 'Bank name is required')
  .max(MAX_BANK_NAME_LENGTH, `Bank name must be less than ${MAX_BANK_NAME_LENGTH} characters`)
  .trim();

/**
 * Amount validation
 * - Required
 * - Must be positive (> 0.01)
 * - Max 99,999,999.99
 */
const amountSchema = z
  .number({ message: 'Amount must be a number' })
  .min(MIN_AMOUNT, 'Amount must be greater than 0')
  .max(MAX_AMOUNT, `Amount cannot exceed ${MAX_AMOUNT.toLocaleString()}`);

/**
 * Future date validation for cheque date
 * - Required
 * - Must be a valid date
 * - Must be in the future (or today)
 */
const futureDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format')
  .refine((date) => {
    const parsed = new Date(date);
    parsed.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed >= today;
  }, 'Date must be today or in the future');

/**
 * Past or today date validation
 * - Required
 * - Must be a valid date
 * - Must be today or in the past
 */
const pastOrTodayDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format')
  .refine((date) => {
    const parsed = new Date(date);
    parsed.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return parsed <= today;
  }, 'Date cannot be in the future');

/**
 * UUID validation
 */
const uuidSchema = z.string().uuid('Invalid ID format');

// ============================================================================
// SINGLE CHEQUE ENTRY SCHEMA
// ============================================================================

/**
 * Schema for a single cheque entry in bulk registration
 */
export const pdcChequeEntrySchema = z.object({
  chequeNumber: chequeNumberSchema,
  bankName: bankNameSchema,
  amount: amountSchema,
  chequeDate: futureDateSchema
});

export type PDCChequeEntryFormData = z.infer<typeof pdcChequeEntrySchema>;

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a single PDC
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(pdcCreateSchema),
 *   defaultValues: pdcCreateDefaults
 * });
 * ```
 */
export const pdcCreateSchema = z.object({
  // Required: Tenant selection
  tenantId: uuidSchema.refine((val) => val.length > 0, {
    message: 'Please select a tenant'
  }),

  // Optional: Lease link
  leaseId: z
    .string()
    .uuid('Invalid lease ID')
    .optional()
    .nullable(),

  // Optional: Invoice link
  invoiceId: z
    .string()
    .uuid('Invalid invoice ID')
    .optional()
    .nullable(),

  // Required: Cheque number
  chequeNumber: chequeNumberSchema,

  // Required: Bank name
  bankName: bankNameSchema,

  // Required: Amount
  amount: amountSchema,

  // Required: Cheque date (must be future)
  chequeDate: futureDateSchema,

  // Optional: Notes
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be less than ${MAX_NOTES_LENGTH} characters`)
    .optional()
    .nullable()
});

export type PDCCreateFormData = z.infer<typeof pdcCreateSchema>;

/**
 * Default values for PDC create form
 */
export const pdcCreateDefaults: Partial<PDCCreateFormData> = {
  tenantId: '',
  leaseId: null,
  invoiceId: null,
  chequeNumber: '',
  bankName: '',
  amount: 0,
  chequeDate: '',
  notes: null
};

/**
 * Validation schema for bulk PDC registration
 */
export const pdcBulkCreateSchema = z.object({
  // Required: Tenant selection
  tenantId: uuidSchema.refine((val) => val.length > 0, {
    message: 'Please select a tenant'
  }),

  // Optional: Lease link (applies to all cheques)
  leaseId: z
    .string()
    .uuid('Invalid lease ID')
    .optional()
    .nullable(),

  // Required: Array of cheques (1-24)
  cheques: z
    .array(pdcChequeEntrySchema)
    .min(MIN_CHEQUES_PER_BULK, `At least ${MIN_CHEQUES_PER_BULK} cheque is required`)
    .max(MAX_CHEQUES_PER_BULK, `Maximum ${MAX_CHEQUES_PER_BULK} cheques allowed`)
    .refine(
      (cheques) => {
        // Check for duplicate cheque numbers
        const numbers = cheques.map(c => c.chequeNumber.toLowerCase());
        return new Set(numbers).size === numbers.length;
      },
      { message: 'Duplicate cheque numbers are not allowed' }
    )
});

export type PDCBulkCreateFormData = z.infer<typeof pdcBulkCreateSchema>;

/**
 * Default values for bulk PDC create form
 */
export const pdcBulkCreateDefaults: Partial<PDCBulkCreateFormData> = {
  tenantId: '',
  leaseId: null,
  cheques: []
};

// ============================================================================
// ACTION SCHEMAS
// ============================================================================

/**
 * Validation schema for depositing PDC
 */
export const pdcDepositSchema = z.object({
  depositDate: pastOrTodayDateSchema,

  bankAccountId: uuidSchema.refine((val) => val.length > 0, {
    message: 'Please select a bank account'
  })
});

export type PDCDepositFormData = z.infer<typeof pdcDepositSchema>;

/**
 * Default values for deposit form
 */
export const pdcDepositDefaults: Partial<PDCDepositFormData> = {
  depositDate: new Date().toISOString().split('T')[0],
  bankAccountId: ''
};

/**
 * Validation schema for clearing PDC
 */
export const pdcClearSchema = z.object({
  clearedDate: pastOrTodayDateSchema
});

export type PDCClearFormData = z.infer<typeof pdcClearSchema>;

/**
 * Default values for clear form
 */
export const pdcClearDefaults: PDCClearFormData = {
  clearedDate: new Date().toISOString().split('T')[0]
};

/**
 * Validation schema for reporting PDC bounce
 */
export const pdcBounceSchema = z.object({
  bouncedDate: pastOrTodayDateSchema,

  bounceReason: z
    .string()
    .min(1, 'Bounce reason is required')
    .max(MAX_REASON_LENGTH, `Reason must be less than ${MAX_REASON_LENGTH} characters`)
    .trim()
});

export type PDCBounceFormData = z.infer<typeof pdcBounceSchema>;

/**
 * Default values for bounce form
 */
export const pdcBounceDefaults: PDCBounceFormData = {
  bouncedDate: new Date().toISOString().split('T')[0],
  bounceReason: ''
};

/**
 * Validation schema for replacing bounced PDC
 */
export const pdcReplaceSchema = z.object({
  newChequeNumber: chequeNumberSchema,
  bankName: bankNameSchema,
  amount: amountSchema,
  chequeDate: futureDateSchema,

  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be less than ${MAX_NOTES_LENGTH} characters`)
    .optional()
    .nullable()
});

export type PDCReplaceFormData = z.infer<typeof pdcReplaceSchema>;

/**
 * Default values for replace form
 */
export const pdcReplaceDefaults: Partial<PDCReplaceFormData> = {
  newChequeNumber: '',
  bankName: '',
  amount: 0,
  chequeDate: '',
  notes: null
};

/**
 * Transaction details schema for bank transfer withdrawal
 */
export const withdrawalTransactionDetailsSchema = z.object({
  amount: amountSchema,
  transactionId: z
    .string()
    .min(1, 'Transaction ID is required')
    .max(MAX_TRANSACTION_ID_LENGTH, `Transaction ID must be less than ${MAX_TRANSACTION_ID_LENGTH} characters`)
    .trim(),
  bankAccountId: uuidSchema
});

export type WithdrawalTransactionDetailsFormData = z.infer<typeof withdrawalTransactionDetailsSchema>;

/**
 * Validation schema for withdrawing PDC
 */
export const pdcWithdrawSchema = z.object({
  withdrawalDate: pastOrTodayDateSchema,

  withdrawalReason: z
    .string()
    .min(1, 'Withdrawal reason is required')
    .max(MAX_REASON_LENGTH, `Reason must be less than ${MAX_REASON_LENGTH} characters`)
    .trim(),

  newPaymentMethod: newPaymentMethodSchema.optional().nullable(),

  transactionDetails: withdrawalTransactionDetailsSchema.optional().nullable()
}).refine(
  (data) => {
    // If payment method is BANK_TRANSFER, transaction details are required
    if (data.newPaymentMethod === NewPaymentMethod.BANK_TRANSFER) {
      return data.transactionDetails !== null && data.transactionDetails !== undefined;
    }
    return true;
  },
  {
    message: 'Transaction details are required for bank transfer',
    path: ['transactionDetails']
  }
);

export type PDCWithdrawFormData = z.infer<typeof pdcWithdrawSchema>;

/**
 * Default values for withdraw form
 */
export const pdcWithdrawDefaults: Partial<PDCWithdrawFormData> = {
  withdrawalDate: new Date().toISOString().split('T')[0],
  withdrawalReason: '',
  newPaymentMethod: null,
  transactionDetails: null
};

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for PDC list filters
 */
export const pdcFilterSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  status: z
    .enum(['ALL', 'RECEIVED', 'DUE', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED', 'REPLACED', 'WITHDRAWN'])
    .optional()
    .default('ALL'),

  tenantId: z
    .string()
    .uuid('Invalid tenant ID')
    .optional()
    .nullable(),

  bankName: z
    .string()
    .max(MAX_BANK_NAME_LENGTH, `Bank name must be less than ${MAX_BANK_NAME_LENGTH} characters`)
    .optional()
    .nullable(),

  leaseId: z
    .string()
    .uuid('Invalid lease ID')
    .optional()
    .nullable(),

  invoiceId: z
    .string()
    .uuid('Invalid invoice ID')
    .optional()
    .nullable(),

  fromDate: z
    .string()
    .optional()
    .nullable(),

  toDate: z
    .string()
    .optional()
    .nullable(),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sortBy: z
    .enum(['chequeNumber', 'tenantName', 'bankName', 'amount', 'chequeDate', 'status', 'createdAt'])
    .optional()
    .default('chequeDate'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('ASC')
});

export type PDCFilterFormData = z.infer<typeof pdcFilterSchema>;

/**
 * Default values for PDC filter form
 */
export const pdcFilterDefaults: PDCFilterFormData = {
  search: '',
  status: 'ALL',
  tenantId: null,
  bankName: null,
  leaseId: null,
  invoiceId: null,
  fromDate: null,
  toDate: null,
  page: 0,
  size: 20,
  sortBy: 'chequeDate',
  sortDirection: 'ASC'
};

/**
 * Validation schema for PDC withdrawal history filters
 */
export const pdcWithdrawalFilterSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  withdrawalReason: z
    .enum(['ALL', 'Cheque Bounced', 'Replacement Requested', 'Early Contract Termination', 'Payment Method Change', 'Tenant Request', 'Other'])
    .optional()
    .default('ALL'),

  fromDate: z
    .string()
    .optional()
    .nullable(),

  toDate: z
    .string()
    .optional()
    .nullable(),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sortBy: z
    .enum(['originalChequeNumber', 'tenantName', 'withdrawalDate', 'amount', 'withdrawalReason'])
    .optional()
    .default('withdrawalDate'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('DESC')
});

export type PDCWithdrawalFilterFormData = z.infer<typeof pdcWithdrawalFilterSchema>;

/**
 * Default values for withdrawal filter form
 */
export const pdcWithdrawalFilterDefaults: PDCWithdrawalFilterFormData = {
  search: '',
  withdrawalReason: 'ALL',
  fromDate: null,
  toDate: null,
  page: 0,
  size: 20,
  sortBy: 'withdrawalDate',
  sortDirection: 'DESC'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

/**
 * Check if a date is in the future (or today)
 */
export function isFutureOrTodayDate(dateStr: string): boolean {
  if (!isValidDateString(dateStr)) return false;
  const parsed = new Date(dateStr);
  parsed.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed >= today;
}

/**
 * Check if a date is in the past or today
 */
export function isPastOrTodayDate(dateStr: string): boolean {
  if (!isValidDateString(dateStr)) return false;
  const parsed = new Date(dateStr);
  parsed.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return parsed <= today;
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Validate cheque number format
 */
export function isValidChequeNumber(chequeNumber: string): boolean {
  if (!chequeNumber) return false;
  if (chequeNumber.length < MIN_CHEQUE_NUMBER_LENGTH) return false;
  if (chequeNumber.length > MAX_CHEQUE_NUMBER_LENGTH) return false;
  return CHEQUE_NUMBER_REGEX.test(chequeNumber);
}

/**
 * Validate date range (fromDate must be before or equal to toDate)
 */
export function validateDateRange(fromDate: string | null, toDate: string | null): boolean {
  if (!fromDate || !toDate) return true;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return from <= to;
}

/**
 * Calculate days until cheque date
 * Returns negative if past, positive if future, 0 if today
 */
export function getDaysUntilDate(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is within due window (7 days from today)
 */
export function isWithinDueWindow(dateStr: string): boolean {
  const days = getDaysUntilDate(dateStr);
  return days >= 0 && days <= 7;
}

/**
 * Format amount as AED currency string
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate total amount from cheque entries
 */
export function calculateTotalChequeAmount(cheques: PDCChequeEntryFormData[]): number {
  return cheques.reduce((sum, cheque) => sum + (cheque.amount || 0), 0);
}

/**
 * Generate default cheque entry
 */
export function getDefaultChequeEntry(): PDCChequeEntryFormData {
  return {
    chequeNumber: '',
    bankName: '',
    amount: 0,
    chequeDate: ''
  };
}

/**
 * Generate multiple default cheque entries
 */
export function generateDefaultChequeEntries(count: number): PDCChequeEntryFormData[] {
  return Array.from({ length: count }, () => getDefaultChequeEntry());
}

// ============================================================================
// VALIDATION CONSTANTS EXPORT
// ============================================================================

export const PDC_VALIDATION_CONSTANTS = {
  MIN_CHEQUE_NUMBER_LENGTH,
  MAX_CHEQUE_NUMBER_LENGTH,
  MAX_BANK_NAME_LENGTH,
  MAX_AMOUNT,
  MIN_AMOUNT,
  MAX_NOTES_LENGTH,
  MAX_REASON_LENGTH,
  MAX_TRANSACTION_ID_LENGTH,
  MAX_CHEQUES_PER_BULK,
  MIN_CHEQUES_PER_BULK,
  CHEQUE_NUMBER_REGEX
} as const;
