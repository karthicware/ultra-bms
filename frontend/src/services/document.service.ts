/**
 * Document API Service
 * Story 7.2: Document Management System
 *
 * All document-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  Document,
  DocumentListItem,
  DocumentVersion,
  ExpiringDocument,
  DocumentFilters,
  DocumentUpdate,
  DocumentEntityType,
  DocumentResponse,
  DocumentListResponse,
  DocumentDetailResponse,
  DocumentVersionsResponse,
  ExpiringDocumentsResponse,
  DownloadUrlResponse,
  PreviewUrlResponse
} from '@/types/document';

const DOCUMENTS_BASE_PATH = '/v1/documents';

// ============================================================================
// UPLOAD DOCUMENT
// ============================================================================

/**
 * Upload a new document
 *
 * @param formData - FormData containing file and metadata (documentType, title, description,
 *                   entityType, entityId, expiryDate, tags, accessLevel)
 * @param onUploadProgress - Optional callback for tracking upload progress
 *
 * @returns Promise that resolves to the created Document with documentNumber
 *
 * @throws {ValidationException} When file validation fails or required fields missing (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('documentType', 'Lease Agreement');
 * formData.append('title', 'Unit 101 Lease');
 * formData.append('entityType', 'PROPERTY');
 * formData.append('entityId', propertyId);
 * formData.append('accessLevel', 'PUBLIC');
 *
 * const document = await uploadDocument(formData, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 * ```
 */
export async function uploadDocument(
  formData: FormData,
  onUploadProgress?: (progress: number) => void
): Promise<Document> {
  const response = await apiClient.post<DocumentResponse>(
    DOCUMENTS_BASE_PATH,
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
// GET DOCUMENTS LIST
// ============================================================================

/**
 * Get paginated list of documents with optional filters
 *
 * @param filters - Optional filter parameters (entityType, entityId, documentType,
 *                  expiryStatus, accessLevel, tags, search, dateFrom, dateTo, page, size, sort)
 *
 * @returns Promise that resolves to paginated list of DocumentListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get all documents
 * const documents = await getDocuments();
 *
 * // Get documents for a specific property
 * const propertyDocs = await getDocuments({
 *   entityType: DocumentEntityType.PROPERTY,
 *   entityId: propertyId
 * });
 *
 * // Search documents
 * const searchResults = await getDocuments({
 *   search: 'lease agreement',
 *   page: 0,
 *   size: 20
 * });
 * ```
 */
export async function getDocuments(
  filters?: DocumentFilters
): Promise<{
  content: DocumentListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const params = filters ? {
    ...filters,
    tags: filters.tags?.join(',')
  } : {};

  const response = await apiClient.get<DocumentListResponse>(
    DOCUMENTS_BASE_PATH,
    { params }
  );
  return response.data.data;
}

// ============================================================================
// GET DOCUMENT BY ID
// ============================================================================

/**
 * Get document details by ID
 *
 * Includes entity name, version count, and presigned URLs
 *
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to full Document with all details
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When accessLevel restrictions apply (403)
 *
 * @example
 * ```typescript
 * const document = await getDocument(documentId);
 * console.log(`Document: ${document.documentNumber} - ${document.title}`);
 * console.log(`Entity: ${document.entityName}`);
 * console.log(`Versions: ${document.versionCount}`);
 * ```
 */
export async function getDocument(documentId: string): Promise<Document> {
  const response = await apiClient.get<DocumentDetailResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}`
  );
  return response.data.data;
}

// ============================================================================
// UPDATE DOCUMENT METADATA
// ============================================================================

/**
 * Update document metadata
 *
 * Can update: title, description, documentType, expiryDate, tags, accessLevel
 * Cannot change: documentNumber, entityType, entityId, file
 *
 * @param documentId - Document UUID
 * @param data - Update data
 *
 * @returns Promise that resolves to updated Document
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const updatedDoc = await updateDocument(documentId, {
 *   title: 'Updated Title',
 *   accessLevel: DocumentAccessLevel.INTERNAL,
 *   tags: ['important', 'legal']
 * });
 * ```
 */
export async function updateDocument(
  documentId: string,
  data: DocumentUpdate
): Promise<Document> {
  const response = await apiClient.put<DocumentResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// REPLACE DOCUMENT FILE
// ============================================================================

/**
 * Replace document file with new version
 *
 * Previous version is archived in DocumentVersion table.
 * Version number is incremented.
 *
 * @param documentId - Document UUID
 * @param formData - FormData containing new file and optional notes
 * @param onUploadProgress - Optional callback for tracking upload progress
 *
 * @returns Promise that resolves to updated Document with new version number
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', newFile);
 * formData.append('notes', 'Annual renewal - updated terms');
 *
 * const updatedDoc = await replaceDocument(documentId, formData, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 * console.log(`New version: ${updatedDoc.version}`);
 * ```
 */
export async function replaceDocument(
  documentId: string,
  formData: FormData,
  onUploadProgress?: (progress: number) => void
): Promise<Document> {
  const response = await apiClient.post<DocumentResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}/replace`,
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
 * Soft delete a document
 *
 * Document is marked as deleted but retained in database and S3 for audit.
 *
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves when deletion succeeds
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * await deleteDocument(documentId);
 * console.log('Document deleted successfully');
 * ```
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`${DOCUMENTS_BASE_PATH}/${documentId}`);
}

// ============================================================================
// GET VERSION HISTORY
// ============================================================================

/**
 * Get document version history
 *
 * Returns all versions including current, ordered by versionNumber DESC.
 *
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to list of DocumentVersion
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const versions = await getVersionHistory(documentId);
 * versions.forEach(v => {
 *   console.log(`v${v.versionNumber}: ${v.fileName} (${v.uploadedAt})`);
 * });
 * ```
 */
export async function getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
  const response = await apiClient.get<DocumentVersionsResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}/versions`
  );
  return response.data.data;
}

// ============================================================================
// DOWNLOAD DOCUMENT
// ============================================================================

/**
 * Get presigned download URL for document
 *
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to download URL info
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When accessLevel restrictions apply (403)
 *
 * @example
 * ```typescript
 * const downloadInfo = await downloadDocument(documentId);
 * window.open(downloadInfo.downloadUrl, '_blank');
 * ```
 */
export async function downloadDocument(documentId: string): Promise<{
  downloadUrl: string;
  fileName: string;
  fileType: string;
}> {
  const response = await apiClient.get<DownloadUrlResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}/download`
  );
  return response.data.data;
}

