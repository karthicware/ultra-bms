/**
 * Asset Validation Schema Tests
 * Story 7.1: Asset Registry and Tracking
 * AC #35: Frontend unit tests for validation schemas
 */

import {
  assetCreateSchema,
  assetUpdateSchema,
  assetStatusUpdateSchema,
  assetFilterSchema,
  documentUploadSchema,
  assetCreateDefaults,
  assetFilterDefaults,
  assetStatusUpdateDefaults,
  validateDocumentFile,
  validateDocumentFiles,
  isValidDateString,
  getTodayDateString,
  getDocumentAcceptTypes,
  getMaxDocumentSizeMB,
  formatCurrency,
  canChangeStatusTo,
  getAvailableStatusOptions
} from '@/lib/validations/asset';
import { AssetCategory, AssetStatus, AssetDocumentType } from '@/types/asset';

describe('Asset Validation Schema', () => {
  // =================================================================
  // ASSET CREATE SCHEMA TESTS
  // =================================================================

  describe('assetCreateSchema', () => {
    const validPropertyId = '123e4567-e89b-12d3-a456-426614174000';

    const validAssetData = {
      assetName: 'Main HVAC Unit',
      category: AssetCategory.HVAC,
      propertyId: validPropertyId,
      location: 'Rooftop',
      manufacturer: 'Carrier',
      modelNumber: 'XR-5000',
      serialNumber: 'SN123456',
      installationDate: getPastDateString(365),
      warrantyExpiryDate: getFutureDateString(365),
      purchaseCost: 50000.00,
      estimatedUsefulLife: 15
    };

    it('should validate a complete asset with all fields', () => {
      const result = assetCreateSchema.safeParse(validAssetData);
      expect(result.success).toBe(true);
    });

    it('should validate asset with minimal required fields', () => {
      const minimalData = {
        assetName: 'Test Asset',
        category: AssetCategory.OTHER,
        propertyId: validPropertyId,
        location: 'Test Location'
      };

      const result = assetCreateSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('assetName validation', () => {
      it('should reject empty asset name', () => {
        const data = { ...validAssetData, assetName: '' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject asset name exceeding 200 characters', () => {
        const data = { ...validAssetData, assetName: 'A'.repeat(201) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('200');
        }
      });

      it('should accept asset name at max length', () => {
        const data = { ...validAssetData, assetName: 'A'.repeat(200) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should trim whitespace from asset name', () => {
        const data = { ...validAssetData, assetName: '  Test Asset  ' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.assetName).toBe('Test Asset');
        }
      });
    });

    describe('category validation', () => {
      it('should accept all valid categories', () => {
        const categories = Object.values(AssetCategory);
        categories.forEach((category) => {
          const data = { ...validAssetData, category };
          const result = assetCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid category', () => {
        const data = { ...validAssetData, category: 'INVALID_CATEGORY' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('propertyId validation', () => {
      it('should reject empty propertyId', () => {
        const data = { ...validAssetData, propertyId: '' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid UUID for propertyId', () => {
        const data = { ...validAssetData, propertyId: 'invalid-uuid' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid');
        }
      });

      it('should accept valid UUID for propertyId', () => {
        const data = { ...validAssetData, propertyId: validPropertyId };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('location validation', () => {
      it('should reject empty location', () => {
        const data = { ...validAssetData, location: '' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject location exceeding 200 characters', () => {
        const data = { ...validAssetData, location: 'L'.repeat(201) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('optional fields validation', () => {
      it('should accept asset without manufacturer', () => {
        const { manufacturer, ...dataWithoutManufacturer } = validAssetData;
        const result = assetCreateSchema.safeParse(dataWithoutManufacturer);
        expect(result.success).toBe(true);
      });

      it('should reject manufacturer exceeding 100 characters', () => {
        const data = { ...validAssetData, manufacturer: 'M'.repeat(101) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should transform empty strings to null for optional fields', () => {
        const data = {
          ...validAssetData,
          manufacturer: '',
          modelNumber: '',
          serialNumber: ''
        };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.manufacturer).toBeNull();
          expect(result.data.modelNumber).toBeNull();
          expect(result.data.serialNumber).toBeNull();
        }
      });
    });

    describe('installationDate validation', () => {
      it('should accept past installation date', () => {
        const data = { ...validAssetData, installationDate: getPastDateString(365) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept today as installation date', () => {
        const data = { ...validAssetData, installationDate: getTodayDateString() };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject future installation date', () => {
        const data = { ...validAssetData, installationDate: getFutureDateString(30) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('future');
        }
      });

      it('should reject invalid date format', () => {
        const data = { ...validAssetData, installationDate: 'invalid-date' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept null installation date', () => {
        const data = { ...validAssetData, installationDate: null };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('warrantyExpiryDate validation', () => {
      it('should accept future warranty expiry date', () => {
        const data = { ...validAssetData, warrantyExpiryDate: getFutureDateString(365) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept past warranty expiry date (expired warranty)', () => {
        const data = { ...validAssetData, warrantyExpiryDate: getPastDateString(30) };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept null warranty expiry date (no warranty)', () => {
        const data = { ...validAssetData, warrantyExpiryDate: null };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('purchaseCost validation', () => {
      it('should accept valid positive amount', () => {
        const data = { ...validAssetData, purchaseCost: 50000.00 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept zero cost', () => {
        const data = { ...validAssetData, purchaseCost: 0 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject negative cost', () => {
        const data = { ...validAssetData, purchaseCost: -100 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject cost exceeding maximum', () => {
        const data = { ...validAssetData, purchaseCost: 1000000000 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should parse string amount to number', () => {
        const data = { ...validAssetData, purchaseCost: '50000' };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.purchaseCost).toBe(50000);
        }
      });
    });

    describe('estimatedUsefulLife validation', () => {
      it('should accept valid useful life in years', () => {
        const data = { ...validAssetData, estimatedUsefulLife: 15 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject useful life less than 1 year', () => {
        const data = { ...validAssetData, estimatedUsefulLife: 0 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject useful life exceeding 100 years', () => {
        const data = { ...validAssetData, estimatedUsefulLife: 101 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should floor decimal values', () => {
        const data = { ...validAssetData, estimatedUsefulLife: 15.7 };
        const result = assetCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.estimatedUsefulLife).toBe(15);
        }
      });
    });
  });

  // =================================================================
  // ASSET UPDATE SCHEMA TESTS
  // =================================================================

  describe('assetUpdateSchema', () => {
    it('should validate partial update data', () => {
      const data = {
        assetName: 'Updated HVAC Unit',
        location: 'Basement'
      };
      const result = assetUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty update (no fields)', () => {
      const result = assetUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should include nextMaintenanceDate field', () => {
      const data = {
        nextMaintenanceDate: getFutureDateString(30)
      };
      const result = assetUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // =================================================================
  // ASSET STATUS UPDATE SCHEMA TESTS
  // =================================================================

  describe('assetStatusUpdateSchema', () => {
    it('should validate status update with notes', () => {
      const data = {
        status: AssetStatus.UNDER_MAINTENANCE,
        notes: 'Scheduled quarterly maintenance'
      };
      const result = assetStatusUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate status update without notes', () => {
      const data = {
        status: AssetStatus.ACTIVE
      };
      const result = assetStatusUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept all valid statuses', () => {
      const statuses = Object.values(AssetStatus);
      statuses.forEach((status) => {
        const data = { status };
        const result = assetStatusUpdateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject notes exceeding 500 characters', () => {
      const data = {
        status: AssetStatus.ACTIVE,
        notes: 'A'.repeat(501)
      };
      const result = assetStatusUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should transform empty notes to null', () => {
      const data = {
        status: AssetStatus.ACTIVE,
        notes: ''
      };
      const result = assetStatusUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeNull();
      }
    });
  });

  // =================================================================
  // DOCUMENT UPLOAD SCHEMA TESTS
  // =================================================================

  describe('documentUploadSchema', () => {
    it('should validate complete document upload data', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const data = {
        documentType: AssetDocumentType.WARRANTY,
        file: mockFile
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept all valid document types', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const docTypes = Object.values(AssetDocumentType);
      docTypes.forEach((documentType) => {
        const data = { documentType, file: mockFile };
        const result = documentUploadSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject missing file', () => {
      const data = {
        documentType: AssetDocumentType.WARRANTY
      };
      const result = documentUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // ASSET FILTER SCHEMA TESTS
  // =================================================================

  describe('assetFilterSchema', () => {
    it('should validate empty filter (all defaults)', () => {
      const result = assetFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate filter with search term', () => {
      const result = assetFilterSchema.safeParse({ search: 'HVAC' });
      expect(result.success).toBe(true);
    });

    it('should validate filter with category', () => {
      const result = assetFilterSchema.safeParse({ category: 'HVAC' });
      expect(result.success).toBe(true);
    });

    it('should validate filter with status', () => {
      const result = assetFilterSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const result = assetFilterSchema.safeParse({ category: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = assetFilterSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject search term exceeding max length', () => {
      const result = assetFilterSchema.safeParse({ search: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should validate pagination parameters', () => {
      const result = assetFilterSchema.safeParse({
        page: 2,
        size: 50
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid pagination', () => {
      const result = assetFilterSchema.safeParse({
        page: -1,
        size: 200
      });
      expect(result.success).toBe(false);
    });

    it('should validate sorting parameters', () => {
      const result = assetFilterSchema.safeParse({
        sortBy: 'assetName',
        sortDirection: 'ASC'
      });
      expect(result.success).toBe(true);
    });
  });

  // =================================================================
  // DEFAULT VALUES TESTS
  // =================================================================

  describe('Default values', () => {
    it('assetCreateDefaults should have correct initial values', () => {
      expect(assetCreateDefaults.assetName).toBe('');
      expect(assetCreateDefaults.category).toBe(AssetCategory.OTHER);
      expect(assetCreateDefaults.propertyId).toBe('');
      expect(assetCreateDefaults.location).toBe('');
      expect(assetCreateDefaults.manufacturer).toBeNull();
      expect(assetCreateDefaults.purchaseCost).toBeNull();
    });

    it('assetFilterDefaults should have correct pagination', () => {
      expect(assetFilterDefaults.page).toBe(0);
      expect(assetFilterDefaults.size).toBe(20);
      expect(assetFilterDefaults.sortBy).toBe('createdAt');
      expect(assetFilterDefaults.sortDirection).toBe('DESC');
    });

    it('assetStatusUpdateDefaults should have ACTIVE status', () => {
      expect(assetStatusUpdateDefaults.status).toBe(AssetStatus.ACTIVE);
      expect(assetStatusUpdateDefaults.notes).toBeNull();
    });
  });

  // =================================================================
  // FILE VALIDATION HELPER TESTS
  // =================================================================

  describe('validateDocumentFile', () => {
    it('should accept valid PDF file', () => {
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid JPEG file', () => {
      const file = new File(['test content'], 'image.jpg', { type: 'image/jpeg' });
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = new File(['test content'], 'image.png', { type: 'image/png' });
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding 10MB', () => {
      // Create a mock file larger than 10MB
      const largeContent = new Array(11 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject invalid file type', () => {
      const file = new File(['test content'], 'document.txt', { type: 'text/plain' });
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('PDF, JPG');
    });
  });

  describe('validateDocumentFiles', () => {
    it('should accept array of valid files', () => {
      const files = [
        new File(['test'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['test'], 'doc2.jpg', { type: 'image/jpeg' })
      ];
      const result = validateDocumentFiles(files);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid files', () => {
      const files = [
        new File(['test'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['test'], 'invalid.txt', { type: 'text/plain' })
      ];
      const result = validateDocumentFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('invalid.txt');
    });
  });

  // =================================================================
  // HELPER FUNCTION TESTS
  // =================================================================

  describe('Helper Functions', () => {
    describe('isValidDateString', () => {
      it('should return true for valid date strings', () => {
        expect(isValidDateString('2025-01-15')).toBe(true);
        expect(isValidDateString('2024-12-31')).toBe(true);
      });

      it('should return false for invalid date strings', () => {
        expect(isValidDateString('')).toBe(false);
        expect(isValidDateString('invalid')).toBe(false);
      });
    });

    describe('getTodayDateString', () => {
      it('should return today date in YYYY-MM-DD format', () => {
        const today = getTodayDateString();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    describe('getDocumentAcceptTypes', () => {
      it('should return comma-separated file extensions', () => {
        const acceptTypes = getDocumentAcceptTypes();
        expect(acceptTypes).toContain('.pdf');
        expect(acceptTypes).toContain('.jpg');
        expect(acceptTypes).toContain('.png');
      });
    });

    describe('getMaxDocumentSizeMB', () => {
      it('should return 10', () => {
        expect(getMaxDocumentSizeMB()).toBe(10);
      });
    });

    describe('formatCurrency', () => {
      it('should format amount as AED currency', () => {
        const formatted = formatCurrency(5000);
        expect(formatted).toContain('5,000');
        expect(formatted).toContain('AED');
      });

      it('should handle decimal amounts', () => {
        const formatted = formatCurrency(1234.56);
        expect(formatted).toContain('1,234.56');
      });

      it('should return dash for null/undefined', () => {
        expect(formatCurrency(null)).toBe('-');
        expect(formatCurrency(undefined)).toBe('-');
      });
    });

    describe('canChangeStatusTo', () => {
      it('should return false when current status is DISPOSED', () => {
        expect(canChangeStatusTo(AssetStatus.DISPOSED, AssetStatus.ACTIVE)).toBe(false);
        expect(canChangeStatusTo(AssetStatus.DISPOSED, AssetStatus.UNDER_MAINTENANCE)).toBe(false);
      });

      it('should return false when target equals current', () => {
        expect(canChangeStatusTo(AssetStatus.ACTIVE, AssetStatus.ACTIVE)).toBe(false);
      });

      it('should return true for valid status changes', () => {
        expect(canChangeStatusTo(AssetStatus.ACTIVE, AssetStatus.UNDER_MAINTENANCE)).toBe(true);
        expect(canChangeStatusTo(AssetStatus.ACTIVE, AssetStatus.DISPOSED)).toBe(true);
        expect(canChangeStatusTo(AssetStatus.UNDER_MAINTENANCE, AssetStatus.ACTIVE)).toBe(true);
      });
    });

    describe('getAvailableStatusOptions', () => {
      it('should return empty array for DISPOSED status', () => {
        const options = getAvailableStatusOptions(AssetStatus.DISPOSED);
        expect(options).toHaveLength(0);
      });

      it('should return all other statuses for ACTIVE', () => {
        const options = getAvailableStatusOptions(AssetStatus.ACTIVE);
        expect(options).not.toContain(AssetStatus.ACTIVE);
        expect(options).toContain(AssetStatus.UNDER_MAINTENANCE);
        expect(options).toContain(AssetStatus.OUT_OF_SERVICE);
        expect(options).toContain(AssetStatus.DISPOSED);
      });

      it('should exclude current status from options', () => {
        const options = getAvailableStatusOptions(AssetStatus.UNDER_MAINTENANCE);
        expect(options).not.toContain(AssetStatus.UNDER_MAINTENANCE);
        expect(options).toContain(AssetStatus.ACTIVE);
      });
    });
  });
});

// =================================================================
// HELPER TEST UTILITIES
// =================================================================

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

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
