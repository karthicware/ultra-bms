/**
 * Email Notification System Types and Interfaces
 * Story 9.1: Email Notification System
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Email notification status enum
 * Tracks notification lifecycle from creation to delivery
 */
export enum EmailNotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

/**
 * Notification delivery frequency enum
 */
export enum NotificationFrequency {
  IMMEDIATE = 'IMMEDIATE',
  DAILY_DIGEST = 'DAILY_DIGEST',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST'
}

/**
 * Notification type enum
 * All types of notifications supported by the system
 */
export enum NotificationType {
  // Authentication
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  NEW_USER_CREATED = 'NEW_USER_CREATED',

  // Tenant
  TENANT_ONBOARDED = 'TENANT_ONBOARDED',
  LEASE_UPLOADED = 'LEASE_UPLOADED',
  LEASE_EXPIRING_90 = 'LEASE_EXPIRING_90',
  LEASE_EXPIRING_60 = 'LEASE_EXPIRING_60',
  LEASE_EXPIRING_30 = 'LEASE_EXPIRING_30',

  // Maintenance
  MAINTENANCE_REQUEST_SUBMITTED = 'MAINTENANCE_REQUEST_SUBMITTED',
  WORK_ORDER_ASSIGNED = 'WORK_ORDER_ASSIGNED',
  WORK_ORDER_STATUS_CHANGED = 'WORK_ORDER_STATUS_CHANGED',
  WORK_ORDER_COMPLETED = 'WORK_ORDER_COMPLETED',

  // Financial
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  INVOICE_OVERDUE_7 = 'INVOICE_OVERDUE_7',
  INVOICE_OVERDUE_14 = 'INVOICE_OVERDUE_14',
  INVOICE_OVERDUE_30 = 'INVOICE_OVERDUE_30',
  PDC_DUE_SOON = 'PDC_DUE_SOON',
  PDC_BOUNCED = 'PDC_BOUNCED',

  // Vendor
  VENDOR_REGISTERED = 'VENDOR_REGISTERED',
  VENDOR_DOCUMENT_EXPIRING = 'VENDOR_DOCUMENT_EXPIRING',
  VENDOR_LICENSE_EXPIRED = 'VENDOR_LICENSE_EXPIRED',

  // Compliance
  COMPLIANCE_DUE_SOON = 'COMPLIANCE_DUE_SOON',
  COMPLIANCE_OVERDUE = 'COMPLIANCE_OVERDUE',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',

  // Document
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',

  // Announcement
  ANNOUNCEMENT_PUBLISHED = 'ANNOUNCEMENT_PUBLISHED'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Email notification entity
 */
export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  notificationType: NotificationType;
  subject: string;
  status: EmailNotificationStatus;
  entityType?: string;
  entityId?: string;
  sentAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: string;
  createdAt: string;
}

/**
 * Email notification list item for table view
 */
export interface EmailNotificationListItem {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  notificationType: NotificationType;
  subject: string;
  status: EmailNotificationStatus;
  sentAt?: string;
  failedAt?: string;
  retryCount: number;
  createdAt: string;
}

/**
 * Notification settings entity
 */
export interface NotificationSettings {
  id: string;
  notificationType: NotificationType;
  emailEnabled: boolean;
  frequency: NotificationFrequency;
  description?: string;
}

/**
 * Email statistics
 */
