/**
 * Zod Validation Schemas for Maintenance Dashboard
 * Story 8.4: Maintenance Dashboard
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const workOrderStatusSchema = z.enum([
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED'
]);

export const maintenanceJobPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
]);

export const maintenanceJobCategorySchema = z.enum([
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'APPLIANCE',
  'CARPENTRY',
  'PEST_CONTROL',
  'CLEANING',
  'PAINTING',
  'LANDSCAPING',
  'INSPECTION',
  'OTHER'
]);

// ============================================================================
// KPI SCHEMAS (AC-1, AC-2, AC-3, AC-4)
// ============================================================================

/**
 * Maintenance KPI schema
 */
export const maintenanceKpiSchema = z.object({
  activeJobs: z.number().int().min(0),
  overdueJobs: z.number().int().min(0),
  pendingJobs: z.number().int().min(0),
  completedThisMonth: z.number().int().min(0),
  completedPreviousMonth: z.number().int().min(0),
  monthOverMonthChange: z.number().nullable()
});

// ============================================================================
// CHART DATA SCHEMAS (AC-5, AC-6, AC-7)
// ============================================================================

/**
 * Jobs by Status chart data schema (AC-5)
 */
export const jobsByStatusSchema = z.object({
  status: workOrderStatusSchema,
  label: z.string(),
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
});

/**
 * Jobs by Priority chart data schema (AC-6)
 */
export const jobsByPrioritySchema = z.object({
  priority: maintenanceJobPrioritySchema,
  label: z.string(),
  count: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
});

/**
 * Jobs by Category chart data schema (AC-7)
 */
export const jobsByCategorySchema = z.object({
  category: maintenanceJobCategorySchema,
  label: z.string(),
  count: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
});

// ============================================================================
// LIST DATA SCHEMAS (AC-8, AC-9)
// ============================================================================

/**
 * High Priority Job table row schema (AC-8)
 */
export const highPriorityJobSchema = z.object({
  id: z.string().uuid(),
  workOrderNumber: z.string().min(1),
  propertyName: z.string().min(1),
  unitNumber: z.string().nullable(),
  title: z.string().min(1),
  priority: maintenanceJobPrioritySchema,
  status: workOrderStatusSchema,
  assignedToName: z.string().nullable(),
  scheduledDate: z.string().datetime({ offset: true }).nullable().or(z.string().nullable()),
  daysOverdue: z.number().int(),
  isOverdue: z.boolean()
});

/**
 * Recently Completed Job schema (AC-9)
 */
export const recentlyCompletedJobSchema = z.object({
  id: z.string().uuid(),
  workOrderNumber: z.string().min(1),
  title: z.string().min(1),
  propertyName: z.string().min(1),
  completedAt: z.string(),
  completedByName: z.string().nullable()
});

// ============================================================================
// COMPLETE DASHBOARD SCHEMA (AC-10)
// ============================================================================

/**
 * Complete Maintenance Dashboard schema
 */
export const maintenanceDashboardSchema = z.object({
  kpis: maintenanceKpiSchema,
  jobsByStatus: z.array(jobsByStatusSchema),
  jobsByPriority: z.array(jobsByPrioritySchema),
  jobsByCategory: z.array(jobsByCategorySchema),
  highPriorityOverdueJobs: z.array(highPriorityJobSchema),
  highPriorityOverdueTotal: z.number().int().min(0),
  recentlyCompletedJobs: z.array(recentlyCompletedJobSchema)
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Paginated High Priority Jobs response schema
 */
export const highPriorityJobsPageSchema = z.object({
  content: z.array(highPriorityJobSchema),
  totalElements: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  size: z.number().int().min(1),
  number: z.number().int().min(0),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean()
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Dashboard filter schema
 */
export const maintenanceDashboardFilterSchema = z.object({
  propertyId: z.string().uuid().optional()
});

/**
 * High Priority Jobs filter schema (for click-to-filter)
 */
export const highPriorityJobsFilterSchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: workOrderStatusSchema.optional(),
  page: z.number().int().min(0).optional().default(0),
  size: z.number().int().min(1).max(100).optional().default(10)
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WorkOrderStatusValue = z.infer<typeof workOrderStatusSchema>;
export type MaintenanceJobPriorityValue = z.infer<typeof maintenanceJobPrioritySchema>;
export type MaintenanceJobCategoryValue = z.infer<typeof maintenanceJobCategorySchema>;
export type MaintenanceKpiValidated = z.infer<typeof maintenanceKpiSchema>;
export type JobsByStatusValidated = z.infer<typeof jobsByStatusSchema>;
export type JobsByPriorityValidated = z.infer<typeof jobsByPrioritySchema>;
export type JobsByCategoryValidated = z.infer<typeof jobsByCategorySchema>;
export type HighPriorityJobValidated = z.infer<typeof highPriorityJobSchema>;
export type RecentlyCompletedJobValidated = z.infer<typeof recentlyCompletedJobSchema>;
export type MaintenanceDashboardValidated = z.infer<typeof maintenanceDashboardSchema>;
export type HighPriorityJobsPageValidated = z.infer<typeof highPriorityJobsPageSchema>;
export type MaintenanceDashboardFilterValidated = z.infer<typeof maintenanceDashboardFilterSchema>;
export type HighPriorityJobsFilterValidated = z.infer<typeof highPriorityJobsFilterSchema>;
