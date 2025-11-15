# Epic 4: Maintenance Operations

**Goal:** Implement straightforward maintenance management with work order creation, preventive maintenance scheduling, simple vendor assignment, and job completion tracking to ensure efficient property maintenance.

## Story 4.1: Work Order Creation and Management

As a property manager,
I want to create and manage work orders from multiple sources,
So that all maintenance needs are tracked and assigned efficiently.

**Acceptance Criteria:**

**Given** I am logged in as a property manager or maintenance supervisor
**When** I create a work order
**Then** the work order form includes:

**Basic Information:**
- Property and unit selection (dropdowns)
- Category (dropdown: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER)
- Priority (enum: HIGH, MEDIUM, LOW)
  - HIGH: Emergency repairs, safety issues
  - MEDIUM: Non-urgent repairs
  - LOW: General maintenance
- Title (required, max 100 chars)
- Description (required, max 1000 chars)
- Scheduled date (date picker)
- Access instructions (text, optional)
- Photo attachments (up to 5 photos, JPG/PNG, max 5MB each)

**And** work order entity is created:
- id (UUID), workOrderNumber (unique, format: WO-2025-0001)
- propertyId, unitId (foreign keys)
- category, priority, title, description
- status (enum: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED)
- requestedBy (userId - tenant or manager)
- assignedTo (vendorId or null)
- scheduledDate
- completedDate
- accessInstructions
- attachments (array of file paths)
- estimatedCost, actualCost (visible only to managers, not tenants)
- createdAt, updatedAt timestamps
- maintenanceRequestId (foreign key, if source is tenant request)

**And** work order list page displays:
- Filterable list: status, priority, category, property, date range
- Search by work order number, title, description
- Color-coded priority badges (red=high, yellow=medium, blue=low)
- Shows: number, property/unit, title, priority, status, scheduled date, assigned vendor
- Quick actions: View, Edit, Assign

**And** work order detail page shows:
- All work order information (except cost for tenants)
- Status history with timestamps
- Photo gallery
- Comments/notes section
- Assigned vendor details

**And** tenant view restrictions:
- Tenants can only view work orders they created
- Cost information (estimatedCost, actualCost) hidden from tenants
- Tenants see only: status, title, description, photos, completion notes

**And** API endpoints:
- POST /api/v1/work-orders: Create work order
- GET /api/v1/work-orders: List work orders with filters
- GET /api/v1/work-orders/{id}: Get work order details
- PUT /api/v1/work-orders/{id}: Update work order
- PATCH /api/v1/work-orders/{id}/status: Update status
- POST /api/v1/work-orders/{id}/assign: Assign to vendor
- POST /api/v1/work-orders/{id}/comments: Add comment
- DELETE /api/v1/work-orders/{id}: Cancel work order

**Prerequisites:** Story 3.1 (Property and Unit), Story 3.4 (Tenant maintenance requests)

**Technical Notes:**
- Work order numbers auto-increment with year prefix
- Implement role-based access control for cost visibility
- When returning work order details, check user role and exclude cost fields for TENANT role
- Add database indexes on propertyId, status, assignedTo, scheduledDate
- Frontend: Use shadcn/ui DataTable with server-side pagination
- Store attachments in /uploads/work-orders/{workOrderId}/
- Send email notifications on creation, assignment, and status changes
- Link tenant maintenance requests to work orders automatically

## Story 4.2: Preventive Maintenance Scheduling

As a property manager,
I want to set up recurring preventive maintenance schedules,
So that equipment is maintained proactively and failures are prevented.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I create a PM schedule
**Then** the PM schedule form includes:

**Schedule Information:**
- Schedule name (required, max 100 chars, e.g., "HVAC Quarterly Inspection")
- Property selection (dropdown, can be all properties or specific)
- Category (dropdown: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, etc.)
- Description (required, max 1000 chars, describe what needs to be done)
- Recurrence type (enum: MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY)
- Start date (date picker, when to start generating work orders)
- End date (optional, date picker, when to stop generating work orders)
- Default priority (HIGH, MEDIUM, LOW)
- Default assignee (vendor or staff member, optional)

**And** PM schedule entity created:
- id (UUID), scheduleName
- propertyId (or null for all properties)
- category, description
- recurrenceType
- startDate, endDate (optional)
- defaultPriority, defaultAssigneeId
- status (enum: ACTIVE, PAUSED, COMPLETED)
- nextGenerationDate (calculated)
- createdAt, updatedAt timestamps

