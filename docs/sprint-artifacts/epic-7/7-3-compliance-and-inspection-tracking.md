# Story 7.3: Compliance and Inspection Tracking

Status: drafted

## Story

As a property manager,
I want to track regulatory compliance and inspections,
So that all properties meet legal requirements and avoid violations.

## Acceptance Criteria

1. **AC1 - ComplianceRequirement Entity:** Create ComplianceRequirement JPA entity with fields: id (UUID), requirementNumber (unique, format: CMP-YYYY-NNNN), requirementName (String, required, max 200 chars), category (enum: SAFETY, FIRE, ELECTRICAL, PLUMBING, STRUCTURAL, ENVIRONMENTAL, LICENSING, OTHER), description (String, max 1000 chars), applicableProperties (JSON array of propertyIds, null = all properties), frequency (enum: ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY, BIANNUALLY), authorityAgency (String, max 200 chars), penaltyDescription (String, max 500 chars), status (enum: ACTIVE, INACTIVE), createdAt, updatedAt timestamps. Add indexes on requirementNumber, category, status. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

2. **AC2 - ComplianceCategory Enum:** Create ComplianceCategory enum with values: SAFETY, FIRE, ELECTRICAL, PLUMBING, STRUCTURAL, ENVIRONMENTAL, LICENSING, OTHER. Each value should have a display name. Use consistent enum pattern from existing codebase. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

