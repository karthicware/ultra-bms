/**
 * Expense Validation Schema Tests
 * Story 6.2: Expense Management and Vendor Payments
 *
 * Tests for Zod validation schemas for expense forms
 */

import {
  expenseCreateSchema,
  expenseUpdateSchema,
  expensePaySchema,
  batchPaymentSchema,
  expenseFilterSchema,
  expenseCreateDefaults,
} from '@/lib/validations/expense';
import { ExpenseCategory, PaymentStatus } from '@/types/expense';
import { PaymentMethod } from '@/types/tenant';

describe('Expense Validation Schema', () => {
  describe('expenseCreateSchema', () => {
    const validExpenseData = {
      category: ExpenseCategory.MAINTENANCE,
      amount: 1500.50,
      expenseDate: '2025-01-15',
      description: 'Plumbing repair for unit 101',
      propertyId: '123e4567-e89b-12d3-a456-426614174000',
      vendorId: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('should validate a complete expense with all fields', () => {
      const result = expenseCreateSchema.safeParse(validExpenseData);
      expect(result.success).toBe(true);
    });

    it('should validate an expense with minimal required fields', () => {
      const minimalData = {
        category: ExpenseCategory.UTILITIES,
        amount: 500,
        expenseDate: '2025-01-15',
        description: 'Monthly electricity bill',
      };

      const result = expenseCreateSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('category validation', () => {
      it('should reject undefined category', () => {
        const data = { ...validExpenseData, category: undefined };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept all valid expense categories', () => {
        const categories = Object.values(ExpenseCategory);
        categories.forEach((category) => {
          const data = { ...validExpenseData, category };
          const result = expenseCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('amount validation', () => {
      it('should reject zero amount', () => {
        const data = { ...validExpenseData, amount: 0 };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('greater than 0');
        }
      });

      it('should reject negative amount', () => {
        const data = { ...validExpenseData, amount: -100 };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject amount exceeding maximum', () => {
        const data = { ...validExpenseData, amount: 10000000 };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid positive amounts', () => {
        const validAmounts = [0.01, 100, 1500.50, 9999999.99];
        validAmounts.forEach((amount) => {
          const data = { ...validExpenseData, amount };
          const result = expenseCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('expenseDate validation', () => {
      it('should reject empty expense date', () => {
        const data = { ...validExpenseData, expenseDate: '' };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid date format', () => {
        // Date strings are validated as parseable dates
        const invalidDates = ['invalid', 'not-a-date'];
        invalidDates.forEach((expenseDate) => {
          const data = { ...validExpenseData, expenseDate };
          const result = expenseCreateSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it('should accept valid ISO date strings', () => {
        const validDates = ['2025-01-15', '2024-12-31', '2025-06-01'];
        validDates.forEach((expenseDate) => {
          const data = { ...validExpenseData, expenseDate };
          const result = expenseCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('description validation', () => {
      it('should reject empty description', () => {
        const data = { ...validExpenseData, description: '' };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject description exceeding max length', () => {
        const data = { ...validExpenseData, description: 'A'.repeat(501) };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept valid description', () => {
        const data = { ...validExpenseData, description: 'Valid expense description' };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('optional fields validation', () => {
      it('should accept expense without propertyId', () => {
        const { propertyId, ...dataWithoutProperty } = validExpenseData;
        const result = expenseCreateSchema.safeParse(dataWithoutProperty);
        expect(result.success).toBe(true);
      });

      it('should accept expense without vendorId', () => {
        const { vendorId, ...dataWithoutVendor } = validExpenseData;
        const result = expenseCreateSchema.safeParse(dataWithoutVendor);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID for propertyId', () => {
        const data = { ...validExpenseData, propertyId: 'invalid-uuid' };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject invalid UUID for vendorId', () => {
        const data = { ...validExpenseData, vendorId: 'invalid-uuid' };
        const result = expenseCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('expensePaySchema', () => {
    const validPayData = {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: '2025-01-20',
      transactionReference: 'TXN-12345',
    };

    it('should validate complete payment data', () => {
      const result = expensePaySchema.safeParse(validPayData);
      expect(result.success).toBe(true);
    });

    it('should validate payment without transaction reference', () => {
      const { transactionReference, ...dataWithoutRef } = validPayData;
      const result = expensePaySchema.safeParse(dataWithoutRef);
      expect(result.success).toBe(true);
    });

    it('should accept all valid payment methods', () => {
      const methods = Object.values(PaymentMethod);
      methods.forEach((paymentMethod) => {
        const data = { ...validPayData, paymentMethod };
        const result = expensePaySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject transaction reference exceeding max length', () => {
      const data = { ...validPayData, transactionReference: 'A'.repeat(101) };
      const result = expensePaySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('batchPaymentSchema', () => {
    const validBatchData = {
      expenseIds: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: '2025-01-20',
      transactionReference: 'BATCH-TXN-001',
    };

    it('should validate complete batch payment data', () => {
      const result = batchPaymentSchema.safeParse(validBatchData);
      expect(result.success).toBe(true);
    });

    it('should reject empty expense IDs array', () => {
      const data = { ...validBatchData, expenseIds: [] };
      const result = batchPaymentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one expense');
      }
    });

    it('should reject invalid UUIDs in expense IDs', () => {
      const data = { ...validBatchData, expenseIds: ['invalid-uuid'] };
      const result = batchPaymentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept batch payment without transaction reference', () => {
      const { transactionReference, ...dataWithoutRef } = validBatchData;
      const result = batchPaymentSchema.safeParse(dataWithoutRef);
      expect(result.success).toBe(true);
    });
  });

  describe('expenseFilterSchema', () => {
    it('should validate empty filter (all defaults)', () => {
      const result = expenseFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate filter with search term', () => {
      const result = expenseFilterSchema.safeParse({ search: 'plumbing' });
      expect(result.success).toBe(true);
    });

    it('should validate filter with category', () => {
      const result = expenseFilterSchema.safeParse({
        category: ExpenseCategory.MAINTENANCE
      });
      expect(result.success).toBe(true);
    });

    it('should validate filter with payment status', () => {
      const result = expenseFilterSchema.safeParse({
        paymentStatus: PaymentStatus.PENDING
      });
      expect(result.success).toBe(true);
    });

    it('should validate filter with date range', () => {
      const result = expenseFilterSchema.safeParse({
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      });
      expect(result.success).toBe(true);
    });

    it('should validate filter with date range (reverse order accepted)', () => {
      // Note: Filter schema accepts any date range, validation of range is handled elsewhere
      const result = expenseFilterSchema.safeParse({
        fromDate: '2025-01-31',
        toDate: '2025-01-01',
      });
      // Basic schema validation passes, business logic validates range
      expect(result.success).toBe(true);
    });

    it('should reject search term exceeding max length', () => {
      const result = expenseFilterSchema.safeParse({
        search: 'A'.repeat(101)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('expenseCreateDefaults', () => {
    it('should have valid default values', () => {
      expect(expenseCreateDefaults.amount).toBe(0);
      expect(expenseCreateDefaults.description).toBe('');
      expect(expenseCreateDefaults.expenseDate).toBeTruthy();
    });

    it('should have expenseDate set to today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(expenseCreateDefaults.expenseDate).toBe(today);
    });
  });
});
