/**
 * Lease Extension and Renewal Validation Tests
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #16)
 */

import {
  leaseExtensionSchema,
  renewalRequestSchema,
  rejectionSchema,
  calculateNewRent,
  calculateRentAdjustmentPercentage,
  getDaysUntilExpiry,
  getExpiryUrgencyLevel,
  getDefaultNewEndDate,
  calculateLeaseDuration,
  leaseExtensionFormDefaults,
  renewalRequestFormDefaults,
} from '../lease';
import { RentAdjustmentType } from '@/types/lease';

describe('Lease Extension Schema', () => {
  describe('newEndDate validation', () => {
    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = leaseExtensionSchema.safeParse({
        ...leaseExtensionFormDefaults,
        newEndDate: pastDate,
        rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('future');
      }
    });

    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        ...leaseExtensionFormDefaults,
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('rent adjustment type validation', () => {
    it('should require percentageIncrease when type is PERCENTAGE', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.PERCENTAGE,
        percentageIncrease: null,
        autoRenewal: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('percentageIncrease'))).toBe(true);
      }
    });

    it('should accept valid percentage increase', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.PERCENTAGE,
        percentageIncrease: 5,
        autoRenewal: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject percentage greater than 100', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.PERCENTAGE,
        percentageIncrease: 150,
        autoRenewal: false,
      });

      expect(result.success).toBe(false);
    });

    it('should require flatIncrease when type is FLAT', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.FLAT,
        flatIncrease: null,
        autoRenewal: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('flatIncrease'))).toBe(true);
      }
    });

    it('should require customRent when type is CUSTOM', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.CUSTOM,
        customRent: null,
        autoRenewal: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('customRent'))).toBe(true);
      }
    });

    it('should not require additional fields for NO_CHANGE', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
        autoRenewal: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('payment due date validation', () => {
    it('should accept valid payment due dates (1-28)', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      for (const day of [1, 15, 28]) {
        const result = leaseExtensionSchema.safeParse({
          newEndDate: futureDate,
          rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
          paymentDueDate: day,
          autoRenewal: false,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject payment due dates outside 1-28', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      for (const day of [0, 29, 31]) {
        const result = leaseExtensionSchema.safeParse({
          newEndDate: futureDate,
          rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
          paymentDueDate: day,
          autoRenewal: false,
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('special terms validation', () => {
    it('should accept empty special terms', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
        specialTerms: '',
        autoRenewal: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject special terms over 2000 characters', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = leaseExtensionSchema.safeParse({
        newEndDate: futureDate,
        rentAdjustmentType: RentAdjustmentType.NO_CHANGE,
        specialTerms: 'a'.repeat(2001),
        autoRenewal: false,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Renewal Request Schema', () => {
  it('should accept valid renewal request', () => {
    const result = renewalRequestSchema.safeParse({
      preferredTerm: '12_MONTHS',
      comments: 'I would like to renew my lease',
    });

    expect(result.success).toBe(true);
  });

  it('should require preferred term', () => {
    const result = renewalRequestSchema.safeParse({
      preferredTerm: '',
      comments: 'Some comment',
    });

    expect(result.success).toBe(false);
  });

  it('should accept all valid term options', () => {
    for (const term of ['12_MONTHS', '24_MONTHS', 'OTHER']) {
      const result = renewalRequestSchema.safeParse({
        preferredTerm: term,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid term options', () => {
    const result = renewalRequestSchema.safeParse({
      preferredTerm: 'INVALID_TERM',
    });

    expect(result.success).toBe(false);
  });

  it('should reject comments over 500 characters', () => {
    const result = renewalRequestSchema.safeParse({
      preferredTerm: '12_MONTHS',
      comments: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });
});

describe('Rejection Schema', () => {
  it('should require minimum 10 characters', () => {
    const result = rejectionSchema.safeParse({
      reason: 'Too short',
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid rejection reason', () => {
    const result = rejectionSchema.safeParse({
      reason: 'The property is being renovated and will not be available for renewal.',
    });

    expect(result.success).toBe(true);
  });

  it('should reject reason over 500 characters', () => {
    const result = rejectionSchema.safeParse({
      reason: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });
});

describe('calculateNewRent', () => {
  const currentRent = 5000;

  it('should return same rent for NO_CHANGE', () => {
    const result = calculateNewRent(currentRent, RentAdjustmentType.NO_CHANGE, 0);
    expect(result).toBe(5000);
  });

  it('should calculate percentage increase correctly', () => {
    const result = calculateNewRent(currentRent, RentAdjustmentType.PERCENTAGE, 10);
    expect(result).toBe(5500);
  });

  it('should calculate flat increase correctly', () => {
    const result = calculateNewRent(currentRent, RentAdjustmentType.FLAT, 500);
    expect(result).toBe(5500);
  });

  it('should return custom rent value', () => {
    const result = calculateNewRent(currentRent, RentAdjustmentType.CUSTOM, 6000);
    expect(result).toBe(6000);
  });

  it('should handle 0% increase', () => {
    const result = calculateNewRent(currentRent, RentAdjustmentType.PERCENTAGE, 0);
    expect(result).toBe(5000);
  });
});

describe('calculateRentAdjustmentPercentage', () => {
  it('should calculate increase percentage', () => {
    const result = calculateRentAdjustmentPercentage(5000, 5500);
    expect(result).toBe(10);
  });

  it('should calculate decrease percentage', () => {
    const result = calculateRentAdjustmentPercentage(5000, 4500);
    expect(result).toBe(-10);
  });

  it('should return 0 when no change', () => {
    const result = calculateRentAdjustmentPercentage(5000, 5000);
    expect(result).toBe(0);
  });

  it('should handle zero previous rent', () => {
    const result = calculateRentAdjustmentPercentage(0, 5000);
    expect(result).toBe(0);
  });
});

describe('getDaysUntilExpiry', () => {
  it('should calculate positive days for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const result = getDaysUntilExpiry(futureDate);
    expect(result).toBeGreaterThanOrEqual(29);
    expect(result).toBeLessThanOrEqual(31);
  });

  it('should calculate negative days for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const result = getDaysUntilExpiry(pastDate);
    expect(result).toBeLessThan(0);
  });

  it('should handle string dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const result = getDaysUntilExpiry(futureDate.toISOString());
    expect(result).toBeGreaterThanOrEqual(29);
    expect(result).toBeLessThanOrEqual(31);
  });
});

describe('getExpiryUrgencyLevel', () => {
  it('should return critical for 14 days or less', () => {
    expect(getExpiryUrgencyLevel(0)).toBe('critical');
    expect(getExpiryUrgencyLevel(7)).toBe('critical');
    expect(getExpiryUrgencyLevel(14)).toBe('critical');
  });

  it('should return urgent for 15-30 days', () => {
    expect(getExpiryUrgencyLevel(15)).toBe('urgent');
    expect(getExpiryUrgencyLevel(25)).toBe('urgent');
    expect(getExpiryUrgencyLevel(30)).toBe('urgent');
  });

  it('should return warning for 31-60 days', () => {
    expect(getExpiryUrgencyLevel(31)).toBe('warning');
    expect(getExpiryUrgencyLevel(45)).toBe('warning');
    expect(getExpiryUrgencyLevel(60)).toBe('warning');
  });

  it('should return normal for more than 60 days', () => {
    expect(getExpiryUrgencyLevel(61)).toBe('normal');
    expect(getExpiryUrgencyLevel(90)).toBe('normal');
    expect(getExpiryUrgencyLevel(365)).toBe('normal');
  });
});

describe('getDefaultNewEndDate', () => {
  it('should return date 12 months from current end date', () => {
    const currentEnd = new Date('2025-06-30');
    const result = getDefaultNewEndDate(currentEnd);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(result.getDate()).toBe(30);
  });

  it('should handle string dates', () => {
    const result = getDefaultNewEndDate('2025-12-31');

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(31);
  });
});

describe('calculateLeaseDuration', () => {
  it('should calculate months between dates', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2026-01-01');

    const result = calculateLeaseDuration(start, end);
    expect(result).toBe(12);
  });

  it('should handle partial months', () => {
    const start = new Date('2025-01-15');
    const end = new Date('2025-07-15');

    const result = calculateLeaseDuration(start, end);
    expect(result).toBe(6);
  });

  it('should return 0 for same date', () => {
    const date = new Date('2025-01-01');

    const result = calculateLeaseDuration(date, date);
    expect(result).toBe(0);
  });

  it('should return 0 for negative duration', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2025-01-01');

    const result = calculateLeaseDuration(start, end);
    expect(result).toBe(0);
  });
});

describe('Form Defaults', () => {
  it('should have correct lease extension defaults', () => {
    expect(leaseExtensionFormDefaults.rentAdjustmentType).toBe(RentAdjustmentType.NO_CHANGE);
    expect(leaseExtensionFormDefaults.autoRenewal).toBe(false);
    expect(leaseExtensionFormDefaults.percentageIncrease).toBeNull();
    expect(leaseExtensionFormDefaults.flatIncrease).toBeNull();
    expect(leaseExtensionFormDefaults.customRent).toBeNull();
  });

  it('should have correct renewal request defaults', () => {
    expect(renewalRequestFormDefaults.preferredTerm).toBe('12_MONTHS');
    expect(renewalRequestFormDefaults.comments).toBe('');
  });
});
