/**
 * PM Schedule Validation Schemas
 * Zod schemas for all PM schedule-related forms with comprehensive validation rules
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */

import { z } from 'zod';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import { RecurrenceType, PMScheduleStatus } from '@/types/pm-schedule';

// ===========================
// Common Validation Rules
// ===========================

const uuidSchema = z
  .string()
  .uuid('Please provide a valid ID');

const optionalUuidSchema = z
  .string()
  .uuid('Please provide a valid ID')
  .optional()
  .nullable()
  .or(z.literal(''));

// ===========================
// Create PM Schedule Schema
// ===========================

export const createPMScheduleSchema = z.object({
  scheduleName: z
    .string()
    .min(1, 'Schedule name is required')
    .max(100, 'Schedule name must be less than 100 characters')
    .trim(),

  propertyId: optionalUuidSchema.transform(val => val === '' ? null : val),

  category: z.nativeEnum(WorkOrderCategory, {
    errorMap: () => ({ message: 'Please select a category' })
  }),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),

  recurrenceType: z.nativeEnum(RecurrenceType, {
    errorMap: () => ({ message: 'Please select a recurrence type' })
  }),

  startDate: z
    .date({
      required_error: 'Start date is required',
      invalid_type_error: 'Please provide a valid date'
    })
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'Start date must be today or in the future' }
    ),

  endDate: z
    .date({
      invalid_type_error: 'Please provide a valid date'
    })
    .optional()
    .nullable(),

  defaultPriority: z.nativeEnum(WorkOrderPriority, {
    errorMap: () => ({ message: 'Please select a priority' })
  }),

  defaultAssigneeId: optionalUuidSchema.transform(val => val === '' ? null : val)
}).refine(
  (data) => {
    // If endDate is provided, it must be after startDate
    if (data.endDate && data.startDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

export type CreatePMScheduleFormData = z.infer<typeof createPMScheduleSchema>;

// ===========================
// Update PM Schedule Schema
// ===========================

export const updatePMScheduleSchema = z.object({
  scheduleName: z
    .string()
    .min(1, 'Schedule name is required')
    .max(100, 'Schedule name must be less than 100 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),

  category: z.nativeEnum(WorkOrderCategory).optional(),

  defaultPriority: z.nativeEnum(WorkOrderPriority).optional(),

  defaultAssigneeId: optionalUuidSchema.transform(val => val === '' ? null : val),

  endDate: z
    .date({
      invalid_type_error: 'Please provide a valid date'
    })
    .optional()
    .nullable()
});

export type UpdatePMScheduleFormData = z.infer<typeof updatePMScheduleSchema>;

// ===========================
// Update Status Schema
// ===========================

export const updatePMScheduleStatusSchema = z.object({
  status: z.nativeEnum(PMScheduleStatus, {
    errorMap: () => ({ message: 'Please select a valid status' })
  })
});

export type UpdatePMScheduleStatusFormData = z.infer<typeof updatePMScheduleStatusSchema>;

// ===========================
// PM Schedule Filters Schema
// ===========================

export const pmScheduleFiltersSchema = z.object({
  status: z.array(z.nativeEnum(PMScheduleStatus)).optional(),
  propertyId: uuidSchema.optional(),
  category: z.array(z.nativeEnum(WorkOrderCategory)).optional(),
  recurrenceType: z.array(z.nativeEnum(RecurrenceType)).optional(),
  search: z.string().optional(),
  page: z.number().int().nonnegative().optional().default(0),
  size: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional().default('nextGenerationDate'),
  sortDirection: z.enum(['ASC', 'DESC']).optional().default('ASC')
});

export type PMScheduleFiltersFormData = z.infer<typeof pmScheduleFiltersSchema>;

// ===========================
// Helper Functions
// ===========================

/**
 * Validate create PM schedule form data
 */
export function validateCreatePMSchedule(data: unknown) {
  return createPMScheduleSchema.safeParse(data);
}

/**
 * Validate update PM schedule form data
 */
export function validateUpdatePMSchedule(data: unknown) {
  return updatePMScheduleSchema.safeParse(data);
}

/**
 * Validate status update data
 */
export function validateStatusUpdate(data: unknown) {
  return updatePMScheduleStatusSchema.safeParse(data);
}

/**
 * Validate filters
 */
export function validatePMScheduleFilters(data: unknown) {
  return pmScheduleFiltersSchema.safeParse(data);
}
