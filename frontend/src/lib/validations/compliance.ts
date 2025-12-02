/**
 * Compliance Validation Schemas
 * Story 7.3: Compliance and Inspection Tracking
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import {
  ComplianceCategory,
  ComplianceFrequency,
  ComplianceScheduleStatus,
  InspectionStatus,
  InspectionResult,
  FineStatus,
  RequirementStatus
} from '@/types/compliance';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum length constants per AC definitions
 */
export const MAX_REQUIREMENT_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_AUTHORITY_AGENCY_LENGTH = 200;
export const MAX_PENALTY_DESCRIPTION_LENGTH = 500;
export const MAX_INSPECTOR_NAME_LENGTH = 200;
export const MAX_NOTES_LENGTH = 1000;
export const MAX_ISSUES_FOUND_LENGTH = 1000;
export const MAX_RECOMMENDATIONS_LENGTH = 1000;
export const MAX_VIOLATION_DESCRIPTION_LENGTH = 1000;

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const complianceCategorySchema = z.nativeEnum(ComplianceCategory);
export const complianceFrequencySchema = z.nativeEnum(ComplianceFrequency);
export const complianceScheduleStatusSchema = z.nativeEnum(ComplianceScheduleStatus);
export const inspectionStatusSchema = z.nativeEnum(InspectionStatus);
export const inspectionResultSchema = z.nativeEnum(InspectionResult);
export const fineStatusSchema = z.nativeEnum(FineStatus);
export const requirementStatusSchema = z.nativeEnum(RequirementStatus);

// ============================================================================
// UUID SCHEMA
// ============================================================================

/**
 * UUID validation regex
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const uuidSchema = z.string().regex(UUID_REGEX, 'Invalid UUID format');

export const optionalUuidSchema = z.string().regex(UUID_REGEX, 'Invalid UUID format').optional().or(z.literal(''));

// ============================================================================
// DATE SCHEMAS
// ============================================================================

/**
 * ISO 8601 date string validation
 */
export const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

/**
 * Optional date string
 */
export const optionalDateStringSchema = z.string()
  .refine((val) => val === '' || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
  .optional()
  .or(z.literal(''));

/**
 * Future date validation (for scheduled inspections)
 * Uses date string comparison to avoid timezone issues
 */
export const futureDateSchema = z.string().refine(
  (val) => {
    if (!val || isNaN(Date.parse(val))) return false;
    // Compare date strings directly to avoid timezone issues
    const todayStr = new Date().toISOString().split('T')[0];
    const valStr = val.split('T')[0]; // Handle both "YYYY-MM-DD" and ISO datetime
    return valStr >= todayStr;
  },
  { message: 'Date must be today or in the future' }
);

/**
 * Past or today date validation (for completed dates)
 */
export const pastOrTodayDateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return !isNaN(date.getTime()) && date < tomorrow;
  },
  { message: 'Date cannot be in the future' }
);

// ============================================================================
// COMPLIANCE REQUIREMENT SCHEMAS
// ============================================================================

/**
 * Validation schema for creating/updating compliance requirement
 * AC #33: Form validation
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(complianceRequirementSchema),
 *   defaultValues: complianceRequirementFormDefaults
 * });
 * ```
 */
