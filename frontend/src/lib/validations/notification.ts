/**
 * Email Notification Validation Schemas
 * Story 9.1: Email Notification System
 *
 * Zod schemas for form validation following React Hook Form pattern
 */

import { z } from 'zod';
import {
  EmailNotificationStatus,
  NotificationType,
  NotificationFrequency
} from '@/types/notification';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const emailNotificationStatusSchema = z.nativeEnum(EmailNotificationStatus);
export const notificationTypeSchema = z.nativeEnum(NotificationType);
export const notificationFrequencySchema = z.nativeEnum(NotificationFrequency);

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 255;
const MAX_SUBJECT_LENGTH = 500;
const MAX_TEMPLATE_NAME_LENGTH = 100;
const MAX_ENTITY_TYPE_LENGTH = 100;

// Email regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

/**
 * Email address validation
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(MAX_EMAIL_LENGTH, `Email must be less than ${MAX_EMAIL_LENGTH} characters`)
  .email('Invalid email format')
  .regex(EMAIL_REGEX, 'Invalid email format')
  .trim()
  .toLowerCase();

/**
 * Recipient name validation
 */
const recipientNameSchema = z
  .string()
  .max(MAX_NAME_LENGTH, `Name must be less than ${MAX_NAME_LENGTH} characters`)
  .trim()
  .optional();

/**
 * Subject line validation
 */
const subjectSchema = z
  .string()
  .min(1, 'Subject is required')
  .max(MAX_SUBJECT_LENGTH, `Subject must be less than ${MAX_SUBJECT_LENGTH} characters`)
  .trim();

/**
 * Template name validation
 */
const templateNameSchema = z
  .string()
  .min(1, 'Template name is required')
  .max(MAX_TEMPLATE_NAME_LENGTH, `Template name must be less than ${MAX_TEMPLATE_NAME_LENGTH} characters`)
  .trim();

/**
 * Entity type validation
 */
const entityTypeSchema = z
  .string()
  .max(MAX_ENTITY_TYPE_LENGTH, `Entity type must be less than ${MAX_ENTITY_TYPE_LENGTH} characters`)
  .trim()
  .optional();

/**
 * UUID validation
 */
const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')
  .optional();

// ============================================================================
// MAIN SCHEMAS
// ============================================================================

/**
 * Send email request schema
 */
export const sendEmailRequestSchema = z.object({
  notificationType: notificationTypeSchema,
  recipientEmail: emailSchema,
  recipientName: recipientNameSchema,
  subject: subjectSchema,
  templateName: templateNameSchema,
  variables: z.record(z.string(), z.unknown()).optional(),
  entityType: entityTypeSchema,
  entityId: uuidSchema,
});

export type SendEmailRequestInput = z.infer<typeof sendEmailRequestSchema>;

/**
 * Update notification settings schema
 */
export const updateSettingsRequestSchema = z.object({
  notificationType: notificationTypeSchema,
  emailEnabled: z.boolean().optional(),
  frequency: notificationFrequencySchema.optional(),
});

export type UpdateSettingsRequestInput = z.infer<typeof updateSettingsRequestSchema>;

/**
 * Test email request schema
 */
export const testEmailRequestSchema = z.object({
  recipientEmail: emailSchema,
});

export type TestEmailRequestInput = z.infer<typeof testEmailRequestSchema>;

/**
 * Notification filter schema
 */
export const notificationFilterSchema = z.object({
  status: emailNotificationStatusSchema.optional(),
  type: notificationTypeSchema.optional(),
  recipientEmail: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate send email request
 */
export function validateSendEmailRequest(data: unknown): SendEmailRequestInput {
  return sendEmailRequestSchema.parse(data);
}

/**
 * Safe parse send email request (returns result object)
 */
export function safeParseSendEmailRequest(data: unknown) {
  return sendEmailRequestSchema.safeParse(data);
}

/**
 * Validate update settings request
 */
export function validateUpdateSettingsRequest(data: unknown): UpdateSettingsRequestInput {
  return updateSettingsRequestSchema.parse(data);
}

/**
 * Safe parse update settings request
 */
export function safeParseUpdateSettingsRequest(data: unknown) {
  return updateSettingsRequestSchema.safeParse(data);
}

/**
 * Validate test email request
 */
export function validateTestEmailRequest(data: unknown): TestEmailRequestInput {
  return testEmailRequestSchema.parse(data);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Format notification type for display
 */
export function formatNotificationType(type: NotificationType): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format frequency for display
 */
export function formatFrequency(frequency: NotificationFrequency): string {
  switch (frequency) {
    case NotificationFrequency.IMMEDIATE:
      return 'Immediate';
    case NotificationFrequency.DAILY_DIGEST:
      return 'Daily Digest';
    case NotificationFrequency.WEEKLY_DIGEST:
      return 'Weekly Digest';
    default:
      return frequency;
  }
}

/**
 * Format status for display
 */
export function formatStatus(status: EmailNotificationStatus): string {
  switch (status) {
    case EmailNotificationStatus.PENDING:
      return 'Pending';
    case EmailNotificationStatus.QUEUED:
      return 'Queued';
    case EmailNotificationStatus.SENT:
      return 'Sent';
    case EmailNotificationStatus.FAILED:
      return 'Failed';
    default:
      return status;
  }
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: EmailNotificationStatus): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case EmailNotificationStatus.PENDING:
      return 'secondary';
    case EmailNotificationStatus.QUEUED:
      return 'default';
    case EmailNotificationStatus.SENT:
      return 'success';
    case EmailNotificationStatus.FAILED:
      return 'destructive';
    default:
      return 'default';
  }
}
