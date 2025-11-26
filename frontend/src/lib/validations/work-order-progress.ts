/**
 * Work Order Progress Validation Schemas
 * Zod schemas for progress update and completion forms
 *
 * Story 4.4: Job Progress Tracking and Completion
 */

import { z } from 'zod';

// ============================================================================
// Common Validation Rules
// ============================================================================

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validate a single file
 */
const fileSchema = z
  .instanceof(File)
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    { message: 'Each photo must be less than 5MB' }
  )
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    { message: 'Only JPEG, PNG, and WebP images are allowed' }
  );

/**
 * Optional file array (for progress update photos)
 */
const optionalPhotosSchema = z
  .array(fileSchema)
  .max(MAX_PHOTOS, `Maximum ${MAX_PHOTOS} photos allowed per update`)
  .optional()
  .nullable()
  .transform((val) => val ?? []);

/**
 * Required file array (for completion after photos)
 */
const requiredPhotosSchema = z
  .array(fileSchema)
  .min(1, 'At least one after photo is required')
  .max(MAX_PHOTOS, `Maximum ${MAX_PHOTOS} photos allowed`);

// ============================================================================
// Add Progress Update Schema (AC5, AC6, AC7, AC8)
// ============================================================================

export const addProgressUpdateSchema = z.object({
  progressNotes: z
    .string()
    .min(1, 'Progress notes are required')
    .max(500, 'Progress notes must be less than 500 characters')
    .trim(),

  photos: optionalPhotosSchema,

  estimatedCompletionDate: z
    .date({ message: 'Please provide a valid date' })
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'Estimated completion date must be today or in the future' }
    )
});

export type AddProgressUpdateFormData = z.infer<typeof addProgressUpdateSchema>;

// ============================================================================
// Mark Complete Schema (AC13, AC14, AC15, AC16, AC17, AC18)
// ============================================================================

export const markCompleteSchema = z.object({
  completionNotes: z
    .string()
    .min(20, 'Completion notes must be at least 20 characters')
    .max(1000, 'Completion notes must be less than 1000 characters')
    .trim(),

  afterPhotos: requiredPhotosSchema,

  hoursSpent: z
    .number({ message: 'Hours spent must be a number' })
    .min(0.1, 'Hours spent must be at least 0.1')
    .max(999, 'Hours spent cannot exceed 999')
    .multipleOf(0.5, 'Hours spent must be in 0.5 hour increments')
    .or(z.string().transform((val) => parseFloat(val)))
    .pipe(z.number().min(0.1).max(999)),

  totalCost: z
    .number({ message: 'Total cost must be a number' })
    .min(0, 'Total cost cannot be negative')
    .max(999999, 'Total cost cannot exceed 999,999')
    .or(z.string().transform((val) => parseFloat(val)))
    .pipe(z.number().min(0).max(999999)),

  recommendations: z
    .string()
    .max(500, 'Recommendations must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  followUpRequired: z
    .boolean()
    .default(false),

  followUpDescription: z
    .string()
    .max(200, 'Follow-up description must be less than 200 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || undefined)
}).refine(
  (data) => {
    // If followUpRequired is true, followUpDescription must be provided
    if (data.followUpRequired && !data.followUpDescription) {
      return false;
    }
    return true;
  },
  {
    message: 'Follow-up description is required when follow-up is needed',
    path: ['followUpDescription']
  }
);

export type MarkCompleteFormData = z.infer<typeof markCompleteSchema>;

// ============================================================================
// Start Work Schema (for optional before photos)
// ============================================================================

export const startWorkSchema = z.object({
  beforePhotos: optionalPhotosSchema
});

export type StartWorkFormData = z.infer<typeof startWorkSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate add progress update form data
 */
export function validateAddProgressUpdate(data: unknown) {
  return addProgressUpdateSchema.safeParse(data);
}

/**
 * Validate mark complete form data
 */
export function validateMarkComplete(data: unknown) {
  return markCompleteSchema.safeParse(data);
}

/**
 * Validate start work form data
 */
export function validateStartWork(data: unknown) {
  return startWorkSchema.safeParse(data);
}

/**
 * Get character count text for a field
 */
export function getCharacterCount(value: string, maxLength: number): string {
  return `${value.length}/${maxLength} characters`;
}

/**
 * Check if a file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

/**
 * Check if a file is within size limit
 */
export function isWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Get file validation error message
 */
export function getFileValidationError(file: File): string | null {
  if (!isValidImageType(file)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }
  if (!isWithinSizeLimit(file)) {
    return 'File size must be less than 5MB';
  }
  return null;
}

/**
 * Constants for use in components
 */
export const VALIDATION_CONSTANTS = {
  MAX_PHOTOS,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / (1024 * 1024),
  ACCEPTED_IMAGE_TYPES,
  PROGRESS_NOTES_MAX_LENGTH: 500,
  COMPLETION_NOTES_MIN_LENGTH: 20,
  COMPLETION_NOTES_MAX_LENGTH: 1000,
  RECOMMENDATIONS_MAX_LENGTH: 500,
  FOLLOW_UP_DESCRIPTION_MAX_LENGTH: 200,
  HOURS_SPENT_MIN: 0.1,
  HOURS_SPENT_MAX: 999,
  HOURS_SPENT_STEP: 0.5,
  TOTAL_COST_MIN: 0,
  TOTAL_COST_MAX: 999999,
  TOTAL_COST_STEP: 0.01
} as const;
