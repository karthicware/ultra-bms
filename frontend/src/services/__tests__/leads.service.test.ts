/**
 * Unit tests for Lead Service
 * Tests API integration for lead management operations
 */

import {
  createLead,
  getLead by,
  getLeads,
  updateLead,
  uploadDocument,
  deleteDocument,
  downloadDocument,
  getLeadHistory,
  deleteLead,
} from '../leads.service';
import { apiClient } from '@/lib/api';
import { LeadSource, LeadStatus, DocumentType } from '@/types';

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

describe('Lead Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a new lead successfully', async () => {
      const mockLead = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        leadNumber: 'LEAD-20251115-0001',
        fullName: 'Ahmed Hassan',
        emiratesId: '784-1234-1234567-1',
        passportNumber: 'AB1234567',
        passportExpiryDate: '2026-12-31',
        homeCountry: 'United Arab Emirates',
        email: 'ahmed@example.com',
        contactNumber: '+971501234567',
        leadSource: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        createdAt: '2025-11-15T10:00:00Z',
        updatedAt: '2025-11-15T10:00:00Z',
        createdBy: 'user-id',
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockLead },
      });

      const leadData = {
        fullName: 'Ahmed Hassan',
        emiratesId: '784-1234-1234567-1',
        passportNumber: 'AB1234567',
        passportExpiryDate: '2026-12-31',
        homeCountry: 'United Arab Emirates',
        email: 'ahmed@example.com',
        contactNumber: '+971501234567',
        leadSource: LeadSource.WEBSITE,
      };

      const result = await createLead(leadData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/leads', leadData);
      expect(result).toEqual(mockLead);
    });

    it('should throw error when API call fails', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(createLead({} as any)).rejects.toThrow('API Error');
    });
  });

  describe('getLeadById', () => {
    it('should fetch lead by ID successfully', async () => {
      const mockLead = {
        id: 'lead-123',
        leadNumber: 'LEAD-20251115-0001',
        fullName: 'Ahmed Hassan',
        status: LeadStatus.NEW,
      };

      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockLead },
      });

      const result = await getLeadById('lead-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/leads/lead-123');
      expect(result).toEqual(mockLead);
    });
  });

  describe('getLeads', () => {
    it('should fetch leads with filters successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [
            { id: 'lead-1', leadNumber: 'LEAD-0001' },
            { id: 'lead-2', leadNumber: 'LEAD-0002' },
          ],
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 20,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getLeads({
        status: LeadStatus.NEW,
        page: 0,
        size: 20,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/leads', {
        params: expect.objectContaining({
          status: 'NEW',
          page: 0,
          size: 20,
        }),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch leads with search query', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 20,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      await getLeads({ search: 'Ahmed' });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/leads', {
        params: expect.objectContaining({
          search: 'Ahmed',
        }),
      });
    });
  });

  describe('updateLead', () => {
    it('should update lead successfully', async () => {
      const mockUpdatedLead = {
        id: 'lead-123',
        leadNumber: 'LEAD-0001',
        fullName: 'Updated Name',
        email: 'updated@example.com',
      };

      mockedApiClient.put.mockResolvedValueOnce({
        data: { success: true, data: mockUpdatedLead },
      });

      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      };

      const result = await updateLead('lead-123', updateData);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/v1/leads/lead-123', updateData);
      expect(result).toEqual(mockUpdatedLead);
    });
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const mockFile = new File(['content'], 'emirates-id.pdf', { type: 'application/pdf' });
      const mockDocument = {
        id: 'doc-123',
        leadId: 'lead-123',
        documentType: DocumentType.EMIRATES_ID,
        fileName: 'emirates-id.pdf',
        fileSize: 1024,
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockDocument },
      });

      const result = await uploadDocument('lead-123', mockFile, DocumentType.EMIRATES_ID);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/v1/leads/lead-123/documents',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockDocument);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      await deleteDocument('lead-123', 'doc-123');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/v1/leads/lead-123/documents/doc-123');
    });
  });

  describe('downloadDocument', () => {
    it('should download document as blob', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      mockedApiClient.get.mockResolvedValueOnce({ data: mockBlob });

      const result = await downloadDocument('lead-123', 'doc-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/v1/leads/lead-123/documents/doc-123/download',
        { responseType: 'blob' }
      );
      expect(result).toEqual(mockBlob);
    });
  });

  describe('getLeadHistory', () => {
    it('should fetch lead history successfully', async () => {
      const mockHistory = [
        {
          id: 'hist-1',
          leadId: 'lead-123',
          eventType: 'CREATED',
          createdAt: '2025-11-15T10:00:00Z',
        },
      ];

      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistory },
      });

      const result = await getLeadHistory('lead-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/leads/lead-123/history', {
        params: { page: 0, size: 100 },
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('deleteLead', () => {
    it('should delete lead successfully', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      await deleteLead('lead-123');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/v1/leads/lead-123');
    });
  });
});
