# Story 9.2: Internal Announcement Management

Status: ready-for-dev

## Story

As a property manager,
I want to create and publish internal announcements,
So that I can communicate important information to all tenants via email and website.

## Acceptance Criteria

### Announcement Entity (AC 1-8)
1. `Announcement` entity created with: id (UUID), announcementNumber (unique, format: ANN-2025-0001), title (max 200 chars), message (HTML), templateUsed (nullable enum), expiresAt (datetime, required), status (DRAFT/PUBLISHED/EXPIRED/ARCHIVED), publishedAt (nullable), attachmentFilePath (nullable), createdBy (userId), createdAt, updatedAt
2. `AnnouncementTemplate` enum: OFFICE_CLOSURE, MAINTENANCE_SCHEDULE, POLICY_UPDATE
3. `AnnouncementStatus` enum: DRAFT, PUBLISHED, EXPIRED, ARCHIVED
4. `announcements` table with Flyway migration (V47)
5. Indexes on status, expiresAt, createdBy
6. `AnnouncementRepository` with query methods

### Announcement Creation Form (AC 9-14)
7. Create announcement form with: title (required, max 200), message (rich text editor), template selector (optional dropdown), expiry date (required, future date), attachment (optional, PDF, max 5MB)
8. Rich text editor with: Bold, Italic, Underline, Lists, Headings, Tables, Images
9. Template selector populates default content when selected
10. Validation: title required, expiry date must be future, attachment max 5MB PDF only

### Copy/Duplicate Announcement (AC 15-18)
11. "Copy" action available on existing announcements (any status)
12. Creates new draft with "[Copy] Original Title"
13. Copies: title, message, template, attachment (NOT expiry date)
14. Redirects to edit form for new draft

### Multiple Drafts Support (AC 19-21)
15. Multiple announcements can exist in DRAFT status simultaneously
16. Drafts tab shows all unpublished announcements
17. Each draft can be edited, published, or deleted independently

### Announcement Publishing (AC 22-26)
18. "Publish" button on draft detail page
19. On publish: status = PUBLISHED, publishedAt = now
20. Email sent to ALL active tenants with subject "Announcement: {title}"
21. Email includes: rendered message HTML, attachment if present
22. Cannot edit published announcements (only archive/delete)

### Expiry Handling (AC 27-30)
23. `AnnouncementExpiryJob` runs daily at midnight
24. Announcements with expiresAt < now AND status = PUBLISHED set to EXPIRED
25. Expired announcements hidden from tenant portal
26. Expired announcements visible in History tab (manager view)

### Announcement List Page - Manager View (AC 31-38)
27. Route: /admin/announcements
28. Tabs: Active | Drafts | History
29. Active tab: PUBLISHED announcements not yet expired
30. Drafts tab: DRAFT announcements (multiple allowed)
31. History tab: EXPIRED and ARCHIVED announcements
32. Table columns: Number, Title, Published Date, Expires, Status, Actions
33. Actions: View, Edit (if draft), Copy, Archive, Delete, Print/Download PDF
34. "Create New Announcement" button (top right)

### Print/PDF Support (AC 39-43)
35. "Print Preview" button on announcement detail page
36. "Download PDF" button
37. PDF includes: company letterhead (from company profile - Story 2.8), announcement title and date, full message body with formatting preserved
38. Professional layout suitable for physical distribution
39. Use iTextPDF (existing library from Story 6.1)

### Dashboard Widget (AC 44-46)
40. Admin dashboard shows "Announcements" card
41. Displays count: "{n} Active Announcements"
42. Click navigates to announcements list page
43. Icon: campaign (Lucide: Megaphone)

### Tenant Portal View (AC 47-51)
44. Route: /tenant/announcements (or dashboard section)
45. Shows list of PUBLISHED (non-expired) announcements only
46. List columns: Title, Date Published
47. Click to view full announcement
48. Download attachment if available
49. Sorted by publishedAt DESC (newest first)

### API Endpoints (AC 52-62)
50. `POST /api/v1/announcements` - Create announcement (draft)
51. `GET /api/v1/announcements` - List all announcements (manager, with filters: status, page, size)
52. `GET /api/v1/announcements/{id}` - Get announcement details
53. `PUT /api/v1/announcements/{id}` - Update announcement (if draft)
54. `POST /api/v1/announcements/{id}/copy` - Duplicate announcement as new draft
55. `PATCH /api/v1/announcements/{id}/publish` - Publish announcement
56. `PATCH /api/v1/announcements/{id}/archive` - Archive announcement
57. `DELETE /api/v1/announcements/{id}` - Delete announcement
58. `GET /api/v1/announcements/{id}/pdf` - Download PDF
59. `GET /api/v1/tenant/announcements` - List active announcements for tenant
60. Dashboard stats endpoint includes announcementCount

