/**
 * Parking Spot Inventory Management API Service
 * Story 3.8: Parking Spot Inventory Management
 *
 * All parking spot-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  ParkingSpot,
  ParkingSpotListResponse,
  ParkingSpotFilters,
  ParkingSpotStatus,
  CreateParkingSpotRequest,
  UpdateParkingSpotRequest,
  ChangeParkingSpotStatusRequest,
  BulkDeleteParkingSpotRequest,
  BulkStatusChangeParkingSpotRequest,
  BulkOperationResponse
} from '@/types/parking';

const PARKING_SPOTS_BASE_PATH = '/v1/parking-spots';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get paginated list of parking spots
 *
 * @param filters - Optional filters (propertyId, status, search, pagination)
 *
 * @returns Promise that resolves to paginated parking spot list
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const parkingSpots = await getParkingSpots({
 *   propertyId: 'prop-uuid',
 *   status: ParkingSpotStatus.AVAILABLE,
 *   page: 0,
 *   size: 20
 * });
 *
 * console.log(parkingSpots.content); // Array of ParkingSpot
 * console.log(parkingSpots.totalElements); // Total count
 * ```
 */
export async function getParkingSpots(
  filters?: Partial<ParkingSpotFilters>
): Promise<ParkingSpotListResponse> {
  const params: Record<string, string | number | undefined> = {};

  if (filters) {
    if (filters.propertyId) params.propertyId = filters.propertyId;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.size !== undefined) params.size = filters.size;
    if (filters.sort) params.sort = filters.sort;
  }

  const response = await apiClient.get<{ success: boolean; data: ParkingSpotListResponse }>(
    PARKING_SPOTS_BASE_PATH,
    { params }
  );
  return response.data.data;
}

/**
 * Get single parking spot by ID
 *
 * @param id - UUID of the parking spot
 *
 * @returns Promise that resolves to parking spot details
 *
 * @throws {NotFoundException} When parking spot not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const spot = await getParkingSpotById('spot-uuid');
 * console.log(spot.spotNumber); // "P2-115"
 * ```
 */
export async function getParkingSpotById(id: string): Promise<ParkingSpot> {
  const response = await apiClient.get<{ success: boolean; data: ParkingSpot }>(
    `${PARKING_SPOTS_BASE_PATH}/${id}`
  );
  return response.data.data;
}

/**
 * Create a new parking spot
 *
 * @param data - Parking spot creation data
 *
 * @returns Promise that resolves to created parking spot
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When spot number already exists in building (409)
 * @throws {NotFoundException} When property not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER, ADMIN, or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const newSpot = await createParkingSpot({
 *   propertyId: 'prop-uuid',
 *   spotNumber: 'P2-116',
 *   defaultFee: 500
 * });
 *
 * console.log(newSpot.id); // UUID of created spot
 * ```
 */
export async function createParkingSpot(
  data: CreateParkingSpotRequest
): Promise<ParkingSpot> {
  const response = await apiClient.post<{ success: boolean; data: ParkingSpot }>(
    PARKING_SPOTS_BASE_PATH,
    data
  );
  return response.data.data;
}

/**
 * Update an existing parking spot
 *
 * @param id - UUID of the parking spot
 * @param data - Parking spot update data
 *
 * @returns Promise that resolves to updated parking spot
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When spot number already exists in building (409)
 * @throws {NotFoundException} When parking spot not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER, ADMIN, or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const updatedSpot = await updateParkingSpot('spot-uuid', {
 *   defaultFee: 600,
 *   notes: 'Near elevator'
 * });
 * ```
 */
