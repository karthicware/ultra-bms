/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Vendor API Service
 * Story 5.1: Vendor Registration and Profile Management
 *
 * All vendor-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  Vendor,
  VendorDetail,
  VendorListItem,
  VendorRequest,
  VendorFilter,
  VendorStatus,
  CreateVendorResponse,
  GetVendorResponse,
  VendorListResponse,
  VendorStatusResponse,
  VendorWorkOrderItem,
  VendorWorkOrdersResponse
} from '@/types/vendors';

const VENDORS_BASE_PATH = '/v1/vendors';

// ============================================================================
// CREATE VENDOR
// ============================================================================

/**
 * Create a new vendor
 *
 * @param data - Vendor registration data (company info, contact info, service info, payment info)
 *
 * @returns Promise that resolves to the created Vendor with vendorNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {DuplicateEmailException} When email already exists (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR role (403)
 *
 * @example
 * ```typescript
 * const vendor = await createVendor({
 *   companyName: 'ABC Plumbing Services',
 *   contactPersonName: 'John Smith',
 *   email: 'john@abcplumbing.ae',
 *   phoneNumber: '+971501234567',
 *   emiratesIdOrTradeLicense: 'TL-123456',
 *   serviceCategories: ['PLUMBING', 'HVAC'],
 *   hourlyRate: 150.00,
 *   paymentTerms: 'NET_30'
 * });
 *
 * console.log(vendor.vendorNumber); // "VND-2025-0001"
 * console.log(vendor.status); // "ACTIVE"
 * ```
 */
export async function createVendor(data: VendorRequest): Promise<Vendor> {
  const response = await apiClient.post<CreateVendorResponse>(
    VENDORS_BASE_PATH,
    data
  );
  return response.data.data;
}

// ============================================================================
// LIST VENDORS
// ============================================================================

/**
 * Get paginated list of vendors with filters
 *
 * @param filters - Optional filters (status, serviceCategories, rating, search, etc.)
 *
 * @returns Promise that resolves to paginated list of VendorListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get all active vendors
 * const response = await getVendors({
 *   status: 'ACTIVE',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Search vendors by name
 * const searchResults = await getVendors({
 *   search: 'plumbing',
 *   serviceCategories: ['PLUMBING'],
 *   sortBy: 'rating',
 *   sortDirection: 'DESC'
 * });
 * ```
 */
