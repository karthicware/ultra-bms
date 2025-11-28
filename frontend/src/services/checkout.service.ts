/**
 * Tenant Checkout and Deposit Refund API Service
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 *
 * All checkout-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  TenantCheckout,
  CheckoutPage,
  CheckoutFilters,
  CheckoutStatus,
  RefundStatus,
  InitiateCheckoutRequest,
  InitiateCheckoutResponse,
  SaveInspectionRequest,
  SaveDepositCalculationRequest,
  ProcessRefundRequest,
  CompleteCheckoutRequest,
  CompleteCheckoutResponse,
  OutstandingAmounts,
  ApproveRefundRequest,
  UpdateRefundStatusRequest,
  TenantCheckoutSummary,
  Inspection,
  DepositRefund
} from '@/types/checkout';

const CHECKOUTS_BASE_PATH = '/v1/checkouts';
const TENANTS_BASE_PATH = '/v1/tenants';

// ============================================================================
// CHECKOUT INITIATION
// ============================================================================

/**
 * Initiate tenant checkout process
 *
 * @param tenantId - UUID of the tenant
 * @param data - Checkout initiation data
 *
 * @returns Promise that resolves to checkout ID and number
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When tenant not found (404)
 * @throws {ConflictException} When tenant is not ACTIVE or already has pending checkout (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const result = await initiateCheckout('tenant-uuid', {
 *   tenantId: 'tenant-uuid',
 *   noticeDate: '2025-01-15',
 *   expectedMoveOutDate: '2025-02-15',
 *   checkoutReason: 'LEASE_END'
 * });
 *
 * console.log(result.data.checkoutId); // UUID of created checkout
 * console.log(result.data.checkoutNumber); // CHK-2025-0001
 * ```
 */
export async function initiateCheckout(
  tenantId: string,
  data: InitiateCheckoutRequest
): Promise<InitiateCheckoutResponse> {
  const response = await apiClient.post<InitiateCheckoutResponse>(
    `${TENANTS_BASE_PATH}/${tenantId}/checkout/initiate`,
    data
  );
  return response.data;
}

/**
 * Get tenant checkout summary for initiation form
 *
 * @param tenantId - UUID of the tenant
 *
 * @returns Promise that resolves to tenant checkout summary
 *
 * @throws {NotFoundException} When tenant not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getTenantCheckoutSummary(tenantId: string): Promise<TenantCheckoutSummary> {
  const response = await apiClient.get<{ success: boolean; data: TenantCheckoutSummary }>(
    `${TENANTS_BASE_PATH}/${tenantId}/checkout/summary`
  );
  return response.data.data;
}

/**
 * Get tenant outstanding amounts
 *
 * @param tenantId - UUID of the tenant
 *
 * @returns Promise that resolves to outstanding amounts breakdown
 *
 * @throws {NotFoundException} When tenant not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const outstanding = await getTenantOutstanding('tenant-uuid');
 *
 * console.log(outstanding.grandTotal); // Total owed
 * console.log(outstanding.outstandingInvoices); // Unpaid invoices
 * ```
 */
export async function getTenantOutstanding(tenantId: string): Promise<OutstandingAmounts> {
  const response = await apiClient.get<{ success: boolean; data: OutstandingAmounts }>(
    `${TENANTS_BASE_PATH}/${tenantId}/outstanding`
  );
  return response.data.data;
}

// ============================================================================
// CHECKOUT CRUD OPERATIONS
// ============================================================================

/**
 * Get paginated list of checkouts
 *
 * @param filters - Optional filters (status, property, date range, search)
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 *
 * @returns Promise that resolves to paginated checkout list
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const checkouts = await getCheckouts(
 *   { status: 'PENDING', propertyId: 'prop-uuid' },
 *   0,
 *   20
 * );
 *
 * console.log(checkouts.content); // Array of TenantCheckout
 * console.log(checkouts.totalElements); // Total count
 * ```
 */
