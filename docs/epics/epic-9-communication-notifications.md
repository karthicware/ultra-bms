# Epic 9: Communication & Notifications

**Goal:** Implement email-based notification system and announcement management to keep all stakeholders informed.

## Story 9.1: Email Notification System

As a system administrator,
I want an automated email notification system,
So that users are informed of important events and updates via email.

**Acceptance Criteria:**

**Given** various events occur in the system
**When** a notification-triggering event happens
**Then** the email notification system handles it:

**Email Configuration:**
- Configure Gmail API for email sending (per PRD requirement)
- SMTP settings in application.properties:
  - Gmail API credentials or SMTP host/port
  - Sender email address (e.g., noreply@ultrabms.com)
  - Sender display name (e.g., "Ultra BMS")
- Test email connection on application startup

**And** notification triggers:

**Authentication & User Management:**
- Password reset requested: Send reset link email
- Password changed: Confirmation email
- New user account created: Welcome email with credentials

**Tenant Management:**
- Tenant onboarded: Welcome email with portal access details
- Lease agreement uploaded: Email with PDF attachment
- Lease expiring soon: Reminder 90, 60, 30 days before expiry

**Maintenance:**
- Maintenance request submitted: Confirmation to tenant, alert to property manager
- Work order assigned: Email to assigned vendor/staff
- Work order status changed: Email to requester (tenant or manager)
- Work order completed: Notification to requester

**Financial:**
- Invoice generated: Email invoice PDF to tenant
- Payment received: Email receipt PDF to tenant
- Invoice overdue: Reminder emails (7 days, 14 days, 30 days overdue)
- PDC due soon: Reminder 3 days before cheque date
- PDC bounced: Alert to property manager and tenant

**Vendor Management:**
- Vendor registered: Welcome email with company details
- Vendor document expiring: Reminder 30 days before expiry
- Vendor license expired: Suspension notification

**Compliance:**
- Compliance item due soon: Reminder 30 days before due date
- Compliance overdue: Alert to property manager
- Inspection scheduled: Notification with date and details

**Document Management:**
- Document uploaded: Notification to relevant parties
- Document expiring: Reminder 30 days before expiry

**And** email notification entity:
- id (UUID)
- recipientEmail, recipientName
- notificationType (enum: all trigger types above)
- subject, body (HTML)
- entityType, entityId (link to related entity)
- status (enum: PENDING, SENT, FAILED, QUEUED)
- sentAt, failedAt timestamps
- failureReason (if failed)
- retryCount (max 3 attempts)
- createdAt timestamp

**And** email templates:
- HTML email templates for each notification type
- Templates include:
  - Company logo
  - Personalized greeting
  - Event details
  - Call-to-action button (e.g., "View Invoice", "Access Portal")
  - Footer with contact information
- Template variables: {{tenantName}}, {{invoiceNumber}}, {{amount}}, etc.
- Plain text fallback for email clients

**And** email sending:
- Asynchronous email sending using @Async
- Queue emails for batch processing (Spring @Scheduled task every 1 minute)
- Retry failed emails (max 3 attempts with exponential backoff)
- Log all email attempts (success/failure) for audit
- Track email delivery status

**And** notification preferences:
- System-level notification settings (admin configuration)
- Enable/disable specific notification types
- Configure notification frequency (immediate, daily digest, weekly digest)
- Default: all notifications enabled, immediate delivery

**And** API endpoints:
- POST /api/v1/notifications/send: Send immediate email
- GET /api/v1/notifications: List notification history
- GET /api/v1/notifications/{id}: Get notification details
- POST /api/v1/notifications/retry/{id}: Retry failed notification
- GET /api/v1/notifications/settings: Get notification settings
- PUT /api/v1/notifications/settings: Update notification settings

**Prerequisites:** Story 2.3 (Password reset uses email)

**Technical Notes:**
- Use Spring Boot Mail Starter for email
- Configure Gmail API authentication (OAuth 2.0 or App Password)
- Store email templates in /resources/email-templates/ as HTML files
- Use Thymeleaf for template rendering with variable substitution
- Implement email queue using database table (email_notifications)
- Use @Async for non-blocking email sending
- Scheduled job processes queued emails every 1 minute
- Implement exponential backoff for retries (1 min, 5 min, 15 min)
- Add email attachments support (invoices, receipts, PDFs)
- Log all emails in email_log table for tracking
- Frontend: Admin UI to view email logs and resend failed emails
- Consider using AWS SES as alternative to Gmail (future enhancement)
- Add email preview feature (send test email)

## Story 9.2: Announcement Management

As a property manager,
I want to create and send announcements to tenants,
So that I can communicate important information to residents.

**Acceptance Criteria:**

**Given** I need to communicate with tenants
**When** I create an announcement
**Then** the announcement management includes:

**Announcement Creation:**
- Announcement form includes:
  - Title (required, max 200 chars)
  - Message (required, rich text editor, max 5000 chars)
  - Category (dropdown: GENERAL, MAINTENANCE, EMERGENCY, EVENT, POLICY_CHANGE, OTHER)
  - Priority (enum: HIGH, NORMAL, LOW)
  - Target audience (multi-select):
    - All tenants
    - Specific property (dropdown)
    - Specific tenants (multi-select)
  - Schedule delivery (date-time picker, default: immediate)
  - Attachment (optional, PDF, max 5MB, e.g., policy document)

