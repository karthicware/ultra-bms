/**
 * Parking Spot Validation Schemas
 * Story 3.8: Parking Spot Inventory Management
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { ParkingSpotStatus } from '@/types/parking';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Schema for ParkingSpotStatus enum validation
 */
export const parkingSpotStatusSchema = z.nativeEnum(ParkingSpotStatus);

// ============================================================================
// CREATE PARKING SPOT SCHEMA
// ============================================================================

/**
 * Validation schema for creating a new parking spot
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(createParkingSpotSchema),
 *   defaultValues: createParkingSpotDefaults
 * });
 * ```
 */
export const createParkingSpotSchema = z.object({
  /**
   * Property ID (required UUID)
   */
  propertyId: z
    .string()
    .min(1, 'Please select a building')
    .uuid('Please select a valid building'),

  /**
   * Spot number (required, max 20 chars)
   * Examples: P2-115, A-101, G-12
   */
  spotNumber: z
    .string()
    .min(1, 'Spot number is required')
    .max(20, 'Spot number cannot exceed 20 characters')
    .trim(),

  /**
   * Default monthly fee (required, >= 0)
   */
  defaultFee: z
    .number({ message: 'Default fee is required' })
    .min(0, 'Fee cannot be negative'),

  /**
   * Optional notes (max 500 chars)
   */
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
});

/**
 * Type inference from create parking spot schema
 */
export type CreateParkingSpotFormData = z.infer<typeof createParkingSpotSchema>;

/**
 * Default values for create parking spot form
 */
export const createParkingSpotDefaults: CreateParkingSpotFormData = {
  propertyId: '',
  spotNumber: '',
  defaultFee: 0,
  notes: ''
};

// ============================================================================
// UPDATE PARKING SPOT SCHEMA
// ============================================================================

/**
 * Validation schema for updating an existing parking spot
 * Same validation as create, but all fields optional for partial updates
 */
export const updateParkingSpotSchema = z.object({
  /**
   * Property ID (optional UUID - cannot change if ASSIGNED)
   */
  propertyId: z
    .string()
    .uuid('Please select a valid building')
    .optional(),

  /**
   * Spot number (optional, max 20 chars)
   */
  spotNumber: z
    .string()
    .min(1, 'Spot number is required')
    .max(20, 'Spot number cannot exceed 20 characters')
    .trim()
    .optional(),

  /**
   * Default monthly fee (optional, >= 0)
   */
  defaultFee: z
    .number({ message: 'Default fee must be a number' })
    .min(0, 'Fee cannot be negative')
    .optional(),

  /**
   * Optional notes (max 500 chars)
   */
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
});

/**
 * Type inference from update parking spot schema
 */
export type UpdateParkingSpotFormData = z.infer<typeof updateParkingSpotSchema>;

// ============================================================================
// STATUS CHANGE SCHEMA
// ============================================================================

/**
 * Validation schema for status change request
 * Only allows AVAILABLE or UNDER_MAINTENANCE (ASSIGNED is managed via tenant flows)
 */
export const changeStatusSchema = z.object({
  status: z.enum([ParkingSpotStatus.AVAILABLE, ParkingSpotStatus.UNDER_MAINTENANCE], {
    message: 'Invalid status. Only Available or Under Maintenance allowed.'
  })
});

/**
 * Type inference from status change schema
 */
export type ChangeStatusFormData = z.infer<typeof changeStatusSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Validation schema for bulk delete operation
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid parking spot ID'))
    .min(1, 'At least one parking spot must be selected')
});

/**
 * Type inference from bulk delete schema
 */
export type BulkDeleteFormData = z.infer<typeof bulkDeleteSchema>;

/**
 * Validation schema for bulk status change operation
 */
export const bulkStatusChangeSchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid parking spot ID'))
    .min(1, 'At least one parking spot must be selected'),
  status: z.enum([ParkingSpotStatus.AVAILABLE, ParkingSpotStatus.UNDER_MAINTENANCE], {
    message: 'Invalid status. Only Available or Under Maintenance allowed.'
  })
});

/**
 * Type inference from bulk status change schema
 */
export type BulkStatusChangeFormData = z.infer<typeof bulkStatusChangeSchema>;

// ============================================================================
// FILTER SCHEMA
// ============================================================================

/**
 * Validation schema for parking spot filters
 */
export const parkingSpotFilterSchema = z.object({
  propertyId: z.string().uuid().optional().or(z.literal('')),

  status: parkingSpotStatusSchema.optional(),

  search: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sort: z.string().optional()
});

/**
 * Type inference from filter schema
 */
export type ParkingSpotFilterFormData = z.infer<typeof parkingSpotFilterSchema>;

/**
 * Default values for parking spot filter form
 */
export const parkingSpotFilterDefaults: ParkingSpotFilterFormData = {
  propertyId: '',
  search: '',
  page: 0,
  size: 20,
  sort: 'spotNumber,asc'
};

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate spot number format
 * Allows alphanumeric characters, hyphens, and slashes
 *
 * @param spotNumber - Spot number to validate
 * @returns true if valid format
 */
export function isValidSpotNumberFormat(spotNumber: string): boolean {
  // Allow alphanumeric, hyphens, underscores, and slashes
  const pattern = /^[A-Za-z0-9\-_/]+$/;
  return pattern.test(spotNumber);
}

/**
 * Validate that fee is a valid monetary amount
 *
 * @param fee - Fee amount to validate
 * @returns true if valid (non-negative, max 2 decimal places)
 */
export function isValidFeeAmount(fee: number): boolean {
  if (fee < 0) return false;
  // Check max 2 decimal places
  const decimalParts = fee.toString().split('.');
  if (decimalParts.length === 2 && decimalParts[1].length > 2) {
    return false;
  }
  return true;
}

/**
 * Parse and validate fee input from string
 *
 * @param value - String value to parse
 * @returns Parsed number or null if invalid
 */
export function parseFeeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) return null;

  // Round to 2 decimal places
  return Math.round(parsed * 100) / 100;
}

/**
 * Validate bulk operation selection
 *
 * @param selectedIds - Array of selected IDs
 * @param spots - All parking spots
 * @returns Object with validation result and any warnings
 */
export function validateBulkSelection(
  selectedIds: string[],
  spots: { id: string; status: string }[]
): { valid: boolean; assignedCount: number; warnings: string[] } {
  const warnings: string[] = [];
  let assignedCount = 0;

  selectedIds.forEach((id) => {
    const spot = spots.find((s) => s.id === id);
    if (spot?.status === ParkingSpotStatus.ASSIGNED) {
      assignedCount++;
    }
  });

  if (assignedCount > 0) {
    warnings.push(
      `${assignedCount} assigned spot(s) will be skipped as they cannot be modified`
    );
  }

  return {
    valid: selectedIds.length > 0,
    assignedCount,
    warnings
  };
}
