/**
 * Tenant Portal API Service
 * All tenant dashboard and profile-related API calls
 */

import { apiClient } from '@/lib/api';
import type {
  DashboardData,
  TenantProfile,
  ChangePasswordFormData,
  DocumentUploadRequest,
} from '@/types/tenant-portal';
import type { TenantDocument } from '@/types/tenant';

const TENANT_BASE_PATH = '/v1/tenant';

/**
 * Get tenant dashboard data with current unit info, stats, and quick actions
 *
 * @returns Promise that resolves to DashboardData object
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have TENANT role (403)
 *
 * @example
 * ```typescript
 * const dashboard = await getDashboardData();
 * console.log(dashboard.currentUnit.unitNumber); // "204"
 * console.log(dashboard.stats.outstandingBalance); // 5000.00
 * console.log(dashboard.stats.daysRemaining); // 45
 * ```
 */
export async function getDashboardData(): Promise<DashboardData> {
  const response = await apiClient.get<{ data: DashboardData }>(`${TENANT_BASE_PATH}/dashboard`);
  return response.data.data;
}

/**
 * Get complete tenant profile with personal info, lease details, parking, and documents
 *
 * @returns Promise that resolves to TenantProfile object
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have TENANT role (403)
 *
 * @example
 * ```typescript
 * const profile = await getTenantProfile();
 * console.log(profile.tenant.firstName); // "John"
 * console.log(profile.lease.totalMonthlyRent); // 12000.00
 * console.log(profile.parking.spots); // 2
 * console.log(profile.documents.length); // 5
 * ```
 */
export async function getTenantProfile(): Promise<TenantProfile> {
  const response = await apiClient.get<{ data: TenantProfile }>(`${TENANT_BASE_PATH}/profile`);
  return response.data.data;
}

/**
 * Change tenant account password
 *
 * @param data - Password change data
 * @param data.currentPassword - Current password (min 8 characters, required)
 * @param data.newPassword - New password (min 12 chars, complexity required)
 *
 * @returns Promise that resolves when password is successfully changed
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When current password is incorrect (401)
 * @throws {ForbiddenException} When user doesn't have TENANT role (403)
 *
 * @example
 * ```typescript
 * await changePassword({
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecurePass123!@'
 * });
 * // Success - user will be logged out and redirected to login
 * ```
 */
export async function changePassword(data: ChangePasswordFormData): Promise<void> {
  await apiClient.post(`${TENANT_BASE_PATH}/account/change-password`, {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
}

/**
 * Download signed lease agreement PDF
 *
 * @returns Promise that resolves to Blob containing PDF file
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have TENANT role (403)
 * @throws {NotFoundException} When lease document not found (404)
 *
 * @example
 * ```typescript
 * const pdfBlob = await downloadLease();
 * const url = window.URL.createObjectURL(pdfBlob);
 * window.open(url, '_blank');
 * ```
 */
export async function downloadLease(): Promise<Blob> {
  const response = await apiClient.get(`${TENANT_BASE_PATH}/lease/download`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Upload a new document to tenant's document repository
 *
 * @param file - File to upload (PDF/JPG/PNG, max 5MB)
 * @param type - Optional document type classification
 *
 * @returns Promise that resolves to created TenantDocument object
 *
 * @throws {ValidationException} When file validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have TENANT role (403)
 *
 * @example
 * ```typescript
 * const document = await uploadDocument(file, 'PASSPORT');
 * console.log(document.id); // UUID
 * console.log(document.fileName); // "passport_scan.pdf"
 * console.log(document.fileSize); // 245678
 * ```
 */
export async function uploadDocument(
  file: File,
  type?: string
): Promise<TenantDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (type) {
    formData.append('type', type);
  }

  const response = await apiClient.post<{ data: TenantDocument }>(
    `${TENANT_BASE_PATH}/documents`,
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
 * Download a specific document from tenant's repository
 *
 * @param id - UUID of the document to download
 *
 * @returns Promise that resolves to Blob containing the file
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't own this document (403)
 * @throws {NotFoundException} When document not found (404)
 *
 * @example
 * ```typescript
 * const fileBlob = await downloadDocument(documentId);
 * const url = window.URL.createObjectURL(fileBlob);
 * const link = document.createElement('a');
 * link.href = url;
 * link.download = fileName;
 * link.click();
 * ```
 */
export async function downloadDocument(id: string): Promise<Blob> {
  const response = await apiClient.get(`${TENANT_BASE_PATH}/documents/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Update language preference
 *
 * @param language - Language code ('en' or 'ar')
 *
 * @returns Promise that resolves when preference is saved
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * await updateLanguagePreference('ar');
 * ```
 */
export async function updateLanguagePreference(language: 'en' | 'ar'): Promise<void> {
  await apiClient.patch(`${TENANT_BASE_PATH}/preferences`, { language });
}

/**
 * Download Mulkiya document if available
 *
 * @returns Promise that resolves to Blob containing the Mulkiya PDF/image
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When Mulkiya document not found (404)
 *
 * @example
 * ```typescript
 * const mulkiyaBlob = await downloadMulkiya();
 * const url = window.URL.createObjectURL(mulkiyaBlob);
 * window.open(url, '_blank');
 * ```
 */
export async function downloadMulkiya(): Promise<Blob> {
  const response = await apiClient.get(`${TENANT_BASE_PATH}/parking/mulkiya/download`, {
    responseType: 'blob',
  });
  return response.data;
}