**And** announcement entity:
- id (UUID), announcementNumber (unique, format: ANN-2025-0001)
- title, message (HTML), category, priority
- targetAudience (enum: ALL_TENANTS, SPECIFIC_PROPERTY, SPECIFIC_TENANTS)
- propertyIds (JSON array, if property-specific)
- tenantIds (JSON array, if tenant-specific)
- scheduledAt (datetime)
- status (enum: DRAFT, SCHEDULED, SENT, CANCELLED)
- sentAt timestamp
- attachmentFilePath (PDF stored in /uploads/announcements/)
- createdBy (userId)
- createdAt, updatedAt timestamps

**And** announcement delivery:
- If scheduled for future: status = SCHEDULED
  - Scheduled job checks for due announcements every 5 minutes
  - Send when scheduledAt <= now
- If immediate: status = SENT immediately
- Email sent to all recipients in target audience
- Email subject: "[Priority] Announcement: {title}"
- Email body: rendered message HTML with attachment link
- Track delivery: store email_notification records for each recipient

**And** announcement list page (for managers):
- Filters: category, priority, status, date range
- Search by: title, message
- Shows: announcement number, title, category, priority, target audience, scheduled date, status
- Quick actions: View, Edit (if draft), Cancel (if scheduled), Delete

**And** announcement view (for tenants):
- Tenant portal shows recent announcements (last 30 days)
- List shows: title, category, date, read/unread status
- Click to view full announcement
- Mark as read when viewed
- Download attachment if available
- Filter by category

**And** announcement read tracking:
- Track which tenants have read which announcements
- Entity: announcement_reads
  - announcementId, tenantId, readAt timestamp
- Show read count / total recipients on announcement detail page

**And** API endpoints:
- POST /api/v1/announcements: Create announcement
- GET /api/v1/announcements: List announcements (manager view)
- GET /api/v1/announcements/{id}: Get announcement details
- PUT /api/v1/announcements/{id}: Update announcement (if draft)
- PATCH /api/v1/announcements/{id}/send: Send immediately
- PATCH /api/v1/announcements/{id}/cancel: Cancel scheduled announcement
- DELETE /api/v1/announcements/{id}: Delete announcement
- GET /api/v1/tenant/announcements: List announcements for logged-in tenant
- POST /api/v1/tenant/announcements/{id}/mark-read: Mark as read

**Prerequisites:** Story 9.1 (Email notification system), Story 3.3 (Tenant portal)

**Technical Notes:**
- Use rich text editor (Quill or TinyMCE) for message formatting
- Sanitize HTML input to prevent XSS
- Store attachments in /uploads/announcements/
- Scheduled job (@Scheduled) runs every 5 minutes to check for due announcements
- Batch email sending for large recipient lists
- Track email delivery status per recipient
- Add database indexes on status, scheduledAt
- Frontend: Use shadcn/ui Badge for priority/category indicators
- Implement announcement preview before sending
- Add confirmation dialog for sending to all tenants
- Display recipient count before sending
- Optional: Add in-app notification banner for high-priority announcements

---

## E2E Testing Stories

**Note:** The following E2E test stories should be implemented AFTER all technical implementation stories (9.1-9.2) are completed. Each E2E story corresponds to its technical story and contains comprehensive end-to-end tests covering all user flows.

## Story 9.1.e2e: E2E Tests for Email Notification System

As a QA engineer / developer,
I want comprehensive end-to-end tests for email notifications,
So that I can ensure all notification triggers send emails correctly.

**Acceptance Criteria:**

**Given** Story 9.1 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Notification Triggers:**
- Create new user → verify welcome email sent
- Generate invoice → verify invoice email sent to tenant
- Record payment → verify receipt email sent
- Submit maintenance request → verify confirmation email sent

**Email Queue and Retry:**
- Simulate email sending failure → verify queued for retry
- Trigger retry job → verify retry attempted with exponential backoff

**Email Templates:**
- Verify all email templates render correctly
- Verify variables substituted ({{tenantName}}, {{invoiceNumber}})
- Verify attachments included (invoice PDFs, receipts)

**Notification Settings:**
- Admin enables/disables specific notifications → verify respected
- Test digest mode (daily, weekly) if implemented

**Prerequisites:** Story 9.1 (status: done)

**Technical Notes:**
- Use email testing service (MailHog, Mailtrap) to capture emails
- Verify email content and attachments
- Test retry mechanism
- Clean up email queue after tests

## Story 9.2.e2e: E2E Tests for Announcement Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for announcements,
So that I can ensure announcement delivery and read tracking work correctly.

**Acceptance Criteria:**

**Given** Story 9.2 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Announcement Creation and Delivery:**
- Create immediate announcement → verify sent immediately
- Create scheduled announcement → verify sent at scheduled time
- Target specific property → verify only property tenants receive email
- Target specific tenants → verify only selected tenants receive email

**Tenant Announcement View:**
- Login as tenant → view announcements
- Click announcement → verify marked as read
- Download attachment → verify file downloads

**Read Tracking:**
- View announcement detail as manager → verify read count displayed
- Verify read count increments when tenants view

**Prerequisites:** Story 9.2 (status: done), Story 9.1 (for email delivery)

**Technical Notes:**
- Test scheduled announcement job
- Verify targeting logic (all, property, specific tenants)
- Test read tracking
- Clean up test announcements

---
