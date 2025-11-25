# Story 4.4: Job Progress Tracking and Completion

Status: ready-for-dev

## Story

As a maintenance staff or vendor,
I want to update job progress and mark work as complete,
So that work completion is tracked.

## Acceptance Criteria

1. **AC1 - Start Work Button and Access Control:** "Start Work" functionality accessible from work order detail page at /property-manager/work-orders/{id} or /vendor/work-orders/{id} for assigned users. Button displayed prominently in action buttons section when work order status = ASSIGNED and current user is the assignee. Button uses shadcn Button component (primary variant) with icon (Play from lucide-react). Button disabled if status ≠ ASSIGNED or user is not assignee. Tooltip shown on hover: "Start working on this job". Button has data-testid="btn-start-work". If work order already in progress (status = IN_PROGRESS), show "Update Progress" and "Mark as Complete" buttons instead. [Source: docs/epics/epic-4-maintenance-operations.md#story-44-job-progress-tracking-and-completion, docs/architecture.md#frontend-implementation-patterns]

2. **AC2 - Start Work Flow and Backend Processing:** Click "Start Work" button triggers confirmation dialog (shadcn Alert Dialog): title "Start Working on This Job?", description "This will change the work order status to IN_PROGRESS and record the start time.", buttons: "Cancel" (secondary), "Start Work" (primary). On confirm: call PATCH /api/v1/work-orders/{id}/start. Backend updates WorkOrder entity: set status = IN_PROGRESS, set startedAt = current timestamp (UTC), create timeline entry in WorkOrderComment: type = STATUS_CHANGE, status = IN_PROGRESS, text = "Work started by {assigneeName}". Send email notification to property manager: "Work has started on WO-{workOrderNumber}". Create audit log entry: action = "WORK_ORDER_STARTED", userId, entityId. Return response: {success: true, data: {workOrderId, status, startedAt}}. On success: close dialog, show toast "Work started successfully!", update UI optimistically (status badge changes to IN_PROGRESS, start time displayed, progress update section appears). [Source: docs/epics/epic-4-maintenance-operations.md#start-work, docs/architecture.md#rest-api-conventions]

3. **AC3 - Progress Update Section Structure:** Progress update section visible only when status = IN_PROGRESS. Section displays: current progress timeline (all progress notes chronologically), "Add Progress Update" button (opens update dialog), before photos gallery (uploaded when starting), during photos gallery (uploaded during progress updates). Timeline shows: timestamp, update text, photos (if any), estimated completion date changes. Empty state: "No progress updates yet. Click 'Add Progress Update' to record your progress." Section has data-testid="section-progress-updates". [Source: docs/epics/epic-4-maintenance-operations.md#update-progress, docs/architecture.md#component-pattern]

4. **AC4 - Add Progress Update Dialog:** Click "Add Progress Update" opens shadcn Dialog (modal) with title "Add Progress Update" and subtitle "WO-{workOrderNumber}". Dialog width: 600px on desktop, full-screen on mobile. Dialog sections: (1) Progress Notes (textarea, required), (2) Upload Photos (file upload, optional), (3) Update Estimated Completion (date picker, optional), (4) Action Buttons (Cancel, Save Update). Dialog uses React Hook Form with addProgressUpdateSchema validation. Close button (X icon) in top-right corner. Dialog has data-testid="dialog-add-progress-update". [Source: docs/epics/epic-4-maintenance-operations.md#update-progress, docs/architecture.md#form-pattern-with-react-hook-form-zod]

5. **AC5 - Progress Notes Field:** Textarea (shadcn Textarea) for progress notes. Label: "Progress Notes". Placeholder: "Describe what you've done so far, any issues encountered, or next steps...". Required field (validation error if empty). Max length: 500 characters. Character counter displayed: "{count}/500 characters". Rows: 4. Examples shown in help text: "Identified issue, ordering parts", "Replaced faulty valve, testing system", "Waiting for tenant access". Textarea has data-testid="textarea-progress-notes". [Source: docs/epics/epic-4-maintenance-operations.md#update-progress]

6. **AC6 - Upload Progress Photos:** File upload component (shadcn Input type="file" with custom styling) for progress photos. Label: "Upload Photos (Optional)". Accept: image/jpeg, image/png, image/webp. Multiple files allowed (up to 5 photos per update). Max file size: 5MB per photo (compress to ~1MB before upload using browser-image-compression library). Show photo previews with remove button. Display upload progress bar during upload. Photos labeled as "During" photos (vs "Before" photos from start, "After" photos from completion). File input has data-testid="input-progress-photos". [Source: docs/epics/epic-4-maintenance-operations.md#update-progress, docs/sprint-artifacts/epic-4/4-1-work-order-creation-and-management.md]

7. **AC7 - Update Estimated Completion Date:** Date picker (shadcn Calendar) for estimated completion date. Label: "Update Estimated Completion Date (Optional)". Default value: current scheduledDate from work order. Validation: must be ≥ today. Help text: "Update this if you expect to finish earlier or later than originally scheduled." Date format: "dd MMM yyyy" using date-fns. Calendar has data-testid="calendar-estimated-completion". [Source: docs/epics/epic-4-maintenance-operations.md#update-progress, docs/architecture.md#date-and-time-handling]

8. **AC8 - Progress Update Form Validation and Submission:** Zod validation schema addProgressUpdateSchema with rules: progressNotes (required string, min 1 char, max 500 chars), photos (optional array of File objects, max 5 files, each max 5MB), estimatedCompletionDate (optional date, must be ≥ today). Form uses React Hook Form with zodResolver. Submit button: "Save Update" (shadcn Button primary variant, full-width on mobile, loading spinner during submission, disabled if form invalid). Cancel button: "Cancel" (secondary variant, closes dialog). On validation failure: focus first error field, display inline errors in red text. Button has data-testid="btn-save-progress-update". [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]

9. **AC9 - Progress Update Backend Processing:** On form submit: call POST /api/v1/work-orders/{id}/progress with multipart/form-data body: {progressNotes, photos (files array), estimatedCompletionDate}. Backend creates WorkOrderProgress entity: id (UUID), workOrderId (FK), userId (current user), progressNotes, photoUrls (array of S3 paths), estimatedCompletionDate (nullable), createdAt (UTC timestamp). Upload photos to S3: path = /work-orders/{workOrderId}/progress/{timestamp}_{filename}. Update WorkOrder.scheduledDate if estimatedCompletionDate provided. Create timeline entry in WorkOrderComment: type = PROGRESS_UPDATE, text = progressNotes, photoUrls, estimatedCompletionDate. Send email notification to property manager with progress update. Create audit log entry. Return response: {success: true, data: {progressUpdateId, createdAt, photoUrls}}. [Source: docs/epics/epic-4-maintenance-operations.md#update-progress, docs/architecture.md#file-storage]

10. **AC10 - Post-Progress Update Flow:** On successful update: close dialog, show success toast: "Progress update added successfully!", invalidate React Query cache: ['work-orders', workOrderId], update progress timeline UI optimistically (new update appears at top), clear form data. If submission fails: show error toast: "Failed to add progress update. Please try again.", keep dialog open with form data intact, enable retry. [Source: docs/architecture.md#optimistic-updates]

11. **AC11 - Mark as Complete Button:** "Mark as Complete" button shown on work order detail page when status = IN_PROGRESS and current user is assignee. Button uses shadcn Button component (success variant, green) with icon (CheckCircle from lucide-react). Button has data-testid="btn-mark-complete". Click button opens completion dialog (larger dialog, more fields required). [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete, docs/architecture.md#component-pattern]

12. **AC12 - Completion Dialog Structure:** Click "Mark as Complete" opens shadcn Dialog (modal) with title "Mark Work Order as Complete" and subtitle "WO-{workOrderNumber}". Dialog width: 700px on desktop, full-screen on mobile. Dialog sections: (1) Completion Notes (textarea, required), (2) Upload After Photos (file upload, required, min 1 photo), (3) Time and Cost (hours spent, total cost), (4) Recommendations (textarea, optional), (5) Follow-up Required (checkbox + description), (6) Action Buttons (Cancel, Mark as Complete). Dialog uses React Hook Form with markCompleteSchema validation. Dialog has data-testid="dialog-mark-complete". [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete, docs/architecture.md#form-pattern-with-react-hook-form-zod]

13. **AC13 - Completion Notes Field:** Textarea (shadcn Textarea) for completion notes. Label: "Completion Notes *". Placeholder: "Describe what was done to resolve the issue...". Required field (validation error if empty). Min length: 20 characters, max length: 1000 characters. Character counter: "{count}/1000 characters". Rows: 6. Examples: "Replaced faulty valve, tested system, all working normally", "Fixed electrical wiring, replaced outlet, tested all circuits". Textarea has data-testid="textarea-completion-notes". [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete]

14. **AC14 - Upload After Photos:** File upload component for after photos. Label: "Upload After Photos *". Required field (min 1 photo, max 5 photos). Accept: image/jpeg, image/png, image/webp. Max file size: 5MB per photo (compress to ~1MB). Show photo previews with remove button. Display upload progress. Validation error if no photos uploaded: "At least one after photo is required". Photos labeled as "After" photos for before/after comparison. File input has data-testid="input-after-photos". [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete, docs/sprint-artifacts/epic-4/4-1-work-order-creation-and-management.md]

15. **AC15 - Time and Cost Fields:** Two number input fields (shadcn Input type="number"). Field 1: "Total Hours Spent *" (required, decimal allowed, min 0.1, max 999, step 0.5, placeholder "e.g., 2.5", help text "Include travel and work time"). Field 2: "Total Cost *" (required, decimal allowed, min 0, max 999999, step 0.01, placeholder "e.g., 150.00", help text "Include labor and materials", currency symbol "AED" prefix). Both fields required. Validation: must be positive numbers. Inputs have data-testid="input-hours-spent" and "input-total-cost". [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete, docs/architecture.md#form-pattern-with-react-hook-form-zod]

16. **AC16 - Recommendations Field:** Textarea (shadcn Textarea) for recommendations. Label: "Recommendations (Optional)". Placeholder: "Any recommendations for future maintenance or follow-up actions...". Optional field. Max length: 500 characters. Character counter. Rows: 3. Examples: "Monitor pressure weekly", "Replace unit in 6 months", "Schedule annual inspection". Textarea has data-testid="textarea-recommendations". [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete]

17. **AC17 - Follow-up Required Section:** Checkbox (shadcn Checkbox) with label "Follow-up Required". If checked, show additional textarea field: "Follow-up Description *" (required if checkbox checked, max 200 chars, placeholder "Describe what follow-up is needed and when..."). Examples: "Inspect in 1 month", "Order replacement part for next service", "Schedule deep cleaning next quarter". Checkbox has data-testid="checkbox-follow-up-required", textarea has data-testid="textarea-follow-up-description". [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete]

18. **AC18 - Completion Form Validation and Submission:** Zod validation schema markCompleteSchema with rules: completionNotes (required string, min 20 chars, max 1000 chars), afterPhotos (required array of File objects, min 1 file, max 5 files, each max 5MB), hoursSpent (required number, min 0.1, max 999), totalCost (required number, min 0, max 999999), recommendations (optional string, max 500 chars), followUpRequired (boolean), followUpDescription (required if followUpRequired = true, max 200 chars). Form uses React Hook Form with zodResolver. Submit button: "Mark as Complete" (shadcn Button success variant, green, full-width on mobile, loading spinner during submission, disabled if form invalid). Cancel button: "Cancel" (secondary variant). On validation failure: focus first error field, display inline errors. Button has data-testid="btn-submit-completion". [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]

19. **AC19 - Completion Backend Processing:** On form submit: call PATCH /api/v1/work-orders/{id}/complete with multipart/form-data body: {completionNotes, afterPhotos (files array), hoursSpent, totalCost, recommendations, followUpRequired, followUpDescription}. Backend updates WorkOrder entity: set status = COMPLETED, set completedAt = current timestamp (UTC), set completionNotes, set hoursSpent, set totalCost, set recommendations, set followUpRequired, set followUpDescription. Upload after photos to S3: path = /work-orders/{workOrderId}/after/{timestamp}_{filename}. Create timeline entry in WorkOrderComment: type = STATUS_CHANGE, status = COMPLETED, text = "Work completed by {assigneeName}", completionNotes, afterPhotoUrls. Send email notification to property manager and tenant (if applicable) with completion details. Create audit log entry: action = "WORK_ORDER_COMPLETED". Return response: {success: true, data: {workOrderId, status, completedAt, totalCost, hoursSpent}}. [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete, docs/architecture.md#rest-api-conventions]

20. **AC20 - Post-Completion Flow:** On successful completion: close dialog, show success toast: "Work order marked as complete!", invalidate React Query cache: ['work-orders', workOrderId], update UI optimistically (status badge changes to COMPLETED, completion details section appears, before/after photo comparison shown, timeline updated). Redirect not required (stay on detail page). If submission fails: show error toast: "Failed to mark work order as complete. Please try again.", keep dialog open with form data intact, enable retry. [Source: docs/architecture.md#optimistic-updates]

21. **AC21 - Photo Gallery and Before/After Comparison:** Work order detail page displays comprehensive photo gallery with three sections: (1) Before Photos (uploaded when starting work, labeled "Before"), (2) During Photos (uploaded in progress updates, labeled "During" with timestamps), (3) After Photos (uploaded on completion, labeled "After"). Implement before/after comparison view: side-by-side layout on desktop, stacked on mobile, slider control to compare before/after, zoom functionality, full-screen lightbox view. Gallery uses shadcn Card component with image grid. Empty states for each section if no photos. Gallery has data-testid="gallery-work-order-photos". [Source: docs/epics/epic-4-maintenance-operations.md#photo-management, docs/architecture.md#component-pattern]

22. **AC22 - Progress Timeline Display:** Work order detail page displays complete progress timeline showing all events chronologically (newest first). Timeline entries include: Created (timestamp, created by), Assigned (timestamp, assigned to, assigned by), Started (timestamp, started by), Progress Updates (timestamp, notes, photos, estimated completion changes), Completed (timestamp, completed by, hours spent, total cost). Each entry uses shadcn Card with icon (lucide-react), timestamp formatted "dd MMM yyyy HH:mm" using date-fns, user avatar/name, entry details. Timeline has data-testid="timeline-work-order-progress". [Source: docs/epics/epic-4-maintenance-operations.md#api-endpoints, docs/architecture.md#component-pattern]

23. **AC23 - Mobile-Friendly Interface:** All work order progress features optimized for mobile: Touch-optimized buttons (≥ 44×44px) for "Start Work", "Add Progress Update", "Mark as Complete". Camera integration for photo capture (use HTML5 input type="file" accept="image/*" capture="environment" for mobile camera access). File upload works seamlessly on mobile browsers. Form inputs optimized for mobile (appropriate input types, large touch targets). Progress timeline converts to vertical card layout on mobile. Photo gallery uses swipeable carousel on mobile. Test on viewport sizes: 375px (mobile), 768px (tablet), 1440px (desktop). [Source: docs/epics/epic-4-maintenance-operations.md#mobile-friendly-interface, docs/architecture.md#responsive-design]

24. **AC24 - Photo Compression Before Upload:** Implement client-side photo compression before upload using browser-image-compression library (already installed from Story 4.1). Compress photos to max 1MB per photo while maintaining reasonable quality (quality: 0.8, maxSizeMB: 1, maxWidthOrHeight: 1920). Show compression progress indicator. Handle compression errors gracefully (show error toast, allow retry). Compression happens automatically on file selection, before form submission. [Source: docs/epics/epic-4-maintenance-operations.md#technical-notes, docs/sprint-artifacts/epic-4/4-1-work-order-creation-and-management.md]

25. **AC25 - Cost Visibility and Role-Based Access:** Cost information (totalCost field) visible only to users with roles: PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR. Cost field hidden from TENANT role users. Backend API response excludes cost fields when requested by tenant users. Frontend conditionally renders cost fields based on user role from auth context. Hours spent field visible to all roles. Completion notes visible to all roles. Implement role check: if (user.role === 'TENANT') { hide cost fields }. [Source: docs/epics/epic-4-maintenance-operations.md#technical-notes, docs/architecture.md#role-based-access-control]

26. **AC26 - Backend API Endpoints:** Implement REST endpoints: PATCH /api/v1/work-orders/{id}/start starts work, updates status to IN_PROGRESS, sets startedAt timestamp, sends notification, returns {workOrderId, status, startedAt}. POST /api/v1/work-orders/{id}/progress adds progress update, creates WorkOrderProgress entity, uploads photos to S3, updates timeline, sends notification, returns {progressUpdateId, createdAt, photoUrls}. PATCH /api/v1/work-orders/{id}/complete marks work as complete, updates status to COMPLETED, sets completedAt, hoursSpent, totalCost, completionNotes, recommendations, followUpRequired, followUpDescription, uploads after photos to S3, sends notifications, returns {workOrderId, status, completedAt, totalCost, hoursSpent}. GET /api/v1/work-orders/{id}/timeline returns complete timeline of all events (created, assigned, started, progress updates, completed) with timestamps, users, details, ordered by timestamp DESC, returns {timeline: [{type, timestamp, userId, userName, details, photoUrls}]}. All endpoints require authentication. Start/progress/complete endpoints require user to be assignee. Timeline endpoint accessible to property managers, supervisors, assignees, and tenants (with cost fields excluded for tenants). [Source: docs/epics/epic-4-maintenance-operations.md#api-endpoints, docs/architecture.md#api-response-format]

27. **AC27 - Email Notifications:** Send email notifications at each status change: (1) Work Started: send to property manager with subject "Work Started: WO-{workOrderNumber}", body includes: work order details, assignee name, start time, estimated completion date. (2) Progress Update: send to property manager with subject "Progress Update: WO-{workOrderNumber}", body includes: progress notes, photos (thumbnails), updated estimated completion. (3) Work Completed: send to property manager and tenant with subject "Work Order Completed: WO-{workOrderNumber}", body includes: completion notes, before/after photos comparison, hours spent (visible to manager only), total cost (visible to manager only), recommendations, follow-up required flag. All emails sent asynchronously using Spring @Async. Email templates: work-order-started.html, work-order-progress-update.html, work-order-completed.html. Log email sending status in audit_logs. [Source: docs/epics/epic-4-maintenance-operations.md#technical-notes, docs/architecture.md#email-service]

28. **AC28 - TypeScript Types and Schemas:** Create types/work-order-progress.ts with interfaces: WorkOrderProgress {id, workOrderId, userId, userName, progressNotes, photoUrls, estimatedCompletionDate, createdAt}, AddProgressUpdateRequest {progressNotes, photos, estimatedCompletionDate}, MarkCompleteRequest {completionNotes, afterPhotos, hoursSpent, totalCost, recommendations, followUpRequired, followUpDescription}, TimelineEntry {type, timestamp, userId, userName, details, photoUrls}. Define enums: TimelineEntryType (CREATED, ASSIGNED, STARTED, PROGRESS_UPDATE, COMPLETED). Create lib/validations/work-order-progress.ts with addProgressUpdateSchema, markCompleteSchema using Zod. Update services/work-order.service.ts with methods: startWork(workOrderId), addProgressUpdate(workOrderId, data), markComplete(workOrderId, data), getTimeline(workOrderId). [Source: docs/architecture.md#typescript-strict-mode]

29. **AC29 - Responsive Design and Accessibility:** All progress tracking features fully responsive: Mobile (<640px): full-screen dialogs, single column layout, full-width form fields, touch targets ≥ 44×44px, stacked photo comparison, vertical timeline, swipeable photo gallery. Tablet (640px-1024px): centered dialogs 700px width, 2-column layout for time/cost fields, side-by-side photo comparison. Desktop (>1024px): centered dialogs 700px width, hover states on interactive elements, full-width timeline with icons. All interactive elements have data-testid attributes: "btn-start-work", "dialog-add-progress-update", "textarea-progress-notes", "input-progress-photos", "calendar-estimated-completion", "btn-save-progress-update", "btn-mark-complete", "dialog-mark-complete", "textarea-completion-notes", "input-after-photos", "input-hours-spent", "input-total-cost", "textarea-recommendations", "checkbox-follow-up-required", "textarea-follow-up-description", "btn-submit-completion", "gallery-work-order-photos", "timeline-work-order-progress". Keyboard navigation: Tab through fields, Enter to submit, Escape to close dialogs. ARIA labels: role="dialog" on dialogs, aria-label on icon-only buttons, aria-describedby for field hints, aria-live="polite" for success/error messages, aria-busy="true" during form submission and photo upload. Screen reader announcements: "Work order status changed to {status}". Color contrast ≥ 4.5:1 for all text. Focus indicators visible. [Source: docs/architecture.md#accessibility, docs/development/ux-design-specification.md#8.2-wcag-compliance]

30. **AC30 - Follow-up Tracking and Display:** If work order marked complete with followUpRequired = true: display prominent follow-up banner on work order detail page with yellow/orange background, icon (AlertCircle from lucide-react), text: "Follow-up Required: {followUpDescription}", action button: "Create Follow-up Work Order" (creates new work order linked to this one). Follow-up banner visible to property managers and supervisors only (not tenants). Banner has data-testid="banner-follow-up-required". Implement follow-up work orders list filter: GET /api/v1/work-orders?followUpRequired=true returns all completed work orders needing follow-up. [Source: docs/epics/epic-4-maintenance-operations.md#mark-complete]

## Component Mapping

### shadcn/ui Components to Use

**Form Components:**
- form (React Hook Form integration for progress updates and completion)
- textarea (progress notes, completion notes, recommendations, follow-up description)
- input (file upload for photos, number inputs for hours/cost)
- calendar (estimated completion date picker)
- checkbox (follow-up required)
- label (form field labels)
- button (start work, add progress, mark complete, save buttons)

**Layout Components:**
- card (progress timeline entries, photo gallery sections, completion details)
- separator (dividing sections)
- dialog (add progress update, mark complete dialogs)
- alert-dialog (start work confirmation)
- badge (status, photo labels - Before/During/After)
- alert (follow-up required banner)

**Data Display:**
- avatar (user profile images in timeline)
- skeleton (loading states)

**Feedback Components:**
- toast/sonner (success/error notifications)
- progress (photo upload progress bars)

**Custom Components:**
- ProgressTimeline (timeline display component)
- PhotoGallery (before/during/after photo gallery with comparison)
- BeforeAfterComparison (side-by-side photo comparison with slider)
- ProgressUpdateDialog (reusable progress update dialog)
- CompletionDialog (reusable completion dialog)
- FollowUpBanner (follow-up required banner)

### Installation Command

All shadcn components already installed from Story 4.1 and 4.2. No new installations required.

### Additional Dependencies

All dependencies already available from Story 4.1:
```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.263.1",
    "browser-image-compression": "^2.0.2"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types, Enums, and Schemas** (AC: #28)
  - [ ] Create types/work-order-progress.ts with WorkOrderProgress, AddProgressUpdateRequest, MarkCompleteRequest, TimelineEntry interfaces
  - [ ] Define enum: TimelineEntryType (CREATED, ASSIGNED, STARTED, PROGRESS_UPDATE, COMPLETED)
  - [ ] Create lib/validations/work-order-progress.ts with addProgressUpdateSchema, markCompleteSchema (Zod)
  - [ ] Update services/work-order.service.ts with progress tracking methods
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Implement Backend WorkOrderProgress Entity** (AC: #9, #26)
  - [ ] Create WorkOrderProgress entity with fields: id, workOrderId (FK), userId (FK), progressNotes, photoUrls (JSON array), estimatedCompletionDate (nullable), createdAt
  - [ ] Create WorkOrderProgressRepository extending JpaRepository
  - [ ] Add database migration for work_order_progress table (Flyway)
  - [ ] Add indexes on workOrderId, userId, createdAt
  - [ ] Add completion fields to WorkOrder entity: completedAt, completionNotes, hoursSpent, totalCost, recommendations, followUpRequired, followUpDescription, startedAt

- [ ] **Task 3: Implement Backend Start Work API Endpoint** (AC: #2, #26)
  - [ ] Update WorkOrderController with PATCH /{id}/start endpoint
  - [ ] Implement start work logic: validate work order status = ASSIGNED, validate current user is assignee, update WorkOrder (status = IN_PROGRESS, startedAt = now), create timeline entry, send email notification to property manager
  - [ ] Add @PreAuthorize to ensure only assignee can start work
  - [ ] Write unit tests for start work logic

- [ ] **Task 4: Implement Backend Add Progress Update API Endpoint** (AC: #9, #26)
  - [ ] Update WorkOrderController with POST /{id}/progress endpoint
  - [ ] Implement progress update logic: validate work order status = IN_PROGRESS, validate current user is assignee, create WorkOrderProgress entry, upload photos to S3 (/work-orders/{workOrderId}/progress/{timestamp}_{filename}), update WorkOrder.scheduledDate if estimatedCompletionDate provided, create timeline entry, send email notification to property manager
  - [ ] Use FileStorageService for S3 uploads (reuse from Story 1.6)
  - [ ] Add @PreAuthorize to ensure only assignee can add progress
  - [ ] Write unit tests for progress update logic

- [ ] **Task 5: Implement Backend Mark Complete API Endpoint** (AC: #19, #26)
  - [ ] Update WorkOrderController with PATCH /{id}/complete endpoint
  - [ ] Implement completion logic: validate work order status = IN_PROGRESS, validate current user is assignee, update WorkOrder (status = COMPLETED, completedAt = now, completionNotes, hoursSpent, totalCost, recommendations, followUpRequired, followUpDescription), upload after photos to S3 (/work-orders/{workOrderId}/after/{timestamp}_{filename}), create timeline entry, send email notifications to property manager and tenant
  - [ ] Implement role-based cost field exclusion for tenant users in API response
  - [ ] Add @PreAuthorize to ensure only assignee can mark complete
  - [ ] Write unit tests for completion logic

- [ ] **Task 6: Implement Backend Timeline API Endpoint** (AC: #26)
  - [ ] Update WorkOrderController with GET /{id}/timeline endpoint
  - [ ] Query all timeline entries: work order created, assigned, started, progress updates, completed
  - [ ] Aggregate from WorkOrder, WorkOrderAssignment, WorkOrderProgress, WorkOrderComment entities
  - [ ] Return timeline entries ordered by timestamp DESC
  - [ ] Implement role-based filtering: exclude cost fields for tenant users
  - [ ] Write unit tests for timeline aggregation

- [ ] **Task 7: Implement Email Notification Templates** (AC: #27)
  - [ ] Create email template: work-order-started.html for work started notifications
  - [ ] Create email template: work-order-progress-update.html for progress update notifications
  - [ ] Create email template: work-order-completed.html for completion notifications
  - [ ] Implement sendWorkOrderStartedNotification(workOrder, assignee) method
  - [ ] Implement sendWorkOrderProgressUpdateNotification(workOrder, progressUpdate) method
  - [ ] Implement sendWorkOrderCompletedNotification(workOrder, completionDetails) method
  - [ ] Use Spring @Async for asynchronous email sending
  - [ ] Include photos (thumbnails) in emails, before/after comparison in completion email
  - [ ] Log email sending status in audit_logs
  - [ ] Write unit tests with mocked JavaMailSender

- [ ] **Task 8: Add Start Work Button to Work Order Detail Page** (AC: #1, #2)
  - [ ] Update work order detail page (app/(dashboard)/property-manager/work-orders/[id]/page.tsx)
  - [ ] Add "Start Work" button in action buttons section (visible if status = ASSIGNED and user is assignee)
  - [ ] Button uses shadcn Button component with Play icon (lucide-react)
  - [ ] Button disabled if status ≠ ASSIGNED or user is not assignee
  - [ ] Add tooltip: "Start working on this job"
  - [ ] Click button opens start work confirmation dialog (shadcn Alert Dialog)
  - [ ] Create useStartWork(workOrderId) mutation hook using React Query
  - [ ] On confirm: call PATCH /api/v1/work-orders/{id}/start
  - [ ] On success: show toast "Work started successfully!", update UI optimistically
  - [ ] Add data-testid="btn-start-work"

- [ ] **Task 9: Create Progress Update Section and Dialog** (AC: #3, #4, #5, #6, #7, #8, #9, #10)
  - [ ] Create components/work-orders/ProgressUpdateDialog.tsx as reusable component
  - [ ] Implement React Hook Form with addProgressUpdateSchema validation
  - [ ] Add progress notes textarea (shadcn Textarea, required, max 500 chars) with character counter
  - [ ] Add photo upload input (shadcn Input type="file", multiple, max 5 photos, accept image/*)
  - [ ] Implement photo compression using browser-image-compression (quality: 0.8, maxSizeMB: 1)
  - [ ] Add estimated completion date picker (shadcn Calendar, optional, must be ≥ today)
  - [ ] Add submit button with loading state and validation
  - [ ] Add cancel button to close dialog
  - [ ] Create useAddProgressUpdate(workOrderId) mutation hook using React Query
  - [ ] On submit: call POST /api/v1/work-orders/{id}/progress with multipart/form-data
  - [ ] Handle photo upload progress (show progress bars)
  - [ ] On success: close dialog, show toast "Progress update added successfully!", update timeline
  - [ ] On error: show toast "Failed to add progress update", keep dialog open, enable retry
  - [ ] Add data-testid to all form elements

- [ ] **Task 10: Create Mark as Complete Dialog** (AC: #11, #12, #13, #14, #15, #16, #17, #18, #19, #20)
  - [ ] Create components/work-orders/CompletionDialog.tsx as reusable component
  - [ ] Implement React Hook Form with markCompleteSchema validation
  - [ ] Add completion notes textarea (shadcn Textarea, required, min 20 chars, max 1000 chars) with character counter
  - [ ] Add after photos upload input (shadcn Input type="file", required, min 1 photo, max 5 photos)
  - [ ] Implement photo compression using browser-image-compression
  - [ ] Add hours spent input (shadcn Input type="number", required, decimal, min 0.1, max 999, step 0.5)
  - [ ] Add total cost input (shadcn Input type="number", required, decimal, min 0, max 999999, step 0.01, currency "AED")
  - [ ] Add recommendations textarea (shadcn Textarea, optional, max 500 chars)
  - [ ] Add follow-up required checkbox (shadcn Checkbox)
  - [ ] Add follow-up description textarea (shadcn Textarea, required if checkbox checked, max 200 chars)
  - [ ] Add submit button with loading state and validation
  - [ ] Create useMarkComplete(workOrderId) mutation hook using React Query
  - [ ] On submit: call PATCH /api/v1/work-orders/{id}/complete with multipart/form-data
  - [ ] On success: close dialog, show toast "Work order marked as complete!", update UI
  - [ ] On error: show toast "Failed to mark work order as complete", keep dialog open, enable retry
  - [ ] Add data-testid to all form elements

- [ ] **Task 11: Add Mark as Complete Button to Work Order Detail Page** (AC: #11)
  - [ ] Update work order detail page
  - [ ] Add "Mark as Complete" button in action buttons section (visible if status = IN_PROGRESS and user is assignee)
  - [ ] Button uses shadcn Button component (success variant, green) with CheckCircle icon
  - [ ] Click button opens CompletionDialog component
  - [ ] Add data-testid="btn-mark-complete"

- [ ] **Task 12: Create Photo Gallery Component** (AC: #21)
  - [ ] Create components/work-orders/PhotoGallery.tsx component
  - [ ] Implement three sections: Before Photos, During Photos, After Photos
  - [ ] Display photos in grid layout with labels ("Before", "During" with timestamp, "After")
  - [ ] Implement full-screen lightbox view for photos (click to enlarge)
  - [ ] Add zoom functionality in lightbox
  - [ ] Handle empty states for each section
  - [ ] Use shadcn Card component for gallery sections
  - [ ] Add data-testid="gallery-work-order-photos"

- [ ] **Task 13: Create Before/After Comparison Component** (AC: #21)
  - [ ] Create components/work-orders/BeforeAfterComparison.tsx component
  - [ ] Implement side-by-side layout on desktop, stacked on mobile
  - [ ] Add slider control to compare before/after photos
  - [ ] Implement zoom functionality
  - [ ] Add full-screen view option
  - [ ] Use shadcn Card component
  - [ ] Handle case when before or after photos missing

- [ ] **Task 14: Create Progress Timeline Component** (AC: #22)
  - [ ] Create components/work-orders/ProgressTimeline.tsx component
  - [ ] Implement useWorkOrderTimeline(workOrderId) hook with React Query
  - [ ] Display timeline entries chronologically (newest first)
  - [ ] Show entry type icons (lucide-react): FileText (created), UserPlus (assigned), Play (started), MessageSquare (progress update), CheckCircle (completed)
  - [ ] Format timestamps using date-fns: "dd MMM yyyy HH:mm"
  - [ ] Display user avatar/name for each entry
  - [ ] Show entry details: notes, photos, cost (if applicable and user has permission)
  - [ ] Use shadcn Card component for timeline entries
  - [ ] Add skeleton loaders for timeline during data fetch
  - [ ] Add data-testid="timeline-work-order-progress"

- [ ] **Task 15: Update Work Order Detail Page UI** (AC: #3, #22, #23)
  - [ ] Add progress update section (visible when status = IN_PROGRESS)
  - [ ] Add "Add Progress Update" button to open ProgressUpdateDialog
  - [ ] Display progress timeline using ProgressTimeline component
  - [ ] Display photo gallery using PhotoGallery component
  - [ ] Display before/after comparison using BeforeAfterComparison component (if both before and after photos exist)
  - [ ] Display completion details section (visible when status = COMPLETED): completion notes, hours spent, total cost (if user has permission), recommendations, follow-up required banner
  - [ ] Implement optimistic UI updates for start work, progress updates, completion
  - [ ] Add skeleton loaders for all sections

- [ ] **Task 16: Implement Mobile Optimization** (AC: #23, #24)
  - [ ] Test all dialogs on mobile (375px): full-screen, single column, full-width fields
  - [ ] Ensure touch targets ≥ 44×44px for all buttons
  - [ ] Implement camera integration for photo capture: input type="file" accept="image/*" capture="environment"
  - [ ] Test file upload on mobile browsers (iOS Safari, Chrome Android)
  - [ ] Convert photo gallery to swipeable carousel on mobile
  - [ ] Test photo compression on mobile devices
  - [ ] Test progress timeline on mobile (vertical card layout)
  - [ ] Test before/after comparison on mobile (stacked layout)

- [ ] **Task 17: Implement Role-Based Cost Visibility** (AC: #25)
  - [ ] Implement role check in frontend: if (user.role === 'TENANT') { hide cost fields }
  - [ ] Hide total cost field in completion dialog for tenant users
  - [ ] Hide hours spent and total cost in completion details section for tenant users
  - [ ] Backend API excludes cost fields from response when requested by tenant users
  - [ ] Test with different user roles: PROPERTY_MANAGER (can see cost), TENANT (cannot see cost)

- [ ] **Task 18: Implement Follow-up Tracking** (AC: #30)
  - [ ] Create components/work-orders/FollowUpBanner.tsx component
  - [ ] Display banner on work order detail page if followUpRequired = true
  - [ ] Banner uses shadcn Alert component with yellow/orange background
  - [ ] Show AlertCircle icon (lucide-react) and follow-up description
  - [ ] Add "Create Follow-up Work Order" button (links to work order creation form with pre-filled data)
  - [ ] Banner visible only to property managers and supervisors (not tenants)
  - [ ] Add data-testid="banner-follow-up-required"
  - [ ] Implement follow-up filter in work orders list: GET /api/v1/work-orders?followUpRequired=true

- [ ] **Task 19: Add Accessibility Features** (AC: #29)
  - [ ] Add data-testid to all interactive elements following convention {component}-{element}-{action}
  - [ ] Implement keyboard navigation: Tab, Enter, Escape
  - [ ] Add ARIA labels: role="dialog", aria-label on icon buttons, aria-describedby for hints
  - [ ] Add aria-live="polite" for success/error messages and photo upload progress
  - [ ] Add aria-busy="true" during form submission and photo upload
  - [ ] Ensure color contrast ≥ 4.5:1 for all text and badges
  - [ ] Add visible focus indicators to all interactive elements
  - [ ] Test with screen reader (VoiceOver/NVDA)

- [ ] **Task 20: Write Unit and Integration Tests** (AC: #29)
  - [ ] Write backend controller tests: start work, add progress, mark complete, timeline endpoints
  - [ ] Write service layer tests: progress tracking logic, photo upload, email notifications
  - [ ] Write frontend component tests: ProgressUpdateDialog, CompletionDialog, ProgressTimeline, PhotoGallery, BeforeAfterComparison
  - [ ] Write React Query hook tests with MSW for API mocking
  - [ ] Test form validation errors display correctly
  - [ ] Test photo compression functionality
  - [ ] Test role-based cost visibility
  - [ ] Test follow-up tracking
  - [ ] Achieve ≥ 80% code coverage for new code

## Dev Notes

### Learnings from Previous Story

**From Story 4.2 (Preventive Maintenance Scheduling - Status: done):**

Key patterns and components to reuse:

- **Form Validation Pattern**: React Hook Form + Zod
  - Inline validation errors with focus on first error field
  - Character counters for textareas
  - Loading states during submission
  - [Source: Story 4.2, Task 8, AC5]

- **Date Handling Pattern**: date-fns for formatting
  - Format timestamps: "dd MMM yyyy HH:mm"
  - Store dates in UTC, display in UAE timezone (GST)
  - [Source: Story 4.2, AC3, date-fns usage]

- **Status Badge Pattern**: Reuse StatusBadge component
  - Color-coded status badges (IN_PROGRESS=blue, COMPLETED=green)
  - [Source: Story 4.2, StatusBadge component]

- **API Integration Pattern**: Axios + React Query
  - Optimistic UI updates for better UX
  - Invalidate cache after mutations
  - [Source: Story 4.2, Task 9, AC7]

- **Email Notification Pattern**: Spring Mail + @Async
  - HTML templates in resources/templates/
  - Asynchronous sending to avoid blocking
  - Log email status in audit_logs
  - [Source: Story 4.2, Task 7, AC27]

**From Story 4.1 (Work Order Creation and Management - Status: done):**

- **File Upload Pattern**: S3 integration with FileStorageService
  - Upload photos to S3 with organized paths
  - Photo compression using browser-image-compression
  - [Source: Story 4.1, Task 5, AC19]

- **Timeline Pattern**: WorkOrderComment entity for timeline entries
  - Track all status changes and updates
  - Display chronologically with timestamps
  - [Source: Story 4.1, AC10]

**Dependencies Already Available** (from Story 4.1 and 4.2):
- date-fns, @tanstack/react-query, lucide-react, browser-image-compression
- shadcn/ui components: form, textarea, input, calendar, checkbox, button, card, dialog, alert-dialog, badge, alert, avatar, skeleton, toast, progress

**New Components Needed**:
- ProgressUpdateDialog (progress update form)
- CompletionDialog (completion form)
- ProgressTimeline (timeline display)
- PhotoGallery (before/during/after photo gallery)
- BeforeAfterComparison (side-by-side photo comparison)
- FollowUpBanner (follow-up required banner)

**Technical Debt from Story 4.2**:
- None identified that affects this story

### Architecture Patterns

**Progress Tracking Pattern:**
- Three-stage workflow: Start Work → Add Progress Updates → Mark Complete
- Each stage updates work order status and creates timeline entry
- Email notifications sent at each stage
- Photos categorized by stage: Before (start), During (progress), After (complete)

**Photo Management Pattern:**
- Before photos: uploaded when starting work (optional)
- During photos: uploaded in progress updates (optional)
- After photos: uploaded on completion (required, min 1 photo)
- All photos compressed client-side before upload (max 1MB)
- S3 paths: /work-orders/{workOrderId}/{stage}/{timestamp}_{filename}
- Photo gallery displays all photos organized by stage

**Timeline Pattern:**
- Aggregate timeline from multiple sources: WorkOrder, WorkOrderAssignment, WorkOrderProgress, WorkOrderComment
- Timeline entry types: CREATED, ASSIGNED, STARTED, PROGRESS_UPDATE, COMPLETED
- Each entry includes: type, timestamp, user, details, photos
- Display chronologically (newest first)
- Role-based filtering: exclude cost fields for tenant users

**Role-Based Access Pattern:**
- Cost fields (totalCost) visible only to PROPERTY_MANAGER, MAINTENANCE_SUPERVISOR
- Hours spent visible to all roles
- Completion notes visible to all roles
- Follow-up banner visible only to managers and supervisors
- Backend API excludes cost fields from response for tenant users
- Frontend conditionally renders based on user role

### Constraints

**Status Progression Rules:**
- ASSIGNED → IN_PROGRESS (when "Start Work" clicked)
- IN_PROGRESS → COMPLETED (when "Mark as Complete" submitted)
- Cannot start work if status ≠ ASSIGNED
- Cannot add progress if status ≠ IN_PROGRESS
- Cannot mark complete if status ≠ IN_PROGRESS
- Only assignee can start work, add progress, mark complete

**Photo Requirements:**
- Before photos: optional (uploaded when starting work)
- During photos: optional (uploaded in progress updates)
- After photos: required (min 1 photo, max 5 photos on completion)
- Max file size: 5MB per photo (before compression)
- Compressed to: ~1MB per photo (quality: 0.8)
- Accepted formats: image/jpeg, image/png, image/webp

**Completion Requirements:**
- Completion notes: required, min 20 chars, max 1000 chars
- After photos: required, min 1 photo, max 5 photos
- Hours spent: required, decimal, min 0.1, max 999
- Total cost: required, decimal, min 0, max 999999
- Recommendations: optional, max 500 chars
- Follow-up required: optional checkbox
- Follow-up description: required if checkbox checked, max 200 chars

**Email Notification Rules:**
- Work started: send to property manager
- Progress update: send to property manager
- Work completed: send to property manager and tenant
- All emails sent asynchronously (@Async)
- Include photos (thumbnails) in emails
- Completion email includes before/after comparison

### Testing Standards

From retrospective action items (AI-2-1, AI-2-2, AI-2-3, AI-2-4):
- ALL interactive elements MUST have data-testid attributes
- Convention: {component}-{element}-{action}
- Servers must be verified running before E2E tests (scripts/check-services.sh)
- Mandatory for buttons, inputs, textareas, file uploads, checkboxes, dialogs
- Verified in code review before PR approval
- Completion notes must include: files created/modified, dependencies, test results

### Integration Points

**With Story 4.1 (Work Order Creation and Management):**
- Progress tracking updates WorkOrder entity (status, startedAt, completedAt, completionNotes, hoursSpent, totalCost)
- Timeline entries created in WorkOrderComment
- Photos uploaded to S3 using FileStorageService
- Work order detail page displays progress tracking features

**With Story 4.2 (Preventive Maintenance Scheduling):**
- PM-generated work orders can be started, progressed, and completed
- Completion updates PM schedule statistics (completedCount, avgCompletionDays)

**With Story 4.3 (Work Order Assignment) - Future:**
- Only assigned users can start work, add progress, mark complete
- Assignment history displayed in timeline
- Assignee receives email notifications

**With Story 1.6 (AWS S3 File Storage Integration):**
- Reuse FileStorageService for photo uploads
- S3 paths: /work-orders/{workOrderId}/progress/, /work-orders/{workOrderId}/after/
- Photo compression before upload

### Backend Implementation Notes

**WorkOrderProgress Entity:**
- Tracks all progress updates during work execution
- Fields: id, workOrderId (FK), userId (FK), progressNotes, photoUrls (JSON array), estimatedCompletionDate (nullable), createdAt
- Query by workOrderId to get all progress updates
- Display in timeline chronologically

**Start Work Logic:**
1. Validate work order exists and status = ASSIGNED
2. Validate current user is assignee
3. Update WorkOrder: status = IN_PROGRESS, startedAt = now
4. Create timeline entry in WorkOrderComment
5. Send email notification to property manager
6. Create audit log entry
7. Return success response

**Add Progress Update Logic:**
1. Validate work order exists and status = IN_PROGRESS
2. Validate current user is assignee
3. Create WorkOrderProgress entry
4. Upload photos to S3 (/work-orders/{workOrderId}/progress/{timestamp}_{filename})
5. Update WorkOrder.scheduledDate if estimatedCompletionDate provided
6. Create timeline entry
7. Send email notification to property manager
8. Create audit log entry
9. Return success response with photo URLs

**Mark Complete Logic:**
1. Validate work order exists and status = IN_PROGRESS
2. Validate current user is assignee
3. Validate after photos provided (min 1 photo)
4. Update WorkOrder: status = COMPLETED, completedAt = now, completionNotes, hoursSpent, totalCost, recommendations, followUpRequired, followUpDescription
5. Upload after photos to S3 (/work-orders/{workOrderId}/after/{timestamp}_{filename})
6. Create timeline entry
7. Send email notifications to property manager and tenant
8. Create audit log entry
9. Return success response

**Timeline Aggregation:**
- Query WorkOrder: created, assigned, started, completed events
- Query WorkOrderProgress: all progress updates
- Query WorkOrderComment: status changes, comments
- Combine and sort by timestamp DESC
- Return timeline entries with type, timestamp, user, details, photos
- Exclude cost fields for tenant users

### References

- [Source: docs/epics/epic-4-maintenance-operations.md#story-44-job-progress-tracking-and-completion]
- [Source: docs/prd.md#3.4-maintenance-management-module]
- [Source: docs/architecture.md#frontend-implementation-patterns]
- [Source: docs/architecture.md#file-storage]
- [Source: docs/architecture.md#email-service]
- [Source: docs/sprint-artifacts/epic-4/4-1-work-order-creation-and-management.md]
- [Source: docs/sprint-artifacts/epic-4/4-2-preventive-maintenance-scheduling.md]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epic-4/4-4-job-progress-tracking-and-completion.context.xml`


### Agent Model Used

<!-- Will be populated by dev agent -->

### Debug Log References

<!-- Will be populated during implementation -->

### Completion Notes List

<!-- Will be populated during implementation -->

### File List

<!-- Will be populated during implementation -->
