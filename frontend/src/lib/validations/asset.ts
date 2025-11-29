/**
 * Asset Validation Schemas
 * Story 7.1: Asset Registry and Tracking
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import { AssetCategory, AssetStatus, AssetDocumentType } from '@/types/asset';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const assetCategorySchema = z.nativeEnum(AssetCategory);
export const assetStatusSchema = z.nativeEnum(AssetStatus);
export const assetDocumentTypeSchema = z.nativeEnum(AssetDocumentType);

// ============================================================================
// FILE VALIDATION CONSTANTS
// ============================================================================

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a new asset
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(assetCreateSchema),
 *   defaultValues: assetCreateDefaults
 * });
 * ```
 */
export const assetCreateSchema = z.object({
  // Asset Name - required, max 200 chars
  assetName: z
    .string()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be less than 200 characters')
    .trim(),

  // Category Selection - required
  category: assetCategorySchema.refine((val) => val !== undefined, {
    message: 'Please select a category'
  }),

  // Property ID - required
  propertyId: z
    .string()
    .min(1, 'Property is required')
    .uuid('Invalid property ID'),

  // Location - required, max 200 chars
  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .trim(),

  // Manufacturer - optional, max 100 chars
  manufacturer: z
    .string()
    .max(100, 'Manufacturer must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  // Model Number - optional, max 100 chars
  modelNumber: z
    .string()
    .max(100, 'Model number must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  // Serial Number - optional, max 100 chars
  serialNumber: z
    .string()
    .max(100, 'Serial number must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  // Installation Date - optional
  installationDate: z
    .string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid installation date')
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'Installation date cannot be in the future')
    .transform(val => val === '' ? null : val),

  // Warranty Expiry Date - optional
  warrantyExpiryDate: z
    .string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid warranty expiry date')
    .transform(val => val === '' ? null : val),

  // Purchase Cost - optional, positive number, 2 decimals max
  purchaseCost: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      return val;
    })
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val >= 0;
    }, 'Purchase cost must be a positive number')
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val <= 999999999.99;
    }, 'Purchase cost cannot exceed 999,999,999.99'),

  // Estimated Useful Life - optional, integer, years
  estimatedUsefulLife: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
      }
      return Math.floor(val);
    })
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val >= 1;
    }, 'Useful life must be at least 1 year')
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val <= 100;
    }, 'Useful life cannot exceed 100 years')
});

export type AssetCreateFormData = z.infer<typeof assetCreateSchema>;
export type AssetCreateInput = AssetCreateFormData; // Alias for React Hook Form usage

/**
 * Default values for asset create form
 */
export const assetCreateDefaults: AssetCreateFormData = {
  assetName: '',
  category: AssetCategory.OTHER,
  propertyId: '',
  location: '',
  manufacturer: null,
  modelNumber: null,
  serialNumber: null,
  installationDate: null,
  warrantyExpiryDate: null,
  purchaseCost: null,
  estimatedUsefulLife: null
};

/**
 * Validation schema for updating an existing asset
 */
export const assetUpdateSchema = z.object({
  assetName: z
    .string()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be less than 200 characters')
    .trim()
    .optional(),

  category: assetCategorySchema.optional(),

  propertyId: z
    .string()
    .uuid('Invalid property ID')
    .optional(),

  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional(),

  manufacturer: z
    .string()
    .max(100, 'Manufacturer must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  modelNumber: z
    .string()
    .max(100, 'Model number must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  serialNumber: z
    .string()
    .max(100, 'Serial number must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),

  installationDate: z
    .string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid installation date')
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'Installation date cannot be in the future')
    .transform(val => val === '' ? null : val),

  warrantyExpiryDate: z
    .string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid warranty expiry date')
    .transform(val => val === '' ? null : val),

  purchaseCost: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      return val;
    })
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val >= 0;
    }, 'Purchase cost must be a positive number')
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val <= 999999999.99;
    }, 'Purchase cost cannot exceed 999,999,999.99'),

  estimatedUsefulLife: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform(val => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
      }
      return Math.floor(val);
    })
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val >= 1;
    }, 'Useful life must be at least 1 year')
    .refine(val => {
      if (val === null || val === undefined) return true;
      return val <= 100;
    }, 'Useful life cannot exceed 100 years'),

  nextMaintenanceDate: z
    .string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid next maintenance date')
    .transform(val => val === '' ? null : val)
});

export type AssetUpdateFormData = z.infer<typeof assetUpdateSchema>;
export type AssetUpdateInput = AssetUpdateFormData; // Alias for React Hook Form usage

