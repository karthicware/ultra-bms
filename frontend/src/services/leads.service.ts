/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lead Management API Service
 * All lead management-related API calls
 */

import { apiClient } from '@/lib/api';
import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadSearchParams,
  LeadResponse,
  LeadListResponse,
  LeadDocument,
  LeadDocumentResponse,
  LeadDocumentListResponse,
  LeadHistory,
  LeadHistoryResponse,
  LeadDocumentType,
} from '@/types';

const LEADS_BASE_PATH = '/v1/leads';

/**
 * Create a new lead in the system
 *
 * @param data - Lead creation data
 * @param data.fullName - Full name of the lead (2-200 characters)
 * @param data.emiratesId - Emirates ID in format XXX-XXXX-XXXXXXX-X (must be unique)
 * @param data.passportNumber - Passport number (must be unique)
 * @param data.passportExpiryDate - Passport expiry date (must be future date)
 * @param data.homeCountry - Home country of the lead
 * @param data.email - Email address (valid format)
 * @param data.contactNumber - Contact number in E.164 format (+971XXXXXXXXX)
 * @param data.leadSource - Source of the lead (WEBSITE, REFERRAL, WALK_IN, etc.)
 * @param data.notes - Optional notes about the lead (max 1000 characters)
 *
 * @returns Promise that resolves to the created Lead object with auto-generated leadNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When Emirates ID or passport number already exists (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const lead = await createLead({
 *   fullName: 'Ahmed Hassan',
 *   emiratesId: '784-1234-1234567-1',
 *   passportNumber: 'AB1234567',
 *   passportExpiryDate: '2026-12-31',
 *   homeCountry: 'United Arab Emirates',
 *   email: 'ahmed@example.com',
 *   contactNumber: '+971501234567',
 *   leadSource: 'WEBSITE',
 *   notes: 'Looking for 2 BHK apartment'
 * });
 * console.log(lead.leadNumber); // "LEAD-20251115-0001"
 * ```
 */
export async function createLead(data: CreateLeadRequest): Promise<Lead> {
  const response = await apiClient.post<LeadResponse>(LEADS_BASE_PATH, data);
  return response.data.data;
}

/**
 * Get paginated list of leads with filters and search
 *
 * @param params - Search and filter parameters
 * @param params.page - Page number (default: 0)
 * @param params.size - Page size (default: 20)
 * @param params.sort - Sort field
 * @param params.direction - Sort direction (ASC or DESC)
 * @param params.status - Array of lead statuses to filter by
 * @param params.leadSource - Array of lead sources to filter by
 * @param params.searchTerm - Search term for full name, email, contact number, or lead number
 * @param params.dateFrom - Filter leads created after this date
 * @param params.dateTo - Filter leads created before this date
 *
 * @returns Promise that resolves to paginated lead list with metadata
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all NEW leads from WEBSITE
 * const leads = await getLeads({
 *   status: ['NEW'],
 *   leadSource: ['WEBSITE'],
 *   page: 0,
 *   size: 20
 * });
 *
 * // Search for leads by name
 * const searchResults = await getLeads({
 *   searchTerm: 'Ahmed',
 *   page: 0,
 *   size: 20
 * });
 * ```
 */
export async function getLeads(params: LeadSearchParams = {}): Promise<LeadListResponse> {
  const response = await apiClient.get<LeadListResponse>(LEADS_BASE_PATH, {
    params: {
      page: params.page || 0,
      size: params.size || 20,
      sortBy: params.sort,
      sortDir: params.direction,
      status: params.status?.[0], // Backend expects single enum value, not array
      source: params.leadSource?.[0], // Backend expects single enum value, not array
      search: params.searchTerm,
    },
  });
  return response.data;
}

/**
 * Get a single lead by ID
 *
 * @param id - Lead UUID
 * @returns Promise that resolves to the Lead object
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const lead = await getLeadById('123e4567-e89b-12d3-a456-426614174000');
 * console.log(lead.fullName); // "Ahmed Hassan"
 * console.log(lead.status); // "NEW"
 * ```
 */
export async function getLeadById(id: string): Promise<Lead> {
  const response = await apiClient.get<LeadResponse>(`${LEADS_BASE_PATH}/${id}`);
  return response.data.data;
}

/**
 * Update an existing lead's information
 *
 * @param id - Lead UUID
 * @param data - Fields to update (all fields are optional)
 * @param data.fullName - Updated full name
 * @param data.email - Updated email address
 * @param data.contactNumber - Updated contact number
 * @param data.notes - Updated notes
 *
 * @returns Promise that resolves to the updated Lead object
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const updatedLead = await updateLead('lead-id', {
 *   fullName: 'Ahmed Hassan Updated',
 *   email: 'ahmed.updated@example.com',
 *   notes: 'Updated requirements: 3 BHK now'
 * });
 * ```
 */
export async function updateLead(id: string, data: UpdateLeadRequest): Promise<Lead> {
  const response = await apiClient.put<LeadResponse>(`${LEADS_BASE_PATH}/${id}`, data);
  return response.data.data;
}

/**
 * Delete a lead from the system
 *
 * WARNING: This action cannot be undone. All associated data (documents, history) will be deleted.
 *
 * @param id - Lead UUID
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * await deleteLead('lead-id');
 * console.log('Lead deleted successfully');
 * ```
 */
export async function deleteLead(id: string): Promise<void> {
  await apiClient.delete(`${LEADS_BASE_PATH}/${id}`);
}

