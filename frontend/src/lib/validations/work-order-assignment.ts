/**
 * Work Order Assignment Validation Schemas
 * Story 4.3: Work Order Assignment and Vendor Coordination
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { AssigneeType } from '@/types/work-order-assignment';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const assigneeTypeSchema = z.nativeEnum(AssigneeType);

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for assigning a work order
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(assignWorkOrderSchema),
 *   defaultValues: {
 *     assigneeType: AssigneeType.INTERNAL_STAFF,
 *     assigneeId: '',
 *     assignmentNotes: ''
 *   }
 * });
 * ```
 */
export const assignWorkOrderSchema = z.object({
  assigneeType: assigneeTypeSchema.refine((val) => val !== undefined, {
    message: 'Please select an assignee type'
  }),

  assigneeId: z
    .string()
    .min(1, 'Please select an assignee')
    .uuid('Invalid assignee ID'),

  assignmentNotes: z
    .string()
    .max(500, 'Assignment notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

/**
 * Type inference from assign schema
 */
export type AssignWorkOrderFormData = z.infer<typeof assignWorkOrderSchema>;

/**
 * Validation schema for reassigning a work order
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(reassignWorkOrderSchema),
 *   defaultValues: {
 *     newAssigneeType: AssigneeType.INTERNAL_STAFF,
 *     newAssigneeId: '',
 *     reassignmentReason: '',
 *     assignmentNotes: ''
 *   }
 * });
 * ```
 */
export const reassignWorkOrderSchema = z.object({
  newAssigneeType: assigneeTypeSchema.refine((val) => val !== undefined, {
    message: 'Please select an assignee type'
  }),

  newAssigneeId: z
    .string()
    .min(1, 'Please select a new assignee')
    .uuid('Invalid assignee ID'),

  reassignmentReason: z
    .string()
    .min(10, 'Reassignment reason must be at least 10 characters')
    .max(200, 'Reassignment reason must be less than 200 characters')
    .trim(),

  assignmentNotes: z
    .string()
    .max(500, 'Assignment notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

/**
 * Type inference from reassign schema
 */
export type ReassignWorkOrderFormData = z.infer<typeof reassignWorkOrderSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for unassigned work orders filters
 */
export const unassignedWorkOrderFiltersSchema = z.object({
  propertyId: z.string().uuid().optional(),
  priority: z.array(z.enum(['HIGH', 'MEDIUM', 'LOW'])).optional(),
  category: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).max(100).optional()
});

/**
 * Type inference from filters schema
 */
export type UnassignedWorkOrderFiltersFormData = z.infer<typeof unassignedWorkOrderFiltersSchema>;
