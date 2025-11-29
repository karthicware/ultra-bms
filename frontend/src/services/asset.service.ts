/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Asset Management API Service
 * Story 7.1: Asset Registry and Tracking
 *
 * All asset-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  Asset,
  AssetDetail,
  AssetListItem,
  AssetFilter,
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetStatusUpdateRequest,
  AssetDocument,
  AssetMaintenanceHistory,
  CreateAssetResponse,
  GetAssetResponse,
  AssetListResponse,
  AssetStatusUpdateResponse,
  AssetMaintenanceHistoryResponse,
  AssetDocumentUploadResponse,
  ExpiringWarrantyItem,
  ExpiringWarrantiesResponse,
  AssetDocumentType
} from '@/types/asset';

const ASSETS_BASE_PATH = '/v1/assets';

// ============================================================================
// CREATE ASSET
// ============================================================================

/**
 * Create a new asset
 *
 * @param data - Asset creation data (assetName, category, propertyId, location required)
 *
 * @returns Promise that resolves to the created Asset with assetNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {EntityNotFoundException} When property not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const asset = await createAsset({
 *   assetName: 'Main HVAC Unit',
 *   category: 'HVAC',
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   location: 'Rooftop',
 *   manufacturer: 'Carrier',
 *   warrantyExpiryDate: '2026-01-15'
 * });
 *
 * console.log(asset.assetNumber); // "AST-2025-0001"
 * console.log(asset.status); // "ACTIVE"
 * ```
 */
export async function createAsset(data: AssetCreateRequest): Promise<Asset> {
  const response = await apiClient.post<CreateAssetResponse>(
    ASSETS_BASE_PATH,
    data
  );
  return response.data.data;
}

// ============================================================================
// LIST ASSETS
// ============================================================================

/**
 * Get paginated list of assets with filters
 *
 * @param filters - Optional filters (propertyId, category, status, search, pagination)
 *
 * @returns Promise that resolves to paginated list of AssetListItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get all active assets
 * const response = await getAssets({
 *   status: 'ACTIVE',
 *   page: 0,
 *   size: 20
 * });
 *
 * // Filter by property and category
 * const filtered = await getAssets({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   category: 'HVAC',
 *   sortBy: 'createdAt',
 *   sortDirection: 'DESC'
 * });
 * ```
 */
export async function getAssets(filters?: AssetFilter): Promise<AssetListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'createdAt',
    sortDirection: filters?.sortDirection ?? 'DESC'
  };

  // Add filters if provided
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.propertyId) {
    params.propertyId = filters.propertyId;
  }
  if (filters?.category && filters.category !== 'ALL') {
    if (Array.isArray(filters.category)) {
      params.category = filters.category.join(',');
    } else {
      params.category = filters.category;
    }
  }
  if (filters?.status && filters.status !== 'ALL') {
    if (Array.isArray(filters.status)) {
      params.status = filters.status.join(',');
    } else {
      params.status = filters.status;
    }
  }

  const response = await apiClient.get<AssetListResponse>(
    ASSETS_BASE_PATH,
    { params }
  );

  return response.data;
}

// ============================================================================
// GET ASSET BY ID
// ============================================================================

/**
 * Get asset details by ID
 *
 * @param id - Asset UUID
 *
 * @returns Promise that resolves to full AssetDetail including documents and maintenance summary
 *
 * @throws {EntityNotFoundException} When asset not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const asset = await getAssetById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(asset.assetNumber);
 * console.log(asset.warrantyStatus); // 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'NO_WARRANTY'
 * console.log(asset.documents.length);
 * console.log(asset.maintenanceSummary.totalMaintenanceCost);
 * ```
 */
export async function getAssetById(id: string): Promise<AssetDetail> {
  const response = await apiClient.get<GetAssetResponse>(`${ASSETS_BASE_PATH}/${id}`);
  return response.data.data;
}

// ============================================================================
// UPDATE ASSET
// ============================================================================

