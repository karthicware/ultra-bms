/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Work Order API Service
 * Story 4.1: Work Order Creation and Management
 *
 * All work order-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  WorkOrder,
  WorkOrderListItem,
  WorkOrderComment,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
  AssignWorkOrderDto,
  AddCommentDto,
  WorkOrderFilters,
  WorkOrderResponse,
  WorkOrderListResponse,
  WorkOrderCommentsResponse
} from '@/types/work-orders';

const WORK_ORDERS_BASE_PATH = '/v1/work-orders';

// ============================================================================
// CREATE WORK ORDER
// ============================================================================

/**
 * Create a new work order with file uploads
 *
 * @param data - Work order data (property, unit, category, priority, title, description, etc.)
 * @param files - Array of image files (max 5, JPG/PNG, max 5MB each)
 *
 * @returns Promise that resolves to the created WorkOrder with workOrderNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const workOrder = await createWorkOrder({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   unitId: '550e8400-e29b-41d4-a716-446655440001',
 *   category: 'PLUMBING',
 *   priority: 'HIGH',
 *   title: 'Fix leaking kitchen faucet - Unit 101',
 *   description: 'Tenant reported water dripping from kitchen faucet handle...',
 *   scheduledDate: '2025-11-25T10:00:00Z',
 *   estimatedCost: 150.00
 * }, [imageFile1, imageFile2]);
 *
 * console.log(workOrder.workOrderNumber); // "WO-2025-0001"
 * console.log(workOrder.status); // "OPEN"
 * ```
 */
