/**
 * Compliance Validation Schema Tests
 * Story 7.3: Compliance and Inspection Tracking
 *
 * Tests for Zod validation schemas for compliance forms
 */

import {
  complianceRequirementSchema,
  complianceScheduleCompleteSchema,
  inspectionCreateSchema,
  inspectionResultsSchema,
  violationCreateSchema,
  violationUpdateSchema,
  complianceRequirementFormDefaults,
  complianceScheduleCompleteFormDefaults,
  inspectionCreateFormDefaults,
  inspectionResultsFormDefaults,
  violationCreateFormDefaults,
  validateComplianceRequirement,
  validateScheduleComplete,
  validateInspectionCreate,
  validateInspectionResults,
  validateViolationCreate,
  validateViolationUpdate,
  getValidationErrors,
  hasFieldError,
  getFieldError,
  MAX_REQUIREMENT_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_INSPECTOR_NAME_LENGTH,
  MAX_VIOLATION_DESCRIPTION_LENGTH,
  uuidSchema,
} from '../compliance';
import {
  ComplianceCategory,
  ComplianceFrequency,
  RequirementStatus,
  InspectionStatus,
  InspectionResult,
  FineStatus,
} from '@/types/compliance';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const TODAY_DATE = new Date().toISOString().split('T')[0];
const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const PAST_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