/**
 * Update asset details
 *
 * @param id - Asset UUID
 * @param data - Updated asset data
 *
 * @returns Promise that resolves to updated Asset
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {InvalidStatusException} When asset is DISPOSED (400)
 * @throws {EntityNotFoundException} When asset not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const updated = await updateAsset(assetId, {
 *   location: 'Basement Level 2',
 *   warrantyExpiryDate: '2027-01-15'
 * });
 * ```
 */
export async function updateAsset(
  id: string,
  data: AssetUpdateRequest
): Promise<Asset> {
  const response = await apiClient.put<CreateAssetResponse>(
    `${ASSETS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// UPDATE ASSET STATUS
// ============================================================================

/**
 * Update asset status
 *
 * @param id - Asset UUID
 * @param data - Status update with optional notes
 *
 * @returns Promise that resolves to updated Asset
 *
 * @throws {InvalidStatusException} When asset is DISPOSED and trying to change status (400)
 * @throws {EntityNotFoundException} When asset not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const result = await updateAssetStatus(assetId, {
 *   status: 'UNDER_MAINTENANCE',
 *   notes: 'Scheduled quarterly maintenance'
 * });
 *
 * console.log(result.status); // "UNDER_MAINTENANCE"
 * ```
 */
export async function updateAssetStatus(
  id: string,
  data: AssetStatusUpdateRequest
): Promise<Asset> {
  const response = await apiClient.patch<AssetStatusUpdateResponse>(
    `${ASSETS_BASE_PATH}/${id}/status`,
    data
  );
  return response.data.data;
}

// ============================================================================
// DELETE ASSET (SOFT DELETE)
// ============================================================================

/**
 * Soft delete an asset (sets status to DISPOSED)
 *
 * @param id - Asset UUID
 *
 * @returns Promise that resolves when deletion succeeds
 *
 * @throws {InvalidStatusException} When asset is already DISPOSED (400)
 * @throws {EntityNotFoundException} When asset not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await deleteAsset(assetId);
 * console.log('Asset disposed successfully');
 * ```
 */
export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`${ASSETS_BASE_PATH}/${id}`);
}

// ============================================================================
// GET MAINTENANCE HISTORY
// ============================================================================

/**
 * Get maintenance history for an asset (work orders linked to this asset)
 *
 * @param id - Asset UUID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 *
 * @returns Promise that resolves to paginated maintenance history with total cost
 *
 * @throws {EntityNotFoundException} When asset not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const history = await getAssetMaintenanceHistory(assetId, 0, 20);
 * console.log(`Total maintenance count: ${history.data.totalElements}`);
 * console.log(`Total cost: ${history.data.totalMaintenanceCost}`);
 * history.data.content.forEach(item => {
 *   console.log(`${item.workOrderNumber}: ${item.description}`);
 * });
 * ```
 */
export async function getAssetMaintenanceHistory(
  id: string,
  page: number = 0,
  size: number = 20
): Promise<AssetMaintenanceHistoryResponse> {
  const response = await apiClient.get<AssetMaintenanceHistoryResponse>(
    `${ASSETS_BASE_PATH}/${id}/maintenance-history`,
    { params: { page, size } }
  );
  return response.data;
}

// ============================================================================
// UPLOAD DOCUMENT
// ============================================================================

/**
 * Upload a document for an asset
 *
 * @param assetId - Asset UUID
 * @param file - Document file (PDF/JPG/PNG, max 10MB)
 * @param documentType - Type of document
 *
 * @returns Promise that resolves to created AssetDocument with download URL
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {EntityNotFoundException} When asset not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const doc = await uploadAssetDocument(assetId, file, 'WARRANTY');
 * console.log(`Document uploaded: ${doc.fileName}`);
 * console.log(`Download URL: ${doc.downloadUrl}`);
 * ```
 */