export const complianceRequirementSchema = z.object({
  requirementName: z
    .string()
    .min(1, 'Requirement name is required')
    .max(MAX_REQUIREMENT_NAME_LENGTH, `Requirement name must be less than ${MAX_REQUIREMENT_NAME_LENGTH} characters`)
    .trim(),

  category: complianceCategorySchema.refine((val) => val !== undefined, {
    message: 'Category is required'
  }),

  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`)
    .optional()
    .or(z.literal('')),

  applicableProperties: z
    .array(uuidSchema)
    .optional()
    .nullable()
    .transform((val) => (val?.length === 0 ? null : val)), // null = all properties

  allProperties: z.boolean().default(false), // UI checkbox for "All Properties"

  frequency: complianceFrequencySchema.refine((val) => val !== undefined, {
    message: 'Frequency is required'
  }),

  authorityAgency: z
    .string()
    .max(MAX_AUTHORITY_AGENCY_LENGTH, `Authority/Agency must be less than ${MAX_AUTHORITY_AGENCY_LENGTH} characters`)
    .optional()
    .or(z.literal('')),

  penaltyDescription: z
    .string()
    .max(MAX_PENALTY_DESCRIPTION_LENGTH, `Penalty description must be less than ${MAX_PENALTY_DESCRIPTION_LENGTH} characters`)
    .optional()
    .or(z.literal('')),

  status: requirementStatusSchema.default(RequirementStatus.ACTIVE)
});

/**
 * Type inference from compliance requirement schema
 */
export type ComplianceRequirementFormData = z.output<typeof complianceRequirementSchema>;

/**
 * Input type for compliance requirement schema
 */
export type ComplianceRequirementFormInput = z.input<typeof complianceRequirementSchema>;

/**
 * Default values for compliance requirement form
 */
export const complianceRequirementFormDefaults: ComplianceRequirementFormInput = {
  requirementName: '',
  category: ComplianceCategory.SAFETY,
  description: '',
  applicableProperties: null,
  allProperties: true,
  frequency: ComplianceFrequency.ANNUALLY,
  authorityAgency: '',
  penaltyDescription: '',
  status: RequirementStatus.ACTIVE
};

// ============================================================================
// COMPLIANCE SCHEDULE COMPLETE SCHEMA
// ============================================================================

/**
 * Validation schema for marking schedule complete
 * AC #34: Mark Complete Dialog validation
 */
export const complianceScheduleCompleteSchema = z.object({
  completedDate: z
    .string()
    .min(1, 'Completed date is required')
    .refine(
      (val) => {
        const date = new Date(val);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return !isNaN(date.getTime()) && date < tomorrow;
      },
      { message: 'Completed date cannot be in the future' }
    ),

  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be less than ${MAX_NOTES_LENGTH} characters`)
    .optional()
    .or(z.literal(''))
});

/**
 * Type inference from schedule complete schema
 */
export type ComplianceScheduleCompleteFormData = z.output<typeof complianceScheduleCompleteSchema>;

/**
 * Default values for schedule complete form
 */
export const complianceScheduleCompleteFormDefaults: ComplianceScheduleCompleteFormData = {
  completedDate: new Date().toISOString().split('T')[0],
  notes: ''
};

// ============================================================================
// INSPECTION SCHEMAS
// ============================================================================

/**
 * Validation schema for scheduling an inspection
 * AC #35: Schedule Inspection Dialog validation
 */
export const inspectionCreateSchema = z.object({
  complianceScheduleId: uuidSchema,

  propertyId: uuidSchema,

  inspectorName: z
    .string()
    .min(1, 'Inspector name is required')
    .max(MAX_INSPECTOR_NAME_LENGTH, `Inspector name must be less than ${MAX_INSPECTOR_NAME_LENGTH} characters`)
    .trim(),

  scheduledDate: z
    .string()
    .min(1, 'Scheduled date is required')
    .refine(
      (val) => {
        if (!val || isNaN(Date.parse(val))) return false;
        // Compare date strings directly to avoid timezone issues
        const todayStr = new Date().toISOString().split('T')[0];
        const valStr = val.split('T')[0];
        return valStr >= todayStr;
      },
      { message: 'Scheduled date must be today or in the future' }
    )
});

/**
 * Type inference from inspection create schema
 */
export type InspectionCreateFormData = z.output<typeof inspectionCreateSchema>;

/**
 * Default values for inspection create form
 */
export const inspectionCreateFormDefaults = (
  complianceScheduleId: string,
  propertyId: string
): InspectionCreateFormData => ({
  complianceScheduleId,
  propertyId,
  inspectorName: '',
  scheduledDate: new Date().toISOString().split('T')[0]
});

/**
 * Validation schema for updating inspection results
 * AC #36: Inspection Results Form validation
 */
