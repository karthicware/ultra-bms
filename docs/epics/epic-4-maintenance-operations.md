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
