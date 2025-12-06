/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Quotation validation schemas
 * Tests quotation creation/update validation and total payment calculation
 * Updated for SCP-2025-12-02: parkingSpotId replaces parkingSpots
 */

import {
  createQuotationSchema,
  updateQuotationSchema,
  calculateTotalFirstPayment,
} from '../quotations';

describe('Quotation Validation Schemas', () => {
  describe('calculateTotalFirstPayment', () => {
    it('should calculate total correctly with all components', () => {
      const total = calculateTotalFirstPayment({
        baseRent: 5000,
        serviceCharges: 500,
        parkingFee: 400, // SCP-2025-12-02: parkingFee is now the total, not per-spot
        securityDeposit: 5000,
        adminFee: 1000,
      });
      // 5000 + 500 + 400 + 5000 + 1000 = 11,900
      expect(total).toBe(11900);
    });

    it('should calculate total correctly with zero parking', () => {
      const total = calculateTotalFirstPayment({
        baseRent: 5000,
        serviceCharges: 500,
        parkingFee: 0,
        securityDeposit: 5000,
        adminFee: 1000,
      });
      // 5000 + 500 + 0 + 5000 + 1000 = 11,500
      expect(total).toBe(11500);
    });

    it('should calculate total correctly with undefined parking fee', () => {
      const total = calculateTotalFirstPayment({
        baseRent: 8000,
        serviceCharges: 800,
        securityDeposit: 16000,
        adminFee: 1500,
      });
      // 8000 + 800 + 0 + 16000 + 1500 = 26,300
      expect(total).toBe(26300);
    });
  });

  describe('createQuotationSchema', () => {
    const validQuotation = {
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      propertyId: '223e4567-e89b-12d3-a456-426614174000',
      unitId: '323e4567-e89b-12d3-a456-426614174000',
      issueDate: new Date('2025-11-15'),
      validityDate: new Date('2026-12-15'),
      baseRent: 5000,
      serviceCharges: 500,
      parkingSpotId: '423e4567-e89b-12d3-a456-426614174000',
      parkingFee: 200,
      securityDeposit: 5000,
      adminFee: 1000,
      documentRequirements: ['Emirates ID', 'Passport', 'Salary Certificate'],
      paymentTerms: 'Payment due on 1st of each month by bank transfer',
      moveinProcedures: 'Complete inspection checklist before moving in',
      cancellationPolicy: '30 days written notice required for cancellation',
      specialTerms: 'Pet-friendly unit',
      // SCP-2025-12-04: Identity document fields
      emiratesIdNumber: '784-1234-5678901-1',
      emiratesIdExpiry: new Date('2027-12-15'),
      passportNumber: 'AB1234567',
      passportExpiry: new Date('2030-12-15'),
      nationality: 'United Kingdom',
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
      const { specialTerms, ...quotationWithoutSpecialTerms } = validQuotation;
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

    it('should accept quotation without parking spot (optional)', () => {
      const quotationWithNoParking = {
        ...validQuotation,
        parkingSpotId: null,
        parkingFee: 0,
      };
      const result = createQuotationSchema.safeParse(quotationWithNoParking);
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
        parkingFee: 300,
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
