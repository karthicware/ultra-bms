/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Compliance Service
 * Story 7.3: Compliance and Inspection Tracking
 * Tests API integration for compliance management operations
 */

import { complianceService } from '../compliance.service';
import { apiClient } from '@/lib/api';
import {
  ComplianceCategory,
  ComplianceFrequency,
  RequirementStatus,
  ComplianceScheduleStatus,
  InspectionStatus,
  InspectionResult,
  FineStatus,
} from '@/types/compliance';

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

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const TODAY_DATE = new Date().toISOString().split('T')[0];

// Correct API paths matching the service
const API_PATHS = {
  requirements: '/v1/compliance-requirements',
  schedules: '/v1/compliance-schedules',
  inspections: '/v1/inspections',
  violations: '/v1/violations',
  dashboard: '/v1/compliance/dashboard',
};

describe('Compliance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // COMPLIANCE REQUIREMENTS TESTS
  // ============================================================================
  describe('Compliance Requirements', () => {
    describe('createRequirement', () => {
      it('should create a new compliance requirement successfully', async () => {
        const mockResponse = {
          id: VALID_UUID,
          requirementName: 'Fire Safety Inspection',
          category: ComplianceCategory.SAFETY,
          frequency: ComplianceFrequency.ANNUALLY,
          status: RequirementStatus.ACTIVE,
          createdAt: '2025-01-01T10:00:00Z',
          schedulesCreated: 5,
        };

        mockedApiClient.post.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const requirementData = {
          requirementName: 'Fire Safety Inspection',
          category: ComplianceCategory.SAFETY,
          frequency: ComplianceFrequency.ANNUALLY,
          status: RequirementStatus.ACTIVE,
        };

        const result = await complianceService.createRequirement(requirementData);

        expect(mockedApiClient.post).toHaveBeenCalledWith(API_PATHS.requirements, requirementData);
        expect(result).toEqual(mockResponse);
      });

      it('should throw error when API call fails', async () => {
        mockedApiClient.post.mockRejectedValueOnce(new Error('API Error'));

        await expect(complianceService.createRequirement({} as any)).rejects.toThrow('API Error');
      });
    });

    describe('getRequirements', () => {
      it('should fetch compliance requirements with pagination', async () => {
        const mockResponse = {
          content: [
            {
              id: VALID_UUID,
              requirementName: 'Fire Safety',
              category: ComplianceCategory.SAFETY,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getRequirements({ page: 0, size: 20 });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.requirements, {
          params: expect.objectContaining({ page: 0, size: 20 }),
        });
        expect(result.data).toEqual(mockResponse);
      });

      it('should fetch requirements with filters', async () => {
        const mockResponse = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        await complianceService.getRequirements({
          category: ComplianceCategory.SAFETY,
          status: RequirementStatus.ACTIVE,
          page: 0,
          size: 20,
        });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.requirements, {
          params: expect.objectContaining({
            category: ComplianceCategory.SAFETY,
            status: RequirementStatus.ACTIVE,
            page: 0,
            size: 20,
          }),
        });
      });
    });

    describe('getRequirementById', () => {
      it('should fetch a specific requirement', async () => {
        const mockResponse = {
          id: VALID_UUID,
          requirementName: 'Fire Safety Inspection',
          category: ComplianceCategory.SAFETY,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getRequirementById(VALID_UUID);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`${API_PATHS.requirements}/${VALID_UUID}`);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateRequirement', () => {
      it('should update a compliance requirement', async () => {
        const mockResponse = {
          id: VALID_UUID,
          requirementName: 'Updated Fire Safety',
          category: ComplianceCategory.SAFETY,
        };

        mockedApiClient.put.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const updateData = { requirementName: 'Updated Fire Safety' };
        const result = await complianceService.updateRequirement(VALID_UUID, updateData);

        expect(mockedApiClient.put).toHaveBeenCalledWith(
          `${API_PATHS.requirements}/${VALID_UUID}`,
          updateData
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteRequirement', () => {
      it('should delete a compliance requirement', async () => {
        mockedApiClient.delete.mockResolvedValueOnce({
          data: { success: true },
        });

        await complianceService.deleteRequirement(VALID_UUID);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(`${API_PATHS.requirements}/${VALID_UUID}`);
      });
    });
  });

  // ============================================================================
  // COMPLIANCE SCHEDULES TESTS
  // ============================================================================
  describe('Compliance Schedules', () => {
    describe('getSchedules', () => {
      it('should fetch compliance schedules with pagination', async () => {
        const mockResponse = {
          content: [
            {
              id: VALID_UUID,
              propertyName: 'Building A',
              requirementName: 'Fire Safety',
              status: ComplianceScheduleStatus.UPCOMING,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getSchedules({ page: 0, size: 20 });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.schedules, {
          params: expect.objectContaining({ page: 0, size: 20 }),
        });
        expect(result.data).toEqual(mockResponse);
      });

      it('should fetch schedules with property and status filters', async () => {
        const mockResponse = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        await complianceService.getSchedules({
          propertyId: VALID_UUID,
          status: ComplianceScheduleStatus.OVERDUE,
          page: 0,
          size: 20,
        });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.schedules, {
          params: expect.objectContaining({
            propertyId: VALID_UUID,
            status: ComplianceScheduleStatus.OVERDUE,
            page: 0,
            size: 20,
          }),
        });
      });
    });

    describe('getScheduleById', () => {
      it('should fetch a specific schedule', async () => {
        const mockResponse = {
          id: VALID_UUID,
          propertyName: 'Building A',
          requirementName: 'Fire Safety',
          status: ComplianceScheduleStatus.UPCOMING,
          dueDate: TODAY_DATE,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getScheduleById(VALID_UUID);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`${API_PATHS.schedules}/${VALID_UUID}`);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('completeSchedule', () => {
      it('should mark a schedule as complete using FormData', async () => {
        const mockResponse = {
          completedSchedule: {
            id: VALID_UUID,
            status: ComplianceScheduleStatus.COMPLETED,
            completedDate: TODAY_DATE,
          },
          nextSchedule: null,
        };

        mockedApiClient.patch.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const completeData = {
          completedDate: TODAY_DATE,
          notes: 'Completed successfully',
        };

        const result = await complianceService.completeSchedule(VALID_UUID, completeData);

        // Service uses patch with FormData
        expect(mockedApiClient.patch).toHaveBeenCalledWith(
          `${API_PATHS.schedules}/${VALID_UUID}/complete`,
          expect.any(FormData),
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // ============================================================================
  // INSPECTIONS TESTS
  // ============================================================================
  describe('Inspections', () => {
    describe('getInspections', () => {
      it('should fetch inspections with pagination', async () => {
        const mockResponse = {
          content: [
            {
              id: VALID_UUID,
              inspectorName: 'John Smith',
              status: InspectionStatus.SCHEDULED,
              scheduledDate: TODAY_DATE,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getInspections({ page: 0, size: 20 });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.inspections, {
          params: expect.objectContaining({ page: 0, size: 20 }),
        });
        expect(result.data).toEqual(mockResponse);
      });

      it('should fetch inspections with status filter', async () => {
        const mockResponse = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        await complianceService.getInspections({
          status: InspectionStatus.SCHEDULED,
          page: 0,
          size: 20,
        });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.inspections, {
          params: expect.objectContaining({
            status: InspectionStatus.SCHEDULED,
            page: 0,
            size: 20,
          }),
        });
      });
    });

    describe('getInspectionById', () => {
      it('should fetch a specific inspection', async () => {
        const mockResponse = {
          id: VALID_UUID,
          inspectorName: 'John Smith',
          status: InspectionStatus.SCHEDULED,
          scheduledDate: TODAY_DATE,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getInspectionById(VALID_UUID);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`${API_PATHS.inspections}/${VALID_UUID}`);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('createInspection', () => {
      it('should create a new inspection', async () => {
        const mockResponse = {
          id: VALID_UUID,
          complianceScheduleId: VALID_UUID,
          inspectorName: 'John Smith',
          status: InspectionStatus.SCHEDULED,
          scheduledDate: TODAY_DATE,
        };

        mockedApiClient.post.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const inspectionData = {
          complianceScheduleId: VALID_UUID,
          propertyId: VALID_UUID,
          inspectorName: 'John Smith',
          scheduledDate: TODAY_DATE,
        };

        const result = await complianceService.createInspection(inspectionData);

        expect(mockedApiClient.post).toHaveBeenCalledWith(API_PATHS.inspections, inspectionData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateInspection', () => {
      it('should update inspection results using FormData', async () => {
        const mockResponse = {
          id: VALID_UUID,
          status: InspectionStatus.PASSED,
          result: InspectionResult.PASSED,
          inspectionDate: TODAY_DATE,
        };

        mockedApiClient.put.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const updateData = {
          status: InspectionStatus.PASSED,
          result: InspectionResult.PASSED,
          inspectionDate: TODAY_DATE,
        };

        const result = await complianceService.updateInspection(VALID_UUID, updateData);

        // Service uses FormData for file upload support
        expect(mockedApiClient.put).toHaveBeenCalledWith(
          `${API_PATHS.inspections}/${VALID_UUID}`,
          expect.any(FormData),
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // ============================================================================
  // VIOLATIONS TESTS
  // ============================================================================
  describe('Violations', () => {
    describe('getViolations', () => {
      it('should fetch violations with pagination', async () => {
        const mockResponse = {
          content: [
            {
              id: VALID_UUID,
              violationNumber: 'VIO-2025-0001',
              description: 'Fire safety violation',
              fineStatus: FineStatus.PENDING,
            },
          ],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getViolations({ page: 0, size: 20 });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.violations, {
          params: expect.objectContaining({ page: 0, size: 20 }),
        });
        expect(result.data).toEqual(mockResponse);
      });

      it('should fetch violations with fine status filter', async () => {
        const mockResponse = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        await complianceService.getViolations({
          fineStatus: FineStatus.PAID,
          page: 0,
          size: 20,
        });

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.violations, {
          params: expect.objectContaining({
            fineStatus: FineStatus.PAID,
            page: 0,
            size: 20,
          }),
        });
      });
    });

    describe('getViolationById', () => {
      it('should fetch a specific violation', async () => {
        const mockResponse = {
          id: VALID_UUID,
          violationNumber: 'VIO-2025-0001',
          description: 'Fire safety violation',
          fineAmount: 5000,
          fineStatus: FineStatus.PENDING,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getViolationById(VALID_UUID);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`${API_PATHS.violations}/${VALID_UUID}`);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('createViolation', () => {
      it('should create a new violation', async () => {
        const mockResponse = {
          id: VALID_UUID,
          violationNumber: 'VIO-2025-0001',
          description: 'Fire safety equipment not up to code',
          fineAmount: 5000,
          fineStatus: FineStatus.PENDING,
        };

        mockedApiClient.post.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const violationData = {
          complianceScheduleId: VALID_UUID,
          violationDate: TODAY_DATE,
          description: 'Fire safety equipment not up to code',
          fineAmount: 5000,
          fineStatus: FineStatus.PENDING,
        };

        const result = await complianceService.createViolation(violationData);

        expect(mockedApiClient.post).toHaveBeenCalledWith(API_PATHS.violations, violationData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateViolation', () => {
      it('should update a violation', async () => {
        const mockResponse = {
          id: VALID_UUID,
          fineStatus: FineStatus.PAID,
          resolutionDate: TODAY_DATE,
        };

        mockedApiClient.put.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const updateData = {
          fineStatus: FineStatus.PAID,
          resolutionDate: TODAY_DATE,
        };

        const result = await complianceService.updateViolation(VALID_UUID, updateData);

        expect(mockedApiClient.put).toHaveBeenCalledWith(
          `${API_PATHS.violations}/${VALID_UUID}`,
          updateData
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // ============================================================================
  // DASHBOARD TESTS
  // ============================================================================
  describe('Dashboard', () => {
    describe('getDashboard', () => {
      it('should fetch compliance dashboard data', async () => {
        const mockResponse = {
          totalRequirements: 10,
          activeRequirements: 8,
          upcomingSchedules: 5,
          overdueSchedules: 2,
          scheduledInspections: 3,
          openViolations: 1,
        };

        mockedApiClient.get.mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await complianceService.getDashboard();

        expect(mockedApiClient.get).toHaveBeenCalledWith(API_PATHS.dashboard);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset all mocks before each error handling test
      jest.resetAllMocks();
    });

    it('should propagate API errors for createRequirement', async () => {
      const errorMessage = 'Server error';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(complianceService.createRequirement({} as any)).rejects.toThrow(errorMessage);
    });

    it('should propagate API errors for getRequirements', async () => {
      const errorMessage = 'Network error';
      mockedApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(complianceService.getRequirements({ page: 0, size: 20 })).rejects.toThrow(errorMessage);
    });

    it('should propagate API errors for createInspection', async () => {
      const errorMessage = 'Validation error';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(complianceService.createInspection({} as any)).rejects.toThrow(errorMessage);
    });

    it('should propagate API errors for createViolation', async () => {
      const errorMessage = 'Authorization error';
      mockedApiClient.post.mockRejectedValue(new Error(errorMessage));

      await expect(complianceService.createViolation({} as any)).rejects.toThrow(errorMessage);
    });
  });
});
