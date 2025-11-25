/**
 * Maintenance Request Validation Schemas
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { isAfter, isSameDay, startOfDay } from 'date-fns';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

import { MaintenanceCategory, MaintenancePriority, PreferredAccessTime } from '@/types/maintenance';

export const maintenanceCategorySchema = z.nativeEnum(MaintenanceCategory);

export const maintenancePrioritySchema = z.nativeEnum(MaintenancePriority);

export const preferredAccessTimeSchema = z.nativeEnum(PreferredAccessTime);

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate uploaded file is an image (JPG/PNG)
 */
const imageFileSchema = z.custom<File>((file) => {
  if (!(file instanceof File)) return false;
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  return validTypes.includes(file.type);
}, 'File must be JPG or PNG');

/**
 * Validate file size (max 5MB)
 */
const fileSizeSchema = z.custom<File>((file) => {
  if (!(file instanceof File)) return false;
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSizeInBytes;
}, 'File size must not exceed 5MB');

/**
 * Combined file validation
 */
export const photoFileSchema = imageFileSchema.and(fileSizeSchema);

/**
 * Array of photos (max 5)
 */
export const photosArraySchema = z
  .array(photoFileSchema)
  .max(5, 'Maximum 5 photos allowed')
  .optional();

// ============================================================================
// DATE VALIDATION
// ============================================================================

/**
 * Validate preferred access date is today or in the future
 */
export const preferredAccessDateSchema = z
  .date()
  .refine(
    (date) => {
      const today = startOfDay(new Date());
      const selectedDate = startOfDay(date);
      return isAfter(selectedDate, today) || isSameDay(selectedDate, today);
    },
    { message: 'Access date cannot be in the past' }
  );

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a maintenance request
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(createMaintenanceRequestSchema),
 *   defaultValues: {
 *     category: undefined,
 *     priority: 'MEDIUM',
 *     title: '',
 *     description: '',
 *     preferredAccessTime: 'ANY_TIME',
 *     preferredAccessDate: new Date(),
 *   }
 * });
 * ```
 */
export const createMaintenanceRequestSchema = z.object({
  category: maintenanceCategorySchema.refine((val) => val !== undefined, {
    message: 'Please select a category'
  }),

  priority: maintenancePrioritySchema.refine((val) => val !== undefined, {
    message: 'Please select a priority'
  }),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),

  preferredAccessTime: preferredAccessTimeSchema.refine((val) => val !== undefined, {
    message: 'Please select preferred access time'
  }),

  preferredAccessDate: preferredAccessDateSchema,

  // Photos are handled separately in form state, not part of this schema
  // They are validated on upload and included in FormData on submit
});

/**
 * Type inference from schema
 */
export type CreateMaintenanceRequestFormData = z.infer<typeof createMaintenanceRequestSchema>;

/**
 * Validation schema for tenant feedback
 *
 * @example
 * ```typescript
 * const feedbackForm = useForm({
 *   resolver: zodResolver(submitFeedbackSchema),
 *   defaultValues: {
 *     rating: 0,
 *     comment: ''
 *   }
 * });
 * ```
 */
export const submitFeedbackSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Please provide a rating')
    .max(5, 'Rating must be between 1 and 5'),

  comment: z
    .string()
    .max(500, 'Comment must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Type inference from feedback schema
 */
export type SubmitFeedbackFormData = z.infer<typeof submitFeedbackSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for request list filters
 */
export const maintenanceRequestFiltersSchema = z.object({
  status: z.array(z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'])).optional(),
  category: z.array(maintenanceCategorySchema).optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

/**
 * Type inference from filters schema
 */
export type MaintenanceRequestFiltersFormData = z.infer<typeof maintenanceRequestFiltersSchema>;
