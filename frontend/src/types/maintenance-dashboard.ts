/**
 * Maintenance Dashboard Types and Interfaces
 * Story 8.4: Maintenance Dashboard
 */

import { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from './work-orders';

// ============================================================================
// EXTENDED ENUMS (Backend has additional values)
// ============================================================================

/**
 * Extended Work Order Priority including URGENT
 * Backend supports: LOW, MEDIUM, HIGH, URGENT
 */
export enum MaintenanceJobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Extended Work Order Category including INSPECTION
 * Backend supports: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY,
 *                   PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, INSPECTION, OTHER
 */
export enum MaintenanceJobCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  CARPENTRY = 'CARPENTRY',
  PEST_CONTROL = 'PEST_CONTROL',
  CLEANING = 'CLEANING',
  PAINTING = 'PAINTING',
  LANDSCAPING = 'LANDSCAPING',
  INSPECTION = 'INSPECTION',
  OTHER = 'OTHER'
}

// ============================================================================
// KPI INTERFACES (AC-1, AC-2, AC-3, AC-4)
// ============================================================================

/**
 * Maintenance Dashboard KPI data
 */
export interface MaintenanceKpi {
  /** Active Jobs count (status NOT IN COMPLETED, CLOSED) */
  activeJobs: number;
  /** Overdue Jobs count (scheduledDate < today AND status NOT IN COMPLETED, CLOSED) */
  overdueJobs: number;
  /** Pending Jobs count (status = OPEN) */
  pendingJobs: number;
  /** Jobs completed in current month */
  completedThisMonth: number;
  /** Jobs completed in previous month (for comparison) */
  completedPreviousMonth: number;
  /** Month-over-month percentage change */
  monthOverMonthChange: number | null;
}

// ============================================================================
// CHART DATA INTERFACES (AC-5, AC-6, AC-7)
// ============================================================================

/**
 * Jobs by Status pie chart segment (AC-5)
 */
