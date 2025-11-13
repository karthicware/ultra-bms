## Epic 9: Communication & Notifications

**Goal:** Implement email-based notification system and announcement management to keep all stakeholders informed.

### Story 9.1: Email Notification System

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

### Story 9.2: Announcement Management

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

## FR Coverage Matrix

This section validates that ALL functional requirements from the PRD are covered by the epic and story breakdown.

| FR ID | Functional Requirement | Epic(s) | Story(ies) |
|-------|------------------------|---------|------------|
| **FR1** | User Authentication & Access Control with password recovery and role-based access | Epic 2 | Story 2.1, 2.2, 2.3, 2.4 |
| **FR2** | Executive and Operational Dashboards with KPIs, analytics, and real-time insights | Epic 8 | Story 8.1, 8.2 |
| **FR3** | Tenant Onboarding with lease terms, parking allocation, document upload, and email notifications (including pre-tenancy lead management and quotations) | Epic 3 | Story 3.1, 3.3 |
| **FR4** | Tenant Lifecycle Management including portal access, maintenance requests, payment history | Epic 3 | Story 3.4, 3.5 |
| **FR5** | Tenant Self-Service Portal for maintenance requests, document access, announcements | Epic 3, Epic 9 | Story 3.4, 3.5, 9.2 |
| **FR6** | Work Order Creation and Management with priority levels, photo attachments, assignment | Epic 4 | Story 4.1, 4.3 |
| **FR7** | Preventive Maintenance Scheduling with recurring schedules and automated generation | Epic 4 | Story 4.2 |
| **FR8** | Job Progress Tracking with status updates, time logging, photo uploads | Epic 4 | Story 4.4 |
| **FR9** | Vendor Registration and Profile Management with service categories, rates, documents | Epic 5 | Story 5.1, 5.2 |
| **FR10** | Vendor Document and License Management with expiry tracking and auto-suspension | Epic 5 | Story 5.2 |
| **FR11** | Vendor Performance Tracking with ratings, job completion metrics, rankings | Epic 5 | Story 5.3 |
| **FR12** | Revenue Management with rent invoicing, payment recording, overdue tracking | Epic 6 | Story 6.1 |
| **FR13** | Expense Management with vendor payments, work order cost tracking, batch processing | Epic 6 | Story 6.2 |
| **FR14** | PDC Management with registration, deposit tracking, bounce handling, replacement workflow | Epic 6 | Story 6.3 |
| **FR15** | Financial Reporting with P&L, cash flow, AR aging, revenue/expense breakdowns | Epic 6 | Story 6.4 |
| **FR16** | Asset Registry and Tracking with maintenance history, warranty tracking, document storage | Epic 7 | Story 7.1 |
| **FR17** | Document Management System with version control, expiry tracking, access control | Epic 7 | Story 7.2 |
| **FR18** | Compliance and Inspection Tracking with regulatory requirements, schedules, violations | Epic 7 | Story 7.3 |
| **FR19** | Parking Management integrated with tenant onboarding (Mulkiya upload, spot allocation) | Epic 3 | Story 3.2 |
| **FR20** | Email Notification System and Announcement Management for stakeholder communication | Epic 9 | Story 9.1, 9.2 |

**Coverage Summary:**
- **Total FRs:** 20
- **FRs Covered:** 20
- **Coverage Rate:** 100%

All functional requirements from the PRD have been decomposed into epics and stories with detailed acceptance criteria.

---

## Epic Breakdown Summary

### Epic 1: Platform Foundation
**Stories:** 5
**Focus:** Project setup, database, API structure, caching, core domain models
**Status:** Simplified per user feedback (local PostgreSQL, Ehcache, no CI/CD, no AWS initially)

### Epic 2: Authentication & User Management
**Stories:** 5
**Focus:** JWT authentication, RBAC, password recovery, session management, security
**Status:** Simplified (removed MFA, SSO, vendor role is basic)

### Epic 3: Tenant Management
**Stories:** 5
**Focus:** Lead management and quotations, property setup, tenant onboarding with parking/Mulkiya, tenant portal, maintenance requests
**Status:** Revised (added leads and quotations feature, parking optional, physical documents, email-only notifications, photos only)

### Epic 4: Maintenance Operations
**Stories:** 4
**Focus:** Work orders, preventive maintenance, vendor assignment, progress tracking
**Status:** Significantly simplified (removed task checklists, effectiveness metrics, vendor portal, auto-assignment, quality inspection, detailed time logging)

### Epic 5: Vendor Management
**Stories:** 3
**Focus:** Vendor registration, document/license management, performance tracking
**Status:** Simplified approach without vendor portal

### Epic 6: Financial Management
**Stories:** 4
**Focus:** Rent invoicing, payments, expenses, PDC management, financial reporting
**Status:** Comprehensive with automated invoicing and PDC workflows

### Epic 7: Asset & Compliance Management
**Stories:** 3
**Focus:** Asset registry, document management, compliance/inspection tracking
**Status:** Integrated asset tracking with maintenance work orders

### Epic 8: Dashboard & Reporting
**Stories:** 2
**Focus:** Executive dashboard, role-specific operational dashboards
**Status:** Comprehensive KPIs and analytics across all modules

### Epic 9: Communication & Notifications
**Stories:** 2
**Focus:** Email notification system, announcement management
**Status:** Email-only as per user requirements (no SMS, no push)

**Total Stories:** 33 stories across 9 epics

---

## Implementation Notes

### Key Simplifications Made
Based on user feedback, the following simplifications were applied:

1. **Infrastructure:** Local PostgreSQL instead of RDS, Ehcache instead of Redis, no load balancer
2. **Authentication:** No MFA, no SSO implementation
3. **Tenant Management:** Physical documents (no digital signatures), email-only notifications, parking Mulkiya as single document
4. **Maintenance:** Removed vendor portal, auto-assignment rules, vendor acceptance workflow, quality inspection, detailed time tracking with start/end times, task checklists, effectiveness metrics
5. **Communication:** Email-only (no SMS, no push notifications)

### Technology Stack Summary
- **Frontend:** Next.js 14+, TypeScript, shadcn/ui, Tailwind CSS, React Hook Form, Zod
- **Backend:** Java 17, Spring Boot 3.x, Maven, Spring Security, Spring Data JPA
- **Database:** PostgreSQL 15+ (local for development)
- **Caching:** Ehcache 3.x
- **Email:** Gmail API
- **Deployment:** Monolithic application (AWS UAE deferred to final phase)
- **Timezone:** All system dates and times in UAE timezone (Gulf Standard Time - GST, UTC+4)

### Story Characteristics
- **Vertically sliced:** Each story delivers complete functionality
- **Sequentially ordered:** No forward dependencies
- **BDD acceptance criteria:** Given/When/Then/And format throughout
- **Implementation-ready:** Detailed technical notes and prerequisites for each story

### Next Steps in BMad Method
1. **UX Design Workflow:** Add interaction details to story acceptance criteria
2. **Architecture Workflow:** Add technical decisions and data models to story technical notes
3. **Phase 4 Implementation:** Execute stories with full context from PRD + epics + UX + Architecture

---

**Document Generated:** November 2025
**Project:** Ultra BMS - Building Maintenance Software Platform
**Method:** BMad Method - Epic and Story Decomposition Workflow
**Status:** ✅ Complete - Ready for UX Design Workflow

---
