/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Expense Management API Service
 * Story 6.2: Expense Management and Vendor Payments
 *
 * All expense and vendor payment-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  Expense,
  ExpenseDetail,
  ExpenseListItem,
  ExpenseFilter,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpensePayRequest,
  BatchPaymentRequest,
  CreateExpenseResponse,
  GetExpenseResponse,
  ExpenseListResponse,
  ExpensePayResponse,
  BatchPaymentResponse,
  VendorExpenseGroup,
  VendorExpenseGroupsResponse,
  ExpenseSummary,
  ExpenseSummaryResponse
} from '@/types/expense';

const EXPENSES_BASE_PATH = '/v1/expenses';

// ============================================================================
// CREATE EXPENSE
// ============================================================================

/**
 * Create a new expense with optional receipt upload
 *
 * @param data - Expense creation data (category, amount, date, description)
 * @param receiptFile - Optional receipt file (PDF/JPG/PNG, max 5MB)
 *
 * @returns Promise that resolves to the created Expense with expenseNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When property/vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const expense = await createExpense({
 *   category: 'MAINTENANCE',
 *   amount: 500.00,
 *   expenseDate: '2024-01-15',
 *   description: 'Plumbing repair work',
 *   vendorId: '550e8400-e29b-41d4-a716-446655440000'
 * }, receiptFile);
 *
 * console.log(expense.expenseNumber); // "EXP-2024-0001"
 * console.log(expense.paymentStatus); // "PENDING"
 * ```
 */