/**
 * Upload a document for a lead
 *
 * @param leadId - Lead UUID
 * @param file - File to upload (max 5MB, PDF/JPG/JPEG/PNG)
 * @param documentType - Type of document (EMIRATES_ID, PASSPORT, VISA, SALARY_CERTIFICATE, BANK_STATEMENT, OTHER)
 *
 * @returns Promise that resolves to the uploaded document metadata
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {ValidationException} When file is empty, too large, or invalid type (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'emirates-id.pdf', { type: 'application/pdf' });
 * const document = await uploadDocument('lead-id', file, 'EMIRATES_ID');
 * console.log(document.fileName); // "emirates-id.pdf"
 * console.log(document.fileSize); // 102400
 * ```
 */
export async function uploadDocument(
  leadId: string,
  file: File,
  documentType: LeadDocumentType
): Promise<LeadDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await apiClient.post<LeadDocumentResponse>(
    `${LEADS_BASE_PATH}/${leadId}/documents`,
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
 * Get all documents for a lead
 *
 * @param leadId - Lead UUID
 * @returns Promise that resolves to array of document metadata
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const documents = await getLeadDocuments('lead-id');
 * documents.forEach(doc => {
 *   console.log(`${doc.documentType}: ${doc.fileName}`);
 * });
 * ```
 */
export async function getLeadDocuments(leadId: string): Promise<LeadDocument[]> {
  const response = await apiClient.get<LeadDocumentListResponse>(
    `${LEADS_BASE_PATH}/${leadId}/documents`
  );
  return response.data.data;
}

/**
 * Delete a document from a lead
 *
 * @param leadId - Lead UUID
 * @param documentId - Document UUID
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {NotFoundException} When lead or document is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * await deleteDocument('lead-id', 'doc-id');
 * console.log('Document deleted successfully');
 * ```
 */
export async function deleteDocument(leadId: string, documentId: string): Promise<void> {
  await apiClient.delete(`${LEADS_BASE_PATH}/${leadId}/documents/${documentId}`);
}

/**
 * Download a document as a blob
 *
 * Use this to programmatically download documents. For user-initiated downloads,
 * create a URL from the blob and trigger a download.
 *
 * @param leadId - Lead UUID
 * @param documentId - Document UUID
 * @returns Promise that resolves to the document file as a Blob
 *
 * @throws {NotFoundException} When lead or document is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Download and trigger browser download
 * const blob = await downloadDocument('lead-id', 'doc-id');
 * const url = window.URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'emirates-id.pdf';
 * a.click();
 * window.URL.revokeObjectURL(url);
 * ```
 */
export async function downloadDocument(leadId: string, documentId: string): Promise<Blob> {
  try {
    console.log('[DOWNLOAD] Starting download:', { leadId, documentId });
    const response = await apiClient.get<Blob>(
      `${LEADS_BASE_PATH}/${leadId}/documents/${documentId}/download`,
      {
        responseType: 'blob',
      }
    );
    console.log('[DOWNLOAD] Success:', {
      status: response.status,
      contentType: response.headers['content-type'],
      size: response.data.size
    });
    return response.data;
  } catch (error: any) {
    console.error('[DOWNLOAD] Error details:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config,
      error: error,
    });
    throw error;
  }
}

/**
 * Get activity history for a lead
 *
 * Returns chronological history of all events related to the lead including:
 * - Lead creation
 * - Status changes
 * - Document uploads
 * - Quotation creation/sending
 * - Lead updates
 *
 * @param leadId - Lead UUID
 * @returns Promise that resolves to array of history entries (most recent first)
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const history = await getLeadHistory('lead-id');
 * history.forEach(entry => {
 *   console.log(`${entry.createdAt}: ${entry.eventType} - ${entry.description}`);
 * });
 * // Output:
 * // 2025-11-15T13:00:00Z: STATUS_CHANGE - Status changed from NEW to CONTACTED
 * // 2025-11-15T10:00:00Z: CREATED - Lead created
 * ```
 */
export async function getLeadHistory(leadId: string): Promise<LeadHistory[]> {
  const response = await apiClient.get<LeadHistoryResponse>(`${LEADS_BASE_PATH}/${leadId}/history`);
  return response.data.data.content;
}

/**
 * Update the status of a lead
 *
 * Valid status transitions:
 * - NEW → CONTACTED → QUOTATION_SENT → ACCEPTED → CONVERTED
 * - Any status → LOST
 *
 * Status change is automatically tracked in lead history.
 *
 * @param id - Lead UUID
 * @param status - New status (NEW, CONTACTED, QUOTATION_SENT, ACCEPTED, CONVERTED, LOST)
 * @returns Promise that resolves to the updated Lead object
 *
 * @throws {NotFoundException} When lead is not found (404)
 * @throws {ValidationException} When status is invalid (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const updatedLead = await updateLeadStatus('lead-id', 'CONTACTED');
 * console.log(updatedLead.status); // "CONTACTED"
 * ```
 */
export async function updateLeadStatus(id: string, status: string): Promise<Lead> {
  const response = await apiClient.patch<LeadResponse>(`${LEADS_BASE_PATH}/${id}/status`, {
    status,
  });
  return response.data.data;
}

/**
 * Calculate the number of days a lead has been in the pipeline
 *
 * This is a utility function that calculates the difference between the lead's
 * creation date and today.
 *
 * @param createdAt - ISO 8601 date string of when the lead was created
 * @returns Number of days the lead has been in the pipeline
 *
 * @example
 * ```typescript
 * const days = calculateDaysInPipeline('2025-11-01T10:00:00Z');
 * console.log(`Lead has been in pipeline for ${days} days`);
 * // Output: "Lead has been in pipeline for 14 days"
 * ```
 */
export function calculateDaysInPipeline(createdAt: string): number {
  const created = new Date(createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
