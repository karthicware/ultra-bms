/**
 * Unit Management API Service
 * All unit management-related API calls including bulk operations and status management
 */

import { apiClient } from '@/lib/api';
import { UnitStatus } from '@/types/units';
import type {
  Unit,
  UnitResponse,
  UnitListResponse,
  CreateUnitRequest,
  UpdateUnitRequest,
  UpdateUnitStatusRequest,
  BulkCreateUnitsRequest,
  BulkUpdateStatusRequest,
  BulkUpdateResult,
  BulkCreateResult,
  UnitSearchParams,
  UnitHistory,
} from '@/types';

const UNITS_BASE_PATH = '/v1/units';

/**
 * Create a new unit in a property
 *
 * @param data - Unit creation data
 * @param data.propertyId - UUID of the property (required)
 * @param data.unitNumber - Unit number (1-50 characters, alphanumeric + hyphens, required)
 * @param data.floor - Floor number (-5 to 200, optional)
 * @param data.bedroomCount - Number of bedrooms (0-20, required)
 * @param data.bathroomCount - Number of bathrooms (0.5-20, in 0.5 increments, required)
 * @param data.squareFootage - Square footage (100-50,000, optional)
 * @param data.monthlyRent - Monthly rent in AED (500-1,000,000, required)
 * @param data.status - Initial status (default: AVAILABLE)
 * @param data.features - JSON object with unit features (optional)
 *
 * @returns Promise that resolves to the created Unit object
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When unit number already exists in property (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const unit = await createUnit({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   unitNumber: '501',
 *   floor: 5,
 *   bedroomCount: 2,
 *   bathroomCount: 2,
 *   squareFootage: 1250,
 *   monthlyRent: 85000,
 *   features: { balcony: true, view: 'Marina', furnished: false }
 * });
 * ```
 */
export async function createUnit(data: CreateUnitRequest): Promise<Unit> {
  const response = await apiClient.post<{ data: Unit }>(UNITS_BASE_PATH, data);
  return response.data.data;
}

/**
 * Bulk create multiple units with auto-incrementing unit numbers
 *
 * @param data - Bulk creation data
 * @param data.propertyId - UUID of the property (required)
 * @param data.startingUnitNumber - First unit number (required)
 * @param data.count - Number of units to create (2-500, required)
 * @param data.floor - Floor number (required for bulk)
 * @param data.incrementPattern - SEQUENTIAL, FLOOR_BASED, or CUSTOM (required)
 * @param data.bedroomCount - Number of bedrooms for all units (required)
 * @param data.bathroomCount - Number of bathrooms for all units (required)
 * @param data.squareFootage - Square footage for all units (optional)
 * @param data.monthlyRent - Monthly rent for all units (required)
 * @param data.features - Features to apply to all units (optional)
 *
 * @returns Promise that resolves to BulkCreateResult with success/failure details
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When any unit number already exists (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Create units 501-520 on floor 5
 * const result = await bulkCreateUnits({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   startingUnitNumber: '501',
 *   count: 20,
 *   floor: 5,
 *   incrementPattern: 'SEQUENTIAL',
 *   bedroomCount: 2,
 *   bathroomCount: 2,
 *   squareFootage: 1200,
 *   monthlyRent: 85000
 * });
 * console.log(`Created ${result.successCount} units`);
 * if (result.failureCount > 0) {
 *   console.error('Failures:', result.failures);
 * }
 * ```
 */
export async function bulkCreateUnits(data: BulkCreateUnitsRequest): Promise<BulkCreateResult> {
  const response = await apiClient.post<{ data: BulkCreateResult }>(
    `${UNITS_BASE_PATH}/bulk-create`,
    data
  );
  return response.data.data;
}

/**
 * Get list of units with filters and search
 *
 * @param params - Search and filter parameters
 * @param params.propertyId - Filter by property UUID
 * @param params.status - Array of statuses to filter by
 * @param params.floorMin - Minimum floor number
 * @param params.floorMax - Maximum floor number
 * @param params.bedroomCount - Array of bedroom counts to filter by
 * @param params.rentMin - Minimum monthly rent
 * @param params.rentMax - Maximum monthly rent
 * @param params.search - Search term for unit number
 *
 * @returns Promise that resolves to unit list with total count
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all 2BR units on floors 5-10 under AED 90,000
 * const units = await getUnits({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   bedroomCount: [2],
 *   floorMin: 5,
 *   floorMax: 10,
 *   rentMax: 90000
 * });
 * ```
 */