export const inspectionResultsSchema = z.object({
  inspectionDate: z
    .string()
    .min(1, 'Inspection date is required')
    .refine(
      (val) => {
        const date = new Date(val);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return !isNaN(date.getTime()) && date < tomorrow;
      },
      { message: 'Inspection date cannot be in the future' }
    ),

  status: inspectionStatusSchema.refine((val) => val !== undefined, {
    message: 'Status is required'
  }),

  result: inspectionResultSchema.optional().nullable(),

  issuesFound: z
    .string()
    .max(MAX_ISSUES_FOUND_LENGTH, `Issues found must be less than ${MAX_ISSUES_FOUND_LENGTH} characters`)
    .optional()
    .or(z.literal('')),

  recommendations: z
    .string()
    .max(MAX_RECOMMENDATIONS_LENGTH, `Recommendations must be less than ${MAX_RECOMMENDATIONS_LENGTH} characters`)
    .optional()
    .or(z.literal('')),

  nextInspectionDate: optionalDateStringSchema
}).superRefine((data, ctx) => {
  // Result is required when status is PASSED, FAILED, or CANCELLED (completed states)
  const completedStatuses = [InspectionStatus.PASSED, InspectionStatus.FAILED];
  if (completedStatuses.includes(data.status) && !data.result) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Result is required when inspection is completed',
      path: ['result']
    });
  }

  // Issues found required when result is FAILED or PARTIAL_PASS
  const failedResults = [InspectionResult.FAILED, InspectionResult.PARTIAL_PASS];
  if (data.result && failedResults.includes(data.result) && (!data.issuesFound || data.issuesFound.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Issues found is required when inspection failed or partially passed',
      path: ['issuesFound']
    });
  }
});

/**
 * Type inference from inspection results schema
 */
export type InspectionResultsFormData = z.output<typeof inspectionResultsSchema>;

/**
 * Default values for inspection results form
 */
export const inspectionResultsFormDefaults: InspectionResultsFormData = {
  inspectionDate: new Date().toISOString().split('T')[0],
  status: InspectionStatus.IN_PROGRESS,
  result: null,
  issuesFound: '',
  recommendations: '',
  nextInspectionDate: ''
};

// ============================================================================
// VIOLATION SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a violation
 * AC #38: Record Violation Dialog validation
 */
export const violationCreateSchema = z.object({
  complianceScheduleId: uuidSchema,

  violationDate: z
    .string()
    .min(1, 'Violation date is required')
    .refine(
      (val) => {
        const date = new Date(val);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return !isNaN(date.getTime()) && date < tomorrow;
      },
      { message: 'Violation date cannot be in the future' }
    ),

  description: z
    .string()
    .min(1, 'Description is required')
    .max(MAX_VIOLATION_DESCRIPTION_LENGTH, `Description must be less than ${MAX_VIOLATION_DESCRIPTION_LENGTH} characters`)
    .trim(),

  fineAmount: z
    .number({ message: 'Fine amount must be a number' })
    .min(0, 'Fine amount must be 0 or greater')
    .optional()
    .nullable(),

  fineStatus: fineStatusSchema.default(FineStatus.PENDING),

  createRemediationWorkOrder: z.boolean().default(false)
});

/**
 * Type inference from violation create schema
 */
export type ViolationCreateFormData = z.output<typeof violationCreateSchema>;

/**
 * Default values for violation create form
 */
export const violationCreateFormDefaults = (complianceScheduleId: string): ViolationCreateFormData => ({
  complianceScheduleId,
  violationDate: new Date().toISOString().split('T')[0],
  description: '',
  fineAmount: null,
  fineStatus: FineStatus.PENDING,
  createRemediationWorkOrder: false
});

/**
 * Validation schema for updating a violation
 */
