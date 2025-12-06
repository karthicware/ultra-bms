/**
 * Unit tests for Quotation Service
 * Tests API integration for quotation management and lead conversion
 */

import {
  createQuotation,
  getQuotationById,
  getQuotations,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  generateQuotationPdf,
  getQuotationDashboard,
  convertToTenant,
  deleteQuotation,
} from '../quotations.service';
import { apiClient } from '@/lib/api';
import { QuotationStatus, StayType } from '@/types';

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

describe('Quotation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuotation', () => {
    it('should create a new quotation successfully', async () => {
      const mockQuotation = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        quotationNumber: 'QUOT-20251115-0001',
        leadId: 'lead-123',
        propertyId: 'prop-123',
        unitId: 'unit-123',
        stayType: StayType.TWO_BHK,
        baseRent: 5000,
        totalFirstPayment: 12100,
        status: QuotationStatus.DRAFT,
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockQuotation },
      });

      // SCP-2025-12-04: Added required identity document fields
      const quotationData = {
        leadId: 'lead-123',
        propertyId: 'prop-123',
        unitId: 'unit-123',
        stayType: StayType.TWO_BHK,
        issueDate: '2025-11-15',
        validityDate: '2025-12-15',
        baseRent: 5000,
        serviceCharges: 500,
        parkingSpotId: 'parking-123', // SCP-2025-12-02: Changed from parkingSpots
        parkingFee: 200,
        securityDeposit: 5000,
        adminFee: 1000,
        documentRequirements: ['Emirates ID', 'Passport copy', 'Visa copy'],
        paymentTerms: 'Payment due on 1st',
        moveinProcedures: 'Complete inspection',
        cancellationPolicy: '30 days notice',
        // SCP-2025-12-04: Identity document fields
        emiratesIdNumber: '784-1234-5678901-1',
        emiratesIdExpiry: '2027-12-15',
        passportNumber: 'AB1234567',
        passportExpiry: '2030-12-15',
        nationality: 'United Kingdom',
      };

      const result = await createQuotation(quotationData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/quotations', quotationData);
      expect(result).toEqual(mockQuotation);
    });
  });

  describe('sendQuotation', () => {
    it('should send quotation successfully', async () => {
      const mockQuotation = {
        id: 'quot-123',
        quotationNumber: 'QUOT-0001',
        status: QuotationStatus.SENT,
        sentAt: '2025-11-15T10:00:00Z',
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockQuotation },
      });

      const result = await sendQuotation('quot-123');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/quotations/quot-123/send');
      expect(result).toEqual(mockQuotation);
    });
  });

  describe('acceptQuotation', () => {
    it('should accept quotation successfully', async () => {
      const mockQuotation = {
        id: 'quot-123',
        status: QuotationStatus.ACCEPTED,
        acceptedAt: '2025-11-15T11:00:00Z',
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: mockQuotation },
      });

      const result = await acceptQuotation('quot-123');

      expect(mockedApiClient.patch).toHaveBeenCalledWith('/v1/quotations/quot-123/status', {
        status: QuotationStatus.ACCEPTED,
      });
      expect(result).toEqual(mockQuotation);
    });
  });

  describe('rejectQuotation', () => {
    it('should reject quotation with reason successfully', async () => {
      const mockQuotation = {
        id: 'quot-123',
        status: QuotationStatus.REJECTED,
        rejectedAt: '2025-11-15T11:00:00Z',
        rejectionReason: 'Too expensive',
      };

      mockedApiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: mockQuotation },
      });

      const result = await rejectQuotation('quot-123', 'Too expensive');

      expect(mockedApiClient.patch).toHaveBeenCalledWith('/v1/quotations/quot-123/status', {
        status: QuotationStatus.REJECTED,
        rejectionReason: 'Too expensive',
      });
      expect(result).toEqual(mockQuotation);
    });
  });

  describe('generateQuotationPdf', () => {
    it('should generate and download PDF successfully', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      mockedApiClient.get.mockResolvedValueOnce({ data: mockBlob });

      const result = await generateQuotationPdf('quot-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/quotations/quot-123/pdf', {
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });
  });

  describe('getQuotationDashboard', () => {
    it('should fetch dashboard statistics successfully', async () => {
      const mockDashboard = {
        newLeads: 15,
        activeQuotes: 8,
        quotesExpiringSoon: 3,
        newQuotes: 12,
        quotesConverted: 5,
        conversionRate: 41.67,
      };

      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboard },
      });

      const result = await getQuotationDashboard();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/quotations/dashboard');
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('convertToTenant', () => {
    it('should convert lead to tenant successfully', async () => {
      // SCP-2025-12-02: Updated to use parkingSpotId instead of parkingSpots
      const mockConversionResponse = {
        leadId: 'lead-123',
        leadNumber: 'LEAD-20251115-0001',
        fullName: 'Ahmed Hassan',
        emiratesId: '784-1234-1234567-1',
        passportNumber: 'AB1234567',
        passportExpiryDate: '2026-12-31',
        homeCountry: 'United Arab Emirates',
        email: 'ahmed@example.com',
        contactNumber: '+971501234567',
        quotationId: 'quot-123',
        quotationNumber: 'QUOT-20251115-0001',
        propertyId: 'prop-123',
        unitId: 'unit-123',
        baseRent: 5000,
        serviceCharges: 500,
        parkingSpotId: 'parking-123',
        parkingFee: 200,
        securityDeposit: 5000,
        adminFee: 1000,
        totalFirstPayment: 12100,
        message: 'Lead LEAD-20251115-0001 successfully converted to tenant',
      };

      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, data: mockConversionResponse },
      });

      const result = await convertToTenant('quot-123');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/v1/quotations/quot-123/convert');
      expect(result).toEqual(mockConversionResponse);
      expect(result.message).toContain('converted to tenant');
    });

    it('should throw error when conversion fails', async () => {
      const error = new Error('Only ACCEPTED quotations can be converted');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).response = {
        data: { message: 'Only ACCEPTED quotations can be converted' },
      };
      mockedApiClient.post.mockRejectedValueOnce(error);

      await expect(convertToTenant('quot-123')).rejects.toThrow();
    });
  });

  describe('getQuotations', () => {
    it('should fetch quotations with filters successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: [
            { id: 'quot-1', quotationNumber: 'QUOT-0001', status: QuotationStatus.DRAFT },
            { id: 'quot-2', quotationNumber: 'QUOT-0002', status: QuotationStatus.SENT },
          ],
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 20,
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getQuotations({
        status: [QuotationStatus.DRAFT, QuotationStatus.SENT],
        page: 0,
        size: 20,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/quotations', {
        params: expect.objectContaining({
          status: 'DRAFT,SENT',
          page: 0,
          size: 20,
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch quotations for specific lead', async () => {
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

      await getQuotations({ leadId: 'lead-123' });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/v1/quotations', {
        params: expect.objectContaining({
          leadId: 'lead-123',
        }),
      });
    });
  });

  describe('deleteQuotation', () => {
    it('should delete quotation successfully', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      await deleteQuotation('quot-123');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/v1/quotations/quot-123');
    });
  });
});
