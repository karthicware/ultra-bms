/**
 * Tenant Checkout and Deposit Refund Validation Schemas
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import {
  CheckoutReason,
  CheckoutStatus,
  RefundMethod,
  RefundStatus,
  ItemCondition,
  DeductionType,
  InspectionTimeSlot,
  isValidUaeIban
} from '@/types/checkout';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const checkoutReasonSchema = z.nativeEnum(CheckoutReason);
export const checkoutStatusSchema = z.nativeEnum(CheckoutStatus);
export const refundMethodSchema = z.nativeEnum(RefundMethod);
export const refundStatusSchema = z.nativeEnum(RefundStatus);
export const itemConditionSchema = z.nativeEnum(ItemCondition);
export const deductionTypeSchema = z.nativeEnum(DeductionType);
export const inspectionTimeSlotSchema = z.nativeEnum(InspectionTimeSlot);

// ============================================================================
// STEP 1: NOTICE DETAILS SCHEMA
// ============================================================================

/**
 * Validation schema for Step 1: Notice Details
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(noticeDetailsSchema),
 *   defaultValues: noticeDetailsDefaults
 * });
 * ```
 */
export const noticeDetailsSchema = z
  .object({
    tenantId: z
      .string()
      .uuid('Please select a valid tenant'),

    noticeDate: z
      .date({ message: 'Notice date is required' })
      .refine(
        (date) => date <= new Date(),
        { message: 'Notice date cannot be in the future' }
      ),

    expectedMoveOutDate: z
      .date({ message: 'Expected move-out date is required' }),

    checkoutReason: checkoutReasonSchema.refine(
      (val) => val !== undefined,
      { message: 'Please select a checkout reason' }
    ),

    reasonNotes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    // Move-out date must be >= notice date
    if (data.expectedMoveOutDate < data.noticeDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Move-out date must be on or after the notice date',
        path: ['expectedMoveOutDate']
      });
    }

    // Reason notes required for OTHER
    if (data.checkoutReason === CheckoutReason.OTHER && !data.reasonNotes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please provide details for "Other" checkout reason',
        path: ['reasonNotes']
      });
    }
  });

/**
 * Type inference from notice details schema
 */
export type NoticeDetailsFormData = z.infer<typeof noticeDetailsSchema>;

/**
 * Default values for notice details form
 */
export const noticeDetailsDefaults: Partial<NoticeDetailsFormData> = {
  tenantId: '',
  noticeDate: new Date(),
  reasonNotes: ''
};

// ============================================================================
// STEP 2: INSPECTION SCHEDULING SCHEMA
// ============================================================================

/**
 * Validation schema for inspection scheduling
 */
export const inspectionScheduleSchema = z
  .object({
    inspectionDate: z
      .date({ message: 'Inspection date is required' }),

    inspectionTimeSlot: inspectionTimeSlotSchema.refine(
      (val) => val !== undefined,
      { message: 'Please select an inspection time' }
    ),

    specificTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)')
      .optional()
      .nullable(),

    inspectorId: z
      .string()
      .uuid('Please select a valid inspector'),

    sendNotification: z.boolean().default(true),

    preInspectionNotes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    // Specific time required when SPECIFIC slot is selected
    if (data.inspectionTimeSlot === InspectionTimeSlot.SPECIFIC && !data.specificTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify a time',
        path: ['specificTime']
      });
    }
  });

/**
 * Type inference from inspection schedule schema
 */
export type InspectionScheduleFormData = z.infer<typeof inspectionScheduleSchema>;

/**
 * Default values for inspection schedule form
 */
export const inspectionScheduleDefaults: Partial<InspectionScheduleFormData> = {
  inspectionTimeSlot: InspectionTimeSlot.MORNING,
  sendNotification: true,
  preInspectionNotes: ''
};

// ============================================================================
// INSPECTION CHECKLIST ITEM SCHEMA
// ============================================================================

/**
 * Validation schema for individual inspection item
 */