describe('Compliance Validation Schemas', () => {
  // ============================================================================
  // UUID SCHEMA TESTS
  // ============================================================================
  describe('uuidSchema', () => {
    it('should validate a valid UUID', () => {
      const result = uuidSchema.safeParse(VALID_UUID);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid UUID format', () => {
      const result = uuidSchema.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject an empty string', () => {
      const result = uuidSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // COMPLIANCE REQUIREMENT SCHEMA TESTS
  // ============================================================================
  describe('complianceRequirementSchema', () => {
    const validRequirementData = {
      requirementName: 'Fire Safety Inspection',
      category: ComplianceCategory.SAFETY,
      description: 'Annual fire safety inspection required by civil defense',
      applicableProperties: null,
      allProperties: true,
      frequency: ComplianceFrequency.ANNUALLY,
      authorityAgency: 'Civil Defense',
      penaltyDescription: 'Fine up to AED 50,000',
      status: RequirementStatus.ACTIVE,
    };

    it('should validate a complete requirement with all fields', () => {
      const result = complianceRequirementSchema.safeParse(validRequirementData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal required fields', () => {
      const minimalData = {
        requirementName: 'Building Permit',
        category: ComplianceCategory.LICENSING,
        frequency: ComplianceFrequency.ONE_TIME,
      };
      const result = complianceRequirementSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('requirementName validation', () => {
      it('should reject empty requirement name', () => {
        const data = { ...validRequirementData, requirementName: '' };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('required');
        }
      });

      it('should reject requirement name exceeding max length', () => {
        const data = { ...validRequirementData, requirementName: 'A'.repeat(MAX_REQUIREMENT_NAME_LENGTH + 1) };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should trim whitespace from requirement name', () => {
        const data = { ...validRequirementData, requirementName: '  Fire Safety Inspection  ' };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.requirementName).toBe('Fire Safety Inspection');
        }
      });
    });

    describe('category validation', () => {
      it('should accept all valid compliance categories', () => {
        const categories = Object.values(ComplianceCategory);
        categories.forEach((category) => {
          const data = { ...validRequirementData, category };
          const result = complianceRequirementSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid category', () => {
        const data = { ...validRequirementData, category: 'INVALID_CATEGORY' };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('frequency validation', () => {
      it('should accept all valid frequencies', () => {
        const frequencies = Object.values(ComplianceFrequency);
        frequencies.forEach((frequency) => {
          const data = { ...validRequirementData, frequency };
          const result = complianceRequirementSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('description validation', () => {
      it('should accept empty description', () => {
        const data = { ...validRequirementData, description: '' };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject description exceeding max length', () => {
        const data = { ...validRequirementData, description: 'A'.repeat(MAX_DESCRIPTION_LENGTH + 1) };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('applicableProperties validation', () => {
      it('should accept null for all properties', () => {
        const data = { ...validRequirementData, applicableProperties: null };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept array of valid UUIDs', () => {
        const data = {
          ...validRequirementData,
          applicableProperties: [VALID_UUID, '223e4567-e89b-12d3-a456-426614174001'],
        };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should transform empty array to null', () => {
        const data = { ...validRequirementData, applicableProperties: [] };
        const result = complianceRequirementSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.applicableProperties).toBeNull();
        }
      });
    });
  });

  // ============================================================================
  // COMPLIANCE SCHEDULE COMPLETE SCHEMA TESTS
  // ============================================================================
  describe('complianceScheduleCompleteSchema', () => {
    const validCompleteData = {
      completedDate: TODAY_DATE,
      notes: 'Inspection completed successfully',
    };

    it('should validate a complete schedule with all fields', () => {
      const result = complianceScheduleCompleteSchema.safeParse(validCompleteData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal required fields', () => {
      const minimalData = { completedDate: TODAY_DATE };
      const result = complianceScheduleCompleteSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('completedDate validation', () => {
      it('should reject empty completed date', () => {
        const data = { ...validCompleteData, completedDate: '' };
        const result = complianceScheduleCompleteSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject future date', () => {
        const data = { ...validCompleteData, completedDate: FUTURE_DATE };
        const result = complianceScheduleCompleteSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('future');
        }
      });

      it('should accept today date', () => {
        const data = { ...validCompleteData, completedDate: TODAY_DATE };
        const result = complianceScheduleCompleteSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept past date', () => {
        const data = { ...validCompleteData, completedDate: PAST_DATE };
        const result = complianceScheduleCompleteSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // INSPECTION CREATE SCHEMA TESTS
  // ============================================================================
  describe('inspectionCreateSchema', () => {
    const validInspectionData = {
      complianceScheduleId: VALID_UUID,
      propertyId: VALID_UUID,
      inspectorName: 'John Smith',
      scheduledDate: FUTURE_DATE,
    };

    it('should validate a complete inspection', () => {
      const result = inspectionCreateSchema.safeParse(validInspectionData);
      expect(result.success).toBe(true);
    });

    describe('inspectorName validation', () => {
      it('should reject empty inspector name', () => {
        const data = { ...validInspectionData, inspectorName: '' };
        const result = inspectionCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject inspector name exceeding max length', () => {
        const data = { ...validInspectionData, inspectorName: 'A'.repeat(MAX_INSPECTOR_NAME_LENGTH + 1) };
        const result = inspectionCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('scheduledDate validation', () => {
      it('should accept future date', () => {
        const data = { ...validInspectionData, scheduledDate: FUTURE_DATE };
        const result = inspectionCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept today date', () => {
        const data = { ...validInspectionData, scheduledDate: TODAY_DATE };
        const result = inspectionCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject past date', () => {
        const data = { ...validInspectionData, scheduledDate: PAST_DATE };
        const result = inspectionCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('future');
        }
      });
    });
  });

  // ============================================================================
  // INSPECTION RESULTS SCHEMA TESTS
  // ============================================================================
  describe('inspectionResultsSchema', () => {
    const validResultsData = {
      inspectionDate: TODAY_DATE,
      status: InspectionStatus.PASSED,
      result: InspectionResult.PASSED,
      issuesFound: '',
      recommendations: 'Continue annual inspections',
      nextInspectionDate: FUTURE_DATE,
    };

    it('should validate complete inspection results', () => {
      const result = inspectionResultsSchema.safeParse(validResultsData);
      expect(result.success).toBe(true);
    });

    describe('status and result validation', () => {
      it('should require result when status is PASSED', () => {
        const data = { ...validResultsData, status: InspectionStatus.PASSED, result: null };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const resultError = result.error.issues.find((i) => i.path.includes('result'));
          expect(resultError).toBeDefined();
        }
      });

      it('should require result when status is FAILED', () => {
        const data = {
          ...validResultsData,
          status: InspectionStatus.FAILED,
          result: null,
        };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept no result when status is SCHEDULED', () => {
        const data = {
          ...validResultsData,
          status: InspectionStatus.SCHEDULED,
          result: null,
        };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('issuesFound conditional validation', () => {
      it('should require issuesFound when result is FAILED', () => {
        const data = {
          ...validResultsData,
          status: InspectionStatus.FAILED,
          result: InspectionResult.FAILED,
          issuesFound: '',
        };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should require issuesFound when result is PARTIAL_PASS', () => {
        const data = {
          ...validResultsData,
          status: InspectionStatus.PASSED,
          result: InspectionResult.PARTIAL_PASS,
          issuesFound: '',
        };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept FAILED result with issuesFound provided', () => {
        const data = {
          ...validResultsData,
          status: InspectionStatus.FAILED,
          result: InspectionResult.FAILED,
          issuesFound: 'Fire extinguisher expired',
        };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('inspectionDate validation', () => {
      it('should reject future date', () => {
        const data = { ...validResultsData, inspectionDate: FUTURE_DATE };
        const result = inspectionResultsSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // VIOLATION CREATE SCHEMA TESTS
  // ============================================================================
  describe('violationCreateSchema', () => {
    const validViolationData = {
      complianceScheduleId: VALID_UUID,
      violationDate: TODAY_DATE,
      description: 'Fire safety equipment not up to code',
      fineAmount: 5000,
      fineStatus: FineStatus.PENDING,
      createRemediationWorkOrder: false,
    };

    it('should validate a complete violation', () => {
      const result = violationCreateSchema.safeParse(validViolationData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal required fields', () => {
      const minimalData = {
        complianceScheduleId: VALID_UUID,
        violationDate: TODAY_DATE,
        description: 'Violation description',
      };
      const result = violationCreateSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe('violationDate validation', () => {
      it('should reject future date', () => {
        const data = { ...validViolationData, violationDate: FUTURE_DATE };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept today date', () => {
        const data = { ...validViolationData, violationDate: TODAY_DATE };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept past date', () => {
        const data = { ...validViolationData, violationDate: PAST_DATE };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('description validation', () => {
      it('should reject empty description', () => {
        const data = { ...validViolationData, description: '' };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject description exceeding max length', () => {
        const data = { ...validViolationData, description: 'A'.repeat(MAX_VIOLATION_DESCRIPTION_LENGTH + 1) };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('fineAmount validation', () => {
      it('should accept zero fine amount', () => {
        const data = { ...validViolationData, fineAmount: 0 };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject negative fine amount', () => {
        const data = { ...validViolationData, fineAmount: -100 };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should accept null fine amount', () => {
        const data = { ...validViolationData, fineAmount: null };
        const result = violationCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('fineStatus validation', () => {
      it('should accept all valid fine statuses', () => {
        const statuses = Object.values(FineStatus);
        statuses.forEach((status) => {
          const data = { ...validViolationData, fineStatus: status };
          const result = violationCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  // ============================================================================
  // VIOLATION UPDATE SCHEMA TESTS
  // ============================================================================
  describe('violationUpdateSchema', () => {
    it('should validate partial update', () => {
      const data = { fineStatus: FineStatus.PAID };
      const result = violationUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate resolution date update', () => {
      const data = { resolutionDate: TODAY_DATE };
      const result = violationUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate fine amount update', () => {
      const data = { fineAmount: 10000 };
      const result = violationUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // VALIDATION HELPER FUNCTION TESTS
  // ============================================================================
  describe('Validation Helper Functions', () => {
    describe('validateComplianceRequirement', () => {
      it('should return success for valid data', () => {
        const result = validateComplianceRequirement({
          requirementName: 'Test Requirement',
          category: ComplianceCategory.SAFETY,
          frequency: ComplianceFrequency.ANNUALLY,
        });
        expect(result.success).toBe(true);
      });

      it('should return failure for invalid data', () => {
        const result = validateComplianceRequirement({ requirementName: '' });
        expect(result.success).toBe(false);
      });
    });

    describe('validateScheduleComplete', () => {
      it('should return success for valid data', () => {
        const result = validateScheduleComplete({ completedDate: TODAY_DATE });
        expect(result.success).toBe(true);
      });
    });

    describe('validateInspectionCreate', () => {
      it('should return success for valid data', () => {
        const result = validateInspectionCreate({
          complianceScheduleId: VALID_UUID,
          propertyId: VALID_UUID,
          inspectorName: 'John Smith',
          scheduledDate: TODAY_DATE,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('validateInspectionResults', () => {
      it('should return success for valid data', () => {
        const result = validateInspectionResults({
          inspectionDate: TODAY_DATE,
          status: InspectionStatus.SCHEDULED,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('validateViolationCreate', () => {
      it('should return success for valid data', () => {
        const result = validateViolationCreate({
          complianceScheduleId: VALID_UUID,
          violationDate: TODAY_DATE,
          description: 'Test violation',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('validateViolationUpdate', () => {
      it('should return success for valid data', () => {
        const result = validateViolationUpdate({ fineStatus: FineStatus.WAIVED });
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // ERROR HELPER FUNCTION TESTS
  // ============================================================================
  describe('Error Helper Functions', () => {
    describe('getValidationErrors', () => {
      it('should return empty object for successful validation', () => {
        const result = complianceRequirementSchema.safeParse({
          requirementName: 'Test',
          category: ComplianceCategory.SAFETY,
          frequency: ComplianceFrequency.ANNUALLY,
        });
        const errors = getValidationErrors(result);
        expect(errors).toEqual({});
      });

      it('should return error messages for failed validation', () => {
        const result = complianceRequirementSchema.safeParse({ requirementName: '' });
        const errors = getValidationErrors(result);
        expect(Object.keys(errors).length).toBeGreaterThan(0);
      });
    });

    describe('hasFieldError', () => {
      it('should return false for successful validation', () => {
        const result = complianceRequirementSchema.safeParse({
          requirementName: 'Test',
          category: ComplianceCategory.SAFETY,
          frequency: ComplianceFrequency.ANNUALLY,
        });
        expect(hasFieldError(result, 'requirementName')).toBe(false);
      });

      it('should return true for field with error', () => {
        const result = complianceRequirementSchema.safeParse({ requirementName: '' });
        expect(hasFieldError(result, 'requirementName')).toBe(true);
      });
    });

    describe('getFieldError', () => {
      it('should return undefined for successful validation', () => {
        const result = complianceRequirementSchema.safeParse({
          requirementName: 'Test',
          category: ComplianceCategory.SAFETY,
          frequency: ComplianceFrequency.ANNUALLY,
        });
        expect(getFieldError(result, 'requirementName')).toBeUndefined();
      });

      it('should return error message for field with error', () => {
        const result = complianceRequirementSchema.safeParse({ requirementName: '' });
        const error = getFieldError(result, 'requirementName');
        expect(error).toBeDefined();
        expect(typeof error).toBe('string');
      });
    });
  });

  // ============================================================================
  // DEFAULT VALUES TESTS
  // ============================================================================
  describe('Default Values', () => {
    // Note: Form defaults are meant for form initialization, not to pass full validation.
    // Required fields (like requirementName, inspectorName, description) are intentionally
    // empty so users can fill them in. We test structure, not validation.

    describe('complianceRequirementFormDefaults', () => {
      it('should have correct structure', () => {
        expect(complianceRequirementFormDefaults).toHaveProperty('requirementName');
        expect(complianceRequirementFormDefaults).toHaveProperty('category');
        expect(complianceRequirementFormDefaults).toHaveProperty('frequency');
        expect(complianceRequirementFormDefaults).toHaveProperty('status');
      });

      it('should have valid enum values for optional fields', () => {
        expect(Object.values(ComplianceCategory)).toContain(complianceRequirementFormDefaults.category);
        expect(Object.values(ComplianceFrequency)).toContain(complianceRequirementFormDefaults.frequency);
        expect(Object.values(RequirementStatus)).toContain(complianceRequirementFormDefaults.status);
      });
    });

    describe('complianceScheduleCompleteFormDefaults', () => {
      it('should have valid defaults', () => {
        const result = complianceScheduleCompleteSchema.safeParse(complianceScheduleCompleteFormDefaults);
        expect(result.success).toBe(true);
      });

      it('should have correct structure', () => {
        expect(complianceScheduleCompleteFormDefaults).toHaveProperty('completedDate');
        expect(complianceScheduleCompleteFormDefaults).toHaveProperty('notes');
      });
    });

    describe('inspectionCreateFormDefaults', () => {
      it('should return defaults with provided UUIDs', () => {
        const defaults = inspectionCreateFormDefaults(VALID_UUID, VALID_UUID);
        expect(defaults.complianceScheduleId).toBe(VALID_UUID);
        expect(defaults.propertyId).toBe(VALID_UUID);
        expect(defaults).toHaveProperty('inspectorName');
        expect(defaults).toHaveProperty('scheduledDate');
      });

      it('should have a valid scheduled date (today)', () => {
        const defaults = inspectionCreateFormDefaults(VALID_UUID, VALID_UUID);
        expect(defaults.scheduledDate).toBe(TODAY_DATE);
      });
    });

    describe('inspectionResultsFormDefaults', () => {
      it('should have correct structure', () => {
        expect(inspectionResultsFormDefaults).toHaveProperty('inspectionDate');
        expect(inspectionResultsFormDefaults).toHaveProperty('status');
        expect(inspectionResultsFormDefaults).toHaveProperty('result');
      });

      it('should have valid inspection date (today)', () => {
        expect(inspectionResultsFormDefaults.inspectionDate).toBe(TODAY_DATE);
      });

      it('should have valid default status', () => {
        expect(Object.values(InspectionStatus)).toContain(inspectionResultsFormDefaults.status);
      });
    });

    describe('violationCreateFormDefaults', () => {
      it('should return defaults with provided complianceScheduleId', () => {
        const defaults = violationCreateFormDefaults(VALID_UUID);
        expect(defaults.complianceScheduleId).toBe(VALID_UUID);
        expect(defaults).toHaveProperty('violationDate');
        expect(defaults).toHaveProperty('description');
        expect(defaults).toHaveProperty('fineStatus');
      });

      it('should have a valid violation date (today)', () => {
        const defaults = violationCreateFormDefaults(VALID_UUID);
        expect(defaults.violationDate).toBe(TODAY_DATE);
      });

      it('should have valid default fine status', () => {
        const defaults = violationCreateFormDefaults(VALID_UUID);
        expect(Object.values(FineStatus)).toContain(defaults.fineStatus);
      });
    });
  });
});