export interface EmailStats {
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  total: number;
  periodStart: string;
  periodEnd: string;
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Send email request
 */
export interface SendEmailRequest {
  notificationType: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  templateName: string;
  variables?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
}

/**
 * Update notification settings request
 */
export interface UpdateSettingsRequest {
  notificationType: NotificationType;
  emailEnabled?: boolean;
  frequency?: NotificationFrequency;
}

/**
 * Notification filter parameters
 */
export interface NotificationFilters {
  status?: EmailNotificationStatus;
  type?: NotificationType;
  recipientEmail?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * API response wrapper
 */
export interface NotificationResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedNotificationResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Notification type category for grouping in UI
 */
export type NotificationCategory =
  | 'authentication'
  | 'tenant'
  | 'maintenance'
  | 'financial'
  | 'vendor'
  | 'compliance'
  | 'document'
  | 'announcement';

/**
 * Map notification type to category
 */
export const NOTIFICATION_CATEGORIES: Record<NotificationType, NotificationCategory> = {
  [NotificationType.PASSWORD_RESET_REQUESTED]: 'authentication',
  [NotificationType.PASSWORD_CHANGED]: 'authentication',
  [NotificationType.NEW_USER_CREATED]: 'authentication',
  [NotificationType.TENANT_ONBOARDED]: 'tenant',
  [NotificationType.LEASE_UPLOADED]: 'tenant',
  [NotificationType.LEASE_EXPIRING_90]: 'tenant',
  [NotificationType.LEASE_EXPIRING_60]: 'tenant',
  [NotificationType.LEASE_EXPIRING_30]: 'tenant',
  [NotificationType.MAINTENANCE_REQUEST_SUBMITTED]: 'maintenance',
  [NotificationType.WORK_ORDER_ASSIGNED]: 'maintenance',
  [NotificationType.WORK_ORDER_STATUS_CHANGED]: 'maintenance',
  [NotificationType.WORK_ORDER_COMPLETED]: 'maintenance',
  [NotificationType.INVOICE_GENERATED]: 'financial',
  [NotificationType.PAYMENT_RECEIVED]: 'financial',
  [NotificationType.INVOICE_OVERDUE_7]: 'financial',
  [NotificationType.INVOICE_OVERDUE_14]: 'financial',
  [NotificationType.INVOICE_OVERDUE_30]: 'financial',
  [NotificationType.PDC_DUE_SOON]: 'financial',
  [NotificationType.PDC_BOUNCED]: 'financial',
  [NotificationType.VENDOR_REGISTERED]: 'vendor',
  [NotificationType.VENDOR_DOCUMENT_EXPIRING]: 'vendor',
  [NotificationType.VENDOR_LICENSE_EXPIRED]: 'vendor',
  [NotificationType.COMPLIANCE_DUE_SOON]: 'compliance',
  [NotificationType.COMPLIANCE_OVERDUE]: 'compliance',
  [NotificationType.INSPECTION_SCHEDULED]: 'compliance',
  [NotificationType.DOCUMENT_UPLOADED]: 'document',
  [NotificationType.DOCUMENT_EXPIRING]: 'document',
  [NotificationType.ANNOUNCEMENT_PUBLISHED]: 'announcement',
};

/**
 * Status display info
 */
export const NOTIFICATION_STATUS_CONFIG: Record<EmailNotificationStatus, {
  label: string;
  color: 'default' | 'secondary' | 'success' | 'destructive' | 'warning';
}> = {
  [EmailNotificationStatus.PENDING]: { label: 'Pending', color: 'secondary' },
  [EmailNotificationStatus.QUEUED]: { label: 'Queued', color: 'default' },
  [EmailNotificationStatus.SENT]: { label: 'Sent', color: 'success' },
  [EmailNotificationStatus.FAILED]: { label: 'Failed', color: 'destructive' },
};

/**
 * Frequency display info
 */
export const FREQUENCY_CONFIG: Record<NotificationFrequency, {
  label: string;
  description: string;
}> = {
  [NotificationFrequency.IMMEDIATE]: {
    label: 'Immediate',
    description: 'Send notification immediately when event occurs'
  },
  [NotificationFrequency.DAILY_DIGEST]: {
    label: 'Daily Digest',
    description: 'Batch notifications and send once per day'
  },
  [NotificationFrequency.WEEKLY_DIGEST]: {
    label: 'Weekly Digest',
    description: 'Batch notifications and send once per week'
  },
};
