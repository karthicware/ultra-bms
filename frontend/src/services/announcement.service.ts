/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Announcement API Service
 * Story 9.2: Internal Announcement Management
 *
 * All announcement-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  Announcement,
  AnnouncementFilter,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AnnouncementResponse,
  AnnouncementListResponse,
  AnnouncementStats,
  AnnouncementStatsResponse,
  AttachmentDownloadResponse,
  TenantAnnouncement
} from '@/types/announcement';

const ANNOUNCEMENTS_BASE_PATH = '/v1/announcements';
const TENANT_ANNOUNCEMENTS_PATH = '/v1/tenant/announcements';

// ============================================================================
// CREATE ANNOUNCEMENT
// ============================================================================

/**
 * Create a new announcement (as DRAFT)
 *
 * @param data - Announcement creation data (title, message, expiry date)
 *
 * @returns Promise that resolves to the created Announcement with announcementNumber
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks SUPER_ADMIN or ADMIN role (403)
 */
export async function createAnnouncement(data: CreateAnnouncementRequest): Promise<Announcement> {
  const response = await apiClient.post<AnnouncementResponse>(
    ANNOUNCEMENTS_BASE_PATH,
    data
  );
  return response.data.data;
}

// ============================================================================
// LIST ANNOUNCEMENTS
// ============================================================================

/**
 * Get paginated list of announcements with filters
 *
 * @param filters - Optional filters (tab, search, status, date range, etc.)
 *
 * @returns Promise that resolves to paginated list of AnnouncementListItem
 */
export async function getAnnouncements(filters?: AnnouncementFilter): Promise<AnnouncementListResponse> {
  const params: Record<string, any> = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sortBy: filters?.sortBy ?? 'createdAt',
    sortDir: filters?.sortDir ?? 'desc'
  };

  // Add filters if provided
  if (filters?.tab) {
    params.tab = filters.tab;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters?.toDate) {
    params.toDate = filters.toDate;
  }
  if (filters?.createdBy) {
    params.createdBy = filters.createdBy;
  }

  const response = await apiClient.get<AnnouncementListResponse>(
    ANNOUNCEMENTS_BASE_PATH,
    { params }
  );
  return response.data;
}

// ============================================================================
// GET SINGLE ANNOUNCEMENT
// ============================================================================

/**
 * Get announcement by ID with full details
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to the full Announcement
 */
export async function getAnnouncementById(id: string): Promise<Announcement> {
  const response = await apiClient.get<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}`
  );
  return response.data.data;
}

// ============================================================================
// UPDATE ANNOUNCEMENT
// ============================================================================

/**
 * Update announcement (DRAFT status only)
 *
 * @param id - Announcement UUID
 * @param data - Update data (title, message, expiry date)
 *
 * @returns Promise that resolves to the updated Announcement
 *
 * @throws {IllegalStateException} When announcement is not in DRAFT status (400)
 */
export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementRequest
): Promise<Announcement> {
  const response = await apiClient.put<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
}

// ============================================================================
// DELETE ANNOUNCEMENT
// ============================================================================

/**
 * Delete announcement
 *
 * @param id - Announcement UUID
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  await apiClient.delete(`${ANNOUNCEMENTS_BASE_PATH}/${id}`);
}

// ============================================================================
// COPY ANNOUNCEMENT
// ============================================================================

/**
 * Copy/duplicate an announcement as a new draft
 *
 * @param id - Announcement UUID to copy
 *
 * @returns Promise that resolves to the new draft Announcement with "[Copy] " prefix
 */
export async function copyAnnouncement(id: string): Promise<Announcement> {
  const response = await apiClient.post<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/copy`
  );
  return response.data.data;
}

// ============================================================================
// PUBLISH ANNOUNCEMENT
// ============================================================================

/**
 * Publish announcement (sends emails to all active tenants)
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to the published Announcement
 *
 * @throws {IllegalStateException} When announcement is not in DRAFT status (400)
 * @throws {IllegalArgumentException} When expiry date is in the past (400)
 */