/**
 * Download document and trigger browser download
 *
 * @param documentId - Document UUID
 *
 * @example
 * ```typescript
 * await triggerDocumentDownload(documentId);
 * // Browser will download the file
 * ```
 */
export async function triggerDocumentDownload(documentId: string): Promise<void> {
  const downloadInfo = await downloadDocument(documentId);

  const link = document.createElement('a');
  link.href = downloadInfo.downloadUrl;
  link.download = downloadInfo.fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// PREVIEW DOCUMENT
// ============================================================================

/**
 * Get presigned preview URL for document
 *
 * For PDFs: returns URL for in-browser viewing
 * For images: returns URL with inline content-disposition
 * For DOC/XLSX: canPreview will be false
 *
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to preview URL info
 *
 * @throws {EntityNotFoundException} When document not found (404)
 * @throws {ForbiddenException} When accessLevel restrictions apply (403)
 *
 * @example
 * ```typescript
 * const previewInfo = await previewDocument(documentId);
 * if (previewInfo.canPreview) {
 *   // Show preview iframe/image
 * } else {
 *   // Show "Preview not available" with download option
 * }
 * ```
 */
export async function previewDocument(documentId: string): Promise<{
  previewUrl: string;
  fileName: string;
  fileType: string;
  canPreview: boolean;
}> {
  const response = await apiClient.get<PreviewUrlResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}/preview`
  );
  return response.data.data;
}

// ============================================================================
// GET EXPIRING DOCUMENTS
// ============================================================================

/**
 * Get documents expiring within specified days
 *
 * @param days - Days until expiry threshold (default 30)
 *
 * @returns Promise that resolves to list of expiring documents
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get documents expiring in 30 days (default)
 * const expiring = await getExpiringDocuments();
 *
 * // Get documents expiring in 7 days
 * const urgent = await getExpiringDocuments(7);
 *
 * expiring.forEach(doc => {
 *   console.log(`${doc.title} expires in ${doc.daysUntilExpiry} days`);
 * });
 * ```
 */
export async function getExpiringDocuments(days: number = 30): Promise<ExpiringDocument[]> {
  const response = await apiClient.get<ExpiringDocumentsResponse>(
    `${DOCUMENTS_BASE_PATH}/expiring`,
    { params: { days } }
  );
  return response.data.data;
}

// ============================================================================
// ENTITY-SPECIFIC DOCUMENT METHODS
// ============================================================================

/**
 * Get documents for a specific entity
 *
 * Convenience method that wraps getDocuments with entity filters
 *
 * @param entityType - Entity type (PROPERTY, TENANT, VENDOR, ASSET)
 * @param entityId - Entity UUID
 * @param filters - Additional filter parameters
 *
 * @returns Promise that resolves to paginated list of documents for the entity
 *
 * @example
 * ```typescript
 * const propertyDocs = await getEntityDocuments(
 *   DocumentEntityType.PROPERTY,
 *   propertyId,
 *   { page: 0, size: 10 }
 * );
 * ```
 */
export async function getEntityDocuments(
  entityType: DocumentEntityType,
  entityId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>
): Promise<{
  content: DocumentListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  return getDocuments({
    ...filters,
    entityType,
    entityId
  });
}

/**
 * Get documents for a property
 *
 * @param propertyId - Property UUID
 * @param filters - Additional filter parameters
 *
 * @example
 * ```typescript
 * const docs = await getPropertyDocuments(propertyId);
 * ```
 */
export async function getPropertyDocuments(
  propertyId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>
): Promise<{
  content: DocumentListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const response = await apiClient.get<DocumentListResponse>(
    `/v1/properties/${propertyId}/documents`,
    { params: filters }
  );
  return response.data.data;
}

/**
 * Get documents for a tenant
 *
 * @param tenantId - Tenant UUID
 * @param filters - Additional filter parameters
 *
 * @example
 * ```typescript
 * const docs = await getTenantDocuments(tenantId);
 * ```
 */
export async function getTenantDocuments(
  tenantId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>
): Promise<{
  content: DocumentListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const response = await apiClient.get<DocumentListResponse>(
    `/v1/tenants/${tenantId}/documents`,
    { params: filters }
  );
  return response.data.data;
}

/**
 * Get documents for a vendor
 *
 * @param vendorId - Vendor UUID
 * @param filters - Additional filter parameters
 *
 * @example
 * ```typescript
 * const docs = await getVendorDocuments(vendorId);
 * ```
 */
export async function getVendorDocuments(
  vendorId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>
): Promise<{
  content: DocumentListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const response = await apiClient.get<DocumentListResponse>(
    `/v1/vendors/${vendorId}/documents`,
    { params: filters }
  );
  return response.data.data;
}

/**
 * Get documents for an asset
 *
 * @param assetId - Asset UUID
 * @param filters - Additional filter parameters
 *
 * @example
 * ```typescript
 * const docs = await getAssetDocuments(assetId);
 * ```
 */
export async function getAssetDocuments(
  assetId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>
): Promise<{
  content: DocumentListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const response = await apiClient.get<DocumentListResponse>(
    `/v1/assets/${assetId}/documents`,
    { params: filters }
  );
  return response.data.data;
}

// ============================================================================
// DOWNLOAD VERSION
// ============================================================================

/**
 * Download a specific version of a document
 *
 * @param documentId - Document UUID
 * @param versionId - Version UUID
 *
 * @returns Promise that resolves to download URL info
 *
 * @example
 * ```typescript
 * const downloadInfo = await downloadVersion(documentId, versionId);
 * window.open(downloadInfo.downloadUrl, '_blank');
 * ```
 */
export async function downloadVersion(
  documentId: string,
  versionId: string
): Promise<{
  downloadUrl: string;
  fileName: string;
  fileType: string;
}> {
  const response = await apiClient.get<DownloadUrlResponse>(
    `${DOCUMENTS_BASE_PATH}/${documentId}/versions/${versionId}/download`
  );
  return response.data.data;
}

// ============================================================================
// DOCUMENT SERVICE OBJECT
// ============================================================================

/**
 * Document service object with all methods
 * Allows both named imports and object-style access
 */
export const documentService = {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  replaceDocument,
  deleteDocument,
  getVersionHistory,
  downloadDocument,
  triggerDocumentDownload,
  previewDocument,
  getExpiringDocuments,
  getEntityDocuments,
  getPropertyDocuments,
  getTenantDocuments,
  getVendorDocuments,
  getAssetDocuments,
  downloadVersion
};