### Email Template (AC 63-65)
61. Create announcement email template at: /resources/email-templates/announcement.html
62. Template variables: {{title}}, {{message}}, {{companyName}}, {{publishDate}}
63. Include company logo and "View Online" link to tenant portal

### Sidebar Navigation (AC 66-68)
64. Add "Announcements" menu item under main navigation
65. Icon: campaign (Lucide: Megaphone)
66. Route: /admin/announcements

### RBAC (AC 69-71)
67. SUPER_ADMIN, ADMIN, PROPERTY_MANAGER: Full CRUD
68. FINANCE_MANAGER, MAINTENANCE_SUPERVISOR: Read-only
69. TENANT: Read active announcements only (via tenant portal)
70. VENDOR: No access

### Testing (AC 72-74)
71. `AnnouncementServiceTest` with unit tests: CRUD, copy, publish, expiry job
72. Frontend: Validation tests, component tests
73. All existing tests must pass

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1: Create database migration and entities (AC: 1-6)
  - [ ] 1.1 Create V47__create_announcements_table.sql migration
  - [ ] 1.2 Create Announcement entity with all fields
  - [ ] 1.3 Create AnnouncementTemplate enum
  - [ ] 1.4 Create AnnouncementStatus enum
  - [ ] 1.5 Create AnnouncementRepository with query methods
  - [ ] 1.6 Add announcementNumber generation logic (ANN-YYYY-####)

- [ ] Task 2: Implement AnnouncementService (AC: 11-14, 18-22)
  - [ ] 2.1 Create AnnouncementService with CRUD operations
  - [ ] 2.2 Implement createAnnouncement (creates as DRAFT)
  - [ ] 2.3 Implement updateAnnouncement (only DRAFT allowed)
  - [ ] 2.4 Implement copyAnnouncement (creates new draft with [Copy] prefix)
  - [ ] 2.5 Implement publishAnnouncement (validates, sends emails, updates status)
  - [ ] 2.6 Implement archiveAnnouncement
  - [ ] 2.7 Implement deleteAnnouncement
  - [ ] 2.8 Integrate with EmailNotificationService for publish emails

- [ ] Task 3: Implement attachment upload (AC: 7, 10)
  - [ ] 3.1 Add attachment upload endpoint
  - [ ] 3.2 Validate PDF only, max 5MB
  - [ ] 3.3 Store in S3: /uploads/announcements/{id}/
  - [ ] 3.4 Update Announcement with attachmentFilePath

- [ ] Task 4: Implement PDF generation (AC: 35-39)
  - [ ] 4.1 Create AnnouncementPdfService
  - [ ] 4.2 Use iTextPDF for PDF generation
  - [ ] 4.3 Include company letterhead from CompanyProfile
  - [ ] 4.4 Include announcement title, date, message with formatting
  - [ ] 4.5 Implement GET /api/v1/announcements/{id}/pdf endpoint

- [ ] Task 5: Create expiry job (AC: 23-26)
  - [ ] 5.1 Create AnnouncementExpiryJob scheduled task
  - [ ] 5.2 Run daily at midnight: @Scheduled(cron = "0 0 0 * * *")
  - [ ] 5.3 Update expired announcements status to EXPIRED
  - [ ] 5.4 Add logging for expired announcements

- [ ] Task 6: Create REST API endpoints (AC: 50-60)
  - [ ] 6.1 Create AnnouncementController
  - [ ] 6.2 Implement POST /api/v1/announcements
  - [ ] 6.3 Implement GET /api/v1/announcements (paginated, filtered)
  - [ ] 6.4 Implement GET /api/v1/announcements/{id}
  - [ ] 6.5 Implement PUT /api/v1/announcements/{id}
  - [ ] 6.6 Implement POST /api/v1/announcements/{id}/copy
  - [ ] 6.7 Implement PATCH /api/v1/announcements/{id}/publish
  - [ ] 6.8 Implement PATCH /api/v1/announcements/{id}/archive
  - [ ] 6.9 Implement DELETE /api/v1/announcements/{id}
  - [ ] 6.10 Create TenantAnnouncementController
  - [ ] 6.11 Implement GET /api/v1/tenant/announcements
  - [ ] 6.12 Update dashboard stats to include announcementCount

- [ ] Task 7: Create email template (AC: 61-63)
  - [ ] 7.1 Create announcement.html email template
  - [ ] 7.2 Add template variables support
  - [ ] 7.3 Include company logo and "View Online" link

- [ ] Task 8: Backend testing (AC: 71)
  - [ ] 8.1 Create AnnouncementServiceTest (20+ test cases)
  - [ ] 8.2 Create AnnouncementExpiryJobTest
  - [ ] 8.3 Create AnnouncementControllerTest

### Frontend Tasks

- [ ] Task 9: Create TypeScript types and validation (AC: 7-10)
  - [ ] 9.1 Create announcement.ts types (Announcement, AnnouncementTemplate, AnnouncementStatus)
  - [ ] 9.2 Create announcement validation schemas with Zod
  - [ ] 9.3 Create announcement.service.ts API client

- [ ] Task 10: Create announcement management pages (AC: 27-34)
  - [ ] 10.1 Create /admin/announcements page layout with tabs
  - [ ] 10.2 Create Active tab component
  - [ ] 10.3 Create Drafts tab component
  - [ ] 10.4 Create History tab component
  - [ ] 10.5 Create announcement data table with columns and actions
  - [ ] 10.6 Add "Create New Announcement" button

- [ ] Task 11: Create announcement form (AC: 7-10)
  - [ ] 11.1 Create /admin/announcements/new page
  - [ ] 11.2 Create /admin/announcements/[id]/edit page
  - [ ] 11.3 Install rich text editor (TipTap or Quill)
  - [ ] 11.4 Implement template selector dropdown
  - [ ] 11.5 Implement expiry date picker (future dates only)
  - [ ] 11.6 Implement PDF attachment upload (max 5MB)

- [ ] Task 12: Create announcement detail page (AC: 35-38)
  - [ ] 12.1 Create /admin/announcements/[id] page
  - [ ] 12.2 Display announcement content with formatting
  - [ ] 12.3 Add "Publish" button for drafts
  - [ ] 12.4 Add "Print Preview" button
  - [ ] 12.5 Add "Download PDF" button
  - [ ] 12.6 Add "Copy", "Archive", "Delete" actions

- [ ] Task 13: Create tenant portal view (AC: 44-49)
  - [ ] 13.1 Create /tenant/announcements page
  - [ ] 13.2 List active announcements (sorted by publishedAt DESC)
  - [ ] 13.3 Create announcement view dialog/page
  - [ ] 13.4 Add attachment download button

- [ ] Task 14: Create dashboard widget (AC: 40-43)
  - [ ] 14.1 Create AnnouncementsCard component
  - [ ] 14.2 Display active announcement count
  - [ ] 14.3 Add click navigation to /admin/announcements
  - [ ] 14.4 Use Megaphone icon from Lucide

- [ ] Task 15: Update sidebar navigation (AC: 64-66)
  - [ ] 15.1 Add "Announcements" menu item to sidebar
  - [ ] 15.2 Use Megaphone icon
  - [ ] 15.3 Route to /admin/announcements

- [ ] Task 16: Frontend testing (AC: 72)
  - [ ] 16.1 Create announcement validation tests
  - [ ] 16.2 Create AnnouncementForm component tests
  - [ ] 16.3 Create AnnouncementList component tests
  - [ ] 16.4 Create TenantAnnouncementView tests

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
- Use Thymeleaf for email template rendering [Source: docs/architecture.md#Email-Service]
- iTextPDF for PDF generation (already used in Story 6.1) [Source: docs/sprint-artifacts/epic-6/6-1-rent-invoicing-and-payment-management.md]
- S3 for attachment storage [Source: docs/architecture.md#Storage]
- @Scheduled for expiry job [Source: docs/architecture.md#ADR-003]

### Project Structure Notes
- Backend: `com.ultrabms.announcement.*` package
- Frontend: `/admin/announcements`, `/tenant/announcements` routes
- Email template: `resources/email-templates/announcement.html`
- S3 path: `/uploads/announcements/{id}/`

### Scope Simplifications (SCP #6)
- Email + Website delivery only (no SMS, no in-app push)
- All tenants always (no targeting)
- No emergency broadcasts or categories
- Expiry date with auto-archive
- Printable/PDF support
- Dashboard widget (active count)
- Copy/duplicate announcements
- Multiple drafts allowed

### Implementation Notes
- Rich text editor: Use TipTap (React-friendly, TypeScript support)
- Sanitize HTML input with DOMPurify to prevent XSS
- announcementNumber format: ANN-{year}-{4-digit-sequence}
- Use CompanyProfile (Story 2.8) for letterhead in PDF
- Integrate with EmailNotificationService (Story 9.1) for publishing emails

### Dependencies
- Story 9.1 (Email Notification System) - for email sending
- Story 3.4 (Tenant Portal) - DONE - for tenant announcement view
- Story 2.8 (Company Profile) - DONE - for PDF letterhead

### References
- [Source: docs/PRD.md#3.11.1-Internal-Announcement-Management]
- [Source: docs/architecture.md#Communication-Notifications]
- [Source: docs/epics/epic-9-communication-notifications.md#Story-9.2]
- [Source: docs/archive/stitch_building_maintenance_software/announcements_management_page/]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-29 | Story drafted | SM Agent |

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-9/9-2-internal-announcement-management.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

