/**
 * Unit tests for Quotation validation schemas
 * Tests quotation creation/update validation and total payment calculation
 */

import {
  createQuotationSchema,
  updateQuotationSchema,
  calculateTotalFirstPayment,
} from '../quotations';
import { StayType } from '@/types';

describe('Quotation Validation Schemas', () => {
  describe('calculateTotalFirstPayment', () => {
    it('should calculate total correctly with all components', () => {
      const total = calculateTotalFirstPayment({
        baseRent: 5000,
        serviceCharges: 500,
        parkingSpots: 2,
        parkingFee: 200,
        securityDeposit: 5000,
        adminFee: 1000,
      });
      // 5000 + 500 + (2 * 200) + 5000 + 1000 = 12,100
      expect(total).toBe(12100);
    });

    it('should calculate total correctly with zero parking', () => {
      const total = calculateTotalFirstPayment({
        baseRent: 5000,
        serviceCharges: 500,
        parkingSpots: 0,
        parkingFee: 200,
        securityDeposit: 5000,
        adminFee: 1000,
      });
      // 5000 + 500 + 0 + 5000 + 1000 = 11,500
      expect(total).toBe(11500);
    });

    it('should calculate total correctly with multiple parking spots', () => {
      const total = calculateTotalFirstPayment({
        baseRent: 8000,
        serviceCharges: 800,
        parkingSpots: 3,
        parkingFee: 300,
        securityDeposit: 16000,
        adminFee: 1500,
      });
      // 8000 + 800 + (3 * 300) + 16000 + 1500 = 27,200
      expect(total).toBe(27200);
    });
  });

  describe('createQuotationSchema', () => {
    const validQuotation = {
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      propertyId: '223e4567-e89b-12d3-a456-426614174000',
      unitId: '323e4567-e89b-12d3-a456-426614174000',
      stayType: StayType.TWO_BHK,
      issueDate: new Date('2025-11-15'),
      validityDate: new Date('2025-12-15'),
      baseRent: 5000,
      serviceCharges: 500,
      parkingSpots: 1,
      parkingFee: 200,
      securityDeposit: 5000,
      adminFee: 1000,
      documentRequirements: 'Emirates ID, Passport, Salary Certificate',
      paymentTerms: 'Payment due on 1st of each month',
      moveinProcedures: 'Complete inspection checklist',
      cancellationPolicy: '30 days notice required',
      specialTerms: 'Pet-friendly unit',
    };

    it('should accept valid quotation data', () => {
      const result = createQuotationSchema.safeParse(validQuotation);
      expect(result.success).toBe(true);
    });

    it('should reject quotation without required fields', () => {
      const invalidQuotation = { ...validQuotation };
      delete (invalidQuotation as any).leadId;
      const result = createQuotationSchema.safeParse(invalidQuotation);
      expect(result.success).toBe(false);
    });

    it('should accept quotation without optional special terms', () => {
      const quotationWithoutSpecialTerms = { ...validQuotation };
      delete quotationWithoutSpecialTerms.specialTerms;
      const result = createQuotationSchema.safeParse(quotationWithoutSpecialTerms);
      expect(result.success).toBe(true);
    });

    it('should reject quotation with negative base rent', () => {
      const quotationWithNegativeRent = {
        ...validQuotation,
        baseRent: -5000,
      };
      const result = createQuotationSchema.safeParse(quotationWithNegativeRent);
      expect(result.success).toBe(false);
    });

    it('should reject quotation with zero base rent', () => {
      const quotationWithZeroRent = {
        ...validQuotation,
        baseRent: 0,
      };
      const result = createQuotationSchema.safeParse(quotationWithZeroRent);
      expect(result.success).toBe(false);
    });

    it('should accept quotation with zero service charges', () => {
      const quotationWithZeroCharges = {
        ...validQuotation,
        serviceCharges: 0,
      };
      const result = createQuotationSchema.safeParse(quotationWithZeroCharges);
      expect(result.success).toBe(true);
    });

    it('should reject quotation with negative parking spots', () => {
      const quotationWithNegativeParking = {
        ...validQuotation,
        parkingSpots: -1,
      };
      const result = createQuotationSchema.safeParse(quotationWithNegativeParking);
      expect(result.success).toBe(false);
    });

    it('should accept quotation with zero parking spots', () => {
      const quotationWithZeroParking = {
        ...validQuotation,
        parkingSpots: 0,
      };
      const result = createQuotationSchema.safeParse(quotationWithZeroParking);
      expect(result.success).toBe(true);
    });

    it('should reject quotation with validity date before issue date', () => {
      const quotationWithInvalidDates = {
        ...validQuotation,
        issueDate: new Date('2025-12-15'),
        validityDate: new Date('2025-11-15'),
      };
      const result = createQuotationSchema.safeParse(quotationWithInvalidDates);
      expect(result.success).toBe(false);
    });

    it('should reject quotation with past validity date', () => {
      const quotationWithPastValidity = {
        ...validQuotation,
        issueDate: new Date('2020-01-01'),
        validityDate: new Date('2020-02-01'),
      };
      const result = createQuotationSchema.safeParse(quotationWithPastValidity);
      expect(result.success).toBe(false);
    });

    it('should reject quotation with invalid stay type', () => {
      const quotationWithInvalidStayType = {
        ...validQuotation,
        stayType: 'INVALID_TYPE' as any,
      };
      const result = createQuotationSchema.safeParse(quotationWithInvalidStayType);
      expect(result.success).toBe(false);
    });

    it('should reject quotation with invalid UUID format for leadId', () => {
      const quotationWithInvalidUUID = {
        ...validQuotation,
        leadId: 'not-a-uuid',
      };
      const result = createQuotationSchema.safeParse(quotationWithInvalidUUID);
      expect(result.success).toBe(false);
    });
  });

  describe('updateQuotationSchema', () => {
    it('should accept partial quotation data', () => {
      const result = updateQuotationSchema.safeParse({
        baseRent: 6000,
        parkingSpots: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty update (all fields optional)', () => {
      const result = updateQuotationSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject update with negative values', () => {
      const result = updateQuotationSchema.safeParse({
        securityDeposit: -1000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject update with invalid stay type', () => {
      const result = updateQuotationSchema.safeParse({
        stayType: 'INVALID' as any,
      });
      expect(result.success).toBe(false);
    });

    it('should accept update with valid future validity date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const result = updateQuotationSchema.safeParse({
        validityDate: futureDate,
      });
      expect(result.success).toBe(true);
    });
  });
});