export async function updateParkingSpot(
  id: string,
  data: UpdateParkingSpotRequest
): Promise<ParkingSpot> {
  const response = await apiClient.put<{ success: boolean; data: ParkingSpot }>(
    `${PARKING_SPOTS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

/**
 * Delete (soft delete) a parking spot
 *
 * @param id - UUID of the parking spot
 *
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {ValidationException} When spot is ASSIGNED and cannot be deleted (400)
 * @throws {NotFoundException} When parking spot not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER, ADMIN, or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * await deleteParkingSpot('spot-uuid');
 * ```
 */
export async function deleteParkingSpot(id: string): Promise<void> {
  await apiClient.delete(`${PARKING_SPOTS_BASE_PATH}/${id}`);
}

// ============================================================================
// STATUS OPERATIONS
// ============================================================================

/**
 * Change parking spot status
 *
 * @param id - UUID of the parking spot
 * @param data - Status change request (AVAILABLE or UNDER_MAINTENANCE only)
 *
 * @returns Promise that resolves to updated parking spot
 *
 * @throws {ValidationException} When spot is ASSIGNED and status cannot be changed (400)
 * @throws {NotFoundException} When parking spot not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER, ADMIN, or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const updatedSpot = await changeParkingSpotStatus('spot-uuid', {
 *   status: ParkingSpotStatus.UNDER_MAINTENANCE
 * });
 * ```
 */
export async function changeParkingSpotStatus(
  id: string,
  data: ChangeParkingSpotStatusRequest
): Promise<ParkingSpot> {
  const response = await apiClient.patch<{ success: boolean; data: ParkingSpot }>(
    `${PARKING_SPOTS_BASE_PATH}/${id}/status`,
    data
  );
  return response.data.data;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk delete parking spots
 *
 * @param data - Request with array of IDs to delete
 *
 * @returns Promise that resolves to bulk operation result
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER, ADMIN, or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const result = await bulkDeleteParkingSpots({
 *   ids: ['spot-1-uuid', 'spot-2-uuid', 'spot-3-uuid']
 * });
 *
 * console.log(result.successCount); // 2 (if 1 was ASSIGNED)
 * console.log(result.failedIds); // ['spot-3-uuid']
 * ```
 */
export async function bulkDeleteParkingSpots(
  data: BulkDeleteParkingSpotRequest
): Promise<BulkOperationResponse> {
  const response = await apiClient.post<{ success: boolean; data: BulkOperationResponse }>(
    `${PARKING_SPOTS_BASE_PATH}/bulk-delete`,
    data
  );
  return response.data.data;
}

/**
 * Bulk change status of parking spots
 *
 * @param data - Request with array of IDs and new status
 *
 * @returns Promise that resolves to bulk operation result
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER, ADMIN, or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const result = await bulkChangeParkingSpotStatus({
 *   ids: ['spot-1-uuid', 'spot-2-uuid'],
 *   status: ParkingSpotStatus.UNDER_MAINTENANCE
 * });
 *
 * console.log(result.successCount); // 2
 * ```
 */
export async function bulkChangeParkingSpotStatus(
  data: BulkStatusChangeParkingSpotRequest
): Promise<BulkOperationResponse> {
  const response = await apiClient.post<{ success: boolean; data: BulkOperationResponse }>(
    `${PARKING_SPOTS_BASE_PATH}/bulk-status`,
    data
  );
  return response.data.data;
}

// ============================================================================
// AVAILABLE SPOTS (For allocation dropdowns)
// ============================================================================

/**
 * Get available parking spots for a property
 * Used in tenant onboarding to populate parking allocation dropdown
 *
 * @param propertyId - UUID of the property
 *
 * @returns Promise that resolves to array of available parking spots
 *
 * @throws {NotFoundException} When property not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const availableSpots = await getAvailableParkingSpots('prop-uuid');
 *
 * availableSpots.forEach(spot => {
 *   console.log(`${spot.spotNumber} - AED ${spot.defaultFee}`);
 * });
 * ```
 */
export async function getAvailableParkingSpots(propertyId: string): Promise<ParkingSpot[]> {
  const response = await apiClient.get<{ success: boolean; data: ParkingSpot[] }>(
    `${PARKING_SPOTS_BASE_PATH}/available`,
    { params: { propertyId } }
  );
  return response.data.data;
}

/**
 * Get parking spots for a specific property
 * Used to view all spots in a building
 *
 * @param propertyId - UUID of the property
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 *
 * @returns Promise that resolves to paginated parking spot list
 *
 * @throws {NotFoundException} When property not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const propertySpots = await getParkingSpotsByProperty('prop-uuid', 0, 20);
 * ```
 */
export async function getParkingSpotsByProperty(
  propertyId: string,
  page: number = 0,
  size: number = 20
): Promise<ParkingSpotListResponse> {
  const response = await apiClient.get<{ success: boolean; data: ParkingSpotListResponse }>(
    `/v1/properties/${propertyId}/parking-spots`,
    { params: { page, size } }
  );
  return response.data.data;
}

// ============================================================================
// STATISTICS (Optional - for dashboard)
// ============================================================================

/**
 * Get parking spot counts by status
 *
 * @param propertyId - Optional property filter
 *
 * @returns Promise that resolves to counts per status
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const counts = await getParkingSpotCounts();
 * console.log(counts.AVAILABLE); // 45
 * console.log(counts.ASSIGNED); // 23
 * ```
 */
export async function getParkingSpotCounts(
  propertyId?: string
): Promise<Record<ParkingSpotStatus, number>> {
  const response = await apiClient.get<{
    success: boolean;
    data: Record<ParkingSpotStatus, number>;
  }>(`${PARKING_SPOTS_BASE_PATH}/counts`, {
    params: propertyId ? { propertyId } : undefined
  });
  return response.data.data;
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

/**
 * Parking Spot Service
 * Provides all parking spot management API operations
 */
export const parkingSpotService = {
  // CRUD
  getParkingSpots,
  getParkingSpotById,
  createParkingSpot,
  updateParkingSpot,
  deleteParkingSpot,

  // Status
  changeParkingSpotStatus,

  // Bulk operations
  bulkDeleteParkingSpots,
  bulkChangeParkingSpotStatus,

  // Available spots
  getAvailableParkingSpots,
  getParkingSpotsByProperty,

  // Statistics
  getParkingSpotCounts
};

export default parkingSpotService;
