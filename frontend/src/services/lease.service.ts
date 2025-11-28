/**
 * Lease Extension and Renewal API Service
 * Story 3.6: Tenant Lease Extension and Renewal
 *
 * All lease extension and renewal-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  LeaseExtension,
  LeaseExtensionRequest,
  LeaseExtensionResponse,
  RenewalRequest,
  RenewalRequestPage,
  SubmitRenewalRequestPayload,
  RejectRenewalRequestPayload,
  ExpiringLease,
  RenewalRequestFilters,
  ExpiringLeasesFilters,
  CurrentLeaseSummary,
  ExtensionHistoryResponse
} from '@/types/lease';

const TENANTS_BASE_PATH = '/v1/tenants';
const TENANT_PORTAL_PATH = '/v1/tenant';

// ============================================================================
// LEASE EXTENSION - PROPERTY MANAGER APIs
// ============================================================================

/**
 * Extend a tenant's lease
 *
 * @param tenantId - UUID of the tenant
 * @param data - Lease extension request data
 *
 * @returns Promise that resolves to extension details including amendment PDF URL
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When tenant not found (404)
 * @throws {ConflictException} When tenant is not ACTIVE (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const result = await extendLease('tenant-uuid', {
 *   newEndDate: '2026-01-01',
 *   rentAdjustmentType: 'PERCENTAGE',
 *   adjustmentValue: 5.0
 * });
 *
 * console.log(result.data.extensionId); // UUID of created extension
 * console.log(result.data.amendmentPdfUrl); // Presigned URL for download
 * ```
 */
export async function extendLease(
  tenantId: string,
  data: LeaseExtensionRequest
): Promise<LeaseExtensionResponse> {
  const response = await apiClient.post<LeaseExtensionResponse>(
    `${TENANTS_BASE_PATH}/${tenantId}/lease/extend`,
    data
  );
  return response.data;
}

/**
 * Get extension history for a tenant
 *
 * @param tenantId - UUID of the tenant
 *
 * @returns Promise that resolves to array of lease extensions sorted by date DESC
 *
 * @throws {NotFoundException} When tenant not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const extensions = await getExtensionHistory('tenant-uuid');
 *
 * extensions.forEach(ext => {
 *   console.log(`${ext.previousEndDate} -> ${ext.newEndDate}`);
 * });
 * ```
 */
export async function getExtensionHistory(tenantId: string): Promise<LeaseExtension[]> {
  const response = await apiClient.get<ExtensionHistoryResponse>(
    `${TENANTS_BASE_PATH}/${tenantId}/lease/extensions`
  );
  return response.data.data;
}

/**
 * Get renewal offer details for a tenant (pre-populated form data)
 *
 * @param tenantId - UUID of the tenant
 *
 * @returns Promise that resolves to current lease summary for extension form
 *
 * @throws {NotFoundException} When tenant not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getRenewalOffer(tenantId: string): Promise<CurrentLeaseSummary> {
  const response = await apiClient.get<{ success: boolean; data: CurrentLeaseSummary }>(
    `${TENANTS_BASE_PATH}/${tenantId}/lease/renewal-offer`
  );
  return response.data.data;
}

/**
 * Download lease amendment PDF
 *
 * @param tenantId - UUID of the tenant
 * @param extensionId - UUID of the lease extension
 *
 * @returns Promise that resolves to presigned S3 URL for PDF download
 *
 * @throws {NotFoundException} When extension or tenant not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getAmendmentPdf(
  tenantId: string,
  extensionId: string
): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${TENANTS_BASE_PATH}/${tenantId}/lease/amendment/${extensionId}/pdf`
  );
  return response.data.data.url;
}

// ============================================================================
// RENEWAL REQUESTS - TENANT APIs
// ============================================================================

/**
 * Submit a renewal request (tenant-facing)
 *
 * @param data - Renewal request data (preferredTerm, comments)
 *
 * @returns Promise that resolves to created renewal request
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When pending request already exists (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const request = await submitRenewalRequest({
 *   preferredTerm: '12_MONTHS',
 *   comments: 'Would like to continue my lease'
 * });
 *
 * console.log(request.status); // 'PENDING'
 * ```
 */
export async function submitRenewalRequest(
  data: SubmitRenewalRequestPayload
): Promise<RenewalRequest> {
  const response = await apiClient.post<{ success: boolean; data: RenewalRequest }>(
    `${TENANT_PORTAL_PATH}/lease/renewal-request`,
    data
  );
  return response.data.data;
}