export async function uploadAssetDocument(
  assetId: string,
  file: File,
  documentType: AssetDocumentType
): Promise<AssetDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await apiClient.post<AssetDocumentUploadResponse>(
    `${ASSETS_BASE_PATH}/${assetId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// DELETE DOCUMENT
// ============================================================================

/**
 * Delete a document from an asset
 *
 * @param assetId - Asset UUID
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves when deletion succeeds
 *
 * @throws {EntityNotFoundException} When asset or document not found (404)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await deleteAssetDocument(assetId, documentId);
 * console.log('Document deleted successfully');
 * ```
 */
export async function deleteAssetDocument(
  assetId: string,
  documentId: string
): Promise<void> {
  await apiClient.delete(`${ASSETS_BASE_PATH}/${assetId}/documents/${documentId}`);
}

// ============================================================================
// GET EXPIRING WARRANTIES
// ============================================================================

/**
 * Get assets with warranties expiring within specified days
 *
 * @param days - Number of days to look ahead (default: 30)
 *
 * @returns Promise that resolves to list of assets with expiring warranties
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const expiring = await getExpiringWarranties(30);
 * expiring.forEach(asset => {
 *   console.log(`${asset.assetName} expires in ${asset.daysUntilExpiry} days`);
 * });
 * ```
 */
export async function getExpiringWarranties(days: number = 30): Promise<ExpiringWarrantyItem[]> {
  const response = await apiClient.get<ExpiringWarrantiesResponse>(
    `${ASSETS_BASE_PATH}/expiring-warranties`,
    { params: { days } }
  );
  return response.data.data;
}

// ============================================================================
// GET ASSETS FOR DROPDOWN
// ============================================================================

/**
 * Get assets for dropdown selection (filtered by property if specified)
 *
 * @param propertyId - Optional property UUID to filter by
 *
 * @returns Promise that resolves to list of assets for dropdown
 *
 * @example
 * ```typescript
 * // Get all assets for dropdown
 * const assets = await getAssetsForDropdown();
 *
 * // Get assets for specific property
 * const propertyAssets = await getAssetsForDropdown(propertyId);
 * ```
 */
export async function getAssetsForDropdown(propertyId?: string): Promise<AssetListItem[]> {
  const params: Record<string, any> = {
    page: 0,
    size: 1000, // Get all for dropdown
    sortBy: 'assetName',
    sortDirection: 'ASC',
    status: 'ACTIVE,UNDER_MAINTENANCE' // Exclude OUT_OF_SERVICE and DISPOSED
  };

  if (propertyId) {
    params.propertyId = propertyId;
  }

  const response = await apiClient.get<AssetListResponse>(
    ASSETS_BASE_PATH,
    { params }
  );

  return response.data.data.content;
}

// ============================================================================
// DOWNLOAD DOCUMENT
// ============================================================================

/**
 * Download asset document file as blob
 *
 * @param assetId - Asset UUID
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to Blob containing document file
 *
 * @throws {EntityNotFoundException} When asset or document not found (404)
 *
 * @example
 * ```typescript
 * const blob = await downloadAssetDocument(assetId, documentId);
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = fileName;
 * a.click();
 * ```
 */
export async function downloadAssetDocument(
  assetId: string,
  documentId: string
): Promise<Blob> {
  const response = await apiClient.get(
    `${ASSETS_BASE_PATH}/${assetId}/documents/${documentId}/download`,
    { responseType: 'blob' }
  );
  return response.data;
}

/**
 * Get document download URL (presigned S3 URL)
 *
 * @param assetId - Asset UUID
 * @param documentId - Document UUID
 *
 * @returns Promise that resolves to presigned URL string
 *
 * @throws {EntityNotFoundException} When asset or document not found (404)
 */
export async function getDocumentDownloadUrl(
  assetId: string,
  documentId: string
): Promise<string> {
  const response = await apiClient.get<{ success: boolean; data: { url: string } }>(
    `${ASSETS_BASE_PATH}/${assetId}/documents/${documentId}/url`
  );
  return response.data.data.url;
}

// ============================================================================
// ASSET SERVICE OBJECT
// ============================================================================

/**
 * Asset service object with all methods
 * Allows both named imports and object-style access
 */
export const assetService = {
  // CRUD operations
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,

  // Status operations
  updateAssetStatus,

  // Maintenance history
  getAssetMaintenanceHistory,

  // Document operations
  uploadAssetDocument,
  deleteAssetDocument,
  downloadAssetDocument,
  getDocumentDownloadUrl,

  // Warranty tracking
  getExpiringWarranties,

  // Dropdown helpers
  getAssetsForDropdown
};