export async function createExpense(
  data: ExpenseCreateRequest,
  receiptFile?: File
): Promise<Expense> {
  const formData = new FormData();

  // Append expense data as JSON
  formData.append('expense', new Blob([JSON.stringify({
    category: data.category,
    propertyId: data.propertyId,
    vendorId: data.vendorId,
    amount: data.amount,
    expenseDate: data.expenseDate,
    description: data.description
  })], { type: 'application/json' }));

  // Append receipt file if provided
  if (receiptFile) {
    formData.append('receipt', receiptFile);
  }

  const response = await apiClient.post<CreateExpenseResponse>(
    EXPENSES_BASE_PATH,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// LIST EXPENSES
// ============================================================================

/**
 * Get paginated list of expenses with filters
 *
 * @param filters - Optional filters (category, status, property, vendor, date range)
 *
 * @returns Promise that resolves to paginated list of ExpenseListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get all pending expenses
 * const response = await getExpenses({
 *   paymentStatus: 'PENDING',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Filter by category and date range
 * const filtered = await getExpenses({
 *   category: 'MAINTENANCE',
 *   fromDate: '2024-01-01',
 *   toDate: '2024-12-31',
 *   sortBy: 'expenseDate',
 *   sortDirection: 'DESC'
 * });
 * ```
 */
export async function getExpenses(filters?: ExpenseFilter): Promise<ExpenseListResponse> {
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
  if (filters?.category && filters.category !== 'ALL') {
    if (Array.isArray(filters.category)) {
      params.category = filters.category.join(',');
    } else {
      params.category = filters.category;
    }
  }
  if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
    params.paymentStatus = filters.paymentStatus;
  }
  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.vendorId) {
    params.vendorId = filters.vendorId;
  }
  if (filters?.workOrderId) {
    params.workOrderId = filters.workOrderId;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }

  const response = await apiClient.get<ExpenseListResponse>(
    EXPENSES_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET EXPENSE BY ID
// ============================================================================

/**
 * Get expense details by ID
 *
 * @param id - Expense UUID
 *
 * @returns Promise that resolves to full ExpenseDetail
 *
 * @throws {EntityNotFoundException} When expense not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const expense = await getExpenseById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(expense.expenseNumber);
 * console.log(expense.amount);
 * ```
 */
export async function getExpenseById(id: string): Promise<ExpenseDetail> {
  const response = await apiClient.get<GetExpenseResponse>(`${EXPENSES_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// UPDATE EXPENSE (PENDING ONLY)
// ============================================================================

/**
 * Update expense details (only for PENDING expenses)
 *
 * @param id - Expense UUID
 * @param data - Updated expense data
 * @param receiptFile - Optional new receipt file
 *
 * @returns Promise that resolves to updated Expense
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {InvalidStatusException} When expense is not in PENDING status (400)
 * @throws {EntityNotFoundException} When expense not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await updateExpense(expenseId, {
 *   amount: 600.00,
 *   description: 'Updated plumbing repair'
 * });
 * ```
 */
export async function updateExpense(
  id: string,
  data: ExpenseUpdateRequest,
  receiptFile?: File
): Promise<Expense> {
  const formData = new FormData();

  // Append expense data as JSON
  const expenseData: Record<string, any> = {};
  if (data.category !== undefined) expenseData.category = data.category;
  if (data.propertyId !== undefined) expenseData.propertyId = data.propertyId;
  if (data.vendorId !== undefined) expenseData.vendorId = data.vendorId;
  if (data.amount !== undefined) expenseData.amount = data.amount;
  if (data.expenseDate !== undefined) expenseData.expenseDate = data.expenseDate;
  if (data.description !== undefined) expenseData.description = data.description;

  formData.append('expense', new Blob([JSON.stringify(expenseData)], { type: 'application/json' }));

  // Append receipt file if provided
  if (receiptFile) {
    formData.append('receipt', receiptFile);
  }

  const response = await apiClient.put<CreateExpenseResponse>(
    `${EXPENSES_BASE_PATH}/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// MARK EXPENSE AS PAID
// ============================================================================

/**
 * Mark expense as paid
 *
 * @param id - Expense UUID
 * @param data - Payment details (method, date, reference)
 *
 * @returns Promise that resolves to payment confirmation
 *
 * @throws {InvalidStatusException} When expense is not in PENDING status (400)
 * @throws {EntityNotFoundException} When expense not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const result = await markExpenseAsPaid(expenseId, {
 *   paymentMethod: 'BANK_TRANSFER',
 *   paymentDate: '2024-01-20',
 *   transactionReference: 'TXN-12345'
 * });
 *
 * console.log(result.data.paymentStatus); // "PAID"
 * ```
 */
export async function markExpenseAsPaid(
  id: string,
  data: ExpensePayRequest
): Promise<ExpensePayResponse> {
  const response = await apiClient.patch<ExpensePayResponse>(
    `${EXPENSES_BASE_PATH}/${id}/pay`,
    data
  );
  return response.data;
}

// ============================================================================
// BATCH PAYMENT
// ============================================================================

/**
 * Process batch payment for multiple expenses
 *
 * @param data - Batch payment request (expense IDs, payment method, date)
 *
 * @returns Promise that resolves to batch payment results
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const result = await processBatchPayment({
 *   expenseIds: [expenseId1, expenseId2, expenseId3],
 *   paymentMethod: 'BANK_TRANSFER',
 *   paymentDate: '2024-01-20',
 *   transactionReference: 'BATCH-TXN-001'
 * });
 *
 * console.log(`Processed: ${result.data.processedCount}`);
 * console.log(`Failed: ${result.data.failedCount}`);
 * if (result.data.paymentSummaryPdfUrl) {
 *   console.log(`Summary PDF: ${result.data.paymentSummaryPdfUrl}`);
 * }
 * ```
 */
export async function processBatchPayment(data: BatchPaymentRequest): Promise<BatchPaymentResponse> {
  const response = await apiClient.post<BatchPaymentResponse>(
    `${EXPENSES_BASE_PATH}/batch-pay`,
    data
  );
  return response.data;
}

// ============================================================================
// DELETE EXPENSE (SOFT DELETE)
// ============================================================================

/**
 * Soft delete an expense (only PENDING expenses)
 *
 * @param id - Expense UUID
 *
 * @returns Promise that resolves when deletion succeeds
 *
 * @throws {InvalidStatusException} When expense is not in PENDING status (400)
 * @throws {EntityNotFoundException} When expense not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await deleteExpense(expenseId);
 * console.log('Expense deleted successfully');
 * ```
 */
export async function deleteExpense(id: string): Promise<void> {
  await apiClient.delete(`${EXPENSES_BASE_PATH}/${id}`);
}

// ============================================================================
// GET PENDING PAYMENTS BY VENDOR
// ============================================================================

/**
 * Get pending expenses grouped by vendor for batch payment page
 *
 * @param vendorId - Optional vendor UUID to filter by specific vendor
 *
 * @returns Promise that resolves to list of vendor expense groups
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const groups = await getPendingPaymentsByVendor();
 * groups.forEach(group => {
 *   console.log(`${group.vendorCompanyName}: ${group.totalAmount} (${group.expenseCount} expenses)`);
 * });
 * ```
 */
export async function getPendingPaymentsByVendor(vendorId?: string): Promise<VendorExpenseGroup[]> {
  const params: Record<string, any> = {};
  if (vendorId) {
    params.vendorId = vendorId;
  }

  const response = await apiClient.get<VendorExpenseGroupsResponse>(
    `${EXPENSES_BASE_PATH}/pending-by-vendor`,
    { params }
  );
  return response.data.data;
}

// ============================================================================
// GET EXPENSE SUMMARY
// ============================================================================

/**
 * Get expense summary statistics for dashboard charts
 *
 * @param propertyId - Optional property UUID to filter by
 * @param fromDate - Optional start date for period
 * @param toDate - Optional end date for period
 *
 * @returns Promise that resolves to ExpenseSummary
 *
 * @example
 * ```typescript
 * const summary = await getExpenseSummary();
 * console.log(`Total Expenses: ${summary.totalExpenses}`);
 * console.log(`Pending Amount: ${summary.totalPendingAmount}`);
 *
 * // Category breakdown for pie chart
 * summary.expensesByCategory.forEach(cat => {
 *   console.log(`${cat.categoryLabel}: ${cat.percentage}%`);
 * });
 *
 * // Monthly trend for line chart
 * summary.monthlyTrend.forEach(month => {
 *   console.log(`${month.monthLabel}: ${month.totalAmount}`);
 * });
 * ```
 */
export async function getExpenseSummary(
  propertyId?: string,
  fromDate?: string,
  toDate?: string
): Promise<ExpenseSummary> {
  const params: Record<string, any> = {};
  if (propertyId) {
    params.propertyId = propertyId;
  }
  if (fromDate) {
    params.fromDate = fromDate;
  }
  if (toDate) {
    params.toDate = toDate;
  }

  const response = await apiClient.get<ExpenseSummaryResponse>(
    `${EXPENSES_BASE_PATH}/summary`,
    { params }
  );
  return response.data.data;
}

// ============================================================================
// DOWNLOAD RECEIPT
// ============================================================================

/**
 * Get receipt download URL (presigned S3 URL)
 *
 * @param expenseId - Expense UUID
 *
 * @returns Promise that resolves to presigned URL string
 *
 * @throws {EntityNotFoundException} When expense or receipt not found (404)
 *
 * @example
 * ```typescript
 * const url = await getReceiptDownloadUrl(expenseId);
 * window.open(url, '_blank');
 * ```
 */
export async function getReceiptDownloadUrl(expenseId: string): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${EXPENSES_BASE_PATH}/${expenseId}/receipt-url`
  );
  return response.data.data.url;
}

/**
 * Download receipt file as blob
 *
 * @param expenseId - Expense UUID
 *
 * @returns Promise that resolves to Blob containing receipt file
 *
 * @throws {EntityNotFoundException} When expense or receipt not found (404)
 *
 * @example
 * ```typescript
 * const blob = await downloadReceipt(expenseId);
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `receipt-${expenseNumber}.pdf`;
 * a.click();
 * ```
 */
export async function downloadReceipt(expenseId: string): Promise<Blob> {
  const response = await apiClient.get(`${EXPENSES_BASE_PATH}/${expenseId}/receipt`, {
    responseType: 'blob'
  });
  return response.data;
}

// ============================================================================
// DOWNLOAD PAYMENT SUMMARY PDF
// ============================================================================

/**
 * Download batch payment summary PDF
 *
 * @param pdfUrl - S3 URL from batch payment response
 *
 * @returns Promise that resolves to Blob containing PDF
 *
 * @example
 * ```typescript
 * const blob = await downloadPaymentSummaryPdf(summaryPdfUrl);
 * const url = URL.createObjectURL(blob);
 * window.open(url, '_blank');
 * ```
 */
export async function downloadPaymentSummaryPdf(pdfUrl: string): Promise<Blob> {
  const response = await apiClient.get(pdfUrl, {
    responseType: 'blob'
  });
  return response.data;
}

// ============================================================================
// GET EXPENSES BY WORK ORDER
// ============================================================================

/**
 * Get expenses linked to a specific work order
 *
 * @param workOrderId - Work order UUID
 *
 * @returns Promise that resolves to list of expenses
 *
 * @example
 * ```typescript
 * const expenses = await getExpensesByWorkOrder(workOrderId);
 * expenses.forEach(expense => {
 *   console.log(`${expense.expenseNumber}: ${expense.amount}`);
 * });
 * ```
 */
export async function getExpensesByWorkOrder(workOrderId: string): Promise<ExpenseListItem[]> {
  const response = await getExpenses({ workOrderId, size: 100 });
  return response.data.content;
}

// ============================================================================
// EXPENSE SERVICE OBJECT
// ============================================================================

/**
 * Expense service object with all methods
 * Allows both named imports and object-style access
 */
export const expenseService = {
  // CRUD operations
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,

  // Payment operations
  markExpenseAsPaid,
  processBatchPayment,
  getPendingPaymentsByVendor,

  // Summary and reporting
  getExpenseSummary,

  // File operations
  getReceiptDownloadUrl,
  downloadReceipt,
  downloadPaymentSummaryPdf,

  // Work order integration
  getExpensesByWorkOrder
};
