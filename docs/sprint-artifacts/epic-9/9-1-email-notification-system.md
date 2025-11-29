# Story 9.1: Email Notification System

Status: drafted

## Story

As a system administrator,
I want an automated email notification system,
So that users are informed of important events and updates via email.

## Acceptance Criteria

### Email Configuration (AC 1-4)
1. Gmail API configured for email sending via Spring Mail
2. SMTP settings in application.yml: Gmail credentials, sender email (noreply@ultrabms.com), sender display name ("Ultra BMS")
3. Email connection tested on application startup (logs success/failure)
4. Fallback to SMTP if Gmail API fails

### Email Notification Entity (AC 5-11)
5. `EmailNotification` entity created with: id (UUID), recipientEmail, recipientName, notificationType (enum), subject, body (HTML), entityType, entityId, status (PENDING/SENT/FAILED/QUEUED), sentAt, failedAt, failureReason, retryCount (max 3), createdAt
6. `email_notifications` table with Flyway migration (V45)
7. Indexes on status, createdAt, notificationType
8. `EmailNotificationRepository` with query methods: findByStatus, findByStatusAndRetryCountLessThan

### Notification Types Enum (AC 12)
9. `NotificationType` enum with all triggers:
   - AUTH: PASSWORD_RESET_REQUESTED, PASSWORD_CHANGED, NEW_USER_CREATED
   - TENANT: TENANT_ONBOARDED, LEASE_UPLOADED, LEASE_EXPIRING_90, LEASE_EXPIRING_60, LEASE_EXPIRING_30
   - MAINTENANCE: MAINTENANCE_REQUEST_SUBMITTED, WORK_ORDER_ASSIGNED, WORK_ORDER_STATUS_CHANGED, WORK_ORDER_COMPLETED
   - FINANCIAL: INVOICE_GENERATED, PAYMENT_RECEIVED, INVOICE_OVERDUE_7, INVOICE_OVERDUE_14, INVOICE_OVERDUE_30, PDC_DUE_SOON, PDC_BOUNCED
   - VENDOR: VENDOR_REGISTERED, VENDOR_DOCUMENT_EXPIRING, VENDOR_LICENSE_EXPIRED
   - COMPLIANCE: COMPLIANCE_DUE_SOON, COMPLIANCE_OVERDUE, INSPECTION_SCHEDULED
   - DOCUMENT: DOCUMENT_UPLOADED, DOCUMENT_EXPIRING
   - ANNOUNCEMENT: ANNOUNCEMENT_PUBLISHED

### Email Templates (AC 13-17)
10. HTML email templates in `/resources/email-templates/` using Thymeleaf
11. Base template with: company logo, personalized greeting, event details, call-to-action button, footer with contact
12. Template variables: {{recipientName}}, {{companyName}}, {{actionUrl}}, plus type-specific variables
13. Plain text fallback for all templates
14. Templates created for at least 5 core types: password-reset, welcome-user, invoice-generated, payment-received, maintenance-request-submitted

### Email Sending Service (AC 18-23)
15. `EmailNotificationService` with async email sending using `@Async`
16. `sendEmail(NotificationType type, String recipientEmail, String recipientName, Map<String, Object> variables, String entityType, Long entityId)` method
17. Emails queued as PENDING, processed by scheduled job
18. `EmailSenderJob` runs every 1 minute processing PENDING and QUEUED emails (batch size 50)
19. Retry failed emails with exponential backoff: 1 min, 5 min, 15 min (max 3 attempts)
20. Log all email attempts (success/failure) for audit via SLF4J

### Email Attachments (AC 24-25)
21. Support email attachments (invoices, receipts as PDF)
22. `sendEmailWithAttachment(...)` method accepting byte[] or S3 path

### Notification Settings (AC 26-30)
23. `NotificationSettings` entity: id, eventType, emailEnabled (default true), frequency (IMMEDIATE/DAILY_DIGEST/WEEKLY_DIGEST)
24. System-level notification settings (admin configurable)
25. Default: all notifications enabled, immediate delivery
26. `NotificationSettingsService` for CRUD operations

