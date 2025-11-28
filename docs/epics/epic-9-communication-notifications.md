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

## Story 9.2: Internal Announcement Management (REVISED via SCP #6)

As a property manager,
I want to create and publish internal announcements,
So that I can communicate important information to all tenants via email and website.

**SCOPE SIMPLIFICATION (SCP #6 - 2025-11-28):**
- Email + Website delivery only (no SMS, no in-app push)
- All tenants always (no targeting)
- No emergency broadcasts or categories
- Added: Expiry date with auto-archive
- Added: Printable/PDF support
- Added: Dashboard widget (active count)
- Added: Copy/duplicate announcements
- Added: Multiple drafts allowed

**Acceptance Criteria:**

**Given** I need to communicate with all tenants
**When** I create an internal announcement
**Then** the announcement management includes:

**1. Announcement Creation Form:**
- Title (required, max 200 chars)
- Message (required, rich text editor with: Bold, Italic, Underline, Lists, Headings, Tables, Images)
- Template selector (optional dropdown):
  - Office Closure Notice
  - Maintenance Schedule
  - Policy Update
- Expiry Date (required, date picker, must be future date)
- Attachment (optional, PDF, max 5MB)

**2. Copy/Duplicate Announcement:**
- "Copy" action on existing announcements (any status)
- Creates new draft with "[Copy] Original Title"
- Copies: title, message, template, attachment
- Does NOT copy: expiry date (must set new)
- Redirects to edit form for new draft

**3. Multiple Drafts Support:**
- Multiple announcements can exist in DRAFT status simultaneously
- Drafts tab shows all unpublished announcements
- Each draft can be edited, published, or deleted independently

**4. Announcement Entity:**
- id (UUID)
- announcementNumber (unique, format: ANN-2025-0001)
- title, message (HTML)
- templateUsed (nullable enum: OFFICE_CLOSURE, MAINTENANCE_SCHEDULE, POLICY_UPDATE)
- expiresAt (datetime, required)
- status (enum: DRAFT, PUBLISHED, EXPIRED, ARCHIVED)
- publishedAt (timestamp, nullable)
- attachmentFilePath (nullable)
- createdBy (userId)
- createdAt, updatedAt timestamps

**5. Announcement Publishing:**
- "Publish" button on draft detail page
- On publish: status = PUBLISHED, publishedAt = now
- Email sent to ALL active tenants:
  - Subject: "Announcement: {title}"
  - Body: rendered message HTML
  - Attachment included if present
- Cannot edit published announcements (only archive/delete)

**6. Expiry Handling:**
- Scheduled job runs daily at midnight
- Announcements with expiresAt < now AND status = PUBLISHED → status = EXPIRED
- Expired announcements hidden from tenant portal
- Expired announcements visible in History tab (manager view)

**7. Announcement List Page (Manager View):**
- Route: /admin/announcements
- Tabs: Active | Drafts | History
- Active tab: PUBLISHED announcements not yet expired
- Drafts tab: DRAFT announcements (multiple allowed)
- History tab: EXPIRED and ARCHIVED announcements
- Table columns: Number, Title, Published Date, Expires, Status, Actions
- Actions: View, Edit (if draft), Copy, Archive, Delete, Print/Download PDF
- "Create New Announcement" button (top right)

**8. Print/PDF Support:**
- "Print Preview" button on announcement detail page
- "Download PDF" button
- PDF includes:
  - Company letterhead (from company profile - Story 2.8)
  - Announcement title and date
  - Full message body with formatting preserved
  - Professional layout suitable for physical distribution

**9. Dashboard Widget:**
- Admin dashboard shows "Announcements" card
- Displays count: "{n} Active Announcements"
- Click navigates to announcements list page
- Icon: campaign (Material Symbols)

**10. Tenant Portal View:**
- Route: /tenant/announcements (or dashboard section)
- Shows list of PUBLISHED (non-expired) announcements only
- List columns: Title, Date Published
- Click to view full announcement
- Download attachment if available
- Sorted by publishedAt DESC (newest first)

**11. API Endpoints:**
- POST /api/v1/announcements: Create announcement (draft)
- GET /api/v1/announcements: List all announcements (manager, with filters)
- GET /api/v1/announcements/{id}: Get announcement details
- PUT /api/v1/announcements/{id}: Update announcement (if draft)
- POST /api/v1/announcements/{id}/copy: Duplicate announcement as new draft
- PATCH /api/v1/announcements/{id}/publish: Publish announcement
- PATCH /api/v1/announcements/{id}/archive: Archive announcement
- DELETE /api/v1/announcements/{id}: Delete announcement
- GET /api/v1/announcements/{id}/pdf: Download PDF
- GET /api/v1/tenant/announcements: List active announcements for tenant
- GET /api/v1/dashboard/stats: Include announcementCount

**12. Email Template:**
- Create announcement email template at: /resources/email-templates/announcement.html
- Template variables: {{title}}, {{message}}, {{companyName}}, {{publishDate}}
- Include company logo (from company profile)
- Include "View Online" link to tenant portal

**13. Database Migration:**
- V44__create_announcements_table.sql
- Indexes on status, expiresAt, createdBy

**14. Scheduled Jobs:**
- AnnouncementExpiryJob: Daily at midnight, expires past-due announcements

**15. RBAC:**
- SUPER_ADMIN, ADMIN, PROPERTY_MANAGER: Full CRUD
- FINANCE_MANAGER, MAINTENANCE_SUPERVISOR: Read-only
- TENANT: Read active announcements only (via tenant portal)
- VENDOR: No access

**16. Sidebar Navigation:**
- Add "Announcements" menu item under main navigation
- Icon: campaign (Material Symbols)
- Route: /admin/announcements

**17. Tests:**
- Backend: AnnouncementServiceTest (CRUD, copy, publish, expiry job)
- Frontend: Validation tests, component tests
- All existing tests must pass

**Prerequisites:** Story 9.1 (Email notification system), Story 3.4 (Tenant portal - DONE), Story 2.8 (Company Profile - for PDF letterhead)

**Technical Notes:**
- Use Quill or TipTap for rich text editor
- Sanitize HTML input (DOMPurify) to prevent XSS
- Use iTextPDF (existing) for PDF generation
- Store attachments in S3: /uploads/announcements/{id}/
- Reference: docs/archive/stitch_building_maintenance_software/announcements_management_page/

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
