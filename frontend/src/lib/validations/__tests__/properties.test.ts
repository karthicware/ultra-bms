/**
 * Property Validation Schema Tests
 * Tests validation for property creation and updates
 * AC: #1, #17 - Form validation
 */

import { createPropertySchema, updatePropertySchema } from '../properties';
import { PropertyType } from '@/types/properties';

describe('Property Validation Schemas', () => {
  describe('createPropertySchema', () => {
    it('should accept valid property data', () => {
      const validData = {
        name: 'Sunset Towers',
        address: '123 Main St, Dubai, UAE',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 50,
        managerId: '',
        yearBuilt: 2020,
        totalSquareFootage: 50000,
        amenities: ['Pool', 'Gym', 'Parking'],
      };

      const result = createPropertySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name exceeding 255 characters', () => {
      const invalidData = {
        name: 'A'.repeat(256),
        address: '123 Main St',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 10,
      };

      const result = createPropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['name'],
            }),
          ])
        );
      }
    });

    it('should reject address exceeding 500 characters', () => {
      const invalidData = {
        name: 'Sunset Towers',
        address: 'A'.repeat(501),
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 10,
      };

      const result = createPropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['address'],
            }),
          ])
        );
      }
    });

    it('should reject totalUnitsCount less than 1', () => {
      const invalidData = {
        name: 'Sunset Towers',
        address: '123 Main St, Dubai',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 0,
      };

      const result = createPropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['totalUnitsCount'],
            }),
          ])
        );
      }
    });

    it('should reject year built before 1800', () => {
      const invalidData = {
        name: 'Sunset Towers',
        address: '123 Main St, Dubai',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 10,
        yearBuilt: 1799,
      };

      const result = createPropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['yearBuilt'],
            }),
          ])
        );
      }
    });

    it('should reject year built more than 2 years in the future', () => {
      const futureYear = new Date().getFullYear() + 3;
      const invalidData = {
        name: 'Sunset Towers',
        address: '123 Main St, Dubai',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 10,
        yearBuilt: futureYear,
      };

      const result = createPropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields as undefined', () => {
      const validData = {
        name: 'Sunset Towers',
        address: '123 Main Street, Dubai',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 10,
      };

      const result = createPropertySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject totalUnitsCount exceeding 10000', () => {
      const invalidData = {
        name: 'Sunset Towers',
        address: '123 Main St, Dubai',
        propertyType: PropertyType.RESIDENTIAL,
        totalUnitsCount: 10001,
      };

      const result = createPropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updatePropertySchema', () => {
    it('should accept valid update data', () => {
      const validData = {
        name: 'Updated Towers',
        address: '456 New St, Dubai, UAE',
        propertyType: PropertyType.COMMERCIAL,
        totalUnitsCount: 75,
      };

      const result = updatePropertySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept partial update data', () => {
      const validData = {
        name: 'Updated Towers',
      };

      const result = updatePropertySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate updated fields meet requirements', () => {
      const invalidData = {
        name: 'A'.repeat(256), // exceeds max length
      };

      const result = updatePropertySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