### API Endpoints (AC 31-36)
27. `POST /api/v1/notifications/send` - Send immediate email (admin only)
28. `GET /api/v1/notifications` - List notification history (paginated, with filters)
29. `GET /api/v1/notifications/{id}` - Get notification details
30. `POST /api/v1/notifications/retry/{id}` - Retry failed notification
31. `GET /api/v1/notifications/settings` - Get notification settings
32. `PUT /api/v1/notifications/settings` - Update notification settings

### Admin UI (AC 37-40)
33. Email logs page at `/admin/notifications` with table: recipient, type, subject, status, sentAt
34. Filter by status, type, date range
35. "Retry" button for FAILED notifications
36. "Send Test Email" feature to verify email configuration

### RBAC (AC 41)
37. SUPER_ADMIN, ADMIN: Full access to notifications management
38. PROPERTY_MANAGER, FINANCE_MANAGER, MAINTENANCE_SUPERVISOR: View own triggered notifications
39. TENANT, VENDOR: No access to admin notifications UI

### Testing (AC 42-44)
40. `EmailNotificationServiceTest` with unit tests for all notification types
41. `EmailSenderJobTest` for scheduler and retry logic
42. Frontend: Validation tests, notification list component tests
43. All existing tests must pass

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1: Create database migration and entities (AC: 5-8)
  - [ ] 1.1 Create V45__create_email_notifications_table.sql migration
  - [ ] 1.2 Create EmailNotification entity with all fields
  - [ ] 1.3 Create NotificationType enum with all trigger types
  - [ ] 1.4 Create EmailNotificationStatus enum (PENDING, QUEUED, SENT, FAILED)
  - [ ] 1.5 Create EmailNotificationRepository with query methods

- [ ] Task 2: Configure email sending infrastructure (AC: 1-4)
  - [ ] 2.1 Add Spring Mail configuration to application.yml (Gmail SMTP)
  - [ ] 2.2 Create EmailConfig class with JavaMailSender bean
  - [ ] 2.3 Add Gmail API credentials to application properties
  - [ ] 2.4 Implement startup connection test with health indicator

- [ ] Task 3: Create email templates (AC: 10-14)
  - [ ] 3.1 Create base email template (base-email.html) with company branding
  - [ ] 3.2 Create password-reset.html template
  - [ ] 3.3 Create welcome-user.html template
  - [ ] 3.4 Create invoice-generated.html template
  - [ ] 3.5 Create payment-received.html template
  - [ ] 3.6 Create maintenance-request-submitted.html template
  - [ ] 3.7 Create plain text fallback versions (.txt)

- [ ] Task 4: Implement EmailNotificationService (AC: 15-20)
  - [ ] 4.1 Create EmailNotificationService with @Async sendEmail method
  - [ ] 4.2 Implement template rendering with Thymeleaf
  - [ ] 4.3 Create EmailSenderJob scheduled task (every 1 minute)
  - [ ] 4.4 Implement exponential backoff retry logic (1, 5, 15 minutes)
  - [ ] 4.5 Add comprehensive logging for audit trail

- [ ] Task 5: Implement attachment support (AC: 21-22)
  - [ ] 5.1 Add sendEmailWithAttachment method
  - [ ] 5.2 Support byte[] attachments (in-memory PDFs)
  - [ ] 5.3 Support S3 path attachments (download and attach)

- [ ] Task 6: Implement notification settings (AC: 23-26)
  - [ ] 6.1 Create NotificationSettings entity and repository
  - [ ] 6.2 Create V46__create_notification_settings_table.sql
  - [ ] 6.3 Create NotificationSettingsService
  - [ ] 6.4 Seed default settings on application startup

- [ ] Task 7: Create REST API endpoints (AC: 27-32)
  - [ ] 7.1 Create EmailNotificationController
  - [ ] 7.2 Implement POST /api/v1/notifications/send
  - [ ] 7.3 Implement GET /api/v1/notifications (paginated)
  - [ ] 7.4 Implement GET /api/v1/notifications/{id}
  - [ ] 7.5 Implement POST /api/v1/notifications/retry/{id}
  - [ ] 7.6 Create NotificationSettingsController
  - [ ] 7.7 Implement GET/PUT /api/v1/notifications/settings