**And** automated work order generation:
- Scheduled job runs daily at 2 AM
- Check all active PM schedules where nextGenerationDate <= today
- Generate work order automatically:
  - Type: PREVENTIVE
  - Link to PM schedule
  - Set scheduled date to due date
  - Assign to default assignee (if specified)
- Update nextGenerationDate based on recurrence
- Send notification to assigned person

**And** PM schedule list page shows:
- All active and paused schedules
- Filters: property, category, status, frequency
- Shows: schedule name, property, frequency, next due date, last generated
- Quick actions: View, Edit, Pause/Resume, Generate Now (manual trigger)

**And** PM history tracking:
- Each PM schedule has history of generated work orders
- View all work orders generated from this schedule
- Identify overdue PM tasks

**And** API endpoints:
- POST /api/v1/pm-schedules: Create PM schedule
- GET /api/v1/pm-schedules: List PM schedules with filters
- GET /api/v1/pm-schedules/{id}: Get PM schedule details
- PUT /api/v1/pm-schedules/{id}: Update PM schedule
- PATCH /api/v1/pm-schedules/{id}/status: Pause/resume schedule
- POST /api/v1/pm-schedules/{id}/generate-now: Manually trigger work order generation
- GET /api/v1/pm-schedules/{id}/history: Get work orders generated from this schedule
- DELETE /api/v1/pm-schedules/{id}: Soft delete schedule

**Prerequisites:** Story 4.1 (Work order system)

**Technical Notes:**
- Use Spring Scheduler (@Scheduled) for automated generation
- Calculate nextGenerationDate using simple recurrence rules
- Implement calendar view for PM schedules (monthly/yearly view)
- Send reminder emails 3 days before PM due date
- Add validation: end date must be after start date

## Story 4.3: Work Order Assignment and Vendor Coordination

As a maintenance supervisor,
I want to assign work orders to internal staff or external vendors,
So that jobs are distributed efficiently.

**Acceptance Criteria:**

**Given** a work order exists with status = OPEN
**When** I assign the work order
**Then** the assignment workflow executes:

**Manual Assignment:**
- Click "Assign" button on work order
- Select assignee type: Internal Staff or External Vendor
- If Internal Staff: dropdown of users with role = MAINTENANCE_SUPERVISOR
- If External Vendor: dropdown of active vendors filtered by service category
- Optional: Add assignment notes (e.g., "Urgent, complete by EOD")
- Confirm assignment

**And** assignment updates:
- Update work order status: OPEN → ASSIGNED
- Set assignedTo field (userId or vendorId)
- Set assignedDate timestamp
- Log assignment action in history
- Send notification to assignee:
  - Email with work order details
  - Include property address, unit number, issue description
  - Include photos and access instructions
  - Include scheduled date and time slot

**And** reassignment:
- Manager can reassign work order to different vendor/staff
- Previous assignee is notified of reassignment
- Assignment history tracks all assignments
- Reason for reassignment captured

**And** API endpoints:
- POST /api/v1/work-orders/{id}/assign: Assign work order
- POST /api/v1/work-orders/{id}/reassign: Reassign to different person
- GET /api/v1/work-orders/unassigned: List unassigned work orders

**Prerequisites:** Story 4.1 (Work orders), Story 5.1 (Vendor management)

**Technical Notes:**
- Log all assignment actions for dispute resolution
- Send email notifications to assigned vendor/staff
- Track assignment history in work_order_assignments table
- Frontend: Use shadcn/ui Select component for assignee dropdown

## Story 4.4: Job Progress Tracking and Completion

As a maintenance staff or vendor,
I want to update job progress and mark work as complete,
So that work completion is tracked.

**Acceptance Criteria:**

**Given** a work order is assigned to me
**When** I update the job progress
**Then** I can perform the following actions:

**Start Work:**
- Click "Start Work" button
- Status changes: ASSIGNED → IN_PROGRESS
- startedAt timestamp recorded
- Send notification to manager: "Work has started on WO-2025-0001"

**Update Progress:**
- Add progress notes (text field, max 500 chars)
- Upload photos (before photos when starting, during photos for updates)
- Update estimated completion date (if different from scheduled)

