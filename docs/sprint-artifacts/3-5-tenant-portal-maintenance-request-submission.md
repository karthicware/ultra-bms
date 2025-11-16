# Story 3.5: Tenant Portal - Maintenance Request Submission

Status: drafted

## Story

As a tenant,
I want to submit maintenance requests through the portal,
So that I can report issues and track their resolution.

## Acceptance Criteria

1. **AC1 - Maintenance Request Form Route and Structure:** Tenant maintenance request submission accessible at /tenant/requests/new for users with TENANT role. Uses Next.js App Router within (dashboard) route group. Form page is client component with React Hook Form state management. Form sections: Request Details (category, priority, title, description), Access Preferences (time, date), Photo Attachments (up to 5 images). Implements responsive layout: single column full-width on mobile, max-width container (768px) centered on desktop. Skeleton loader shown while category options load. Page requires authentication middleware - redirect to /login if not authenticated. Breadcrumb navigation: Dashboard > Maintenance Requests > Submit Request. [Source: docs/epics/epic-3-tenant-management-portal.md#story-35-tenant-portal-maintenance-request-submission, docs/architecture.md#frontend-implementation-patterns]

2. **AC2 - Request Details Section:** Category dropdown (shadcn Select) with options: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, OTHER (required). Priority auto-suggested based on category mapping: HIGH (ELECTRICAL, HVAC, PEST_CONTROL), MEDIUM (PLUMBING, APPLIANCE, CARPENTRY), LOW (CLEANING, OTHER). Priority editable via shadcn Radio Group: HIGH (red badge), MEDIUM (yellow badge), LOW (green badge). Title input (shadcn Input, required, max 100 chars, placeholder: "e.g., Leaking kitchen faucet"). Description rich text area (shadcn Textarea, required, min 20 chars, max 1000 chars, rows=6, placeholder: "Please describe the issue in detail..."). Show character counter below description: "{count}/1000 characters" updating in real-time. All fields use Zod validation schema with inline error display. [Source: docs/epics/epic-3-tenant-management-portal.md#request-details, docs/architecture.md#form-pattern-with-react-hook-form-zod]

3. **AC3 - Access Preferences Section:** Preferred access time shadcn Select (required) with options: "Immediate (Emergency)", "Morning (8 AM - 12 PM)", "Afternoon (12 PM - 5 PM)", "Evening (5 PM - 8 PM)", "Any Time". Preferred access date shadcn Calendar date picker (required, default: today for HIGH priority, tomorrow for MEDIUM/LOW, validation: ≥ today). Display note when priority is HIGH: "⚠️ High priority requests will be assigned immediately. Property management will contact you to confirm access." Auto-select "Immediate" for HIGH priority requests. Date format: "dd MMM yyyy" (e.g., "16 Nov 2025") using date-fns. All dates in UAE timezone (GST). [Source: docs/epics/epic-3-tenant-management-portal.md#request-details, docs/architecture.md#date-and-time-handling]

4. **AC4 - Photo Attachments Section:** Multi-file upload zone using react-dropzone (drag-and-drop or click to browse). Accept: JPG/PNG only, max 5MB per file, maximum 5 photos total. Display note: "📷 Adding photos helps us resolve your request faster. Video uploads not supported." For each uploaded photo: show thumbnail preview (120x120px), display filename and file size (formatted as KB/MB), show remove button (X icon, accessible label "Remove photo"). Photo preview grid: 1 column on mobile, 3 columns on desktop. Client-side validation: reject files > 5MB (show toast error), reject non-image files (show toast error), limit to 5 photos (disable upload when limit reached). Store photos in form state as File objects, compress before upload on submit (target ~500KB per image using browser-image-compression library). [Source: docs/epics/epic-3-tenant-management-portal.md#attachments, docs/architecture.md#file-handling]

5. **AC5 - Form Validation and Submission:** Zod validation schema createMaintenanceRequestSchema with rules: category (required enum), priority (required enum: HIGH, MEDIUM, LOW), title (required, min 1 char, max 100 chars), description (required, min 20 chars, max 1000 chars), preferredAccessTime (required enum), preferredAccessDate (required, must be ≥ today using date-fns isAfter or isSameDay), photos (optional array, max 5 files, each ≤ 5MB, types: image/jpeg, image/png). Form uses React Hook Form with zodResolver. Submit button: "Submit Request" (shadcn Button primary variant, full-width on mobile, loading spinner during submission, disabled if form invalid or uploading). On validation failure: focus first error field, display inline errors below fields in red text, show toast: "Please fix validation errors before submitting". [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod, docs/architecture.md#validation]

6. **AC6 - Request Submission and Backend Processing:** On form submit: compress all photos using browser-image-compression (maxSizeMB: 0.5, maxWidthOrHeight: 1920), construct multipart/form-data payload, call POST /api/v1/maintenance-requests with body: {category, priority, title, description, preferredAccessTime, preferredAccessDate, tenantId (from auth context), photos[]}. Backend creates MaintenanceRequest entity with: id (UUID), tenantId (FK from JWT), unitId (from tenant.unitId), propertyId (from unit.propertyId), requestNumber (unique, format: MR-2025-0001 auto-increment), category, priority, title, description, preferredAccessTime, preferredAccessDate, status (default: SUBMITTED), submittedAt (UTC timestamp), assignedTo (null initially), attachments (array of S3/file paths). Upload photos to /uploads/maintenance/{requestId}/, generate thumbnails (200x200px) for list view. Return response: {success: true, data: {requestNumber, id, status, submittedAt}}. [Source: docs/epics/epic-3-tenant-management-portal.md#request-submission, docs/architecture.md#rest-api-conventions]

7. **AC7 - Post-Submission Flow and Notifications:** On successful submission: show success toast: "Request #{requestNumber} submitted successfully!", invalidate React Query cache: ['tenant', 'maintenance-requests'], redirect to request details page: /tenant/requests/{id} after 2 seconds. Backend triggers: send email to tenant (confirmation with request number, subject: "Maintenance Request #{requestNumber} Submitted"), send email to property manager (new request notification, subject: "New Maintenance Request: {title}", include link to management portal), create audit log entry (action: "MAINTENANCE_REQUEST_SUBMITTED", userId: tenantId, entityType: "MAINTENANCE_REQUEST", entityId: requestId). If submission fails: show error toast: "Failed to submit request. Please try again.", keep form data intact (don't clear), enable retry. [Source: docs/epics/epic-3-tenant-management-portal.md#after-submission, docs/architecture.md#email-service]

8. **AC8 - Requests List Page:** Requests list at /tenant/requests displays all tenant's requests in reverse chronological order (newest first). Use shadcn Table component with columns: Request # (clickable link), Title, Category (with icon), Status Badge, Priority (colored badge), Submitted Date (formatted "dd MMM yyyy"), Last Updated (relative time "2 hours ago" using date-fns formatDistanceToNow). Filter controls: status filter (shadcn Select: All, Open, In Progress, Completed, Closed, default: All), category filter (shadcn Select: All categories or specific), date range picker (shadcn Calendar for from/to dates). Search input (shadcn Input with search icon, placeholder: "Search by title, request number..."). Empty state: "No maintenance requests found. Submit your first request to get started." with button to /tenant/requests/new. Pagination: 20 requests per page with shadcn Pagination component. [Source: docs/epics/epic-3-tenant-management-portal.md#request-tracking-page, docs/architecture.md#component-pattern]

9. **AC9 - Request Status Badges:** Status badge visual design using shadcn Badge component: SUBMITTED (yellow badge, text: "Waiting for Assignment"), ASSIGNED (blue badge, text: "Assigned to Vendor"), IN_PROGRESS (orange badge, text: "Work in Progress"), COMPLETED (green badge, text: "Work Completed"), CLOSED (gray badge, text: "Closed"). Priority badges: HIGH (red background, white text), MEDIUM (yellow background, dark text), LOW (green background, white text). Category icons (lucide-react): PLUMBING (Droplet icon), ELECTRICAL (Zap icon), HVAC (Wind icon), APPLIANCE (Tv icon), CARPENTRY (Hammer icon), PEST_CONTROL (Bug icon), CLEANING (Sparkles icon), OTHER (Wrench icon). Badges have consistent height (28px) and rounded corners (radius: 4px). [Source: docs/epics/epic-3-tenant-management-portal.md#request-tracking-page, docs/ux-design-specification.md#color-system]

10. **AC10 - Request Details Page Structure:** Request details at /tenant/requests/{id} shows complete request information. Page layout: breadcrumb navigation (Dashboard > Requests > #{requestNumber}), request header (title, requestNumber badge, priority badge, status badge), request details card (category with icon, description, submitted date, last updated), access preferences card (preferred time, preferred date), photo gallery section (thumbnails grid, click to enlarge in lightbox), status timeline section (vertical timeline with checkpoints), assigned vendor section (if assigned: vendor name, contact info, estimated completion date), work notes section (visible after completion, vendor's notes), completion photos section (before/after photos from vendor if provided). Action buttons (context-aware): Cancel Request (if status = SUBMITTED, shows confirmation dialog), Submit Feedback (if status = COMPLETED, shows feedback form). [Source: docs/epics/epic-3-tenant-management-portal.md#request-details-page, docs/architecture.md#component-pattern]

11. **AC11 - Status Timeline Component:** Vertical timeline showing request progression with shadcn Timeline-style component (custom). Timeline checkpoints: (1) Submitted (always shown, timestamp from submittedAt), (2) Assigned (shown if assignedAt exists, display: "Assigned to {vendorName} on {date}"), (3) In Progress (shown if inProgressAt exists, display: "Work started on {date}"), (4) Completed (shown if completedAt exists, display: "Work completed on {date}"), (5) Closed (shown if closedAt exists, display: "Request closed on {date}"). Active checkpoint: filled circle with colored border (green), future checkpoints: empty circle with gray border, past checkpoints: filled circle with check icon. Connecting line between checkpoints (vertical dashed line on desktop, solid on mobile). Timeline updates in real-time via polling (30 seconds) or WebSocket connection. [Source: docs/epics/epic-3-tenant-management-portal.md#request-details-page, docs/architecture.md#real-time-updates]

12. **AC12 - Photo Gallery and Lightbox:** Photo thumbnails displayed in grid: 2 columns on mobile, 4 columns on desktop, each thumbnail 200x200px with border and shadow. Click thumbnail to open lightbox (shadcn Dialog fullscreen) with: large image display (max 90% viewport), navigation arrows (prev/next photo), close button (X icon, top-right), photo counter: "1 of 3", zoom in/out buttons (optional). Lightbox navigation: arrow keys (left/right), escape to close, swipe gestures on mobile. Load full-size images lazily in lightbox (show spinner during load). Completion photos section (if request completed and vendor uploaded photos): separate grid labeled "Before & After Photos", shows vendor's uploaded images with same lightbox functionality. [Source: docs/epics/epic-3-tenant-management-portal.md#request-details-page]

13. **AC13 - Tenant Feedback Submission:** Feedback form shown only if request status = COMPLETED and feedback not yet submitted. Form includes: star rating component (1-5 stars, required, shadcn custom or react-rating-stars-component), comment textarea (shadcn Textarea, optional, max 500 chars, placeholder: "Share your experience with the service..."), submit button: "Submit Feedback" (shadcn Button). On submit: call POST /api/v1/maintenance-requests/{id}/feedback with {rating, comment, submittedAt}. Update MaintenanceRequest entity: tenantRating (1-5), tenantFeedback (text), feedbackSubmittedAt (timestamp), status change to CLOSED (if not already). After submit: show success toast: "Thank you for your feedback!", hide feedback form, display submitted feedback (read-only) with: stars filled based on rating, comment displayed, timestamp: "Feedback submitted on {date}". [Source: docs/epics/epic-3-tenant-management-portal.md#request-details-page]

14. **AC14 - Cancel Request Flow:** Cancel button shown only if request status = SUBMITTED (not yet assigned). Click cancel triggers shadcn Alert Dialog confirmation: title: "Cancel Maintenance Request?", description: "Are you sure you want to cancel request #{requestNumber}? This action cannot be undone.", buttons: "Cancel" (secondary, closes dialog), "Confirm Cancellation" (destructive variant, red). On confirm: call DELETE /api/v1/maintenance-requests/{id} (soft delete, updates status to CANCELLED), show success toast: "Request #{requestNumber} has been cancelled", redirect to /tenant/requests list page. If request status ≠ SUBMITTED: cancel button not shown, display note: "This request has been assigned and cannot be cancelled. Please contact property management." Backend validation: reject cancellation if status not SUBMITTED, return 400 with error message. [Source: docs/epics/epic-3-tenant-management-portal.md#request-cancellation]

15. **AC15 - Real-Time Status Updates:** Implement status polling for request details page: use React Query with refetchInterval: 30000 (30 seconds), refetchOnWindowFocus: true. Query key: ['maintenance-request', requestId]. Alternative: WebSocket connection for real-time updates (if implemented): connect to ws://backend/maintenance-requests/{id}/updates, receive status change events, update UI optimistically. On status change received: show toast notification based on new status: ASSIGNED → "Your request has been assigned to {vendorName}", IN_PROGRESS → "Work has started on your request", COMPLETED → "Your request has been completed. Please review and provide feedback.", CLOSED → "Your request has been closed". Play subtle notification sound (optional). Update status badge and timeline checkpoint immediately. [Source: docs/epics/epic-3-tenant-management-portal.md#status-updates, docs/architecture.md#real-time-updates]

16. **AC16 - Backend API Endpoints:** Implement REST endpoints: POST /api/v1/maintenance-requests creates MaintenanceRequest entity, uploads photos to /uploads/maintenance/{requestId}/, generates thumbnails, returns {requestNumber, id, status, submittedAt}. GET /api/v1/maintenance-requests lists tenant's requests with filters (status, category, dateRange), search (title, requestNumber), pagination (page, size), sorting (submittedAt DESC default), returns {requests: [], totalPages, totalElements}. GET /api/v1/maintenance-requests/{id} returns complete request details: {id, requestNumber, tenantId, unitId, propertyId, category, priority, title, description, status, preferredAccessTime, preferredAccessDate, submittedAt, assignedTo: {vendorId, vendorName}, assignedAt, inProgressAt, completedAt, closedAt, workNotes, attachments: [{url, thumbnail}], completionPhotos: [{url, thumbnail}], tenantRating, tenantFeedback}. POST /api/v1/maintenance-requests/{id}/feedback updates rating and feedback fields, changes status to CLOSED. DELETE /api/v1/maintenance-requests/{id} soft deletes (status = CANCELLED) if status = SUBMITTED. All endpoints require TENANT role authorization via @PreAuthorize("hasRole('TENANT')"). [Source: docs/epics/epic-3-tenant-management-portal.md#api-endpoints, docs/architecture.md#api-response-format]

17. **AC17 - Email Notifications:** Use Spring Mail (Gmail API) to send notifications: Tenant confirmation email template (resources/templates/maintenance-request-confirmation.html) with variables: {tenantName, requestNumber, title, category, priority, submittedAt, trackingUrl}. Property manager notification email template (resources/templates/maintenance-request-new.html) with variables: {propertyName, unitNumber, tenantName, requestNumber, title, category, priority, description, photoUrls, managementUrl}. Status update emails (separate templates for each status change): assigned, in-progress, completed, closed. All emails: subject includes request number, footer includes contact information, styled with company branding, mobile-responsive HTML. Send emails asynchronously using Spring @Async to avoid blocking request submission. Log email sending status in audit_logs table. [Source: docs/epics/epic-3-tenant-management-portal.md#status-updates, docs/architecture.md#email-service]

18. **AC18 - TypeScript Types and Schemas:** Create types/maintenance.ts with interfaces: MaintenanceRequest {id, requestNumber, tenantId, unitId, propertyId, category, priority, title, description, status, preferredAccessTime, preferredAccessDate, submittedAt, assignedTo, assignedAt, inProgressAt, completedAt, closedAt, workNotes, attachments, completionPhotos, tenantRating, tenantFeedback}, CreateMaintenanceRequestRequest {category, priority, title, description, preferredAccessTime, preferredAccessDate, photos}, MaintenanceRequestFeedback {rating, comment}. Define enums: MaintenanceCategory (PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, OTHER), MaintenancePriority (HIGH, MEDIUM, LOW), MaintenanceStatus (SUBMITTED, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED, CANCELLED), PreferredAccessTime (IMMEDIATE, MORNING, AFTERNOON, EVENING, ANY_TIME). Create lib/validations/maintenance.ts with createMaintenanceRequestSchema using Zod: category enum required, priority enum required, title string min(1) max(100), description string min(20) max(1000), preferredAccessTime enum required, preferredAccessDate date refine(≥ today), photos optional array max(5) file validation. Create services/maintenance.service.ts with methods: createRequest(data: FormData), getRequests(filters, pagination), getRequestDetails(id), submitFeedback(id, data), cancelRequest(id). [Source: docs/architecture.md#typescript-strict-mode]

19. **AC19 - Responsive Design and Mobile Optimization:** All pages fully responsive: Mobile (<640px): single column layout, full-width form fields, stack photo thumbnails 2 per row, bottom navigation visible (Dashboard, Requests, Profile tabs), touch targets ≥ 44×44px, collapsible sections for request details, vertical timeline compact version. Tablet (640px-1024px): 2-column layout for form (labels left, inputs right), photo grid 3 columns, side navigation drawer, full timeline with descriptions. Desktop (>1024px): centered container max-width 768px for form, photo grid 4 columns, full status timeline with detailed descriptions, hover states on interactive elements. Use Next.js Image component with priority loading for request photos. Implement lazy loading for request list (infinite scroll or pagination). Test on viewport sizes: 375px (mobile), 768px (tablet), 1440px (desktop). Dark theme support using shadcn dark mode classes. [Source: docs/architecture.md#responsive-design, docs/ux-design-specification.md#responsive-design]

20. **AC20 - Testing and Accessibility:** All interactive elements have data-testid attributes following convention {component}-{element}-{action}: "select-category", "radio-priority-high", "input-title", "textarea-description", "calendar-access-date", "upload-photo-zone", "btn-submit-request", "btn-cancel-request", "btn-submit-feedback", "badge-status-submitted". Implement keyboard navigation: Tab through form fields, Enter to submit form, Escape to close dialogs, Arrow keys in photo gallery. ARIA labels: role="form" on request form, aria-label on icon-only buttons, aria-describedby for field hints ("min 20 characters"), aria-live="polite" for character counter, aria-busy="true" during form submission. Screen reader announcements for status updates: "Request status changed to {status}". Color contrast ratio ≥ 4.5:1 for all text, status badges use both color and text. Focus indicators visible on all interactive elements. Success/error feedback via accessible shadcn toast notifications. Image alt text required for all photos (auto-generated: "Maintenance issue photo {n} of {total}"). [Source: docs/architecture.md#accessibility, docs/ux-design-specification.md#8.2-wcag-compliance]

## Component Mapping

### shadcn/ui Components to Use

**Form Components:**
- form (React Hook Form integration for request submission)
- input (title, search fields)
- textarea (description with character counter)
- select (category, priority, access time, filters)
- calendar (preferred access date picker)
- radio-group (priority selection with visual badges)
- label (form field labels with hints)
- button (submit, cancel, feedback buttons)

**Layout Components:**
- card (request details sections, summary cards)
- tabs (mobile bottom navigation)
- separator (dividing sections)
- dialog (photo lightbox, cancel confirmation, feedback form)
- alert-dialog (destructive actions confirmation)
- badge (status, priority, category indicators)

**Data Display:**
- table (requests list with sortable columns)
- pagination (requests list pagination controls)
- avatar (vendor profile if assigned)
- skeleton (loading states for lists and details)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert (information banners, warnings)
- progress (photo upload progress bars)

**Custom Components:**
- StatusTimeline (vertical timeline using custom component with shadcn styling)
- PhotoUploadZone (react-dropzone wrapper with shadcn Card styling)
- StarRating (rating component, use react-rating-stars-component or custom)
- PhotoGallery (thumbnail grid with lightbox using shadcn Dialog)

### Installation Command

```bash
npx shadcn@latest add form input textarea select calendar radio-group label button card tabs separator dialog alert-dialog badge table pagination avatar skeleton toast alert progress
```

### Additional Dependencies

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",
    "browser-image-compression": "^2.0.2",
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-rating-stars-component": "^2.2.0",
    "lucide-react": "^0.263.1"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types, Enums, and Schemas** (AC: #18)
  - [ ] Create types/maintenance.ts with MaintenanceRequest, CreateMaintenanceRequestRequest, MaintenanceRequestFeedback interfaces
  - [ ] Define enums: MaintenanceCategory, MaintenancePriority, MaintenanceStatus, PreferredAccessTime
  - [ ] Create lib/validations/maintenance.ts with createMaintenanceRequestSchema (Zod)
  - [ ] Create services/maintenance.service.ts with API methods
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Implement Backend MaintenanceRequest Entity and Repository** (AC: #6, #16)
  - [ ] Create MaintenanceRequest entity with all fields (id, requestNumber, tenantId, unitId, propertyId, category, priority, title, description, status, timestamps, attachments)
  - [ ] Create MaintenanceRequestRepository extending JpaRepository
  - [ ] Add database migration for maintenance_requests table (Flyway)
  - [ ] Add indexes on requestNumber, tenantId, status, submittedAt
  - [ ] Implement requestNumber auto-generation (format: MR-2025-0001)

- [ ] **Task 3: Implement Backend API Endpoints** (AC: #16)
  - [ ] Create MaintenanceRequestController with @RestController("/api/v1/maintenance-requests")
  - [ ] Implement POST / endpoint: create request, handle multipart/form-data, upload photos, generate thumbnails
  - [ ] Implement GET / endpoint: list requests with filters (status, category, dateRange), search, pagination, sorting
  - [ ] Implement GET /{id} endpoint: return complete request details with vendor info if assigned
  - [ ] Implement POST /{id}/feedback endpoint: update rating and feedback, change status to CLOSED
  - [ ] Implement DELETE /{id} endpoint: soft delete (status = CANCELLED) only if SUBMITTED
  - [ ] Add @PreAuthorize("hasRole('TENANT')") to all tenant endpoints
  - [ ] Write unit tests for all controller methods

- [ ] **Task 4: Implement Photo Upload and Processing** (AC: #4, #6)
  - [ ] Create FileStorageService for handling photo uploads
  - [ ] Store photos in /uploads/maintenance/{requestId}/ directory
  - [ ] Implement thumbnail generation (200x200px) using ImageIO or library
  - [ ] Validate file types (JPG/PNG only), size (max 5MB per file)
  - [ ] Return photo URLs and thumbnail URLs in API response
  - [ ] Write integration tests for file upload functionality

- [ ] **Task 5: Implement Email Notification Service** (AC: #7, #17)
  - [ ] Create email template: maintenance-request-confirmation.html for tenant
  - [ ] Create email template: maintenance-request-new.html for property manager
  - [ ] Create email templates for status updates: assigned, in-progress, completed, closed
  - [ ] Implement sendMaintenanceRequestConfirmation() method using Spring Mail
  - [ ] Implement sendPropertyManagerNotification() method
  - [ ] Use Spring @Async for asynchronous email sending
  - [ ] Log email sending status in audit_logs table
  - [ ] Write unit tests with mocked email service

- [ ] **Task 6: Create Request Submission Form Page** (AC: #1, #2, #3, #4, #5)
  - [ ] Create app/(dashboard)/tenant/requests/new/page.tsx as client component
  - [ ] Implement React Hook Form with createMaintenanceRequestSchema validation
  - [ ] Create category dropdown (shadcn Select) with all MaintenanceCategory options
  - [ ] Implement priority auto-suggestion logic based on category
  - [ ] Add priority radio group (shadcn Radio Group) with color-coded badges
  - [ ] Add title input (shadcn Input, max 100 chars)
  - [ ] Add description textarea (shadcn Textarea, min 20, max 1000 chars) with live character counter
  - [ ] Add preferred access time dropdown (shadcn Select)
  - [ ] Add preferred access date calendar picker (shadcn Calendar)
  - [ ] Implement photo upload zone using react-dropzone (max 5 photos, 5MB each)
  - [ ] Show photo thumbnails with remove buttons
  - [ ] Add submit button with loading state and validation
  - [ ] Add breadcrumb navigation: Dashboard > Requests > Submit

- [ ] **Task 7: Implement Photo Upload and Compression** (AC: #4, #6)
  - [ ] Install browser-image-compression library
  - [ ] Implement client-side image compression (target ~500KB per image)
  - [ ] Validate file type (JPG/PNG only) and size (5MB max) before compression
  - [ ] Show upload progress bar for each photo
  - [ ] Handle compression errors gracefully with toast notifications
  - [ ] Store compressed photos in form state as File objects
  - [ ] Construct multipart/form-data on submit with compressed images

- [ ] **Task 8: Implement Form Submission and Success Flow** (AC: #5, #6, #7)
  - [ ] Create useCreateMaintenanceRequest() mutation hook using React Query
  - [ ] On submit: compress photos, construct FormData, call POST /api/v1/maintenance-requests
  - [ ] Handle submission loading state (disable form, show spinner)
  - [ ] On success: show toast "Request #{requestNumber} submitted successfully!"
  - [ ] Invalidate React Query cache: ['tenant', 'maintenance-requests']
  - [ ] Redirect to /tenant/requests/{id} after 2 seconds
  - [ ] On error: show toast "Failed to submit request", keep form data, enable retry
  - [ ] Add data-testid to all form elements and buttons

- [ ] **Task 9: Create Requests List Page** (AC: #8, #9)
  - [ ] Create app/(dashboard)/tenant/requests/page.tsx
  - [ ] Implement useMaintenanceRequests() hook with React Query (filters, search, pagination)
  - [ ] Create shadcn Table with columns: Request #, Title, Category, Status, Priority, Submitted Date, Last Updated
  - [ ] Add filter controls: status dropdown, category dropdown, date range picker
  - [ ] Add search input for title and request number
  - [ ] Implement status badges (SUBMITTED yellow, ASSIGNED blue, IN_PROGRESS orange, COMPLETED green, CLOSED gray)
  - [ ] Implement priority badges (HIGH red, MEDIUM yellow, LOW green)
  - [ ] Add category icons using lucide-react
  - [ ] Implement pagination using shadcn Pagination (20 items per page)
  - [ ] Handle empty state: "No requests found" with button to /tenant/requests/new
  - [ ] Add skeleton loaders for table rows during data fetch

- [ ] **Task 10: Create Request Details Page** (AC: #10, #11, #12)
  - [ ] Create app/(dashboard)/tenant/requests/[id]/page.tsx
  - [ ] Implement useMaintenanceRequestDetails(id) hook with React Query
  - [ ] Create page layout: breadcrumb, header (title, badges), details cards
  - [ ] Display request details card: category, description, submitted date, last updated
  - [ ] Display access preferences card: preferred time, preferred date
  - [ ] Implement photo gallery: thumbnail grid (2 cols mobile, 4 cols desktop)
  - [ ] Implement photo lightbox using shadcn Dialog: fullscreen, prev/next navigation, zoom, close
  - [ ] Create StatusTimeline custom component: vertical timeline with checkpoints
  - [ ] Display assigned vendor section (if assigned): name, contact, estimated completion
  - [ ] Display work notes section (if completed): vendor's notes
  - [ ] Display completion photos section (if provided): before/after photos with lightbox
  - [ ] Add cancel button (if status = SUBMITTED) with confirmation dialog
  - [ ] Add skeleton loaders for all sections during data fetch

- [ ] **Task 11: Implement Status Timeline Component** (AC: #11)
  - [ ] Create components/tenant/StatusTimeline.tsx custom component
  - [ ] Define timeline checkpoints: Submitted, Assigned, In Progress, Completed, Closed
  - [ ] Style active checkpoint: filled circle with green border, check icon
  - [ ] Style future checkpoints: empty circle with gray border
  - [ ] Style past checkpoints: filled circle with check icon
  - [ ] Add connecting lines between checkpoints (dashed vertical line)
  - [ ] Display timestamp and description for each checkpoint
  - [ ] Make responsive: compact on mobile, full on desktop

- [ ] **Task 12: Implement Tenant Feedback Form** (AC: #13)
  - [ ] Create components/tenant/FeedbackForm.tsx component
  - [ ] Add star rating component (1-5 stars) using react-rating-stars-component or custom
  - [ ] Add comment textarea (shadcn Textarea, optional, max 500 chars)
  - [ ] Add submit button: "Submit Feedback" (shadcn Button)
  - [ ] Create useSubmitFeedback(id) mutation hook
  - [ ] On submit: call POST /api/v1/maintenance-requests/{id}/feedback
  - [ ] On success: show toast "Thank you for your feedback!", hide form, display submitted feedback
  - [ ] Display submitted feedback: stars filled, comment, timestamp
  - [ ] Show feedback form only if status = COMPLETED and no feedback submitted yet
  - [ ] Add data-testid to rating stars and submit button

- [ ] **Task 13: Implement Request Cancellation Flow** (AC: #14)
  - [ ] Add cancel button to request details page (visible only if status = SUBMITTED)
  - [ ] Create cancel confirmation dialog (shadcn Alert Dialog)
  - [ ] Dialog content: title "Cancel Maintenance Request?", description, Cancel/Confirm buttons
  - [ ] Create useCancelRequest(id) mutation hook
  - [ ] On confirm: call DELETE /api/v1/maintenance-requests/{id}
  - [ ] On success: show toast "Request cancelled", redirect to /tenant/requests
  - [ ] On error: show toast with error message
  - [ ] Backend validation: reject if status ≠ SUBMITTED, return 400 error

- [ ] **Task 14: Implement Real-Time Status Updates** (AC: #15)
  - [ ] Configure React Query refetchInterval: 30000 (30 seconds) for request details
  - [ ] Add refetchOnWindowFocus: true for request details query
  - [ ] Optional: Implement WebSocket connection for real-time updates
  - [ ] On status change: show toast notification based on new status
  - [ ] Update status badge and timeline immediately
  - [ ] Play subtle notification sound (optional)
  - [ ] Test polling with simulated status changes

- [ ] **Task 15: Implement Responsive Design and Mobile Optimization** (AC: #19)
  - [ ] Test form page on mobile (375px): single column, full-width fields, 2-photo grid
  - [ ] Test form page on tablet (768px): 2-column layout, 3-photo grid
  - [ ] Test form page on desktop (1440px): centered container, 4-photo grid
  - [ ] Ensure touch targets ≥ 44×44px on mobile for all buttons/inputs
  - [ ] Implement bottom navigation for mobile (<640px): Dashboard, Requests, Profile tabs
  - [ ] Make status timeline compact on mobile (vertical only)
  - [ ] Test photo gallery responsiveness and lightbox on all viewports
  - [ ] Support dark theme using shadcn dark mode classes

- [ ] **Task 16: Add Accessibility Features** (AC: #20)
  - [ ] Add data-testid to all interactive elements following convention
  - [ ] Implement keyboard navigation: Tab, Enter, Escape, Arrow keys
  - [ ] Add ARIA labels: role="form", aria-label on icon buttons, aria-describedby for hints
  - [ ] Add aria-live="polite" for character counter and status updates
  - [ ] Add aria-busy="true" during form submission
  - [ ] Ensure color contrast ≥ 4.5:1 for all text and badges
  - [ ] Add visible focus indicators to all interactive elements
  - [ ] Generate alt text for uploaded photos: "Maintenance issue photo {n} of {total}"
  - [ ] Test with screen reader (VoiceOver/NVDA)

- [ ] **Task 17: Write Unit and Integration Tests** (AC: #20)
  - [ ] Write backend controller tests: MaintenanceRequestController
  - [ ] Write service layer tests: request creation, photo upload, notifications
  - [ ] Write frontend component tests: request form, requests list, request details
  - [ ] Write React Query hook tests with MSW for API mocking
  - [ ] Write E2E tests (separate story 3.5.e2e): full user flow from submission to feedback
  - [ ] Test form validation errors display correctly
  - [ ] Test photo upload and compression functionality
  - [ ] Test status updates and real-time polling
  - [ ] Achieve ≥ 80% code coverage for new code

## Dev Notes

### Architecture Patterns

**Route Protection:**
- Use Next.js middleware to protect /tenant/requests/* routes
- Verify user has TENANT role from JWT token
- Redirect to /login if not authenticated
- Follow pattern from Story 2.5 middleware implementation

**Form Validation:**
- Use React Hook Form with Zod schema validation
- Show inline validation errors below fields in red text
- Focus first error field on validation failure
- Follow pattern from Story 2.5 and Story 3.4 for form structure

**File Upload:**
- Client-side compression using browser-image-compression
- Target compressed size: ~500KB per image
- Validate before compression: type (JPG/PNG), size (5MB max)
- Store in backend: /uploads/maintenance/{requestId}/
- Generate thumbnails: 200x200px for list view performance

**API Integration:**
- Follow Axios interceptor pattern from Story 2.5
- All API calls through centralized apiClient from lib/api.ts
- Use React Query for caching and state management
- Implement optimistic UI updates for better UX
- Handle multipart/form-data for photo uploads

**Real-Time Updates:**
- Primary approach: React Query polling (refetchInterval: 30 seconds)
- Alternative: WebSocket connection (if implemented later)
- Show toast notifications on status changes
- Update UI immediately without full page refresh

### Constraints

**Photo Upload Limitations:**
- Maximum 5 photos per request
- JPG/PNG only (no video uploads)
- Max 5MB per photo before compression
- Target ~500KB after compression
- Thumbnail generation required for performance

**Priority Auto-Suggestion Logic:**
- HIGH: ELECTRICAL, HVAC, PEST_CONTROL (safety/emergency issues)
- MEDIUM: PLUMBING, APPLIANCE, CARPENTRY (important but not urgent)
- LOW: CLEANING, OTHER (non-critical maintenance)
- Tenant can override suggested priority

**Request Cancellation Rules:**
- Only SUBMITTED requests can be cancelled
- Once ASSIGNED, tenant cannot cancel (must contact management)
- Cancellation is soft delete (status = CANCELLED, not deleted from DB)

**Status Progression:**
- SUBMITTED → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
- SUBMITTED can jump to CANCELLED (by tenant)
- COMPLETED can only move to CLOSED (after feedback or auto-close)

### Testing Standards

From retrospective action items (AI-2-1, AI-2-2):
- ALL interactive elements MUST have data-testid attributes
- Convention: {component}-{element}-{action}
- Servers must be verified running before E2E tests (scripts/check-services.sh)
- Mandatory for buttons, inputs, selects, textareas, uploads
- Verified in code review before PR approval

### Learnings from Previous Stories

**From Story 3.4 (Status: ready-for-dev - not yet implemented):**

Story 3.4 is currently in "ready-for-dev" status without actual implementation. However, it defines important patterns this story should align with:

- **Tenant Portal Structure**: Story 3.4 defines /tenant/dashboard route pattern - this story continues with /tenant/requests
- **Bottom Navigation**: Story 3.4 creates bottom nav for mobile with Dashboard, Requests, Payments, Profile tabs - this story integrates into that nav
- **React Query Pattern**: Story 3.4 uses React Query for data fetching - follow same caching and staleTime patterns
- **shadcn Components**: Story 3.4 installs: card, tabs, table, badge, skeleton, toast, dialog, progress - reuse these
- **Types Location**: Story 3.4 defines types/tenant-portal.ts - this story uses types/maintenance.ts for separation

**Integration Points:**
- Dashboard quick action "Submit Maintenance Request" should navigate to /tenant/requests/new
- Dashboard stat "Open Maintenance Requests count" should pull from this story's MaintenanceRequest entity
- Bottom navigation "Requests" tab should navigate to /tenant/requests list page

**From Story 2.5 (Frontend Authentication - Status: done):**

Established patterns that MUST be reused:

- **AuthContext Pattern**: Global state at `contexts/AuthContext.tsx`
  - Use `useAuth()` hook to get tenantId and user role
  - This story uses auth context to populate tenantId in request submission

- **Axios API Client**: Centralized at `lib/api.ts`
  - Interceptors for JWT token attachment
  - All API calls MUST use this apiClient instance
  - Follow same error handling pattern

- **Form Validation Pattern**:
  - React Hook Form + Zod schemas
  - Inline validation errors below fields
  - Follow same pattern for createMaintenanceRequestSchema

- **Components Already Installed**:
  - form, input, button, card, dialog, badge, skeleton, toast, alert-dialog (from Story 2.5)
  - Need to add: textarea, select, calendar, radio-group, table, pagination, progress

- **Dependencies Already Available**:
  - axios, react-hook-form, @hookform/resolvers, zod, date-fns
  - Need to add: react-dropzone, browser-image-compression, @tanstack/react-query, react-rating-stars-component

### Backend Implementation Notes

**Request Number Generation:**
- Format: MR-2025-0001
- Auto-increment within year (reset each year)
- Stored as unique constraint in database
- Consider using database sequence or atomic counter

**Photo Storage:**
- Primary storage: local file system /uploads/maintenance/{requestId}/
- Future: migrate to AWS S3 for scalability
- Thumbnail generation: use Java ImageIO or library like Thumbnailator
- Store both original and thumbnail paths in attachments array

**Email Notifications:**
- Use Spring @Async to avoid blocking request submission
- Email templates in resources/templates/ with Thymeleaf
- Log email status in audit_logs table for tracking
- Include trackingUrl in emails: {frontendUrl}/tenant/requests/{id}

**Authorization:**
- All tenant endpoints require TENANT role
- Tenant can only view/cancel their own requests (enforce tenantId check)
- Property manager endpoints (assign, update status) require PROPERTY_MANAGER role (future)

### References

- [Source: docs/epics/epic-3-tenant-management-portal.md#story-35-tenant-portal-maintenance-request-submission]
- [Source: docs/prd.md#3.4-maintenance-management-module]
- [Source: docs/architecture.md#frontend-implementation-patterns]
- [Source: docs/architecture.md#file-handling]
- [Source: docs/architecture.md#email-service]
- [Source: docs/architecture.md#real-time-updates]
- [Source: docs/sprint-artifacts/3-4-tenant-portal-dashboard-and-profile-management.md]
- [Source: docs/sprint-artifacts/2-5-frontend-authentication-components-and-protected-routes.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
