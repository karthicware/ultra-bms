/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PDC (Post-Dated Cheque) Management API Service
 * Story 6.3: Post-Dated Cheque (PDC) Management
 *
 * All PDC-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  PDC,
  PDCDetail,
  PDCListItem,
  PDCFilter,
  PDCCreateRequest,
  PDCBulkCreateRequest,
  PDCDepositRequest,
  PDCClearRequest,
  PDCBounceRequest,
  PDCReplaceRequest,
  PDCWithdrawRequest,
  PDCDashboard,
  PDCWithdrawalFilter,
  PDCWithdrawalHistoryItem,
  CreatePDCResponse,
  BulkCreatePDCResponse,
  GetPDCResponse,
  PDCListResponse,
  PDCDashboardResponse,
  PDCStatusActionResponse,
  PDCReplaceResponse,
  TenantPDCHistoryResponse,
  PDCWithdrawalHistoryResponse,
  BankAccountOption,
  BankAccountsResponse,
  PDCHolder,
  PDCHolderResponse
} from '@/types/pdc';

const PDCS_BASE_PATH = '/v1/pdcs';
const TENANTS_BASE_PATH = '/v1/tenants';
const BANK_ACCOUNTS_BASE_PATH = '/v1/bank-accounts';
const COMPANY_PROFILE_BASE_PATH = '/v1/company-profile';

// ============================================================================
// CREATE PDC
// ============================================================================

/**
 * Create a new single PDC
 *
 * @param data - PDC creation data (tenant, cheque details, amount, date)
 *
 * @returns Promise that resolves to the created PDC
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When tenant/lease/invoice not found (404)
 * @throws {DuplicateException} When cheque number already exists for tenant (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const pdc = await createPDC({
 *   tenantId: '550e8400-e29b-41d4-a716-446655440000',
 *   chequeNumber: '123456',
 *   bankName: 'Emirates NBD',
 *   amount: 50000.00,
 *   chequeDate: '2024-02-15'
 * });
 *
 * console.log(pdc.id);
 * console.log(pdc.status); // "RECEIVED"
 * ```
 */
export async function createPDC(data: PDCCreateRequest): Promise<PDC> {
  const response = await apiClient.post<CreatePDCResponse>(PDCS_BASE_PATH, data);
  return response.data.data;
}

/**
 * Create multiple PDCs in a single bulk operation (atomic)
 *
 * @param data - Bulk PDC creation data with array of cheques (1-24 cheques)
 *
 * @returns Promise that resolves to array of created PDCs
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When tenant/lease not found (404)
 * @throws {DuplicateException} When any cheque number already exists for tenant (409)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const pdcs = await createBulkPDCs({
 *   tenantId: '550e8400-e29b-41d4-a716-446655440000',
 *   leaseId: '660e8400-e29b-41d4-a716-446655440000',
 *   cheques: [
 *     { chequeNumber: '123456', bankName: 'Emirates NBD', amount: 50000, chequeDate: '2024-02-15' },
 *     { chequeNumber: '123457', bankName: 'Emirates NBD', amount: 50000, chequeDate: '2024-03-15' },
 *     { chequeNumber: '123458', bankName: 'Emirates NBD', amount: 50000, chequeDate: '2024-04-15' }
 *   ]
 * });
 *
 * console.log(`Created ${pdcs.length} PDCs`);
 * ```
 */
export async function createBulkPDCs(data: PDCBulkCreateRequest): Promise<PDC[]> {
  const response = await apiClient.post<BulkCreatePDCResponse>(`${PDCS_BASE_PATH}/bulk`, data);
  return response.data.data;
}

// ============================================================================
// LIST PDCS
// ============================================================================

/**
 * Get paginated list of PDCs with filters
 *
 * @param filters - Optional filters (status, tenant, bank, date range)
 *
 * @returns Promise that resolves to paginated list of PDCListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get all DUE PDCs
 * const response = await getPDCs({
 *   status: 'DUE',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Filter by tenant and date range
 * const filtered = await getPDCs({
 *   tenantId: 'tenant-uuid',
 *   fromDate: '2024-01-01',
 *   toDate: '2024-12-31',
 *   sortBy: 'chequeDate',
 *   sortDirection: 'ASC'
 * });
 * ```
 */