**Mark Complete:**
- Click "Mark as Complete" button
- Status changes: IN_PROGRESS → COMPLETED
- completedAt timestamp recorded
- Required fields:
  - Completion notes (describe what was done)
  - Upload after photos (before/after comparison)
  - Total hours spent (decimal, e.g., 2.5 hours)
  - Total cost (decimal, includes labor and materials)
- Optional fields:
  - Recommendations (e.g., "Replace unit in 6 months")
  - Follow-up required (checkbox + description)

**And** photo management:
- Before photos (taken when starting)
- After photos (upon completion)
- Photo gallery with timestamps
- Compare before/after side-by-side

**And** API endpoints:
- PATCH /api/v1/work-orders/{id}/start: Start work
- POST /api/v1/work-orders/{id}/progress: Add progress update
- PATCH /api/v1/work-orders/{id}/complete: Mark as complete
- GET /api/v1/work-orders/{id}/timeline: Get progress timeline

**And** mobile-friendly interface:
- Touch-optimized buttons for quick updates
- Camera integration for photo capture

**Prerequisites:** Story 4.3 (Work order assignment)

**Technical Notes:**
- Store simple time and cost fields directly on work_order table
- Implement photo compression before upload (max 1MB per photo)
- Send email notifications on status changes
- Frontend: Use shadcn/ui Form components with file upload

---

## E2E Testing Stories

**Note:** The following E2E test stories should be implemented AFTER all technical implementation stories (4.1-4.4) are completed. Each E2E story corresponds to its technical story and contains comprehensive end-to-end tests covering all user flows.

## Story 4.1.e2e: E2E Tests for Work Order Creation and Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for work order creation and management,
So that I can ensure work orders function correctly across all user roles.

**Acceptance Criteria:**

**Given** Story 4.1 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Work Order Creation Flow:**
- Create work order as property manager → verify all fields captured
- Select property and unit → verify dropdowns populated correctly
- Select category (PLUMBING, ELECTRICAL, etc.) → verify saved
- Set priority (HIGH, MEDIUM, LOW) → verify color-coded badge
- Enter title and description → verify required validation
- Set scheduled date → verify date picker works
- Add access instructions → verify optional field
- Upload 5 photos → verify all uploaded and displayed
- Submit form → verify work order number generated (WO-2025-XXXX)

**Work Order List Page:**
- View all work orders → verify list displays
- Filter by status (OPEN, ASSIGNED, IN_PROGRESS, COMPLETED) → verify filtered results
- Filter by priority → verify high priority shown first
- Filter by category → verify category filter works
- Filter by property → verify property-specific work orders
- Filter by date range → verify date filtering
- Search by work order number → verify search works
- Search by title/description → verify text search
- Sort by scheduled date → verify sorting

**Work Order Detail Page:**
- View work order details → verify all information displayed
- View status history → verify timeline with timestamps
- View photo gallery → verify all photos shown
- View comments section → verify comments displayed
- View assigned vendor details → verify vendor info shown

**Role-Based Access Control:**
- Login as property manager → verify can see estimatedCost and actualCost
- Login as tenant → verify cost fields hidden
- Login as tenant → verify can only see own work orders
- Login as maintenance supervisor → verify can see all work orders

**Work Order Updates:**
- Edit work order (status = OPEN) → verify updates saved
- Update status manually → verify status change reflected
- Add comment to work order → verify comment appears in timeline
- Cancel work order → verify soft delete (status updated)

**Validation and Error Handling:**
- Create work order without title → verify error
- Create work order without description → verify error
- Upload file > 5MB → verify size error
- Upload non-image file → verify type error
- Upload more than 5 photos → verify max limit error

**Prerequisites:** Story 4.1 (status: done)

**Technical Notes:**
- Use Playwright with TypeScript
- Verify all data-testid attributes per conventions
- Test role-based visibility of cost fields
- Test work order number auto-generation
- Verify email notifications sent (mock email service)
- Clean up test work orders after tests
- Use test fixtures for properties, units, users

## Story 4.2.e2e: E2E Tests for Preventive Maintenance Scheduling

As a QA engineer / developer,
I want comprehensive end-to-end tests for PM scheduling,
So that I can ensure automated work order generation works correctly.

**Acceptance Criteria:**

