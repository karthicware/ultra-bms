/**
 * Maintenance Request API Service
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * All maintenance request-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  MaintenanceRequest,
  MaintenanceRequestResponse,
  MaintenanceRequestListItem,
  CreateMaintenanceRequestDto,
  SubmitFeedbackDto,
  MaintenanceRequestFilters,
  PaginatedResponse,
  ApiResponse
} from '@/types';

const MAINTENANCE_BASE_PATH = '/v1/maintenance-requests';

// ============================================================================
// CREATE REQUEST
// ============================================================================

/**
 * Create a new maintenance request with file uploads
 *
 * @param data - Request data (category, priority, title, description, preferredAccessTime, preferredAccessDate)
 * @param files - Array of image files (max 5, JPG/PNG, max 5MB each, will be compressed client-side)
 *
 * @returns Promise that resolves to the created MaintenanceRequestResponse with requestNumber
 *
 * @throws {ValidationException} When validation fails (400):
 *   - Title required
 *   - Description min 20 chars, max 1000 chars
 *   - Invalid file type (only JPG/PNG allowed)
 *   - File size exceeds 5MB
 *   - More than 5 files
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {PayloadTooLargeException} When total file size exceeds limit (413)
 *
 * @example
 * ```typescript
 * const request = await createMaintenanceRequest({
 *   category: 'PLUMBING',
 *   priority: 'HIGH',
 *   title: 'Leaking kitchen faucet',
 *   description: 'Water dripping from kitchen faucet handle. Started 2 days ago and getting worse.',
 *   preferredAccessTime: 'MORNING',
 *   preferredAccessDate: '2025-11-17'
 * }, [imageFile1, imageFile2]);
 *
 * console.log(request.requestNumber); // "MR-2025-0001"
 * console.log(request.status); // "SUBMITTED"
 * ```
 */
export async function createMaintenanceRequest(
  data: CreateMaintenanceRequestDto,
  files?: File[]
): Promise<MaintenanceRequestResponse> {
  const formData = new FormData();

  // Append request data as JSON blob
  formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  // Append files if provided
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await apiClient.post<ApiResponse<MaintenanceRequestResponse>>(
    MAINTENANCE_BASE_PATH,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data!;
}

// ============================================================================
// LIST REQUESTS
// ============================================================================

/**
 * Get paginated list of tenant's maintenance requests with filters
 *
 * @param filters - Optional filters (status, category, search, dateRange)
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size (max 100), default 10
 * @param sort - Sort field, default 'submittedAt'
 * @param direction - Sort direction ('ASC' or 'DESC'), default 'DESC'
 *
 * @returns Promise that resolves to paginated list of MaintenanceRequestListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all requests (newest first)
 * const response = await getMaintenanceRequests();
 *
 * // Filter by status and category
 * const openRequests = await getMaintenanceRequests({
 *   status: ['SUBMITTED', 'ASSIGNED'],
 *   category: ['PLUMBING', 'ELECTRICAL']
 * });
 *
 * // Search by title
 * const searchResults = await getMaintenanceRequests({
 *   search: 'faucet'
 * }, 0, 20);
 * ```
 */
export async function getMaintenanceRequests(
  filters?: MaintenanceRequestFilters,
  page: number = 0,
  size: number = 10,
  sort: string = 'submittedAt',
  direction: 'ASC' | 'DESC' = 'DESC'
): Promise<PaginatedResponse<MaintenanceRequestListItem>> {
  const params: Record<string, any> = {
    page,
    size,
    sort,
    direction,
  };

  // Add filters if provided
  if (filters?.status && filters.status.length > 0) {
    params.status = filters.status.join(',');
  }
  if (filters?.category && filters.category.length > 0) {
    params.category = filters.category.join(',');
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters?.dateTo) {
    params.dateTo = filters.dateTo;
  }

  const response = await apiClient.get<ApiResponse<PaginatedResponse<MaintenanceRequestListItem>>>(
    MAINTENANCE_BASE_PATH,
    { params }
  );

  return response.data.data!;
}

// ============================================================================
// GET REQUEST DETAILS
// ============================================================================

/**
 * Get detailed maintenance request by ID
 *
 * @param id - Request ID (UUID)
 *
 * @returns Promise that resolves to complete MaintenanceRequest with all details
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When trying to view another tenant's request (403)
 * @throws {NotFoundException} When request ID does not exist (404)
 *
 * @example
 * ```typescript
 * const request = await getMaintenanceRequestById('550e8400-e29b-41d4-a716-446655440000');
 *
 * console.log(request.title); // "Leaking kitchen faucet"
 * console.log(request.status); // "ASSIGNED"
 * console.log(request.assignedVendorName); // "ABC Plumbing"
 * console.log(request.attachments); // ["/uploads/maintenance/..."]
 * ```
 */
export async function getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
  const response = await apiClient.get<ApiResponse<MaintenanceRequest>>(
    `${MAINTENANCE_BASE_PATH}/${id}`
  );

  return response.data.data!;
}