export async function getPDCs(filters?: PDCFilter): Promise<PDCListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'chequeDate',
    sortDirection: filters?.sortDirection ?? 'ASC'
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
  if (filters?.tenantId) {
    params.tenantId = filters.tenantId;
  }
  if (filters?.bankName) {
    params.bankName = filters.bankName;
  }
  if (filters?.leaseId) {
    params.leaseId = filters.leaseId;
  }
  if (filters?.invoiceId) {
    params.invoiceId = filters.invoiceId;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }

  const response = await apiClient.get<PDCListResponse>(PDCS_BASE_PATH, { params });
  return response.data;
}

// ============================================================================
// GET PDC BY ID
// ============================================================================

/**
 * Get PDC details by ID
 *
 * @param id - PDC UUID
 *
 * @returns Promise that resolves to full PDCDetail with relationships
 *
 * @throws {EntityNotFoundException} When PDC not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const pdc = await getPDCById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(pdc.chequeNumber);
 * console.log(pdc.status);
 * console.log(pdc.statusHistory);
 * ```
 */
export async function getPDCById(id: string): Promise<PDCDetail> {
  const response = await apiClient.get<GetPDCResponse>(`${PDCS_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// PDC STATUS ACTIONS
// ============================================================================

/**
 * Mark PDC as deposited
 * Only DUE status PDCs can be deposited
 *
 * @param id - PDC UUID
 * @param data - Deposit details (date, bank account)
 *
 * @returns Promise that resolves to updated PDC
 *
 * @throws {InvalidStatusException} When PDC is not in DUE status (400)
 * @throws {EntityNotFoundException} When PDC or bank account not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await depositPDC(pdcId, {
 *   depositDate: '2024-02-15',
 *   bankAccountId: 'bank-account-uuid'
 * });
 *
 * console.log(updated.status); // "DEPOSITED"
 * ```
 */
export async function depositPDC(id: string, data: PDCDepositRequest): Promise<PDC> {
  const response = await apiClient.patch<PDCStatusActionResponse>(
    `${PDCS_BASE_PATH}/${id}/deposit`,
    data
  );
  return response.data.data;
}

/**
 * Mark PDC as cleared (payment confirmed by bank)
 * Only DEPOSITED status PDCs can be cleared
 * If linked to invoice, automatically records payment
 *
 * @param id - PDC UUID
 * @param data - Clear details (cleared date)
 *
 * @returns Promise that resolves to updated PDC
 *
 * @throws {InvalidStatusException} When PDC is not in DEPOSITED status (400)
 * @throws {EntityNotFoundException} When PDC not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await clearPDC(pdcId, {
 *   clearedDate: '2024-02-18'
 * });
 *
 * console.log(updated.status); // "CLEARED"
 * // If linked to invoice, payment is automatically recorded
 * ```
 */
export async function clearPDC(id: string, data: PDCClearRequest): Promise<PDC> {
  const response = await apiClient.patch<PDCStatusActionResponse>(
    `${PDCS_BASE_PATH}/${id}/clear`,
    data
  );
  return response.data.data;
}

/**
 * Mark PDC as bounced (payment failed)
 * Only DEPOSITED status PDCs can be bounced
 * Triggers notifications to property manager and tenant
 *
 * @param id - PDC UUID
 * @param data - Bounce details (date, reason)
 *
 * @returns Promise that resolves to updated PDC
 *
 * @throws {InvalidStatusException} When PDC is not in DEPOSITED status (400)
 * @throws {EntityNotFoundException} When PDC not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await bouncePDC(pdcId, {
 *   bouncedDate: '2024-02-18',
 *   bounceReason: 'Insufficient Funds'
 * });
 *
 * console.log(updated.status); // "BOUNCED"
 * // Notifications sent to tenant and property manager
 * ```
 */
export async function bouncePDC(id: string, data: PDCBounceRequest): Promise<PDC> {
  const response = await apiClient.patch<PDCStatusActionResponse>(
    `${PDCS_BASE_PATH}/${id}/bounce`,
    data
  );
  return response.data.data;
}

/**
 * Replace a bounced PDC with a new cheque
 * Only BOUNCED status PDCs can be replaced
 * Creates a new PDC linked to the original
 *
 * @param id - Original PDC UUID (bounced)
 * @param data - New cheque details
 *
 * @returns Promise that resolves to both original and replacement PDCs
 *
 * @throws {InvalidStatusException} When PDC is not in BOUNCED status (400)
 * @throws {EntityNotFoundException} When PDC not found (404)
 * @throws {DuplicateException} When new cheque number already exists (409)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const result = await replacePDC(pdcId, {
 *   newChequeNumber: '654321',
 *   bankName: 'Emirates NBD',
 *   amount: 50000.00,
 *   chequeDate: '2024-03-01'
 * });
 *
 * console.log(result.original.status); // "REPLACED"
 * console.log(result.replacement.status); // "RECEIVED"
 * console.log(result.replacement.originalChequeId); // Points to original
 * ```
 */
export async function replacePDC(id: string, data: PDCReplaceRequest): Promise<PDCReplaceResponse['data']> {
  const response = await apiClient.post<PDCReplaceResponse>(
    `${PDCS_BASE_PATH}/${id}/replace`,
    data
  );
  return response.data.data;
}

/**
 * Withdraw a PDC (return to tenant)
 * Only RECEIVED or DUE status PDCs can be withdrawn
 *
 * @param id - PDC UUID
 * @param data - Withdrawal details (date, reason, optional new payment method)
 *
 * @returns Promise that resolves to updated PDC
 *
 * @throws {InvalidStatusException} When PDC is not in RECEIVED or DUE status (400)
 * @throws {EntityNotFoundException} When PDC not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await withdrawPDC(pdcId, {
 *   withdrawalDate: '2024-02-10',
 *   withdrawalReason: 'Tenant Request',
 *   newPaymentMethod: 'BANK_TRANSFER',
 *   transactionDetails: {
 *     amount: 50000,
 *     transactionId: 'TXN-12345',
 *     bankAccountId: 'bank-account-uuid'
 *   }
 * });
 *
 * console.log(updated.status); // "WITHDRAWN"
 * ```
 */
export async function withdrawPDC(id: string, data: PDCWithdrawRequest): Promise<PDC> {
  const response = await apiClient.patch<PDCStatusActionResponse>(
    `${PDCS_BASE_PATH}/${id}/withdraw`,
    data
  );
  return response.data.data;
}

/**
 * Cancel a PDC (void)
 * Only RECEIVED status PDCs can be cancelled
 *
 * @param id - PDC UUID
 *
 * @returns Promise that resolves to updated PDC
 *
 * @throws {InvalidStatusException} When PDC is not in RECEIVED status (400)
 * @throws {EntityNotFoundException} When PDC not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await cancelPDC(pdcId);
 * console.log(updated.status); // "CANCELLED"
 * ```
 */
export async function cancelPDC(id: string): Promise<PDC> {
  const response = await apiClient.patch<PDCStatusActionResponse>(
    `${PDCS_BASE_PATH}/${id}/cancel`,
    {}
  );
  return response.data.data;
}

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * Get PDC dashboard data (KPIs, upcoming PDCs, recently deposited)
 *
 * @returns Promise that resolves to PDCDashboard
 *
 * @example
 * ```typescript
 * const dashboard = await getPDCDashboard();
 *
 * // KPIs
 * console.log(`Due this week: ${dashboard.pdcsDueThisWeek.count} (${dashboard.pdcsDueThisWeek.totalValue} AED)`);
 * console.log(`Deposited: ${dashboard.pdcsDeposited.count}`);
 * console.log(`Outstanding: ${dashboard.totalOutstandingValue} AED`);
 * console.log(`Recently bounced: ${dashboard.recentlyBouncedCount}`);
 *
 * // Lists
 * dashboard.upcomingPDCs.forEach(pdc => console.log(pdc.chequeNumber));
 * dashboard.recentlyDepositedPDCs.forEach(pdc => console.log(pdc.chequeNumber));
 * ```
 */
export async function getPDCDashboard(): Promise<PDCDashboard> {
  const response = await apiClient.get<PDCDashboardResponse>(`${PDCS_BASE_PATH}/dashboard`);
  return response.data.data;
}

// ============================================================================
// WITHDRAWAL HISTORY
// ============================================================================

/**
 * Get PDC withdrawal history with filters
 *
 * @param filters - Optional filters (reason, date range)
 *
 * @returns Promise that resolves to paginated withdrawal history
 *
 * @example
 * ```typescript
 * const history = await getWithdrawals({
 *   withdrawalReason: 'Cheque Bounced',
 *   page: 0,
 *   size: 20
 * });
 *
 * history.data.content.forEach(item => {
 *   console.log(`${item.originalChequeNumber}: ${item.withdrawalReason}`);
 * });
 * ```
 */
export async function getWithdrawals(filters?: PDCWithdrawalFilter): Promise<PDCWithdrawalHistoryResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'withdrawalDate',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.withdrawalReason && filters.withdrawalReason !== 'ALL') {
    params.withdrawalReason = filters.withdrawalReason;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }

  const response = await apiClient.get<PDCWithdrawalHistoryResponse>(
    `${PDCS_BASE_PATH}/withdrawals`,
    { params }
  );
  return response.data;
}