export const inspectionItemSchema = z
  .object({
    name: z.string().min(1, 'Item name is required'),
    displayName: z.string().optional(),
    condition: itemConditionSchema,
    damageDescription: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable()
      .or(z.literal('')),
    repairCost: z
      .number()
      .min(0, 'Repair cost cannot be negative')
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    // Description required for DAMAGED or MISSING items
    if (
      (data.condition === ItemCondition.DAMAGED || data.condition === ItemCondition.MISSING) &&
      !data.damageDescription?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please describe the damage or missing item',
        path: ['damageDescription']
      });
    }

    // Repair cost required for DAMAGED items
    if (
      data.condition === ItemCondition.DAMAGED &&
      (data.repairCost === null || data.repairCost === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter estimated repair cost',
        path: ['repairCost']
      });
    }
  });

/**
 * Validation schema for inspection section
 */
export const inspectionSectionSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().optional(),
  items: z.array(inspectionItemSchema)
});

/**
 * Validation schema for complete inspection checklist
 */
export const inspectionChecklistSchema = z.object({
  sections: z.array(inspectionSectionSchema).min(1, 'At least one section is required')
});

/**
 * Type inference from inspection checklist schema
 */
export type InspectionChecklistFormData = z.infer<typeof inspectionChecklistSchema>;

/**
 * Combined inspection schema for Step 2 (scheduling + checklist + overall condition)
 */
export const inspectionSchema = z.object({
  // Scheduling
  inspectionDate: z.date({ message: 'Inspection date is required' }),
  inspectionTimeSlot: inspectionTimeSlotSchema,
  specificTime: z.string().optional().nullable(),

  // Checklist
  sections: z.array(inspectionSectionSchema),

  // Overall condition (1-10)
  overallCondition: z.number().min(1).max(10),

  // Notes
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable().or(z.literal(''))
});

/**
 * Type inference from combined inspection schema
 */
export type InspectionFormData = z.infer<typeof inspectionSchema>;

// ============================================================================
// STEP 3: DEDUCTION SCHEMA
// ============================================================================

/**
 * Validation schema for individual deduction
 */
export const deductionSchema = z.object({
  type: deductionTypeSchema,
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description cannot exceed 200 characters'),
  amount: z
    .number({ message: 'Amount is required' })
    .min(0, 'Amount cannot be negative'),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  autoCalculated: z.boolean().optional(),
  invoiceId: z.string().uuid().optional().nullable()
});

/**
 * Validation schema for deposit calculation
 */
export const depositCalculationSchema = z.object({
  originalDeposit: z
    .number({ message: 'Original deposit amount is required' })
    .min(0, 'Deposit cannot be negative'),
  deductions: z.array(deductionSchema),
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
});

/**
 * Type inference from deposit calculation schema
 */
export type DepositCalculationFormData = z.infer<typeof depositCalculationSchema>;

/**
 * Default values for deposit calculation form
 */
export const depositCalculationDefaults: DepositCalculationFormData = {
  originalDeposit: 0,
  deductions: [],
  notes: ''
};

// ============================================================================
// REFUND PROCESSING SCHEMA
// ============================================================================

/**
 * Validation schema for refund processing
 */