export async function getVendors(filters?: VendorFilter): Promise<VendorListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'companyName',
    sortDirection: filters?.sortDirection ?? 'ASC'
  };

  // Add filters if provided
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.status && filters.status !== 'ALL') {
    params.status = filters.status;
  }
  if (filters?.serviceCategories && filters.serviceCategories.length > 0) {
    params.serviceCategories = filters.serviceCategories.join(',');
  }
  if (filters?.minRating !== undefined && filters.minRating !== null) {
    params.minRating = filters.minRating;
  }

  const response = await apiClient.get<VendorListResponse>(
    VENDORS_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET VENDOR BY ID
// ============================================================================

/**
 * Get vendor details by ID
 *
 * @param id - Vendor UUID
 *
 * @returns Promise that resolves to full VendorDetail including performance metrics
 *
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const vendor = await getVendorById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(vendor.companyName);
 * console.log(vendor.rating);
 * console.log(vendor.totalJobsCompleted);
 * ```
 */
export async function getVendorById(id: string): Promise<VendorDetail> {
  const response = await apiClient.get<GetVendorResponse>(`${VENDORS_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// UPDATE VENDOR
// ============================================================================

/**
 * Update vendor details
 *
 * @param id - Vendor UUID
 * @param data - Updated vendor data
 *
 * @returns Promise that resolves to updated Vendor
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {DuplicateEmailException} When email already exists for another vendor (400)
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await updateVendor(vendorId, {
 *   ...existingData,
 *   hourlyRate: 175.00,
 *   serviceCategories: ['PLUMBING', 'HVAC', 'APPLIANCE']
 * });
 * ```
 */
export async function updateVendor(id: string, data: VendorRequest): Promise<Vendor> {
  const response = await apiClient.put<CreateVendorResponse>(
    `${VENDORS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// UPDATE VENDOR STATUS
// ============================================================================

/**
 * Update vendor status (activate, deactivate, suspend)
 *
 * @param id - Vendor UUID
 * @param status - New status (ACTIVE, INACTIVE, SUSPENDED)
 *
 * @returns Promise that resolves to status response with new status
 *
 * @throws {ValidationException} When invalid status transition (400)
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Suspend a vendor
 * const result = await updateVendorStatus(vendorId, 'SUSPENDED');
 * console.log(result.data.status); // "SUSPENDED"
 *
 * // Reactivate a vendor
 * const reactivated = await updateVendorStatus(vendorId, 'ACTIVE');
 * ```
 */
export async function updateVendorStatus(
  id: string,
  status: VendorStatus
): Promise<VendorStatusResponse> {
  const response = await apiClient.patch<VendorStatusResponse>(
    `${VENDORS_BASE_PATH}/${id}/status`,
    { status }
  );
  return response.data;
}

// ============================================================================
// DELETE VENDOR (SOFT DELETE)
// ============================================================================

/**
 * Soft delete a vendor
 *
 * Sets isDeleted = true, deletedAt = now(), deletedBy = current user.
 * Soft-deleted vendors are excluded from list queries and cannot be assigned to work orders.
 *
 * @param id - Vendor UUID
 *
 * @returns Promise that resolves when deletion succeeds
 *
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await deleteVendor(vendorId);
 * console.log('Vendor deleted successfully');
 * ```
 */
export async function deleteVendor(id: string): Promise<void> {
  await apiClient.delete(`${VENDORS_BASE_PATH}/${id}`);
}

// ============================================================================
// GET VENDOR WORK ORDERS
// ============================================================================

/**
 * Get work order history for a vendor
 *
 * @param id - Vendor UUID
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 10
 *
 * @returns Promise that resolves to paginated list of vendor's work orders
 *
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const workOrders = await getVendorWorkOrders(vendorId, 0, 10);
 * workOrders.data.content.forEach(wo => {
 *   console.log(`${wo.workOrderNumber}: ${wo.title} - ${wo.status}`);
 * });
 * ```
 */
export async function getVendorWorkOrders(
  id: string,
  page: number = 0,
  size: number = 10
): Promise<VendorWorkOrdersResponse> {
  const response = await apiClient.get<VendorWorkOrdersResponse>(
    `${VENDORS_BASE_PATH}/${id}/work-orders`,
    { params: { page, size } }
  );
  return response.data;
}

// ============================================================================
// CHECK EMAIL UNIQUENESS
// ============================================================================

/**
 * Check if an email is available for vendor registration
 *
 * @param email - Email address to check
 * @param excludeVendorId - Optional vendor ID to exclude (for updates)
 *
 * @returns Promise that resolves to true if email is available
 *
 * @example
 * ```typescript
 * // Check for new vendor
 * const isAvailable = await checkEmailAvailability('john@company.ae');
 *
 * // Check for update (exclude current vendor)
 * const isAvailableForUpdate = await checkEmailAvailability('john@company.ae', vendorId);
 * ```
 */
export async function checkEmailAvailability(
  email: string,
  excludeVendorId?: string
): Promise<boolean> {
  const params: Record<string, any> = { email };
  if (excludeVendorId) {
    params.excludeId = excludeVendorId;
  }

  try {
    const response = await apiClient.get<{ available: boolean }>(
      `${VENDORS_BASE_PATH}/check-email`,
      { params }
    );
    return response.data.available;
  } catch {
    // If endpoint doesn't exist, assume email is available
    // The backend will validate on submit
    return true;
  }
}

// ============================================================================
// GET ACTIVE VENDORS FOR DROPDOWN
// ============================================================================

/**
 * Get list of active vendors for assignment dropdowns
 *
 * @param serviceCategory - Optional service category to filter by
 *
 * @returns Promise that resolves to list of active vendors
 *
 * @example
 * ```typescript
 * // Get all active vendors
 * const vendors = await getActiveVendors();
 *
 * // Get plumbing vendors only
 * const plumbingVendors = await getActiveVendors('PLUMBING');
 * vendors.forEach(v => console.log(`${v.companyName} - Rating: ${v.rating}`));
 * ```
 */
export async function getActiveVendors(
  serviceCategory?: string
): Promise<VendorListItem[]> {
  const params: Record<string, any> = {
    status: 'ACTIVE',
    size: 100 // Get all for dropdown
  };

  if (serviceCategory) {
    params.serviceCategories = serviceCategory;
  }

  const response = await apiClient.get<VendorListResponse>(
    VENDORS_BASE_PATH,
    { params }
  );

  return response.data.data.content;
}

// ============================================================================
// VENDOR SERVICE OBJECT (Alternative export pattern)
// ============================================================================

/**
 * Vendor service object with all methods
 * Allows both named imports and object-style access
 */
export const vendorsService = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
  getVendorWorkOrders,
  checkEmailAvailability,
  getActiveVendors
};