// ============================================================================
// STATUS UPDATE SCHEMA
// ============================================================================

/**
 * Validation schema for updating asset status
 */
export const assetStatusUpdateSchema = z.object({
  status: assetStatusSchema.refine((val) => val !== undefined, {
    message: 'Please select a status'
  }),

  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val)
});

export type AssetStatusUpdateFormData = z.infer<typeof assetStatusUpdateSchema>;

/**
 * Default values for status update form
 */
export const assetStatusUpdateDefaults: AssetStatusUpdateFormData = {
  status: AssetStatus.ACTIVE,
  notes: null
};

// ============================================================================
// DOCUMENT UPLOAD SCHEMA
// ============================================================================

/**
 * Validation schema for uploading asset document
 */
export const documentUploadSchema = z.object({
  documentType: assetDocumentTypeSchema.refine((val) => val !== undefined, {
    message: 'Please select a document type'
  }),

  // File is validated separately using validateDocumentFile function
  file: z.custom<File>((val) => val instanceof File, {
    message: 'Please select a file'
  })
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

/**
 * Default values for document upload form
 */
export const documentUploadDefaults = {
  documentType: AssetDocumentType.OTHER
};

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for asset list filters
 */
export const assetFilterSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  propertyId: z
    .string()
    .uuid('Invalid property ID')
    .optional()
    .nullable(),

  category: z
    .enum(['ALL', 'HVAC', 'ELEVATOR', 'GENERATOR', 'WATER_PUMP', 'FIRE_SYSTEM',
           'SECURITY_SYSTEM', 'ELECTRICAL_PANEL', 'PLUMBING_FIXTURE', 'APPLIANCE', 'OTHER'])
    .optional()
    .default('ALL'),

  status: z
    .enum(['ALL', 'ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DISPOSED'])
    .optional()
    .default('ALL'),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20),

  sortBy: z
    .enum(['assetNumber', 'assetName', 'category', 'status', 'warrantyExpiryDate', 'createdAt'])
    .optional()
    .default('createdAt'),

  sortDirection: z
    .enum(['ASC', 'DESC'])
    .optional()
    .default('DESC')
});

export type AssetFilterFormData = z.infer<typeof assetFilterSchema>;

/**
 * Default values for asset filter form
 */
export const assetFilterDefaults: AssetFilterFormData = {
  search: '',
  propertyId: null,
  category: 'ALL',
  status: 'ALL',
  page: 0,
  size: 20,
  sortBy: 'createdAt',
  sortDirection: 'DESC'
};

// ============================================================================
// FILE VALIDATION HELPERS
// ============================================================================

/**
 * Validate asset document file
 * Max 10MB, PDF/JPG/JPEG/PNG only
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const isValidType = ALLOWED_DOCUMENT_TYPES.includes(file.type) ||
                      ALLOWED_DOCUMENT_EXTENSIONS.includes(fileExtension);

  if (!isValidType) {
    return {
      valid: false,
      error: 'Only PDF, JPG, JPEG, and PNG files are allowed'
    };
  }

  return { valid: true };
}

/**
 * Validate multiple document files
 */
export function validateDocumentFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  files.forEach((file, index) => {
    const result = validateDocumentFile(file);
    if (!result.valid) {
      errors.push(`File ${index + 1} (${file.name}): ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get allowed document file extensions as string (for input accept attribute)
 */
export function getDocumentAcceptTypes(): string {
  return ALLOWED_DOCUMENT_EXTENSIONS.join(',');
}

/**
 * Get maximum document file size in MB
 */
export function getMaxDocumentSizeMB(): number {
  return MAX_DOCUMENT_SIZE / (1024 * 1024);
}

/**
 * Format currency amount as AED
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Check if asset can have status changed to specified status
 * DISPOSED assets cannot change status
 */
export function canChangeStatusTo(currentStatus: AssetStatus, targetStatus: AssetStatus): boolean {
  if (currentStatus === AssetStatus.DISPOSED) {
    return false; // DISPOSED cannot change to anything
  }
  return currentStatus !== targetStatus;
}

/**
 * Get available status options for status change (excluding current status and DISPOSED rule)
 */
export function getAvailableStatusOptions(currentStatus: AssetStatus): AssetStatus[] {
  if (currentStatus === AssetStatus.DISPOSED) {
    return []; // DISPOSED cannot change
  }

  return Object.values(AssetStatus).filter(status => status !== currentStatus);
}