export async function getUnits(params?: UnitSearchParams): Promise<UnitListResponse> {
  const response = await apiClient.get<UnitListResponse>(UNITS_BASE_PATH, { params });
  return response.data;
}

/**
 * Get units for a specific property
 *
 * @param propertyId - Property UUID
 * @param filters - Optional filters (status, floor range, bedroom count, rent range)
 *
 * @returns Promise that resolves to array of units in the property
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const units = await getUnitsByProperty('550e8400-e29b-41d4-a716-446655440000', {
 *   status: ['AVAILABLE', 'RESERVED']
 * });
 * ```
 */
export async function getUnitsByProperty(
  propertyId: string,
  filters?: UnitSearchParams
): Promise<Unit[]> {
  const response = await apiClient.get<{ data: { content: Unit[] } }>(
    `${UNITS_BASE_PATH}/property/${propertyId}`,
    { params: { ...filters, size: 1000 } } // Fetch all units for the property
  );
  return response.data.data.content;
}

/**
 * Get a single unit by ID with complete details
 *
 * @param id - Unit UUID
 *
 * @returns Promise that resolves to UnitResponse with property, tenant, and history
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When unit ID does not exist (404)
 *
 * @example
 * ```typescript
 * const unit = await getUnitById('unit-uuid');
 * console.log(unit.propertyName); // "Marina Heights Tower"
 * console.log(unit.tenant?.name); // "Ahmed Hassan" (if occupied)
 * console.log(unit.history?.length); // Number of status changes
 * ```
 */
export async function getUnitById(id: string): Promise<UnitResponse> {
  const response = await apiClient.get<{ data: UnitResponse }>(`${UNITS_BASE_PATH}/${id}`);
  return response.data.data;
}

/**
 * Update an existing unit (partial update supported)
 *
 * @param id - Unit UUID
 * @param data - Unit update data (partial)
 *
 * @returns Promise that resolves to updated Unit object
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When updated unit number already exists (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When unit ID does not exist (404)
 *
 * @example
 * ```typescript
 * const updated = await updateUnit('unit-uuid', {
 *   monthlyRent: 90000,
 *   features: { balcony: true, view: 'Marina', furnished: true }
 * });
 * ```
 */
export async function updateUnit(id: string, data: UpdateUnitRequest): Promise<Unit> {
  const response = await apiClient.put<{ data: Unit }>(`${UNITS_BASE_PATH}/${id}`, data);
  return response.data.data;
}

/**
 * Update unit status with reason tracking
 *
 * @param id - Unit UUID
 * @param data - Status update data
 * @param data.status - New status (must be valid transition)
 * @param data.reason - Reason for status change (required for some transitions)
 *
 * @returns Promise that resolves to updated Unit object
 *
 * @throws {ValidationException} When validation fails or invalid transition (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When unit ID does not exist (404)
 *
 * @example
 * ```typescript
 * const updated = await updateUnitStatus('unit-uuid', {
 *   status: 'UNDER_MAINTENANCE',
 *   reason: 'AC system repair required'
 * });
 * ```
 */
export async function updateUnitStatus(
  id: string,
  data: UpdateUnitStatusRequest
): Promise<Unit> {
  const response = await apiClient.patch<{ data: Unit }>(
    `${UNITS_BASE_PATH}/${id}/status`,
    data
  );
  return response.data.data;
}

/**
 * Bulk update status for multiple units
 *
 * @param data - Bulk status update data
 * @param data.unitIds - Array of unit UUIDs (1-100, required)
 * @param data.newStatus - New status to apply to all units (required)
 * @param data.reason - Reason for status change (optional)
 *
 * @returns Promise that resolves to BulkUpdateResult with success/failure details
 *
 * @throws {ValidationException} When validation fails or invalid transitions (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const result = await bulkUpdateUnitStatus({
 *   unitIds: ['uuid1', 'uuid2', 'uuid3'],
 *   newStatus: 'UNDER_MAINTENANCE',
 *   reason: 'Annual inspection and maintenance'
 * });
 * console.log(`Updated ${result.successCount} units`);
 * if (result.failureCount > 0) {
 *   result.failures?.forEach(f => {
 *     console.error(`Failed to update ${f.unitNumber}: ${f.reason}`);
 *   });
 * }
 * ```
 */
