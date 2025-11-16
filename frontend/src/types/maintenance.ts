/**
 * Maintenance Request Types and Interfaces
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum MaintenanceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  CARPENTRY = 'CARPENTRY',
  PEST_CONTROL = 'PEST_CONTROL',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER'
}

export enum MaintenancePriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum MaintenanceStatus {
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum PreferredAccessTime {
  IMMEDIATE = 'IMMEDIATE',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  ANY_TIME = 'ANY_TIME'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Main MaintenanceRequest interface representing a complete request
 */
export interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  tenantId: string;
  unitId: string;
  propertyId: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
  status: MaintenanceStatus;
  preferredAccessTime: PreferredAccessTime;
  preferredAccessDate: string; // ISO date string
  submittedAt: string; // ISO datetime string

  // Optional fields (populated based on status)
  assignedTo?: string; // Vendor ID
  assignedVendorName?: string;
  assignedVendorContact?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
  estimatedCompletionDate?: string;

  // Attachments and work details
  attachments: string[]; // Array of file URLs
  workNotes?: string;
  completionPhotos?: string[]; // Array of file URLs

  // Feedback
  rating?: number; // 1-5
  feedback?: string;
  feedbackSubmittedAt?: string;

  // Audit fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * DTO for creating a new maintenance request
 */
export interface CreateMaintenanceRequestDto {
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
  preferredAccessTime: PreferredAccessTime;
  preferredAccessDate: string; // ISO date string
}

/**
 * Response from creating/fetching a maintenance request
 */
export interface MaintenanceRequestResponse extends MaintenanceRequest {}

/**
 * DTO for submitting tenant feedback
 */
export interface SubmitFeedbackDto {
  rating: number; // 1-5 stars
  comment?: string; // Optional comment, max 500 chars
}

/**
 * Filters for listing maintenance requests
 */
export interface MaintenanceRequestFilters {
  status?: MaintenanceStatus[];
  category?: MaintenanceCategory[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * List item for maintenance requests (lighter version for list view)
 */
export interface MaintenanceRequestListItem {
  id: string;
  requestNumber: string;
  title: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  submittedAt: string;
  updatedAt: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Category display information
 */
export interface CategoryInfo {
  value: MaintenanceCategory;
  label: string;
  icon: string;
  defaultPriority: MaintenancePriority;
}

/**
 * Priority display information
 */
export interface PriorityInfo {
  value: MaintenancePriority;
  label: string;
  color: string;
  badgeClass: string;
}

/**
 * Status display information
 */
export interface StatusInfo {
  value: MaintenanceStatus;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
}

/**
 * Timeline checkpoint for status timeline
 */
export interface TimelineCheckpoint {
  status: MaintenanceStatus;
  label: string;
  timestamp?: string;
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}