**Given** Story 4.2 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**PM Schedule Creation:**
- Create PM schedule with all fields → verify schedule created
- Enter schedule name: "HVAC Quarterly Inspection" → verify saved
- Select property (specific property) → verify property assigned
- Select category: HVAC → verify category saved
- Enter description → verify saved
- Select recurrence: QUARTERLY → verify saved
- Set start date: tomorrow → verify date set
- Set end date: 1 year from now → verify optional field
- Set default priority: MEDIUM → verify saved
- Assign default vendor → verify vendor assigned
- Submit form → verify nextGenerationDate calculated correctly

**PM Schedule List Page:**
- View all PM schedules → verify list displays
- Filter by property → verify property filter
- Filter by category → verify category filter
- Filter by status (ACTIVE, PAUSED) → verify status filter
- Filter by frequency (MONTHLY, QUARTERLY, etc.) → verify frequency filter
- View next due date → verify date displayed
- View last generated → verify timestamp shown

**PM Schedule Management:**
- Pause active schedule → verify status = PAUSED
- Resume paused schedule → verify status = ACTIVE
- Edit PM schedule → verify updates saved
- Delete PM schedule → verify soft delete

**Manual Work Order Generation:**
- Click "Generate Now" button → verify work order created immediately
- Verify work order type = PREVENTIVE
- Verify work order linked to PM schedule
- Verify assigned to default assignee
- Verify notification sent to assignee

**Automated Work Order Generation (Scheduled Job):**
- Create PM schedule with nextGenerationDate = today
- Trigger scheduled job manually (test endpoint)
- Verify work order auto-generated
- Verify nextGenerationDate updated based on recurrence:
  - MONTHLY: +1 month
  - QUARTERLY: +3 months
  - SEMI_ANNUALLY: +6 months
  - ANNUALLY: +12 months
- Verify notification sent

**PM History Tracking:**
- View PM schedule history → verify all generated work orders listed
- Verify work orders sorted by date
- Identify overdue PM tasks → verify overdue indicator shown

**Recurrence Calculation Testing:**
- Create MONTHLY schedule starting Jan 1 → verify next date = Feb 1
- Create QUARTERLY schedule starting Jan 1 → verify next date = Apr 1
- Create SEMI_ANNUALLY schedule → verify next date = +6 months
- Create ANNUALLY schedule → verify next date = +1 year

**Validation and Error Handling:**
- Create schedule with end date < start date → verify validation error
- Create schedule without schedule name → verify required field error
- Create schedule without description → verify required field error
- Pause already paused schedule → verify no error (idempotent)

**Prerequisites:** Story 4.2 (status: done), Story 4.1 (for work orders)

**Technical Notes:**
- Test scheduled job execution (use test trigger endpoint)
- Verify date calculations for all recurrence types
- Test time zone handling (UAE timezone)
- Verify email notifications for generated work orders
- Clean up generated test work orders
- Use test fixtures for properties and vendors

## Story 4.3.e2e: E2E Tests for Work Order Assignment

As a QA engineer / developer,
I want comprehensive end-to-end tests for work order assignment,
So that I can ensure assignment workflow functions correctly.

**Acceptance Criteria:**

**Given** Story 4.3 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Manual Assignment Flow:**
- View unassigned work orders (status = OPEN)
- Click "Assign" button on work order
- Select assignee type: Internal Staff
- View dropdown of MAINTENANCE_SUPERVISOR users → verify populated
- Select staff member
- Add assignment notes: "Urgent, complete by EOD"
- Confirm assignment
- Verify work order status changed: OPEN → ASSIGNED
- Verify assignedTo field updated
- Verify assignedDate timestamp set
- Verify assignment logged in history
- Verify notification email sent to assignee

**External Vendor Assignment:**
- Click "Assign" on work order with category = PLUMBING
- Select assignee type: External Vendor
- View dropdown of vendors filtered by service category → verify only plumbing vendors shown
- Select vendor
- Confirm assignment
- Verify status = ASSIGNED
- Verify vendor assigned

**Reassignment Flow:**
- Assign work order to Vendor A
- Reassign to Vendor B
- Enter reassignment reason: "Vendor A unavailable"
- Confirm reassignment
- Verify previous assignee (Vendor A) notified
- Verify new assignee (Vendor B) notified
- Verify assignment history shows both assignments with timestamps
- Verify reason captured in history

**Unassigned Work Orders View:**
- Navigate to /work-orders/unassigned
- Verify only OPEN status work orders shown
- Verify count displayed correctly
- Quick assign from list → verify assignment works

