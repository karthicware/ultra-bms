# Story 4.3: Work Order Assignment and Vendor Coordination

Status: ready-for-dev

## Story

As a maintenance supervisor,
I want to assign work orders to internal staff or external vendors,
So that jobs are distributed efficiently.

## Acceptance Criteria

1. **AC1 - Assignment Button and Access Control:** Assignment functionality accessible from work order detail page at /property-manager/work-orders/{id} for users with PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR roles. "Assign" button displayed prominently in action buttons section when work order status = OPEN or assignedTo is null (unassigned). Button uses shadcn Button component (primary variant) with icon (UserPlus from lucide-react). Button disabled if work order status = COMPLETED or CLOSED. Tooltip shown on hover: "Assign this work order to staff or vendor". Button has data-testid="btn-assign-work-order". If work order already assigned, show "Reassign" button instead with different styling (secondary variant, RefreshCw icon). [Source: docs/epics/epic-4-maintenance-operations.md#story-43-work-order-assignment-and-vendor-coordination, docs/architecture.md#frontend-implementation-patterns]

2. **AC2 - Assignment Dialog Structure:** Click "Assign" button opens shadcn Dialog (modal) with title "Assign Work Order" and subtitle "#{workOrderNumber} - {title}". Dialog width: 600px on desktop, full-screen on mobile. Dialog sections: (1) Assignee Type Selection (radio group), (2) Assignee Selection (dropdown), (3) Assignment Notes (textarea), (4) Action Buttons (Cancel, Assign). Dialog uses React Hook Form with assignWorkOrderSchema validation. Close button (X icon) in top-right corner. Clicking outside dialog or pressing Escape closes dialog without saving. Dialog has data-testid="dialog-assign-work-order". [Source: docs/epics/epic-4-maintenance-operations.md#manual-assignment, docs/architecture.md#component-pattern]

3. **AC3 - Assignee Type Selection:** Radio group (shadcn Radio Group) with 2 options: "Internal Staff" (value: INTERNAL_STAFF, default selected), "External Vendor" (value: EXTERNAL_VENDOR). Each option displays: radio button, label, description text. Internal Staff description: "Assign to in-house maintenance team member". External Vendor description: "Assign to external contractor or service provider". Selection changes assignee dropdown options dynamically. Radio group has data-testid="radio-assignee-type". [Source: docs/epics/epic-4-maintenance-operations.md#manual-assignment]

4. **AC4 - Internal Staff Assignee Dropdown:** Shown when assignee type = INTERNAL_STAFF. shadcn Select component populated with users having role = MAINTENANCE_SUPERVISOR. Dropdown displays: user full name, email (secondary text), avatar/initials. Empty state: "No internal staff available. Please add maintenance supervisors first." Dropdown required (validation error if not selected). Async loading with skeleton while fetching users. Search/filter functionality for large lists. Dropdown has data-testid="select-internal-staff". [Source: docs/epics/epic-4-maintenance-operations.md#manual-assignment, docs/architecture.md#form-pattern-with-react-hook-form-zod]

5. **AC5 - External Vendor Assignee Dropdown:** Shown when assignee type = EXTERNAL_VENDOR. shadcn Select component populated with active vendors filtered by work order category. Query: GET /api/v1/vendors?status=ACTIVE&serviceCategory={workOrderCategory}. Dropdown displays: vendor company name, service categories (badges), rating (stars), contact person name. Empty state: "No vendors available for {category} services. Please register vendors first." Dropdown required (validation error if not selected). Async loading with skeleton. Search/filter by company name or service category. Dropdown has data-testid="select-external-vendor". Note displayed: "💡 Only vendors matching the work order category ({category}) are shown." [Source: docs/epics/epic-4-maintenance-operations.md#manual-assignment, docs/architecture.md#form-pattern-with-react-hook-form-zod]

6. **AC6 - Assignment Notes Section:** Textarea (shadcn Textarea) for optional assignment notes. Label: "Assignment Notes (Optional)". Placeholder: "Add any special instructions or urgency notes for the assignee...". Max length: 500 characters. Character counter displayed: "{count}/500 characters". Rows: 4. Notes examples shown in help text: "Urgent, complete by EOD", "Tenant available after 2 PM", "Requires specialized equipment". Textarea has data-testid="textarea-assignment-notes". [Source: docs/epics/epic-4-maintenance-operations.md#manual-assignment]

7. **AC7 - Assignment Form Validation and Submission:** Zod validation schema assignWorkOrderSchema with rules: assigneeType (required enum: INTERNAL_STAFF, EXTERNAL_VENDOR), assigneeId (required UUID), assignmentNotes (optional string, max 500 chars). Form uses React Hook Form with zodResolver. Submit button: "Assign Work Order" (shadcn Button primary variant, full-width on mobile, loading spinner during submission, disabled if form invalid). Cancel button: "Cancel" (secondary variant, closes dialog). On validation failure: focus first error field, display inline errors in red text, show toast: "Please select an assignee before submitting". Button has data-testid="btn-submit-assignment". [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]

8. **AC8 - Assignment Backend Processing:** On form submit: call POST /api/v1/work-orders/{id}/assign with body: {assigneeType, assigneeId, assignmentNotes}. Backend updates WorkOrder entity: set assignedTo = assigneeId, set assigneeType = assigneeType (INTERNAL_STAFF or EXTERNAL_VENDOR), update status: OPEN → ASSIGNED, set assignedDate = current timestamp (UTC), set assignedBy = current user ID (from auth context). Create WorkOrderAssignment entity (assignment history): id (UUID), workOrderId (FK), assigneeType, assigneeId (FK to User or Vendor), assignedBy (userId), assignedDate, assignmentNotes, reassignmentReason (null for initial assignment). Create timeline entry in WorkOrderComment: type = STATUS_CHANGE, status = ASSIGNED, text = "Assigned to {assigneeName} ({assigneeType})", notes = assignmentNotes. Send email notification to assignee (internal staff or vendor contact). Create audit log entry: action = "WORK_ORDER_ASSIGNED", entityType = "WORK_ORDER", entityId, userId, metadata = {assigneeType, assigneeId, assigneeName}. Return response: {success: true, data: {workOrderId, assignedTo: {id, name, type}, assignedDate}}. [Source: docs/epics/epic-4-maintenance-operations.md#assignment-updates, docs/architecture.md#rest-api-conventions]

9. **AC9 - Post-Assignment Flow:** On successful assignment: close dialog, show success toast: "Work order assigned to {assigneeName} successfully!", invalidate React Query cache: ['work-orders', workOrderId], update work order detail page UI optimistically (status badge changes to ASSIGNED, assigned vendor section appears, timeline updates). Redirect not required (stay on detail page). If submission fails: show error toast: "Failed to assign work order. Please try again.", keep dialog open with form data intact, enable retry. [Source: docs/epics/epic-4-maintenance-operations.md#assignment-updates, docs/architecture.md#optimistic-updates]

10. **AC10 - Reassignment Flow:** "Reassign" button shown on work order detail page if work order already assigned (assignedTo not null). Click "Reassign" opens similar dialog with title "Reassign Work Order". Dialog pre-populates: current assignee type and assignee (read-only, shown as info banner: "Currently assigned to: {currentAssigneeName}"). Additional required field: Reassignment Reason (textarea, required, min 10 chars, max 200 chars, placeholder: "Explain why you're reassigning this work order..."). Examples: "Vendor A unavailable", "Requires different expertise", "Workload balancing". On submit: call POST /api/v1/work-orders/{id}/reassign with {newAssigneeType, newAssigneeId, reassignmentReason, assignmentNotes}. Backend creates new WorkOrderAssignment entry with reassignmentReason, updates WorkOrder.assignedTo, sends notification to previous assignee (reassignment notification) and new assignee (assignment notification). Timeline entry: "Reassigned from {previousAssigneeName} to {newAssigneeName}. Reason: {reassignmentReason}". Success toast: "Work order reassigned to {newAssigneeName}". [Source: docs/epics/epic-4-maintenance-operations.md#reassignment, docs/architecture.md#optimistic-updates]

11. **AC11 - Assignment History Tracking:** Work order detail page displays "Assignment History" section showing all assignments chronologically (newest first). Table columns: Assigned To (name, type badge), Assigned By (manager name), Assigned Date (formatted "dd MMM yyyy HH:mm"), Reassignment Reason (if applicable), Assignment Notes. First assignment has badge "Initial Assignment", subsequent assignments have badge "Reassignment". Empty state: "No assignment history available." Section collapsible (accordion) to save space. Query: GET /api/v1/work-orders/{id}/assignment-history returns array of WorkOrderAssignment entities. Section has data-testid="section-assignment-history". [Source: docs/epics/epic-4-maintenance-operations.md#reassignment, docs/architecture.md#component-pattern]

12. **AC12 - Unassigned Work Orders List View:** New page at /property-manager/work-orders/unassigned displays all work orders with status = OPEN and assignedTo = null. Uses same shadcn DataTable as main work orders list. Columns: Work Order #, Property/Unit, Title, Category, Priority, Scheduled Date, Days Open (calculated: today - createdAt), Quick Assign button. Sort by priority (HIGH first) and days open (oldest first) by default. Filter by: priority, category, property. Search by work order number or title. Quick Assign button in each row opens assignment dialog inline. Badge showing count: "{count} Unassigned Work Orders". Empty state: "🎉 All work orders are assigned! Great job." Page accessible from main navigation: "Unassigned Work Orders" menu item with count badge. Page has data-testid="page-unassigned-work-orders". [Source: docs/epics/epic-4-maintenance-operations.md#api-endpoints, docs/architecture.md#component-pattern]

13. **AC13 - Email Notification to Assignee (Internal Staff):** When work order assigned to internal staff: send email to staff member's email address. Email template: work-order-assigned-staff.html. Subject: "New Work Order Assigned: #{workOrderNumber} - {title}". Email content: greeting with staff name, work order details (number, title, category, priority, scheduled date), property and unit information, issue description, access instructions (if provided), photos (thumbnails with links), assignment notes (if provided), action button: "View Work Order" (links to /property-manager/work-orders/{id}), footer with contact information. Email sent asynchronously using Spring @Async. Log email sending status in audit_logs. Template styled with company branding, mobile-responsive HTML. [Source: docs/epics/epic-4-maintenance-operations.md#assignment-updates, docs/architecture.md#email-service]

14. **AC14 - Email Notification to Assignee (External Vendor):** When work order assigned to external vendor: send email to vendor's primary contact email. Email template: work-order-assigned-vendor.html. Subject: "New Work Order Assignment: #{workOrderNumber} - {title}". Email content: greeting with vendor company name, work order details (number, title, category, priority, scheduled date), property address and unit number, issue description with photos, access instructions, assignment notes, contact information (property manager name, phone, email), action button: "View Work Order Details" (links to vendor portal or PDF attachment if no portal), footer with terms and conditions. Include attachments: work order PDF with all details, photos as attachments. Email sent asynchronously. Log email status. [Source: docs/epics/epic-4-maintenance-operations.md#assignment-updates, docs/architecture.md#email-service]

15. **AC15 - Reassignment Notification to Previous Assignee:** When work order reassigned: send email to previous assignee (staff or vendor). Email template: work-order-reassigned.html. Subject: "Work Order Reassigned: #{workOrderNumber}". Email content: notification that work order has been reassigned, reassignment reason, new assignee name (if internal) or "external vendor" (if vendor), work order details for reference, action: no action required, contact manager if questions. Tone: professional, not punitive. Email sent asynchronously. [Source: docs/epics/epic-4-maintenance-operations.md#reassignment]

16. **AC16 - Backend API Endpoints:** Implement REST endpoints: POST /api/v1/work-orders/{id}/assign assigns work order to staff or vendor, updates status to ASSIGNED, creates assignment history entry, sends notification, returns {workOrderId, assignedTo: {id, name, type}, assignedDate}. POST /api/v1/work-orders/{id}/reassign reassigns work order to different assignee, requires reassignmentReason, creates new assignment history entry, sends notifications to both previous and new assignees, returns {workOrderId, previousAssignee, newAssignee, reassignedDate}. GET /api/v1/work-orders/unassigned lists all unassigned work orders (status = OPEN, assignedTo = null) with filters (priority, category, property), pagination, sorting (priority DESC, createdAt ASC), returns {workOrders: [], totalPages, totalElements}. GET /api/v1/work-orders/{id}/assignment-history returns paginated list of all assignments for work order, ordered by assignedDate DESC, returns {assignments: [{id, assigneeType, assigneeId, assigneeName, assignedBy, assignedByName, assignedDate, reassignmentReason, assignmentNotes}], totalElements}. All endpoints require PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR role via @PreAuthorize. [Source: docs/epics/epic-4-maintenance-operations.md#api-endpoints, docs/architecture.md#api-response-format]

17. **AC17 - Vendor Service Integration:** Assignment dialog queries vendor service: GET /api/v1/vendors?status=ACTIVE&serviceCategory={category} returns list of active vendors matching work order category. Vendor response DTO: {id, companyName, serviceCategories: [], rating (1-5 stars), contactPerson: {name, email, phone}, status}. If vendor service not yet implemented (Story 5.1 pending): show placeholder message: "Vendor management coming soon. Currently only internal staff assignment is available." Disable "External Vendor" radio option. Assignment backend validates vendor exists and is active before assigning. [Source: docs/epics/epic-4-maintenance-operations.md#prerequisites, docs/architecture.md#rest-api-conventions]

18. **AC18 - Assignment Validation Rules:** Backend validation: work order must exist and be accessible to current user. Work order status must be OPEN, ASSIGNED, or IN_PROGRESS (cannot assign COMPLETED or CLOSED work orders). If assigneeType = INTERNAL_STAFF: assigneeId must reference valid User with role = MAINTENANCE_SUPERVISOR. If assigneeType = EXTERNAL_VENDOR: assigneeId must reference valid Vendor with status = ACTIVE and serviceCategory matching work order category. Reassignment requires reassignmentReason (min 10 chars). Assignment notes max 500 chars. Return 400 Bad Request with error message if validation fails: "Cannot assign work order: {reason}". Return 404 Not Found if work order or assignee not found. Return 403 Forbidden if user lacks permission. [Source: docs/architecture.md#validation]

19. **AC19 - TypeScript Types and Schemas:** Create types/work-order-assignment.ts with interfaces: WorkOrderAssignment {id, workOrderId, assigneeType, assigneeId, assigneeName, assignedBy, assignedByName, assignedDate, reassignmentReason, assignmentNotes}, AssignWorkOrderRequest {assigneeType, assigneeId, assignmentNotes}, ReassignWorkOrderRequest {newAssigneeType, newAssigneeId, reassignmentReason, assignmentNotes}, AssigneeOption {id, name, type, email, companyName, serviceCategories, rating}. Define enums: AssigneeType (INTERNAL_STAFF, EXTERNAL_VENDOR). Create lib/validations/work-order-assignment.ts with assignWorkOrderSchema, reassignWorkOrderSchema using Zod. Update services/work-order.service.ts with methods: assignWorkOrder(workOrderId, data), reassignWorkOrder(workOrderId, data), getUnassignedWorkOrders(filters, pagination), getAssignmentHistory(workOrderId, pagination). [Source: docs/architecture.md#typescript-strict-mode]

20. **AC20 - Responsive Design and Accessibility:** Assignment dialog fully responsive: Mobile (<640px): full-screen dialog, single column layout, full-width form fields, touch targets ≥ 44×44px, stack radio buttons vertically. Tablet (640px-1024px): centered dialog 600px width, 2-column layout for radio group. Desktop (>1024px): centered dialog 600px width, hover states on interactive elements. All interactive elements have data-testid attributes: "btn-assign-work-order", "dialog-assign-work-order", "radio-assignee-type", "select-internal-staff", "select-external-vendor", "textarea-assignment-notes", "btn-submit-assignment". Keyboard navigation: Tab through fields, Enter to submit, Escape to close dialog. ARIA labels: role="dialog" on assignment dialog, aria-label on icon-only buttons, aria-describedby for field hints, aria-live="polite" for success/error messages, aria-busy="true" during form submission. Screen reader announcements: "Work order assigned to {assigneeName}". Color contrast ≥ 4.5:1 for all text. Focus indicators visible on all interactive elements. [Source: docs/architecture.md#accessibility, docs/development/ux-design-specification.md#8.2-wcag-compliance]

## Component Mapping

### shadcn/ui Components to Use

**Form Components:**
- dialog (assignment/reassignment modal)
- form (React Hook Form integration)
- radio-group (assignee type selection)
- select (internal staff, external vendor dropdowns)
- textarea (assignment notes, reassignment reason)
- label (form field labels)
- button (assign, reassign, cancel buttons)

**Layout Components:**
- card (assignment history section)
- separator (dividing sections)
- badge (assignee type, status, priority indicators)
- alert (information banners, warnings)

**Data Display:**
- table (assignment history, unassigned work orders list)
- pagination (unassigned work orders pagination)
- avatar (user/vendor profile images)
- skeleton (loading states)

**Feedback Components:**
- toast/sonner (success/error notifications)

**Custom Components:**
- AssignmentDialog (reusable assignment dialog component)
- AssigneeSelector (dynamic assignee dropdown based on type)
- AssignmentHistoryTable (assignment history display)
- UnassignedWorkOrdersTable (unassigned work orders list with quick assign)

### Installation Command

All shadcn components already installed from Story 4.1. No new installations required.

### Additional Dependencies

All dependencies already available from Story 4.1:
```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.11.0",
    "lucide-react": "^0.263.1"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types, Enums, and Schemas** (AC: #19)
  - [ ] Create types/work-order-assignment.ts with WorkOrderAssignment, AssignWorkOrderRequest, ReassignWorkOrderRequest, AssigneeOption interfaces
  - [ ] Define enum: AssigneeType (INTERNAL_STAFF, EXTERNAL_VENDOR)
  - [ ] Create lib/validations/work-order-assignment.ts with assignWorkOrderSchema, reassignWorkOrderSchema (Zod)
  - [ ] Update services/work-order.service.ts with assignment methods
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Implement Backend WorkOrderAssignment Entity** (AC: #8, #16)
  - [ ] Create WorkOrderAssignment entity with fields: id, workOrderId (FK), assigneeType (enum), assigneeId (UUID, polymorphic - can reference User or Vendor), assignedBy (userId FK), assignedDate, reassignmentReason (nullable), assignmentNotes (nullable)
  - [ ] Create WorkOrderAssignmentRepository extending JpaRepository
  - [ ] Add database migration for work_order_assignments table (Flyway)
  - [ ] Add indexes on workOrderId, assigneeId, assignedDate
  - [ ] Add assigneeType and assignedTo fields to WorkOrder entity (if not already present)

- [ ] **Task 3: Implement Backend Assignment API Endpoints** (AC: #8, #16, #18)
  - [ ] Update WorkOrderController with POST /{id}/assign endpoint
  - [ ] Implement assignment logic: validate work order status, validate assignee exists and is active, update WorkOrder (assignedTo, assigneeType, status, assignedDate), create WorkOrderAssignment entry, create timeline entry, send email notification
  - [ ] Implement POST /{id}/reassign endpoint with reassignmentReason validation
  - [ ] Implement reassignment logic: create new assignment entry, update WorkOrder, send notifications to both assignees
  - [ ] Implement GET /unassigned endpoint: query work orders where status = OPEN and assignedTo = null, apply filters, pagination, sorting
  - [ ] Implement GET /{id}/assignment-history endpoint: return all assignments for work order, ordered by date DESC
  - [ ] Add @PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR')") to all endpoints
  - [ ] Write unit tests for assignment and reassignment logic

- [ ] **Task 4: Implement Vendor Service Integration** (AC: #5, #17)
  - [ ] Check if Vendor entity and VendorService exist (Story 5.1 dependency)
  - [ ] If Vendor service exists: implement GET /api/v1/vendors?status=ACTIVE&serviceCategory={category} endpoint
  - [ ] If Vendor service not yet implemented: create placeholder VendorService with mock data or disable external vendor option
  - [ ] Implement vendor filtering by service category matching work order category
  - [ ] Return vendor DTO with: id, companyName, serviceCategories, rating, contactPerson, status
  - [ ] Add validation: vendor must be ACTIVE and have matching service category

- [ ] **Task 5: Implement Email Notification Templates** (AC: #13, #14, #15)
  - [ ] Create email template: work-order-assigned-staff.html for internal staff assignments
  - [ ] Create email template: work-order-assigned-vendor.html for external vendor assignments
  - [ ] Create email template: work-order-reassigned.html for reassignment notifications
  - [ ] Implement sendWorkOrderAssignedNotification(workOrder, assignee, assignmentNotes) method
  - [ ] Implement sendWorkOrderReassignedNotification(workOrder, previousAssignee, newAssignee, reason) method
  - [ ] Use Spring @Async for asynchronous email sending
  - [ ] Include work order details, photos (thumbnails), access instructions, action buttons in emails
  - [ ] Log email sending status in audit_logs
  - [ ] Write unit tests with mocked JavaMailSender

- [ ] **Task 6: Create Assignment Dialog Component** (AC: #2, #3, #4, #5, #6, #7)
  - [ ] Create components/work-orders/AssignmentDialog.tsx as reusable component
  - [ ] Implement React Hook Form with assignWorkOrderSchema validation
  - [ ] Create assignee type radio group (shadcn Radio Group): INTERNAL_STAFF, EXTERNAL_VENDOR
  - [ ] Create internal staff dropdown (shadcn Select) with async loading of MAINTENANCE_SUPERVISOR users
  - [ ] Create external vendor dropdown (shadcn Select) with async loading of active vendors filtered by category
  - [ ] Implement dynamic dropdown switching based on selected assignee type
  - [ ] Add assignment notes textarea (shadcn Textarea, max 500 chars) with character counter
  - [ ] Add submit button with loading state and validation
  - [ ] Add cancel button to close dialog
  - [ ] Add data-testid to all form elements

- [ ] **Task 7: Implement Assignment Form Submission** (AC: #7, #8, #9)
  - [ ] Create useAssignWorkOrder(workOrderId) mutation hook using React Query
  - [ ] On submit: call POST /api/v1/work-orders/{id}/assign with {assigneeType, assigneeId, assignmentNotes}
  - [ ] Handle submission loading state (disable form, show spinner)
  - [ ] On success: close dialog, show toast "Work order assigned to {assigneeName} successfully!"
  - [ ] Invalidate React Query cache: ['work-orders', workOrderId]
  - [ ] Update UI optimistically: status badge, assigned vendor section, timeline
  - [ ] On error: show toast "Failed to assign work order", keep dialog open, enable retry

- [ ] **Task 8: Add Assignment Button to Work Order Detail Page** (AC: #1)
  - [ ] Update work order detail page (app/(dashboard)/property-manager/work-orders/[id]/page.tsx)
  - [ ] Add "Assign" button in action buttons section (visible if status = OPEN or assignedTo = null)
  - [ ] Add "Reassign" button if work order already assigned (assignedTo not null)
  - [ ] Button uses shadcn Button component with UserPlus icon (lucide-react)
  - [ ] Button disabled if status = COMPLETED or CLOSED
  - [ ] Add tooltip: "Assign this work order to staff or vendor"
  - [ ] Click button opens AssignmentDialog component
  - [ ] Add data-testid="btn-assign-work-order"

- [ ] **Task 9: Implement Reassignment Dialog and Flow** (AC: #10)
  - [ ] Create components/work-orders/ReassignmentDialog.tsx (extends AssignmentDialog)
  - [ ] Pre-populate current assignee info (read-only banner: "Currently assigned to: {name}")
  - [ ] Add required reassignment reason field (textarea, min 10 chars, max 200 chars)
  - [ ] Create useReassignWorkOrder(workOrderId) mutation hook
  - [ ] On submit: call POST /api/v1/work-orders/{id}/reassign with {newAssigneeType, newAssigneeId, reassignmentReason, assignmentNotes}
  - [ ] On success: show toast "Work order reassigned to {newAssigneeName}", update UI
  - [ ] Backend sends notifications to both previous and new assignees

- [ ] **Task 10: Create Assignment History Section** (AC: #11)
  - [ ] Create components/work-orders/AssignmentHistoryTable.tsx component
  - [ ] Implement useAssignmentHistory(workOrderId) hook with React Query
  - [ ] Display table with columns: Assigned To, Assigned By, Assigned Date, Reassignment Reason, Assignment Notes
  - [ ] Show badge "Initial Assignment" for first assignment, "Reassignment" for subsequent
  - [ ] Make section collapsible (shadcn Accordion) to save space
  - [ ] Handle empty state: "No assignment history available."
  - [ ] Add to work order detail page below status timeline
  - [ ] Add data-testid="section-assignment-history"

- [ ] **Task 11: Create Unassigned Work Orders Page** (AC: #12)
  - [ ] Create app/(dashboard)/property-manager/work-orders/unassigned/page.tsx
  - [ ] Implement useUnassignedWorkOrders() hook with React Query (filters, pagination, server-side)
  - [ ] Create shadcn DataTable with columns: Work Order #, Property/Unit, Title, Category, Priority, Scheduled Date, Days Open, Quick Assign
  - [ ] Calculate "Days Open" field: today - createdAt
  - [ ] Sort by priority (HIGH first) and days open (oldest first) by default
  - [ ] Add filter controls: priority, category, property
  - [ ] Add search input for work order number or title
  - [ ] Add "Quick Assign" button in each row (opens assignment dialog inline)
  - [ ] Display badge: "{count} Unassigned Work Orders"
  - [ ] Handle empty state: "🎉 All work orders are assigned! Great job."
  - [ ] Add to main navigation menu with count badge
  - [ ] Add data-testid="page-unassigned-work-orders"

- [ ] **Task 12: Update Work Order Detail Page UI** (AC: #1, #9)
  - [ ] Update assigned vendor section to show assignee details (name, type, contact info)
  - [ ] Display assignee type badge (INTERNAL_STAFF or EXTERNAL_VENDOR)
  - [ ] Show assignment date and assigned by user
  - [ ] Update status timeline to include assignment events
  - [ ] Implement optimistic UI updates for assignment (update status badge, show assigned section immediately)
  - [ ] Add skeleton loaders for assignment history section

- [ ] **Task 13: Implement Responsive Design and Mobile Optimization** (AC: #20)
  - [ ] Test assignment dialog on mobile (375px): full-screen, single column, full-width fields
  - [ ] Test assignment dialog on tablet (768px): centered 600px width
  - [ ] Test assignment dialog on desktop (1440px): centered 600px width
  - [ ] Ensure touch targets ≥ 44×44px on mobile for all buttons/inputs
  - [ ] Test unassigned work orders table responsiveness (convert to card view on mobile)
  - [ ] Test assignment history table on mobile (stacked rows)
  - [ ] Support dark theme using shadcn dark mode classes

- [ ] **Task 14: Add Accessibility Features** (AC: #20)
  - [ ] Add data-testid to all interactive elements following convention {component}-{element}-{action}
  - [ ] Implement keyboard navigation: Tab, Enter, Escape
  - [ ] Add ARIA labels: role="dialog", aria-label on icon buttons, aria-describedby for hints
  - [ ] Add aria-live="polite" for success/error messages
  - [ ] Add aria-busy="true" during form submission
  - [ ] Ensure color contrast ≥ 4.5:1 for all text and badges
  - [ ] Add visible focus indicators to all interactive elements
  - [ ] Test with screen reader (VoiceOver/NVDA)

- [ ] **Task 15: Write Unit and Integration Tests** (AC: #20)
  - [ ] Write backend controller tests: assignment and reassignment endpoints
  - [ ] Write service layer tests: assignment validation, email notifications, assignment history
  - [ ] Write frontend component tests: AssignmentDialog, ReassignmentDialog, AssignmentHistoryTable
  - [ ] Write React Query hook tests with MSW for API mocking
  - [ ] Test form validation errors display correctly
  - [ ] Test assignee type switching and dropdown population
  - [ ] Test assignment and reassignment flows end-to-end
  - [ ] Achieve ≥ 80% code coverage for new code

## Dev Notes

### Learnings from Previous Story

**From Story 4.1 (Work Order Creation and Management - Status: done):**

Key patterns and components to reuse:

- **Work Order Entity Pattern**: WorkOrder entity already has assignedTo field (UUID) and status field
  - Assignment will update these fields: assignedTo, status (OPEN → ASSIGNED)
  - WorkOrder entity supports polymorphic assignedTo (can reference User or Vendor)
  - [Source: Story 4.1, WorkOrder entity]

- **Dialog Pattern**: Reuse shadcn Dialog for assignment modal
  - Full-screen on mobile, centered on desktop
  - Close on Escape or outside click
  - Form validation with React Hook Form + Zod
  - [Source: Story 4.1, Task 12, AC10]

- **Data Table Pattern**: Reuse server-side data table for unassigned work orders list
  - @tanstack/react-table for server-side pagination, sorting, filtering
  - Persist filter state in URL query params
  - Column visibility toggle, row selection
  - Mobile: convert to card view (stacked rows)
  - [Source: Story 4.1, Task 11, AC8]

- **Status Badge Pattern**: Reuse StatusBadge component
  - Color-coded status badges (ASSIGNED=green)
  - [Source: Story 4.1, StatusBadge component]

- **Priority Badge Pattern**: Reuse PriorityBadge component
  - Color-coded priority badges (HIGH=red, MEDIUM=yellow, LOW=blue)
  - [Source: Story 4.1, PriorityBadge component]

- **Category Icon Pattern**: Reuse CategoryIcon component
  - lucide-react icons for categories
  - [Source: Story 4.1, CategoryIcon component]

- **Email Notification Pattern**: Reuse Spring Mail + @Async pattern
  - HTML templates in resources/templates/
  - Asynchronous sending to avoid blocking
  - Log email status in audit_logs
  - [Source: Story 4.1, Task 5, AC19]

- **API Integration Pattern**: Axios + React Query
  - All API calls through centralized apiClient
  - Optimistic UI updates for better UX
  - [Source: Story 4.1, Task 11, AC8]

**Dependencies Already Available** (from Story 4.1):
- date-fns, @tanstack/react-query, @tanstack/react-table, lucide-react
- shadcn/ui components: dialog, form, radio-group, select, textarea, button, card, badge, table, skeleton, toast, alert

**New Components Needed**:
- AssignmentDialog (assignment modal with dynamic assignee selection)
- ReassignmentDialog (extends AssignmentDialog with reassignment reason)
- AssigneeSelector (dynamic dropdown based on assignee type)
- AssignmentHistoryTable (assignment history display)
- UnassignedWorkOrdersTable (unassigned work orders list with quick assign)

**Technical Debt from Story 4.1**:
- None identified that affects this story

### Architecture Patterns

**Polymorphic Assignment Pattern:**
- assignedTo field in WorkOrder is UUID (can reference User or Vendor)
- assigneeType field determines which entity assignedTo references
- Backend resolves assignee details based on type when returning work order
- Frontend displays assignee info with type badge

**Assignment History Pattern:**
- Separate WorkOrderAssignment entity tracks all assignments
- Each assignment creates new entry (append-only, never update)
- Supports reassignment tracking with reassignmentReason field
- Timeline shows assignment events chronologically

**Email Notification Pattern:**
- Different templates for internal staff vs external vendors
- Staff email: links to internal work order detail page
- Vendor email: includes full details, photos, PDF attachment (if no vendor portal)
- Reassignment email: notifies previous assignee professionally

**Vendor Integration Pattern:**
- Assignment dialog queries vendor service for active vendors
- Filter vendors by service category matching work order category
- If vendor service not implemented: disable external vendor option with message
- Graceful degradation: internal staff assignment always available

### Constraints

**Assignment Rules:**
- Can only assign work orders with status = OPEN, ASSIGNED, or IN_PROGRESS
- Cannot assign COMPLETED or CLOSED work orders
- Internal staff must have role = MAINTENANCE_SUPERVISOR
- External vendors must be ACTIVE and have matching service category
- Reassignment requires reason (min 10 chars)

**Assignee Type Rules:**
- INTERNAL_STAFF: assignedTo references User entity
- EXTERNAL_VENDOR: assignedTo references Vendor entity
- Backend validates assignee exists and meets criteria before assigning

**Status Progression Rules:**
- OPEN → ASSIGNED (when first assigned)
- ASSIGNED → ASSIGNED (when reassigned, status doesn't change)
- Assignment doesn't affect IN_PROGRESS or COMPLETED status

**Email Notification Rules:**
- Send to assignee immediately after assignment
- Send to previous assignee on reassignment
- Include work order details, photos, access instructions
- Async sending to avoid blocking API response

### Testing Standards

From retrospective action items (AI-2-1, AI-2-2, AI-2-3, AI-2-4):
- ALL interactive elements MUST have data-testid attributes
- Convention: {component}-{element}-{action}
- Servers must be verified running before E2E tests (scripts/check-services.sh)
- Mandatory for buttons, inputs, selects, textareas, dialogs, table rows
- Verified in code review before PR approval
- Completion notes must include: files created/modified, dependencies, test results

### Integration Points

**With Story 4.1 (Work Order Creation and Management):**
- Assignment updates WorkOrder entity (assignedTo, assigneeType, status, assignedDate)
- Assignment creates timeline entry in WorkOrderComment
- Assigned vendor section displayed on work order detail page
- Assignment history shown on detail page

**With Story 5.1 (Vendor Management) - Future:**
- External vendor assignment depends on Vendor entity and VendorService
- If Story 5.1 not implemented: disable external vendor option, show placeholder
- Vendor dropdown filtered by service category matching work order category
- Vendor details (company name, rating, contact) displayed on work order detail page

**With Story 2.1 (User Management):**
- Internal staff dropdown populated from User entities with role = MAINTENANCE_SUPERVISOR
- User details (name, email) displayed in assignment history
- assignedBy field references User entity

### Backend Implementation Notes

**WorkOrderAssignment Entity:**
- Tracks all assignments (initial and reassignments)
- Fields: id, workOrderId (FK), assigneeType (enum), assigneeId (UUID), assignedBy (userId), assignedDate, reassignmentReason (nullable), assignmentNotes (nullable)
- Append-only: never update, always create new entry
- Query by workOrderId to get full assignment history

**Assignment Logic:**
1. Validate work order exists and status allows assignment
2. Validate assignee exists and meets criteria (role, status, category)
3. Update WorkOrder: assignedTo, assigneeType, status (if OPEN → ASSIGNED), assignedDate
4. Create WorkOrderAssignment entry
5. Create timeline entry in WorkOrderComment
6. Send email notification to assignee
7. Create audit log entry
8. Return success response

**Reassignment Logic:**
1. Same as assignment, plus:
2. Validate reassignmentReason provided (min 10 chars)
3. Send notification to previous assignee
4. Timeline entry includes reassignment reason

**Vendor Service Integration:**
- If Vendor entity exists: query active vendors with matching service category
- If Vendor entity not exists: return empty list or error
- Frontend handles gracefully: disable external vendor option if no vendors available

### References

- [Source: docs/epics/epic-4-maintenance-operations.md#story-43-work-order-assignment-and-vendor-coordination]
- [Source: docs/prd.md#3.4-maintenance-management-module]
- [Source: docs/architecture.md#frontend-implementation-patterns]
- [Source: docs/architecture.md#email-service]
- [Source: docs/sprint-artifacts/epic-4/4-1-work-order-creation-and-management.md]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-4/4-3-work-order-assignment-and-vendor-coordination.context.xml

### Agent Model Used

<!-- Will be populated by dev agent -->

### Debug Log References

<!-- Will be populated during implementation -->

### Completion Notes List

<!-- Will be populated during implementation -->

### File List

<!-- Will be populated during implementation -->
