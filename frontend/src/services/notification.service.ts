/**
 * Email Notification Management API Service
 * Story 9.1: Email Notification System
 *
 * All notification-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  EmailNotification,
  EmailNotificationListItem,
  NotificationSettings,
  EmailStats,
  SendEmailRequest,
  UpdateSettingsRequest,
  NotificationFilters,
  NotificationResponse,
  PaginatedNotificationResponse,
} from '@/types/notification';

const NOTIFICATIONS_BASE_PATH = '/v1/notifications';

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Send an immediate email notification
 *
 * @param data - Email notification data
 *
 * @returns Promise that resolves to the created notification
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN role (403)
 *
 * @example
 * ```typescript
 * const notification = await sendEmail({
 *   notificationType: 'INVOICE_GENERATED',
 *   recipientEmail: 'tenant@example.com',
 *   recipientName: 'John Doe',
 *   subject: 'New Invoice',
 *   templateName: 'invoice-sent',
 *   variables: { invoiceNumber: 'INV-2025-001' }
 * });
 * ```
 */
export async function sendEmail(data: SendEmailRequest): Promise<EmailNotification> {
  const response = await apiClient.post<NotificationResponse<EmailNotification>>(
    `${NOTIFICATIONS_BASE_PATH}/send`,
    data
  );
  return response.data.data;
}

/**
 * Get paginated list of notifications with optional filters
 *
 * @param filters - Optional filter parameters
 *
 * @returns Promise that resolves to paginated notification list
 *
 * @example
 * ```typescript
 * const { data, pagination } = await getNotifications({
 *   status: 'FAILED',
 *   page: 0,
 *   size: 20
 * });
 * ```
 */
export async function getNotifications(
  filters?: NotificationFilters
): Promise<PaginatedNotificationResponse<EmailNotificationListItem>> {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.recipientEmail) params.append('recipientEmail', filters.recipientEmail);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page !== undefined) params.append('page', filters.page.toString());
  if (filters?.size !== undefined) params.append('size', filters.size.toString());
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortDir) params.append('sortDir', filters.sortDir);

  const response = await apiClient.get<PaginatedNotificationResponse<EmailNotificationListItem>>(
    `${NOTIFICATIONS_BASE_PATH}?${params.toString()}`
  );
  return response.data;
}

/**
 * Get notification by ID
 *
 * @param id - Notification UUID
 *
 * @returns Promise that resolves to notification details
 *
 * @throws {EntityNotFoundException} When notification not found (404)
 */
export async function getNotificationById(id: string): Promise<EmailNotification> {
  const response = await apiClient.get<NotificationResponse<EmailNotification>>(
    `${NOTIFICATIONS_BASE_PATH}/${id}`
  );
  return response.data.data;
}

/**
 * Retry sending a failed notification
 *
 * @param id - Notification UUID to retry
 *
 * @returns Promise that resolves to updated notification
 *
 * @throws {EntityNotFoundException} When notification not found (404)
 * @throws {IllegalStateException} When notification is not in FAILED status (400)
 */
export async function retryNotification(id: string): Promise<EmailNotification> {
  const response = await apiClient.post<NotificationResponse<EmailNotification>>(
    `${NOTIFICATIONS_BASE_PATH}/retry/${id}`
  );
  return response.data.data;
}

/**
 * Get email statistics for a time period
 *
 * @param startDate - Optional start date (ISO string)
 * @param endDate - Optional end date (ISO string)
 *
 * @returns Promise that resolves to email statistics
 */
export async function getEmailStats(
  startDate?: string,
  endDate?: string
): Promise<EmailStats> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await apiClient.get<NotificationResponse<EmailStats>>(
    `${NOTIFICATIONS_BASE_PATH}/stats?${params.toString()}`
  );
  return response.data.data;
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

/**
 * Get all notification settings
 *
 * @returns Promise that resolves to all notification settings
 *
 * @example
 * ```typescript
 * const settings = await getNotificationSettings();
 * settings.forEach(s => console.log(s.notificationType, s.emailEnabled));
 * ```
 */
export async function getNotificationSettings(): Promise<NotificationSettings[]> {
  const response = await apiClient.get<NotificationResponse<NotificationSettings[]>>(
    `${NOTIFICATIONS_BASE_PATH}/settings`
  );
  return response.data.data;
}

/**
 * Update notification settings for a specific type
 *
 * @param data - Update settings request
 *
 * @returns Promise that resolves to updated settings
 *
 * @throws {EntityNotFoundException} When settings not found for type (404)
 */
export async function updateNotificationSettings(
  data: UpdateSettingsRequest
): Promise<NotificationSettings> {
  const response = await apiClient.put<NotificationResponse<NotificationSettings>>(
    `${NOTIFICATIONS_BASE_PATH}/settings`,
    data
  );
  return response.data.data;
}

/**
 * Reset all notification settings to defaults
 *
 * @returns Promise that resolves to all reset settings
 *
 * @throws {ForbiddenException} When user lacks SUPER_ADMIN role (403)
 */
export async function resetNotificationSettings(): Promise<NotificationSettings[]> {
  const response = await apiClient.post<NotificationResponse<NotificationSettings[]>>(
    `${NOTIFICATIONS_BASE_PATH}/settings/reset`
  );
  return response.data.data;
}

// ============================================================================
// TEST EMAIL
// ============================================================================

/**
 * Send a test email to verify configuration
 *
 * @param recipientEmail - Email address to send test email to
 *
 * @returns Promise that resolves to the test notification
 *
 * @example
 * ```typescript
 * const result = await sendTestEmail('admin@example.com');
 * if (result.status === 'SENT') {
 *   console.log('Test email sent successfully');
 * }
 * ```
 */
export async function sendTestEmail(recipientEmail: string): Promise<EmailNotification> {
  const params = new URLSearchParams();
  params.append('recipientEmail', recipientEmail);

  const response = await apiClient.post<NotificationResponse<EmailNotification>>(
    `${NOTIFICATIONS_BASE_PATH}/test?${params.toString()}`
  );
  return response.data.data;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Retry multiple failed notifications
 *
 * @param ids - Array of notification UUIDs to retry
 *
 * @returns Promise that resolves to array of updated notifications
 */
export async function bulkRetryNotifications(ids: string[]): Promise<EmailNotification[]> {
  const results = await Promise.all(ids.map(id => retryNotification(id)));
  return results;
}

/**
 * Update settings for multiple notification types
 *
 * @param updates - Array of settings updates
 *
 * @returns Promise that resolves to array of updated settings
 */
export async function bulkUpdateSettings(
  updates: UpdateSettingsRequest[]
): Promise<NotificationSettings[]> {
  const results = await Promise.all(updates.map(u => updateNotificationSettings(u)));
  return results;
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

export const notificationService = {
  // Notifications
  sendEmail,
  getNotifications,
  getNotificationById,
  retryNotification,
  getEmailStats,
  bulkRetryNotifications,

  // Settings
  getNotificationSettings,
  updateNotificationSettings,
  resetNotificationSettings,
  bulkUpdateSettings,

  // Test
  sendTestEmail,
};

export default notificationService;
