/**
 * Unit Management Validation Schemas
 * Zod schemas for unit creation, editing, bulk operations, and status management
 */

import { z } from 'zod';
import { UnitStatus, IncrementPattern, STATUS_TRANSITIONS } from '@/types/units';

// ===========================
// Common Validation Rules
// ===========================

/**
 * Unit number validation
 */
const unitNumberSchema = z
  .string()
  .min(1, 'Unit number is required')
  .max(50, 'Unit number must be less than 50 characters')
  .regex(/^[A-Z0-9-]+$/i, 'Unit number can only contain letters, numbers, and hyphens')
  .trim();

/**
 * Floor validation
 */
const floorSchema = z
  .number()
  .int('Floor must be a whole number')
  .min(-5, 'Floor cannot be below -5 (basement 5)')
  .max(200, 'Floor cannot exceed 200')
  .optional()
  .nullable();

/**
 * Bedroom count validation
 * Allows half increments for studio with den (e.g., 0.5, 1.5, 2.5)
 */
const bedroomCountSchema = z
  .number()
  .min(0, 'Bedroom count cannot be negative')
  .max(20, 'Bedroom count cannot exceed 20')
  .refine((val) => val % 0.5 === 0, {
    message: 'Bedroom count must be in 0.5 increments (e.g., 0.5, 1, 1.5)',
  });

/**
 * Bathroom count validation
 */
const bathroomCountSchema = z
  .number()
  .min(0.5, 'Bathroom count must be at least 0.5')
  .max(20, 'Bathroom count cannot exceed 20')
  .refine((val) => val % 0.5 === 0, {
    message: 'Bathroom count must be in 0.5 increments (e.g., 1.5, 2, 2.5)',
  });

/**
 * Square footage validation (for units)
 */
const unitSquareFootageSchema = z
  .number()
  .positive('Square footage must be positive')
  .min(100, 'Unit must be at least 100 sq ft')
  .max(50000, 'Unit cannot exceed 50,000 sq ft')
  .optional()
  .nullable();

/**
 * Monthly rent validation
 */
const monthlyRentSchema = z
  .number()
  .positive('Monthly rent must be positive')
  .min(500, 'Monthly rent must be at least AED 500')
  .max(1000000, 'Monthly rent cannot exceed AED 1,000,000')
  .multipleOf(0.01, 'Monthly rent must be a valid currency amount');

/**
 * Property ID validation
 */
const propertyIdSchema = z
  .string()
  .uuid('Invalid property ID format');

/**
 * Status change reason validation
 */
const statusChangeReasonSchema = z
  .string()
  .min(1, 'Reason is required')
  .min(10, 'Reason must be at least 10 characters')
  .max(500, 'Reason must be less than 500 characters')
  .trim();

// ===========================
// Form Validation Schemas
// ===========================

/**
 * Create Unit Form Schema
 * Used for single unit creation
 */
