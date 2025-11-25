/**
 * PM Schedule API Service
 * Story 4.2: Preventive Maintenance Scheduling
 *
 * All PM schedule-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import type {
  PMSchedule,
  PMScheduleListItem,
  GeneratedWorkOrder,
  CreatePMScheduleDto,
  UpdatePMScheduleDto,
  PMScheduleFilters,
  PMScheduleResponse,
  CreatePMScheduleResponse,
  PMScheduleListResponse,
  GeneratedWorkOrdersResponse,
  GenerateNowResponse,
  PMScheduleStatus
} from '@/types/pm-schedule';

const PM_SCHEDULES_BASE_PATH = '/v1/pm-schedules';

// ============================================================================
// CREATE PM SCHEDULE
// ============================================================================

/**
 * Create a new preventive maintenance schedule
 *
 * @param data - PM schedule data (name, property, category, description, recurrence, etc.)
 *
 * @returns Promise that resolves to the created PM schedule summary
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const schedule = await createPMSchedule({
 *   scheduleName: 'HVAC Quarterly Inspection',
 *   propertyId: null, // All Properties
 *   category: 'HVAC',
 *   description: 'Quarterly inspection of all HVAC units including filter replacement...',
 *   recurrenceType: 'QUARTERLY',
 *   startDate: '2025-01-01',
 *   defaultPriority: 'MEDIUM',
 *   defaultAssigneeId: null
 * });
 *
 * console.log(schedule.id);
 * console.log(schedule.nextGenerationDate);
 * ```
 */
export async function createPMSchedule(
  data: CreatePMScheduleDto
): Promise<CreatePMScheduleResponse['data']> {
  const response = await apiClient.post<CreatePMScheduleResponse>(
    PM_SCHEDULES_BASE_PATH,
    data
  );

  return response.data.data;
}

// ============================================================================
// LIST PM SCHEDULES
// ============================================================================

/**
 * Get paginated list of PM schedules with filters
 *
 * @param filters - Optional filters (status, property, category, frequency, etc.)
 *
 * @returns Promise that resolves to paginated list of PMScheduleListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all active PM schedules
 * const response = await getPMSchedules({
 *   status: ['ACTIVE', 'PAUSED'],
 *   page: 0,
 *   size: 20
 * });
 *
 * // Filter by category and property
 * const hvacSchedules = await getPMSchedules({
 *   category: ['HVAC'],
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   sortBy: 'nextGenerationDate',
 *   sortDirection: 'ASC'
 * });
 * ```
 */
