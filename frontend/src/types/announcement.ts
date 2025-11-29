/**
 * Announcement Management Types and Interfaces
 * Story 9.2: Internal Announcement Management
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Announcement status enum
 * Tracks announcement lifecycle from draft to expiry/archive
 */
export enum AnnouncementStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Announcement template enum
 * Pre-defined templates with default content
 */
export enum AnnouncementTemplate {
  OFFICE_CLOSURE = 'OFFICE_CLOSURE',
  MAINTENANCE_SCHEDULE = 'MAINTENANCE_SCHEDULE',
  POLICY_UPDATE = 'POLICY_UPDATE'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Full announcement entity
 * Complete announcement information from backend
 */
export interface Announcement {
  id: string;
  announcementNumber: string;
  title: string;
  message: string;
  templateUsed?: AnnouncementTemplate;
  expiresAt: string;
  publishedAt?: string;
  status: AnnouncementStatus;
  attachmentFilePath?: string;
  attachmentFileName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Announcement list item for table view
 * Minimal fields for efficient list rendering
 */
export interface AnnouncementListItem {
  id: string;
  announcementNumber: string;
  title: string;
  expiresAt: string;
  publishedAt?: string;
  status: AnnouncementStatus;
  hasAttachment: boolean;
  createdByName?: string;
  createdAt: string;
}

/**
 * Tenant-facing announcement view
 * Excludes internal fields
 */
export interface TenantAnnouncement {
  id: string;
  title: string;
  message: string;
  publishedAt: string;
  hasAttachment: boolean;
  attachmentFileName?: string;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Create announcement request
 * Fields required to create a new announcement (as draft)
 */
export interface CreateAnnouncementRequest {
  title: string;
  message: string;
  templateUsed?: AnnouncementTemplate;
  expiresAt: string;
}

/**
 * Update announcement request
 * Fields that can be updated (draft status only)
 */
export interface UpdateAnnouncementRequest {
  title: string;
  message: string;
  templateUsed?: AnnouncementTemplate;
  expiresAt: string;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Announcement filter parameters
 * Used for list filtering and search
 */
export interface AnnouncementFilter {
  tab?: 'ACTIVE' | 'DRAFTS' | 'HISTORY';
  search?: string;
  status?: AnnouncementStatus;
  fromDate?: string;
  toDate?: string;
  createdBy?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Paginated announcement list response
 */
export interface AnnouncementListResponse {
  success: boolean;
  data: AnnouncementListItem[];
  pagination: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  message: string;
}

/**
 * Single announcement response
 */
export interface AnnouncementResponse {
  success: boolean;
  data: Announcement;
  message: string;
}

/**
 * Announcement statistics for dashboard
 */
export interface AnnouncementStats {
  activeCount: number;
  draftCount: number;
}

/**
 * Announcement stats response
 */
export interface AnnouncementStatsResponse {
  success: boolean;
  data: AnnouncementStats;
  message: string;
}

/**
 * Attachment download URL response
 */
export interface AttachmentDownloadResponse {
  success: boolean;
  data: {
    downloadUrl: string;
  };
  message: string;
}

// ============================================================================
// TEMPLATE CONTENT
// ============================================================================

/**
 * Default template content for each template type
 */
export const TEMPLATE_CONTENT: Record<AnnouncementTemplate, { title: string; message: string }> = {
  [AnnouncementTemplate.OFFICE_CLOSURE]: {
    title: 'Office Closure Notice',
    message: `<p>Dear Residents,</p>
<p>Please be informed that our management office will be <strong>closed</strong> on [DATE] due to [REASON].</p>
<p>During this time:</p>
<ul>
<li>For emergencies, please call our 24/7 hotline: [PHONE NUMBER]</li>
<li>Non-urgent matters can be submitted via email: [EMAIL]</li>
<li>Normal operations will resume on [DATE]</li>
</ul>
<p>We apologize for any inconvenience caused.</p>
<p>Best regards,<br/>Property Management Team</p>`
  },
  [AnnouncementTemplate.MAINTENANCE_SCHEDULE]: {
    title: 'Scheduled Maintenance Notice',
    message: `<p>Dear Residents,</p>
<p>We would like to inform you about upcoming scheduled maintenance:</p>
<table>
<tr><td><strong>Date:</strong></td><td>[DATE]</td></tr>
<tr><td><strong>Time:</strong></td><td>[START TIME] - [END TIME]</td></tr>
<tr><td><strong>Area Affected:</strong></td><td>[AREA]</td></tr>
<tr><td><strong>Work Description:</strong></td><td>[DESCRIPTION]</td></tr>
</table>
<p>During this period, [IMPACT DESCRIPTION].</p>
<p>We appreciate your patience and understanding.</p>
<p>Best regards,<br/>Property Management Team</p>`
  },
  [AnnouncementTemplate.POLICY_UPDATE]: {
    title: 'Policy Update Notice',
    message: `<p>Dear Residents,</p>
<p>We are writing to inform you about an important update to our building policies.</p>
<p><strong>What's Changing:</strong></p>
<p>[POLICY DESCRIPTION]</p>
<p><strong>Effective Date:</strong> [DATE]</p>
<p><strong>Key Points:</strong></p>
<ul>
<li>[KEY POINT 1]</li>
<li>[KEY POINT 2]</li>
<li>[KEY POINT 3]</li>
</ul>
<p>If you have any questions, please contact the management office.</p>
<p>Best regards,<br/>Property Management Team</p>`
  }
};