export async function getCheckouts(
  filters?: CheckoutFilters,
  page: number = 0,
  size: number = 20
): Promise<CheckoutPage> {
  const response = await apiClient.get<{ success: boolean; data: CheckoutPage }>(
    CHECKOUTS_BASE_PATH,
    {
      params: {
        ...filters,
        page,
        size
      }
    }
  );
  return response.data.data;
}

/**
 * Get single checkout details
 *
 * @param checkoutId - UUID of the checkout
 *
 * @returns Promise that resolves to checkout with all related data
 *
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function getCheckout(checkoutId: string): Promise<TenantCheckout> {
  const response = await apiClient.get<{ success: boolean; data: TenantCheckout }>(
    `${CHECKOUTS_BASE_PATH}/${checkoutId}`
  );
  return response.data.data;
}

/**
 * Get checkout by tenant ID
 *
 * @param tenantId - UUID of the tenant
 *
 * @returns Promise that resolves to checkout or null if none exists
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getCheckoutByTenant(tenantId: string): Promise<TenantCheckout | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: TenantCheckout }>(
      `${TENANTS_BASE_PATH}/${tenantId}/checkout`
    );
    return response.data.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}

// ============================================================================
// INSPECTION OPERATIONS
// ============================================================================

/**
 * Save inspection data for checkout
 *
 * @param tenantId - UUID of the tenant
 * @param checkoutId - UUID of the checkout
 * @param data - Inspection data including checklist
 *
 * @returns Promise that resolves to updated checkout
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {ConflictException} When checkout is not in valid state for inspection (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function saveInspection(
  tenantId: string,
  checkoutId: string,
  data: SaveInspectionRequest
): Promise<TenantCheckout> {
  const response = await apiClient.put<{ success: boolean; data: TenantCheckout }>(
    `${TENANTS_BASE_PATH}/${tenantId}/checkout/${checkoutId}/inspection`,
    data
  );
  return response.data.data;
}

/**
 * Get inspection details for checkout
 *
 * @param checkoutId - UUID of the checkout
 *
 * @returns Promise that resolves to inspection data or null if not yet created
 *
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getInspection(checkoutId: string): Promise<Inspection | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: Inspection }>(
      `${CHECKOUTS_BASE_PATH}/${checkoutId}/inspection`
    );
    return response.data.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}

/**
 * Upload inspection photos
 *
 * @param tenantId - UUID of the tenant
 * @param checkoutId - UUID of the checkout
 * @param files - Photo files to upload
 * @param section - Section name (e.g., 'living_areas', 'kitchen')
 * @param photoType - Type of photo ('BEFORE', 'AFTER', 'DAMAGE')
 *
 * @returns Promise that resolves to array of uploaded photo metadata
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const photos = await uploadInspectionPhotos(
 *   'tenant-uuid',
 *   'checkout-uuid',
 *   fileList,
 *   'kitchen',
 *   'DAMAGE'
 * );
 *
 * console.log(photos); // Array of uploaded photo objects
 * ```
 */
