/**
 * Unit tests for PM Schedule Service
 * Story 4.2: Preventive Maintenance Scheduling
 * Tests API integration for PM schedule management operations
 */

import {
  createPMSchedule,
  getPMSchedules,
  getPMScheduleById,
  updatePMSchedule,
  updatePMScheduleStatus,
  generateWorkOrderNow,
  getPMScheduleHistory,
  deletePMSchedule,
  prepareCreatePMScheduleData,
  prepareUpdatePMScheduleData,
} from '../pm-schedule.service';
import { apiClient } from '@/lib/api';
import {
  PMScheduleStatus,
  RecurrenceType,
} from '@/types/pm-schedule';
import { WorkOrderCategory, WorkOrderPriority } from '@/types/work-orders';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('PM Schedule Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPMSchedule', () => {
    it('should create a new PM schedule successfully', async () => {
      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        scheduleName: 'HVAC Quarterly Inspection',
        status: PMScheduleStatus.ACTIVE,
        nextGenerationDate: '2025-04-01',
        createdAt: '2025-01-01T10:00:00Z',
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockResponse },
      });

      const scheduleData = {
        scheduleName: 'HVAC Quarterly Inspection',
        propertyId: null,
        category: WorkOrderCategory.HVAC,
        description: 'Quarterly inspection of all HVAC units including filter replacement and cleaning',
        recurrenceType: RecurrenceType.QUARTERLY,
        startDate: '2025-01-01',
        defaultPriority: WorkOrderPriority.MEDIUM,
      };

      const result = await createPMSchedule(scheduleData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/pm-schedules', scheduleData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API call fails', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(createPMSchedule({} as any)).rejects.toThrow('API Error');
    });
  });

  describe('getPMSchedules', () => {
    it('should fetch PM schedules with filters successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 'schedule-1', scheduleName: 'HVAC Monthly', status: PMScheduleStatus.ACTIVE },
          { id: 'schedule-2', scheduleName: 'Plumbing Quarterly', status: PMScheduleStatus.PAUSED },
        ],
        pagination: {
          currentPage: 0,
          pageSize: 20,
          totalPages: 1,
          totalElements: 2,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getPMSchedules({
        status: [PMScheduleStatus.ACTIVE],
        page: 0,
        size: 20,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/pm-schedules', {
        params: expect.objectContaining({
          status: 'ACTIVE',
          page: 0,
          size: 20,
          sortBy: 'nextGenerationDate',
          sortDirection: 'ASC',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch PM schedules with search query', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          currentPage: 0,
          pageSize: 20,
          totalPages: 0,
          totalElements: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      await getPMSchedules({ search: 'HVAC' });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/pm-schedules', {
        params: expect.objectContaining({
          search: 'HVAC',
        }),
      });
    });

    it('should filter by category and recurrence type', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          currentPage: 0,
          pageSize: 20,
          totalPages: 0,
          totalElements: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      await getPMSchedules({
        category: [WorkOrderCategory.HVAC, WorkOrderCategory.PLUMBING],
        recurrenceType: [RecurrenceType.MONTHLY],
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/pm-schedules', {
        params: expect.objectContaining({
          category: 'HVAC,PLUMBING',
          frequency: 'MONTHLY',
        }),
      });
    });
  });

  describe('getPMScheduleById', () => {
    it('should fetch PM schedule by ID successfully', async () => {
      const mockSchedule = {
        id: 'schedule-123',
        scheduleName: 'HVAC Quarterly Inspection',
        propertyId: null,
        propertyName: null,
        category: WorkOrderCategory.HVAC,
        description: 'Quarterly HVAC inspection',
        recurrenceType: RecurrenceType.QUARTERLY,
        startDate: '2025-01-01',
        endDate: null,
        defaultPriority: WorkOrderPriority.MEDIUM,
        status: PMScheduleStatus.ACTIVE,
        nextGenerationDate: '2025-04-01',
        lastGeneratedDate: '2025-01-01',
        statistics: {
          totalGenerated: 1,
          completedCount: 1,
          overdueCount: 0,
          avgCompletionDays: 3,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockSchedule },
      });

      const result = await getPMScheduleById('schedule-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/pm-schedules/schedule-123');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('updatePMSchedule', () => {
    it('should update PM schedule successfully', async () => {
      const mockUpdatedSchedule = {
        id: 'schedule-123',
        scheduleName: 'Updated HVAC Inspection',
        defaultPriority: WorkOrderPriority.HIGH,
      };

      mockedApiClient.put.mockResolvedValueOnce({
        data: { success: true, data: mockUpdatedSchedule },
      });

      const updateData = {
        scheduleName: 'Updated HVAC Inspection',
        defaultPriority: WorkOrderPriority.HIGH,
      };

      const result = await updatePMSchedule('schedule-123', updateData);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/v1/pm-schedules/schedule-123', updateData);
      expect(result).toEqual(mockUpdatedSchedule);
    });
  });

  describe('updatePMScheduleStatus', () => {
    it('should update PM schedule status to PAUSED', async () => {
      const mockUpdatedSchedule = {
        id: 'schedule-123',
        status: PMScheduleStatus.PAUSED,
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: mockUpdatedSchedule },
      });

      const result = await updatePMScheduleStatus('schedule-123', PMScheduleStatus.PAUSED);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/v1/pm-schedules/schedule-123/status',
        { status: PMScheduleStatus.PAUSED }
      );
      expect(result).toEqual(mockUpdatedSchedule);
    });

    it('should update PM schedule status to ACTIVE (resume)', async () => {
      const mockUpdatedSchedule = {
        id: 'schedule-123',
        status: PMScheduleStatus.ACTIVE,
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: mockUpdatedSchedule },
      });

      const result = await updatePMScheduleStatus('schedule-123', PMScheduleStatus.ACTIVE);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/v1/pm-schedules/schedule-123/status',
        { status: PMScheduleStatus.ACTIVE }
      );
      expect(result.status).toBe(PMScheduleStatus.ACTIVE);
    });

    it('should update PM schedule status to COMPLETED', async () => {
      const mockUpdatedSchedule = {
        id: 'schedule-123',
        status: PMScheduleStatus.COMPLETED,
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: mockUpdatedSchedule },
      });

      const result = await updatePMScheduleStatus('schedule-123', PMScheduleStatus.COMPLETED);

      expect(result.status).toBe(PMScheduleStatus.COMPLETED);
    });
  });

  describe('generateWorkOrderNow', () => {
    it('should generate work order immediately', async () => {
      const mockResponse = {
        workOrderId: 'wo-123',
        workOrderNumber: 'WO-20250101-0001',
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockResponse },
      });

      const result = await generateWorkOrderNow('schedule-123');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/pm-schedules/schedule-123/generate-now');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPMScheduleHistory', () => {
    it('should fetch PM schedule history with pagination', async () => {
      const mockHistory = {
        success: true,
        data: [
          {
            id: 'wo-1',
            workOrderNumber: 'WO-20250101-0001',
            generatedDate: '2025-01-01',
            scheduledDate: '2025-01-01',
            status: 'COMPLETED',
            completedAt: '2025-01-05',
            daysToComplete: 4,
            isOverdue: false,
          },
        ],
        pagination: {
          currentPage: 0,
          pageSize: 10,
          totalPages: 1,
          totalElements: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await getPMScheduleHistory('schedule-123', 0, 10);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/v1/pm-schedules/schedule-123/history',
        { params: { page: 0, size: 10 } }
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('deletePMSchedule', () => {
    it('should delete PM schedule successfully', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      await deletePMSchedule('schedule-123');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/v1/pm-schedules/schedule-123');
    });

    it('should throw error when deletion fails', async () => {
      mockedApiClient.delete.mockRejectedValueOnce(new Error('Cannot delete schedule with generated work orders'));

      await expect(deletePMSchedule('schedule-123')).rejects.toThrow();
    });
  });

  describe('prepareCreatePMScheduleData', () => {
    it('should convert form data to API format with dates', () => {
      const formData = {
        scheduleName: 'Test Schedule',
        propertyId: 'prop-123',
        category: 'HVAC',
        description: 'Test description for the schedule',
        recurrenceType: 'QUARTERLY',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        defaultPriority: 'MEDIUM',
        defaultAssigneeId: 'user-123',
      };

      const result = prepareCreatePMScheduleData(formData);

      expect(result).toEqual({
        scheduleName: 'Test Schedule',
        propertyId: 'prop-123',
        category: 'HVAC',
        description: 'Test description for the schedule',
        recurrenceType: 'QUARTERLY',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        defaultPriority: 'MEDIUM',
        defaultAssigneeId: 'user-123',
      });
    });

    it('should handle null propertyId and endDate', () => {
      const formData = {
        scheduleName: 'Test Schedule',
        propertyId: null,
        category: 'HVAC',
        description: 'Test description for the schedule',
        recurrenceType: 'MONTHLY',
        startDate: new Date('2025-01-01'),
        endDate: null,
        defaultPriority: 'LOW',
        defaultAssigneeId: null,
      };

      const result = prepareCreatePMScheduleData(formData);

      expect(result.propertyId).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.defaultAssigneeId).toBeNull();
    });
  });

  describe('prepareUpdatePMScheduleData', () => {
    it('should convert update form data to API format', () => {
      const formData = {
        scheduleName: 'Updated Schedule',
        description: 'Updated description text',
        category: 'PLUMBING',
        defaultPriority: 'HIGH',
        endDate: new Date('2026-12-31'),
      };

      const result = prepareUpdatePMScheduleData(formData);

      expect(result).toEqual({
        scheduleName: 'Updated Schedule',
        description: 'Updated description text',
        category: 'PLUMBING',
        defaultPriority: 'HIGH',
        endDate: '2026-12-31',
      });
    });

    it('should only include defined fields', () => {
      const formData = {
        scheduleName: 'Updated Name Only',
      };

      const result = prepareUpdatePMScheduleData(formData);

      expect(result).toEqual({
        scheduleName: 'Updated Name Only',
      });
      expect(result).not.toHaveProperty('description');
      expect(result).not.toHaveProperty('category');
    });

    it('should handle clearing endDate to null', () => {
      const formData = {
        endDate: null,
      };

      const result = prepareUpdatePMScheduleData(formData);

      expect(result.endDate).toBeNull();
    });
  });
});