export async function bulkUpdateUnitStatus(
  data: BulkUpdateStatusRequest
): Promise<BulkUpdateResult> {
  const response = await apiClient.patch<{ data: BulkUpdateResult }>(
    `${UNITS_BASE_PATH}/bulk-status`,
    data
  );
  return response.data.data;
}

/**
 * Soft delete a unit (marks as inactive, does not permanently delete)
 *
 * @param id - Unit UUID
 *
 * @returns Promise that resolves when deletion is successful
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When unit ID does not exist (404)
 * @throws {ConflictException} When unit has active lease (409)
 *
 * @example
 * ```typescript
 * await deleteUnit('unit-uuid');
 * ```
 */
export async function deleteUnit(id: string): Promise<void> {
  await apiClient.delete(`${UNITS_BASE_PATH}/${id}`);
}

/**
 * Get status change history for a unit
 *
 * @param id - Unit UUID
 *
 * @returns Promise that resolves to array of UnitHistory records sorted by date (newest first)
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When unit ID does not exist (404)
 *
 * @example
 * ```typescript
 * const history = await getUnitHistory('unit-uuid');
 * history.forEach(change => {
 *   console.log(`${change.changedAt}: ${change.oldStatus} → ${change.newStatus}`);
 *   console.log(`Reason: ${change.reason || 'N/A'}`);
 *   console.log(`Changed by: ${change.changedByName}`);
 * });
 * ```
 */
export async function getUnitHistory(id: string): Promise<UnitHistory[]> {
  const response = await apiClient.get<{ data: UnitHistory[] }>(
    `${UNITS_BASE_PATH}/${id}/history`
  );
  return response.data.data;
}

/**
 * Get available units for a property (status = AVAILABLE)
 *
 * @param propertyId - Property UUID
 *
 * @returns Promise that resolves to array of available units
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const availableUnits = await getAvailableUnits('property-uuid');
 * console.log(`${availableUnits.length} units available`);
 * ```
 */
export async function getAvailableUnits(propertyId: string): Promise<Unit[]> {
  return getUnitsByProperty(propertyId, { status: [UnitStatus.AVAILABLE] });
}

/**
 * Get unit status distribution for a property
 *
 * @param propertyId - Property UUID
 *
 * @returns Promise that resolves to status counts
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property ID does not exist (404)
 *
 * @example
 * ```typescript
 * const distribution = await getUnitStatusDistribution('property-uuid');
 * console.log(`Available: ${distribution.available}`);
 * console.log(`Occupied: ${distribution.occupied}`);
 * console.log(`Under Maintenance: ${distribution.underMaintenance}`);
 * console.log(`Reserved: ${distribution.reserved}`);
 * ```
 */
export async function getUnitStatusDistribution(propertyId: string): Promise<{
  available: number;
  occupied: number;
  underMaintenance: number;
  reserved: number;
  total: number;
}> {
  const response = await apiClient.get<{
    data: {
      available: number;
      occupied: number;
      underMaintenance: number;
      reserved: number;
      total: number;
    };
  }>(`${UNITS_BASE_PATH}/property/${propertyId}/status-distribution`);
  return response.data.data;
}

/**
 * Check if a status transition is valid for a unit
 *
 * @param currentStatus - Current unit status
 * @param newStatus - Desired new status
 *
 * @returns Boolean indicating if transition is valid
 *
 * @example
 * ```typescript
 * if (isValidStatusTransition('AVAILABLE', 'OCCUPIED')) {
 *   await updateUnitStatus(unitId, { status: 'OCCUPIED' });
 * }
 * ```
 */
export function isValidStatusTransition(
  currentStatus: UnitStatus,
  newStatus: UnitStatus
): boolean {
  const transitions: Record<UnitStatus, UnitStatus[]> = {
    [UnitStatus.AVAILABLE]: [UnitStatus.RESERVED, UnitStatus.UNDER_MAINTENANCE],
    [UnitStatus.RESERVED]: [UnitStatus.OCCUPIED, UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE],
    [UnitStatus.OCCUPIED]: [UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE],
    [UnitStatus.UNDER_MAINTENANCE]: [UnitStatus.AVAILABLE, UnitStatus.RESERVED],
  };

  return transitions[currentStatus]?.includes(newStatus) ?? false;
}
