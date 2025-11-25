/**
 * Work Order Types and Interfaces
 * Story 4.1: Work Order Creation and Management
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum WorkOrderCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  CARPENTRY = 'CARPENTRY',
  PEST_CONTROL = 'PEST_CONTROL',
  CLEANING = 'CLEANING',
  PAINTING = 'PAINTING',
  LANDSCAPING = 'LANDSCAPING',
  OTHER = 'OTHER'
}

export enum WorkOrderPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum WorkOrderStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Main WorkOrder interface representing a complete work order
 */
export interface WorkOrder {
  id: string;
  workOrderNumber: string;

  // Relationships
  propertyId: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  requestedBy: string;
  requesterName?: string;
  assignedTo?: string;
  assigneeName?: string;
  maintenanceRequestId?: string;
  maintenanceRequestNumber?: string;

  // Work Order Details
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  title: string;
  description: string;
  status: WorkOrderStatus;

  // Scheduling and Access
  scheduledDate?: string; // ISO datetime string
  accessInstructions?: string;

  // Timestamps
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;

  // Cost Tracking (visible only to managers/supervisors)
  estimatedCost?: number;
  actualCost?: number;

  // Work Completion Details
  totalHours?: number;
  completionNotes?: string;
  followUpNotes?: string;

  // Attachments
  attachments: string[]; // Array of file URLs
  completionPhotos: string[]; // Array of file URLs

  // Audit fields
  createdAt: string;
  updatedAt: string;
  version?: number;
}

/**
 * List item for work orders (lighter version for list view)
 */
export interface WorkOrderListItem {
  id: string;
  workOrderNumber: string;
  propertyName?: string;
  unitNumber?: string;
  title: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduledDate?: string;
  assigneeName?: string;
  isOverdue?: boolean;
  createdAt: string;
}

/**
 * Work order comment/note
 */
export interface WorkOrderComment {
  id: string;
  workOrderId: string;
  createdBy: string;
  createdByName?: string;
  commentText: string;
  isStatusChange: boolean;
  previousStatus?: string;
  newStatus?: string;
  createdAt: string;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * DTO for creating a new work order
 */
export interface CreateWorkOrderDto {
  propertyId: string;
  unitId?: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  title: string;
  description: string;
  scheduledDate?: string; // ISO datetime string
  accessInstructions?: string;
  estimatedCost?: number;
  maintenanceRequestId?: string;
}

/**
 * DTO for updating an existing work order
 */
export interface UpdateWorkOrderDto {
  unitId?: string;
  category?: WorkOrderCategory;
  priority?: WorkOrderPriority;
  title?: string;
  description?: string;
  scheduledDate?: string;
  accessInstructions?: string;
  estimatedCost?: number;
  actualCost?: number;
  totalHours?: number;
  completionNotes?: string;
  followUpNotes?: string;
}

/**
 * DTO for updating work order status
 */
export interface UpdateWorkOrderStatusDto {
  status: WorkOrderStatus;
  notes?: string;
}

/**
 * DTO for assigning a work order
 */
export interface AssignWorkOrderDto {
  assignedTo: string; // User/Vendor ID
  assignmentNotes?: string;
}

/**
 * DTO for adding a comment
 */
export interface AddCommentDto {
  commentText: string;
}

/**
 * Filters for listing work orders
 */
export interface WorkOrderFilters {
  propertyId?: string;
  unitId?: string;
  status?: WorkOrderStatus[];
  category?: WorkOrderCategory[];
  priority?: WorkOrderPriority[];
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API response wrapper for work order
 */
export interface WorkOrderResponse {
  success: boolean;
  message: string;
  data: WorkOrder;
  timestamp: string;
}

/**
 * API response wrapper for work order list
 */
export interface WorkOrderListResponse {
  success: boolean;
  message: string;
  data: WorkOrderListItem[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
}

/**
 * API response wrapper for work order comments
 */
export interface WorkOrderCommentsResponse {
  success: boolean;
  message: string;
  data: WorkOrderComment[];
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Category display information
 */
export interface CategoryInfo {
  value: WorkOrderCategory;
  label: string;
  icon: string;
  description: string;
}

/**
 * Priority display information
 */
export interface PriorityInfo {
  value: WorkOrderPriority;
  label: string;
  color: string;
  badgeClass: string;
  description: string;
}

/**
 * Status display information
 */
export interface StatusInfo {
  value: WorkOrderStatus;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
  iconName: string;
}

/**
 * Timeline checkpoint for status timeline
 */
export interface TimelineCheckpoint {
  status: WorkOrderStatus;
  label: string;
  timestamp?: string;
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

/**
 * Form data for work order creation (includes files)
 */
export interface WorkOrderFormData extends CreateWorkOrderDto {
  files?: File[];
}

/**
 * Form data for completion photos upload
 */
export interface CompletionPhotosFormData {
  files: File[];
}