export async function createWorkOrder(
  data: CreateWorkOrderDto,
  files?: File[]
): Promise<WorkOrder> {
  const formData = new FormData();

  // Append request data as JSON blob
  formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  // Append files if provided
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await apiClient.post<WorkOrderResponse>(
    WORK_ORDERS_BASE_PATH,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}

// ============================================================================
// LIST WORK ORDERS
// ============================================================================

/**
 * Get paginated list of work orders with filters
 *
 * @param filters - Optional filters (property, unit, status, category, priority, etc.)
 *
 * @returns Promise that resolves to paginated list of WorkOrderListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all work orders for a property
 * const response = await getWorkOrders({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Filter by status and priority
 * const highPriorityOpen = await getWorkOrders({
 *   status: ['OPEN', 'ASSIGNED'],
 *   priority: ['HIGH'],
 *   sortBy: 'scheduledDate',
 *   sortDirection: 'ASC'
 * });
 * ```
 */
export async function getWorkOrders(filters?: WorkOrderFilters): Promise<WorkOrderListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'scheduledDate',
    sortDirection: filters?.sortDirection ?? 'DESC',
  };

  // Add filters if provided
  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.unitId) {
    params.unitId = filters.unitId;
  }
  if (filters?.status && filters.status.length > 0) {
    params.status = filters.status.join(',');
  }
  if (filters?.category && filters.category.length > 0) {
    params.category = filters.category.join(',');
  }
  if (filters?.priority && filters.priority.length > 0) {
    params.priority = filters.priority.join(',');
  }
  if (filters?.assignedTo) {
    params.assignedTo = filters.assignedTo;
  }
  if (filters?.startDate) {
    params.startDate = filters.startDate;
  }
  if (filters?.endDate) {
    params.endDate = filters.endDate;
  }
  if (filters?.search) {
    params.search = filters.search;
  }

  const response = await apiClient.get<WorkOrderListResponse>(
    WORK_ORDERS_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET WORK ORDER BY ID
// ============================================================================

/**
 * Get work order details by ID
 *
 * @param id - Work order UUID
 *
 * @returns Promise that resolves to full WorkOrder details
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks access to this work order (403)
 *
 * @example
 * ```typescript
 * const workOrder = await getWorkOrderById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(workOrder.title);
 * console.log(workOrder.status);
 * ```
 */
export async function getWorkOrderById(id: string): Promise<WorkOrder> {
  const response = await apiClient.get<WorkOrderResponse>(`${WORK_ORDERS_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// GET WORK ORDER BY NUMBER
// ============================================================================

/**
 * Get work order details by work order number
 *
 * @param workOrderNumber - Work order number (e.g., "WO-2025-0001")
 *
 * @returns Promise that resolves to full WorkOrder details
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const workOrder = await getWorkOrderByNumber('WO-2025-0001');
 * ```
 */
export async function getWorkOrderByNumber(workOrderNumber: string): Promise<WorkOrder> {
  const response = await apiClient.get<WorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/number/${workOrderNumber}`
  );
  return response.data.data;
}

// ============================================================================
// UPDATE WORK ORDER
// ============================================================================

/**
 * Update work order details (partial updates supported)
 *
 * @param id - Work order UUID
 * @param data - Updated work order data (only changed fields)
 *
 * @returns Promise that resolves to updated WorkOrder
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {ForbiddenException} When user lacks permission (403)
 *
 * @example
 * ```typescript
 * const updated = await updateWorkOrder(workOrderId, {
 *   priority: 'HIGH',
 *   estimatedCost: 200.00,
 *   scheduledDate: '2025-11-26T14:00:00Z'
 * });
 * ```
 */
export async function updateWorkOrder(
  id: string,
  data: UpdateWorkOrderDto
): Promise<WorkOrder> {
  const response = await apiClient.put<WorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// UPDATE WORK ORDER STATUS
// ============================================================================

/**
 * Update work order status with optional notes
 *
 * @param id - Work order UUID
 * @param data - Status update data (status and notes)
 *
 * @returns Promise that resolves to updated WorkOrder
 *
 * @throws {ValidationException} When invalid status transition (400)
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const updated = await updateWorkOrderStatus(workOrderId, {
 *   status: 'IN_PROGRESS',
 *   notes: 'Started work on the plumbing repair'
 * });
 * ```
 */
export async function updateWorkOrderStatus(
  id: string,
  data: UpdateWorkOrderStatusDto
): Promise<WorkOrder> {
  const response = await apiClient.patch<WorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/status`,
    data
  );
  return response.data.data;
}

// ============================================================================
// ASSIGN WORK ORDER
// ============================================================================

/**
 * Assign work order to a vendor or staff member
 *
 * @param id - Work order UUID
 * @param data - Assignment data (assignedTo user ID and optional notes)
 *
 * @returns Promise that resolves to updated WorkOrder
 *
 * @throws {EntityNotFoundException} When work order or assignee not found (404)
 * @throws {ForbiddenException} When user lacks permission (403)
 *
 * @example
 * ```typescript
 * const assigned = await assignWorkOrder(workOrderId, {
 *   assignedTo: vendorUserId,
 *   assignmentNotes: 'Urgent - complete by EOD'
 * });
 * ```
 */
export async function assignWorkOrder(
  id: string,
  data: AssignWorkOrderDto
): Promise<WorkOrder> {
  const response = await apiClient.post<WorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/assign`,
    data
  );
  return response.data.data;
}

// ============================================================================
// ADD COMMENT
// ============================================================================

/**
 * Add a comment to a work order
 *
 * @param id - Work order UUID
 * @param data - Comment data (commentText)
 *
 * @returns Promise that resolves to created WorkOrderComment
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {ValidationException} When comment text invalid (400)
 *
 * @example
 * ```typescript
 * const comment = await addWorkOrderComment(workOrderId, {
 *   commentText: 'Parts have arrived, will complete work tomorrow'
 * });
 * ```
 */
export async function addWorkOrderComment(
  id: string,
  data: AddCommentDto
): Promise<WorkOrderComment> {
  const response = await apiClient.post<{ success: boolean; data: WorkOrderComment }>(
    `${WORK_ORDERS_BASE_PATH}/${id}/comments`,
    data
  );
  return response.data.data;
}

// ============================================================================
// GET COMMENTS
// ============================================================================

/**
 * Get all comments for a work order
 *
 * @param id - Work order UUID
 *
 * @returns Promise that resolves to array of WorkOrderComment (chronological order)
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const comments = await getWorkOrderComments(workOrderId);
 * comments.forEach(comment => {
 *   console.log(`${comment.createdByName}: ${comment.commentText}`);
 * });
 * ```
 */
export async function getWorkOrderComments(id: string): Promise<WorkOrderComment[]> {
  const response = await apiClient.get<WorkOrderCommentsResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/comments`
  );
  return response.data.data;
}

// ============================================================================
// GET STATUS HISTORY
// ============================================================================

/**
 * Get status change history for a work order
 *
 * @param id - Work order UUID
 *
 * @returns Promise that resolves to array of status change comments
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const history = await getWorkOrderStatusHistory(workOrderId);
 * history.forEach(change => {
 *   console.log(`${change.previousStatus} -> ${change.newStatus} at ${change.createdAt}`);
 * });
 * ```
 */
export async function getWorkOrderStatusHistory(id: string): Promise<WorkOrderComment[]> {
  const response = await apiClient.get<WorkOrderCommentsResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/status-history`
  );
  return response.data.data;
}

// ============================================================================
// UPLOAD COMPLETION PHOTOS
// ============================================================================

/**
 * Upload completion photos for a work order
 *
 * @param id - Work order UUID
 * @param files - Array of image files (JPG/PNG, max 5MB each)
 *
 * @returns Promise that resolves to updated WorkOrder
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const updated = await uploadCompletionPhotos(workOrderId, [
 *   beforePhoto1,
 *   beforePhoto2,
 *   afterPhoto1,
 *   afterPhoto2
 * ]);
 * ```
 */
export async function uploadCompletionPhotos(
  id: string,
  files: File[]
): Promise<WorkOrder> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await apiClient.post<WorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/completion-photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}

// ============================================================================
// GET UNASSIGNED WORK ORDERS
// ============================================================================

/**
 * Get paginated list of unassigned work orders (status = OPEN)
 *
 * @param propertyId - Optional property ID to filter by
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 20
 *
 * @returns Promise that resolves to paginated list of unassigned work orders
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const unassigned = await getUnassignedWorkOrders(propertyId, 0, 20);
 * console.log(`${unassigned.pagination.totalElements} work orders need assignment`);
 * ```
 */
export async function getUnassignedWorkOrders(
  propertyId?: string,
  page: number = 0,
  size: number = 20
): Promise<WorkOrderListResponse> {
  const params: Record<string, any> = { page, size };

  if (propertyId) {
    params.propertyId = propertyId;
  }

  const response = await apiClient.get<WorkOrderListResponse>(
    `${WORK_ORDERS_BASE_PATH}/unassigned`,
    { params }
  );

  return response.data;
}

// ============================================================================
// CANCEL WORK ORDER
// ============================================================================

/**
 * Cancel a work order (soft delete by setting status to CLOSED)
 *
 * @param id - Work order UUID
 *
 * @returns Promise that resolves when cancellation succeeds
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {ValidationException} When work order cannot be cancelled (already completed/closed) (400)
 * @throws {ForbiddenException} When user lacks permission (403)
 *
 * @example
 * ```typescript
 * await cancelWorkOrder(workOrderId);
 * console.log('Work order cancelled successfully');
 * ```
 */
export async function cancelWorkOrder(id: string): Promise<void> {
  await apiClient.delete(`${WORK_ORDERS_BASE_PATH}/${id}`);
}

// ============================================================================
// WORK ORDER ASSIGNMENT (Story 4.3)
// ============================================================================

import type {
  AssignWorkOrderRequest,
  ReassignWorkOrderRequest,
  AssignWorkOrderResponse,
  ReassignWorkOrderResponse,
  AssignmentHistoryResponse,
  WorkOrderAssignment,
  InternalStaffAssignee,
  ExternalVendorAssignee,
  InternalStaffListResponse,
  VendorListResponse,
  UnassignedWorkOrderFilters
} from '@/types/work-order-assignment';

/**
 * Assign work order to internal staff or external vendor
 *
 * @param id - Work order UUID
 * @param data - Assignment data (assigneeType, assigneeId, assignmentNotes)
 *
 * @returns Promise that resolves to assignment response with assignee details
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When work order or assignee not found (404)
 * @throws {ForbiddenException} When user lacks permission (403)
 *
 * @example
 * ```typescript
 * const result = await assignWorkOrderToAssignee(workOrderId, {
 *   assigneeType: AssigneeType.INTERNAL_STAFF,
 *   assigneeId: staffUserId,
 *   assignmentNotes: 'Urgent - complete by EOD'
 * });
 * console.log(result.data.assignedTo.name);
 * ```
 */
export async function assignWorkOrderToAssignee(
  id: string,
  data: AssignWorkOrderRequest
): Promise<AssignWorkOrderResponse> {
  const response = await apiClient.post<AssignWorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/assign`,
    data
  );
  return response.data;
}

/**
 * Reassign work order to a different assignee
 *
 * @param id - Work order UUID
 * @param data - Reassignment data (newAssigneeType, newAssigneeId, reassignmentReason, assignmentNotes)
 *
 * @returns Promise that resolves to reassignment response with both previous and new assignee details
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When work order or assignee not found (404)
 * @throws {ForbiddenException} When user lacks permission (403)
 *
 * @example
 * ```typescript
 * const result = await reassignWorkOrder(workOrderId, {
 *   newAssigneeType: AssigneeType.EXTERNAL_VENDOR,
 *   newAssigneeId: vendorId,
 *   reassignmentReason: 'Vendor A unavailable, requires different expertise',
 *   assignmentNotes: 'Please prioritize this job'
 * });
 * console.log(`Reassigned from ${result.data.previousAssignee.name} to ${result.data.newAssignee.name}`);
 * ```
 */
export async function reassignWorkOrder(
  id: string,
  data: ReassignWorkOrderRequest
): Promise<ReassignWorkOrderResponse> {
  const response = await apiClient.post<ReassignWorkOrderResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/reassign`,
    data
  );
  return response.data;
}

/**
 * Get assignment history for a work order
 *
 * @param id - Work order UUID
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 20
 *
 * @returns Promise that resolves to paginated assignment history
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const history = await getAssignmentHistory(workOrderId);
 * history.data.assignments.forEach(assignment => {
 *   console.log(`Assigned to ${assignment.assigneeName} on ${assignment.assignedDate}`);
 * });
 * ```
 */
export async function getAssignmentHistory(
  id: string,
  page: number = 0,
  size: number = 20
): Promise<AssignmentHistoryResponse> {
  const response = await apiClient.get<AssignmentHistoryResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/assignment-history`,
    { params: { page, size } }
  );
  return response.data;
}

/**
 * Get list of internal staff available for assignment
 * Returns users with MAINTENANCE_SUPERVISOR role
 *
 * @returns Promise that resolves to list of internal staff
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const staff = await getInternalStaffForAssignment();
 * staff.data.forEach(member => {
 *   console.log(`${member.firstName} ${member.lastName} - ${member.email}`);
 * });
 * ```
 */
export async function getInternalStaffForAssignment(): Promise<InternalStaffListResponse> {
  const response = await apiClient.get<InternalStaffListResponse>(
    '/v1/users',
    { params: { role: 'MAINTENANCE_SUPERVISOR', status: 'ACTIVE' } }
  );
  return response.data;
}

/**
 * Get list of external vendors available for assignment
 * Returns active vendors filtered by service category
 *
 * @param serviceCategory - Optional category to filter vendors by
 *
 * @returns Promise that resolves to list of external vendors
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const vendors = await getExternalVendorsForAssignment('PLUMBING');
 * vendors.data.forEach(vendor => {
 *   console.log(`${vendor.companyName} - Rating: ${vendor.rating}/5`);
 * });
 * ```
 */
export async function getExternalVendorsForAssignment(
  serviceCategory?: string
): Promise<VendorListResponse> {
  const params: Record<string, any> = { status: 'ACTIVE' };
  if (serviceCategory) {
    params.serviceCategory = serviceCategory;
  }
  const response = await apiClient.get<VendorListResponse>(
    '/v1/vendors',
    { params }
  );
  return response.data;
}

/**
 * Get paginated list of unassigned work orders with enhanced filters
 *
 * @param filters - Filters for listing unassigned work orders
 *
 * @returns Promise that resolves to paginated list of unassigned work orders
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const unassigned = await getUnassignedWorkOrdersFiltered({
 *   priority: ['HIGH', 'MEDIUM'],
 *   category: ['PLUMBING', 'ELECTRICAL'],
 *   search: 'leak',
 *   page: 0,
 *   size: 20
 * });
 * console.log(`${unassigned.pagination.totalElements} work orders need assignment`);
 * ```
 */
export async function getUnassignedWorkOrdersFiltered(
  filters?: UnassignedWorkOrderFilters
): Promise<WorkOrderListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'priority',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.priority && filters.priority.length > 0) {
    params.priority = filters.priority.join(',');
  }
  if (filters?.category && filters.category.length > 0) {
    params.category = filters.category.join(',');
  }
  if (filters?.search) {
    params.search = filters.search;
  }

  const response = await apiClient.get<WorkOrderListResponse>(
    `${WORK_ORDERS_BASE_PATH}/unassigned`,
    { params }
  );

  return response.data;
}

// ============================================================================
// WORK ORDER PROGRESS TRACKING (Story 4.4)
// ============================================================================

import type {
  StartWorkResponse,
  AddProgressUpdateResponse,
  MarkCompleteResponse,
  TimelineResponse,
  ProgressUpdatesResponse,
  WorkOrderProgress,
  TimelineEntry
} from '@/types/work-order-progress';

/**
 * Start work on an assigned work order
 *
 * @param id - Work order UUID
 * @param beforePhotos - Optional array of before photos to upload
 *
 * @returns Promise that resolves to start work response with updated status
 *
 * @throws {ValidationException} When work order status is not ASSIGNED (400)
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {ForbiddenException} When user is not the assignee (403)
 *
 * @example
 * ```typescript
 * const result = await startWork(workOrderId, [beforePhoto1, beforePhoto2]);
 * console.log(result.data.status); // "IN_PROGRESS"
 * console.log(result.data.startedAt); // "2025-11-25T10:00:00Z"
 * ```
 */
export async function startWork(
  id: string,
  beforePhotos?: File[]
): Promise<StartWorkResponse> {
  const formData = new FormData();

  // Append before photos if provided
  if (beforePhotos && beforePhotos.length > 0) {
    beforePhotos.forEach((file) => {
      formData.append('beforePhotos', file);
    });
  }

  const response = await apiClient.patch<StartWorkResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/start`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Add a progress update to a work order
 *
 * @param id - Work order UUID
 * @param progressNotes - Progress notes (required, 1-500 chars)
 * @param photos - Optional array of progress photos (max 5)
 * @param estimatedCompletionDate - Optional updated estimated completion date
 *
 * @returns Promise that resolves to progress update response with photo URLs
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {ForbiddenException} When user is not the assignee (403)
 *
 * @example
 * ```typescript
 * const result = await addProgressUpdate(workOrderId, {
 *   progressNotes: 'Identified issue, ordering replacement parts',
 *   photos: [photo1, photo2],
 *   estimatedCompletionDate: '2025-11-26'
 * });
 * console.log(result.data.progressUpdateId);
 * console.log(result.data.photoUrls);
 * ```
 */
export async function addProgressUpdate(
  id: string,
  data: {
    progressNotes: string;
    photos?: File[];
    estimatedCompletionDate?: string;
  }
): Promise<AddProgressUpdateResponse> {
  const formData = new FormData();

  // Append progress notes
  formData.append('progressNotes', data.progressNotes);

  // Append estimated completion date if provided
  if (data.estimatedCompletionDate) {
    formData.append('estimatedCompletionDate', data.estimatedCompletionDate);
  }

  // Append photos if provided
  if (data.photos && data.photos.length > 0) {
    data.photos.forEach((file) => {
      formData.append('photos', file);
    });
  }

  const response = await apiClient.post<AddProgressUpdateResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/progress`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Mark a work order as complete
 *
 * @param id - Work order UUID
 * @param data - Completion data (completionNotes, afterPhotos, hoursSpent, totalCost, etc.)
 *
 * @returns Promise that resolves to completion response with final status
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When work order not found (404)
 * @throws {ForbiddenException} When user is not the assignee (403)
 *
 * @example
 * ```typescript
 * const result = await markComplete(workOrderId, {
 *   completionNotes: 'Replaced faulty valve, tested system, all working normally',
 *   afterPhotos: [afterPhoto1, afterPhoto2],
 *   hoursSpent: 2.5,
 *   totalCost: 350.00,
 *   recommendations: 'Monitor pressure weekly for next month',
 *   followUpRequired: false
 * });
 * console.log(result.data.status); // "COMPLETED"
 * console.log(result.data.completedAt);
 * ```
 */
export async function markComplete(
  id: string,
  data: {
    completionNotes: string;
    afterPhotos: File[];
    hoursSpent: number;
    totalCost: number;
    recommendations?: string;
    followUpRequired: boolean;
    followUpDescription?: string;
  }
): Promise<MarkCompleteResponse> {
  const formData = new FormData();

  // Append required fields
  formData.append('completionNotes', data.completionNotes);
  formData.append('hoursSpent', data.hoursSpent.toString());
  formData.append('totalCost', data.totalCost.toString());
  formData.append('followUpRequired', data.followUpRequired.toString());

  // Append optional fields
  if (data.recommendations) {
    formData.append('recommendations', data.recommendations);
  }
  if (data.followUpDescription) {
    formData.append('followUpDescription', data.followUpDescription);
  }

  // Append after photos (required, min 1)
  data.afterPhotos.forEach((file) => {
    formData.append('afterPhotos', file);
  });

  const response = await apiClient.patch<MarkCompleteResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/complete`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Get complete timeline of work order events
 *
 * @param id - Work order UUID
 *
 * @returns Promise that resolves to timeline entries ordered by timestamp DESC
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const result = await getWorkOrderTimeline(workOrderId);
 * result.data.timeline.forEach(entry => {
 *   console.log(`${entry.type}: ${entry.userName} at ${entry.timestamp}`);
 * });
 * ```
 */
export async function getWorkOrderTimeline(id: string): Promise<TimelineResponse> {
  const response = await apiClient.get<TimelineResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/timeline`
  );
  return response.data;
}

/**
 * Get progress updates for a work order
 *
 * @param id - Work order UUID
 *
 * @returns Promise that resolves to array of progress updates
 *
 * @throws {EntityNotFoundException} When work order not found (404)
 *
 * @example
 * ```typescript
 * const updates = await getProgressUpdates(workOrderId);
 * updates.data.forEach(update => {
 *   console.log(`${update.userName}: ${update.progressNotes}`);
 * });
 * ```
 */
export async function getProgressUpdates(id: string): Promise<ProgressUpdatesResponse> {
  const response = await apiClient.get<ProgressUpdatesResponse>(
    `${WORK_ORDERS_BASE_PATH}/${id}/progress`
  );
  return response.data;
}

/**
 * Get work orders requiring follow-up
 *
 * @param page - Page number (0-indexed), default 0
 * @param size - Page size, default 20
 *
 * @returns Promise that resolves to paginated list of work orders requiring follow-up
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const followUps = await getFollowUpWorkOrders();
 * console.log(`${followUps.pagination.totalElements} work orders need follow-up`);
 * ```
 */
export async function getFollowUpWorkOrders(
  page: number = 0,
  size: number = 20
): Promise<WorkOrderListResponse> {
  const response = await apiClient.get<WorkOrderListResponse>(
    `${WORK_ORDERS_BASE_PATH}`,
    {
      params: {
        followUpRequired: true,
        status: 'COMPLETED',
        page,
        size,
        sortBy: 'completedAt',
        sortDirection: 'DESC'
      }
    }
  );
  return response.data;
}
