/**
 * Invoice Validation Schemas
 * Story 6.1: Rent Invoicing and Payment Management
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { InvoiceStatus } from '@/types/invoice';
import { PaymentMethod } from '@/types/tenant';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const invoiceStatusSchema = z.nativeEnum(InvoiceStatus);
export const paymentMethodSchema = z.nativeEnum(PaymentMethod);

// ============================================================================
// ADDITIONAL CHARGE SCHEMA
// ============================================================================

/**
 * Schema for additional charge line items
 */
export const additionalChargeSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters')
    .trim(),
  amount: z
    .number({ message: 'Amount must be a number' })
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed 999,999.99')
});

export type AdditionalChargeFormData = z.infer<typeof additionalChargeSchema>;

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a new invoice
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(invoiceCreateSchema),
 *   defaultValues: invoiceCreateDefaults
 * });
 * ```
 */
export const invoiceCreateSchema = z.object({
  // Tenant Selection
  tenantId: z
    .string()
    .min(1, 'Please select a tenant')
    .uuid('Invalid tenant ID'),

  leaseId: z
    .string()
    .uuid('Invalid lease ID')
    .optional()
    .nullable(),

  // Invoice Dates
  invoiceDate: z
    .string()
    .min(1, 'Invoice date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid invoice date'),

  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid due date'),

  // Amounts
  baseRent: z
    .number({ message: 'Base rent must be a number' })
    .min(0, 'Base rent cannot be negative')
    .max(9999999.99, 'Base rent cannot exceed 9,999,999.99'),

  serviceCharges: z
    .number({ message: 'Service charges must be a number' })
    .min(0, 'Service charges cannot be negative')
    .max(999999.99, 'Service charges cannot exceed 999,999.99')
    .optional()
    .default(0),

  parkingFees: z
    .number({ message: 'Parking fees must be a number' })
    .min(0, 'Parking fees cannot be negative')
    .max(99999.99, 'Parking fees cannot exceed 99,999.99')
    .optional()
    .default(0),

  additionalCharges: z
    .array(additionalChargeSchema)
    .optional()
    .default([]),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable()
}).refine(
  (data) => {
    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = new Date(data.dueDate);
    return dueDate >= invoiceDate;
  },
  {
    message: 'Due date must be on or after invoice date',
    path: ['dueDate']
  }
);

export type InvoiceCreateFormData = z.infer<typeof invoiceCreateSchema>;

/**
 * Default values for invoice create form
 */
export const invoiceCreateDefaults: InvoiceCreateFormData = {
  tenantId: '',
  leaseId: null,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  baseRent: 0,
  serviceCharges: 0,
  parkingFees: 0,
  additionalCharges: [],
  notes: null
};

/**
 * Validation schema for updating an existing invoice (DRAFT only)
 */
export const invoiceUpdateSchema = z.object({
  invoiceDate: z
    .string()
    .min(1, 'Invoice date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid invoice date')
    .optional(),

  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid due date')
    .optional(),

  baseRent: z
    .number({ message: 'Base rent must be a number' })
    .min(0, 'Base rent cannot be negative')
    .max(9999999.99, 'Base rent cannot exceed 9,999,999.99')
    .optional(),

  serviceCharges: z
    .number({ message: 'Service charges must be a number' })
    .min(0, 'Service charges cannot be negative')
    .max(999999.99, 'Service charges cannot exceed 999,999.99')
    .optional(),

  parkingFees: z
    .number({ message: 'Parking fees must be a number' })
    .min(0, 'Parking fees cannot be negative')
    .max(99999.99, 'Parking fees cannot exceed 99,999.99')
    .optional(),

  additionalCharges: z
    .array(additionalChargeSchema)
    .optional(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable()
});

export type InvoiceUpdateFormData = z.infer<typeof invoiceUpdateSchema>;

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

/**
 * Validation schema for recording a payment
 */
export const paymentCreateSchema = z.object({
  amount: z
    .number({ message: 'Amount must be a number' })
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999.99, 'Amount cannot exceed 9,999,999.99'),

  paymentMethod: paymentMethodSchema.refine((val) => val !== undefined, {
    message: 'Please select a payment method'
  }),

  paymentDate: z
    .string()
    .min(1, 'Payment date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid payment date')
    .refine((date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'Payment date cannot be in the future'),

  transactionReference: z
    .string()
    .max(100, 'Transaction reference must be less than 100 characters')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable()
});

export type PaymentCreateFormData = z.infer<typeof paymentCreateSchema>;

/**
 * Default values for payment form
 */
export const paymentCreateDefaults: PaymentCreateFormData = {
  amount: 0,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  paymentDate: new Date().toISOString().split('T')[0],
  transactionReference: null,
  notes: null
};

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for invoice list filters
 */
export const invoiceFilterSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  status: z
    .enum(['ALL', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'])
    .optional()
    .default('ALL'),

  propertyId: z
    .string()
    .uuid('Invalid property ID')
    .optional()
    .nullable(),

  tenantId: z
    .string()
    .uuid('Invalid tenant ID')
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

  overdueOnly: z
    .boolean()
    .optional()
    .default(false),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sortBy: z
    .enum(['invoiceNumber', 'tenantName', 'totalAmount', 'dueDate', 'status', 'createdAt'])
    .optional()
    .default('createdAt'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('DESC')
});

export type InvoiceFilterFormData = z.infer<typeof invoiceFilterSchema>;

/**
 * Default values for invoice filter form
 */
export const invoiceFilterDefaults: InvoiceFilterFormData = {
  search: '',
  status: 'ALL',
  propertyId: null,
  tenantId: null,
  fromDate: null,
  toDate: null,
  overdueOnly: false,
  page: 0,
  size: 20,
  sortBy: 'createdAt',
  sortDirection: 'DESC'
};

/**
 * Validation schema for payment list filters
 */
export const paymentFilterSchema = z.object({
  invoiceId: z
    .string()
    .uuid('Invalid invoice ID')
    .optional()
    .nullable(),

  tenantId: z
    .string()
    .uuid('Invalid tenant ID')
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

  paymentMethod: z
    .enum(['ALL', 'CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'PDC'])
    .optional()
    .default('ALL'),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sortBy: z
    .enum(['paymentNumber', 'amount', 'paymentDate', 'paymentMethod'])
    .optional()
    .default('paymentDate'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('DESC')
});

export type PaymentFilterFormData = z.infer<typeof paymentFilterSchema>;

/**
 * Default values for payment filter form
 */
export const paymentFilterDefaults: PaymentFilterFormData = {
  invoiceId: null,
  tenantId: null,
  fromDate: null,
  toDate: null,
  paymentMethod: 'ALL',
  page: 0,
  size: 20,
  sortBy: 'paymentDate',
  sortDirection: 'DESC'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total amount from invoice form data
 */
export function calculateInvoiceTotal(data: {
  baseRent: number;
  serviceCharges?: number;
  parkingFees?: number;
  additionalCharges?: Array<{ amount: number }>;
}): number {
  const additional = data.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) ?? 0;
  return data.baseRent + (data.serviceCharges ?? 0) + (data.parkingFees ?? 0) + additional;
}

/**
 * Validate payment amount doesn't exceed balance
 */
export function createPaymentSchemaWithMaxAmount(balanceAmount: number) {
  return paymentCreateSchema.refine(
    (data) => data.amount <= balanceAmount,
    {
      message: `Amount cannot exceed the outstanding balance of ${formatAmount(balanceAmount)}`,
      path: ['amount']
    }
  );
}

/**
 * Format amount as AED currency string
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED'
  }).format(amount);
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

/**
 * Get next month's first day as due date
 */
export function getDefaultDueDate(): string {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}
