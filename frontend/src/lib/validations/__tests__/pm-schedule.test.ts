/**
 * PM Schedule Validation Schema Tests
 * Story 4.2: Preventive Maintenance Scheduling
 * Tests validation for PM schedule creation and updates
 * AC: #1-5 - Form validation
 */

import {
  createPMScheduleSchema,
  updatePMScheduleSchema,
  updatePMScheduleStatusSchema,
  pmScheduleFiltersSchema,
} from '../pm-schedule';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';
import { RecurrenceType, PMScheduleStatus } from '@/types/pm-schedule';

describe('PM Schedule Validation Schemas', () => {
  describe('createPMScheduleSchema', () => {
    const validData = {
      scheduleName: 'HVAC Quarterly Inspection',
      propertyId: null,
      category: WorkOrderCategory.HVAC,
      description: 'Quarterly inspection of all HVAC units including filter replacement and cleaning procedures',
      recurrenceType: RecurrenceType.QUARTERLY,
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: null,
      defaultPriority: WorkOrderPriority.MEDIUM,
      defaultAssigneeId: null,
    };

    it('should accept valid PM schedule data', () => {
      const result = createPMScheduleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid data with specific propertyId', () => {
      const data = {
        ...validData,
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty string propertyId and transform to null', () => {
      const data = {
        ...validData,
        propertyId: '',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.propertyId).toBeNull();
      }
    });

    it('should reject missing schedule name', () => {
      const data = {
        ...validData,
        scheduleName: '',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['scheduleName'] }),
          ])
        );
      }
    });

    it('should reject schedule name exceeding 100 characters', () => {
      const data = {
        ...validData,
        scheduleName: 'A'.repeat(101),
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['scheduleName'] }),
          ])
        );
      }
    });

    it('should reject description less than 20 characters', () => {
      const data = {
        ...validData,
        description: 'Short desc',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['description'] }),
          ])
        );
      }
    });

    it('should reject description exceeding 1000 characters', () => {
      const data = {
        ...validData,
        description: 'A'.repeat(1001),
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['description'] }),
          ])
        );
      }
    });

    it('should reject invalid category', () => {
      const data = {
        ...validData,
        category: 'INVALID_CATEGORY',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['category'] }),
          ])
        );
      }
    });

    it('should reject invalid recurrence type', () => {
      const data = {
        ...validData,
        recurrenceType: 'WEEKLY',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['recurrenceType'] }),
          ])
        );
      }
    });

    it('should reject start date in the past', () => {
      const data = {
        ...validData,
        startDate: new Date('2020-01-01'),
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['startDate'] }),
          ])
        );
      }
    });

    it('should accept start date of today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const data = {
        ...validData,
        startDate: today,
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date', () => {
      const startDate = new Date(Date.now() + 86400000 * 30); // 30 days from now
      const endDate = new Date(Date.now() + 86400000 * 7); // 7 days from now (before start)
      const data = {
        ...validData,
        startDate,
        endDate,
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['endDate'] }),
          ])
        );
      }
    });

    it('should accept end date after start date', () => {
      const startDate = new Date(Date.now() + 86400000); // Tomorrow
      const endDate = new Date(Date.now() + 86400000 * 365); // 1 year from now
      const data = {
        ...validData,
        startDate,
        endDate,
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid priority', () => {
      const data = {
        ...validData,
        defaultPriority: 'CRITICAL',
      };
      const result = createPMScheduleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['defaultPriority'] }),
          ])
        );
      }
    });

    it('should accept all valid recurrence types', () => {
      const recurrenceTypes = [
        RecurrenceType.MONTHLY,
        RecurrenceType.QUARTERLY,
        RecurrenceType.SEMI_ANNUALLY,
        RecurrenceType.ANNUALLY,
      ];

      recurrenceTypes.forEach((recurrenceType) => {
        const data = { ...validData, recurrenceType };
        const result = createPMScheduleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid categories', () => {
      const categories = [
        WorkOrderCategory.PLUMBING,
        WorkOrderCategory.ELECTRICAL,
        WorkOrderCategory.HVAC,
        WorkOrderCategory.APPLIANCE,
        WorkOrderCategory.CARPENTRY,
        WorkOrderCategory.PEST_CONTROL,
        WorkOrderCategory.CLEANING,
        WorkOrderCategory.PAINTING,
        WorkOrderCategory.LANDSCAPING,
        WorkOrderCategory.OTHER,
      ];

      categories.forEach((category) => {
        const data = { ...validData, category };
        const result = createPMScheduleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid priorities', () => {
      const priorities = [
        WorkOrderPriority.LOW,
        WorkOrderPriority.MEDIUM,
        WorkOrderPriority.HIGH,
      ];

      priorities.forEach((defaultPriority) => {
        const data = { ...validData, defaultPriority };
        const result = createPMScheduleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updatePMScheduleSchema', () => {
    it('should accept valid update data', () => {
      const validData = {
        scheduleName: 'Updated HVAC Inspection',
        description: 'Updated description with detailed maintenance procedures',
        category: WorkOrderCategory.HVAC,
        defaultPriority: WorkOrderPriority.HIGH,
      };

      const result = updatePMScheduleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only schedule name', () => {
      const result = updatePMScheduleSchema.safeParse({
        scheduleName: 'New Name',
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only description', () => {
      const result = updatePMScheduleSchema.safeParse({
        description: 'Updated detailed description text',
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only priority', () => {
      const result = updatePMScheduleSchema.safeParse({
        defaultPriority: WorkOrderPriority.LOW,
      });
      expect(result.success).toBe(true);
    });

    it('should accept setting end date', () => {
      const result = updatePMScheduleSchema.safeParse({
        endDate: new Date('2026-12-31'),
      });
      expect(result.success).toBe(true);
    });

    it('should accept clearing end date to null', () => {
      const result = updatePMScheduleSchema.safeParse({
        endDate: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject schedule name exceeding 100 characters', () => {
      const result = updatePMScheduleSchema.safeParse({
        scheduleName: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should reject description less than 20 characters when provided', () => {
      const result = updatePMScheduleSchema.safeParse({
        description: 'Too short',
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty object (no updates)', () => {
      const result = updatePMScheduleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('updatePMScheduleStatusSchema', () => {
    it('should accept ACTIVE status', () => {
      const result = updatePMScheduleStatusSchema.safeParse({
        status: PMScheduleStatus.ACTIVE,
      });
      expect(result.success).toBe(true);
    });

    it('should accept PAUSED status', () => {
      const result = updatePMScheduleStatusSchema.safeParse({
        status: PMScheduleStatus.PAUSED,
      });
      expect(result.success).toBe(true);
    });

    it('should accept COMPLETED status', () => {
      const result = updatePMScheduleStatusSchema.safeParse({
        status: PMScheduleStatus.COMPLETED,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updatePMScheduleStatusSchema.safeParse({
        status: 'CANCELLED',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['status'] }),
          ])
        );
      }
    });

    it('should reject missing status', () => {
      const result = updatePMScheduleStatusSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('pmScheduleFiltersSchema', () => {
    it('should accept valid filter data', () => {
      const validFilters = {
        status: [PMScheduleStatus.ACTIVE, PMScheduleStatus.PAUSED],
        category: [WorkOrderCategory.HVAC],
        recurrenceType: [RecurrenceType.QUARTERLY],
        search: 'inspection',
        page: 0,
        size: 20,
        sortBy: 'nextGenerationDate',
        sortDirection: 'ASC' as const,
      };

      const result = pmScheduleFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should accept empty filters', () => {
      const result = pmScheduleFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = pmScheduleFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(0);
        expect(result.data.size).toBe(20);
        expect(result.data.sortBy).toBe('nextGenerationDate');
        expect(result.data.sortDirection).toBe('ASC');
      }
    });

    it('should reject negative page number', () => {
      const result = pmScheduleFiltersSchema.safeParse({
        page: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject size exceeding 100', () => {
      const result = pmScheduleFiltersSchema.safeParse({
        size: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should reject size of 0', () => {
      const result = pmScheduleFiltersSchema.safeParse({
        size: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid sort direction values', () => {
      const ascResult = pmScheduleFiltersSchema.safeParse({
        sortDirection: 'ASC',
      });
      expect(ascResult.success).toBe(true);

      const descResult = pmScheduleFiltersSchema.safeParse({
        sortDirection: 'DESC',
      });
      expect(descResult.success).toBe(true);
    });

    it('should reject invalid sort direction', () => {
      const result = pmScheduleFiltersSchema.safeParse({
        sortDirection: 'RANDOM',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid UUID for propertyId', () => {
      const result = pmScheduleFiltersSchema.safeParse({
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for propertyId', () => {
      const result = pmScheduleFiltersSchema.safeParse({
        propertyId: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });
  });
});
