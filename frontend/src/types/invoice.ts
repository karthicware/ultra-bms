/**
 * Invoice and Payment Management Types and Interfaces
 * Story 6.1: Rent Invoicing and Payment Management
 */

// PaymentMethod is imported from tenant types (exported via index.ts)
import { PaymentMethod } from './tenant';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Invoice status enum
 * Tracks invoice lifecycle from creation to completion
 */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Additional charge line item
 * For custom charges beyond base rent
 */
export interface AdditionalCharge {
  description: string;
  amount: number;
}

/**
 * Full invoice entity
 * Complete invoice information from backend
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  leaseId?: string;
  invoiceDate: string;
  dueDate: string;
  baseRent: number;
  serviceCharges: number;
  parkingFees: number;
  additionalCharges: AdditionalCharge[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  sentAt?: string;
  paidAt?: string;
  lateFeeApplied: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice list item for table view
 * Minimal fields for efficient list rendering
 */
export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  unitNumber: string;
  propertyName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  isOverdue: boolean;
}

/**
 * Invoice detail with payment history
 * Extended invoice info for detail page
 */
export interface InvoiceDetail extends Invoice {
  payments: Payment[];
}

/**
 * Payment entity
 * Records a payment against an invoice
 */
export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string;
  notes?: string;
  receiptFilePath?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

/**
 * Payment list item for table view
 */
export interface PaymentListItem {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  tenantName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * Request DTO for creating invoice
 */
export interface InvoiceCreateRequest {
  tenantId: string;
  leaseId?: string;
  invoiceDate: string;
  dueDate: string;
  baseRent: number;
  serviceCharges?: number;
  parkingFees?: number;
  additionalCharges?: AdditionalCharge[];
  notes?: string;
}

/**
 * Request DTO for updating invoice (DRAFT only)
 */
export interface InvoiceUpdateRequest {
  invoiceDate?: string;
  dueDate?: string;
  baseRent?: number;
  serviceCharges?: number;
  parkingFees?: number;
  additionalCharges?: AdditionalCharge[];
  notes?: string;
}

/**
 * Request DTO for recording payment
 */
export interface PaymentCreateRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference?: string;
  notes?: string;
}

/**
 * Filter parameters for invoice list
 */
export interface InvoiceFilter {
  search?: string;
  status?: InvoiceStatus | InvoiceStatus[] | 'ALL';
  propertyId?: string;
  tenantId?: string;
  fromDate?: string;
  toDate?: string;
  overdueOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Filter parameters for payment list
 */
export interface PaymentFilter {
  invoiceId?: string;
  tenantId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod | 'ALL';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from create invoice endpoint
 */
export interface CreateInvoiceResponse {
  success: boolean;
  message: string;
  data: Invoice;
  timestamp: string;
}

/**
 * Response from get invoice endpoint
 */
export interface GetInvoiceResponse {
  success: boolean;
  message: string;
  data: InvoiceDetail;
  timestamp: string;
}

/**
 * Response from list invoices endpoint
 */
export interface InvoiceListResponse {
  success: boolean;
  message: string;
  data: {
    content: InvoiceListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from send invoice endpoint
 */
export interface SendInvoiceResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    sentAt: string;
    status: InvoiceStatus;
  };
  timestamp: string;
}

/**
 * Response from record payment endpoint
 */
export interface RecordPaymentResponse {
  success: boolean;
  message: string;
  data: Payment;
  timestamp: string;
}

/**
 * Response from list payments endpoint
 */
export interface PaymentListResponse {
  success: boolean;
  message: string;
  data: {
    content: PaymentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Response from get tenant invoices endpoint
 */
export interface TenantInvoicesResponse {
  success: boolean;
  message: string;
  data: {
    content: InvoiceListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

/**
 * Invoice summary for dashboard
 */
export interface InvoiceSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
}

/**
 * Response from invoice summary endpoint
 */
export interface InvoiceSummaryResponse {
  success: boolean;
  message: string;
  data: InvoiceSummary;
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Invoice status display information
 */
export interface InvoiceStatusInfo {
  value: InvoiceStatus;
  label: string;
  color: 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'slate';
  icon: string;
  description: string;
}

/**
 * Invoice status options for dropdowns and badges
 */
export const INVOICE_STATUS_OPTIONS: InvoiceStatusInfo[] = [
  {
    value: InvoiceStatus.DRAFT,
    label: 'Draft',
    color: 'gray',
    icon: 'file-edit',
    description: 'Invoice created but not yet sent'
  },
  {
    value: InvoiceStatus.SENT,
    label: 'Sent',
    color: 'blue',
    icon: 'send',
    description: 'Invoice sent to tenant'
  },
  {
    value: InvoiceStatus.PARTIALLY_PAID,
    label: 'Partially Paid',
    color: 'amber',
    icon: 'clock',
    description: 'Partial payment received'
  },
  {
    value: InvoiceStatus.PAID,
    label: 'Paid',
    color: 'green',
    icon: 'check-circle',
    description: 'Invoice fully paid'
  },
  {
    value: InvoiceStatus.OVERDUE,
    label: 'Overdue',
    color: 'red',
    icon: 'alert-circle',
    description: 'Payment past due date'
  },
  {
    value: InvoiceStatus.CANCELLED,
    label: 'Cancelled',
    color: 'slate',
    icon: 'x-circle',
    description: 'Invoice cancelled'
  }
];

/**
 * Payment method display information
 */
export interface PaymentMethodInfo {
  value: PaymentMethod;
  label: string;
  icon: string;
}

/**
 * Payment method options for dropdown
 */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodInfo[] = [
  { value: PaymentMethod.CASH, label: 'Cash', icon: 'banknote' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: 'landmark' },
  { value: PaymentMethod.CARD, label: 'Card', icon: 'credit-card' },
  { value: PaymentMethod.CHEQUE, label: 'Cheque', icon: 'file-text' },
  { value: PaymentMethod.PDC, label: 'Post-Dated Cheque', icon: 'calendar' }
];

/**
 * Get status badge color class
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.DRAFT:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case InvoiceStatus.SENT:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case InvoiceStatus.PARTIALLY_PAID:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case InvoiceStatus.PAID:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case InvoiceStatus.OVERDUE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case InvoiceStatus.CANCELLED:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status badge variant for shadcn Badge
 */
export function getInvoiceStatusVariant(status: InvoiceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case InvoiceStatus.PAID:
      return 'default';
    case InvoiceStatus.OVERDUE:
      return 'destructive';
    case InvoiceStatus.CANCELLED:
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const option = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method);
  return option?.label ?? method;
}

/**
 * Get invoice status label
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const option = INVOICE_STATUS_OPTIONS.find(opt => opt.value === status);
  return option?.label ?? status;
}

/**
 * Check if invoice can be edited
 */
export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.DRAFT;
}

/**
 * Check if invoice can receive payment
 */
export function canRecordPayment(status: InvoiceStatus): boolean {
  return [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE].includes(status);
}

/**
 * Check if invoice can be cancelled
 */
export function canCancelInvoice(status: InvoiceStatus, paidAmount: number): boolean {
  return status === InvoiceStatus.DRAFT || (status === InvoiceStatus.SENT && paidAmount === 0);
}

/**
 * Check if invoice can be sent
 */
export function canSendInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.DRAFT;
}

/**
 * Format currency as AED
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