export const refundProcessingSchema = z
  .object({
    refundMethod: refundMethodSchema.refine(
      (val) => val !== undefined,
      { message: 'Please select a refund method' }
    ),

    refundDate: z
      .date({ message: 'Please enter a valid date' })
      .optional()
      .nullable(),

    // Bank transfer fields
    bankName: z
      .string()
      .min(2, 'Bank name must be at least 2 characters')
      .max(100, 'Bank name cannot exceed 100 characters')
      .optional()
      .nullable()
      .or(z.literal('')),

    accountHolderName: z
      .string()
      .min(2, 'Account holder name must be at least 2 characters')
      .max(200, 'Account holder name cannot exceed 200 characters')
      .optional()
      .nullable()
      .or(z.literal('')),

    iban: z
      .string()
      .optional()
      .nullable()
      .or(z.literal('')),

    swiftCode: z
      .string()
      .max(11, 'SWIFT/BIC code cannot exceed 11 characters')
      .optional()
      .nullable()
      .or(z.literal('')),

    // Cheque fields
    chequeNumber: z
      .string()
      .max(50, 'Cheque number cannot exceed 50 characters')
      .optional()
      .nullable()
      .or(z.literal('')),

    chequeDate: z
      .date({ message: 'Please enter a valid date' })
      .optional()
      .nullable(),

    // Cash fields
    cashAcknowledged: z.boolean().optional().default(false),

    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    if (data.refundMethod === RefundMethod.BANK_TRANSFER) {
      // Bank name required
      if (!data.bankName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bank name is required for bank transfer',
          path: ['bankName']
        });
      }

      // Account holder name required
      if (!data.accountHolderName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account holder name is required for bank transfer',
          path: ['accountHolderName']
        });
      }

      // IBAN required and must be valid UAE format
      if (!data.iban?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'IBAN is required for bank transfer',
          path: ['iban']
        });
      } else if (!isValidUaeIban(data.iban)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter a valid UAE IBAN (AE + 21 characters)',
          path: ['iban']
        });
      }
    }

    if (data.refundMethod === RefundMethod.CHEQUE) {
      // Cheque number recommended but not required
      // No additional validation needed
    }

    if (data.refundMethod === RefundMethod.CASH) {
      // Cash acknowledgment required
      if (!data.cashAcknowledged) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please acknowledge cash receipt',
          path: ['cashAcknowledged']
        });
      }
    }
  });

/**
 * Type inference from refund processing schema
 */
export type RefundProcessingFormData = z.infer<typeof refundProcessingSchema>;

/**
 * Default values for refund processing form
 */
export const refundProcessingDefaults: Partial<RefundProcessingFormData> = {
  refundMethod: RefundMethod.BANK_TRANSFER,
  refundDate: new Date(),
  bankName: '',
  accountHolderName: '',
  iban: '',
  swiftCode: '',
  chequeNumber: '',
  cashAcknowledged: false,
  notes: ''
};

// ============================================================================
// STEP 4: FINAL SETTLEMENT SCHEMA
// ============================================================================

/**
 * Validation schema for invoice action
 */
export const invoiceActionSchema = z
  .object({
    invoiceId: z.string().uuid(),
    action: z.enum(['PAY', 'WRITE_OFF', 'DEDUCT_FROM_DEPOSIT']),
    writeOffReason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional()
      .nullable()
      .or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    if (data.action === 'WRITE_OFF' && !data.writeOffReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please provide a reason for write-off',
        path: ['writeOffReason']
      });
    }
  });

/**
 * Validation schema for final settlement
 */
export const finalSettlementSchema = z.object({
  settlementType: z.enum(['FULL', 'PARTIAL']),

  settlementNotes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  acknowledgeFinalization: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must acknowledge that this checkout is final'
    }),

  invoiceActions: z.array(invoiceActionSchema).optional(),

  // Refund processing fields (optional - only needed if there's a refund)
  refundMethod: refundMethodSchema.optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.date().optional(),
  cashAcknowledged: z.boolean().optional()
});

/**
 * Type inference from final settlement schema
 */
export type FinalSettlementFormData = z.infer<typeof finalSettlementSchema>;

/**
 * Default values for final settlement form
 */
export const finalSettlementDefaults: Partial<FinalSettlementFormData> = {
  settlementType: 'FULL',
  settlementNotes: '',
  acknowledgeFinalization: false,
  invoiceActions: []
};

// ============================================================================
// FILTER SCHEMA
// ============================================================================

/**
 * Validation schema for checkout filters
 */
