/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Invoice and Payment API Service
 * Story 6.1: Rent Invoicing and Payment Management
 *
 * All invoice and payment-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  Invoice,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceFilter,
  InvoiceStatus,
  InvoiceCreateRequest,
  InvoiceUpdateRequest,
  CreateInvoiceResponse,
  GetInvoiceResponse,
  InvoiceListResponse,
  SendInvoiceResponse,
  Payment,
  PaymentListItem,
  PaymentFilter,
  PaymentCreateRequest,
  RecordPaymentResponse,
  PaymentListResponse,
  TenantInvoicesResponse,
  InvoiceSummary,
  InvoiceSummaryResponse
} from '@/types/invoice';

const INVOICES_BASE_PATH = '/v1/invoices';
const PAYMENTS_BASE_PATH = '/v1/payments';

// ============================================================================
// CREATE INVOICE
// ============================================================================

/**
 * Create a new invoice
 *
 * @param data - Invoice creation data (tenant, amounts, dates, etc.)
 *
 * @returns Promise that resolves to the created Invoice with invoiceNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When tenant not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const invoice = await createInvoice({
 *   tenantId: '550e8400-e29b-41d4-a716-446655440000',
 *   invoiceDate: '2024-01-01',
 *   dueDate: '2024-01-31',
 *   baseRent: 5000.00,
 *   serviceCharges: 500.00,
 *   parkingFees: 300.00
 * });
 *
 * console.log(invoice.invoiceNumber); // "INV-2024-0001"
 * console.log(invoice.status); // "DRAFT"
 * ```
 */
export async function createInvoice(data: InvoiceCreateRequest): Promise<Invoice> {
  const response = await apiClient.post<CreateInvoiceResponse>(
    INVOICES_BASE_PATH,
    data
  );
  return response.data.data;
}

// ============================================================================
// LIST INVOICES
// ============================================================================

/**
 * Get paginated list of invoices with filters
 *
 * @param filters - Optional filters (status, property, tenant, date range, etc.)
 *
 * @returns Promise that resolves to paginated list of InvoiceListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get all overdue invoices
 * const response = await getInvoices({
 *   status: 'OVERDUE',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Filter by property and date range
 * const filtered = await getInvoices({
 *   propertyId: propertyUuid,
 *   fromDate: '2024-01-01',
 *   toDate: '2024-12-31',
 *   sortBy: 'dueDate',
 *   sortDirection: 'ASC'
 * });
 * ```
 */