export async function getPMSchedules(filters?: PMScheduleFilters): Promise<PMScheduleListResponse> {
  const params: Record<string, string | number> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'nextGenerationDate',
    sortDirection: filters?.sortDirection ?? 'ASC'
  };

  // Add filters if provided
  if (filters?.status && filters.status.length > 0) {
    params.status = filters.status.join(',');
  }
  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.category && filters.category.length > 0) {
    params.category = filters.category.join(',');
  }
  if (filters?.recurrenceType && filters.recurrenceType.length > 0) {
    params.frequency = filters.recurrenceType.join(',');
  }
  if (filters?.search) {
    params.search = filters.search;
  }

  const response = await apiClient.get<PMScheduleListResponse>(
    PM_SCHEDULES_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET PM SCHEDULE BY ID
// ============================================================================

/**
 * Get PM schedule details by ID
 *
 * @param id - PM schedule UUID
 *
 * @returns Promise that resolves to full PMSchedule details with statistics
 *
 * @throws {EntityNotFoundException} When PM schedule not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks access to this PM schedule (403)
 *
 * @example
 * ```typescript
 * const schedule = await getPMScheduleById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(schedule.scheduleName);
 * console.log(schedule.statistics?.totalGenerated);
 * ```
 */
export async function getPMScheduleById(id: string): Promise<PMSchedule> {
  const response = await apiClient.get<PMScheduleResponse>(`${PM_SCHEDULES_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// UPDATE PM SCHEDULE
// ============================================================================

/**
 * Update PM schedule details (partial updates supported)
 * Note: propertyId, recurrenceType, and startDate cannot be updated
 *
 * @param id - PM schedule UUID
 * @param data - Updated PM schedule data (only editable fields)
 *
 * @returns Promise that resolves to updated PMSchedule
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When PM schedule not found (404)
 * @throws {ForbiddenException} When user lacks permission or schedule is COMPLETED (403)
 *
 * @example
 * ```typescript
 * const updated = await updatePMSchedule(scheduleId, {
 *   scheduleName: 'Updated HVAC Inspection',
 *   defaultPriority: 'HIGH',
 *   endDate: '2026-12-31'
 * });
 * ```
 */
export async function updatePMSchedule(
  id: string,
  data: UpdatePMScheduleDto
): Promise<PMSchedule> {
  const response = await apiClient.put<PMScheduleResponse>(
    `${PM_SCHEDULES_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// UPDATE PM SCHEDULE STATUS
// ============================================================================

/**
 * Update PM schedule status (pause, resume, complete)
 *
 * @param id - PM schedule UUID
 * @param status - New status (ACTIVE, PAUSED, or COMPLETED)
 *
 * @returns Promise that resolves to updated PMSchedule
 *
 * @throws {ValidationException} When invalid status transition (400)
 * @throws {EntityNotFoundException} When PM schedule not found (404)
 *
 * @example
 * ```typescript
 * // Pause a schedule
 * const paused = await updatePMScheduleStatus(scheduleId, 'PAUSED');
 *
 * // Resume a paused schedule
 * const resumed = await updatePMScheduleStatus(scheduleId, 'ACTIVE');
 *
 * // Complete a schedule
 * const completed = await updatePMScheduleStatus(scheduleId, 'COMPLETED');
 * ```
 */
export async function updatePMScheduleStatus(
  id: string,
  status: PMScheduleStatus
): Promise<PMSchedule> {
  const response = await apiClient.patch<PMScheduleResponse>(
    `${PM_SCHEDULES_BASE_PATH}/${id}/status`,
    { status }
  );
  return response.data.data;
}

// ============================================================================
// GENERATE WORK ORDER NOW
// ============================================================================

/**
 * Manually generate a work order from PM schedule immediately
 * Note: This does NOT affect the nextGenerationDate (manual generation is extra)
 *
 * @param id - PM schedule UUID
 *
 * @returns Promise that resolves to generated work order info (id and number)
 *
 * @throws {EntityNotFoundException} When PM schedule not found (404)
 * @throws {ValidationException} When schedule is not ACTIVE (400)
 *
 * @example
 * ```typescript
 * const result = await generateWorkOrderNow(scheduleId);
 * console.log(`Work Order ${result.workOrderNumber} generated`);
 * // Navigate to work order: /property-manager/work-orders/${result.workOrderId}
 * ```
 */
export async function generateWorkOrderNow(
  id: string
): Promise<GenerateNowResponse['data']> {
  const response = await apiClient.post<GenerateNowResponse>(
    `${PM_SCHEDULES_BASE_PATH}/${id}/generate-now`
  );
  return response.data.data;
}

// ============================================================================
// GET GENERATED WORK ORDERS HISTORY
// ============================================================================

/**
 * Get paginated history of work orders generated from this PM schedule
 *
 * @param id - PM schedule UUID
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 10
 *
 * @returns Promise that resolves to paginated list of generated work orders
 *
 * @throws {EntityNotFoundException} When PM schedule not found (404)
 *
 * @example
 * ```typescript
 * const history = await getPMScheduleHistory(scheduleId, 0, 10);
 * history.data.forEach(wo => {
 *   console.log(`${wo.workOrderNumber} - ${wo.status}`);
 *   if (wo.isOverdue) console.log('OVERDUE!');
 * });
 * ```
 */
export async function getPMScheduleHistory(
  id: string,
  page: number = 0,
  size: number = 10
): Promise<GeneratedWorkOrdersResponse> {
  const response = await apiClient.get<GeneratedWorkOrdersResponse>(
    `${PM_SCHEDULES_BASE_PATH}/${id}/history`,
    { params: { page, size } }
  );
  return response.data;
}

// ============================================================================
// DELETE PM SCHEDULE
// ============================================================================

/**
 * Soft delete a PM schedule (only if no work orders have been generated)
 *
 * @param id - PM schedule UUID
 *
 * @returns Promise that resolves when deletion succeeds
 *
 * @throws {EntityNotFoundException} When PM schedule not found (404)
 * @throws {ValidationException} When work orders have been generated (400)
 * @throws {ForbiddenException} When user lacks permission (403)
 *
 * @example
 * ```typescript
 * await deletePMSchedule(scheduleId);
 * console.log('PM schedule deleted successfully');
 * ```
 */
export async function deletePMSchedule(id: string): Promise<void> {
  await apiClient.delete(`${PM_SCHEDULES_BASE_PATH}/${id}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data dates to ISO string format for API submission
 *
 * @param formData - Form data with Date objects
 * @returns API-ready data with ISO date strings
 */
export function prepareCreatePMScheduleData(formData: {
  scheduleName: string;
  propertyId: string | null;
  category: string;
  description: string;
  recurrenceType: string;
  startDate: Date;
  endDate?: Date | null;
  defaultPriority: string;
  defaultAssigneeId?: string | null;
}): CreatePMScheduleDto {
  return {
    scheduleName: formData.scheduleName,
    propertyId: formData.propertyId,
    category: formData.category as CreatePMScheduleDto['category'],
    description: formData.description,
    recurrenceType: formData.recurrenceType as CreatePMScheduleDto['recurrenceType'],
    startDate: format(formData.startDate, 'yyyy-MM-dd'),
    endDate: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
    defaultPriority: formData.defaultPriority as CreatePMScheduleDto['defaultPriority'],
    defaultAssigneeId: formData.defaultAssigneeId ?? null
  };
}

/**
 * Convert form data for update API submission
 *
 * @param formData - Form data with optional Date objects
 * @returns API-ready data with ISO date strings
 */
export function prepareUpdatePMScheduleData(formData: {
  scheduleName?: string;
  description?: string;
  category?: string;
  defaultPriority?: string;
  defaultAssigneeId?: string | null;
  endDate?: Date | null;
}): UpdatePMScheduleDto {
  const data: UpdatePMScheduleDto = {};

  if (formData.scheduleName !== undefined) {
    data.scheduleName = formData.scheduleName;
  }
  if (formData.description !== undefined) {
    data.description = formData.description;
  }
  if (formData.category !== undefined) {
    data.category = formData.category as UpdatePMScheduleDto['category'];
  }
  if (formData.defaultPriority !== undefined) {
    data.defaultPriority = formData.defaultPriority as UpdatePMScheduleDto['defaultPriority'];
  }
  if (formData.defaultAssigneeId !== undefined) {
    data.defaultAssigneeId = formData.defaultAssigneeId;
  }
  if (formData.endDate !== undefined) {
    data.endDate = formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null;
  }

  return data;
}