- [ ] Task 8: Backend testing (AC: 40-42)
  - [ ] 8.1 Create EmailNotificationServiceTest (20+ test cases)
  - [ ] 8.2 Create EmailSenderJobTest for scheduler logic
  - [ ] 8.3 Create EmailNotificationControllerTest

### Frontend Tasks

- [ ] Task 9: Create TypeScript types and validation (AC: 33-36)
  - [ ] 9.1 Create notification.ts types (EmailNotification, NotificationSettings)
  - [ ] 9.2 Create notification validation schemas with Zod
  - [ ] 9.3 Create notification.service.ts API client

- [ ] Task 10: Create notifications management pages (AC: 33-36)
  - [ ] 10.1 Create /admin/notifications page with data table
  - [ ] 10.2 Add filters: status, type, date range
  - [ ] 10.3 Implement "Retry" action for failed notifications
  - [ ] 10.4 Create notification detail dialog

- [ ] Task 11: Create notification settings page (AC: 31-32)
  - [ ] 11.1 Create /admin/notifications/settings page
  - [ ] 11.2 Implement toggle switches for each notification type
  - [ ] 11.3 Implement frequency selector (immediate/daily/weekly)

- [ ] Task 12: Create test email feature (AC: 36)
  - [ ] 12.1 Add "Send Test Email" button to settings page
  - [ ] 12.2 Create SendTestEmailDialog component
  - [ ] 12.3 Display success/failure feedback

- [ ] Task 13: Frontend testing (AC: 43)
  - [ ] 13.1 Create notification validation tests
  - [ ] 13.2 Create NotificationList component tests
  - [ ] 13.3 Create NotificationSettings page tests

## Final Validation Requirements

**MANDATORY:** These requirements apply to ALL stories and MUST be completed after all implementation tasks are done. The dev agent CANNOT mark a story complete without passing all validations.

### FV-1: Test Execution (Backend)
Execute full backend test suite: `mvn test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Document test results in Completion Notes

### FV-2: Test Execution (Frontend)
Execute full frontend test suite: `npm test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Excludes E2E tests (run separately if story includes E2E)

### FV-3: Build Verification (Backend)
Execute backend compilation: `mvn compile`
- Zero compilation errors required
- Zero Checkstyle violations (if configured)

### FV-4: Build Verification (Frontend)
Execute frontend build: `npm run build`
- Zero TypeScript compilation errors
- Zero lint errors
- Build must complete successfully

### FV-5: Lint Check (Frontend)
Execute lint check: `npm run lint`
- Zero lint errors required
- Fix any errors before marking story complete

## Dev Notes

### Architecture Patterns
- Use Spring Mail with Thymeleaf for template rendering [Source: docs/architecture.md#Integration-Points]
- Async processing with @Async and ThreadPoolTaskExecutor [Source: docs/architecture.md#ADR-003]
- Store email logs in email_notifications table for audit [Source: docs/PRD.md#3.11.2]

### Project Structure Notes
- Backend: `com.ultrabms.notification.*` package
- Email templates: `resources/email-templates/`
- Frontend: `/admin/notifications` route

### Implementation Notes
- Gmail SMTP: smtp.gmail.com:587 with TLS
- Use App Password for Gmail (not OAuth for simplicity in MVP)
- Thymeleaf for HTML template rendering
- ThreadPoolTaskExecutor with 5-10 threads for async email
- Scheduled job uses @Scheduled(fixedRate = 60000)
- Exponential backoff: Math.pow(5, retryCount) minutes

### Integration Points
- Existing email functionality in AuthService (password reset) - REFACTOR to use this service
- Invoice PDF generation from Story 6.1 - use for invoice email attachments
- S3 file storage from Story 1.6 - for attachment downloads

### References
- [Source: docs/PRD.md#3.11-Communication-Notifications]
- [Source: docs/architecture.md#Epic-to-Architecture-Mapping]
- [Source: docs/epics/epic-9-communication-notifications.md#Story-9.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-29 | Story drafted | SM Agent |

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

