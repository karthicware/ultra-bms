/**
 * Unit tests for Textract Service
 * Story 3.10: Tests identity document OCR processing
 */

import {
  processIdentityDocuments,
  IdentityOverallStatus,
  IdentityProcessingStatus,
  IdentityDocumentType,
} from '../textract.service';
import { apiClient } from '@/lib/api';

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

describe('Textract Service - Identity Document Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock files
  const createMockFile = (name: string, type: string = 'image/jpeg'): File => {
    return new File(['fake content'], name, { type });
  };

  describe('processIdentityDocuments', () => {
    it('should process passport document successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Documents processed successfully',
          data: {
            passportDetails: {
              documentType: IdentityDocumentType.PASSPORT,
              documentNumber: 'AB1234567',
              expiryDate: '2030-12-15',
              nationality: 'British',
              fullName: 'John Smith',
              dateOfBirth: '1985-06-15',
              confidenceScore: 85.0,
              status: IdentityProcessingStatus.SUCCESS,
            },
            emiratesIdDetails: null,
            overallStatus: IdentityOverallStatus.SUCCESS,
            message: 'All documents processed successfully. Please verify the extracted details.',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('passport_front.jpg');
      const result = await processIdentityDocuments(passportFront);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/v1/textract/process-identity-documents',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result.passportDetails).toBeDefined();
      expect(result.passportDetails?.documentNumber).toBe('AB1234567');
      expect(result.passportDetails?.nationality).toBe('British');
      expect(result.overallStatus).toBe(IdentityOverallStatus.SUCCESS);
    });

    it('should process Emirates ID document successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Documents processed successfully',
          data: {
            passportDetails: null,
            emiratesIdDetails: {
              documentType: IdentityDocumentType.EMIRATES_ID,
              documentNumber: '784-1990-1234567-8',
              expiryDate: '2027-08-15',
              fullName: 'Ahmed Mohammed',
              dateOfBirth: '1990-01-15',
              confidenceScore: 90.0,
              status: IdentityProcessingStatus.SUCCESS,
            },
            overallStatus: IdentityOverallStatus.SUCCESS,
            message: 'All documents processed successfully.',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const emiratesIdFront = createMockFile('emirates_front.jpg');
      const result = await processIdentityDocuments(undefined, undefined, emiratesIdFront);

      expect(result.emiratesIdDetails).toBeDefined();
      expect(result.emiratesIdDetails?.documentNumber).toBe('784-1990-1234567-8');
      expect(result.overallStatus).toBe(IdentityOverallStatus.SUCCESS);
    });

    it('should process both passport and Emirates ID together', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Documents processed successfully',
          data: {
            passportDetails: {
              documentType: IdentityDocumentType.PASSPORT,
              documentNumber: 'UK9876543',
              expiryDate: '2031-03-20',
              nationality: 'British',
              fullName: 'James Wilson',
              dateOfBirth: '1988-11-25',
              confidenceScore: 80.0,
              status: IdentityProcessingStatus.SUCCESS,
            },
            emiratesIdDetails: {
              documentType: IdentityDocumentType.EMIRATES_ID,
              documentNumber: '784-1988-5555555-5',
              expiryDate: '2028-03-20',
              fullName: 'James Wilson',
              dateOfBirth: '1988-11-25',
              confidenceScore: 85.0,
              status: IdentityProcessingStatus.SUCCESS,
            },
            overallStatus: IdentityOverallStatus.SUCCESS,
            message: 'All documents processed successfully.',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('passport.jpg');
      const emiratesIdFront = createMockFile('emirates.jpg');
      const result = await processIdentityDocuments(passportFront, undefined, emiratesIdFront);

      expect(result.passportDetails).toBeDefined();
      expect(result.emiratesIdDetails).toBeDefined();
      expect(result.overallStatus).toBe(IdentityOverallStatus.SUCCESS);
    });

    it('should handle partial success when some fields missing', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Some fields could not be extracted',
          data: {
            passportDetails: {
              documentType: IdentityDocumentType.PASSPORT,
              documentNumber: 'FR1234567',
              expiryDate: null, // Missing
              nationality: null, // Missing
              fullName: null, // Missing
              dateOfBirth: null, // Missing
              confidenceScore: 25.0,
              status: IdentityProcessingStatus.PARTIAL,
              errorMessage: 'Some fields could not be extracted. Please verify and complete.',
            },
            emiratesIdDetails: null,
            overallStatus: IdentityOverallStatus.PARTIAL_SUCCESS,
            message: 'Some fields could not be extracted. Please verify and complete missing details.',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('blurry_passport.jpg');
      const result = await processIdentityDocuments(passportFront);

      expect(result.passportDetails?.status).toBe(IdentityProcessingStatus.PARTIAL);
      expect(result.overallStatus).toBe(IdentityOverallStatus.PARTIAL_SUCCESS);
      expect(result.passportDetails?.confidenceScore).toBeLessThan(50);
    });

    it('should handle failed processing', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Failed to process documents',
          data: {
            passportDetails: {
              documentType: IdentityDocumentType.PASSPORT,
              documentNumber: null,
              expiryDate: null,
              nationality: null,
              fullName: null,
              dateOfBirth: null,
              confidenceScore: 0,
              status: IdentityProcessingStatus.FAILED,
              errorMessage: 'No text could be extracted from passport images',
            },
            emiratesIdDetails: null,
            overallStatus: IdentityOverallStatus.FAILED,
            message: 'Failed to process documents. Please enter details manually.',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('corrupt.jpg');
      const result = await processIdentityDocuments(passportFront);

      expect(result.passportDetails?.status).toBe(IdentityProcessingStatus.FAILED);
      expect(result.overallStatus).toBe(IdentityOverallStatus.FAILED);
    });

    it('should append all provided files to FormData', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            passportDetails: null,
            emiratesIdDetails: null,
            overallStatus: IdentityOverallStatus.SUCCESS,
            message: 'Processed',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('passport_front.jpg');
      const passportBack = createMockFile('passport_back.jpg');
      const emiratesIdFront = createMockFile('emirates_front.jpg');
      const emiratesIdBack = createMockFile('emirates_back.jpg');

      await processIdentityDocuments(passportFront, passportBack, emiratesIdFront, emiratesIdBack);

      const call = mockedApiClient.post.mock.calls[0];
      const formData = call[1] as FormData;

      expect(formData.get('passportFront')).toBeTruthy();
      expect(formData.get('passportBack')).toBeTruthy();
      expect(formData.get('emiratesIdFront')).toBeTruthy();
      expect(formData.get('emiratesIdBack')).toBeTruthy();
    });

    it('should not append undefined files to FormData', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            passportDetails: null,
            emiratesIdDetails: null,
            overallStatus: IdentityOverallStatus.SUCCESS,
            message: 'Processed',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('passport_front.jpg');

      await processIdentityDocuments(passportFront);

      const call = mockedApiClient.post.mock.calls[0];
      const formData = call[1] as FormData;

      expect(formData.get('passportFront')).toBeTruthy();
      expect(formData.get('passportBack')).toBeNull();
      expect(formData.get('emiratesIdFront')).toBeNull();
      expect(formData.get('emiratesIdBack')).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      const passportFront = createMockFile('passport.jpg');

      await expect(processIdentityDocuments(passportFront)).rejects.toThrow('Network error');
    });

    it('should use correct endpoint and content type', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            passportDetails: null,
            emiratesIdDetails: null,
            overallStatus: IdentityOverallStatus.SUCCESS,
            message: 'Processed',
          },
          timestamp: '2025-12-10T10:00:00Z',
        },
      };

      mockedApiClient.post.mockResolvedValueOnce(mockResponse);

      const passportFront = createMockFile('passport.jpg');
      await processIdentityDocuments(passportFront);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/v1/textract/process-identity-documents',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });
  });
});
