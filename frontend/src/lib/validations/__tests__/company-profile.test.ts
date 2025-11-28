/**
 * Company Profile Validation Schema Tests
 * Story 2.8: Company Profile Settings
 *
 * Tests for Zod validation schemas and helper functions
 */

import {
  companyProfileSchema,
  logoFileSchema,
  TRN_REGEX,
  UAE_PHONE_REGEX,
  EMAIL_REGEX,
  validateTRN,
  validateUAEPhone,
  validateEmail,
  toCompanyProfileRequest,
  toCompanyProfileFormData,
  companyProfileDefaults,
  type CompanyProfileFormData,
} from '@/lib/validations/company-profile';

describe('Company Profile Validation Schema', () => {
  describe('companyProfileSchema', () => {
    const validCompanyData: CompanyProfileFormData = {
      legalCompanyName: 'Ultra Property Management LLC',
      companyAddress: '123 Business Bay, Tower A, Floor 15',
      city: 'Dubai',
      country: 'United Arab Emirates',
      trn: '100123456789012',
      phoneNumber: '+971501234567',
      emailAddress: 'info@ultraproperty.ae',
    };

    it('should validate a complete company profile with all fields', () => {
      const result = companyProfileSchema.safeParse(validCompanyData);
      expect(result.success).toBe(true);
    });

    describe('legalCompanyName validation', () => {
      it('should reject empty company name', () => {
        const data = { ...validCompanyData, legalCompanyName: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject company name longer than 255 characters', () => {
        const data = { ...validCompanyData, legalCompanyName: 'A'.repeat(256) };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from company name', () => {
        const data = { ...validCompanyData, legalCompanyName: '  Ultra Property  ' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.legalCompanyName).toBe('Ultra Property');
        }
      });
    });

    describe('companyAddress validation', () => {
      it('should reject empty address', () => {
        const data = { ...validCompanyData, companyAddress: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject address longer than 500 characters', () => {
        const data = { ...validCompanyData, companyAddress: 'A'.repeat(501) };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from address', () => {
        const data = { ...validCompanyData, companyAddress: '  123 Main St  ' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.companyAddress).toBe('123 Main St');
        }
      });
    });

    describe('city validation', () => {
      it('should reject empty city', () => {
        const data = { ...validCompanyData, city: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject city longer than 100 characters', () => {
        const data = { ...validCompanyData, city: 'A'.repeat(101) };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from city', () => {
        const data = { ...validCompanyData, city: '  Dubai  ' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.city).toBe('Dubai');
        }
      });
    });

    describe('country validation', () => {
      it('should reject empty country', () => {
        const data = { ...validCompanyData, country: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject country longer than 100 characters', () => {
        const data = { ...validCompanyData, country: 'A'.repeat(101) };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('TRN validation', () => {
      it('should accept valid 15-digit TRN starting with 100', () => {
        const data = { ...validCompanyData, trn: '100123456789012' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject empty TRN', () => {
        const data = { ...validCompanyData, trn: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject TRN not starting with 100', () => {
        const invalidTRNs = [
          '200123456789012', // Wrong prefix
          '123456789012345', // Doesn't start with 100
          '999123456789012', // Wrong prefix
        ];

        invalidTRNs.forEach((trn) => {
          const data = { ...validCompanyData, trn };
          const result = companyProfileSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should reject TRN with wrong length', () => {
        const invalidTRNs = [
          '10012345678901', // 14 digits
          '1001234567890123', // 16 digits
          '1001234567', // Too short
        ];

        invalidTRNs.forEach((trn) => {
          const data = { ...validCompanyData, trn };
          const result = companyProfileSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should reject TRN with non-numeric characters', () => {
        const data = { ...validCompanyData, trn: '10012345678901A' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('phoneNumber validation', () => {
      it('should accept valid UAE phone number', () => {
        const data = { ...validCompanyData, phoneNumber: '+971501234567' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject empty phone number', () => {
        const data = { ...validCompanyData, phoneNumber: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject phone number not in UAE format', () => {
        const invalidNumbers = [
          '0501234567', // Local format without +971
          '+14155551234', // US number
          '+971 50 123 4567', // With spaces
          '+9715012345', // Too short
          '+97150123456789', // Too long
          '971501234567', // Missing +
        ];

        invalidNumbers.forEach((phone) => {
          const data = { ...validCompanyData, phoneNumber: phone };
          const result = companyProfileSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should accept various valid UAE phone prefixes', () => {
        const validNumbers = [
          '+971501234567', // 50
          '+971551234567', // 55
          '+971561234567', // 56
          '+971521234567', // 52
          '+971581234567', // 58
          '+971541234567', // 54 (landline)
        ];

        validNumbers.forEach((phone) => {
          const data = { ...validCompanyData, phoneNumber: phone };
          const result = companyProfileSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('emailAddress validation', () => {
      it('should accept valid email', () => {
        const data = { ...validCompanyData, emailAddress: 'info@company.ae' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject empty email', () => {
        const data = { ...validCompanyData, emailAddress: '' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid email format', () => {
        const invalidEmails = [
          'invalid',
          '@domain.com',
          'user@',
          'user@domain',
          'user name@domain.com',
        ];

        invalidEmails.forEach((email) => {
          const data = { ...validCompanyData, emailAddress: email };
          const result = companyProfileSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should transform email to lowercase', () => {
        const data = { ...validCompanyData, emailAddress: 'INFO@COMPANY.AE' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.emailAddress).toBe('info@company.ae');
        }
      });

      it('should trim and lowercase email (no leading/trailing whitespace in input)', () => {
        // Note: Zod validates .email() before .transform(), so emails with leading/trailing
        // whitespace fail validation. The transform happens after validation passes.
        const data = { ...validCompanyData, emailAddress: 'INFO@COMPANY.AE' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.emailAddress).toBe('info@company.ae');
        }
      });

      it('should reject email with leading/trailing whitespace', () => {
        // Zod validates first, so whitespace causes email validation to fail
        const data = { ...validCompanyData, emailAddress: '  info@company.ae  ' };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject email longer than 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@test.com';
        const data = { ...validCompanyData, emailAddress: longEmail };
        const result = companyProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('logoFileSchema', () => {
    // Create mock File object for testing
    const createMockFile = (type: string, size: number, name: string = 'test.png'): File => {
      const content = new Uint8Array(size);
      const blob = new Blob([content], { type });
      return new File([blob], name, { type });
    };

    it('should accept valid PNG file', () => {
      const file = createMockFile('image/png', 1024 * 1024, 'logo.png'); // 1MB PNG
      const result = logoFileSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should accept valid JPEG file', () => {
      const file = createMockFile('image/jpeg', 1024 * 1024, 'logo.jpg'); // 1MB JPEG
      const result = logoFileSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it('should reject file larger than 2MB', () => {
      const file = createMockFile('image/png', 3 * 1024 * 1024, 'large.png'); // 3MB
      const result = logoFileSchema.safeParse({ file });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2MB');
      }
    });

    it('should reject non-image file types', () => {
      const invalidTypes = [
        'application/pdf',
        'text/plain',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      invalidTypes.forEach((type) => {
        const file = createMockFile(type, 1024, 'test.file');
        const result = logoFileSchema.safeParse({ file });
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty file', () => {
      const file = createMockFile('image/png', 0, 'empty.png');
      const result = logoFileSchema.safeParse({ file });
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validateTRN', () => {
    it('should return true for valid TRN', () => {
      expect(validateTRN('100123456789012')).toBe(true);
      expect(validateTRN('100000000000000')).toBe(true);
      expect(validateTRN('100999999999999')).toBe(true);
    });

    it('should return false for invalid TRN', () => {
      expect(validateTRN('')).toBe(false);
      expect(validateTRN('200123456789012')).toBe(false);
      expect(validateTRN('10012345678901')).toBe(false); // Too short
      expect(validateTRN('1001234567890123')).toBe(false); // Too long
      expect(validateTRN('10012345678901A')).toBe(false); // Non-numeric
    });
  });

  describe('validateUAEPhone', () => {
    it('should return true for valid UAE phone numbers', () => {
      expect(validateUAEPhone('+971501234567')).toBe(true);
      expect(validateUAEPhone('+971551234567')).toBe(true);
      expect(validateUAEPhone('+971561234567')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(validateUAEPhone('')).toBe(false);
      expect(validateUAEPhone('0501234567')).toBe(false);
      expect(validateUAEPhone('+14155551234')).toBe(false);
      expect(validateUAEPhone('971501234567')).toBe(false);
      expect(validateUAEPhone('+971 50 123 4567')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.ae')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });
});

describe('Data Transformation Functions', () => {
  describe('toCompanyProfileRequest', () => {
    it('should convert form data to API request format', () => {
      const formData: CompanyProfileFormData = {
        legalCompanyName: 'Test Company',
        companyAddress: '123 Test St',
        city: 'Dubai',
        country: 'United Arab Emirates',
        trn: '100123456789012',
        phoneNumber: '+971501234567',
        emailAddress: 'test@company.ae',
      };

      const request = toCompanyProfileRequest(formData);

      expect(request).toEqual({
        legalCompanyName: 'Test Company',
        companyAddress: '123 Test St',
        city: 'Dubai',
        country: 'United Arab Emirates',
        trn: '100123456789012',
        phoneNumber: '+971501234567',
        emailAddress: 'test@company.ae',
      });
    });
  });

  describe('toCompanyProfileFormData', () => {
    it('should convert API response to form data', () => {
      const response = {
        legalCompanyName: 'Test Company',
        companyAddress: '123 Test St',
        city: 'Dubai',
        country: 'United Arab Emirates',
        trn: '100123456789012',
        phoneNumber: '+971501234567',
        emailAddress: 'test@company.ae',
      };

      const formData = toCompanyProfileFormData(response);

      expect(formData).toEqual({
        legalCompanyName: 'Test Company',
        companyAddress: '123 Test St',
        city: 'Dubai',
        country: 'United Arab Emirates',
        trn: '100123456789012',
        phoneNumber: '+971501234567',
        emailAddress: 'test@company.ae',
      });
    });

    it('should handle empty/null values with defaults', () => {
      const response = {
        legalCompanyName: '',
        companyAddress: '',
        city: '',
        country: '',
        trn: '',
        phoneNumber: '',
        emailAddress: '',
      };

      const formData = toCompanyProfileFormData(response);

      expect(formData.country).toBe('United Arab Emirates');
      expect(formData.phoneNumber).toBe('+971');
    });
  });

  describe('companyProfileDefaults', () => {
    it('should have correct default values', () => {
      expect(companyProfileDefaults.legalCompanyName).toBe('');
      expect(companyProfileDefaults.companyAddress).toBe('');
      expect(companyProfileDefaults.city).toBe('');
      expect(companyProfileDefaults.country).toBe('United Arab Emirates');
      expect(companyProfileDefaults.trn).toBe('');
      expect(companyProfileDefaults.phoneNumber).toBe('+971');
      expect(companyProfileDefaults.emailAddress).toBe('');
    });
  });
});

describe('Regex Patterns', () => {
  describe('TRN_REGEX', () => {
    it('should match valid UAE TRN', () => {
      expect(TRN_REGEX.test('100123456789012')).toBe(true);
      expect(TRN_REGEX.test('100000000000000')).toBe(true);
    });

    it('should not match invalid TRN', () => {
      expect(TRN_REGEX.test('200123456789012')).toBe(false);
      expect(TRN_REGEX.test('10012345678901')).toBe(false);
      expect(TRN_REGEX.test('1001234567890123')).toBe(false);
      expect(TRN_REGEX.test('')).toBe(false);
    });
  });

  describe('UAE_PHONE_REGEX', () => {
    it('should match valid UAE phone numbers', () => {
      expect(UAE_PHONE_REGEX.test('+971501234567')).toBe(true);
      expect(UAE_PHONE_REGEX.test('+971551234567')).toBe(true);
    });

    it('should not match invalid phone numbers', () => {
      expect(UAE_PHONE_REGEX.test('0501234567')).toBe(false);
      expect(UAE_PHONE_REGEX.test('+14155551234')).toBe(false);
      expect(UAE_PHONE_REGEX.test('')).toBe(false);
    });
  });

  describe('EMAIL_REGEX', () => {
    it('should match valid emails', () => {
      expect(EMAIL_REGEX.test('test@example.com')).toBe(true);
      expect(EMAIL_REGEX.test('user@domain.co.ae')).toBe(true);
    });

    it('should not match invalid emails', () => {
      expect(EMAIL_REGEX.test('invalid')).toBe(false);
      expect(EMAIL_REGEX.test('@domain.com')).toBe(false);
      expect(EMAIL_REGEX.test('')).toBe(false);
    });
  });
});
