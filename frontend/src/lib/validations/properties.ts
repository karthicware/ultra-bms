/**
 * Property Management Validation Schemas
 * Zod schemas for property creation, editing, and image uploads with comprehensive validation rules
 */

import { z } from 'zod';
import { PropertyType, PropertyStatus } from '@/types/properties';

// ===========================
// Common Validation Rules
// ===========================

/**
 * Property name validation
 */
const propertyNameSchema = z
  .string()
  .min(1, 'Property name is required')
  .min(2, 'Property name must be at least 2 characters')
  .max(255, 'Property name must be less than 255 characters')
  .trim();

/**
 * Address validation
 */
const addressSchema = z
  .string()
  .min(1, 'Address is required')
  .min(10, 'Address must be at least 10 characters')
  .max(500, 'Address must be less than 500 characters')
  .trim();

/**
 * Total units count validation
 */
const totalUnitsCountSchema = z
  .number()
  .int('Total units count must be a whole number')
  .min(1, 'Property must have at least 1 unit')
  .max(10000, 'Total units count cannot exceed 10,000');

/**
 * Year built validation
 */
const yearBuiltSchema = z
  .number()
  .int('Year built must be a whole number')
  .min(1800, 'Year built must be 1800 or later')
  .max(new Date().getFullYear() + 2, `Year built cannot exceed ${new Date().getFullYear() + 2}`)
  .optional()
  .nullable();

/**
 * Square footage validation
 */
const squareFootageSchema = z
  .number()
  .positive('Square footage must be positive')
  .max(10000000, 'Square footage cannot exceed 10,000,000 sq ft')
  .optional()
  .nullable();

/**
 * Manager ID validation
 */
const managerIdSchema = z
  .string()
  .uuid('Invalid manager ID format')
  .optional()
  .or(z.literal(''));

/**
 * Amenities array validation
 */
const amenitiesSchema = z
  .array(
    z.string().min(1, 'Amenity name cannot be empty').max(100, 'Amenity name is too long')
  )
  .max(50, 'Maximum 50 amenities allowed');

// ===========================
// Form Validation Schemas
// ===========================

/**
 * Create Property Form Schema
 * Used for new property creation with all required fields
 */
export const createPropertySchema = z.object({
  name: propertyNameSchema,
  address: addressSchema,
  propertyType: z.nativeEnum(PropertyType),
  totalUnitsCount: totalUnitsCountSchema,
  managerId: managerIdSchema,
  yearBuilt: yearBuiltSchema,
  totalSquareFootage: squareFootageSchema,
  amenities: amenitiesSchema,
});

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>;

/**
 * Update Property Form Schema
 * Allows partial updates with at least one field required
 */
export const updatePropertySchema = z
  .object({
    name: propertyNameSchema.optional(),
    address: addressSchema.optional(),
    propertyType: z.nativeEnum(PropertyType).optional(),
    totalUnitsCount: totalUnitsCountSchema.optional(),
    managerId: managerIdSchema,
    yearBuilt: yearBuiltSchema,
    totalSquareFootage: squareFootageSchema,
    amenities: amenitiesSchema.optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
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

export type UpdatePropertyFormData = z.infer<typeof updatePropertySchema>;

/**
 * Property Search/Filter Schema
 */
export const propertySearchSchema = z.object({
  page: z.number().int().min(0).optional().default(0),
  size: z.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional().default('name'),
  direction: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().max(255).optional(),
  types: z.array(z.nativeEnum(PropertyType)).optional(),
  managerId: z.string().uuid().optional(),
  occupancyMin: z.number().min(0).max(100).optional(),
  occupancyMax: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
});

export type PropertySearchFormData = z.infer<typeof propertySearchSchema>;

/**
 * Property Image Upload Schema
 * Validates file uploads for property images
 */
export const propertyImageUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Please select a file to upload' })
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'File size must be less than 10MB',
    })
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      {
        message: 'File must be a JPEG, PNG, or WebP image',
      }
    ),
  displayOrder: z.number().int().min(0).max(99).optional(),
});

export type PropertyImageUploadFormData = z.infer<typeof propertyImageUploadSchema>;

/**
 * Assign Property Manager Schema
 */
export const assignManagerSchema = z.object({
  managerId: z.string().uuid('Please select a valid manager'),
});

export type AssignManagerFormData = z.infer<typeof assignManagerSchema>;

/**
 * Bulk Property Delete Schema
 */
export const bulkDeletePropertiesSchema = z.object({
  propertyIds: z
    .array(z.string().uuid())
    .min(1, 'Please select at least one property')
    .max(100, 'Cannot delete more than 100 properties at once'),
  confirmationText: z
    .string()
    .min(1, 'Please type DELETE to confirm')
    .refine((text) => text === 'DELETE', {
      message: 'Please type DELETE to confirm deletion',
    }),
});

export type BulkDeletePropertiesFormData = z.infer<typeof bulkDeletePropertiesSchema>;

// ===========================
// Derived Validation Helpers
// ===========================

/**
 * Validates occupancy rate calculation inputs
 */
export const validateOccupancyInputs = (
  occupiedUnits: number,
  totalUnits: number
): { valid: boolean; error?: string } => {
  if (occupiedUnits < 0) {
    return { valid: false, error: 'Occupied units cannot be negative' };
  }
  if (occupiedUnits > totalUnits) {
    return { valid: false, error: 'Occupied units cannot exceed total units' };
  }
  return { valid: true };
};

/**
 * Validates amenity input (reusable for dynamic forms)
 */
export const amenityInputSchema = z
  .string()
  .min(1, 'Amenity name is required')
  .max(100, 'Amenity name must be less than 100 characters')
  .trim();
