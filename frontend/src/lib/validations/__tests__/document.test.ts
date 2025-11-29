/**
 * Document Validation Schema Tests
 * Story 7.2: Document Management System
 * AC #40: Frontend unit tests for validation schemas
 */

import {
  documentUploadSchema,
  documentUpdateSchema,
  documentReplaceSchema,
  documentFiltersSchema,
  documentUploadDefaults,
  documentUpdateDefaults,
  documentReplaceDefaults,
  documentFiltersDefaults,
  validateDocumentFile,
  isValidDocumentFileType,
  isValidDocumentFileSize,
  getFileExtension,
  isAllowedDocumentExtension,
  getMimeTypeFromExtension,
  getFileTypeName,
  createDocumentUploadFormData,
  createDocumentReplaceFormData,
  formatDateForApi,
  parseTagsInput,
  formatTagsForDisplay,
  DocumentUploadFormData,
  DocumentUpdateFormData,
  DocumentReplaceFormData,
  DocumentFiltersFormData
} from '@/lib/validations/document';
import { DocumentEntityType, DocumentAccessLevel } from '@/types/document';

describe('Document Validation Schema', () => {
  // =================================================================
  // DOCUMENT UPLOAD SCHEMA TESTS
  // =================================================================

  describe('documentUploadSchema', () => {
    const validPropertyId = '123e4567-e89b-12d3-a456-426614174000';

    const validUploadData = {
      documentType: 'Contract',
      title: 'Test Document',
      description: 'Test description',
      entityType: DocumentEntityType.PROPERTY,
      entityId: validPropertyId,
      expiryDate: getFutureDateString(30),
      tags: ['contract', 'legal'],
      accessLevel: DocumentAccessLevel.INTERNAL
    };

    it('should validate a complete upload with all fields', () => {
      const result = documentUploadSchema.safeParse(validUploadData);
      expect(result.success).toBe(true);
    });

    it('should require documentType', () => {
      const data = { ...validUploadData, documentType: '' };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('documentType');
      }
    });

    it('should require title', () => {
      const data = { ...validUploadData, title: '' };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should validate title max length', () => {
      const data = { ...validUploadData, title: 'a'.repeat(201) };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow empty description', () => {
      const data = { ...validUploadData, description: '' };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate description max length', () => {
      const data = { ...validUploadData, description: 'a'.repeat(501) };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require entityId for non-GENERAL entityType', () => {
      const data = {
        ...validUploadData,
        entityType: DocumentEntityType.PROPERTY,
        entityId: ''
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('entityId'))).toBe(true);
      }
    });

    it('should allow empty entityId for GENERAL entityType', () => {
      const data = {
        ...validUploadData,
        entityType: DocumentEntityType.GENERAL,
        entityId: ''
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject past expiry dates', () => {
      const data = {
        ...validUploadData,
        expiryDate: getPastDateString(1)
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('expiryDate'))).toBe(true);
      }
    });

    it('should allow undefined expiry date', () => {
      const data = { ...validUploadData, expiryDate: undefined };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate tags max count', () => {
      const data = {
        ...validUploadData,
        tags: Array(11).fill('tag')
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate tag max length', () => {
      const data = {
        ...validUploadData,
        tags: ['a'.repeat(51)]
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate entity type enum values', () => {
      const data = {
        ...validUploadData,
        entityType: 'INVALID_TYPE'
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate access level enum values', () => {
      const data = {
        ...validUploadData,
        accessLevel: 'INVALID_LEVEL'
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate default values', () => {
      expect(documentUploadDefaults.documentType).toBe('');
      expect(documentUploadDefaults.title).toBe('');
      expect(documentUploadDefaults.entityType).toBe(DocumentEntityType.GENERAL);
      expect(documentUploadDefaults.accessLevel).toBe(DocumentAccessLevel.PUBLIC);
      expect(documentUploadDefaults.tags).toEqual([]);
    });
  });

  // =================================================================
  // DOCUMENT UPDATE SCHEMA TESTS
  // =================================================================

  describe('documentUpdateSchema', () => {
    const validUpdateData = {
      title: 'Updated Document Title',
      description: 'Updated description',
      documentType: 'Invoice',
      expiryDate: getFutureDateString(60),
      tags: ['updated', 'invoice'],
      accessLevel: DocumentAccessLevel.RESTRICTED
    };

    it('should validate a complete update', () => {
      const result = documentUpdateSchema.safeParse(validUpdateData);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const data = { ...validUpdateData, title: '' };
      const result = documentUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require documentType', () => {
      const data = { ...validUpdateData, documentType: '' };
      const result = documentUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate title max length', () => {
      const data = { ...validUpdateData, title: 'a'.repeat(201) };
      const result = documentUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow null expiry date', () => {
      const data = { ...validUpdateData, expiryDate: null };
      const result = documentUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate default values', () => {
      expect(documentUpdateDefaults.title).toBe('');
      expect(documentUpdateDefaults.documentType).toBe('');
      expect(documentUpdateDefaults.tags).toEqual([]);
      expect(documentUpdateDefaults.accessLevel).toBe(DocumentAccessLevel.PUBLIC);
    });
  });

  // =================================================================
  // DOCUMENT REPLACE SCHEMA TESTS
  // =================================================================

  describe('documentReplaceSchema', () => {
    it('should validate with notes', () => {
      const result = documentReplaceSchema.safeParse({ notes: 'Replacement notes' });
      expect(result.success).toBe(true);
    });

    it('should allow empty notes', () => {
      const result = documentReplaceSchema.safeParse({ notes: '' });
      expect(result.success).toBe(true);
    });

    it('should validate notes max length', () => {
      const result = documentReplaceSchema.safeParse({ notes: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('should validate default values', () => {
      expect(documentReplaceDefaults.notes).toBe('');
    });
  });

  // =================================================================
  // DOCUMENT FILTERS SCHEMA TESTS
  // =================================================================

  describe('documentFiltersSchema', () => {
    const validFilters = {
      entityType: DocumentEntityType.PROPERTY,
      accessLevel: DocumentAccessLevel.INTERNAL,
      expiryStatus: 'expiring_soon' as const,
      search: 'contract',
      page: 0,
      size: 20
    };

    it('should validate complete filters', () => {
      const result = documentFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should apply default page and size', () => {
      const result = documentFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0);
        expect(result.data.size).toBe(20);
        expect(result.data.sort).toBe('uploadedAt,desc');
      }
    });

    it('should validate page minimum', () => {
      const result = documentFiltersSchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });

    it('should validate size range', () => {
      let result = documentFiltersSchema.safeParse({ size: 0 });
      expect(result.success).toBe(false);

      result = documentFiltersSchema.safeParse({ size: 101 });
      expect(result.success).toBe(false);
    });

    it('should validate expiry status enum', () => {
      const result = documentFiltersSchema.safeParse({ expiryStatus: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should validate default values', () => {
      expect(documentFiltersDefaults.page).toBe(0);
      expect(documentFiltersDefaults.size).toBe(20);
      expect(documentFiltersDefaults.sort).toBe('uploadedAt,desc');
    });
  });
});

// =================================================================
// FILE VALIDATION HELPER TESTS
// =================================================================

describe('File Validation Helpers', () => {
  describe('validateDocumentFile', () => {
    it('should validate a valid PDF file', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024 * 1024);
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid image files', () => {
      const jpegFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      expect(validateDocumentFile(jpegFile).valid).toBe(true);

      const pngFile = createMockFile('test.png', 'image/png', 1024 * 1024);
      expect(validateDocumentFile(pngFile).valid).toBe(true);
    });

    it('should reject files exceeding max size', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 11 * 1024 * 1024);
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject invalid file types', () => {
      const file = createMockFile('test.exe', 'application/x-executable', 1024);
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('PDF');
    });
  });

  describe('isValidDocumentFileType', () => {
    it('should accept PDF files', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024);
      expect(isValidDocumentFileType(file)).toBe(true);
    });

    it('should accept image files', () => {
      expect(isValidDocumentFileType(createMockFile('test.jpg', 'image/jpeg', 1024))).toBe(true);
      expect(isValidDocumentFileType(createMockFile('test.png', 'image/png', 1024))).toBe(true);
    });

    it('should accept Office files', () => {
      expect(isValidDocumentFileType(createMockFile('test.doc', 'application/msword', 1024))).toBe(true);
      expect(isValidDocumentFileType(createMockFile('test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024))).toBe(true);
      expect(isValidDocumentFileType(createMockFile('test.xls', 'application/vnd.ms-excel', 1024))).toBe(true);
      expect(isValidDocumentFileType(createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1024))).toBe(true);
    });

    it('should reject invalid file types', () => {
      expect(isValidDocumentFileType(createMockFile('test.exe', 'application/x-executable', 1024))).toBe(false);
      expect(isValidDocumentFileType(createMockFile('test.zip', 'application/zip', 1024))).toBe(false);
    });
  });

  describe('isValidDocumentFileSize', () => {
    it('should accept files under limit', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 5 * 1024 * 1024);
      expect(isValidDocumentFileSize(file)).toBe(true);
    });

    it('should accept files at limit', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 10 * 1024 * 1024);
      expect(isValidDocumentFileSize(file)).toBe(true);
    });

    it('should reject files over limit', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 11 * 1024 * 1024);
      expect(isValidDocumentFileSize(file)).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('image.jpeg')).toBe('.jpeg');
      expect(getFileExtension('file.name.with.dots.doc')).toBe('.doc');
    });

    it('should handle files without period separator', () => {
      // Function splits by '.' - if no period, whole name is treated as "extension"
      const result = getFileExtension('noextension');
      expect(result).toBe('.noextension');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('document.PDF')).toBe('.pdf');
    });
  });

  describe('isAllowedDocumentExtension', () => {
    it('should accept allowed extensions', () => {
      expect(isAllowedDocumentExtension('test.pdf')).toBe(true);
      expect(isAllowedDocumentExtension('test.jpg')).toBe(true);
      expect(isAllowedDocumentExtension('test.png')).toBe(true);
      expect(isAllowedDocumentExtension('test.doc')).toBe(true);
      expect(isAllowedDocumentExtension('test.docx')).toBe(true);
      expect(isAllowedDocumentExtension('test.xls')).toBe(true);
      expect(isAllowedDocumentExtension('test.xlsx')).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      expect(isAllowedDocumentExtension('test.exe')).toBe(false);
      expect(isAllowedDocumentExtension('test.zip')).toBe(false);
      expect(isAllowedDocumentExtension('test.txt')).toBe(false);
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('should return correct MIME types', () => {
      expect(getMimeTypeFromExtension('.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('.jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('.jpeg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('.png')).toBe('image/png');
      expect(getMimeTypeFromExtension('.doc')).toBe('application/msword');
      expect(getMimeTypeFromExtension('.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should return undefined for unknown extensions', () => {
      expect(getMimeTypeFromExtension('.unknown')).toBeUndefined();
    });
  });

  describe('getFileTypeName', () => {
    it('should return human-readable type names', () => {
      expect(getFileTypeName('application/pdf')).toBe('PDF Document');
      expect(getFileTypeName('image/jpeg')).toBe('JPEG Image');
      expect(getFileTypeName('image/png')).toBe('PNG Image');
      expect(getFileTypeName('application/msword')).toBe('Word Document');
      expect(getFileTypeName('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('Word Document');
      expect(getFileTypeName('application/vnd.ms-excel')).toBe('Excel Spreadsheet');
    });

    it('should return Unknown for unknown types', () => {
      expect(getFileTypeName('application/unknown')).toBe('Unknown');
    });
  });
});

// =================================================================
// FORM DATA HELPER TESTS
// =================================================================

describe('Form Data Helpers', () => {
  describe('createDocumentUploadFormData', () => {
    it('should create FormData with all fields', () => {
      const data: DocumentUploadFormData = {
        documentType: 'Contract',
        title: 'Test Document',
        description: 'Test description',
        entityType: DocumentEntityType.PROPERTY,
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        expiryDate: '2025-12-31',
        tags: ['contract', 'legal'],
        accessLevel: DocumentAccessLevel.INTERNAL
      };
      const file = createMockFile('test.pdf', 'application/pdf', 1024);

      const formData = createDocumentUploadFormData(data, file);

      expect(formData.get('file')).toBe(file);
      expect(formData.get('documentType')).toBe('Contract');
      expect(formData.get('title')).toBe('Test Document');
      expect(formData.get('entityType')).toBe(DocumentEntityType.PROPERTY);
      expect(formData.get('accessLevel')).toBe(DocumentAccessLevel.INTERNAL);
      expect(formData.get('description')).toBe('Test description');
      expect(formData.get('expiryDate')).toBe('2025-12-31');
      expect(formData.get('tags')).toBe(JSON.stringify(['contract', 'legal']));
    });

    it('should omit optional empty fields', () => {
      const data: DocumentUploadFormData = {
        documentType: 'Contract',
        title: 'Test Document',
        entityType: DocumentEntityType.GENERAL,
        accessLevel: DocumentAccessLevel.PUBLIC,
        tags: []
      };
      const file = createMockFile('test.pdf', 'application/pdf', 1024);

      const formData = createDocumentUploadFormData(data, file);

      expect(formData.get('description')).toBeNull();
      expect(formData.get('entityId')).toBeNull();
      expect(formData.get('expiryDate')).toBeNull();
      expect(formData.get('tags')).toBeNull();
    });
  });

  describe('createDocumentReplaceFormData', () => {
    it('should create FormData with file and notes', () => {
      const data: DocumentReplaceFormData = {
        notes: 'Replacement notes'
      };
      const file = createMockFile('new-doc.pdf', 'application/pdf', 1024);

      const formData = createDocumentReplaceFormData(data, file);

      expect(formData.get('file')).toBe(file);
      expect(formData.get('notes')).toBe('Replacement notes');
    });

    it('should omit empty notes', () => {
      const data: DocumentReplaceFormData = { notes: '' };
      const file = createMockFile('new-doc.pdf', 'application/pdf', 1024);

      const formData = createDocumentReplaceFormData(data, file);

      expect(formData.get('file')).toBe(file);
      expect(formData.get('notes')).toBeNull();
    });
  });

  describe('formatDateForApi', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      expect(formatDateForApi(date)).toBe('2025-06-15');
    });

    it('should handle string date', () => {
      expect(formatDateForApi('2025-06-15')).toBe('2025-06-15');
    });

    it('should return undefined for undefined input', () => {
      expect(formatDateForApi(undefined)).toBeUndefined();
    });
  });

  describe('parseTagsInput', () => {
    it('should parse comma-separated tags', () => {
      expect(parseTagsInput('tag1, tag2, tag3')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should trim whitespace', () => {
      expect(parseTagsInput('  tag1  ,  tag2  ')).toEqual(['tag1', 'tag2']);
    });

    it('should filter empty tags', () => {
      expect(parseTagsInput('tag1, , tag2, ')).toEqual(['tag1', 'tag2']);
    });

    it('should handle empty string', () => {
      expect(parseTagsInput('')).toEqual([]);
    });
  });

  describe('formatTagsForDisplay', () => {
    it('should join tags with comma', () => {
      expect(formatTagsForDisplay(['tag1', 'tag2', 'tag3'])).toBe('tag1, tag2, tag3');
    });

    it('should handle empty array', () => {
      expect(formatTagsForDisplay([])).toBe('');
    });

    it('should handle single tag', () => {
      expect(formatTagsForDisplay(['single'])).toBe('single');
    });
  });
});

// =================================================================
// HELPER TEST UTILITIES
// =================================================================

function getFutureDateString(daysInFuture: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysInFuture);
  return date.toISOString().split('T')[0];
}

function getPastDateString(daysInPast: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysInPast);
  return date.toISOString().split('T')[0];
}

function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}
