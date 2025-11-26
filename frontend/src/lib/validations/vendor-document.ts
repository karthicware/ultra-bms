/**
 * Vendor Document Validation Schemas
 * Story 5.2: Vendor Document and License Management
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import {
  DocumentType,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
  requiresExpiryDate
} from '@/types/vendor-documents';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const documentTypeSchema = z.nativeEnum(DocumentType);

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for vendor document upload form
 * File validation is handled separately in the component
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(vendorDocumentUploadSchema),
 *   defaultValues: {
 *     documentType: DocumentType.TRADE_LICENSE,
 *     expiryDate: undefined,
 *     notes: ''
 *   }
 * });
 * ```
 */
export const vendorDocumentUploadSchema = z.object({
  documentType: documentTypeSchema.refine((val) => val !== undefined, {
    message: 'Please select a document type'
  }),

  expiryDate: z
    .string()
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(200, 'Notes must be less than 200 characters')
    .optional()
    .or(z.literal(''))
}).superRefine((data, ctx) => {
  // Check if expiry date is required based on document type
  if (requiresExpiryDate(data.documentType) && !data.expiryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expiry date is required for this document type',
      path: ['expiryDate']
    });
  }

  // Check if expiry date is in the future (for new uploads)
  if (data.expiryDate) {
    const expiryDate = new Date(data.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expiry date must be in the future',
        path: ['expiryDate']
      });
    }
  }
});

/**
 * Type inference from upload schema
 */
export type VendorDocumentUploadFormData = z.infer<typeof vendorDocumentUploadSchema>;

/**
 * Default values for document upload form
 */
export const vendorDocumentUploadDefaults: VendorDocumentUploadFormData = {
  documentType: DocumentType.TRADE_LICENSE,
  expiryDate: undefined,
  notes: ''
};

// ============================================================================
// FILE VALIDATION SCHEMA
// ============================================================================

/**
 * Schema for validating uploaded file
 * Used separately from form schema since File objects need special handling
 */
export const fileValidationSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, {
      message: 'Please select a file'
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must not exceed ${MAX_FILE_SIZE_MB}MB`
    })
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
      message: 'Only PDF, JPG, JPEG, and PNG files are allowed'
    })
});

/**
 * Type inference from file validation schema
 */
export type FileValidation = z.infer<typeof fileValidationSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a single file
 * Returns validation result with error message if invalid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a file' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must not exceed ${MAX_FILE_SIZE_MB}MB` };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF, JPG, JPEG, and PNG files are allowed' };
  }

  return { valid: true };
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '';
}

/**
 * Check if file extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string | undefined {
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  return mimeMap[extension.toLowerCase()];
}

// ============================================================================
// FORM DATA HELPERS
// ============================================================================

/**
 * Create FormData from upload form data and file
 * For multipart/form-data submission
 */
export function createUploadFormData(
  data: VendorDocumentUploadFormData,
  file: File
): FormData {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', data.documentType);

  if (data.expiryDate) {
    formData.append('expiryDate', data.expiryDate);
  }

  if (data.notes) {
    formData.append('notes', data.notes);
  }

  return formData;
}

/**
 * Parse date string to ISO format for API
 */
export function formatDateForApi(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
}