/**
 * Export withdrawal history to file
 *
 * @param format - Export format ('pdf' | 'excel')
 * @param filters - Optional filters to apply
 *
 * @returns Promise that resolves to Blob containing file
 *
 * @example
 * ```typescript
 * const blob = await exportWithdrawals('excel', { fromDate: '2024-01-01' });
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'pdc-withdrawals.xlsx';
 * a.click();
 * ```
 */
export async function exportWithdrawals(
  format: 'pdf' | 'excel',
  filters?: PDCWithdrawalFilter
): Promise<Blob> {
  const params: Record<string, any> = { format };

  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.withdrawalReason && filters.withdrawalReason !== 'ALL') {
    params.withdrawalReason = filters.withdrawalReason;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }

  const response = await apiClient.get(`${PDCS_BASE_PATH}/withdrawals/export`, {
    params,
    responseType: 'blob'
  });
  return response.data;
}

// ============================================================================
// TENANT PDC HISTORY
// ============================================================================

/**
 * Get PDC history for a specific tenant with bounce rate
 *
 * @param tenantId - Tenant UUID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 *
 * @returns Promise that resolves to tenant PDC history with bounce rate
 *
 * @example
 * ```typescript
 * const history = await getTenantPDCHistory(tenantId);
 * console.log(`Bounce rate: ${history.data.bounceRate}%`);
 * history.data.content.forEach(pdc => {
 *   console.log(`${pdc.chequeNumber}: ${pdc.status}`);
 * });
 * ```
 */