// ============================================================================
// SUBMIT FEEDBACK
// ============================================================================

/**
 * Submit tenant feedback (rating and comment) after request completion
 *
 * @param id - Request ID (UUID)
 * @param feedback - Feedback data with rating (1-5) and optional comment (max 500 chars)
 *
 * @returns Promise that resolves to updated MaintenanceRequest with feedback
 *
 * @throws {ValidationException} When validation fails (400):
 *   - Rating must be 1-5
 *   - Comment max 500 characters
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When trying to submit feedback for another tenant's request (403)
 * @throws {NotFoundException} When request ID does not exist (404)
 * @throws {ConflictException} When request status is not COMPLETED or feedback already submitted (409)
 *
 * @example
 * ```typescript
 * const result = await submitMaintenanceRequestFeedback(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   {
 *     rating: 5,
 *     comment: 'Quick response and excellent service. The technician was very professional.'
 *   }
 * );
 *
 * console.log(result.rating); // 5
 * console.log(result.feedbackSubmittedAt); // "2025-11-18T14:30:00Z"
 * ```
 */
export async function submitMaintenanceRequestFeedback(
  id: string,
  feedback: SubmitFeedbackDto
): Promise<MaintenanceRequest> {
  const response = await apiClient.post<ApiResponse<MaintenanceRequest>>(
    `${MAINTENANCE_BASE_PATH}/${id}/feedback`,
    feedback
  );

  return response.data.data!;
}

// ============================================================================
// CANCEL REQUEST
// ============================================================================

/**
 * Cancel maintenance request (only if status = SUBMITTED)
 *
 * @param id - Request ID (UUID)
 *
 * @returns Promise that resolves when cancellation is successful
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When trying to cancel another tenant's request (403)
 * @throws {NotFoundException} When request ID does not exist (404)
 * @throws {ConflictException} When trying to cancel request with status other than SUBMITTED (409)
 *   - Error message: "Cannot cancel request with status: ASSIGNED"
 *   - Note: Assigned/In Progress requests must be cancelled by property manager
 *
 * @example
 * ```typescript
 * try {
 *   await cancelMaintenanceRequest('550e8400-e29b-41d4-a716-446655440000');
 *   toast.success('Request cancelled successfully');
 *   router.push('/tenant/requests');
 * } catch (error) {
 *   if (error.response?.status === 409) {
 *     toast.error('Cannot cancel: request has already been assigned');
 *   }
 * }
 * ```
 */
export async function cancelMaintenanceRequest(id: string): Promise<void> {
  await apiClient.delete(`${MAINTENANCE_BASE_PATH}/${id}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get suggested priority based on category
 * Used for auto-suggesting priority when category changes
 *
 * @param category - Maintenance category
 * @returns Suggested priority (HIGH, MEDIUM, or LOW)
 *
 * @example
 * ```typescript
 * const priority = getSuggestedPriority('ELECTRICAL'); // 'HIGH'
 * const priority = getSuggestedPriority('PLUMBING'); // 'MEDIUM'
 * const priority = getSuggestedPriority('CLEANING'); // 'LOW'
 * ```
 */
export function getSuggestedPriority(category: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const highPriorityCategories = ['ELECTRICAL', 'HVAC', 'PEST_CONTROL'];
  const lowPriorityCategories = ['CLEANING', 'OTHER'];

  if (highPriorityCategories.includes(category)) {
    return 'HIGH';
  } else if (lowPriorityCategories.includes(category)) {
    return 'LOW';
  } else {
    return 'MEDIUM'; // PLUMBING, APPLIANCE, CARPENTRY
  }
}