/**
 * Get current tenant's pending renewal request (tenant-facing)
 *
 * @returns Promise that resolves to pending renewal request or null if none
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getTenantRenewalRequest(): Promise<RenewalRequest | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: RenewalRequest }>(
      `${TENANT_PORTAL_PATH}/lease/renewal-request`
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
// RENEWAL REQUESTS - PROPERTY MANAGER APIs
// ============================================================================

/**
 * Get paginated list of renewal requests
 *
 * @param filters - Optional filters (status, propertyId, date range)
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 *
 * @returns Promise that resolves to paginated renewal requests
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const requests = await getRenewalRequests(
 *   { status: 'PENDING' },
 *   0,
 *   20
 * );
 *
 * console.log(requests.content); // Array of RenewalRequest
 * console.log(requests.totalElements); // Total count
 * ```
 */
export async function getRenewalRequests(
  filters?: RenewalRequestFilters,
  page: number = 0,
  size: number = 20
): Promise<RenewalRequestPage> {
  const response = await apiClient.get<{ success: boolean; data: RenewalRequestPage }>(
    `${TENANTS_BASE_PATH}/renewal-requests`,
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
 * Get count of pending renewal requests
 *
 * @returns Promise that resolves to count of pending requests
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 */
export async function getPendingRenewalRequestsCount(): Promise<number> {
  const response = await apiClient.get<{ success: boolean; data: { count: number } }>(
    `${TENANTS_BASE_PATH}/renewal-requests/count`
  );
  return response.data.data.count;
}

/**
 * Approve a renewal request (redirects to extension page)
 *
 * @param requestId - UUID of the renewal request
 *
 * @returns Promise that resolves when request is approved
 *
 * @throws {NotFoundException} When request not found (404)
 * @throws {ConflictException} When request is not in PENDING status (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function approveRenewalRequest(requestId: string): Promise<RenewalRequest> {
  const response = await apiClient.patch<{ success: boolean; data: RenewalRequest }>(
    `${TENANTS_BASE_PATH}/renewal-requests/${requestId}/approve`
  );
  return response.data.data;
}

/**
 * Reject a renewal request with reason
 *
 * @param requestId - UUID of the renewal request
 * @param data - Rejection reason
 *
 * @returns Promise that resolves when request is rejected
 *
 * @throws {NotFoundException} When request not found (404)
 * @throws {ConflictException} When request is not in PENDING status (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 */
export async function rejectRenewalRequest(
  requestId: string,
  data: RejectRenewalRequestPayload
): Promise<RenewalRequest> {
  const response = await apiClient.patch<{ success: boolean; data: RenewalRequest }>(
    `${TENANTS_BASE_PATH}/renewal-requests/${requestId}/reject`,
    data
  );
  return response.data.data;
}

// ============================================================================
// EXPIRING LEASES
// ============================================================================

/**
 * Get list of tenants with expiring leases
 *
 * @param filters - Optional filters (propertyId, days threshold)
 *
 * @returns Promise that resolves to list of expiring leases grouped by urgency
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or ADMIN role (403)
 *
 * @example
 * ```typescript
 * const expiring = await getExpiringLeases({ propertyId: 'prop-uuid' });
 *
 * console.log(expiring.counts.expiring30Days); // Count expiring in 30 days
 * console.log(expiring.data.expiring14Days); // Critical: expiring in 14 days
 * ```
 */
export async function getExpiringLeases(
  filters?: ExpiringLeasesFilters
): Promise<{
  expiring14Days: ExpiringLease[];
  expiring30Days: ExpiringLease[];
  expiring60Days: ExpiringLease[];
  counts: {
    expiring14Days: number;
    expiring30Days: number;
    expiring60Days: number;
  };
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      expiring14Days: ExpiringLease[];
      expiring30Days: ExpiringLease[];
      expiring60Days: ExpiringLease[];
    };
    counts: {
      expiring14Days: number;
      expiring30Days: number;
      expiring60Days: number;
    };
  }>(`${TENANTS_BASE_PATH}/expiring`, {
    params: filters
  });

  return {
    ...response.data.data,
    counts: response.data.counts
  };
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

/**
 * Lease Service
 * Provides all lease extension and renewal-related API operations
 */
export const leaseService = {
  // Extension APIs
  extendLease,
  getExtensionHistory,
  getRenewalOffer,
  getAmendmentPdf,

  // Tenant Renewal APIs
  submitRenewalRequest,
  getTenantRenewalRequest,

  // PM Renewal Request APIs
  getRenewalRequests,
  getPendingRenewalRequestsCount,
  approveRenewalRequest,
  rejectRenewalRequest,

  // Expiring Leases
  getExpiringLeases
};

export default leaseService;
