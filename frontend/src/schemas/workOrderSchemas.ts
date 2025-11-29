/**
 * Work Order Validation Schemas
 * Zod schemas for all work order-related forms with comprehensive validation rules
 *
 * Story 4.1: Work Order Creation and Management
 */

import { z } from 'zod';
import { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from '@/types/work-orders';

// ===========================
// Common Validation Rules
// ===========================

const uuidSchema = z
  .string()
  .uuid('Please provide a valid ID');

const dateTimeSchema = z
  .string()
  .datetime('Please provide a valid date and time')
  .optional()
  .or(z.literal(''));

const positiveNumberSchema = z
  .number()
  .nonnegative('Value must be zero or positive')
  .optional();

// ===========================
// Create Work Order Schema
// ===========================

export const createWorkOrderSchema = z.object({
  propertyId: uuidSchema,
  unitId: uuidSchema.optional().or(z.literal('')),
  category: z.union([
    z.nativeEnum(WorkOrderCategory),
    z.literal('')
  ]).refine((val) => val !== '', {
    message: 'Please select a category',
  }),
  priority: z.nativeEnum(WorkOrderPriority),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),
  scheduledDate: dateTimeSchema,
  accessInstructions: z
    .string()
    .max(500, 'Access instructions must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  estimatedCost: positiveNumberSchema,
  maintenanceRequestId: uuidSchema.optional().or(z.literal('')),
  // Asset link (Story 7.1: Asset Registry and Tracking - AC #16)
  assetId: uuidSchema.optional().or(z.literal(''))
});

export type CreateWorkOrderFormData = z.infer<typeof createWorkOrderSchema>;

// ===========================
// Update Work Order Schema
// ===========================

export const updateWorkOrderSchema = z.object({
  unitId: uuidSchema.optional().or(z.literal('')),
  category: z.nativeEnum(WorkOrderCategory).optional(),
  priority: z.nativeEnum(WorkOrderPriority).optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  scheduledDate: dateTimeSchema,
  accessInstructions: z
    .string()
    .max(500, 'Access instructions must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  estimatedCost: positiveNumberSchema,
  actualCost: positiveNumberSchema,
  totalHours: positiveNumberSchema,
  completionNotes: z
    .string()
    .max(2000, 'Completion notes must be less than 2000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  followUpNotes: z
    .string()
    .max(1000, 'Follow-up notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  // Asset link (Story 7.1: Asset Registry and Tracking - AC #16)
  assetId: uuidSchema.optional().or(z.literal(''))
});

export type UpdateWorkOrderFormData = z.infer<typeof updateWorkOrderSchema>;

// ===========================
// Update Status Schema
// ===========================

export const updateWorkOrderStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal(''))
});

export type UpdateWorkOrderStatusFormData = z.infer<typeof updateWorkOrderStatusSchema>;

// ===========================
// Assign Work Order Schema
// ===========================

export const assignWorkOrderSchema = z.object({
  assignedTo: uuidSchema,
  assignmentNotes: z
    .string()
    .max(500, 'Assignment notes must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal(''))
});

export type AssignWorkOrderFormData = z.infer<typeof assignWorkOrderSchema>;

// ===========================
// Add Comment Schema
// ===========================

export const addCommentSchema = z.object({
  commentText: z
    .string()
    .min(1, 'Comment text is required')
    .max(2000, 'Comment must be less than 2000 characters')
    .trim()
});

export type AddCommentFormData = z.infer<typeof addCommentSchema>;

// ===========================
// File Upload Schema
// ===========================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: 'File size must be less than 5MB'
  })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: 'Only JPG and PNG images are allowed'
  });

export const multipleFilesSchema = z
  .array(fileSchema)
  .max(5, 'Maximum 5 photos allowed')
  .optional();

// ===========================
// Work Order Filters Schema
// ===========================

export const workOrderFiltersSchema = z.object({
  propertyId: uuidSchema.optional(),
  unitId: uuidSchema.optional(),
  status: z.array(z.nativeEnum(WorkOrderStatus)).optional(),
  category: z.array(z.nativeEnum(WorkOrderCategory)).optional(),
  priority: z.array(z.nativeEnum(WorkOrderPriority)).optional(),
  assignedTo: uuidSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().nonnegative().optional().default(0),
  size: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional().default('scheduledDate'),
  sortDirection: z.enum(['ASC', 'DESC']).optional().default('DESC')
});

export type WorkOrderFiltersFormData = z.infer<typeof workOrderFiltersSchema>;
