/**
 * Document Validation Schemas
 * Story 7.2: Document Management System
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import {
  DocumentEntityType,
  DocumentAccessLevel,
  ALLOWED_DOCUMENT_FILE_TYPES,
  ALLOWED_DOCUMENT_FILE_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE_MB
} from '@/types/document';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const documentEntityTypeSchema = z.nativeEnum(DocumentEntityType);
export const documentAccessLevelSchema = z.nativeEnum(DocumentAccessLevel);

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Validation schema for document upload form
 * File validation is handled separately in the component
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(documentUploadSchema),
 *   defaultValues: documentUploadDefaults
 * });
 * ```
 */
export const documentUploadSchema = z.object({
  documentType: z
    .string()
    .min(1, 'Document type is required')
    .max(100, 'Document type must be less than 100 characters'),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  entityType: documentEntityTypeSchema.refine((val) => val !== undefined, {
    message: 'Please select an entity type'
  }),

  entityId: z
    .string()
    .uuid('Invalid entity ID format')
    .optional()
    .or(z.literal('')),

  expiryDate: z
    .string()
    .optional()
    .nullable(),

  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  accessLevel: documentAccessLevelSchema.default(DocumentAccessLevel.PUBLIC)
}).superRefine((data, ctx) => {
  // Check if entityId is required when entityType is not GENERAL
  if (data.entityType !== DocumentEntityType.GENERAL && !data.entityId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Entity selection is required for this entity type',
      path: ['entityId']
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
 * Type inference from upload schema (output type - after parsing)
 */
export type DocumentUploadFormData = z.output<typeof documentUploadSchema>;

/**
 * Input type for upload schema (input type - before parsing)
 * Used for form default values
 */
export type DocumentUploadFormInput = z.input<typeof documentUploadSchema>;

/**
 * Default values for document upload form
 */
export const documentUploadDefaults: DocumentUploadFormInput = {
  documentType: '',
  title: '',
  description: '',
  entityType: DocumentEntityType.GENERAL,
  entityId: '',
  expiryDate: undefined,
  tags: [],
  accessLevel: DocumentAccessLevel.PUBLIC
};

/**
 * Validation schema for document update form
 * Cannot change documentNumber, file, entityType, entityId
 */
export const documentUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  documentType: z
    .string()
    .min(1, 'Document type is required')
    .max(100, 'Document type must be less than 100 characters'),

  expiryDate: z
    .string()
    .optional()
    .nullable(),

  tags: z
    .array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  accessLevel: documentAccessLevelSchema.refine((val) => val !== undefined, {
    message: 'Please select an access level'
  })
});

/**
 * Type inference from update schema (output type - after parsing)
 */
export type DocumentUpdateFormData = z.output<typeof documentUpdateSchema>;

/**
 * Input type for update schema (input type - before parsing)
 * Used for form default values
 */
export type DocumentUpdateFormInput = z.input<typeof documentUpdateSchema>;

/**
 * Default values for document update form
 */
export const documentUpdateDefaults: DocumentUpdateFormInput = {
  title: '',
  description: '',
  documentType: '',
  expiryDate: undefined,
  tags: [],
  accessLevel: DocumentAccessLevel.PUBLIC
};

/**
 * Validation schema for document replace form
 */
export const documentReplaceSchema = z.object({
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

/**
 * Type inference from replace schema
 */
export type DocumentReplaceFormData = z.infer<typeof documentReplaceSchema>;

/**
 * Default values for document replace form
 */
export const documentReplaceDefaults: DocumentReplaceFormData = {
  notes: ''
};

// ============================================================================
// FILE VALIDATION SCHEMA
// ============================================================================

/**
 * Schema for validating uploaded file
 * Used separately from form schema since File objects need special handling
 */
export const documentFileValidationSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, {
      message: 'Please select a file'
    })
    .refine((file) => file.size <= MAX_DOCUMENT_FILE_SIZE, {
      message: `File size must not exceed ${MAX_DOCUMENT_FILE_SIZE_MB}MB`
    })
    .refine((file) => ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type), {
      message: 'Only PDF, JPG, PNG, DOC, DOCX, XLS, and XLSX files are allowed'
    })
});

/**
 * Type inference from file validation schema
 */
export type DocumentFileValidation = z.infer<typeof documentFileValidationSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a single file
 * Returns validation result with error message if invalid
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a file' };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return { valid: false, error: `File size must not exceed ${MAX_DOCUMENT_FILE_SIZE_MB}MB` };
  }

  if (!ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF, JPG, PNG, DOC, DOCX, XLS, and XLSX files are allowed' };
  }

  return { valid: true };
}

/**
 * Validate file type
 */
export function isValidDocumentFileType(file: File): boolean {
  return ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidDocumentFileSize(file: File): boolean {
  return file.size <= MAX_DOCUMENT_FILE_SIZE;
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
export function isAllowedDocumentExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_DOCUMENT_FILE_EXTENSIONS.includes(ext);
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string | undefined {
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return mimeMap[extension.toLowerCase()];
}

/**
 * Get human-readable file type name
 */
export function getFileTypeName(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPEG Image',
    'image/png': 'PNG Image',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet'
  };
  return typeMap[mimeType] || 'Unknown';
}

// ============================================================================
// FORM DATA HELPERS
// ============================================================================

/**
 * Create FormData from upload form data and file
 * For multipart/form-data submission
 */
export function createDocumentUploadFormData(
  data: DocumentUploadFormData,
  file: File
): FormData {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', data.documentType);
  formData.append('title', data.title);
  formData.append('entityType', data.entityType);
  formData.append('accessLevel', data.accessLevel);

  if (data.description) {
    formData.append('description', data.description);
  }

  if (data.entityId && data.entityType !== DocumentEntityType.GENERAL) {
    formData.append('entityId', data.entityId);
  }

  if (data.expiryDate) {
    formData.append('expiryDate', data.expiryDate);
  }

  if (data.tags && data.tags.length > 0) {
    formData.append('tags', JSON.stringify(data.tags));
  }

  return formData;
}

/**
 * Create FormData for document replace
 */
export function createDocumentReplaceFormData(
  data: DocumentReplaceFormData,
  file: File
): FormData {
  const formData = new FormData();
  formData.append('file', file);

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

/**
 * Parse tags string to array
 */
export function parseTagsInput(input: string): string[] {
  return input
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Format tags array to string for display
 */
export function formatTagsForDisplay(tags: string[]): string {
  return tags.join(', ');
}

// ============================================================================
// FILTER VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for document list filters
 */
export const documentFiltersSchema = z.object({
  entityType: documentEntityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  documentType: z.string().optional(),
  expiryStatus: z.enum(['all', 'expiring_soon', 'expired', 'valid']).optional(),
  accessLevel: documentAccessLevelSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(0).optional().default(0),
  size: z.number().min(1).max(100).optional().default(20),
  sort: z.string().optional().default('uploadedAt,desc')
});

/**
 * Type inference from filters schema
 */
export type DocumentFiltersFormData = z.infer<typeof documentFiltersSchema>;

/**
 * Default values for document filters
 */
export const documentFiltersDefaults: DocumentFiltersFormData = {
  page: 0,
  size: 20,
  sort: 'uploadedAt,desc'
};

/**
 * Schema for expiring documents filter
 */
export const expiringDocumentsFiltersSchema = z.object({
  days: z.number().min(1).max(365).optional().default(30)
});

/**
 * Type inference from expiring documents filter schema
 */
export type ExpiringDocumentsFiltersFormData = z.infer<typeof expiringDocumentsFiltersSchema>;