export const checkoutFilterSchema = z.object({
  status: checkoutStatusSchema.optional(),

  refundStatus: refundStatusSchema.optional(),

  propertyId: z.string().uuid().optional().or(z.literal('')),

  fromDate: z.string().optional().or(z.literal('')),

  toDate: z.string().optional().or(z.literal('')),

  search: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),

  page: z.number().int().min(0).optional().default(0),

  size: z.number().int().min(1).max(100).optional().default(20)
});

/**
 * Type inference from filter schema
 */
export type CheckoutFilterFormData = z.infer<typeof checkoutFilterSchema>;

/**
 * Default values for checkout filter form
 */
export const checkoutFilterDefaults: CheckoutFilterFormData = {
  propertyId: '',
  fromDate: '',
  toDate: '',
  search: '',
  page: 0,
  size: 20
};

// ============================================================================
// COMPLETE CHECKOUT WIZARD SCHEMA (Combined)
// ============================================================================

/**
 * Combined validation schema for entire checkout wizard
 * Use individual step schemas for per-step validation
 */
export const checkoutWizardSchema = z.object({
  noticeDetails: noticeDetailsSchema,
  inspection: inspectionScheduleSchema,
  inspectionChecklist: inspectionChecklistSchema,
  depositCalculation: depositCalculationSchema,
  refundDetails: refundProcessingSchema,
  finalSettlement: finalSettlementSchema
});

/**
 * Type inference from wizard schema
 */
export type CheckoutWizardFormData = z.infer<typeof checkoutWizardSchema>;

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that total deductions don't exceed deposit
 * Returns warning (not error) if exceeded
 *
 * @param originalDeposit - Original security deposit amount
 * @param totalDeductions - Sum of all deductions
 * @returns Warning message if deductions exceed deposit, null otherwise
 */
export function validateDeductionsVsDeposit(
  originalDeposit: number,
  totalDeductions: number
): string | null {
  if (totalDeductions > originalDeposit) {
    const excess = totalDeductions - originalDeposit;
    return `Total deductions exceed security deposit by AED ${excess.toFixed(2)}. Tenant will owe this amount.`;
  }
  return null;
}

/**
 * Validate inspection date against move-out date
 *
 * @param inspectionDate - Scheduled inspection date
 * @param moveOutDate - Expected move-out date
 * @returns Error message if invalid, null if valid
 */
export function validateInspectionDate(
  inspectionDate: Date,
  moveOutDate: Date
): string | null {
  if (inspectionDate > moveOutDate) {
    return 'Inspection date cannot be after the move-out date';
  }
  return null;
}

/**
 * Validate that all damaged/missing items have costs
 *
 * @param sections - Inspection checklist sections
 * @returns List of items missing repair costs
 */
export function validateDamageCosts(
  sections: { items: { name: string; condition: ItemCondition; repairCost?: number | null }[] }[]
): string[] {
  const missingCosts: string[] = [];

  sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.condition === ItemCondition.DAMAGED && !item.repairCost) {
        missingCosts.push(item.name);
      }
    });
  });

  return missingCosts;
}

/**
 * Calculate minimum allowed move-out date (notice date + 30 days)
 *
 * @param noticeDate - Date tenant gave notice
 * @returns Minimum move-out date
 */
export function getMinimumMoveOutDate(noticeDate: Date): Date {
  const minDate = new Date(noticeDate);
  minDate.setDate(minDate.getDate() + 30);
  return minDate;
}

/**
 * Generate default move-out date
 * Uses lease end date if in future, otherwise notice date + 30 days
 *
 * @param noticeDate - Date tenant gave notice
 * @param leaseEndDate - Tenant's lease end date
 * @returns Suggested move-out date
 */
export function getDefaultMoveOutDate(noticeDate: Date, leaseEndDate: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If lease end date is in the future, use it
  if (leaseEndDate > today) {
    return leaseEndDate;
  }

  // Otherwise use notice date + 30 days
  const defaultDate = new Date(noticeDate);
  defaultDate.setDate(defaultDate.getDate() + 30);
  return defaultDate;
}