export interface JobsByStatus {
  status: WorkOrderStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Jobs by Priority bar chart data (AC-6)
 */
export interface JobsByPriority {
  priority: MaintenanceJobPriority;
  label: string;
  count: number;
  color: string;
}

/**
 * Jobs by Category horizontal bar chart data (AC-7)
 */
export interface JobsByCategory {
  category: MaintenanceJobCategory;
  label: string;
  count: number;
  color: string;
}

// ============================================================================
// LIST DATA INTERFACES (AC-8, AC-9)
// ============================================================================

/**
 * High Priority & Overdue Job table row (AC-8)
 */
export interface HighPriorityJob {
  id: string;
  workOrderNumber: string;
  propertyName: string;
  unitNumber: string | null;
  title: string;
  priority: MaintenanceJobPriority;
  status: WorkOrderStatus;
  assignedToName: string | null;
  scheduledDate: string | null;
  daysOverdue: number;
  isOverdue: boolean;
}

/**
 * Recently Completed Job list item (AC-9)
 */
export interface RecentlyCompletedJob {
  id: string;
  workOrderNumber: string;
  title: string;
  propertyName: string;
  completedAt: string;
  completedByName: string | null;
}

// ============================================================================
// COMPLETE DASHBOARD INTERFACE (AC-10)
// ============================================================================

/**
 * Complete Maintenance Dashboard data
 */
export interface MaintenanceDashboard {
  kpis: MaintenanceKpi;
  jobsByStatus: JobsByStatus[];
  jobsByPriority: JobsByPriority[];
  jobsByCategory: JobsByCategory[];
  highPriorityOverdueJobs: HighPriorityJob[];
  highPriorityOverdueTotal: number;
  recentlyCompletedJobs: RecentlyCompletedJob[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Paginated response for high priority jobs
 */
export interface HighPriorityJobsPage {
  content: HighPriorityJob[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Maintenance Dashboard filters
 */
export interface MaintenanceDashboardFilters {
  propertyId?: string;
}

/**
 * High Priority Jobs filter (for click-to-filter on charts)
 */
export interface HighPriorityJobsFilters {
  propertyId?: string;
  status?: WorkOrderStatus;
  page?: number;
  size?: number;
}

// ============================================================================
// HELPER CONSTANTS
// ============================================================================

/**
 * Status colors matching backend
 */
export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.OPEN]: '#3b82f6',        // Blue
  [WorkOrderStatus.ASSIGNED]: '#f59e0b',    // Amber
  [WorkOrderStatus.IN_PROGRESS]: '#8b5cf6', // Purple
  [WorkOrderStatus.COMPLETED]: '#22c55e',   // Green
  [WorkOrderStatus.CLOSED]: '#6b7280'       // Gray
};

/**
 * Priority colors (green to red gradient)
 */
export const PRIORITY_COLORS: Record<MaintenanceJobPriority, string> = {
  [MaintenanceJobPriority.LOW]: '#22c55e',      // Green
  [MaintenanceJobPriority.MEDIUM]: '#f59e0b',   // Amber
  [MaintenanceJobPriority.HIGH]: '#f97316',     // Orange
  [MaintenanceJobPriority.URGENT]: '#ef4444'    // Red
};

/**
 * Category colors
 */
export const CATEGORY_COLORS: Record<MaintenanceJobCategory, string> = {
  [MaintenanceJobCategory.PLUMBING]: '#3b82f6',
  [MaintenanceJobCategory.ELECTRICAL]: '#f59e0b',
  [MaintenanceJobCategory.HVAC]: '#8b5cf6',
  [MaintenanceJobCategory.APPLIANCE]: '#ec4899',
  [MaintenanceJobCategory.CARPENTRY]: '#10b981',
  [MaintenanceJobCategory.PEST_CONTROL]: '#6366f1',
  [MaintenanceJobCategory.CLEANING]: '#14b8a6',
  [MaintenanceJobCategory.PAINTING]: '#f43f5e',
  [MaintenanceJobCategory.LANDSCAPING]: '#84cc16',
  [MaintenanceJobCategory.INSPECTION]: '#0ea5e9',
  [MaintenanceJobCategory.OTHER]: '#6b7280'
};

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.OPEN]: 'Open',
  [WorkOrderStatus.ASSIGNED]: 'Assigned',
  [WorkOrderStatus.IN_PROGRESS]: 'In Progress',
  [WorkOrderStatus.COMPLETED]: 'Completed',
  [WorkOrderStatus.CLOSED]: 'Closed'
};

/**
 * Priority labels for display
 */
export const PRIORITY_LABELS: Record<MaintenanceJobPriority, string> = {
  [MaintenanceJobPriority.LOW]: 'Low',
  [MaintenanceJobPriority.MEDIUM]: 'Medium',
  [MaintenanceJobPriority.HIGH]: 'High',
  [MaintenanceJobPriority.URGENT]: 'Urgent'
};

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<MaintenanceJobCategory, string> = {
  [MaintenanceJobCategory.PLUMBING]: 'Plumbing',
  [MaintenanceJobCategory.ELECTRICAL]: 'Electrical',
  [MaintenanceJobCategory.HVAC]: 'HVAC',
  [MaintenanceJobCategory.APPLIANCE]: 'Appliance',
  [MaintenanceJobCategory.CARPENTRY]: 'Carpentry',
  [MaintenanceJobCategory.PEST_CONTROL]: 'Pest Control',
  [MaintenanceJobCategory.CLEANING]: 'Cleaning',
  [MaintenanceJobCategory.PAINTING]: 'Painting',
  [MaintenanceJobCategory.LANDSCAPING]: 'Landscaping',
  [MaintenanceJobCategory.INSPECTION]: 'Inspection',
  [MaintenanceJobCategory.OTHER]: 'Other'
};
