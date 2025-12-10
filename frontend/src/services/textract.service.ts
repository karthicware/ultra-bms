/**
 * Textract Service
 * SCP-2025-12-10: Handles cheque image OCR processing using AWS Textract
 * Story 3.10: Added identity document (passport, Emirates ID) OCR processing
 */

import { apiClient } from '@/lib/api';

// ===========================
// Types
// ===========================

export enum ChequeProcessingStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

export enum OverallStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
}

// Story 3.10: Identity Document OCR Types
export enum IdentityDocumentType {
  PASSPORT = 'PASSPORT',
  EMIRATES_ID = 'EMIRATES_ID',
}

export enum IdentityProcessingStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

export enum IdentityOverallStatus {
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
}

export interface IdentityDocumentDetail {
  documentType: IdentityDocumentType;
  documentNumber?: string;
  expiryDate?: string; // ISO date string (yyyy-MM-dd)
  nationality?: string;
  fullName?: string;
  dateOfBirth?: string; // ISO date string (yyyy-MM-dd)
  confidenceScore: number;
  status: IdentityProcessingStatus;
  errorMessage?: string;
}

export interface ProcessIdentityDocumentsResponse {
  passportDetails?: IdentityDocumentDetail;
  emiratesIdDetails?: IdentityDocumentDetail;
  overallStatus: IdentityOverallStatus;
  message: string;
}

export interface ChequeDetail {
  chequeIndex: number;
  fileName?: string;
  bankName?: string;
  chequeNumber?: string;
  amount?: number;
  chequeDate?: string; // ISO date string
  payTo?: string;
  chequeFrom?: string;
  rawText?: string;
  status: ChequeProcessingStatus;
  errorMessage?: string;
  confidenceScore: number;
}

export interface ProcessChequesResponse {
  cheques: ChequeDetail[];
  totalAmount: number;
  expectedChequeCount: number;
  uploadedChequeCount: number;
  successfulCount: number;
  failedCount: number;
  overallStatus: OverallStatus;
  validationMessage: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ===========================
// API Functions
// ===========================

/**
 * Process cheque images using AWS Textract OCR
 *
 * @param chequeImages Array of cheque image files (JPEG, PNG)
 * @param quotationId Quotation ID for cheque count validation
 * @returns ProcessChequesResponse with extracted cheque details
 */
export async function processChequeImages(
  chequeImages: File[],
  quotationId: string
): Promise<ProcessChequesResponse> {
  const formData = new FormData();

  // Append each cheque image
  chequeImages.forEach((file) => {
    formData.append('chequeImages', file);
  });

  // Append quotation ID
  formData.append('quotationId', quotationId);

  const response = await apiClient.post<ApiResponse<ProcessChequesResponse>>(
    '/v1/textract/process-cheques',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}

/**
 * Process identity documents (passport and/or Emirates ID) using AWS Textract OCR
 * Story 3.10: Identity document OCR for quotation creation
 *
 * @param passportFront Passport front image (optional)
 * @param passportBack Passport back image (optional)
 * @param emiratesIdFront Emirates ID front image (optional)
 * @param emiratesIdBack Emirates ID back image (optional)
 * @returns ProcessIdentityDocumentsResponse with extracted identity details
 */
export async function processIdentityDocuments(
  passportFront?: File,
  passportBack?: File,
  emiratesIdFront?: File,
  emiratesIdBack?: File
): Promise<ProcessIdentityDocumentsResponse> {
  const formData = new FormData();

  // Append files if provided
  if (passportFront) {
    formData.append('passportFront', passportFront);
  }
  if (passportBack) {
    formData.append('passportBack', passportBack);
  }
  if (emiratesIdFront) {
    formData.append('emiratesIdFront', emiratesIdFront);
  }
  if (emiratesIdBack) {
    formData.append('emiratesIdBack', emiratesIdBack);
  }

  const response = await apiClient.post<ApiResponse<ProcessIdentityDocumentsResponse>>(
    '/v1/textract/process-identity-documents',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}
