/**
 * Compliance Validation Schemas
 * Zod schemas for compliance-related forms
 *
 * Story 7.3: Compliance and Inspection Tracking
 */

import { z } from 'zod';
import {
  ComplianceCategory,
  ComplianceFrequency,
  RequirementStatus,
  InspectionResult,
  FineStatus,
} from '@/types/compliance';

// ===========================
// Common Validation Rules
// ===========================

const uuidSchema = z.string().uuid('Please provide a valid ID');

const dateSchema = z.string().min(1, 'Date is required');

const optionalDateSchema = z.string().optional().or(z.literal(''));

// ===========================
// Requirement Schemas
// ===========================

export const createRequirementSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  category: z
    .union([z.nativeEnum(ComplianceCategory), z.literal('')])
    .refine((val) => val !== '', { message: 'Please select a category' }),
  frequency: z
    .union([z.nativeEnum(ComplianceFrequency), z.literal('')])
    .refine((val) => val !== '', { message: 'Please select a frequency' }),
  status: z.nativeEnum(RequirementStatus),
  regulatoryBody: z
    .string()
    .max(200, 'Regulatory body must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  referenceCode: z
    .string()
    .max(100, 'Reference code must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  applicableProperties: z.array(z.string().uuid()).optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type CreateRequirementFormData = z.infer<typeof createRequirementSchema>;

export const updateRequirementSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  category: z.union([z.nativeEnum(ComplianceCategory), z.literal('')]).optional(),
  frequency: z.union([z.nativeEnum(ComplianceFrequency), z.literal('')]).optional(),
  status: z.nativeEnum(RequirementStatus).optional(),
  regulatoryBody: z
    .string()
    .max(200, 'Regulatory body must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  referenceCode: z
    .string()
    .max(100, 'Reference code must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type UpdateRequirementFormData = z.infer<typeof updateRequirementSchema>;

// ===========================
// Schedule Schemas
// ===========================

export const completeScheduleSchema = z.object({
  completionDate: dateSchema,
  certificateNumber: z
    .string()
    .max(100, 'Certificate number must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  certificateUrl: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type CompleteScheduleFormData = z.infer<typeof completeScheduleSchema>;

// ===========================
// Inspection Schemas
// ===========================

export const createInspectionSchema = z.object({
  complianceScheduleId: uuidSchema,
  scheduledDate: dateSchema,
  inspectorName: z
    .string()
    .min(1, 'Inspector name is required')
    .max(200, 'Inspector name must be less than 200 characters')
    .trim(),
  inspectorCompany: z
    .string()
    .max(200, 'Inspector company must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  inspectorContact: z
    .string()
    .max(200, 'Inspector contact must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type CreateInspectionFormData = z.infer<typeof createInspectionSchema>;

export const recordInspectionResultsSchema = z.object({
  inspectionDate: dateSchema,
  result: z
    .union([z.nativeEnum(InspectionResult), z.literal('')])
    .refine((val) => val !== '', { message: 'Please select a result' }),
  issuesFound: z
    .string()
    .max(2000, 'Issues found must be less than 2000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  createRemediationWorkOrder: z.boolean().optional(),
});

export type RecordInspectionResultsFormData = z.infer<typeof recordInspectionResultsSchema>;

// ===========================
// Violation Schemas
// ===========================

export const createViolationSchema = z.object({
  complianceScheduleId: uuidSchema,
  violationDate: dateSchema,
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  fineAmount: z.number().nonnegative('Fine amount must be zero or positive').optional(),
  fineStatus: z.nativeEnum(FineStatus),
  fineDueDate: optionalDateSchema,
  issuingAuthority: z
    .string()
    .max(200, 'Issuing authority must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  referenceNumber: z
    .string()
    .max(100, 'Reference number must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type CreateViolationFormData = z.infer<typeof createViolationSchema>;

export const updateViolationSchema = z.object({
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  fineAmount: z.number().nonnegative('Fine amount must be zero or positive').optional(),
  fineStatus: z.nativeEnum(FineStatus).optional(),
  fineDueDate: optionalDateSchema,
  finePaidDate: optionalDateSchema,
  issuingAuthority: z
    .string()
    .max(200, 'Issuing authority must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  referenceNumber: z
    .string()
    .max(100, 'Reference number must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  resolutionDate: optionalDateSchema,
  resolutionNotes: z
    .string()
    .max(2000, 'Resolution notes must be less than 2000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type UpdateViolationFormData = z.infer<typeof updateViolationSchema>;
