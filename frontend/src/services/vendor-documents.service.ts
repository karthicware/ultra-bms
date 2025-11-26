/**
 * Vendor Document API Service
 * Story 5.2: Vendor Document and License Management
 *
 * All vendor document-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  VendorDocument,
  VendorDocumentListItem,
  ExpiringDocument,
  UploadDocumentResponse,
  VendorDocumentsResponse,
  GetDocumentResponse,
  ExpiringDocumentsResponse
} from '@/types/vendor-documents';

const VENDORS_BASE_PATH = '/v1/vendors';

// ============================================================================
// UPLOAD DOCUMENT
// ============================================================================

/**
 * Upload a document for a vendor
 *
 * @param vendorId - Vendor UUID
 * @param formData - FormData containing file and metadata (documentType, expiryDate, notes)
 * @param onUploadProgress - Optional callback for tracking upload progress
 *
 * @returns Promise that resolves to the created VendorDocument
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR role (403)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('documentType', 'TRADE_LICENSE');
 * formData.append('expiryDate', '2025-12-31');
 * formData.append('notes', 'Annual renewal');
 *
 * const document = await uploadDocument(vendorId, formData, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 * ```
 */
export async function uploadDocument(
  vendorId: string,
  formData: FormData,
  onUploadProgress?: (progress: number) => void
): Promise<VendorDocument> {
  const response = await apiClient.post<UploadDocumentResponse>(
    `${VENDORS_BASE_PATH}/${vendorId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress(progress);
            }
          }
        : undefined
    }
  );
  return response.data.data;
}

// ============================================================================
// GET VENDOR DOCUMENTS
// ============================================================================

/**
 * Get all documents for a vendor
 *
 * @param vendorId - Vendor UUID
 *
 * @returns Promise that resolves to list of VendorDocumentListItem sorted by uploadedAt DESC
 *
 * @throws {EntityNotFoundException} When vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const documents = await getDocuments(vendorId);
 * documents.forEach(doc => {
 *   console.log(`${doc.fileName}: ${doc.expiryStatus}`);
 * });
 * ```
 */
export async function getDocuments(vendorId: string): Promise<VendorDocumentListItem[]> {
  const response = await apiClient.get<VendorDocumentsResponse>(
    `${VENDORS_BASE_PATH}/${vendorId}/documents`
  );
  return response.data.data;
}

// ============================================================================
// GET DOCUMENT BY ID (WITH DOWNLOAD URL)
// ============================================================================

/**
 * Get document by ID with presigned download URL
 *
 * @param vendorId - Vendor UUID
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to document with presigned download URL
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const docInfo = await getDocumentById(vendorId, documentId);
 * window.open(docInfo.downloadUrl, '_blank'); // Open in new tab
 * ```
 */
export async function getDocumentById(
  vendorId: string,
  documentId: string
): Promise<GetDocumentResponse['data']> {
  const response = await apiClient.get<GetDocumentResponse>(
    `${VENDORS_BASE_PATH}/${vendorId}/documents/${documentId}`
  );
  return response.data.data;
}

// ============================================================================
// REPLACE DOCUMENT
// ============================================================================

/**
 * Replace an existing document with a new file
 *
 * Previous file is retained in S3 (versioning pattern).
 *
 * @param vendorId - Vendor UUID
 * @param documentId - Document UUID to replace
 * @param formData - FormData containing new file and updated metadata
 * @param onUploadProgress - Optional callback for tracking upload progress
 *
 * @returns Promise that resolves to the updated VendorDocument
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', newFile);
 * formData.append('expiryDate', '2026-12-31');
 *
 * const updatedDoc = await replaceDocument(vendorId, documentId, formData);
 * ```
 */
export async function replaceDocument(
  vendorId: string,
  documentId: string,
  formData: FormData,
  onUploadProgress?: (progress: number) => void
): Promise<VendorDocument> {
  const response = await apiClient.put<UploadDocumentResponse>(
    `${VENDORS_BASE_PATH}/${vendorId}/documents/${documentId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress(progress);
            }
          }
        : undefined
    }
  );
  return response.data.data;
}

// ============================================================================
// DELETE DOCUMENT
// ============================================================================

/**
 * Delete a vendor document
 *
 * Database record is deleted but file is retained in S3 for audit purposes.
 *
 * @param vendorId - Vendor UUID
 * @param documentId - Document UUID to delete
 *
 * @returns Promise that resolves when deletion succeeds (204 No Content)
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await deleteDocument(vendorId, documentId);
 * console.log('Document deleted successfully');
 * ```
 */
export async function deleteDocument(
  vendorId: string,
  documentId: string
): Promise<void> {
  await apiClient.delete(`${VENDORS_BASE_PATH}/${vendorId}/documents/${documentId}`);
}

// ============================================================================
// GET EXPIRING DOCUMENTS
// ============================================================================

/**
 * Get all documents expiring within specified days
 *
 * @param days - Days until expiry threshold (default 30)
 *
 * @returns Promise that resolves to list of expiring documents with vendor info
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get documents expiring in next 30 days (default)
 * const expiring = await getExpiringDocuments();
 *
 * // Get documents expiring in next 7 days
 * const urgent = await getExpiringDocuments(7);
 *
 * expiring.forEach(doc => {
 *   console.log(`${doc.companyName}: ${doc.documentType} expires in ${doc.daysUntilExpiry} days`);
 * });
 * ```
 */
export async function getExpiringDocuments(days: number = 30): Promise<ExpiringDocument[]> {
  const response = await apiClient.get<ExpiringDocumentsResponse>(
    `${VENDORS_BASE_PATH}/expiring-documents`,
    { params: { days } }
  );
  return response.data.data;
}

// ============================================================================
// DOWNLOAD DOCUMENT
// ============================================================================

/**
 * Get download URL and trigger file download
 *
 * Gets presigned URL from backend and opens in new tab (for view)
 * or triggers download (for download action)
 *
 * @param vendorId - Vendor UUID
 * @param documentId - Document UUID
 * @param action - 'view' opens in new tab, 'download' triggers file download
 *
 * @returns Promise that resolves to the download URL
 *
 * @example
 * ```typescript
 * // View document in new tab
 * await downloadDocument(vendorId, documentId, 'view');
 *
 * // Download document
 * await downloadDocument(vendorId, documentId, 'download');
 * ```
 */
export async function downloadDocument(
  vendorId: string,
  documentId: string,
  action: 'view' | 'download' = 'view'
): Promise<string> {
  const docInfo = await getDocumentById(vendorId, documentId);

  if (action === 'view') {
    // Open in new tab
    window.open(docInfo.downloadUrl, '_blank');
  } else {
    // Trigger download
    const link = document.createElement('a');
    link.href = docInfo.downloadUrl;
    link.download = docInfo.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return docInfo.downloadUrl;
}

// ============================================================================
// VENDOR DOCUMENTS SERVICE OBJECT
// ============================================================================

/**
 * Vendor documents service object with all methods
 * Allows both named imports and object-style access
 */
export const vendorDocumentsService = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  replaceDocument,
  deleteDocument,
  getExpiringDocuments,
  downloadDocument
};