export async function uploadInspectionPhotos(
  tenantId: string,
  checkoutId: string,
  files: File[],
  section: string,
  photoType: 'BEFORE' | 'AFTER' | 'DAMAGE'
): Promise<{ id: string; fileName: string; presignedUrl: string }[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('section', section);
  formData.append('photoType', photoType);

  const response = await apiClient.post<{
    success: boolean;
    data: { id: string; fileName: string; presignedUrl: string }[];
  }>(
    `${TENANTS_BASE_PATH}/${tenantId}/checkout/${checkoutId}/inspection/photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

/**
 * Delete inspection photo
 *
 * @param checkoutId - UUID of the checkout
 * @param photoId - UUID of the photo to delete
 *
 * @returns Promise that resolves when photo is deleted
 *
 * @throws {NotFoundException} When photo not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function deleteInspectionPhoto(
  checkoutId: string,
  photoId: string
): Promise<void> {
  await apiClient.delete(`${CHECKOUTS_BASE_PATH}/${checkoutId}/inspection/photos/${photoId}`);
}

// ============================================================================
// DEPOSIT CALCULATION OPERATIONS
// ============================================================================

/**
 * Save deposit calculation for checkout
 *
 * @param tenantId - UUID of the tenant
 * @param checkoutId - UUID of the checkout
 * @param data - Deposit calculation data with deductions
 *
 * @returns Promise that resolves to updated checkout with deposit refund
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {ConflictException} When checkout is not in valid state for deposit calc (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function saveDepositCalculation(
  tenantId: string,
  checkoutId: string,
  data: SaveDepositCalculationRequest
): Promise<TenantCheckout> {
  const response = await apiClient.put<{ success: boolean; data: TenantCheckout }>(
    `${TENANTS_BASE_PATH}/${tenantId}/checkout/${checkoutId}/deposit`,
    data
  );
  return response.data.data;
}

/**
 * Get deposit refund details for checkout
 *
 * @param checkoutId - UUID of the checkout
 *
 * @returns Promise that resolves to deposit refund data or null
 *
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getDepositRefund(checkoutId: string): Promise<DepositRefund | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: DepositRefund }>(
      `${CHECKOUTS_BASE_PATH}/${checkoutId}/deposit`
    );
    return response.data.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}

// ============================================================================
// CHECKOUT COMPLETION OPERATIONS
// ============================================================================

/**
 * Complete the checkout process
 *
 * @param tenantId - UUID of the tenant
 * @param checkoutId - UUID of the checkout
 * @param data - Completion data including settlement acknowledgment
 *
 * @returns Promise that resolves to completion response with document URLs
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {ConflictException} When checkout cannot be completed (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const result = await completeCheckout('tenant-uuid', 'checkout-uuid', {
 *   settlementType: 'FULL',
 *   acknowledgeFinalization: true
 * });
 *
 * console.log(result.data.finalStatementUrl); // PDF download URL
 * ```
 */
export async function completeCheckout(
  tenantId: string,
  checkoutId: string,
  data: CompleteCheckoutRequest
): Promise<CompleteCheckoutResponse> {
  const response = await apiClient.post<CompleteCheckoutResponse>(
    `${TENANTS_BASE_PATH}/${tenantId}/checkout/${checkoutId}/complete`,
    data
  );
  return response.data;
}

// ============================================================================
// REFUND OPERATIONS
// ============================================================================

/**
 * Process deposit refund
 *
 * @param checkoutId - UUID of the checkout
 * @param data - Refund processing data (method, bank details, etc.)
 *
 * @returns Promise that resolves to updated checkout
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {ConflictException} When refund cannot be processed (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function processRefund(
  checkoutId: string,
  data: ProcessRefundRequest
): Promise<TenantCheckout> {
  const response = await apiClient.post<{ success: boolean; data: TenantCheckout }>(
    `${CHECKOUTS_BASE_PATH}/${checkoutId}/refund`,
    data
  );
  return response.data.data;
}

/**
 * Approve refund (ADMIN only for amounts > threshold)
 *
 * @param checkoutId - UUID of the checkout
 * @param data - Optional approval notes
 *
 * @returns Promise that resolves to updated checkout
 *
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {ConflictException} When refund is not pending approval (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN role (403)
 */
export async function approveRefund(
  checkoutId: string,
  data?: ApproveRefundRequest
): Promise<TenantCheckout> {
  const response = await apiClient.post<{ success: boolean; data: TenantCheckout }>(
    `${CHECKOUTS_BASE_PATH}/${checkoutId}/refund/approve`,
    data || {}
  );
  return response.data.data;
}

/**
 * Update refund status
 *
 * @param checkoutId - UUID of the checkout
 * @param data - Status update data
 *
 * @returns Promise that resolves to updated checkout
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When checkout not found (404)
 * @throws {ConflictException} When status transition is invalid (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function updateRefundStatus(
  checkoutId: string,
  data: UpdateRefundStatusRequest
): Promise<TenantCheckout> {
  const response = await apiClient.patch<{ success: boolean; data: TenantCheckout }>(
    `${CHECKOUTS_BASE_PATH}/${checkoutId}/refund/status`,
    data
  );
  return response.data.data;
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Get checkout document PDF
 *
 * @param checkoutId - UUID of the checkout
 * @param documentType - Type of document to download
 *
 * @returns Promise that resolves to presigned URL for PDF download
 *
 * @throws {NotFoundException} When document not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const url = await getCheckoutDocument('checkout-uuid', 'inspection-report');
 * window.open(url, '_blank'); // Opens PDF in new tab
 * ```
 */
export async function getCheckoutDocument(
  checkoutId: string,
  documentType: 'inspection-report' | 'deposit-statement' | 'final-settlement'
): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${CHECKOUTS_BASE_PATH}/${checkoutId}/documents/${documentType}`
  );
  return response.data.data.url;
}

/**
 * Download refund receipt PDF
 *
 * @param checkoutId - UUID of the checkout
 *
 * @returns Promise that resolves to presigned URL for receipt PDF
 *
 * @throws {NotFoundException} When receipt not found (404)
 * @throws {ConflictException} When refund has not been processed (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getRefundReceipt(checkoutId: string): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${CHECKOUTS_BASE_PATH}/${checkoutId}/receipt`
  );
  return response.data.data.url;
}