export const createUnitSchema = z.object({
  propertyId: propertyIdSchema,
  unitNumber: unitNumberSchema,
  floor: floorSchema,
  bedroomCount: bedroomCountSchema,
  bathroomCount: bathroomCountSchema,
  squareFootage: unitSquareFootageSchema,
  monthlyRent: monthlyRentSchema,
  status: z.nativeEnum(UnitStatus),
  features: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type CreateUnitFormData = z.infer<typeof createUnitSchema>;

/**
 * Update Unit Form Schema
 * Allows partial updates
 */
export const updateUnitSchema = z
  .object({
    unitNumber: unitNumberSchema.optional(),
    floor: floorSchema,
    bedroomCount: bedroomCountSchema.optional(),
    bathroomCount: bathroomCountSchema.optional(),
    squareFootage: unitSquareFootageSchema,
    monthlyRent: monthlyRentSchema.optional(),
    status: z.nativeEnum(UnitStatus).optional(),
    features: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some(
        (value) => value !== undefined && value !== null && value !== ''
      ),
    {
      message: 'At least one field must be updated',
    }
  );

export type UpdateUnitFormData = z.infer<typeof updateUnitSchema>;

/**
 * Bulk Create Units Form Schema
 * Used for creating multiple units at once with auto-incrementing unit numbers
 */
export const bulkCreateUnitsSchema = z
  .object({
    propertyId: propertyIdSchema,
    startingUnitNumber: unitNumberSchema,
    count: z
      .number()
      .int('Count must be a whole number')
      .min(2, 'Must create at least 2 units for bulk operation')
      .max(500, 'Cannot create more than 500 units at once'),
    floor: z
      .number()
      .int('Floor must be a whole number')
      .min(-5, 'Floor cannot be below -5')
      .max(200, 'Floor cannot exceed 200'),
    incrementPattern: z.nativeEnum(IncrementPattern),
    bedroomCount: bedroomCountSchema,
    bathroomCount: bathroomCountSchema,
    squareFootage: unitSquareFootageSchema,
    monthlyRent: monthlyRentSchema,
    features: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .refine(
    (data) => {
      // For FLOOR_BASED pattern, validate starting unit number format
      if (data.incrementPattern === IncrementPattern.FLOOR_BASED) {
        const floorPrefix = String(data.floor).padStart(2, '0');
        return data.startingUnitNumber.startsWith(floorPrefix);
      }
      return true;
    },
    {
      message: 'For floor-based pattern, unit number must start with floor number (e.g., 05-01 for floor 5)',
      path: ['startingUnitNumber'],
    }
  );

export type BulkCreateUnitsFormData = z.infer<typeof bulkCreateUnitsSchema>;

/**
 * Update Unit Status Form Schema
 * Used for single unit status changes with reason tracking
 */
export const updateUnitStatusSchema = z
  .object({
    status: z.nativeEnum(UnitStatus),
    reason: statusChangeReasonSchema.optional(),
  })
  .refine(
    (data) => {
      // Require reason for certain status changes
      const requiresReason = [
        UnitStatus.UNDER_MAINTENANCE,
        UnitStatus.OCCUPIED,
      ].includes(data.status);
      return !requiresReason || (data.reason && data.reason.length > 0);
    },
    {
      message: 'Reason is required for this status change',
      path: ['reason'],
    }
  );

export type UpdateUnitStatusFormData = z.infer<typeof updateUnitStatusSchema>;

/**
 * Bulk Update Unit Status Schema
 * Used for updating status of multiple units at once
 */
export const bulkUpdateStatusSchema = z.object({
  unitIds: z
    .array(z.string().uuid())
    .min(1, 'Please select at least one unit')
    .max(100, 'Cannot update more than 100 units at once'),
  newStatus: z.nativeEnum(UnitStatus),
  reason: statusChangeReasonSchema.optional(),
});

export type BulkUpdateStatusFormData = z.infer<typeof bulkUpdateStatusSchema>;

/**
 * Unit Search/Filter Schema
 */
export const unitSearchSchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: z.array(z.nativeEnum(UnitStatus)).optional(),
  floorMin: z.number().int().optional(),
  floorMax: z.number().int().optional(),
  bedroomCount: z.array(z.number().int().min(0).max(20)).optional(),
  rentMin: z.number().min(0).optional(),
  rentMax: z.number().min(0).optional(),
  search: z.string().max(255).optional(),
});

export type UnitSearchFormData = z.infer<typeof unitSearchSchema>;

/**
 * Bulk Delete Units Schema
 */
export const bulkDeleteUnitsSchema = z.object({
  unitIds: z
    .array(z.string().uuid())
    .min(1, 'Please select at least one unit')
    .max(100, 'Cannot delete more than 100 units at once'),
  confirmationText: z
    .string()
    .min(1, 'Please type DELETE to confirm')
    .refine((text) => text === 'DELETE', {
      message: 'Please type DELETE to confirm deletion',
    }),
});

export type BulkDeleteUnitsFormData = z.infer<typeof bulkDeleteUnitsSchema>;

// ===========================
// Validation Helper Functions
// ===========================

/**
 * Validates if a status transition is allowed
 */
export const validateStatusTransition = (
  currentStatus: UnitStatus,
  newStatus: UnitStatus
): { valid: boolean; error?: string } => {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'Unit is already in this status' };
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
};

/**
 * Validates bulk status update eligibility
 */
export const validateBulkStatusUpdate = (
  units: Array<{ id: string; status: UnitStatus }>,
  newStatus: UnitStatus
): { valid: boolean; invalidUnits: string[]; error?: string } => {
  const invalidUnits: string[] = [];

  units.forEach((unit) => {
    const validation = validateStatusTransition(unit.status, newStatus);
    if (!validation.valid) {
      invalidUnits.push(unit.id);
    }
  });

  if (invalidUnits.length > 0) {
    return {
      valid: false,
      invalidUnits,
      error: `${invalidUnits.length} unit(s) cannot be transitioned to ${newStatus}`,
    };
  }

  return { valid: true, invalidUnits: [] };
};

/**
 * Validates unit number uniqueness within property
 */
export const validateUnitNumberUniqueness = (
  unitNumber: string,
  propertyId: string,
  existingUnitNumbers: string[],
  excludeUnitId?: string
): { valid: boolean; error?: string } => {
  const normalizedNumber = unitNumber.trim().toUpperCase();
  const isDuplicate = existingUnitNumbers.some(
    (existing) => existing.trim().toUpperCase() === normalizedNumber
  );

  if (isDuplicate) {
    return {
      valid: false,
      error: `Unit number ${unitNumber} already exists in this property`,
    };
  }

  return { valid: true };
};

/**
 * Generates unit numbers for bulk creation based on pattern
 */
export const generateUnitNumbers = (
  startingNumber: string,
  count: number,
  floor: number,
  pattern: IncrementPattern
): string[] => {
  const unitNumbers: string[] = [];

  switch (pattern) {
    case IncrementPattern.SEQUENTIAL: {
      // Extract numeric part and increment (e.g., 101 -> 102 -> 103)
      const match = startingNumber.match(/^([A-Z]*)(\d+)([A-Z]*)$/i);
      if (!match) {
        throw new Error('Invalid starting unit number for sequential pattern');
      }

      const [, prefix, numPart, suffix] = match;
      let currentNum = parseInt(numPart, 10);

      for (let i = 0; i < count; i++) {
        unitNumbers.push(`${prefix}${currentNum}${suffix}`);
        currentNum++;
      }
      break;
    }

    case IncrementPattern.FLOOR_BASED: {
      // Format: FF-NN (e.g., 05-01, 05-02 for floor 5)
      const floorPrefix = String(floor).padStart(2, '0');
      for (let i = 1; i <= count; i++) {
        const unitSuffix = String(i).padStart(2, '0');
        unitNumbers.push(`${floorPrefix}-${unitSuffix}`);
      }
      break;
    }

    case IncrementPattern.CUSTOM: {
      // User provides exact unit numbers (not implemented in this generator)
      throw new Error('Custom pattern requires manual input');
    }

    default:
      throw new Error('Invalid increment pattern');
  }

  return unitNumbers;
};
