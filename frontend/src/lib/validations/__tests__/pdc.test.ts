/**
 * PDC Validation Schema Tests
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #36: Frontend unit tests for validation schemas
 */

import {
  pdcCreateSchema,
  pdcBulkCreateSchema,
  pdcDepositSchema,
  pdcClearSchema,
  pdcBounceSchema,
  pdcReplaceSchema,
  pdcWithdrawSchema,
  pdcFilterSchema,
  pdcChequeEntrySchema,
  pdcCreateDefaults,
  pdcBulkCreateDefaults,
  pdcDepositDefaults,
  pdcClearDefaults,
  pdcBounceDefaults,
  pdcReplaceDefaults,
  pdcWithdrawDefaults,
  pdcFilterDefaults,
  isValidChequeNumber,
  isFutureOrTodayDate,
  isPastOrTodayDate,
  isValidDateString,
  validateDateRange,
  getDaysUntilDate,
  isWithinDueWindow,
  formatAmount,
  calculateTotalChequeAmount,
  getDefaultChequeEntry,
  generateDefaultChequeEntries,
  PDC_VALIDATION_CONSTANTS,
} from '@/lib/validations/pdc';
import { NewPaymentMethod } from '@/types/pdc';

describe('PDC Validation Schema', () => {
  // =================================================================
  // SINGLE PDC CREATE SCHEMA TESTS
  // =================================================================

  describe('pdcCreateSchema', () => {
    const validTenantId = '123e4567-e89b-12d3-a456-426614174000';
    const futureDate = getFutureDateString(30);

    const validPDCData = {
      tenantId: validTenantId,
      chequeNumber: 'CHQ-001',
      bankName: 'Emirates NBD',
      amount: 5000.00,
      chequeDate: futureDate,
      notes: 'Monthly rent payment',
    };

    it('should validate a complete PDC with all fields', () => {
      const result = pdcCreateSchema.safeParse(validPDCData);
      expect(result.success).toBe(true);
    });

    it('should validate PDC with minimal required fields', () => {
      const minimalData = {
        tenantId: validTenantId,
        chequeNumber: 'CHQ-001',
        bankName: 'Emirates NBD',
        amount: 5000.00,
        chequeDate: futureDate,
      };

      const result = pdcCreateSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('tenantId validation', () => {
      it('should reject empty tenantId', () => {
        const data = { ...validPDCData, tenantId: '' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid UUID for tenantId', () => {
        const data = { ...validPDCData, tenantId: 'invalid-uuid' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('chequeNumber validation', () => {
      it('should reject empty cheque number', () => {
        const data = { ...validPDCData, chequeNumber: '' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject cheque number shorter than 3 characters', () => {
        const data = { ...validPDCData, chequeNumber: 'AB' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3');
        }
      });

      it('should reject cheque number longer than 50 characters', () => {
        const data = { ...validPDCData, chequeNumber: 'A'.repeat(51) };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject cheque number with invalid characters', () => {
        const invalidNumbers = ['CHQ#001', 'CHQ@001', 'CHQ 001', 'CHQ.001'];
        invalidNumbers.forEach((chequeNumber) => {
          const data = { ...validPDCData, chequeNumber };
          const result = pdcCreateSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should accept valid alphanumeric cheque numbers with hyphens', () => {
        const validNumbers = ['CHQ-001', 'ABC123', 'A-B-C-1-2-3', '1234567890'];
        validNumbers.forEach((chequeNumber) => {
          const data = { ...validPDCData, chequeNumber };
          const result = pdcCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('bankName validation', () => {
      it('should reject empty bank name', () => {
        const data = { ...validPDCData, bankName: '' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject bank name exceeding max length', () => {
        const data = { ...validPDCData, bankName: 'A'.repeat(101) };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('amount validation', () => {
      it('should reject zero amount', () => {
        const data = { ...validPDCData, amount: 0 };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('greater than 0');
        }
      });

      it('should reject negative amount', () => {
        const data = { ...validPDCData, amount: -100 };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject amount exceeding maximum', () => {
        const data = { ...validPDCData, amount: 100000000 };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid positive amounts', () => {
        const validAmounts = [0.01, 100, 5000.50, 99999999.99];
        validAmounts.forEach((amount) => {
          const data = { ...validPDCData, amount };
          const result = pdcCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('chequeDate validation', () => {
      it('should reject empty cheque date', () => {
        const data = { ...validPDCData, chequeDate: '' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid date format', () => {
        const invalidDates = ['invalid', 'not-a-date', '2025-13-45'];
        invalidDates.forEach((chequeDate) => {
          const data = { ...validPDCData, chequeDate };
          const result = pdcCreateSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should reject past date', () => {
        const pastDate = getPastDateString(30);
        const data = { ...validPDCData, chequeDate: pastDate };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('future');
        }
      });

      it('should accept today date', () => {
        const today = getTodayDateString();
        const data = { ...validPDCData, chequeDate: today };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept future date', () => {
        const futureDate = getFutureDateString(30);
        const data = { ...validPDCData, chequeDate: futureDate };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('optional fields validation', () => {
      it('should accept PDC without notes', () => {
        const { notes, ...dataWithoutNotes } = validPDCData;
        const result = pdcCreateSchema.safeParse(dataWithoutNotes);
        expect(result.success).toBe(true);
      });

      it('should accept PDC with null notes', () => {
        const data = { ...validPDCData, notes: null };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject notes exceeding max length', () => {
        const data = { ...validPDCData, notes: 'A'.repeat(501) };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid leaseId UUID', () => {
        const data = { ...validPDCData, leaseId: '123e4567-e89b-12d3-a456-426614174001' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject invalid leaseId', () => {
        const data = { ...validPDCData, leaseId: 'invalid-uuid' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid invoiceId UUID', () => {
        const data = { ...validPDCData, invoiceId: '123e4567-e89b-12d3-a456-426614174002' };
        const result = pdcCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // =================================================================
  // BULK PDC CREATE SCHEMA TESTS
  // =================================================================

  describe('pdcBulkCreateSchema', () => {
    const validTenantId = '123e4567-e89b-12d3-a456-426614174000';
    const futureDate = getFutureDateString(30);

    const validBulkData = {
      tenantId: validTenantId,
      cheques: [
        { chequeNumber: 'CHQ-001', bankName: 'Emirates NBD', amount: 5000, chequeDate: futureDate },
        { chequeNumber: 'CHQ-002', bankName: 'Emirates NBD', amount: 5000, chequeDate: getFutureDateString(60) },
      ],
    };

    it('should validate bulk PDC with valid data', () => {
      const result = pdcBulkCreateSchema.safeParse(validBulkData);
      expect(result.success).toBe(true);
    });

    it('should reject empty cheques array', () => {
      const data = { ...validBulkData, cheques: [] };
      const result = pdcBulkCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message.toLowerCase()).toContain('at least 1');
      }
    });

    it('should reject more than 24 cheques', () => {
      const cheques = Array.from({ length: 25 }, (_, i) => ({
        chequeNumber: `CHQ-${String(i).padStart(3, '0')}`,
        bankName: 'Emirates NBD',
        amount: 5000,
        chequeDate: getFutureDateString(30 + i),
      }));
      const data = { ...validBulkData, cheques };
      const result = pdcBulkCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 24');
      }
    });

    it('should accept exactly 24 cheques', () => {
      const cheques = Array.from({ length: 24 }, (_, i) => ({
        chequeNumber: `CHQ-${String(i).padStart(3, '0')}`,
        bankName: 'Emirates NBD',
        amount: 5000,
        chequeDate: getFutureDateString(30 + i),
      }));
      const data = { ...validBulkData, cheques };
      const result = pdcBulkCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject duplicate cheque numbers', () => {
      const data = {
        ...validBulkData,
        cheques: [
          { chequeNumber: 'CHQ-001', bankName: 'Emirates NBD', amount: 5000, chequeDate: futureDate },
          { chequeNumber: 'CHQ-001', bankName: 'ADCB', amount: 6000, chequeDate: getFutureDateString(60) },
        ],
      };
      const result = pdcBulkCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Duplicate');
      }
    });

    it('should reject duplicate cheque numbers (case-insensitive)', () => {
      const data = {
        ...validBulkData,
        cheques: [
          { chequeNumber: 'CHQ-001', bankName: 'Emirates NBD', amount: 5000, chequeDate: futureDate },
          { chequeNumber: 'chq-001', bankName: 'ADCB', amount: 6000, chequeDate: getFutureDateString(60) },
        ],
      };
      const result = pdcBulkCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // ACTION SCHEMA TESTS
  // =================================================================

  describe('pdcDepositSchema', () => {
    it('should validate complete deposit data', () => {
      const data = {
        depositDate: getTodayDateString(),
        bankAccountId: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = pdcDepositSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject future deposit date', () => {
      const data = {
        depositDate: getFutureDateString(30),
        bankAccountId: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = pdcDepositSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be in the future');
      }
    });

    it('should reject empty bank account ID', () => {
      const data = {
        depositDate: getTodayDateString(),
        bankAccountId: '',
      };
      const result = pdcDepositSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept past deposit date', () => {
      const data = {
        depositDate: getPastDateString(5),
        bankAccountId: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = pdcDepositSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('pdcClearSchema', () => {
    it('should validate complete clear data', () => {
      const data = { clearedDate: getTodayDateString() };
      const result = pdcClearSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject future cleared date', () => {
      const data = { clearedDate: getFutureDateString(30) };
      const result = pdcClearSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept past cleared date', () => {
      const data = { clearedDate: getPastDateString(5) };
      const result = pdcClearSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('pdcBounceSchema', () => {
    it('should validate complete bounce data', () => {
      const data = {
        bouncedDate: getTodayDateString(),
        bounceReason: 'Insufficient funds',
      };
      const result = pdcBounceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty bounce reason', () => {
      const data = {
        bouncedDate: getTodayDateString(),
        bounceReason: '',
      };
      const result = pdcBounceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject bounce reason exceeding max length', () => {
      const data = {
        bouncedDate: getTodayDateString(),
        bounceReason: 'A'.repeat(256),
      };
      const result = pdcBounceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('pdcReplaceSchema', () => {
    const validReplaceData = {
      newChequeNumber: 'CHQ-REPLACEMENT',
      bankName: 'FAB',
      amount: 5000,
      chequeDate: getFutureDateString(30),
    };

    it('should validate complete replace data', () => {
      const result = pdcReplaceSchema.safeParse(validReplaceData);
      expect(result.success).toBe(true);
    });

    it('should validate replace data with notes', () => {
      const data = { ...validReplaceData, notes: 'Replacement for bounced cheque' };
      const result = pdcReplaceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject past cheque date for replacement', () => {
      const data = { ...validReplaceData, chequeDate: getPastDateString(30) };
      const result = pdcReplaceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('pdcWithdrawSchema', () => {
    const validWithdrawData = {
      withdrawalDate: getTodayDateString(),
      withdrawalReason: 'Tenant requested return',
    };

    it('should validate withdrawal without payment method', () => {
      const result = pdcWithdrawSchema.safeParse(validWithdrawData);
      expect(result.success).toBe(true);
    });

    it('should validate withdrawal with cash payment method', () => {
      const data = {
        ...validWithdrawData,
        newPaymentMethod: NewPaymentMethod.CASH,
      };
      const result = pdcWithdrawSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require transaction details for bank transfer', () => {
      const data = {
        ...validWithdrawData,
        newPaymentMethod: NewPaymentMethod.BANK_TRANSFER,
      };
      const result = pdcWithdrawSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Transaction details');
      }
    });

    it('should validate bank transfer with transaction details', () => {
      const data = {
        ...validWithdrawData,
        newPaymentMethod: NewPaymentMethod.BANK_TRANSFER,
        transactionDetails: {
          amount: 5000,
          transactionId: 'TXN-123456',
          bankAccountId: '123e4567-e89b-12d3-a456-426614174000',
        },
      };
      const result = pdcWithdrawSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty withdrawal reason', () => {
      const data = {
        withdrawalDate: getTodayDateString(),
        withdrawalReason: '',
      };
      const result = pdcWithdrawSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // FILTER SCHEMA TESTS
  // =================================================================

  describe('pdcFilterSchema', () => {
    it('should validate empty filter (all defaults)', () => {
      const result = pdcFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate filter with search term', () => {
      const result = pdcFilterSchema.safeParse({ search: 'CHQ-001' });
      expect(result.success).toBe(true);
    });

    it('should validate filter with status', () => {
      const result = pdcFilterSchema.safeParse({ status: 'RECEIVED' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = pdcFilterSchema.safeParse({ status: 'INVALID_STATUS' });
      expect(result.success).toBe(false);
    });

    it('should validate filter with date range', () => {
      const result = pdcFilterSchema.safeParse({
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject search term exceeding max length', () => {
      const result = pdcFilterSchema.safeParse({ search: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should validate pagination parameters', () => {
      const result = pdcFilterSchema.safeParse({
        page: 2,
        size: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid pagination', () => {
      const result = pdcFilterSchema.safeParse({
        page: -1,
        size: 200,
      });
      expect(result.success).toBe(false);
    });
  });

  // =================================================================
  // DEFAULT VALUES TESTS
  // =================================================================

  describe('Default values', () => {
    it('pdcCreateDefaults should have correct initial values', () => {
      expect(pdcCreateDefaults.tenantId).toBe('');
      expect(pdcCreateDefaults.chequeNumber).toBe('');
      expect(pdcCreateDefaults.amount).toBe(0);
    });

    it('pdcBulkCreateDefaults should have empty cheques array', () => {
      expect(pdcBulkCreateDefaults.cheques).toEqual([]);
    });

    it('pdcDepositDefaults should have today date', () => {
      const today = getTodayDateString();
      expect(pdcDepositDefaults.depositDate).toBe(today);
    });

    it('pdcClearDefaults should have today date', () => {
      const today = getTodayDateString();
      expect(pdcClearDefaults.clearedDate).toBe(today);
    });

    it('pdcBounceDefaults should have today date and empty reason', () => {
      const today = getTodayDateString();
      expect(pdcBounceDefaults.bouncedDate).toBe(today);
      expect(pdcBounceDefaults.bounceReason).toBe('');
    });

    it('pdcFilterDefaults should have correct pagination', () => {
      expect(pdcFilterDefaults.page).toBe(0);
      expect(pdcFilterDefaults.size).toBe(20);
      expect(pdcFilterDefaults.sortBy).toBe('chequeDate');
      expect(pdcFilterDefaults.sortDirection).toBe('ASC');
    });
  });

  // =================================================================
  // HELPER FUNCTION TESTS
  // =================================================================

  describe('Helper Functions', () => {
    describe('isValidChequeNumber', () => {
      it('should return true for valid cheque numbers', () => {
        expect(isValidChequeNumber('CHQ-001')).toBe(true);
        expect(isValidChequeNumber('ABC123')).toBe(true);
        expect(isValidChequeNumber('1234567890')).toBe(true);
      });

      it('should return false for invalid cheque numbers', () => {
        expect(isValidChequeNumber('')).toBe(false);
        expect(isValidChequeNumber('AB')).toBe(false);
        expect(isValidChequeNumber('A'.repeat(51))).toBe(false);
        expect(isValidChequeNumber('CHQ@001')).toBe(false);
      });
    });

    describe('isValidDateString', () => {
      it('should return true for valid date strings', () => {
        expect(isValidDateString('2025-01-15')).toBe(true);
        expect(isValidDateString('2024-12-31')).toBe(true);
      });

      it('should return false for invalid date strings', () => {
        expect(isValidDateString('')).toBe(false);
        expect(isValidDateString('invalid')).toBe(false);
        expect(isValidDateString('2025-13-45')).toBe(false);
      });
    });

    describe('isFutureOrTodayDate', () => {
      it('should return true for future dates', () => {
        expect(isFutureOrTodayDate(getFutureDateString(30))).toBe(true);
      });

      it('should return true for today', () => {
        expect(isFutureOrTodayDate(getTodayDateString())).toBe(true);
      });

      it('should return false for past dates', () => {
        expect(isFutureOrTodayDate(getPastDateString(30))).toBe(false);
      });
    });

    describe('isPastOrTodayDate', () => {
      it('should return true for past dates', () => {
        expect(isPastOrTodayDate(getPastDateString(30))).toBe(true);
      });

      it('should return true for today', () => {
        expect(isPastOrTodayDate(getTodayDateString())).toBe(true);
      });

      it('should return false for future dates', () => {
        expect(isPastOrTodayDate(getFutureDateString(30))).toBe(false);
      });
    });

    describe('validateDateRange', () => {
      it('should return true for valid date range', () => {
        expect(validateDateRange('2025-01-01', '2025-01-31')).toBe(true);
      });

      it('should return true for same from and to date', () => {
        expect(validateDateRange('2025-01-15', '2025-01-15')).toBe(true);
      });

      it('should return false for invalid date range', () => {
        expect(validateDateRange('2025-01-31', '2025-01-01')).toBe(false);
      });

      it('should return true when dates are null', () => {
        expect(validateDateRange(null, null)).toBe(true);
        expect(validateDateRange('2025-01-01', null)).toBe(true);
        expect(validateDateRange(null, '2025-01-31')).toBe(true);
      });
    });

    describe('getDaysUntilDate', () => {
      it('should return positive number for future dates', () => {
        expect(getDaysUntilDate(getFutureDateString(30))).toBeGreaterThan(0);
      });

      it('should return 0 for today', () => {
        expect(getDaysUntilDate(getTodayDateString())).toBe(0);
      });

      it('should return negative number for past dates', () => {
        expect(getDaysUntilDate(getPastDateString(30))).toBeLessThan(0);
      });
    });

    describe('isWithinDueWindow', () => {
      it('should return true for dates within 7 days', () => {
        expect(isWithinDueWindow(getTodayDateString())).toBe(true);
        expect(isWithinDueWindow(getFutureDateString(3))).toBe(true);
        expect(isWithinDueWindow(getFutureDateString(7))).toBe(true);
      });

      it('should return false for dates beyond 7 days', () => {
        expect(isWithinDueWindow(getFutureDateString(8))).toBe(false);
        expect(isWithinDueWindow(getFutureDateString(30))).toBe(false);
      });

      it('should return false for past dates', () => {
        expect(isWithinDueWindow(getPastDateString(1))).toBe(false);
      });
    });

    describe('formatAmount', () => {
      it('should format amount as AED currency', () => {
        const formatted = formatAmount(5000);
        expect(formatted).toContain('5,000');
        expect(formatted).toContain('AED');
      });

      it('should handle decimal amounts', () => {
        const formatted = formatAmount(1234.56);
        expect(formatted).toContain('1,234.56');
      });
    });

    describe('calculateTotalChequeAmount', () => {
      it('should calculate total from cheque entries', () => {
        const cheques = [
          { chequeNumber: 'CHQ-001', bankName: 'ENBD', amount: 5000, chequeDate: '2025-01-01' },
          { chequeNumber: 'CHQ-002', bankName: 'ENBD', amount: 3000, chequeDate: '2025-02-01' },
        ];
        expect(calculateTotalChequeAmount(cheques)).toBe(8000);
      });

      it('should return 0 for empty array', () => {
        expect(calculateTotalChequeAmount([])).toBe(0);
      });
    });

    describe('getDefaultChequeEntry', () => {
      it('should return default cheque entry object', () => {
        const entry = getDefaultChequeEntry();
        expect(entry.chequeNumber).toBe('');
        expect(entry.bankName).toBe('');
        expect(entry.amount).toBe(0);
        expect(entry.chequeDate).toBe('');
      });
    });

    describe('generateDefaultChequeEntries', () => {
      it('should generate specified number of entries', () => {
        const entries = generateDefaultChequeEntries(3);
        expect(entries).toHaveLength(3);
        entries.forEach((entry) => {
          expect(entry.chequeNumber).toBe('');
          expect(entry.amount).toBe(0);
        });
      });
    });
  });

  // =================================================================
  // VALIDATION CONSTANTS TESTS
  // =================================================================

  describe('PDC_VALIDATION_CONSTANTS', () => {
    it('should have correct cheque number length constraints', () => {
      expect(PDC_VALIDATION_CONSTANTS.MIN_CHEQUE_NUMBER_LENGTH).toBe(3);
      expect(PDC_VALIDATION_CONSTANTS.MAX_CHEQUE_NUMBER_LENGTH).toBe(50);
    });

    it('should have correct amount constraints', () => {
      expect(PDC_VALIDATION_CONSTANTS.MIN_AMOUNT).toBe(0.01);
      expect(PDC_VALIDATION_CONSTANTS.MAX_AMOUNT).toBe(99999999.99);
    });

    it('should have correct bulk constraints', () => {
      expect(PDC_VALIDATION_CONSTANTS.MAX_CHEQUES_PER_BULK).toBe(24);
      expect(PDC_VALIDATION_CONSTANTS.MIN_CHEQUES_PER_BULK).toBe(1);
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
