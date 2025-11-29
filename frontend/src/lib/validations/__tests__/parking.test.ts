/**
 * Parking Spot Validation Tests
 * Story 3.8: Parking Spot Inventory Management
 * AC#18: Frontend unit tests with >80% coverage
 */

// Jest provides describe, it, expect globally
import {
  createParkingSpotSchema,
  updateParkingSpotSchema,
  changeStatusSchema,
  bulkDeleteSchema,
  bulkStatusChangeSchema,
  parkingSpotFilterSchema,
  isValidSpotNumberFormat,
  isValidFeeAmount,
  validateBulkSelection,
  parseFeeInput,
} from '../parking';
import { ParkingSpotStatus } from '@/types/parking';

describe('Parking Spot Validation Schemas', () => {
  describe('createParkingSpotSchema', () => {
    it('should validate a valid create request', () => {
      const validData = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'P1-001',
        defaultFee: 500,
        notes: 'Near elevator',
      };

      const result = createParkingSpotSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require propertyId', () => {
      const invalidData = {
        spotNumber: 'P1-001',
        defaultFee: 500,
      };

      const result = createParkingSpotSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate spot number length (1-20 chars)', () => {
      const tooShort = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: '',
        defaultFee: 500,
      };

      const tooLong = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'A'.repeat(21),
        defaultFee: 500,
      };

      expect(createParkingSpotSchema.safeParse(tooShort).success).toBe(false);
      expect(createParkingSpotSchema.safeParse(tooLong).success).toBe(false);
    });

    it('should validate default fee is non-negative', () => {
      const validMin = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'P1-001',
        defaultFee: 0,
      };

      const validLarge = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'P1-001',
        defaultFee: 99999.99,
      };

      const negativeFee = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'P1-001',
        defaultFee: -100,
      };

      expect(createParkingSpotSchema.safeParse(validMin).success).toBe(true);
      expect(createParkingSpotSchema.safeParse(validLarge).success).toBe(true);
      expect(createParkingSpotSchema.safeParse(negativeFee).success).toBe(false);
    });

    it('should allow optional notes (max 500 chars)', () => {
      const withNotes = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'P1-001',
        defaultFee: 500,
        notes: 'Some notes',
      };

      const withLongNotes = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        spotNumber: 'P1-001',
        defaultFee: 500,
        notes: 'A'.repeat(501),
      };

      expect(createParkingSpotSchema.safeParse(withNotes).success).toBe(true);
      expect(createParkingSpotSchema.safeParse(withLongNotes).success).toBe(false);
    });

    it('should require valid UUID for propertyId', () => {
      const invalidUuid = {
        propertyId: 'not-a-uuid',
        spotNumber: 'P1-001',
        defaultFee: 500,
      };

      expect(createParkingSpotSchema.safeParse(invalidUuid).success).toBe(false);
    });
  });

  describe('updateParkingSpotSchema', () => {
    it('should validate a valid update request', () => {
      const validData = {
        spotNumber: 'P1-002',
        defaultFee: 600,
        notes: 'Updated notes',
      };

      const result = updateParkingSpotSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should not require propertyId for updates', () => {
      const data = {
        spotNumber: 'P1-002',
        defaultFee: 600,
      };

      const result = updateParkingSpotSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for partial updates', () => {
      const result = updateParkingSpotSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('changeStatusSchema', () => {
    it('should validate AVAILABLE status', () => {
      const available = { status: ParkingSpotStatus.AVAILABLE };
      expect(changeStatusSchema.safeParse(available).success).toBe(true);
    });

    it('should validate UNDER_MAINTENANCE status', () => {
      const maintenance = { status: ParkingSpotStatus.UNDER_MAINTENANCE };
      expect(changeStatusSchema.safeParse(maintenance).success).toBe(true);
    });

    it('should reject ASSIGNED status (managed via tenant flows)', () => {
      const assigned = { status: ParkingSpotStatus.ASSIGNED };
      expect(changeStatusSchema.safeParse(assigned).success).toBe(false);
    });

    it('should reject invalid status values', () => {
      const invalid = { status: 'INVALID_STATUS' };
      expect(changeStatusSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('bulkDeleteSchema', () => {
    it('should validate valid bulk delete request', () => {
      const validData = {
        ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      };

      const result = bulkDeleteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require at least one ID', () => {
      const emptyIds = { ids: [] };
      expect(bulkDeleteSchema.safeParse(emptyIds).success).toBe(false);
    });

    it('should require valid UUIDs', () => {
      const invalidUuids = { ids: ['not-a-uuid', 'also-invalid'] };
      expect(bulkDeleteSchema.safeParse(invalidUuids).success).toBe(false);
    });
  });

  describe('bulkStatusChangeSchema', () => {
    it('should validate valid bulk status change request', () => {
      const validData = {
        ids: ['123e4567-e89b-12d3-a456-426614174000'],
        status: ParkingSpotStatus.UNDER_MAINTENANCE,
      };

      const result = bulkStatusChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require both ids and status', () => {
      const missingStatus = { ids: ['123e4567-e89b-12d3-a456-426614174000'] };
      const missingIds = { status: ParkingSpotStatus.AVAILABLE };

      expect(bulkStatusChangeSchema.safeParse(missingStatus).success).toBe(false);
      expect(bulkStatusChangeSchema.safeParse(missingIds).success).toBe(false);
    });

    it('should reject ASSIGNED status in bulk change', () => {
      const assignedStatus = {
        ids: ['123e4567-e89b-12d3-a456-426614174000'],
        status: ParkingSpotStatus.ASSIGNED,
      };
      expect(bulkStatusChangeSchema.safeParse(assignedStatus).success).toBe(false);
    });
  });

  describe('parkingSpotFilterSchema', () => {
    it('should validate valid filter parameters', () => {
      const validFilters = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        status: ParkingSpotStatus.AVAILABLE,
        search: 'P1',
        page: 0,
        size: 20,
        sort: 'spotNumber,asc',
      };

      const result = parkingSpotFilterSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should allow partial filters', () => {
      const partialFilters = {
        page: 0,
        size: 20,
      };

      const result = parkingSpotFilterSchema.safeParse(partialFilters);
      expect(result.success).toBe(true);
    });

    it('should set default values', () => {
      const result = parkingSpotFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0);
        expect(result.data.size).toBe(20);
      }
    });

    it('should validate page size limits', () => {
      const tooLarge = { size: 101 };
      expect(parkingSpotFilterSchema.safeParse(tooLarge).success).toBe(false);
    });

    it('should allow empty string for optional propertyId', () => {
      const emptyPropertyId = { propertyId: '' };
      expect(parkingSpotFilterSchema.safeParse(emptyPropertyId).success).toBe(true);
    });
  });
});

describe('Parking Spot Helper Functions', () => {
  describe('isValidSpotNumberFormat', () => {
    it('should accept valid spot number formats', () => {
      expect(isValidSpotNumberFormat('P1-001')).toBe(true);
      expect(isValidSpotNumberFormat('B2-015')).toBe(true);
      expect(isValidSpotNumberFormat('A1')).toBe(true);
      expect(isValidSpotNumberFormat('SPOT-123')).toBe(true);
      expect(isValidSpotNumberFormat('G_12')).toBe(true);
      expect(isValidSpotNumberFormat('A/B/1')).toBe(true);
    });

    it('should reject empty spot numbers', () => {
      expect(isValidSpotNumberFormat('')).toBe(false);
    });

    it('should reject spot numbers with invalid characters', () => {
      expect(isValidSpotNumberFormat('P1 001')).toBe(false); // space
      expect(isValidSpotNumberFormat('P1@001')).toBe(false); // special char
    });
  });

  describe('isValidFeeAmount', () => {
    it('should accept valid fee amounts', () => {
      expect(isValidFeeAmount(0)).toBe(true);
      expect(isValidFeeAmount(500)).toBe(true);
      expect(isValidFeeAmount(99999.99)).toBe(true);
      expect(isValidFeeAmount(100.50)).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(isValidFeeAmount(-1)).toBe(false);
      expect(isValidFeeAmount(-100)).toBe(false);
    });

    it('should reject amounts with more than 2 decimal places', () => {
      expect(isValidFeeAmount(100.999)).toBe(false);
      expect(isValidFeeAmount(50.123)).toBe(false);
    });
  });

  describe('parseFeeInput', () => {
    it('should parse valid fee strings', () => {
      expect(parseFeeInput('500')).toBe(500);
      expect(parseFeeInput('99.99')).toBe(99.99);
      expect(parseFeeInput('  100  ')).toBe(100);
    });

    it('should return null for invalid inputs', () => {
      expect(parseFeeInput('')).toBe(null);
      expect(parseFeeInput('abc')).toBe(null);
      expect(parseFeeInput('   ')).toBe(null);
    });

    it('should round to 2 decimal places', () => {
      expect(parseFeeInput('100.999')).toBe(101);
      expect(parseFeeInput('50.555')).toBe(50.56);
    });
  });

  describe('validateBulkSelection', () => {
    const spots = [
      { id: 'id1', status: ParkingSpotStatus.AVAILABLE },
      { id: 'id2', status: ParkingSpotStatus.ASSIGNED },
      { id: 'id3', status: ParkingSpotStatus.UNDER_MAINTENANCE },
    ];

    it('should accept valid selections', () => {
      const result = validateBulkSelection(['id1', 'id3'], spots);
      expect(result.valid).toBe(true);
      expect(result.assignedCount).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject empty selections', () => {
      const result = validateBulkSelection([], spots);
      expect(result.valid).toBe(false);
    });

    it('should warn about assigned spots', () => {
      const result = validateBulkSelection(['id1', 'id2', 'id3'], spots);
      expect(result.valid).toBe(true);
      expect(result.assignedCount).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('1 assigned spot');
    });

    it('should handle selection with only assigned spots', () => {
      const result = validateBulkSelection(['id2'], spots);
      expect(result.valid).toBe(true); // valid selection, but will skip
      expect(result.assignedCount).toBe(1);
    });
  });
});