export const violationUpdateSchema = z.object({
  description: z
    .string()
    .max(MAX_VIOLATION_DESCRIPTION_LENGTH, `Description must be less than ${MAX_VIOLATION_DESCRIPTION_LENGTH} characters`)
    .optional(),

  fineAmount: z
    .number({ message: 'Fine amount must be a number' })
    .min(0, 'Fine amount must be 0 or greater')
    .optional()
    .nullable(),

  fineStatus: fineStatusSchema.optional(),

  resolutionDate: optionalDateStringSchema,

  remediationWorkOrderId: optionalUuidSchema
});

/**
 * Type inference from violation update schema
 */
export type ViolationUpdateFormData = z.output<typeof violationUpdateSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Validation schema for compliance requirement filters
 */
export const complianceRequirementFiltersSchema = z.object({
  category: complianceCategorySchema.optional(),
  status: requirementStatusSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['ASC', 'DESC']).optional()
});

export type ComplianceRequirementFiltersData = z.output<typeof complianceRequirementFiltersSchema>;

/**
 * Validation schema for compliance schedule filters
 */
export const complianceScheduleFiltersSchema = z.object({
  propertyId: optionalUuidSchema,
  requirementId: optionalUuidSchema,
  category: complianceCategorySchema.optional(),
  status: complianceScheduleStatusSchema.optional(),
  dueDateStart: optionalDateStringSchema,
  dueDateEnd: optionalDateStringSchema,
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['ASC', 'DESC']).optional()
});

export type ComplianceScheduleFiltersData = z.output<typeof complianceScheduleFiltersSchema>;

/**
 * Validation schema for inspection filters
 */
export const inspectionFiltersSchema = z.object({
  propertyId: optionalUuidSchema,
  complianceScheduleId: optionalUuidSchema,
  status: inspectionStatusSchema.optional(),
  result: inspectionResultSchema.optional(),
  scheduledDateStart: optionalDateStringSchema,
  scheduledDateEnd: optionalDateStringSchema,
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['ASC', 'DESC']).optional()
});

export type InspectionFiltersData = z.output<typeof inspectionFiltersSchema>;

/**
 * Validation schema for violation filters
 */
export const violationFiltersSchema = z.object({
  complianceScheduleId: optionalUuidSchema,
  fineStatus: fineStatusSchema.optional(),
  violationDateStart: optionalDateStringSchema,
  violationDateEnd: optionalDateStringSchema,
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['ASC', 'DESC']).optional()
});

export type ViolationFiltersData = z.output<typeof violationFiltersSchema>;

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

/**
 * Validate compliance requirement form data
 */
export function validateComplianceRequirement(data: unknown) {
  return complianceRequirementSchema.safeParse(data);
}

/**
 * Validate schedule complete form data
 */
export function validateScheduleComplete(data: unknown) {
  return complianceScheduleCompleteSchema.safeParse(data);
}

/**
 * Validate inspection create form data
 */
export function validateInspectionCreate(data: unknown) {
  return inspectionCreateSchema.safeParse(data);
}

/**
 * Validate inspection results form data
 */
export function validateInspectionResults(data: unknown) {
  return inspectionResultsSchema.safeParse(data);
}

/**
 * Validate violation create form data
 */
export function validateViolationCreate(data: unknown) {
  return violationCreateSchema.safeParse(data);
}

/**
 * Validate violation update form data
 */
export function validateViolationUpdate(data: unknown) {
  return violationUpdateSchema.safeParse(data);
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Extract error messages from Zod validation result
 */
export function getValidationErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string> {
  if (result.success) return {};

  const errors: Record<string, string> = {};
  if (result.error) {
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    });
  }
  return errors;
}

/**
 * Check if a field has an error
 */
export function hasFieldError(
  result: { success: boolean; error?: z.ZodError },
  fieldPath: string
): boolean {
  if (result.success) return false;
  return result.error?.issues.some((issue) => issue.path.join('.') === fieldPath) ?? false;
}

/**
 * Get error message for a specific field
 */
export function getFieldError(
  result: { success: boolean; error?: z.ZodError },
  fieldPath: string
): string | undefined {
  if (result.success) return undefined;
  const issue = result.error?.issues.find((issue) => issue.path.join('.') === fieldPath);
  return issue?.message;
}