export async function getTenantPDCHistory(
  tenantId: string,
  page: number = 0,
  size: number = 20
): Promise<TenantPDCHistoryResponse> {
  const response = await apiClient.get<TenantPDCHistoryResponse>(
    `${TENANTS_BASE_PATH}/${tenantId}/pdcs`,
    { params: { page, size } }
  );
  return response.data;
}

// ============================================================================
// BANK ACCOUNTS
// ============================================================================

/**
 * Get available bank accounts for PDC deposit
 * Returns list of company bank accounts with masked account numbers
 *
 * @returns Promise that resolves to list of bank account options
 *
 * @example
 * ```typescript
 * const accounts = await getBankAccounts();
 * accounts.forEach(account => {
 *   console.log(account.displayName); // "Emirates NBD - **** **** **** 1234"
 * });
 * ```
 */
export async function getBankAccounts(): Promise<BankAccountOption[]> {
  try {
    const response = await apiClient.get<BankAccountsResponse>(BANK_ACCOUNTS_BASE_PATH);
    return response.data.data;
  } catch {
    // Graceful handling if Story 6.5 not implemented yet
    return [];
  }
}

// ============================================================================
// PDC HOLDER (COMPANY PROFILE)
// ============================================================================

/**
 * Get PDC holder information from company profile
 * Used to display on PDC detail page
 *
 * @returns Promise that resolves to PDC holder info
 *
 * @example
 * ```typescript
 * const holder = await getPDCHolder();
 * console.log(holder.companyName); // "Emirates Property Care FZ-LLC"
 * ```
 */
export async function getPDCHolder(): Promise<PDCHolder> {
  try {
    const response = await apiClient.get<PDCHolderResponse>(COMPANY_PROFILE_BASE_PATH);
    return response.data.data;
  } catch {
    // Graceful fallback if company profile not configured
    return {
      companyName: 'Company Profile Not Configured'
    };
  }
}

// ============================================================================
// PDC SERVICE OBJECT
// ============================================================================

/**
 * PDC service object with all methods
 * Allows both named imports and object-style access
 */
export const pdcService = {
  // Create operations
  createPDC,
  createBulkPDCs,

  // Read operations
  getPDCs,
  getPDCById,
  getPDCDashboard,
  getWithdrawals,
  getTenantPDCHistory,

  // Status actions
  depositPDC,
  clearPDC,
  bouncePDC,
  replacePDC,
  withdrawPDC,
  cancelPDC,

  // Export
  exportWithdrawals,

  // Related data
  getBankAccounts,
  getPDCHolder
};