export async function publishAnnouncement(id: string): Promise<Announcement> {
  const response = await apiClient.patch<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/publish`
  );
  return response.data.data;
}

// ============================================================================
// ARCHIVE ANNOUNCEMENT
// ============================================================================

/**
 * Archive announcement
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to the archived Announcement
 *
 * @throws {IllegalStateException} When announcement cannot be archived (400)
 */
export async function archiveAnnouncement(id: string): Promise<Announcement> {
  const response = await apiClient.patch<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/archive`
  );
  return response.data.data;
}

// ============================================================================
// ATTACHMENT OPERATIONS
// ============================================================================

/**
 * Upload attachment for announcement (PDF only, max 5MB)
 *
 * @param id - Announcement UUID
 * @param file - PDF file to upload
 *
 * @returns Promise that resolves to the updated Announcement
 *
 * @throws {IllegalStateException} When announcement is not in DRAFT status (400)
 * @throws {IllegalArgumentException} When file is not PDF or exceeds 5MB (400)
 */
export async function uploadAttachment(id: string, file: File): Promise<Announcement> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/attachment`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data.data;
}

/**
 * Delete attachment from announcement
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to the updated Announcement
 */
export async function deleteAttachment(id: string): Promise<Announcement> {
  const response = await apiClient.delete<AnnouncementResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/attachment`
  );
  return response.data.data;
}

/**
 * Get presigned URL for downloading attachment
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to the download URL
 */
export async function getAttachmentDownloadUrl(id: string): Promise<string> {
  const response = await apiClient.get<AttachmentDownloadResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/attachment/download`
  );
  return response.data.data.downloadUrl;
}

// ============================================================================
// PDF GENERATION - Story 9.2 AC #35-39
// ============================================================================

/**
 * Download announcement as PDF
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to Blob containing PDF content
 */
export async function downloadAnnouncementPdf(id: string): Promise<Blob> {
  const response = await apiClient.get(
    `${ANNOUNCEMENTS_BASE_PATH}/${id}/pdf`,
    {
      responseType: 'blob'
    }
  );
  return response.data;
}

/**
 * Open announcement PDF in new tab for print preview
 *
 * @param id - Announcement UUID
 */
export async function openAnnouncementPrintPreview(id: string): Promise<void> {
  const blob = await downloadAnnouncementPdf(id);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Download announcement PDF with proper filename
 *
 * @param id - Announcement UUID
 * @param announcementNumber - Announcement number for filename
 */
export async function downloadAnnouncementPdfWithFilename(
  id: string,
  announcementNumber: string
): Promise<void> {
  const blob = await downloadAnnouncementPdf(id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Announcement-${announcementNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get announcement statistics for dashboard
 *
 * @returns Promise that resolves to AnnouncementStats
 */
export async function getAnnouncementStats(): Promise<AnnouncementStats> {
  const response = await apiClient.get<AnnouncementStatsResponse>(
    `${ANNOUNCEMENTS_BASE_PATH}/stats`
  );
  return response.data.data;
}

// ============================================================================
// TENANT PORTAL
// ============================================================================

/**
 * Get active announcements for tenant portal
 *
 * @returns Promise that resolves to list of TenantAnnouncement
 */
export async function getTenantAnnouncements(): Promise<TenantAnnouncement[]> {
  const response = await apiClient.get<{ success: boolean; data: TenantAnnouncement[] }>(
    TENANT_ANNOUNCEMENTS_PATH
  );
  return response.data.data;
}

/**
 * Get single announcement for tenant portal
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to TenantAnnouncement
 */
export async function getTenantAnnouncementById(id: string): Promise<TenantAnnouncement> {
  const response = await apiClient.get<{ success: boolean; data: TenantAnnouncement }>(
    `${TENANT_ANNOUNCEMENTS_PATH}/${id}`
  );
  return response.data.data;
}

/**
 * Get attachment download URL for tenant portal
 *
 * @param id - Announcement UUID
 *
 * @returns Promise that resolves to the download URL
 */
export async function getTenantAttachmentDownloadUrl(id: string): Promise<string> {
  const response = await apiClient.get<AttachmentDownloadResponse>(
    `${TENANT_ANNOUNCEMENTS_PATH}/${id}/attachment/download`
  );
  return response.data.data.downloadUrl;
}
