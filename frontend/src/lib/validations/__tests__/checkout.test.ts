/**
 * Checkout Validation Schema Tests
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 *
 * Tests for Zod validation schemas and helper functions
 */

import {
  noticeDetailsSchema,
  inspectionScheduleSchema,
  inspectionItemSchema,
  deductionSchema,
  depositCalculationSchema,
  refundProcessingSchema,
  finalSettlementSchema,
  checkoutFilterSchema,
  validateDeductionsVsDeposit,
  validateInspectionDate,
  validateDamageCosts,
  getMinimumMoveOutDate,
  getDefaultMoveOutDate,
} from '@/lib/validations/checkout';
import {
  CheckoutReason,
  RefundMethod,
  ItemCondition,
  DeductionType,
  InspectionTimeSlot,
} from '@/types/checkout';

describe('Checkout Validation Schemas', () => {
  describe('noticeDetailsSchema', () => {
    const validNoticeData = {
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
      noticeDate: new Date(),
      expectedMoveOutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      checkoutReason: CheckoutReason.LEASE_END,
      reasonNotes: '',
    };

    it('should validate valid notice details', () => {
      const result = noticeDetailsSchema.safeParse(validNoticeData);
      expect(result.success).toBe(true);
    });

    it('should reject missing tenant ID', () => {
      const data = { ...validNoticeData, tenantId: '' };
      const result = noticeDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid tenant ID format', () => {
      const data = { ...validNoticeData, tenantId: 'invalid-uuid' };
      const result = noticeDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject future notice date', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const data = { ...validNoticeData, noticeDate: futureDate };
      const result = noticeDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be in the future');
      }
    });

    it('should reject move-out date before notice date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const data = {
        ...validNoticeData,
        noticeDate: new Date(),
        expectedMoveOutDate: yesterday,
      };
      const result = noticeDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require reason notes for OTHER checkout reason', () => {
      const data = {
        ...validNoticeData,
        checkoutReason: CheckoutReason.OTHER,
        reasonNotes: '',
      };
      const result = noticeDetailsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('reasonNotes'))).toBe(true);
      }
    });

    it('should accept reason notes for OTHER checkout reason', () => {
      const data = {
        ...validNoticeData,
        checkoutReason: CheckoutReason.OTHER,
        reasonNotes: 'Moving abroad for work',
      };
      const result = noticeDetailsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept all valid checkout reasons', () => {
      Object.values(CheckoutReason).forEach((reason) => {
        const data = {
          ...validNoticeData,
          checkoutReason: reason,
          reasonNotes: reason === CheckoutReason.OTHER ? 'Required notes' : '',
        };
        const result = noticeDetailsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('inspectionScheduleSchema', () => {
    const validInspectionData = {
      inspectionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      inspectionTimeSlot: InspectionTimeSlot.MORNING,
      inspectorId: '550e8400-e29b-41d4-a716-446655440001',
      sendNotification: true,
      preInspectionNotes: '',
    };

    it('should validate valid inspection schedule', () => {
      const result = inspectionScheduleSchema.safeParse(validInspectionData);
      expect(result.success).toBe(true);
    });

    it('should reject missing inspection date', () => {
      const data = { ...validInspectionData };
      delete (data as Record<string, unknown>).inspectionDate;
      const result = inspectionScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require specific time for SPECIFIC time slot', () => {
      const data = {
        ...validInspectionData,
        inspectionTimeSlot: InspectionTimeSlot.SPECIFIC,
        specificTime: null,
      };
      const result = inspectionScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept specific time for SPECIFIC time slot', () => {
      const data = {
        ...validInspectionData,
        inspectionTimeSlot: InspectionTimeSlot.SPECIFIC,
        specificTime: '14:30',
      };
      const result = inspectionScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', () => {
      const data = {
        ...validInspectionData,
        inspectionTimeSlot: InspectionTimeSlot.SPECIFIC,
        specificTime: '25:00', // Invalid hour
      };
      const result = inspectionScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept all valid time slots', () => {
      Object.values(InspectionTimeSlot).forEach((slot) => {
        const data = {
          ...validInspectionData,
          inspectionTimeSlot: slot,
          specificTime: slot === InspectionTimeSlot.SPECIFIC ? '10:00' : null,
        };
        const result = inspectionScheduleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('inspectionItemSchema', () => {
    const validItem = {
      name: 'living_room_walls',
      displayName: 'Walls',
      condition: ItemCondition.GOOD,
      damageDescription: '',
      repairCost: null,
    };

    it('should validate valid inspection item', () => {
      const result = inspectionItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should require damage description for DAMAGED items', () => {
      const data = {
        ...validItem,
        condition: ItemCondition.DAMAGED,
        damageDescription: '',
      };
      const result = inspectionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require repair cost for DAMAGED items', () => {
      const data = {
        ...validItem,
        condition: ItemCondition.DAMAGED,
        damageDescription: 'Large crack in wall',
        repairCost: null,
      };
      const result = inspectionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept DAMAGED items with description and cost', () => {
      const data = {
        ...validItem,
        condition: ItemCondition.DAMAGED,
        damageDescription: 'Large crack in wall',
        repairCost: 500,
      };
      const result = inspectionItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require description for MISSING items', () => {
      const data = {
        ...validItem,
        condition: ItemCondition.MISSING,
        damageDescription: '',
      };
      const result = inspectionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept all valid conditions', () => {
      Object.values(ItemCondition).forEach((condition) => {
        const data = {
          ...validItem,
          condition,
          damageDescription:
            condition === ItemCondition.DAMAGED || condition === ItemCondition.MISSING
              ? 'Description provided'
              : '',
          repairCost: condition === ItemCondition.DAMAGED ? 100 : null,
        };
        const result = inspectionItemSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('deductionSchema', () => {
    const validDeduction = {
      type: DeductionType.UNPAID_RENT,
      description: 'Rent for January 2025',
      amount: 5000,
      notes: '',
      autoCalculated: false,
    };

    it('should validate valid deduction', () => {
      const result = deductionSchema.safeParse(validDeduction);
      expect(result.success).toBe(true);
    });

    it('should reject missing description', () => {
      const data = { ...validDeduction, description: '' };
      const result = deductionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject description longer than 200 characters', () => {
      const data = { ...validDeduction, description: 'A'.repeat(201) };
      const result = deductionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const data = { ...validDeduction, amount: -100 };
      const result = deductionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept zero amount', () => {
      const data = { ...validDeduction, amount: 0 };
      const result = deductionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept all valid deduction types', () => {
      Object.values(DeductionType).forEach((type) => {
        const data = { ...validDeduction, type };
        const result = deductionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('depositCalculationSchema', () => {
    it('should validate empty deductions array', () => {
      const data = { originalDeposit: 10000, deductions: [], notes: '' };
      const result = depositCalculationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate multiple valid deductions', () => {
      const data = {
        originalDeposit: 10000,
        deductions: [
          {
            type: DeductionType.UNPAID_RENT,
            description: 'January rent',
            amount: 5000,
            notes: '',
          },
          {
            type: DeductionType.DAMAGE_REPAIRS,
            description: 'Wall repair',
            amount: 500,
            notes: 'Living room',
          },
        ],
        notes: 'Standard deductions',
      };
      const result = depositCalculationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject negative original deposit', () => {
      const data = { originalDeposit: -100, deductions: [], notes: '' };
      const result = depositCalculationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('refundProcessingSchema', () => {
    const validBankTransfer = {
      refundMethod: RefundMethod.BANK_TRANSFER,
      bankName: 'Emirates NBD',
      accountHolderName: 'Ahmed Ali',
      iban: 'AE070331234567890123456',
      swiftCode: 'EABORXXX',
      notes: '',
    };

    it('should validate valid bank transfer refund', () => {
      const result = refundProcessingSchema.safeParse(validBankTransfer);
      expect(result.success).toBe(true);
    });

    it('should require bank name for bank transfer', () => {
      const data = { ...validBankTransfer, bankName: '' };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require account holder name for bank transfer', () => {
      const data = { ...validBankTransfer, accountHolderName: '' };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require IBAN for bank transfer', () => {
      const data = { ...validBankTransfer, iban: '' };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UAE IBAN format', () => {
      const data = { ...validBankTransfer, iban: 'INVALID-IBAN' };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid UAE IBAN', () => {
      const validIbans = [
        'AE070331234567890123456',
        'AE350260001012345678901',
      ];
      validIbans.forEach((iban) => {
        const data = { ...validBankTransfer, iban };
        const result = refundProcessingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate cheque refund without bank details', () => {
      const data = {
        refundMethod: RefundMethod.CHEQUE,
        chequeNumber: 'CHK-001234',
        notes: '',
      };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require cash acknowledgement for cash refund', () => {
      const data = {
        refundMethod: RefundMethod.CASH,
        cashAcknowledged: false,
        notes: '',
      };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate cash refund with acknowledgement', () => {
      const data = {
        refundMethod: RefundMethod.CASH,
        cashAcknowledged: true,
        notes: '',
      };
      const result = refundProcessingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('finalSettlementSchema', () => {
    it('should require finalization acknowledgement', () => {
      const data = {
        settlementType: 'FULL' as const,
        settlementNotes: '',
        acknowledgeFinalization: false,
        invoiceActions: [],
      };
      const result = finalSettlementSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with finalization acknowledgement', () => {
      const data = {
        settlementType: 'FULL' as const,
        settlementNotes: '',
        acknowledgeFinalization: true,
        invoiceActions: [],
      };
      const result = finalSettlementSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate partial settlement', () => {
      const data = {
        settlementType: 'PARTIAL' as const,
        settlementNotes: 'Tenant to pay remaining balance',
        acknowledgeFinalization: true,
        invoiceActions: [],
      };
      const result = finalSettlementSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('checkoutFilterSchema', () => {
    it('should validate empty filter with defaults', () => {
      const result = checkoutFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0);
        expect(result.data.size).toBe(20);
      }
    });

    it('should validate filter with search term', () => {
      const result = checkoutFilterSchema.safeParse({ search: 'John Doe' });
      expect(result.success).toBe(true);
    });

    it('should reject search term longer than 100 characters', () => {
      const result = checkoutFilterSchema.safeParse({ search: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should validate date range filters', () => {
      const result = checkoutFilterSchema.safeParse({
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid page number', () => {
      const result = checkoutFilterSchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid page size', () => {
      const invalidSizes = [0, 101];
      invalidSizes.forEach((size) => {
        const result = checkoutFilterSchema.safeParse({ size });
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validateDeductionsVsDeposit', () => {
    it('should return null when deductions are less than deposit', () => {
      const result = validateDeductionsVsDeposit(10000, 5000);
      expect(result).toBeNull();
    });

    it('should return null when deductions equal deposit', () => {
      const result = validateDeductionsVsDeposit(10000, 10000);
      expect(result).toBeNull();
    });

    it('should return warning when deductions exceed deposit', () => {
      const result = validateDeductionsVsDeposit(10000, 12000);
      expect(result).not.toBeNull();
      expect(result).toContain('2000.00');
      expect(result).toContain('exceed');
    });
  });

  describe('validateInspectionDate', () => {
    it('should return null for valid inspection date', () => {
      const inspectionDate = new Date('2025-02-01');
      const moveOutDate = new Date('2025-02-15');
      const result = validateInspectionDate(inspectionDate, moveOutDate);
      expect(result).toBeNull();
    });

    it('should return null when inspection is on move-out date', () => {
      const date = new Date('2025-02-15');
      const result = validateInspectionDate(date, date);
      expect(result).toBeNull();
    });

    it('should return error when inspection is after move-out', () => {
      const inspectionDate = new Date('2025-02-20');
      const moveOutDate = new Date('2025-02-15');
      const result = validateInspectionDate(inspectionDate, moveOutDate);
      expect(result).not.toBeNull();
      expect(result).toContain('cannot be after');
    });
  });

  describe('validateDamageCosts', () => {
    it('should return empty array when no damaged items', () => {
      const sections = [
        {
          items: [
            { name: 'Walls', condition: ItemCondition.GOOD },
            { name: 'Floor', condition: ItemCondition.FAIR },
          ],
        },
      ];
      const result = validateDamageCosts(sections);
      expect(result).toEqual([]);
    });

    it('should return items missing repair costs', () => {
      const sections = [
        {
          items: [
            { name: 'Walls', condition: ItemCondition.DAMAGED, repairCost: null },
            { name: 'Floor', condition: ItemCondition.DAMAGED, repairCost: 500 },
            { name: 'Door', condition: ItemCondition.DAMAGED },
          ],
        },
      ];
      const result = validateDamageCosts(sections);
      expect(result).toContain('Walls');
      expect(result).toContain('Door');
      expect(result).not.toContain('Floor');
    });
  });

  describe('getMinimumMoveOutDate', () => {
    it('should return date 30 days after notice date', () => {
      const noticeDate = new Date('2025-01-15');
      const result = getMinimumMoveOutDate(noticeDate);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(14);
    });
  });

  describe('getDefaultMoveOutDate', () => {
    it('should return lease end date if in future', () => {
      const noticeDate = new Date();
      const futureLeaseEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
      const result = getDefaultMoveOutDate(noticeDate, futureLeaseEnd);
      expect(result.getTime()).toBe(futureLeaseEnd.getTime());
    });

    it('should return notice date + 30 days if lease already expired', () => {
      const noticeDate = new Date();
      const pastLeaseEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const result = getDefaultMoveOutDate(noticeDate, pastLeaseEnd);

      // Should be approximately 30 days from notice
      const expectedDate = new Date(noticeDate);
      expectedDate.setDate(expectedDate.getDate() + 30);

      expect(result.getDate()).toBe(expectedDate.getDate());
      expect(result.getMonth()).toBe(expectedDate.getMonth());
    });
  });
});