// ============================================================================
// STATISTICS AND COUNTS
// ============================================================================

/**
 * Get checkout counts by status
 *
 * @returns Promise that resolves to counts per status
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getCheckoutCounts(): Promise<Record<CheckoutStatus, number>> {
  const response = await apiClient.get<{
    success: boolean;
    data: Record<CheckoutStatus, number>;
  }>(`${CHECKOUTS_BASE_PATH}/counts`);
  return response.data.data;
}

/**
 * Get pending refunds count
 *
 * @returns Promise that resolves to count of pending refunds
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getPendingRefundsCount(): Promise<number> {
  const response = await apiClient.get<{ success: boolean; data: { count: number } }>(
    `${CHECKOUTS_BASE_PATH}/refunds/pending/count`
  );
  return response.data.data.count;
}

/**
 * Get refunds requiring approval (ADMIN)
 *
 * @returns Promise that resolves to list of checkouts with refunds needing approval
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN role (403)
 */
export async function getRefundsRequiringApproval(): Promise<TenantCheckout[]> {
  const response = await apiClient.get<{ success: boolean; data: TenantCheckout[] }>(
    `${CHECKOUTS_BASE_PATH}/refunds/pending-approval`
  );
  return response.data.data;
}

// ============================================================================
// EXPORT CSV
// ============================================================================

/**
 * Export checkouts to CSV
 *
 * @param filters - Optional filters to apply
 *
 * @returns Promise that resolves to CSV file blob
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function exportCheckoutsCsv(filters?: CheckoutFilters): Promise<Blob> {
  const response = await apiClient.get<Blob>(`${CHECKOUTS_BASE_PATH}/export`, {
    params: filters,
    responseType: 'blob'
  });
  return response.data;
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

/**
 * Checkout Service
 * Provides all checkout and deposit refund-related API operations
 */
export const checkoutService = {
  // Initiation
  initiateCheckout,
  getTenantCheckoutSummary,
  getTenantOutstanding,

  // CRUD
  getCheckouts,
  getCheckout,
  getCheckoutByTenant,

  // Inspection
  saveInspection,
  getInspection,
  uploadInspectionPhotos,
  deleteInspectionPhoto,

  // Deposit
  saveDepositCalculation,
  getDepositRefund,

  // Completion
  completeCheckout,

  // Refund
  processRefund,
  approveRefund,
  updateRefundStatus,

  // Documents
  getCheckoutDocument,
  getRefundReceipt,

  // Statistics
  getCheckoutCounts,
  getPendingRefundsCount,
  getRefundsRequiringApproval,

  // Export
  exportCheckoutsCsv
};

export default checkoutService;
