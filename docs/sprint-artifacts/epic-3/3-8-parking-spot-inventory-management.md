# Story 3.8: Parking Spot Inventory Management

Status: drafted

## Story

As a property manager,
I want to manage parking spot inventory for each building,
so that I can track available spots and allocate them to tenants.

## Acceptance Criteria

1. **AC1 - Parking Spot List Page Route and Structure:** Parking spot management accessible at /property-management/parking for users with SUPER_ADMIN, ADMIN, or PROPERTY_MANAGER role. Uses Next.js App Router within (dashboard) route group. Page is client component with data fetching via React Query. Implements responsive layout: single column on mobile, full-width table on desktop. Page requires authentication middleware with role check. Breadcrumb navigation: Dashboard > Property Management > Parking Spots. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

2. **AC2 - Parking Spot Table Display:** Table displays columns: Checkbox (for bulk selection), Spot Number, Building (property name), Default Fee (AED, formatted with currency), Status (badge), Assigned To (tenant name, clickable link if assigned), Actions (dropdown menu). Sorting enabled on: Spot Number (alphabetical), Building (alphabetical), Default Fee (numeric). Pagination with options: 10, 20, 50 items per page. Total records count displayed. Empty state when no parking spots exist: "No parking spots found. Click 'Add New Parking Spot' to create one." [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

3. **AC3 - Status Badge Display:** Status badges with color coding matching design system: AVAILABLE (green badge, solid background), ASSIGNED (blue badge, tenant name is clickable link to tenant detail page), UNDER_MAINTENANCE (orange badge). Badge component uses shadcn/ui Badge with variant prop for colors. Status text displays: "Available", "Assigned", "Under Maintenance". [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

4. **AC4 - Search and Filters:** Search input field searches by: Spot Number (partial match), Tenant name (partial match, if assigned). Building filter: dropdown of all properties from useProperties() hook, "All Buildings" option as default. Status filter: dropdown with options "All Statuses", "Available", "Assigned", "Under Maintenance". Filters apply immediately on change (debounced 300ms for search). Clear filters button resets all filters to default. URL query params updated to preserve filter state on page refresh. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

5. **AC5 - Add New Parking Spot Modal:** "Add New Parking Spot" button (primary style) in page header opens modal dialog. Modal form fields: Building (required, shadcn Select, populated from useProperties() hook), Spot Number (required, shadcn Input, max 20 chars, placeholder: "e.g., P2-115, A-101, G-12"), Default Fee (AED) (required, shadcn Input type="number", min 0, step 0.01). Form validation with Zod schema: spot number max 20 chars, fee >= 0. Submit creates parking spot via POST /api/v1/parking-spots. On success: close modal, show toast "Parking spot created successfully", invalidate parking spots query. On error: display API error message in form. Modal buttons: Cancel (closes modal), Save Spot (submits form, disabled while loading). [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

6. **AC6 - Spot Number Uniqueness Validation:** Frontend: no duplicate validation (backend enforces). Backend: unique constraint on (property_id, spot_number) WHERE active = true. On duplicate: return 409 Conflict with message "Parking spot {spotNumber} already exists in this building." Display error below Spot Number field in modal form. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

7. **AC7 - Edit Parking Spot:** Actions column dropdown includes "Edit" option. Edit opens same modal form pre-populated with existing values. Building field disabled if spot status = ASSIGNED (cannot move assigned spot). Fee updates affect future allocations only (existing tenant agreements unchanged). Submit calls PUT /api/v1/parking-spots/{id}. On success: close modal, show toast "Parking spot updated successfully", invalidate queries. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

8. **AC8 - Delete Parking Spot:** Actions column dropdown includes "Delete" option. Delete opens confirmation dialog: Title "Delete Parking Spot", Body "Are you sure you want to delete parking spot {spotNumber} in {buildingName}? This action cannot be undone.", Buttons: Cancel, Delete (destructive style). If status = ASSIGNED: Delete option disabled with tooltip "Cannot delete an assigned parking spot." Or: show error dialog "This parking spot is currently assigned to a tenant. Please release the assignment before deleting." Soft delete via DELETE /api/v1/parking-spots/{id} (sets active = false). On success: show toast "Parking spot deleted successfully", invalidate queries. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

9. **AC9 - Status Change Actions:** Actions dropdown includes status change options: If AVAILABLE: "Mark as Under Maintenance" (changes to UNDER_MAINTENANCE). If UNDER_MAINTENANCE: "Mark as Available" (changes to AVAILABLE). If ASSIGNED: no status change options (status managed via tenant allocation/checkout). Status change via PATCH /api/v1/parking-spots/{id}/status with body {status: "AVAILABLE" | "UNDER_MAINTENANCE"}. On success: show toast "Status updated to {newStatus}", invalidate queries. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

10. **AC10 - Bulk Actions:** Checkbox in table header toggles all visible rows. Bulk action bar appears when rows selected: shows "{count} selected", buttons for "Delete Selected", "Change Status". Bulk delete: confirmation dialog, cannot delete ASSIGNED spots (skip with warning or prevent). Bulk status change: dropdown to select new status, applies to all selected (skips ASSIGNED spots). API endpoints for bulk operations: POST /api/v1/parking-spots/bulk-delete (body: {ids: [...]}), POST /api/v1/parking-spots/bulk-status (body: {ids: [...], status: "..."}). [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

11. **AC11 - ParkingSpot Entity and Database Schema:** Create ParkingSpot entity with fields: id (UUID), spotNumber (String, max 20, not null), property (ManyToOne to Property), defaultFee (BigDecimal, min 0), status (ParkingSpotStatus enum: AVAILABLE, ASSIGNED, UNDER_MAINTENANCE), assignedTenant (ManyToOne to Tenant, nullable), assignedAt (LocalDateTime, nullable), notes (String, max 500, nullable), createdAt (LocalDateTime), updatedAt (LocalDateTime), active (Boolean, default true). Database migration V43__create_parking_spots_table.sql. Indexes on: property_id, status, spot_number. Unique constraint: (property_id, spot_number) WHERE active = true. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

12. **AC12 - Backend API Endpoints:** Implement REST endpoints in ParkingSpotController: POST /api/v1/parking-spots (create, returns 201), GET /api/v1/parking-spots (list with filters: propertyId, status, search, page, size, sort), GET /api/v1/parking-spots/{id} (get by ID), PUT /api/v1/parking-spots/{id} (update), PATCH /api/v1/parking-spots/{id}/status (change status), DELETE /api/v1/parking-spots/{id} (soft delete, returns 400 if ASSIGNED), GET /api/v1/properties/{id}/parking-spots (list for property), GET /api/v1/parking-spots/available (list available spots for allocation dropdowns). All endpoints require authentication. Proper DTO separation: ParkingSpotRequest, ParkingSpotResponse, ParkingSpotListResponse. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

13. **AC13 - RBAC Implementation:** Role-based access control: SUPER_ADMIN, ADMIN, PROPERTY_MANAGER: Full CRUD access (create, read, update, delete, status change). FINANCE_MANAGER: Read-only access (GET endpoints only). MAINTENANCE_SUPERVISOR: Read-only access (GET endpoints only). TENANT: No access (403 Forbidden). VENDOR: No access (403 Forbidden). Implement using @PreAuthorize annotations on controller methods. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

14. **AC14 - Integration with Tenant Onboarding (Story 3.3):** Update tenant parking allocation in onboarding form to use ParkingSpot entity. Parking allocation dropdown shows available spots: GET /api/v1/parking-spots/available?propertyId={id}. When tenant allocated parking: Update ParkingSpot: status = ASSIGNED, assignedTenantId = tenant.id, assignedAt = now(). Store spot reference in Tenant.parkingSpots (or through allocation table if exists). Display allocated spots in tenant profile. Note: This may require updates to TenantService.allocateParking() method. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

15. **AC15 - Integration with Tenant Checkout (Story 3.7):** When tenant checkout completes: Release all parking spots assigned to tenant. Update each ParkingSpot: status = AVAILABLE, assignedTenantId = null, assignedAt = null. Called from TenantCheckoutService.complete() method. Log parking release in audit trail. Note: Update TenantCheckoutService to include parking spot release. [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

16. **AC16 - Sidebar Navigation Update:** Add "Parking Spots" menu item under Property Management section in Sidebar component. Menu item properties: label: "Parking Spots", href: "/property-management/parking", icon: ParkingCircle (from lucide-react, or similar parking icon). Visible to roles: SUPER_ADMIN, ADMIN, PROPERTY_MANAGER. Hidden from: FINANCE_MANAGER, MAINTENANCE_SUPERVISOR, TENANT, VENDOR (or show disabled). Position: After existing Property Management items (Properties, Units). [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]

17. **AC17 - TypeScript Types and Validation Schemas:** Create frontend/src/types/parking.ts with interfaces: ParkingSpot {id, spotNumber, propertyId, propertyName, defaultFee, status, assignedTenantId, assignedTenantName, assignedAt, notes, createdAt, updatedAt}, ParkingSpotListResponse {content: ParkingSpot[], totalElements, totalPages, page, size}, ParkingSpotFilters {propertyId?, status?, search?, page, size, sort}. Define enum: ParkingSpotStatus {AVAILABLE, ASSIGNED, UNDER_MAINTENANCE}. Create frontend/src/lib/validations/parking.ts with: createParkingSpotSchema, updateParkingSpotSchema. Create frontend/src/services/parking.service.ts with API methods. Export types from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

18. **AC18 - Testing Requirements:** Backend tests: ParkingSpotServiceTest (15+ tests: CRUD operations, status transitions, uniqueness validation, bulk operations). ParkingSpotControllerTest (12+ tests: API endpoints, RBAC validation, error handling). Frontend tests: Validation schema tests (parking.test.ts). Component tests (ParkingSpotList, AddParkingSpotModal). All interactive elements have data-testid: "parking-table", "btn-add-parking-spot", "modal-add-parking-spot", "input-spot-number", "select-building", "input-default-fee", "btn-save-spot", "badge-status-{status}", "btn-edit-{id}", "btn-delete-{id}", "bulk-action-bar", "checkbox-row-{id}". Minimum coverage: Backend 80%, Frontend 70%. [Source: docs/architecture.md#testing-strategy]

19. **AC19 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint status conventions]

20. **AC20 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint status conventions]

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types, Enums, and Validation Schemas** (AC: #17)
  - [ ] Create frontend/src/types/parking.ts with ParkingSpot, ParkingSpotListResponse, ParkingSpotFilters interfaces
  - [ ] Define ParkingSpotStatus enum (AVAILABLE, ASSIGNED, UNDER_MAINTENANCE)
  - [ ] Create frontend/src/lib/validations/parking.ts with createParkingSpotSchema, updateParkingSpotSchema
  - [ ] Create frontend/src/services/parking.service.ts with API methods (list, create, update, delete, changeStatus, getAvailable)
  - [ ] Create useParkingSpots, useParkingSpot, useCreateParkingSpot, useUpdateParkingSpot, useDeleteParkingSpot hooks
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Create Database Schema and Entity** (AC: #11)
  - [ ] Create Flyway migration V43__create_parking_spots_table.sql
  - [ ] Create ParkingSpot entity with all fields and relationships
  - [ ] Create ParkingSpotStatus enum in backend (com.ultrabms.entity.enums)
  - [ ] Create ParkingSpotRepository extending JpaRepository
  - [ ] Add indexes on property_id, status, spot_number
  - [ ] Add unique constraint: (property_id, spot_number) WHERE active = true

- [ ] **Task 3: Implement Parking Spot Service** (AC: #12, #13)
  - [ ] Create ParkingSpotService with CRUD methods
  - [ ] Implement list with filters (propertyId, status, search, pagination)
  - [ ] Implement status change method (AVAILABLE <-> UNDER_MAINTENANCE only)
  - [ ] Implement soft delete with ASSIGNED check
  - [ ] Implement bulk delete and bulk status change methods
  - [ ] Implement getAvailableSpots(propertyId) for allocation dropdowns
  - [ ] Write unit tests (15+ test cases)

- [ ] **Task 4: Implement Backend API Endpoints** (AC: #12, #13)
  - [ ] Create ParkingSpotController with @RestController("/api/v1/parking-spots")
  - [ ] Implement POST / (create) endpoint
  - [ ] Implement GET / (list with filters) endpoint
  - [ ] Implement GET /{id} endpoint
  - [ ] Implement PUT /{id} (update) endpoint
  - [ ] Implement PATCH /{id}/status endpoint
  - [ ] Implement DELETE /{id} endpoint
  - [ ] Implement POST /bulk-delete endpoint
  - [ ] Implement POST /bulk-status endpoint
  - [ ] Implement GET /available endpoint
  - [ ] Add @PreAuthorize annotations for RBAC
  - [ ] Create DTOs: ParkingSpotRequest, ParkingSpotResponse, ParkingSpotListResponse

- [ ] **Task 5: Create Parking Spot List Page** (AC: #1, #2, #3, #4)
  - [ ] Create app/(dashboard)/property-management/parking/page.tsx
  - [ ] Implement ParkingSpotTable component with columns
  - [ ] Implement status badges with color coding
  - [ ] Implement pagination component
  - [ ] Implement sorting on Spot Number, Building, Default Fee
  - [ ] Implement search input with debounce
  - [ ] Implement building filter dropdown
  - [ ] Implement status filter dropdown
  - [ ] Implement URL query param persistence for filters
  - [ ] Add breadcrumb navigation
  - [ ] Add empty state display

- [ ] **Task 6: Create Add/Edit Parking Spot Modal** (AC: #5, #6, #7)
  - [ ] Create AddParkingSpotModal component
  - [ ] Implement form with Building dropdown, Spot Number input, Default Fee input
  - [ ] Integrate Zod validation schema with react-hook-form
  - [ ] Implement create mode (empty form)
  - [ ] Implement edit mode (pre-populated form)
  - [ ] Disable building field in edit mode if status = ASSIGNED
  - [ ] Handle API errors (display 409 Conflict for duplicates)
  - [ ] Add loading state and disable submit while processing
  - [ ] Show success toast on save

- [ ] **Task 7: Implement Delete and Status Change Actions** (AC: #8, #9)
  - [ ] Create Actions dropdown menu with Edit, Delete, status change options
  - [ ] Create DeleteConfirmationDialog component
  - [ ] Implement delete with ASSIGNED check (disable or show error)
  - [ ] Implement status change actions (Available <-> Under Maintenance)
  - [ ] Show success toasts on actions

- [ ] **Task 8: Implement Bulk Actions** (AC: #10)
  - [ ] Add checkbox column to table
  - [ ] Implement select all toggle
  - [ ] Create BulkActionBar component (shows when rows selected)
  - [ ] Implement bulk delete with confirmation
  - [ ] Implement bulk status change dropdown
  - [ ] Handle ASSIGNED spots in bulk operations (skip with warning)

- [ ] **Task 9: Update Sidebar Navigation** (AC: #16)
  - [ ] Add "Parking Spots" menu item to Sidebar.tsx
  - [ ] Use ParkingCircle icon from lucide-react
  - [ ] Route to /property-management/parking
  - [ ] Add RBAC visibility check (visible to SUPER_ADMIN, ADMIN, PROPERTY_MANAGER)

- [ ] **Task 10: Integration with Tenant Onboarding** (AC: #14)
  - [ ] Update tenant onboarding parking step to use ParkingSpot entity
  - [ ] Replace manual spot number input with dropdown of available spots
  - [ ] Call parking service to get available spots for selected property
  - [ ] Update TenantService to update ParkingSpot status on allocation
  - [ ] Display allocated spot details in tenant profile

- [ ] **Task 11: Integration with Tenant Checkout** (AC: #15)
  - [ ] Update TenantCheckoutService.complete() to release parking spots
  - [ ] Find all ParkingSpots where assignedTenantId = checkoutTenant.id
  - [ ] Set status = AVAILABLE, assignedTenantId = null, assignedAt = null
  - [ ] Add audit log entry for parking release

- [ ] **Task 12: Frontend Unit Tests** (AC: #18)
  - [ ] Create parking.test.ts for validation schema tests (10+ tests)
  - [ ] Create ParkingSpotTable.test.tsx (8+ tests: rendering, sorting, pagination)
  - [ ] Create AddParkingSpotModal.test.tsx (8+ tests: form validation, submit, error handling)
  - [ ] Create BulkActionBar.test.tsx (5+ tests: selection, actions)
  - [ ] Verify all data-testid attributes present
  - [ ] Achieve 70%+ line coverage

- [ ] **Task 13: Mandatory Test Execution and Build Verification** (AC: #19, #20)
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

### Architecture Patterns to Follow

1. **CRUD Service Pattern:**
   - Follow patterns from PropertyService/UnitService
   - Use Spring Data JPA repository pattern
   - Implement soft delete via `active` flag
   - Return DTOs from service layer, not entities

2. **React Query Data Fetching:**
   - Use React Query hooks for all API calls
   - Implement proper cache invalidation on mutations
   - Handle loading and error states consistently

3. **Form Validation:**
   - Use React Hook Form with Zod schema resolver
   - Match Zod v4 syntax (no deprecated `required_error/invalid_type_error`)
   - Inline error display below fields

4. **Table Component:**
   - Follow existing DataTable patterns
   - Use shadcn/ui Table components
   - Implement sorting, pagination, filtering

5. **Modal Pattern:**
   - Use shadcn/ui Dialog component
   - Handle loading states on submit
   - Clear form on close

### Project Structure Notes

- Frontend page: `frontend/src/app/(dashboard)/property-management/parking/page.tsx`
- Frontend components: `frontend/src/components/parking/`
- Frontend types: `frontend/src/types/parking.ts`
- Frontend validations: `frontend/src/lib/validations/parking.ts`
- Frontend service: `frontend/src/services/parking.service.ts`
- Backend entity: `backend/src/main/java/com/ultrabms/entity/ParkingSpot.java`
- Backend enum: `backend/src/main/java/com/ultrabms/entity/enums/ParkingSpotStatus.java`
- Backend service: `backend/src/main/java/com/ultrabms/service/ParkingSpotService.java`
- Backend controller: `backend/src/main/java/com/ultrabms/controller/ParkingSpotController.java`
- Backend DTOs: `backend/src/main/java/com/ultrabms/dto/parking/`
- Migration: `backend/src/main/resources/db/migration/V43__create_parking_spots_table.sql`

### Learnings from Previous Story

**From Story 3.7 (Status: done) - Tenant Checkout and Deposit Refund:**

- **TypeScript/Zod Alignment:** Ensure Zod schemas match TypeScript interfaces exactly
- **Zod v4 Syntax:** Use `.min(1, "Field is required")` instead of deprecated `required_error`
- **Enum Handling:** Reference enum values correctly (e.g., `ParkingSpotStatus.AVAILABLE`)
- **Null Handling:** Add proper null checks for optional form fields
- **Test Results:** 535/536 tests passed - maintain this baseline

**Key Files to Reference:**
- `frontend/src/types/checkout.ts` - TypeScript type patterns
- `frontend/src/lib/validations/checkout.ts` - Zod schema patterns
- `frontend/src/services/checkout.service.ts` - Service layer patterns

[Source: docs/sprint-artifacts/epic-3/3-7-tenant-checkout-and-deposit-refund.md#Completion-Notes]

### Design References

- Stitch designs: `docs/archive/stitch_building_maintenance_software/parking_spot_inventory/`
- Stitch designs: `docs/archive/stitch_building_maintenance_software/add/edit_parking_spot_form/`

### References

- [Source: docs/epics/epic-3-tenant-management-portal.md#story-38]
- [Source: docs/prd.md#3.9-parking-management-module]
- [Source: docs/architecture.md#backend-implementation-patterns]
- [Source: docs/architecture.md#frontend-implementation-patterns]
- [Source: docs/architecture.md#database-schema-overview-parking-management]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-28 | Story drafted via *create-story workflow | SM Agent (Bob) |