**Assignment History:**
- View work order detail page
- View assignment history section
- Verify all assignments listed chronologically
- Verify assignee names, dates, reasons shown

**Notification Testing:**
- Assign work order to vendor
- Verify email contains:
  - Work order number
  - Property address and unit number
  - Issue description
  - Photos attached or linked
  - Access instructions
  - Scheduled date and time slot

**Validation and Error Handling:**
- Attempt to assign already assigned work order → verify error or confirmation dialog
- Reassign without reason → verify reason required
- Assign to inactive vendor → verify validation error

**Prerequisites:** Story 4.3 (status: done), Story 5.1 (Vendor management)

**Technical Notes:**
- Test with multiple user roles (manager, supervisor)
- Verify vendor filtering by service category
- Test email notification content and format
- Verify assignment history persistence
- Clean up test assignments
- Use test fixtures for vendors and staff

## Story 4.4.e2e: E2E Tests for Job Progress Tracking and Completion

As a QA engineer / developer,
I want comprehensive end-to-end tests for job progress and completion,
So that I can ensure work order lifecycle is tracked correctly.

**Acceptance Criteria:**

**Given** Story 4.4 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Start Work Flow:**
- Login as assigned vendor/staff
- View assigned work orders
- Click "Start Work" button on work order
- Verify status changed: ASSIGNED → IN_PROGRESS
- Verify startedAt timestamp recorded
- Verify notification sent to property manager
- Upload before photos → verify photos uploaded

**Progress Update Flow:**
- Add progress note: "Identified issue, ordering parts"
- Upload progress photo → verify photo added to gallery
- Update estimated completion date → verify date updated
- Submit progress update → verify saved
- Verify progress note appears in timeline

**Mark Complete Flow:**
- Click "Mark as Complete" button
- Fill required fields:
  - Completion notes: "Replaced faulty valve, tested system"
  - Upload after photos (2 photos) → verify uploaded
  - Total hours spent: 2.5 hours → verify decimal accepted
  - Total cost: 150.00 → verify amount saved
- Fill optional fields:
  - Recommendations: "Monitor pressure weekly"
  - Follow-up required: checked + "Inspect in 1 month"
- Submit completion form
- Verify status changed: IN_PROGRESS → COMPLETED
- Verify completedAt timestamp recorded
- Verify notification sent to manager and tenant

**Photo Management:**
- View before photos → verify displayed with "Before" label
- View after photos → verify displayed with "After" label
- Compare before/after side-by-side → verify comparison view
- Verify photo timestamps shown
- Verify all photos in gallery chronologically ordered

**Progress Timeline:**
- View work order timeline
- Verify all events displayed:
  - Created at {timestamp}
  - Assigned to {vendor} at {timestamp}
  - Started at {timestamp}
  - Progress update at {timestamp}: "Ordering parts"
  - Completed at {timestamp}
- Verify timeline sorted chronologically

**Mobile-Friendly Interface:**
- Test on mobile viewport (375px)
- Verify touch-optimized buttons (≥ 44x44px)
- Test camera integration for photo capture
- Verify form inputs optimized for mobile
- Verify file upload works on mobile

**Photo Compression:**
- Upload 5MB photo → verify compressed to ~1MB before upload
- Upload multiple large photos → verify all compressed
- Verify compression doesn't degrade quality excessively

**Cost Visibility:**
- Login as property manager → verify can see totalCost field
- Login as tenant → verify cost field hidden
- Verify cost only shown to authorized roles

**Validation and Error Handling:**
- Mark complete without completion notes → verify required field error
- Mark complete without after photos → verify required field error
- Mark complete without hours spent → verify required field error
- Mark complete without total cost → verify required field error
- Enter negative hours → verify validation error
- Enter negative cost → verify validation error

**Follow-up Tracking:**
- Mark complete with follow-up required → verify checkbox saved
- Enter follow-up description → verify text saved
- View work order detail → verify follow-up note displayed prominently

**Prerequisites:** Story 4.4 (status: done), Story 4.3 (for assignment)

**Technical Notes:**
- Test with vendor/staff credentials
- Verify photo compression before upload
- Test camera integration (may need to mock on headless)
- Verify before/after photo comparison UI
- Test mobile responsiveness thoroughly
- Verify email notifications sent at each status change
- Clean up test photos and work orders
- Use test fixtures for assigned work orders

---