export async function getInvoices(filters?: InvoiceFilter): Promise<InvoiceListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'createdAt',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  // Add filters if provided
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.status && filters.status !== 'ALL') {
    if (Array.isArray(filters.status)) {
      params.status = filters.status.join(',');
    } else {
      params.status = filters.status;
    }
  }
  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.tenantId) {
    params.tenantId = filters.tenantId;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }
  if (filters?.overdueOnly) {
    params.overdueOnly = filters.overdueOnly;
  }

  const response = await apiClient.get<InvoiceListResponse>(
    INVOICES_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET INVOICE BY ID
// ============================================================================

/**
 * Get invoice details by ID including payment history
 *
 * @param id - Invoice UUID
 *
 * @returns Promise that resolves to full InvoiceDetail including payments
 *
 * @throws {EntityNotFoundException} When invoice not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const invoice = await getInvoiceById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(invoice.invoiceNumber);
 * console.log(invoice.totalAmount);
 * console.log(invoice.payments.length);
 * ```
 */
export async function getInvoiceById(id: string): Promise<InvoiceDetail> {
  const response = await apiClient.get<GetInvoiceResponse>(`${INVOICES_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// UPDATE INVOICE (DRAFT ONLY)
// ============================================================================

/**
 * Update invoice details (only for DRAFT invoices)
 *
 * @param id - Invoice UUID
 * @param data - Updated invoice data
 *
 * @returns Promise that resolves to updated Invoice
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {InvalidStatusException} When invoice is not in DRAFT status (400)
 * @throws {EntityNotFoundException} When invoice not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await updateInvoice(invoiceId, {
 *   baseRent: 5500.00,
 *   dueDate: '2024-02-15'
 * });
 * ```
 */
export async function updateInvoice(id: string, data: InvoiceUpdateRequest): Promise<Invoice> {
  const response = await apiClient.put<CreateInvoiceResponse>(
    `${INVOICES_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// SEND INVOICE
// ============================================================================

/**
 * Send invoice to tenant via email
 *
 * @param id - Invoice UUID
 *
 * @returns Promise that resolves to send response with sentAt timestamp
 *
 * @throws {InvalidStatusException} When invoice is not in DRAFT status (400)
 * @throws {EntityNotFoundException} When invoice not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const result = await sendInvoice(invoiceId);
 * console.log(result.data.sentAt); // "2024-01-15T10:30:00Z"
 * console.log(result.data.status); // "SENT"
 * ```
 */
export async function sendInvoice(id: string): Promise<SendInvoiceResponse> {
  const response = await apiClient.post<SendInvoiceResponse>(
    `${INVOICES_BASE_PATH}/${id}/send`
  );
  return response.data;
}

// ============================================================================
// CANCEL INVOICE
// ============================================================================

/**
 * Cancel an invoice
 *
 * @param id - Invoice UUID
 *
 * @returns Promise that resolves when cancellation succeeds
 *
 * @throws {InvalidStatusException} When invoice has payments or is already cancelled (400)
 * @throws {EntityNotFoundException} When invoice not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await cancelInvoice(invoiceId);
 * console.log('Invoice cancelled successfully');
 * ```
 */
export async function cancelInvoice(id: string): Promise<void> {
  await apiClient.post(`${INVOICES_BASE_PATH}/${id}/cancel`);
}

// ============================================================================
// RECORD PAYMENT
// ============================================================================

/**
 * Record a payment against an invoice
 *
 * @param invoiceId - Invoice UUID
 * @param data - Payment data (amount, method, date, etc.)
 *
 * @returns Promise that resolves to created Payment with paymentNumber
 *
 * @throws {ValidationException} When validation fails or amount exceeds balance (400)
 * @throws {InvalidStatusException} When invoice cannot receive payments (400)
 * @throws {EntityNotFoundException} When invoice not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const payment = await recordPayment(invoiceId, {
 *   amount: 2500.00,
 *   paymentMethod: 'BANK_TRANSFER',
 *   paymentDate: '2024-01-15',
 *   transactionReference: 'TXN-12345'
 * });
 *
 * console.log(payment.paymentNumber); // "PMT-2024-0001"
 * ```
 */
export async function recordPayment(
  invoiceId: string,
  data: PaymentCreateRequest
): Promise<Payment> {
  const response = await apiClient.post<RecordPaymentResponse>(
    `${INVOICES_BASE_PATH}/${invoiceId}/payments`,
    data
  );
  return response.data.data;
}

// ============================================================================
// GET INVOICE PAYMENTS
// ============================================================================

/**
 * Get payments for a specific invoice
 *
 * @param invoiceId - Invoice UUID
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 10
 *
 * @returns Promise that resolves to paginated list of payments
 *
 * @example
 * ```typescript
 * const payments = await getInvoicePayments(invoiceId, 0, 10);
 * payments.data.content.forEach(p => {
 *   console.log(`${p.paymentNumber}: ${p.amount} - ${p.paymentMethod}`);
 * });
 * ```
 */
export async function getInvoicePayments(
  invoiceId: string,
  page: number = 0,
  size: number = 10
): Promise<PaymentListResponse> {
  const response = await apiClient.get<PaymentListResponse>(
    `${INVOICES_BASE_PATH}/${invoiceId}/payments`,
    { params: { page, size } }
  );
  return response.data;
}

// ============================================================================
// GET ALL PAYMENTS (WITH FILTERS)
// ============================================================================

/**
 * Get paginated list of all payments with filters
 *
 * @param filters - Optional filters (invoice, tenant, date range, method)
 *
 * @returns Promise that resolves to paginated list of PaymentListItem
 *
 * @example
 * ```typescript
 * const response = await getPayments({
 *   tenantId: tenantUuid,
 *   fromDate: '2024-01-01',
 *   toDate: '2024-12-31',
 *   paymentMethod: 'BANK_TRANSFER'
 * });
 * ```
 */
export async function getPayments(filters?: PaymentFilter): Promise<PaymentListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'paymentDate',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  if (filters?.invoiceId) {
    params.invoiceId = filters.invoiceId;
  }
  if (filters?.tenantId) {
    params.tenantId = filters.tenantId;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }
  if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') {
    params.paymentMethod = filters.paymentMethod;
  }

  const response = await apiClient.get<PaymentListResponse>(
    PAYMENTS_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET PAYMENT BY ID
// ============================================================================

/**
 * Get payment details by ID
 *
 * @param id - Payment UUID
 *
 * @returns Promise that resolves to Payment details
 *
 * @throws {EntityNotFoundException} When payment not found (404)
 *
 * @example
 * ```typescript
 * const payment = await getPaymentById(paymentId);
 * console.log(payment.paymentNumber);
 * console.log(payment.amount);
 * ```
 */
export async function getPaymentById(id: string): Promise<Payment> {
  const response = await apiClient.get<RecordPaymentResponse>(`${PAYMENTS_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// DOWNLOAD PAYMENT RECEIPT
// ============================================================================

/**
 * Download payment receipt PDF
 *
 * @param paymentId - Payment UUID
 *
 * @returns Promise that resolves to Blob containing PDF
 *
 * @throws {EntityNotFoundException} When payment not found (404)
 *
 * @example
 * ```typescript
 * const blob = await downloadPaymentReceipt(paymentId);
 * const url = URL.createObjectURL(blob);
 * window.open(url, '_blank');
 * ```
 */
export async function downloadPaymentReceipt(paymentId: string): Promise<Blob> {
  const response = await apiClient.get(`${PAYMENTS_BASE_PATH}/${paymentId}/receipt`, {
    responseType: 'blob'
  });
  return response.data;
}

// ============================================================================
// GET TENANT INVOICES (TENANT PORTAL)
// ============================================================================

/**
 * Get invoices for current tenant (tenant portal)
 *
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 10
 * @param status - Optional status filter
 *
 * @returns Promise that resolves to paginated list of tenant's invoices
 *
 * @example
 * ```typescript
 * // Get all invoices for current tenant
 * const invoices = await getTenantInvoices();
 *
 * // Get only overdue invoices
 * const overdue = await getTenantInvoices(0, 10, 'OVERDUE');
 * ```
 */
export async function getTenantInvoices(
  page: number = 0,
  size: number = 10,
  status?: InvoiceStatus
): Promise<TenantInvoicesResponse> {
  const params: Record<string, any> = { page, size };
  if (status) {
    params.status = status;
  }

  const response = await apiClient.get<TenantInvoicesResponse>(
    '/v1/tenant-portal/invoices',
    { params }
  );
  return response.data;
}

// ============================================================================
// GET TENANT INVOICE DETAIL (TENANT PORTAL)
// ============================================================================

/**
 * Get invoice detail for current tenant (tenant portal)
 *
 * @param id - Invoice UUID
 *
 * @returns Promise that resolves to InvoiceDetail
 *
 * @throws {EntityNotFoundException} When invoice not found or doesn't belong to tenant (404)
 *
 * @example
 * ```typescript
 * const invoice = await getTenantInvoiceById(invoiceId);
 * console.log(invoice.totalAmount);
 * ```
 */
export async function getTenantInvoiceById(id: string): Promise<InvoiceDetail> {
  const response = await apiClient.get<GetInvoiceResponse>(
    `/v1/tenant-portal/invoices/${id}`
  );
  return response.data.data;
}

// ============================================================================
// DOWNLOAD INVOICE PDF (TENANT PORTAL)
// ============================================================================

/**
 * Download invoice PDF (accessible by tenant)
 *
 * @param invoiceId - Invoice UUID
 *
 * @returns Promise that resolves to Blob containing PDF
 *
 * @throws {EntityNotFoundException} When invoice not found or doesn't belong to tenant (404)
 *
 * @example
 * ```typescript
 * const blob = await downloadInvoicePdf(invoiceId);
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `invoice-${invoiceNumber}.pdf`;
 * a.click();
 * ```
 */
export async function downloadInvoicePdf(invoiceId: string): Promise<Blob> {
  const response = await apiClient.get(`${INVOICES_BASE_PATH}/${invoiceId}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
}

// ============================================================================
// INVOICE SUMMARY (DASHBOARD)
// ============================================================================

/**
 * Get invoice summary for dashboard
 *
 * @param propertyId - Optional property UUID to filter by
 *
 * @returns Promise that resolves to InvoiceSummary
 *
 * @example
 * ```typescript
 * const summary = await getInvoiceSummary();
 * console.log(`Total Invoiced: ${summary.totalInvoiced}`);
 * console.log(`Total Collected: ${summary.totalCollected}`);
 * console.log(`Collection Rate: ${summary.collectionRate}%`);
 * ```
 */
export async function getInvoiceSummary(propertyId?: string): Promise<InvoiceSummary> {
  const params: Record<string, any> = {};
  if (propertyId) {
    params.propertyId = propertyId;
  }

  const response = await apiClient.get<InvoiceSummaryResponse>(
    `${INVOICES_BASE_PATH}/summary`,
    { params }
  );
  return response.data.data;
}

// ============================================================================
// APPLY LATE FEE
// ============================================================================

/**
 * Manually apply late fee to overdue invoice
 *
 * @param invoiceId - Invoice UUID
 * @param amount - Late fee amount
 *
 * @returns Promise that resolves to updated Invoice
 *
 * @throws {InvalidStatusException} When invoice is not overdue (400)
 * @throws {EntityNotFoundException} When invoice not found (404)
 *
 * @example
 * ```typescript
 * const updated = await applyLateFee(invoiceId, 250.00);
 * console.log(updated.lateFeeApplied); // true
 * ```
 */
export async function applyLateFee(invoiceId: string, amount: number): Promise<Invoice> {
  const response = await apiClient.post<CreateInvoiceResponse>(
    `${INVOICES_BASE_PATH}/${invoiceId}/late-fee`,
    { amount }
  );
  return response.data.data;
}

// ============================================================================
// RESEND INVOICE EMAIL
// ============================================================================

/**
 * Resend invoice email to tenant
 *
 * @param invoiceId - Invoice UUID
 *
 * @returns Promise that resolves when email is sent
 *
 * @throws {InvalidStatusException} When invoice is in DRAFT or CANCELLED status (400)
 * @throws {EntityNotFoundException} When invoice not found (404)
 *
 * @example
 * ```typescript
 * await resendInvoiceEmail(invoiceId);
 * console.log('Invoice email resent successfully');
 * ```
 */
export async function resendInvoiceEmail(invoiceId: string): Promise<void> {
  await apiClient.post(`${INVOICES_BASE_PATH}/${invoiceId}/resend`);
}

// ============================================================================
// INVOICE SERVICE OBJECT (Alternative export pattern)
// ============================================================================

/**
 * Invoice service object with all methods
 * Allows both named imports and object-style access
 */
export const invoiceService = {
  // Invoice operations
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  sendInvoice,
  cancelInvoice,
  downloadInvoicePdf,
  getInvoiceSummary,
  applyLateFee,
  resendInvoiceEmail,

  // Payment operations
  recordPayment,
  getInvoicePayments,
  getPayments,
  getPaymentById,
  downloadPaymentReceipt,

  // Tenant portal operations
  getTenantInvoices,
  getTenantInvoiceById
};
