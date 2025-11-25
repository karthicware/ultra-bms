/**
 * Preventive Maintenance Schedule Types and Interfaces
 * Story 4.2: Preventive Maintenance Scheduling
 */

import { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from './work-orders';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Recurrence type for PM schedules
 */
export enum RecurrenceType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY'
}

/**
 * PM Schedule status
 */
export enum PMScheduleStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  DELETED = 'DELETED'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Statistics for a PM schedule
 */
export interface PMScheduleStatistics {
  totalGenerated: number;
  completedCount: number;
  overdueCount: number;
  avgCompletionDays: number | null;
}

/**
 * Main PMSchedule interface representing a complete PM schedule
 */
export interface PMSchedule {
  id: string;
  scheduleName: string;

  // Relationships
  propertyId: string | null;
  propertyName: string | null;
  category: WorkOrderCategory;
  description: string;

  // Recurrence Settings
  recurrenceType: RecurrenceType;
  startDate: string; // ISO date string
  endDate: string | null; // ISO date string, nullable

  // Assignment Defaults
  defaultPriority: WorkOrderPriority;
  defaultAssigneeId: string | null;
  defaultAssigneeName: string | null;

  // Status and Tracking
  status: PMScheduleStatus;
  nextGenerationDate: string | null; // ISO date string
  lastGeneratedDate: string | null; // ISO date string

  // Statistics (optional, included in detail view)
  statistics?: PMScheduleStatistics;

  // Audit fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByName?: string;
}

/**
 * List item for PM schedules (lighter version for list view)
 */
export interface PMScheduleListItem {
  id: string;
  scheduleName: string;
  propertyId: string | null;
  propertyName: string | null;
  category: WorkOrderCategory;
  recurrenceType: RecurrenceType;
  status: PMScheduleStatus;
  nextGenerationDate: string | null;
  lastGeneratedDate: string | null;
  defaultPriority: WorkOrderPriority;
  createdAt: string;
}

/**
 * Generated work order from PM schedule (for history tracking)
 */
export interface GeneratedWorkOrder {
  id: string;
  workOrderNumber: string;
  generatedDate: string;
  scheduledDate: string;
  status: WorkOrderStatus;
  completedAt: string | null;
  daysToComplete: number | null;
  isOverdue: boolean;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

/**
 * DTO for creating a new PM schedule
 */
export interface CreatePMScheduleDto {
  scheduleName: string;
  propertyId: string | null; // null for "All Properties"
  category: WorkOrderCategory;
  description: string;
  recurrenceType: RecurrenceType;
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string, optional
  defaultPriority: WorkOrderPriority;
  defaultAssigneeId?: string | null;
}

/**
 * DTO for updating an existing PM schedule
 * Note: propertyId, recurrenceType, and startDate cannot be edited
 */
export interface UpdatePMScheduleDto {
  scheduleName?: string;
  description?: string;
  category?: WorkOrderCategory;
  defaultPriority?: WorkOrderPriority;
  defaultAssigneeId?: string | null;
  endDate?: string | null;
}

/**
 * DTO for updating PM schedule status
 */
export interface UpdatePMScheduleStatusDto {
  status: PMScheduleStatus;
}

/**
 * Filters for listing PM schedules
 */
export interface PMScheduleFilters {
  status?: PMScheduleStatus[];
  propertyId?: string;
  category?: WorkOrderCategory[];
  recurrenceType?: RecurrenceType[];
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
 * API response wrapper for PM schedule
 */
export interface PMScheduleResponse {
  success: boolean;
  message: string;
  data: PMSchedule;
  timestamp: string;
}

/**
 * API response wrapper for PM schedule creation
 */
export interface CreatePMScheduleResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    scheduleName: string;
    status: PMScheduleStatus;
    nextGenerationDate: string;
    createdAt: string;
  };
  timestamp: string;
}

/**
 * API response wrapper for PM schedule list
 */
export interface PMScheduleListResponse {
  success: boolean;
  message: string;
  data: PMScheduleListItem[];
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
 * API response wrapper for generated work orders history
 */
export interface GeneratedWorkOrdersResponse {
  success: boolean;
  message: string;
  data: GeneratedWorkOrder[];
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
 * API response wrapper for generate now action
 */
export interface GenerateNowResponse {
  success: boolean;
  message: string;
  data: {
    workOrderId: string;
    workOrderNumber: string;
  };
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Recurrence type display information
 */
export interface RecurrenceTypeInfo {
  value: RecurrenceType;
  label: string;
  description: string;
  monthsInterval: number;
}

/**
 * PM Schedule status display information
 */
export interface PMScheduleStatusInfo {
  value: PMScheduleStatus;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
}

/**
 * Form data for PM schedule creation (extends DTO with form-specific fields)
 */
export interface PMScheduleFormData extends Omit<CreatePMScheduleDto, 'startDate' | 'endDate'> {
  startDate: Date;
  endDate?: Date | null;
}

/**
 * Form data for PM schedule edit
 */
export interface PMScheduleEditFormData extends Omit<UpdatePMScheduleDto, 'endDate'> {
  endDate?: Date | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Recurrence type options for dropdowns
 */
export const RECURRENCE_TYPE_OPTIONS: RecurrenceTypeInfo[] = [
  {
    value: RecurrenceType.MONTHLY,
    label: 'Every month',
    description: 'Work order generated once per month',
    monthsInterval: 1
  },
  {
    value: RecurrenceType.QUARTERLY,
    label: 'Every 3 months',
    description: 'Work order generated once per quarter',
    monthsInterval: 3
  },
  {
    value: RecurrenceType.SEMI_ANNUALLY,
    label: 'Every 6 months',
    description: 'Work order generated twice per year',
    monthsInterval: 6
  },
  {
    value: RecurrenceType.ANNUALLY,
    label: 'Every year',
    description: 'Work order generated once per year',
    monthsInterval: 12
  }
];

/**
 * PM Schedule status options for dropdowns/filters
 */
export const PM_SCHEDULE_STATUS_OPTIONS: PMScheduleStatusInfo[] = [
  {
    value: PMScheduleStatus.ACTIVE,
    label: 'Active',
    description: 'Schedule is running and generating work orders',
    color: 'green',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  {
    value: PMScheduleStatus.PAUSED,
    label: 'Paused',
    description: 'Schedule is paused, no automatic generation',
    color: 'yellow',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  {
    value: PMScheduleStatus.COMPLETED,
    label: 'Completed',
    description: 'Schedule has finished, no more generation',
    color: 'gray',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  },
  {
    value: PMScheduleStatus.DELETED,
    label: 'Deleted',
    description: 'Schedule has been deleted',
    color: 'red',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
];

/**
 * Get recurrence type info by value
 */
export function getRecurrenceTypeInfo(type: RecurrenceType): RecurrenceTypeInfo | undefined {
  return RECURRENCE_TYPE_OPTIONS.find(option => option.value === type);
}

/**
 * Get PM schedule status info by value
 */
export function getPMScheduleStatusInfo(status: PMScheduleStatus): PMScheduleStatusInfo | undefined {
  return PM_SCHEDULE_STATUS_OPTIONS.find(option => option.value === status);
}

/**
 * Calculate next generation date based on start date and recurrence type
 */
export function calculateNextGenerationDate(startDate: Date, recurrenceType: RecurrenceType): Date {
  const nextDate = new Date(startDate);
  const typeInfo = getRecurrenceTypeInfo(recurrenceType);

  if (typeInfo) {
    nextDate.setMonth(nextDate.getMonth() + typeInfo.monthsInterval);
  }

  return nextDate;
}
