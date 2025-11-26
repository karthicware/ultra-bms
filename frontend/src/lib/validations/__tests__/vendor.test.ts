/**
 * Vendor Validation Schema Tests
 * Story 5.1: Vendor Registration and Profile Management
 *
 * Tests for Zod validation schemas and helper functions
 */

import {
  vendorSchema,
  vendorFilterSchema,
  isValidEmail,
  isValidE164Phone,
  isValidUaeTrn,
  formatToE164,
  E164_PHONE_REGEX,
  UAE_TRN_REGEX,
  EMAIL_REGEX
} from '@/lib/validations/vendor';
import { PaymentTerms, ServiceCategory } from '@/types/vendors';

describe('Vendor Validation Schema', () => {
  describe('vendorSchema', () => {
    const validVendorData = {
      companyName: 'ABC Plumbing Services',
      contactPersonName: 'John Doe',
      emiratesIdOrTradeLicense: '784-1234-5678901-1',
      trn: '100123456789012',
      email: 'abc@plumbing.com',
      phoneNumber: '+971501234567',
      secondaryPhoneNumber: '+971509876543',
      address: '123 Industrial Area, Dubai',
      serviceCategories: [ServiceCategory.PLUMBING],
      serviceAreas: ['Dubai', 'Sharjah'],
      hourlyRate: 150,
      emergencyCalloutFee: 250,
      paymentTerms: PaymentTerms.NET_30
    };

    it('should validate a complete vendor with all fields', () => {
      const result = vendorSchema.safeParse(validVendorData);
      expect(result.success).toBe(true);
    });

    it('should validate a vendor with minimal required fields', () => {
      const minimalData = {
        companyName: 'ABC Plumbing',
        contactPersonName: 'John',
        emiratesIdOrTradeLicense: '784-1234-5678901-1',
        email: 'test@example.com',
        phoneNumber: '+971501234567',
        serviceCategories: [ServiceCategory.PLUMBING],
        serviceAreas: [],
        hourlyRate: 100,
        paymentTerms: PaymentTerms.NET_30
      };

      const result = vendorSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('companyName validation', () => {
      it('should reject empty company name', () => {
        const data = { ...validVendorData, companyName: '' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Company name is required');
        }
      });

      it('should reject company name longer than 200 characters', () => {
        const data = { ...validVendorData, companyName: 'A'.repeat(201) };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from company name', () => {
        const data = { ...validVendorData, companyName: '  ABC Plumbing  ' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.companyName).toBe('ABC Plumbing');
        }
      });
    });

    describe('email validation', () => {
      it('should reject empty email', () => {
        const data = { ...validVendorData, email: '' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid email format', () => {
        const data = { ...validVendorData, email: 'invalid-email' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid email format', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        validEmails.forEach((email) => {
          const data = { ...validVendorData, email };
          const result = vendorSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('phoneNumber validation', () => {
      it('should reject empty phone number', () => {
        const data = { ...validVendorData, phoneNumber: '' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject non-E.164 format', () => {
        const invalidNumbers = [
          '0501234567', // Local format
          '971501234567', // Missing +
          '123-456-7890', // US format
          '+971 50 123 4567' // With spaces
        ];

        invalidNumbers.forEach((phone) => {
          const data = { ...validVendorData, phoneNumber: phone };
          const result = vendorSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should accept valid E.164 format', () => {
        const validNumbers = [
          '+971501234567',
          '+14155551234',
          '+447700900123'
        ];

        validNumbers.forEach((phone) => {
          const data = { ...validVendorData, phoneNumber: phone };
          const result = vendorSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('TRN validation', () => {
      it('should accept empty TRN (optional field)', () => {
        const data = { ...validVendorData, trn: '' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept valid 15-digit TRN', () => {
        const data = { ...validVendorData, trn: '100123456789012' };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid TRN format', () => {
        const invalidTRNs = [
          '1234567890', // Too short
          '1234567890123456', // Too long
          '10012345678901A' // Contains letter
        ];

        invalidTRNs.forEach((trn) => {
          const data = { ...validVendorData, trn };
          const result = vendorSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('serviceCategories validation', () => {
      it('should reject empty service categories', () => {
        const data = { ...validVendorData, serviceCategories: [] };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('At least one service category');
        }
      });

      it('should accept multiple service categories', () => {
        const data = {
          ...validVendorData,
          serviceCategories: [
            ServiceCategory.PLUMBING,
            ServiceCategory.ELECTRICAL,
            ServiceCategory.HVAC
          ]
        };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('hourlyRate validation', () => {
      it('should reject negative hourly rate', () => {
        const data = { ...validVendorData, hourlyRate: -1 };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept zero hourly rate', () => {
        const data = { ...validVendorData, hourlyRate: 0 };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept positive hourly rate', () => {
        const data = { ...validVendorData, hourlyRate: 250.50 };
        const result = vendorSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('vendorFilterSchema', () => {
    it('should validate empty filter (all defaults)', () => {
      const result = vendorFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ALL');
        expect(result.data.page).toBe(0);
        expect(result.data.size).toBe(20);
      }
    });

    it('should validate filter with search term', () => {
      const result = vendorFilterSchema.safeParse({ search: 'plumbing' });
      expect(result.success).toBe(true);
    });

    it('should reject search term longer than 100 characters', () => {
      const result = vendorFilterSchema.safeParse({ search: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should validate filter with status', () => {
      const result = vendorFilterSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });

    it('should validate minRating between 0 and 5', () => {
      const validResult = vendorFilterSchema.safeParse({ minRating: 4 });
      expect(validResult.success).toBe(true);

      const invalidLow = vendorFilterSchema.safeParse({ minRating: -1 });
      expect(invalidLow.success).toBe(false);

      const invalidHigh = vendorFilterSchema.safeParse({ minRating: 6 });
      expect(invalidHigh.success).toBe(false);
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidE164Phone', () => {
    it('should return true for valid E.164 phone numbers', () => {
      expect(isValidE164Phone('+971501234567')).toBe(true);
      expect(isValidE164Phone('+14155551234')).toBe(true);
      expect(isValidE164Phone('+447700900123')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidE164Phone('')).toBe(false);
      expect(isValidE164Phone('0501234567')).toBe(false);
      expect(isValidE164Phone('971501234567')).toBe(false);
      expect(isValidE164Phone('+0123456')).toBe(false);
    });
  });

  describe('isValidUaeTrn', () => {
    it('should return true for valid TRNs', () => {
      expect(isValidUaeTrn('100123456789012')).toBe(true);
      expect(isValidUaeTrn('999999999999999')).toBe(true);
    });

    it('should return true for empty TRN (optional)', () => {
      expect(isValidUaeTrn('')).toBe(true);
    });

    it('should return false for invalid TRNs', () => {
      expect(isValidUaeTrn('1234567890')).toBe(false);
      expect(isValidUaeTrn('12345678901234567')).toBe(false);
      expect(isValidUaeTrn('10012345678901A')).toBe(false);
    });
  });

  describe('formatToE164', () => {
    it('should return E.164 number unchanged', () => {
      expect(formatToE164('+971501234567')).toBe('+971501234567');
    });

    it('should convert UAE local format to E.164', () => {
      expect(formatToE164('0501234567')).toBe('+971501234567');
    });

    it('should add + to numbers starting with 971', () => {
      expect(formatToE164('971501234567')).toBe('+971501234567');
    });

    it('should assume UAE for numbers without country code', () => {
      expect(formatToE164('501234567')).toBe('+971501234567');
    });

    it('should remove spaces and special characters', () => {
      expect(formatToE164('+971 50 123 4567')).toBe('+971501234567');
      expect(formatToE164('+971-50-123-4567')).toBe('+971501234567');
    });
  });
});

describe('Regex Patterns', () => {
  describe('E164_PHONE_REGEX', () => {
    it('should match valid E.164 numbers', () => {
      expect(E164_PHONE_REGEX.test('+971501234567')).toBe(true);
      expect(E164_PHONE_REGEX.test('+14155551234')).toBe(true);
    });

    it('should not match invalid numbers', () => {
      expect(E164_PHONE_REGEX.test('0501234567')).toBe(false);
      expect(E164_PHONE_REGEX.test('+0123')).toBe(false);
    });
  });

  describe('UAE_TRN_REGEX', () => {
    it('should match valid UAE TRN', () => {
      expect(UAE_TRN_REGEX.test('100123456789012')).toBe(true);
    });

    it('should not match invalid TRN', () => {
      expect(UAE_TRN_REGEX.test('1234567890')).toBe(false);
      expect(UAE_TRN_REGEX.test('10012345678901A')).toBe(false);
    });
  });

  describe('EMAIL_REGEX', () => {
    it('should match valid emails', () => {
      expect(EMAIL_REGEX.test('test@example.com')).toBe(true);
    });

    it('should not match invalid emails', () => {
      expect(EMAIL_REGEX.test('invalid')).toBe(false);
      expect(EMAIL_REGEX.test('@domain.com')).toBe(false);
    });
  });
});
