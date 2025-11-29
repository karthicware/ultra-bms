/**
 * Expense Management Types and Interfaces
 * Story 6.2: Expense Management and Vendor Payments
 */

// PaymentMethod is imported from tenant types (exported via index.ts)
import { PaymentMethod } from './tenant';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Expense category enum
 * Categories for expense classification
 */
export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  UTILITIES = 'UTILITIES',
  SALARIES = 'SALARIES',
  SUPPLIES = 'SUPPLIES',
  INSURANCE = 'INSURANCE',
  TAXES = 'TAXES',
  OTHER = 'OTHER'
}

/**
 * Payment status enum
 * Tracks payment lifecycle for expenses
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Full expense entity
 * Complete expense information from backend
 */
export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  propertyId?: string;
  propertyName?: string;
  vendorId?: string;
  vendorName?: string;
  vendorCompanyName?: string;
  workOrderId?: string;
  workOrderNumber?: string;
  amount: number;
  expenseDate: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  description: string;
  receiptFilePath?: string;
  receiptUrl?: string;
  recordedBy: string;
  recordedByName?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Expense list item for table view
 * Minimal fields for efficient list rendering
 */
export interface ExpenseListItem {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  propertyName?: string;
  vendorCompanyName?: string;
  workOrderNumber?: string;
  amount: number;
  expenseDate: string;
  paymentStatus: PaymentStatus;
  description: string;
  hasReceipt: boolean;
}

/**
 * Expense detail with additional relations
 * Extended expense info for detail page
 */
export interface ExpenseDetail extends Expense {
  // Additional fields populated on detail view if needed
  vendorEmail?: string;
  vendorPhoneNumber?: string;
  // Computed properties from backend
  editable: boolean;
  canBePaid: boolean;
  receiptFileName?: string;
  transactionReference?: string;
}

/**
 * Vendor expense group for pending payments page
 * Groups expenses by vendor for batch payment
 */
