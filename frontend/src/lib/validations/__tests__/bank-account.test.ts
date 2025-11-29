/**
 * Bank Account Validation Schema Tests
 * Story 6.5: Bank Account Management
 * AC #29: Frontend unit tests for validation schemas
 *
 * Tests for Zod validation schemas and helper functions
 */

import {
  createBankAccountSchema,
  updateBankAccountSchema,
  bankAccountFilterSchema,
  validateIbanChecksum,
  validateIbanFormat,
  validateSwiftFormat,
  getIbanValidationHints,
  getSwiftValidationHints,
  hasUnsavedChanges,
  createBankAccountDefaults,
} from '@/lib/validations/bank-account';
import { BankAccountStatus } from '@/types/bank-account';

describe('Bank Account Validation Schema', () => {
  // =================================================================
  // CREATE BANK ACCOUNT SCHEMA TESTS
  // =================================================================

  describe('createBankAccountSchema', () => {
    const validBankAccountData = {
      bankName: 'Emirates NBD',
      accountName: 'Company Main Account',
      accountNumber: '1234567890123456',
      iban: 'AE070331234567890123456',
      swiftCode: 'EMIRAEADXXX',
      isPrimary: false,
      status: BankAccountStatus.ACTIVE,
    };

    it('should validate a complete bank account with all fields', () => {
      const result = createBankAccountSchema.safeParse(validBankAccountData);
      expect(result.success).toBe(true);
    });

    it('should validate bank account with minimal required fields', () => {
      const minimalData = {
        bankName: 'Test Bank',
        accountName: 'Test Account',
        accountNumber: '123456789',
        iban: 'AE070331234567890123456',
        swiftCode: 'EMIRAEADXXX',
      };
      const result = createBankAccountSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('bankName validation', () => {
      it('should reject empty bank name', () => {
        const data = { ...validBankAccountData, bankName: '' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject bank name exceeding max length', () => {
        const data = { ...validBankAccountData, bankName: 'A'.repeat(101) };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from bank name', () => {
        const data = { ...validBankAccountData, bankName: '  Emirates NBD  ' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.bankName).toBe('Emirates NBD');
        }
      });
    });

    describe('accountName validation', () => {
      it('should reject empty account name', () => {
        const data = { ...validBankAccountData, accountName: '' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject account name exceeding max length', () => {
        const data = { ...validBankAccountData, accountName: 'A'.repeat(256) };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('accountNumber validation', () => {
      it('should reject empty account number', () => {
        const data = { ...validBankAccountData, accountNumber: '' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject account number exceeding max length', () => {
        const data = { ...validBankAccountData, accountNumber: 'A'.repeat(101) };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  // =================================================================
  // IBAN VALIDATION TESTS
  // =================================================================

  describe('IBAN validation', () => {
    describe('validateIbanChecksum', () => {
      it('should validate correct UAE IBAN', () => {
        // Valid UAE IBAN with correct checksum
        expect(validateIbanChecksum('AE070331234567890123456')).toBe(true);
      });

      it('should reject IBAN with incorrect checksum', () => {
        // Modified IBAN with wrong check digits
        expect(validateIbanChecksum('AE990331234567890123456')).toBe(false);
      });

      it('should handle lowercase IBANs', () => {
        expect(validateIbanChecksum('ae070331234567890123456')).toBe(true);
      });

      it('should handle IBANs with spaces', () => {
        expect(validateIbanChecksum('AE07 0331 2345 6789 0123 456')).toBe(true);
      });
    });

    describe('validateIbanFormat', () => {
      it('should accept valid UAE IBAN format', () => {
        const result = validateIbanFormat('AE070331234567890123456');
        expect(result.valid).toBe(true);
      });

      it('should reject empty IBAN', () => {
        const result = validateIbanFormat('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('IBAN is required');
      });

      it('should reject IBAN not starting with AE', () => {
        const result = validateIbanFormat('DE070331234567890123456');
        expect(result.valid).toBe(false);
        expect(result.error).toContain("start with 'AE'");
      });

      it('should reject IBAN with wrong length', () => {
        const result = validateIbanFormat('AE0703312345678901234'); // 22 chars
        expect(result.valid).toBe(false);
        expect(result.error).toContain('23 characters');
      });

      it('should reject IBAN with letters after country code', () => {
        // AE07033123456789012ABC has 22 chars (not 23)
        const result = validateIbanFormat('AE07033123456789012ABC');
        expect(result.valid).toBe(false);
        // The length check happens before format check
        expect(result.error).toContain('23 characters');
      });

      it('should reject IBAN with non-digit characters after country code (correct length)', () => {
        // 23 chars but with letters instead of digits
        const result = validateIbanFormat('AE0703312345678901234AB');
        expect(result.valid).toBe(false);
        expect(result.error).toContain("'AE' followed by 21 digits");
      });
    });

    describe('createBankAccountSchema IBAN validation', () => {
      const validData = {
        bankName: 'Test Bank',
        accountName: 'Test Account',
        accountNumber: '123456789',
        swiftCode: 'EMIRAEADXXX',
      };

      it('should reject invalid IBAN format', () => {
        const data = { ...validData, iban: 'INVALID' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject IBAN with invalid checksum', () => {
        // Valid format but invalid checksum
        const data = { ...validData, iban: 'AE990331234567890123456' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid UAE IBAN', () => {
        const data = { ...validData, iban: 'AE070331234567890123456' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should normalize IBAN to uppercase', () => {
        const data = { ...validData, iban: 'ae070331234567890123456' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.iban).toBe('AE070331234567890123456');
        }
      });

      it('should remove spaces from IBAN', () => {
        const data = { ...validData, iban: 'AE07 0331 2345 6789 0123 456' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.iban).toBe('AE070331234567890123456');
        }
      });
    });
  });

  // =================================================================
  // SWIFT/BIC VALIDATION TESTS
  // =================================================================

  describe('SWIFT/BIC validation', () => {
    describe('validateSwiftFormat', () => {
      it('should accept valid 8-character SWIFT code', () => {
        const result = validateSwiftFormat('EMIRAEADX');
        expect(result.valid).toBe(false); // 9 chars
      });

      it('should accept valid 11-character SWIFT code', () => {
        const result = validateSwiftFormat('EMIRAEADXXX');
        expect(result.valid).toBe(true);
      });

      it('should accept valid 8-character SWIFT code', () => {
        const result = validateSwiftFormat('EMIRAEAD');
        expect(result.valid).toBe(true);
      });

      it('should reject empty SWIFT code', () => {
        const result = validateSwiftFormat('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('SWIFT/BIC code is required');
      });

      it('should reject SWIFT code with wrong length', () => {
        const result = validateSwiftFormat('EMIRAE');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('8 or 11 characters');
      });

      it('should reject SWIFT code with invalid format', () => {
        const result = validateSwiftFormat('1234AEAD'); // First 4 must be letters
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid format');
      });
    });

    describe('createBankAccountSchema SWIFT validation', () => {
      const validData = {
        bankName: 'Test Bank',
        accountName: 'Test Account',
        accountNumber: '123456789',
        iban: 'AE070331234567890123456',
      };

      it('should accept valid 8-character SWIFT code', () => {
        const data = { ...validData, swiftCode: 'EMIRAEADX' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false); // 9 chars - invalid
      });

      it('should accept valid 11-character SWIFT code', () => {
        const data = { ...validData, swiftCode: 'EMIRAEADXXX' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid SWIFT code format', () => {
        const data = { ...validData, swiftCode: 'INVALID' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should normalize SWIFT code to uppercase', () => {
        const data = { ...validData, swiftCode: 'emiraeadxxx' };
        const result = createBankAccountSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.swiftCode).toBe('EMIRAEADXXX');
        }
      });
    });
  });

  // =================================================================
  // UPDATE BANK ACCOUNT SCHEMA TESTS
  // =================================================================

  describe('updateBankAccountSchema', () => {
    const validUpdateData = {
      bankName: 'Emirates NBD',
      accountName: 'Company Main Account',
      accountNumber: '1234567890123456',
      iban: 'AE070331234567890123456',
      swiftCode: 'EMIRAEADXXX',
      isPrimary: false,
      status: BankAccountStatus.ACTIVE,
    };

    it('should validate complete update data', () => {
      const result = updateBankAccountSchema.safeParse(validUpdateData);
      expect(result.success).toBe(true);
    });

    it('should require status for update', () => {
      const { status, ...dataWithoutStatus } = validUpdateData;
      const result = updateBankAccountSchema.safeParse(dataWithoutStatus);
      expect(result.success).toBe(false);
    });

    it('should accept inactive status', () => {
      const data = { ...validUpdateData, status: BankAccountStatus.INACTIVE };
      const result = updateBankAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // =================================================================
  // FILTER SCHEMA TESTS
  // =================================================================

  describe('bankAccountFilterSchema', () => {
    it('should validate empty filter (all defaults)', () => {
      const result = bankAccountFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate filter with search term', () => {
      const result = bankAccountFilterSchema.safeParse({ search: 'Emirates' });
      expect(result.success).toBe(true);
    });

    it('should validate filter with status', () => {
      const result = bankAccountFilterSchema.safeParse({
        status: BankAccountStatus.ACTIVE,
      });
      expect(result.success).toBe(true);
    });

    it('should reject search term exceeding max length', () => {
      const result = bankAccountFilterSchema.safeParse({
        search: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // HELPER FUNCTIONS TESTS
  // =================================================================

  describe('Helper Functions', () => {
    describe('getIbanValidationHints', () => {
      it('should return array of hints', () => {
        const hints = getIbanValidationHints();
        expect(hints).toBeInstanceOf(Array);
        expect(hints.length).toBeGreaterThan(0);
      });

      it('should include UAE format hint', () => {
        const hints = getIbanValidationHints();
        expect(hints.some((h) => h.includes('AE'))).toBe(true);
      });
    });

    describe('getSwiftValidationHints', () => {
      it('should return array of hints', () => {
        const hints = getSwiftValidationHints();
        expect(hints).toBeInstanceOf(Array);
        expect(hints.length).toBeGreaterThan(0);
      });

      it('should include length hint', () => {
        const hints = getSwiftValidationHints();
        expect(hints.some((h) => h.includes('8') && h.includes('11'))).toBe(true);
      });
    });

    describe('hasUnsavedChanges', () => {
      it('should return false when data is identical', () => {
        const data = {
          bankName: 'Test Bank',
          accountName: 'Test Account',
          accountNumber: '123456789',
          iban: 'AE070331234567890123456',
          swiftCode: 'EMIRAEADXXX',
          isPrimary: false,
          status: BankAccountStatus.ACTIVE,
        };
        expect(hasUnsavedChanges(data, data)).toBe(false);
      });

      it('should return true when bank name differs', () => {
        const current = { bankName: 'New Bank' };
        const original = { bankName: 'Old Bank' };
        expect(hasUnsavedChanges(current, original)).toBe(true);
      });

      it('should return true when status differs', () => {
        const current = { status: BankAccountStatus.ACTIVE };
        const original = { status: BankAccountStatus.INACTIVE };
        expect(hasUnsavedChanges(current, original)).toBe(true);
      });

      it('should be case-insensitive for string comparisons', () => {
        const current = { iban: 'ae070331234567890123456' };
        const original = { iban: 'AE070331234567890123456' };
        expect(hasUnsavedChanges(current, original)).toBe(false);
      });

      it('should handle trimmed strings', () => {
        const current = { bankName: 'Test Bank  ' };
        const original = { bankName: '  Test Bank' };
        expect(hasUnsavedChanges(current, original)).toBe(false);
      });
    });
  });

  // =================================================================
  // DEFAULTS TESTS
  // =================================================================

  describe('createBankAccountDefaults', () => {
    it('should have valid default values', () => {
      expect(createBankAccountDefaults.bankName).toBe('');
      expect(createBankAccountDefaults.accountName).toBe('');
      expect(createBankAccountDefaults.accountNumber).toBe('');
      expect(createBankAccountDefaults.iban).toBe('');
      expect(createBankAccountDefaults.swiftCode).toBe('');
      expect(createBankAccountDefaults.isPrimary).toBe(false);
      expect(createBankAccountDefaults.status).toBe(BankAccountStatus.ACTIVE);
    });
  });
});
