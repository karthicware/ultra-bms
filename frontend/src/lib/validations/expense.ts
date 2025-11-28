/**
 * Expense Validation Schemas
 * Story 6.2: Expense Management and Vendor Payments
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { ExpenseCategory, PaymentStatus } from '@/types/expense';
import { PaymentMethod } from '@/types/tenant';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const expenseCategorySchema = z.nativeEnum(ExpenseCategory);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
export const paymentMethodSchema = z.nativeEnum(PaymentMethod);

// ============================================================================
// FILE VALIDATION CONSTANTS
// ============================================================================

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_RECEIPT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_RECEIPT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a new expense
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(expenseCreateSchema),
 *   defaultValues: expenseCreateDefaults
 * });
 * ```
 */
export const expenseCreateSchema = z.object({
  // Category Selection
  category: expenseCategorySchema.refine((val) => val !== undefined, {
    message: 'Please select a category'
  }),

  // Optional Property (for property-specific expenses)
  propertyId: z
    .string()
    .uuid('Invalid property ID')
    .optional()
    .nullable(),

  // Optional Vendor (for vendor-related expenses)
  vendorId: z
    .string()
    .uuid('Invalid vendor ID')
    .optional()
    .nullable(),

  // Amount
  amount: z
    .number({ message: 'Amount must be a number' })
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999.99, 'Amount cannot exceed 9,999,999.99'),

  // Expense Date
  expenseDate: z
    .string()
    .min(1, 'Expense date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid expense date')
    .refine((date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'Expense date cannot be in the future'),

  // Description
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must be less than 500 characters')
    .trim()
});

export type ExpenseCreateFormData = z.infer<typeof expenseCreateSchema>;

/**
 * Default values for expense create form
 */
export const expenseCreateDefaults: ExpenseCreateFormData = {
  category: ExpenseCategory.MAINTENANCE,
  propertyId: null,
  vendorId: null,
  amount: 0,
  expenseDate: new Date().toISOString().split('T')[0],
  description: ''
};

/**
 * Validation schema for updating an existing expense (PENDING only)
 */
export const expenseUpdateSchema = z.object({
  category: expenseCategorySchema.optional(),

  propertyId: z
    .string()
    .uuid('Invalid property ID')
    .optional()
    .nullable(),

  vendorId: z
    .string()
    .uuid('Invalid vendor ID')
    .optional()
    .nullable(),

  amount: z
    .number({ message: 'Amount must be a number' })
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999.99, 'Amount cannot exceed 9,999,999.99')
    .optional(),

  expenseDate: z
    .string()
    .min(1, 'Expense date is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid expense date')
    .refine((date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'Expense date cannot be in the future')
    .optional(),

  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
});

export type ExpenseUpdateFormData = z.infer<typeof expenseUpdateSchema>;

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

/**
 * Validation schema for marking expense as paid
 */
export const expensePaySchema = z.object({
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
    .nullable()
});

export type ExpensePayFormData = z.infer<typeof expensePaySchema>;

/**
 * Default values for expense pay form
 */
export const expensePayDefaults: ExpensePayFormData = {
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  paymentDate: new Date().toISOString().split('T')[0],
  transactionReference: null
};

/**
 * Validation schema for batch payment processing
 */
export const batchPaymentSchema = z.object({
  expenseIds: z
    .array(z.string().uuid('Invalid expense ID'))
    .min(1, 'Please select at least one expense'),

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
    .nullable()
});

export type BatchPaymentFormData = z.infer<typeof batchPaymentSchema>;

/**
 * Default values for batch payment form
 */
export const batchPaymentDefaults: BatchPaymentFormData = {
  expenseIds: [],
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  paymentDate: new Date().toISOString().split('T')[0],
  transactionReference: null
};

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for expense list filters
 */
export const expenseFilterSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  category: z
    .enum(['ALL', 'MAINTENANCE', 'UTILITIES', 'SALARIES', 'SUPPLIES', 'INSURANCE', 'TAXES', 'OTHER'])
    .optional()
    .default('ALL'),

  paymentStatus: z
    .enum(['ALL', 'PENDING', 'PAID'])
    .optional()
    .default('ALL'),

  propertyId: z
    .string()
    .uuid('Invalid property ID')
    .optional()
    .nullable(),

  vendorId: z
    .string()
    .uuid('Invalid vendor ID')
    .optional()
    .nullable(),

  workOrderId: z
    .string()
    .uuid('Invalid work order ID')
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
    .enum(['expenseNumber', 'category', 'amount', 'expenseDate', 'paymentStatus', 'createdAt'])
    .optional()
    .default('createdAt'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('DESC')
});

export type ExpenseFilterFormData = z.infer<typeof expenseFilterSchema>;

/**
 * Default values for expense filter form
 */
export const expenseFilterDefaults: ExpenseFilterFormData = {
  search: '',
  category: 'ALL',
  paymentStatus: 'ALL',
  propertyId: null,
  vendorId: null,
  workOrderId: null,
  fromDate: null,
  toDate: null,
  page: 0,
  size: 20,
  sortBy: 'createdAt',
  sortDirection: 'DESC'
};

// ============================================================================
// FILE VALIDATION HELPERS
// ============================================================================

/**
 * Validate receipt file
 * Max 5MB, PDF/JPG/JPEG/PNG only
 */
export function validateReceiptFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_RECEIPT_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_RECEIPT_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const isValidType = ALLOWED_RECEIPT_TYPES.includes(file.type) ||
                      ALLOWED_RECEIPT_EXTENSIONS.includes(fileExtension);

  if (!isValidType) {
    return {
      valid: false,
      error: 'Only PDF, JPG, JPEG, and PNG files are allowed'
    };
  }

  return { valid: true };
}

/**
 * Validate multiple receipt files
 */
export function validateReceiptFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  files.forEach((file, index) => {
    const result = validateReceiptFile(file);
    if (!result.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

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
 * Format amount as AED currency string
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED'
  }).format(amount);
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate total amount from multiple expenses
 */
export function calculateTotalExpenseAmount(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
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
 * Get allowed receipt file extensions as string (for input accept attribute)
 */
export function getReceiptAcceptTypes(): string {
  return ALLOWED_RECEIPT_EXTENSIONS.join(',');
}

/**
 * Get maximum receipt file size in MB
 */
export function getMaxReceiptSizeMB(): number {
  return MAX_RECEIPT_SIZE / (1024 * 1024);
}