export interface VendorExpenseGroup {
  vendorId: string;
  vendorCompanyName: string;
  vendorEmail: string;
  totalAmount: number;
  expenseCount: number;
  expenses: ExpenseListItem[];
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for creating expense
 */
export interface ExpenseCreateRequest {
  category: ExpenseCategory;
  propertyId?: string;
  vendorId?: string;
  amount: number;
  expenseDate: string;
  description: string;
  receipt?: File;
}

/**
 * Request DTO for updating expense (PENDING only)
 */
export interface ExpenseUpdateRequest {
  category?: ExpenseCategory;
  propertyId?: string;
  vendorId?: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  receipt?: File;
}

/**
 * Request DTO for marking expense as paid
 */
export interface ExpensePayRequest {
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string;
}

/**
 * Request DTO for batch payment processing
 */
export interface BatchPaymentRequest {
  expenseIds: string[];
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string;
}

/**
 * Filter parameters for expense list
 */
export interface ExpenseFilter {
  search?: string;
  category?: ExpenseCategory | ExpenseCategory[] | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  propertyId?: string;
  vendorId?: string;
  workOrderId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from create expense endpoint
 */
export interface CreateExpenseResponse {
  success: boolean;
  message: string;
  data: Expense;
  timestamp: string;
}

/**
 * Response from get expense endpoint
 */
export interface GetExpenseResponse {
  success: boolean;
  message: string;
  data: ExpenseDetail;
  timestamp: string;
}

/**
 * Response from list expenses endpoint
 */
export interface ExpenseListResponse {
  success: boolean;
  message: string;
  data: {
    content: ExpenseListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from mark expense as paid endpoint
 */
export interface ExpensePayResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    paymentStatus: PaymentStatus;
    paymentDate: string;
    paymentMethod: PaymentMethod;
  };
  timestamp: string;
}

/**
 * Batch payment result for a single expense
 */
export interface BatchPaymentResult {
  expenseId: string;
  expenseNumber: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Response from batch payment endpoint
 */
export interface BatchPaymentResponse {
  success: boolean;
  message: string;
  data: {
    processedCount: number;
    failedCount: number;
    results: BatchPaymentResult[];
    paymentSummaryPdfUrl?: string;
  };
  timestamp: string;
}

/**
 * Response from get pending payments endpoint (grouped by vendor)
 */
export interface VendorExpenseGroupsResponse {
  success: boolean;
  message: string;
  data: VendorExpenseGroup[];
  timestamp: string;
}

/**
 * Expense summary statistics
 */
export interface ExpenseSummary {
  totalExpenses: number;
  totalPending: number;
  totalPaid: number;
  expenseCount: number;
  pendingCount: number;
  paidCount: number;
  categoryBreakdown: ExpenseCategoryBreakdown[];
  monthlyTrend: MonthlyExpenseTrend[];
}

/**
 * Category breakdown for pie chart
 */
export interface ExpenseCategoryBreakdown {
  category: string;
  categoryDisplayName: string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Monthly trend data for line chart
 */
export interface MonthlyExpenseTrend {
  year: number;
  month: number;
  monthName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

/**
 * Response from expense summary endpoint
 */
export interface ExpenseSummaryResponse {
  success: boolean;
  message: string;
  data: ExpenseSummary;
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Expense category display information
 */
export interface ExpenseCategoryInfo {
  value: ExpenseCategory;
  label: string;
  color: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'cyan' | 'gray';
  icon: string;
  description: string;
}

/**
 * Expense category options for dropdowns and badges
 */
export const EXPENSE_CATEGORY_OPTIONS: ExpenseCategoryInfo[] = [
  {
    value: ExpenseCategory.MAINTENANCE,
    label: 'Maintenance',
    color: 'purple',
    icon: 'wrench',
    description: 'Maintenance and repair costs'
  },
  {
    value: ExpenseCategory.UTILITIES,
    label: 'Utilities',
    color: 'blue',
    icon: 'zap',
    description: 'Electricity, water, gas bills'
  },
  {
    value: ExpenseCategory.SALARIES,
    label: 'Salaries',
    color: 'green',
    icon: 'users',
    description: 'Staff salaries and wages'
  },
  {
    value: ExpenseCategory.SUPPLIES,
    label: 'Supplies',
    color: 'orange',
    icon: 'package',
    description: 'Office and building supplies'
  },
  {
    value: ExpenseCategory.INSURANCE,
    label: 'Insurance',
    color: 'red',
    icon: 'shield',
    description: 'Insurance premiums'
  },
  {
    value: ExpenseCategory.TAXES,
    label: 'Taxes',
    color: 'cyan',
    icon: 'file-text',
    description: 'Property and other taxes'
  },
  {
    value: ExpenseCategory.OTHER,
    label: 'Other',
    color: 'gray',
    icon: 'more-horizontal',
    description: 'Miscellaneous expenses'
  }
];

/**
 * Payment status display information
 */
export interface PaymentStatusInfo {
  value: PaymentStatus;
  label: string;
  color: 'amber' | 'green';
  icon: string;
  description: string;
}

/**
 * Payment status options for dropdowns and badges
 */
export const PAYMENT_STATUS_OPTIONS: PaymentStatusInfo[] = [
  {
    value: PaymentStatus.PENDING,
    label: 'Pending',
    color: 'amber',
    icon: 'clock',
    description: 'Payment not yet processed'
  },
  {
    value: PaymentStatus.PAID,
    label: 'Paid',
    color: 'green',
    icon: 'check-circle',
    description: 'Payment completed'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category badge color class
 */
export function getExpenseCategoryColor(category: ExpenseCategory): string {
  switch (category) {
    case ExpenseCategory.MAINTENANCE:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case ExpenseCategory.UTILITIES:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case ExpenseCategory.SALARIES:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case ExpenseCategory.SUPPLIES:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case ExpenseCategory.INSURANCE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case ExpenseCategory.TAXES:
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    case ExpenseCategory.OTHER:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get payment status badge color class
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get payment status badge variant for shadcn Badge
 */
export function getPaymentStatusVariant(status: PaymentStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case PaymentStatus.PAID:
      return 'default';
    case PaymentStatus.PENDING:
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get expense category label
 */
export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const option = EXPENSE_CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option?.label ?? category;
}

/**
 * Get payment status label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const option = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label ?? status;
}

/**
 * Check if expense can be edited
 * Only PENDING expenses can be edited
 */
export function canEditExpense(status: PaymentStatus): boolean {
  return status === PaymentStatus.PENDING;
}

/**
 * Check if expense can be marked as paid
 */
export function canMarkAsPaid(status: PaymentStatus): boolean {
  return status === PaymentStatus.PENDING;
}

/**
 * Check if expense can be deleted
 * Only PENDING expenses can be deleted
 */
export function canDeleteExpense(status: PaymentStatus): boolean {
  return status === PaymentStatus.PENDING;
}

/**
 * Format currency as AED for expenses
 */
export function formatExpenseCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// ============================================================================
// LABEL RECORDS FOR DISPLAY
// ============================================================================

/**
 * Expense category labels for display
 */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]: 'Maintenance',
  [ExpenseCategory.UTILITIES]: 'Utilities',
  [ExpenseCategory.SALARIES]: 'Salaries',
  [ExpenseCategory.SUPPLIES]: 'Supplies',
  [ExpenseCategory.INSURANCE]: 'Insurance',
  [ExpenseCategory.TAXES]: 'Taxes',
  [ExpenseCategory.OTHER]: 'Other'
};

/**
 * Payment status labels for display
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PAID]: 'Paid'
};

/**
 * Payment method labels for display
 * Uses PaymentMethod from tenant.ts
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CARD]: 'Card',
  [PaymentMethod.CHEQUE]: 'Cheque',
  [PaymentMethod.PDC]: 'Post-Dated Cheque',
  [PaymentMethod.ONLINE]: 'Online Payment'
};

// PaymentMethod is available from tenant.ts via index.ts
// Use: import { PaymentMethod } from '@/types';