3. **AC3 - ComplianceFrequency Enum:** Create ComplianceFrequency enum with values: ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY, BIANNUALLY. Each value should have a display name and months interval (e.g., QUARTERLY = 3, ANNUALLY = 12). [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

4. **AC4 - ComplianceSchedule Entity:** Create ComplianceSchedule JPA entity with fields: id (UUID), complianceRequirementId (UUID foreign key), propertyId (UUID foreign key), dueDate (LocalDate), status (enum: UPCOMING, DUE, COMPLETED, OVERDUE, EXEMPT), completedDate (LocalDate, nullable), completedBy (UUID foreign key to users, nullable), notes (String, max 1000 chars, nullable), certificateFilePath (String, S3 path, nullable), createdAt, updatedAt timestamps. Add indexes on propertyId, dueDate, status. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

5. **AC5 - ComplianceScheduleStatus Enum:** Create ComplianceScheduleStatus enum with values: UPCOMING (due > 30 days), DUE (due within 30 days), COMPLETED, OVERDUE (past due), EXEMPT. Each value should have a display name and color code. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

6. **AC6 - Inspection Entity:** Create Inspection JPA entity with fields: id (UUID), complianceScheduleId (UUID foreign key), propertyId (UUID foreign key), inspectorName (String, max 200 chars), scheduledDate (LocalDate), inspectionDate (LocalDate, nullable), status (enum: SCHEDULED, IN_PROGRESS, PASSED, FAILED, CANCELLED), result (enum: PASSED, FAILED, PARTIAL_PASS, nullable), issuesFound (String, max 1000 chars, nullable), recommendations (String, max 1000 chars, nullable), certificatePath (String, S3 path, nullable), nextInspectionDate (LocalDate, nullable), remediationWorkOrderId (UUID foreign key, nullable), createdAt, updatedAt timestamps. Add indexes on propertyId, scheduledDate, status. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

7. **AC7 - InspectionStatus Enum:** Create InspectionStatus enum with values: SCHEDULED, IN_PROGRESS, PASSED, FAILED, CANCELLED. Each value should have a display name and color code. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

8. **AC8 - InspectionResult Enum:** Create InspectionResult enum with values: PASSED, FAILED, PARTIAL_PASS. Each value should have a display name and color code. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

9. **AC9 - Violation Entity:** Create Violation JPA entity with fields: id (UUID), violationNumber (unique, format: VIO-YYYY-NNNN), complianceScheduleId (UUID foreign key), violationDate (LocalDate), description (String, max 1000 chars), fineAmount (BigDecimal, nullable), fineStatus (enum: PENDING, PAID, APPEALED, WAIVED), remediationWorkOrderId (UUID foreign key, nullable), resolutionDate (LocalDate, nullable), createdAt, updatedAt timestamps. Add indexes on complianceScheduleId, violationDate, fineStatus. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

10. **AC10 - FineStatus Enum:** Create FineStatus enum with values: PENDING, PAID, APPEALED, WAIVED. Each value should have a display name and color code. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

11. **AC11 - Requirement Number Generation:** Implement unique requirement number format: CMP-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Handle concurrent generation with database sequence. Example: CMP-2025-0001. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

12. **AC12 - Violation Number Generation:** Implement unique violation number format: VIO-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Handle concurrent generation with database sequence. Example: VIO-2025-0001. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

13. **AC13 - Create Compliance Requirement Endpoint:** POST /api/v1/compliance-requirements endpoint. Request: requirementName (required), category (required), description, applicableProperties (array of propertyIds or null for all), frequency (required), authorityAgency, penaltyDescription, status (default ACTIVE). Auto-generate requirementNumber. Auto-generate compliance schedules for applicable properties based on frequency. Return created requirement with schedule count. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

14. **AC14 - List Compliance Requirements Endpoint:** GET /api/v1/compliance-requirements endpoint with query params: category (filter), status (filter), search (matches requirementName, authorityAgency), page, size, sort. Return paginated list with applicable property count and next due date. Default sort by requirementName ASC. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

15. **AC15 - Get Compliance Requirement Details Endpoint:** GET /api/v1/compliance-requirements/{id} endpoint. Return full requirement details including: applicable properties list (names), schedule count, upcoming schedules (next 3), overdue count. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

16. **AC16 - Update Compliance Requirement Endpoint:** PUT /api/v1/compliance-requirements/{id} endpoint. Allow updating: requirementName, category, description, applicableProperties, frequency, authorityAgency, penaltyDescription, status. If frequency changes, recalculate upcoming schedule due dates. Require PROPERTY_MANAGER or SUPER_ADMIN role. Return updated requirement. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

17. **AC17 - List Compliance Schedules Endpoint:** GET /api/v1/compliance-schedules endpoint with query params: propertyId (filter), requirementId (filter), category (filter), status (filter: UPCOMING/DUE/COMPLETED/OVERDUE/EXEMPT), dueDateRange (date range filter), page, size, sort. Return paginated list with requirement name, property name, status badge color. Default sort by dueDate ASC. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

18. **AC18 - Mark Schedule Complete Endpoint:** PATCH /api/v1/compliance-schedules/{id}/complete endpoint. Request: completedDate (required), notes (optional), certificateFile (optional, file upload). Update status to COMPLETED. If recurring: auto-generate next schedule based on frequency. Return updated schedule with next schedule info. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

19. **AC19 - Schedule Inspection Endpoint:** POST /api/v1/inspections endpoint. Request: complianceScheduleId (required), propertyId (required), inspectorName (required), scheduledDate (required). Status defaults to SCHEDULED. Link to compliance schedule. Return created inspection. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

20. **AC20 - Update Inspection Results Endpoint:** PUT /api/v1/inspections/{id} endpoint. Request: inspectionDate, status, result (PASSED/FAILED/PARTIAL_PASS), issuesFound, recommendations, certificateFile (optional upload), nextInspectionDate. If PASSED: mark linked schedule as COMPLETED, upload certificate to S3. If FAILED: create remediation work order (link to maintenance), mark schedule as OVERDUE. Return updated inspection. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

21. **AC21 - Create Violation Endpoint:** POST /api/v1/violations endpoint. Request: complianceScheduleId (required), violationDate (required), description (required), fineAmount (optional), fineStatus (default PENDING). Auto-generate violationNumber. Optionally create remediation work order. Return created violation. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

22. **AC22 - Update Violation Endpoint:** PUT /api/v1/violations/{id} endpoint. Allow updating: description, fineAmount, fineStatus, resolutionDate, remediationWorkOrderId. Track fine status changes. Return updated violation. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

23. **AC23 - Compliance Dashboard Endpoint:** GET /api/v1/compliance/dashboard endpoint. Return: upcomingInspections (count in next 30 days), overdueComplianceItems (count), recentViolations (last 30 days count + list of last 5), complianceRatePercentage (completed / total schedules), inspectionsByStatus (grouped counts), schedulesByCategory (grouped counts). [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

24. **AC24 - Property Compliance History Endpoint:** GET /api/v1/properties/{id}/compliance-history endpoint. Return all compliance schedules for property ordered by dueDate DESC. Include requirement name, status, completion info, linked inspections, violations. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

25. **AC25 - Compliance Status Update Job:** Create scheduled job (ComplianceStatusUpdateJob) running daily at 6 AM. Update status for all schedules: DUE (due within 30 days), OVERDUE (past due date). Do not change COMPLETED or EXEMPT. Log status transitions. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

26. **AC26 - Compliance Reminder Notification Job:** Create scheduled job (ComplianceReminderNotificationJob) running daily at 8 AM. Find schedules with dueDate within 30 days. Group by property manager. Send email notification listing upcoming compliance items. Template: compliance-reminder-notification.html. Use @Async for non-blocking. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

27. **AC27 - Auto-Generate Next Schedule:** When compliance schedule marked COMPLETED for recurring requirement: calculate next due date based on frequency (MONTHLY = +1 month, QUARTERLY = +3 months, etc.). Create new ComplianceSchedule with status UPCOMING. Do not generate for ONE_TIME requirements. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

28. **AC28 - Remediation Work Order Integration:** When inspection FAILED: create work order via WorkOrderService. Set category based on compliance category. Set priority HIGH. Link work order ID to inspection and violation. Add note referencing compliance requirement. [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

29. **AC29 - Compliance Dashboard Page:** Create page at /compliance displaying: KPI cards (Upcoming Inspections, Overdue Items, Recent Violations, Compliance Rate %), Compliance Calendar view (FullCalendar or similar) showing scheduled inspections, Recent violations table (last 5 with view link), Quick actions (Add Requirement, Schedule Inspection). Page has data-testid="page-compliance-dashboard". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

30. **AC30 - Compliance Requirements List Page:** Create page at /compliance/requirements displaying DataTable with columns: Requirement Number, Name, Category (badge), Frequency, Authority/Agency, Status (badge), Properties Count, Actions. Filters: category dropdown, status dropdown, search. Sort by requirementNumber, requirementName. Pagination: 20 per page. Quick actions: View, Edit, Delete. Page has data-testid="page-compliance-requirements". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

31. **AC31 - Compliance Schedules List Page:** Create page at /compliance/schedules displaying DataTable with columns: Requirement Name, Property, Category (badge), Due Date, Status (color-coded badge), Last Completed, Actions. Filters: property dropdown, category dropdown, status dropdown, date range picker. Sort by dueDate. Pagination: 20 per page. Quick actions: Mark Complete, Schedule Inspection, Upload Certificate, View History. Page has data-testid="page-compliance-schedules". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

32. **AC32 - Requirement Detail Page:** Create page at /compliance/requirements/{id} showing: Requirement header (number, name, status badge), Details section (category, frequency, authority, penalty description), Applicable Properties section (list or "All Properties"), Schedules section (upcoming, due, overdue grouped), Violations section (linked violations). Action buttons (Edit, Deactivate). Page has data-testid="page-compliance-requirement-detail". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

33. **AC33 - Compliance Requirement Form:** Create form for add/edit requirement at /compliance/requirements/new and /compliance/requirements/{id}/edit. Fields: Requirement Name (required, max 200 chars), Category select (required), Description textarea (max 1000 chars), Applicable Properties multi-select (or "All Properties" checkbox), Frequency select (required), Authority/Agency input (max 200 chars), Penalty Description textarea (max 500 chars), Status select (ACTIVE/INACTIVE). Form has data-testid="form-compliance-requirement". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

34. **AC34 - Mark Complete Dialog:** Create dialog component for marking schedule complete. Fields: Completed Date picker (required, default today), Notes textarea (optional), Certificate upload (optional, PDF). On submit: call complete endpoint, close dialog, refresh list. Dialog has data-testid="dialog-mark-complete". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

35. **AC35 - Schedule Inspection Dialog:** Create dialog component for scheduling inspection. Fields: Inspector Name input (required, max 200 chars), Scheduled Date picker (required). Pre-populated: complianceScheduleId, propertyId from context. On submit: create inspection, close dialog, refresh. Dialog has data-testid="dialog-schedule-inspection". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

36. **AC36 - Inspection Results Form:** Create form at /compliance/inspections/{id}/results. Fields: Inspection Date (required), Status select (IN_PROGRESS/PASSED/FAILED/CANCELLED), Result select (if completed: PASSED/FAILED/PARTIAL_PASS), Issues Found textarea (if failed/partial), Recommendations textarea, Certificate upload (if passed, PDF), Next Inspection Date (if recurring). Form has data-testid="form-inspection-results". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

37. **AC37 - Violations List Page:** Create page at /compliance/violations displaying DataTable with columns: Violation Number, Property (from schedule), Requirement Name, Violation Date, Description (truncated), Fine Amount, Fine Status (badge), Actions. Filters: fineStatus dropdown, date range. Sort by violationDate DESC. Quick actions: View, Edit Fine Status. Page has data-testid="page-compliance-violations". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

38. **AC38 - Record Violation Dialog:** Create dialog component for recording violations. Fields: Violation Date picker (required), Description textarea (required, max 1000 chars), Fine Amount input (optional, currency), Create Remediation Work Order checkbox. Pre-populated: complianceScheduleId. On submit: create violation, optionally create work order. Dialog has data-testid="dialog-record-violation". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

39. **AC39 - Compliance Calendar Component:** Create calendar component showing all scheduled inspections and due items. Color-coded by status: green (completed), yellow (upcoming), red (overdue), blue (scheduled inspection). Click event opens detail modal. Use FullCalendar or react-big-calendar library. Component has data-testid="component-compliance-calendar". [Source: docs/epics/epic-7-asset-compliance-management.md#story-73]

40. **AC40 - Compliance TypeScript Types:** Create types/compliance.ts with interfaces: ComplianceRequirement, ComplianceSchedule, Inspection, Violation, ComplianceDashboard. Enums: ComplianceCategory, ComplianceFrequency, ComplianceScheduleStatus, InspectionStatus, InspectionResult, FineStatus. Export from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

41. **AC41 - Compliance Zod Validation Schemas:** Create lib/validations/compliance.ts with schemas: complianceRequirementSchema, complianceScheduleCompleteSchema, inspectionCreateSchema, inspectionResultsSchema, violationCreateSchema. Validate required fields, max lengths, date constraints. [Source: docs/architecture.md#form-pattern]

42. **AC42 - Compliance Frontend Service:** Create services/compliance.service.ts with methods: getRequirements(filters), getRequirement(id), createRequirement(data), updateRequirement(id, data), deleteRequirement(id), getSchedules(filters), completeSchedule(id, data), createInspection(data), updateInspection(id, data), getViolations(filters), createViolation(data), updateViolation(id, data), getDashboard(), getPropertyComplianceHistory(propertyId). Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

43. **AC43 - Compliance React Query Hooks:** Create hooks/useCompliance.ts with: useComplianceRequirements(filters) query, useComplianceRequirement(id) query, useComplianceSchedules(filters) query, useInspections(filters) query, useViolations(filters) query, useComplianceDashboard() query, usePropertyComplianceHistory(propertyId) query, plus mutations for create/update operations. Cache keys: ['compliance-requirements'], ['compliance-schedules'], ['inspections'], ['violations'], ['compliance-dashboard']. [Source: docs/architecture.md#custom-hook-pattern]

44. **AC44 - Compliance Repositories:** Create ComplianceRequirementRepository, ComplianceScheduleRepository, InspectionRepository, ViolationRepository. Add custom queries: findByPropertyIdOrderByDueDateDesc, findByStatusAndDueDateBetween, findOverdueSchedules, findByComplianceRequirementId, countByPropertyIdAndStatus. [Source: docs/architecture.md#repository-pattern]

45. **AC45 - Compliance Service Layer:** Create ComplianceRequirementService, ComplianceScheduleService, InspectionService, ViolationService. Services handle: number generation, schedule auto-generation, status transitions, work order creation for failed inspections, next schedule calculation. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

46. **AC46 - Compliance Controllers:** Create ComplianceRequirementController, ComplianceScheduleController, InspectionController, ViolationController with REST endpoints as defined in ACs. All endpoints require authentication. Apply @PreAuthorize for role-based access. Follow existing controller patterns. [Source: docs/architecture.md#controller-pattern]

47. **AC47 - Compliance DTOs:** Create DTOs for each entity: request and response DTOs, list DTOs with summaries, dashboard DTO. Create mappers using MapStruct. Handle JSON array for applicableProperties field. [Source: docs/architecture.md#dto-pattern]

48. **AC48 - Database Migrations:** Create Flyway migrations: V{X}__create_compliance_requirements_table.sql, V{X+1}__create_compliance_schedules_table.sql, V{X+2}__create_inspections_table.sql, V{X+3}__create_violations_table.sql. Use snake_case naming. Create enum types. Add foreign keys to properties, users, work_orders. Determine next version from existing migrations. [Source: docs/architecture.md#database-naming]

49. **AC49 - Compliance Email Templates:** Create compliance-reminder-notification.html template. Include: company header, list of upcoming compliance items grouped by property (requirement name, due date, days until due), call to action. Style consistently with existing email templates. [Source: docs/architecture.md#email-templates]

50. **AC50 - Backend Unit Tests:** Write comprehensive tests: ComplianceRequirementServiceTest (create, update, schedule auto-generation), ComplianceScheduleServiceTest (status transitions, completion with next schedule), InspectionServiceTest (results with work order creation), ViolationServiceTest. Test scheduler jobs. Mock S3 and work order services. Achieve >= 80% code coverage for new code. [Source: docs/architecture.md#testing-backend]

51. **AC51 - Frontend Unit Tests:** Write tests using React Testing Library: Compliance dashboard rendering, Requirements list filtering, Schedule status badge colors, Mark complete dialog, Inspection results form validation, Calendar component event rendering. Test all data-testid elements accessible. [Source: docs/architecture.md#testing-frontend]

52. **AC52 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

53. **AC53 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]

## Component Mapping

### shadcn/ui Components to Use

**Compliance Dashboard Page:**
- card (KPI cards, section containers)
- badge (status badges)
- button (action buttons)
- table (violations list)
- calendar integration (FullCalendar or similar)

**Requirements List Page:**
- table (requirements list with sorting/pagination)
- badge (category, status badges)
- button (actions: view, edit, delete)
- dropdown-menu (quick actions menu)
- input (search field)
- select (category, status filters)
- pagination (for list navigation)

**Schedules List Page:**
- table (schedules list)
- badge (status with color coding)
- button (actions)
- dropdown-menu (quick actions)
- select (property, category, status filters)
- popover + calendar (date range picker)
- pagination

**Forms and Dialogs:**
- form (React Hook Form integration)
- input (text fields)
- textarea (description fields)
- select (dropdowns)
- checkbox ("All Properties" option)
- popover + calendar (date pickers)
- dialog (mark complete, schedule inspection, record violation)
- button (submit, cancel)
- label (form field labels)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert (validation errors)
- alert-dialog (confirm delete/deactivate)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add table badge button dropdown-menu input select popover calendar pagination card dialog form label textarea checkbox alert alert-dialog sonner tabs
```

### Additional Dependencies

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.263.1",
    "zod": "^3.0.0",
    "@fullcalendar/react": "^6.0.0",
    "@fullcalendar/daygrid": "^6.0.0",
    "@fullcalendar/interaction": "^6.0.0"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Create Compliance TypeScript Types** (AC: #40)
  - [ ] Create types/compliance.ts
  - [ ] Define ComplianceCategory enum (SAFETY, FIRE, ELECTRICAL, etc.)
  - [ ] Define ComplianceFrequency enum (ONE_TIME, MONTHLY, QUARTERLY, etc.)
  - [ ] Define ComplianceScheduleStatus enum (UPCOMING, DUE, COMPLETED, OVERDUE, EXEMPT)
  - [ ] Define InspectionStatus enum (SCHEDULED, IN_PROGRESS, PASSED, FAILED, CANCELLED)
  - [ ] Define InspectionResult enum (PASSED, FAILED, PARTIAL_PASS)
  - [ ] Define FineStatus enum (PENDING, PAID, APPEALED, WAIVED)
  - [ ] Create ComplianceRequirement interface (all entity fields)
  - [ ] Create ComplianceSchedule interface
  - [ ] Create Inspection interface
  - [ ] Create Violation interface
  - [ ] Create ComplianceDashboard interface
  - [ ] Export from types/index.ts

- [ ] **Task 2: Create Compliance Zod Validation Schemas** (AC: #41)
  - [ ] Create lib/validations/compliance.ts
  - [ ] Implement complianceRequirementSchema (requirementName, category, frequency required)
  - [ ] Implement complianceScheduleCompleteSchema (completedDate required, notes optional)
  - [ ] Implement inspectionCreateSchema (complianceScheduleId, propertyId, inspectorName, scheduledDate required)
  - [ ] Implement inspectionResultsSchema (inspectionDate, status, result required when completed)
  - [ ] Implement violationCreateSchema (complianceScheduleId, violationDate, description required)
  - [ ] Add max length validations per AC definitions
  - [ ] Export validation schemas

- [ ] **Task 3: Create Compliance Frontend Service** (AC: #42)
  - [ ] Create services/compliance.service.ts
  - [ ] Implement getRequirements(filters) with query params
  - [ ] Implement getRequirement(id) for single requirement with details
  - [ ] Implement createRequirement(data)
  - [ ] Implement updateRequirement(id, data)
  - [ ] Implement deleteRequirement(id)
  - [ ] Implement getSchedules(filters) with query params
  - [ ] Implement completeSchedule(id, data) with file upload
  - [ ] Implement createInspection(data)
  - [ ] Implement updateInspection(id, data) with file upload
  - [ ] Implement getViolations(filters)
  - [ ] Implement createViolation(data)
  - [ ] Implement updateViolation(id, data)
  - [ ] Implement getDashboard()
  - [ ] Implement getPropertyComplianceHistory(propertyId)

- [ ] **Task 4: Create Compliance React Query Hooks** (AC: #43)
  - [ ] Create hooks/useCompliance.ts
  - [ ] Implement useComplianceRequirements(filters) query hook
  - [ ] Implement useComplianceRequirement(id) query hook
  - [ ] Implement useComplianceSchedules(filters) query hook
  - [ ] Implement useInspections(filters) query hook
  - [ ] Implement useViolations(filters) query hook
  - [ ] Implement useComplianceDashboard() query hook
  - [ ] Implement usePropertyComplianceHistory(propertyId) query hook
  - [ ] Implement useCreateRequirement() mutation
  - [ ] Implement useUpdateRequirement() mutation
  - [ ] Implement useCompleteSchedule() mutation
  - [ ] Implement useCreateInspection() mutation
  - [ ] Implement useUpdateInspection() mutation
  - [ ] Implement useCreateViolation() mutation
  - [ ] Implement useUpdateViolation() mutation
  - [ ] Add cache invalidation on mutations

- [ ] **Task 5: Create Compliance Entities and Enums (Backend)** (AC: #1, #2, #3, #5, #7, #8, #10)
  - [ ] Create ComplianceCategory enum with display names
  - [ ] Create ComplianceFrequency enum with display names and months interval
  - [ ] Create ComplianceScheduleStatus enum with display names and colors
  - [ ] Create InspectionStatus enum with display names and colors
  - [ ] Create InspectionResult enum with display names and colors
  - [ ] Create FineStatus enum with display names and colors
  - [ ] Create ComplianceRequirement JPA entity with all fields
  - [ ] Add @Column for JSON applicableProperties field
  - [ ] Add validation annotations (@NotNull, @NotBlank, @Size)
  - [ ] Add audit fields (createdAt, updatedAt)

- [ ] **Task 6: Create ComplianceSchedule Entity** (AC: #4)
  - [ ] Create ComplianceSchedule JPA entity
  - [ ] Add @ManyToOne relationship to ComplianceRequirement
  - [ ] Add @ManyToOne relationship to Property
  - [ ] Add @ManyToOne relationship to User (completedBy)
  - [ ] Add fields: dueDate, status, completedDate, notes, certificateFilePath
  - [ ] Add audit fields (createdAt, updatedAt)

- [ ] **Task 7: Create Inspection Entity** (AC: #6)
  - [ ] Create Inspection JPA entity
  - [ ] Add @ManyToOne relationship to ComplianceSchedule
  - [ ] Add @ManyToOne relationship to Property
  - [ ] Add @ManyToOne relationship to WorkOrder (remediationWorkOrderId)
  - [ ] Add fields: inspectorName, scheduledDate, inspectionDate, status, result
  - [ ] Add fields: issuesFound, recommendations, certificatePath, nextInspectionDate
  - [ ] Add audit fields (createdAt, updatedAt)

- [ ] **Task 8: Create Violation Entity** (AC: #9)
  - [ ] Create Violation JPA entity
  - [ ] Add @ManyToOne relationship to ComplianceSchedule
  - [ ] Add @ManyToOne relationship to WorkOrder (remediationWorkOrderId)
  - [ ] Add fields: violationNumber, violationDate, description, fineAmount, fineStatus, resolutionDate
  - [ ] Add audit fields (createdAt, updatedAt)

- [ ] **Task 9: Create Database Migrations** (AC: #48)
  - [ ] Determine next migration version number from existing
  - [ ] Create V{X}__create_compliance_requirements_table.sql
  - [ ] Create enum types (compliance_category, compliance_frequency, compliance_schedule_status, etc.)
  - [ ] Add indexes on requirementNumber, category, status
  - [ ] Create V{X+1}__create_compliance_schedules_table.sql with foreign keys
  - [ ] Add indexes on propertyId, dueDate, status
  - [ ] Create V{X+2}__create_inspections_table.sql with foreign keys
  - [ ] Add indexes on propertyId, scheduledDate, status
  - [ ] Create V{X+3}__create_violations_table.sql with foreign keys
  - [ ] Add indexes on complianceScheduleId, violationDate, fineStatus

- [ ] **Task 10: Create Compliance Repositories** (AC: #44)
  - [ ] Create ComplianceRequirementRepository extending JpaRepository
  - [ ] Add findByCategoryAndStatus query
  - [ ] Add search query (requirementName, authorityAgency)
  - [ ] Add existsByRequirementNumber for uniqueness
  - [ ] Create ComplianceScheduleRepository
  - [ ] Add findByPropertyIdOrderByDueDateDesc
  - [ ] Add findByStatusAndDueDateBetween
  - [ ] Add findByDueDateBeforeAndStatusNotIn (overdue query)
  - [ ] Add countByPropertyIdAndStatus
  - [ ] Create InspectionRepository
  - [ ] Add findByComplianceScheduleId
  - [ ] Add findByPropertyIdAndScheduledDateBetween
  - [ ] Create ViolationRepository
  - [ ] Add findByComplianceScheduleId
  - [ ] Add findByViolationDateBetween

- [ ] **Task 11: Create Compliance DTOs and Mappers** (AC: #47)
  - [ ] Create ComplianceRequirementDto (response with schedule count, property names)
  - [ ] Create ComplianceRequirementCreateDto (request)
  - [ ] Create ComplianceRequirementUpdateDto (request)
  - [ ] Create ComplianceScheduleDto (response with requirement name, property name)
  - [ ] Create ComplianceScheduleCompleteDto (request)
  - [ ] Create InspectionDto (response)
  - [ ] Create InspectionCreateDto (request)
  - [ ] Create InspectionResultsDto (request)
  - [ ] Create ViolationDto (response)
  - [ ] Create ViolationCreateDto (request)
  - [ ] Create ComplianceDashboardDto
  - [ ] Create mappers using MapStruct
  - [ ] Handle JSON array for applicableProperties

- [ ] **Task 12: Implement Number Generation** (AC: #11, #12)
  - [ ] Create database sequence for requirement numbers
  - [ ] Create database sequence for violation numbers
  - [ ] Implement getNextRequirementNumber() - format CMP-YYYY-NNNN
  - [ ] Implement getNextViolationNumber() - format VIO-YYYY-NNNN
  - [ ] Handle year rollover
  - [ ] Ensure thread-safety with database sequence

- [ ] **Task 13: Implement ComplianceRequirementService** (AC: #45)
  - [ ] Create ComplianceRequirementService interface
  - [ ] Create ComplianceRequirementServiceImpl with @Service
  - [ ] Implement createRequirement with number generation
  - [ ] Implement auto-generate schedules for applicable properties
  - [ ] Implement getRequirement with details
  - [ ] Implement getRequirements with filter support
  - [ ] Implement updateRequirement with schedule recalculation
  - [ ] Implement deleteRequirement (soft delete)

- [ ] **Task 14: Implement ComplianceScheduleService** (AC: #45)
  - [ ] Create ComplianceScheduleService interface
  - [ ] Create ComplianceScheduleServiceImpl with @Service
  - [ ] Implement getSchedules with filter support
  - [ ] Implement completeSchedule with certificate upload
  - [ ] Implement generateNextSchedule based on frequency
  - [ ] Implement updateStatusForOverdue (status transition)
  - [ ] Implement exemptSchedule

- [ ] **Task 15: Implement InspectionService** (AC: #45)
  - [ ] Create InspectionService interface
  - [ ] Create InspectionServiceImpl with @Service
  - [ ] Implement createInspection linked to schedule
  - [ ] Implement updateInspectionResults
  - [ ] Handle PASSED result: mark schedule complete, upload certificate
  - [ ] Handle FAILED result: create remediation work order, mark schedule overdue
  - [ ] Implement getInspections with filter support

- [ ] **Task 16: Implement ViolationService** (AC: #45)
  - [ ] Create ViolationService interface
  - [ ] Create ViolationServiceImpl with @Service
  - [ ] Implement createViolation with number generation
  - [ ] Implement optional remediation work order creation
  - [ ] Implement updateViolation (fine status tracking)
  - [ ] Implement getViolations with filter support

- [ ] **Task 17: Implement Compliance Dashboard Service** (AC: #23)
  - [ ] Create ComplianceDashboardService or method in existing service
  - [ ] Implement upcomingInspections count (next 30 days)
  - [ ] Implement overdueComplianceItems count
  - [ ] Implement recentViolations (last 30 days count + last 5)
  - [ ] Implement complianceRatePercentage calculation
  - [ ] Implement inspectionsByStatus grouped counts
  - [ ] Implement schedulesByCategory grouped counts

- [ ] **Task 18: Implement Work Order Integration** (AC: #28)
  - [ ] Inject WorkOrderService into InspectionService
  - [ ] Create work order when inspection FAILED
  - [ ] Map compliance category to work order category
  - [ ] Set priority HIGH for compliance-related work orders
  - [ ] Add note referencing compliance requirement
  - [ ] Link work order ID to inspection and violation

- [ ] **Task 19: Create Compliance Email Template** (AC: #49)
  - [ ] Create compliance-reminder-notification.html template
  - [ ] Include company header
  - [ ] Include grouped list of upcoming compliance items by property
  - [ ] Show requirement name, due date, days until due
  - [ ] Include call to action (review compliance items)
  - [ ] Style consistently with existing email templates

- [ ] **Task 20: Implement Scheduler Jobs** (AC: #25, #26)
  - [ ] Create ComplianceStatusUpdateJob with @Scheduled (6 AM daily)
  - [ ] Query schedules by due date
  - [ ] Update status to DUE (within 30 days) or OVERDUE (past due)
  - [ ] Skip COMPLETED and EXEMPT
  - [ ] Log status transitions
  - [ ] Create ComplianceReminderNotificationJob with @Scheduled (8 AM daily)
  - [ ] Query schedules due within 30 days
  - [ ] Group by property manager
  - [ ] Send email using EmailService
  - [ ] Use @Async for non-blocking

- [ ] **Task 21: Implement Compliance Controllers** (AC: #46)
  - [ ] Create ComplianceRequirementController with @RestController
  - [ ] Implement POST /api/v1/compliance-requirements (create)
  - [ ] Implement GET /api/v1/compliance-requirements (list)
  - [ ] Implement GET /api/v1/compliance-requirements/{id} (detail)
  - [ ] Implement PUT /api/v1/compliance-requirements/{id} (update)
  - [ ] Create ComplianceScheduleController
  - [ ] Implement GET /api/v1/compliance-schedules (list)
  - [ ] Implement PATCH /api/v1/compliance-schedules/{id}/complete (complete)
  - [ ] Create InspectionController
  - [ ] Implement POST /api/v1/inspections (create)
  - [ ] Implement PUT /api/v1/inspections/{id} (update results)
  - [ ] Create ViolationController
  - [ ] Implement POST /api/v1/violations (create)
  - [ ] Implement PUT /api/v1/violations/{id} (update)
  - [ ] Implement GET /api/v1/compliance/dashboard
  - [ ] Add GET /api/v1/properties/{id}/compliance-history to PropertyController
  - [ ] Add @PreAuthorize for role-based access

- [ ] **Task 22: Create Compliance Dashboard Page** (AC: #29)
  - [ ] Create app/(dashboard)/compliance/page.tsx
  - [ ] Implement KPI cards (Upcoming, Overdue, Violations, Compliance Rate)
  - [ ] Implement compliance calendar view
  - [ ] Implement recent violations table (last 5)
  - [ ] Add quick action buttons (Add Requirement, Schedule Inspection)
  - [ ] Add data-testid="page-compliance-dashboard"

- [ ] **Task 23: Create Compliance Requirements List Page** (AC: #30)
  - [ ] Create app/(dashboard)/compliance/requirements/page.tsx
  - [ ] Implement DataTable with requirement columns
  - [ ] Add category filter dropdown
  - [ ] Add status filter dropdown
  - [ ] Implement search by name/authority
  - [ ] Add pagination (20 per page)
  - [ ] Add sorting by requirementNumber, requirementName
  - [ ] Add quick action buttons (View, Edit, Delete)
  - [ ] Add data-testid="page-compliance-requirements"

- [ ] **Task 24: Create Compliance Schedules List Page** (AC: #31)
  - [ ] Create app/(dashboard)/compliance/schedules/page.tsx
  - [ ] Implement DataTable with schedule columns
  - [ ] Add property filter dropdown
  - [ ] Add category filter dropdown
  - [ ] Add status filter dropdown (with color indicators)
  - [ ] Add date range picker filter
  - [ ] Add pagination (20 per page)
  - [ ] Add sorting by dueDate
  - [ ] Add quick action buttons (Mark Complete, Schedule Inspection, Upload Certificate)
  - [ ] Add data-testid="page-compliance-schedules"

- [ ] **Task 25: Create Requirement Detail Page** (AC: #32)
  - [ ] Create app/(dashboard)/compliance/requirements/[id]/page.tsx
  - [ ] Display requirement header (number, name, status badge)
  - [ ] Display details section (category, frequency, authority, penalty)
  - [ ] Display applicable properties section (list or "All Properties")
  - [ ] Display schedules section grouped by status
  - [ ] Display violations section (linked violations)
  - [ ] Add action buttons (Edit, Deactivate)
  - [ ] Add data-testid="page-compliance-requirement-detail"

- [ ] **Task 26: Create Compliance Requirement Form** (AC: #33)
  - [ ] Create app/(dashboard)/compliance/requirements/new/page.tsx
  - [ ] Create app/(dashboard)/compliance/requirements/[id]/edit/page.tsx
  - [ ] Implement form with complianceRequirementSchema validation
  - [ ] Requirement Name input (required, max 200 chars)
  - [ ] Category select (required)
  - [ ] Description textarea (max 1000 chars)
  - [ ] Applicable Properties multi-select with "All Properties" checkbox
  - [ ] Frequency select (required)
  - [ ] Authority/Agency input (max 200 chars)
  - [ ] Penalty Description textarea (max 500 chars)
  - [ ] Status select (ACTIVE/INACTIVE)
  - [ ] Add data-testid="form-compliance-requirement"

- [ ] **Task 27: Create Mark Complete Dialog** (AC: #34)
  - [ ] Create components/compliance/MarkCompleteDialog.tsx
  - [ ] Completed Date picker (required, default today)
  - [ ] Notes textarea (optional)
  - [ ] Certificate file upload (optional, PDF)
  - [ ] Handle loading state
  - [ ] On success: close, invalidate cache, toast
  - [ ] Add data-testid="dialog-mark-complete"

- [ ] **Task 28: Create Schedule Inspection Dialog** (AC: #35)
  - [ ] Create components/compliance/ScheduleInspectionDialog.tsx
  - [ ] Inspector Name input (required, max 200 chars)
  - [ ] Scheduled Date picker (required)
  - [ ] Pre-populate complianceScheduleId, propertyId from context
  - [ ] Handle loading state
  - [ ] On success: create inspection, close, refresh
  - [ ] Add data-testid="dialog-schedule-inspection"

- [ ] **Task 29: Create Inspection Results Form** (AC: #36)
  - [ ] Create app/(dashboard)/compliance/inspections/[id]/results/page.tsx
  - [ ] Inspection Date picker (required)
  - [ ] Status select (IN_PROGRESS/PASSED/FAILED/CANCELLED)
  - [ ] Result select (conditional: PASSED/FAILED/PARTIAL_PASS)
  - [ ] Issues Found textarea (conditional: if failed/partial)
  - [ ] Recommendations textarea
  - [ ] Certificate upload (conditional: if passed, PDF)
  - [ ] Next Inspection Date picker (optional)
  - [ ] Add data-testid="form-inspection-results"

- [ ] **Task 30: Create Violations List Page** (AC: #37)
  - [ ] Create app/(dashboard)/compliance/violations/page.tsx
  - [ ] Implement DataTable with violation columns
  - [ ] Add fineStatus filter dropdown
  - [ ] Add date range picker filter
  - [ ] Add pagination (20 per page)
  - [ ] Add sorting by violationDate DESC
  - [ ] Add quick action buttons (View, Edit Fine Status)
  - [ ] Add data-testid="page-compliance-violations"

- [ ] **Task 31: Create Record Violation Dialog** (AC: #38)
  - [ ] Create components/compliance/RecordViolationDialog.tsx
  - [ ] Violation Date picker (required)
  - [ ] Description textarea (required, max 1000 chars)
  - [ ] Fine Amount input (optional, currency format)
  - [ ] Create Remediation Work Order checkbox
  - [ ] Pre-populate complianceScheduleId from context
  - [ ] Handle loading state
  - [ ] On success: create violation, optionally create work order, close
  - [ ] Add data-testid="dialog-record-violation"

- [ ] **Task 32: Create Compliance Calendar Component** (AC: #39)
  - [ ] Create components/compliance/ComplianceCalendar.tsx
  - [ ] Install and configure FullCalendar or react-big-calendar
  - [ ] Display scheduled inspections and due items
  - [ ] Color-code by status: green (completed), yellow (upcoming), red (overdue), blue (scheduled)
  - [ ] Implement click handler to open detail modal
  - [ ] Add data-testid="component-compliance-calendar"

- [ ] **Task 33: Create Status Badge Components**
  - [ ] Create components/compliance/ScheduleStatusBadge.tsx (UPCOMING=yellow, DUE=orange, COMPLETED=green, OVERDUE=red, EXEMPT=gray)
  - [ ] Create components/compliance/InspectionStatusBadge.tsx (SCHEDULED=blue, IN_PROGRESS=yellow, PASSED=green, FAILED=red, CANCELLED=gray)
  - [ ] Create components/compliance/FineStatusBadge.tsx (PENDING=yellow, PAID=green, APPEALED=blue, WAIVED=gray)
  - [ ] Add data-testid attributes to each

- [ ] **Task 34: Write Backend Unit Tests** (AC: #50)
  - [ ] Create ComplianceRequirementServiceTest
  - [ ] Test createRequirement with schedule auto-generation
  - [ ] Test updateRequirement with frequency change
  - [ ] Create ComplianceScheduleServiceTest
  - [ ] Test completeSchedule with next schedule generation
  - [ ] Test status transitions (DUE, OVERDUE)
  - [ ] Create InspectionServiceTest
  - [ ] Test updateInspectionResults with PASSED (schedule complete)
  - [ ] Test updateInspectionResults with FAILED (work order creation)
  - [ ] Create ViolationServiceTest
  - [ ] Test createViolation with work order
  - [ ] Create scheduler job tests
  - [ ] Mock S3 and WorkOrderService
  - [ ] Achieve >= 80% coverage

- [ ] **Task 35: Write Frontend Unit Tests** (AC: #51)
  - [ ] Test compliance dashboard rendering
  - [ ] Test requirements list filtering
  - [ ] Test schedules list with status badges
  - [ ] Test mark complete dialog functionality
  - [ ] Test inspection results form validation
  - [ ] Test calendar component event rendering
  - [ ] Test status badge colors
  - [ ] Verify data-testid accessibility

- [ ] **Task 36: Mandatory Test Execution and Build Verification** (AC: #52, #53)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests before proceeding
  - [ ] Execute backend build: `mvn compile` - Zero errors required
  - [ ] Execute frontend build: `npm run build` - Zero errors required
  - [ ] Execute frontend lint: `npm run lint` - Zero errors required
  - [ ] Document results in Completion Notes

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

**Compliance Requirement Flow:**
```
Create Requirement → Auto-generate Schedules (per property × frequency)
                             ↓
             ComplianceSchedule per property with initial due date
                             ↓
             Daily job updates status: UPCOMING → DUE → OVERDUE
```

**Inspection Flow:**
```
Schedule Inspection → Inspection (SCHEDULED)
                             ↓
             Record Results → PASSED: Complete schedule, generate next
                           → FAILED: Create remediation work order, record violation
                             ↓
             Compliance Schedule updated accordingly
```

**Schedule Completion Flow:**
```
Mark Complete → Update status to COMPLETED
                             ↓
             If recurring → Calculate next due date based on frequency
                             ↓
             Create new ComplianceSchedule (UPCOMING)
```

**Next Due Date Calculation:**
```
Frequency → Months Added
ONE_TIME → No next schedule
MONTHLY → +1 month
QUARTERLY → +3 months
SEMI_ANNUALLY → +6 months
ANNUALLY → +12 months
BIANNUALLY → +24 months
```

### Constraints

**Compliance Rules:**
- requirementNumber must be unique (database constraint)
- violationNumber must be unique (database constraint)
- applicableProperties = null means "All Properties"
- ONE_TIME requirements do not generate recurring schedules
- COMPLETED and EXEMPT schedules are not affected by status update job
- FAILED inspection must create remediation work order

**Number Formats:**
- Requirement: CMP-{YYYY}-{NNNN} (e.g., CMP-2025-0001)
- Violation: VIO-{YYYY}-{NNNN} (e.g., VIO-2025-0001)
- Reset sequence at year change

**Status Colors:**
- Schedule: UPCOMING=yellow, DUE=orange, COMPLETED=green, OVERDUE=red, EXEMPT=gray
- Inspection: SCHEDULED=blue, IN_PROGRESS=yellow, PASSED=green, FAILED=red, CANCELLED=gray
- Fine: PENDING=yellow, PAID=green, APPEALED=blue, WAIVED=gray

**S3 Storage Structure:**
```
/uploads/compliance/
  ├── schedules/
  │   └── {scheduleId}/
  │       └── certificate.pdf
  └── inspections/
      └── {inspectionId}/
          └── certificate.pdf
```

### Prerequisites

**From Story 3.2 (Property Management):**
- Property entity and PropertyRepository
- Property listing for applicable properties dropdown

**From Story 4.1 (Work Order Management):**
- WorkOrder entity and WorkOrderService
- Work order creation for remediation

**From Story 1.6 (AWS S3):**
- FileStorageService for certificate storage
- Presigned URL generation
- LocalStack for development

### Learnings from Previous Epic Stories

**From Completed Story 7.2 (Document Management - Status: drafted)**

- **Patterns to Reuse**: Entity with enums, Repository with custom queries, Service layer with @Transactional, Controller with @PreAuthorize, DTOs with MapStruct
- **Number Generation**: Use database sequence with year prefix, format XXX-YYYY-NNNN
- **File Storage**: Use existing FileStorageService, store at /uploads/{entity}/{entityId}/
- **Scheduler Jobs**: Use @Scheduled with cron expression, @Async for email sending
- **Frontend Patterns**: TypeScript types in types/*.ts, Zod validation schemas in lib/validations/*.ts, Frontend service in services/*.service.ts, React Query hooks in hooks/use*.ts, Pages with data-testid attributes
- **Test Patterns**: Service tests covering all methods, Controller tests for authorization and validation
- **Build Verification**: Always run mvn test, npm test, npm run build, npm run lint before marking done

[Source: docs/sprint-artifacts/epic-7/7-2-document-management-system.md]

### Project Structure Notes

**Backend Files to Create:**
- `backend/src/main/java/com/ultrabms/entity/ComplianceRequirement.java`
- `backend/src/main/java/com/ultrabms/entity/ComplianceSchedule.java`
- `backend/src/main/java/com/ultrabms/entity/Inspection.java`
- `backend/src/main/java/com/ultrabms/entity/Violation.java`
- `backend/src/main/java/com/ultrabms/entity/enums/ComplianceCategory.java`
- `backend/src/main/java/com/ultrabms/entity/enums/ComplianceFrequency.java`
- `backend/src/main/java/com/ultrabms/entity/enums/ComplianceScheduleStatus.java`
- `backend/src/main/java/com/ultrabms/entity/enums/InspectionStatus.java`
- `backend/src/main/java/com/ultrabms/entity/enums/InspectionResult.java`
- `backend/src/main/java/com/ultrabms/entity/enums/FineStatus.java`
- `backend/src/main/java/com/ultrabms/repository/ComplianceRequirementRepository.java`
- `backend/src/main/java/com/ultrabms/repository/ComplianceScheduleRepository.java`
- `backend/src/main/java/com/ultrabms/repository/InspectionRepository.java`
- `backend/src/main/java/com/ultrabms/repository/ViolationRepository.java`
- `backend/src/main/java/com/ultrabms/service/ComplianceRequirementService.java`
- `backend/src/main/java/com/ultrabms/service/ComplianceScheduleService.java`
- `backend/src/main/java/com/ultrabms/service/InspectionService.java`
- `backend/src/main/java/com/ultrabms/service/ViolationService.java`
- `backend/src/main/java/com/ultrabms/service/impl/ComplianceRequirementServiceImpl.java`
- `backend/src/main/java/com/ultrabms/service/impl/ComplianceScheduleServiceImpl.java`
- `backend/src/main/java/com/ultrabms/service/impl/InspectionServiceImpl.java`
- `backend/src/main/java/com/ultrabms/service/impl/ViolationServiceImpl.java`
- `backend/src/main/java/com/ultrabms/controller/ComplianceRequirementController.java`
- `backend/src/main/java/com/ultrabms/controller/ComplianceScheduleController.java`
- `backend/src/main/java/com/ultrabms/controller/InspectionController.java`
- `backend/src/main/java/com/ultrabms/controller/ViolationController.java`
- `backend/src/main/java/com/ultrabms/dto/compliance/*.java` (DTOs)
- `backend/src/main/java/com/ultrabms/mapper/ComplianceMapper.java`
- `backend/src/main/java/com/ultrabms/scheduler/ComplianceStatusUpdateJob.java`
- `backend/src/main/java/com/ultrabms/scheduler/ComplianceReminderNotificationJob.java`
- `backend/src/main/resources/db/migration/V{X}__create_compliance_requirements_table.sql`
- `backend/src/main/resources/db/migration/V{X+1}__create_compliance_schedules_table.sql`
- `backend/src/main/resources/db/migration/V{X+2}__create_inspections_table.sql`
- `backend/src/main/resources/db/migration/V{X+3}__create_violations_table.sql`
- `backend/src/main/resources/templates/email/compliance-reminder-notification.html`
- `backend/src/test/java/com/ultrabms/service/ComplianceRequirementServiceTest.java`
- `backend/src/test/java/com/ultrabms/service/ComplianceScheduleServiceTest.java`
- `backend/src/test/java/com/ultrabms/service/InspectionServiceTest.java`
- `backend/src/test/java/com/ultrabms/service/ViolationServiceTest.java`

**Frontend Files to Create:**
- `frontend/src/types/compliance.ts`
- `frontend/src/lib/validations/compliance.ts`
- `frontend/src/services/compliance.service.ts`
- `frontend/src/hooks/useCompliance.ts`
- `frontend/src/app/(dashboard)/compliance/page.tsx`
- `frontend/src/app/(dashboard)/compliance/requirements/page.tsx`
- `frontend/src/app/(dashboard)/compliance/requirements/[id]/page.tsx`
- `frontend/src/app/(dashboard)/compliance/requirements/new/page.tsx`
- `frontend/src/app/(dashboard)/compliance/requirements/[id]/edit/page.tsx`
- `frontend/src/app/(dashboard)/compliance/schedules/page.tsx`
- `frontend/src/app/(dashboard)/compliance/inspections/[id]/results/page.tsx`
- `frontend/src/app/(dashboard)/compliance/violations/page.tsx`
- `frontend/src/components/compliance/MarkCompleteDialog.tsx`
- `frontend/src/components/compliance/ScheduleInspectionDialog.tsx`
- `frontend/src/components/compliance/RecordViolationDialog.tsx`
- `frontend/src/components/compliance/ComplianceCalendar.tsx`
- `frontend/src/components/compliance/ScheduleStatusBadge.tsx`
- `frontend/src/components/compliance/InspectionStatusBadge.tsx`
- `frontend/src/components/compliance/FineStatusBadge.tsx`

### References

- [Source: docs/epics/epic-7-asset-compliance-management.md#story-73-compliance-and-inspection-tracking]
- [Source: docs/prd.md#3.8-document-and-compliance-module]
- [Source: docs/architecture.md#documents-and-compliance]
- [Source: docs/architecture.md#data-architecture]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-29 | 1.0 | SM Agent (Bob) | Initial story draft created from Epic 7 acceptance criteria in YOLO mode |
