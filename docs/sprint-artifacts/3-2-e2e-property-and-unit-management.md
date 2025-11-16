# Story 3.2.e2e: E2E Tests for Property and Unit Management

Status: ready-for-dev

## Story

As a QA engineer / developer,
I want comprehensive end-to-end tests for property and unit management,
So that I can ensure property managers can effectively manage properties and units.

## Acceptance Criteria

1. **Property Management Flow Tests**
   - Create property with all fields → verify property appears in list
   - Upload property images (max 5) → verify images displayed in gallery
   - Search properties by name, address → verify search results
   - Filter properties by type, manager, occupancy range → verify filters work
   - Sort properties by name, occupancy % → verify sorting
   - Edit property details → verify updates saved
   - Delete property (no occupied units) → verify soft delete
   - Attempt delete with occupied units → verify validation error

2. **Unit Management Flow Tests**
   - Add single unit to property → verify unit appears in unit list
   - Bulk create units (e.g., 10 units) → verify all units created with sequential numbers
   - View unit in grid view → verify color-coded status badges (green/red/yellow)
   - View unit in list view → verify table displays correctly
   - Filter units by status, floor, bedrooms, rent range → verify filters
   - Update unit details → verify changes saved
   - Change unit status AVAILABLE → RESERVED → OCCUPIED → verify status transitions
   - Delete unit (not occupied) → verify soft delete
   - Attempt delete occupied unit → verify validation error

3. **Occupancy Calculations Tests**
   - Create property with 10 total units → create 7 occupied units
   - Verify occupancy rate displays: 70%
   - Verify color coding: yellow (70-90% range)
   - Change unit status → verify occupancy recalculates

4. **Property Manager Assignment Tests**
   - Assign property to manager → verify manager dropdown populated
   - Filter properties by assigned manager → verify only assigned properties shown
   - Reassign property to different manager → verify update

5. **Quick Actions Tests**
   - Quick assign tenant to available unit → verify assignment dialog
   - Bulk status update (select multiple units) → verify all updated

6. **Validation and Error Handling Tests**
   - Create property with totalUnits = 0 → verify error
   - Create unit with duplicate unitNumber in same property → verify error
   - Upload image > 5MB → verify size error
   - Upload non-image file → verify type error

## Tasks / Subtasks

- [ ] Task 1: Test Environment Setup and Configuration (AC: All)
  - [ ] Verify Playwright and TypeScript dependencies installed (from Story 3.1.e2e)
  - [ ] Create test data fixtures for properties, units, property managers
  - [ ] Implement test data seeding utilities for properties and units
  - [ ] Configure cleanup utilities for property/unit test data
  - [ ] Verify scripts/check-services.sh exists and works (from Story 3.1.e2e)
  - [ ] Add property/unit test fixtures to frontend/tests/fixtures/

- [ ] Task 2: Property Management Flow Tests (AC: 1)
  - [ ] Test: Create property with all required fields (name, address, type, total units)
  - [ ] Test: Upload property images (max 5, verify gallery display)
  - [ ] Test: Search properties by name and address
  - [ ] Test: Filter properties by type (RESIDENTIAL, COMMERCIAL, MIXED_USE)
  - [ ] Test: Filter properties by assigned property manager
  - [ ] Test: Filter properties by occupancy range (0-25%, 26-50%, 51-75%, 76-100%)
  - [ ] Test: Sort properties by name (ascending/descending)
  - [ ] Test: Sort properties by occupancy % (ascending/descending)
  - [ ] Test: Edit property details (name, address, amenities)
  - [ ] Test: Soft delete property with no occupied units
  - [ ] Test: Attempt delete property with occupied units → verify validation error
  - [ ] Verify all data-testid attributes exist per conventions

- [ ] Task 3: Unit Management Flow Tests (AC: 2)
  - [ ] Test: Add single unit to property (unit number, floor, bedrooms, bathrooms, rent)
  - [ ] Test: Bulk create 10 units with sequential numbers (e.g., 101-110)
  - [ ] Test: View units in grid view → verify color-coded status badges (AVAILABLE=green, OCCUPIED=red, UNDER_MAINTENANCE=yellow, RESERVED=blue)
  - [ ] Test: View units in list view → verify table displays all unit details
  - [ ] Test: Toggle between grid and list view
  - [ ] Test: Filter units by status (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED)
  - [ ] Test: Filter units by floor number
  - [ ] Test: Filter units by bedroom count (0, 1, 2, 3+)
  - [ ] Test: Filter units by rent range (min-max)
  - [ ] Test: Update unit details (unit number, rent, features)
  - [ ] Test: Change unit status AVAILABLE → RESERVED → OCCUPIED → verify status transitions
  - [ ] Test: Soft delete unit (not occupied)
  - [ ] Test: Attempt delete occupied unit → verify validation error

- [ ] Task 4: Occupancy Calculations Tests (AC: 3)
  - [ ] Test: Create property with totalUnits = 10
  - [ ] Test: Create 7 occupied units, 3 available units
  - [ ] Test: Verify occupancy rate displays 70% on property card
  - [ ] Test: Verify color coding on property card: yellow (70-90% range)
  - [ ] Test: Change unit status from OCCUPIED to AVAILABLE → verify occupancy recalculates to 60%
  - [ ] Test: Change unit status from AVAILABLE to OCCUPIED → verify occupancy recalculates to 80%
  - [ ] Test: Verify occupancy calculation accuracy across multiple properties

- [ ] Task 5: Property Manager Assignment Tests (AC: 4)
  - [ ] Test: Assign property to property manager → verify manager dropdown populated with PROPERTY_MANAGER role users
  - [ ] Test: Filter properties by assigned manager → verify only properties assigned to that manager shown
  - [ ] Test: Reassign property to different manager → verify update reflected in list
  - [ ] Test: Verify only users with PROPERTY_MANAGER role appear in dropdown

- [ ] Task 6: Quick Actions Tests (AC: 5)
  - [ ] Test: Quick assign tenant to available unit → verify assignment dialog opens
  - [ ] Test: Bulk select multiple units (checkbox selection)
  - [ ] Test: Bulk status update (select 5 units, change all to UNDER_MAINTENANCE) → verify all updated
  - [ ] Test: Verify bulk action only applies to selected units

- [ ] Task 7: Validation and Error Handling Tests (AC: 6)
  - [ ] Test: Create property with totalUnits = 0 → verify error "Total units must be at least 1"
  - [ ] Test: Create unit with duplicate unitNumber within same property → verify error "Unit number already exists"
  - [ ] Test: Upload property image > 5MB → verify size error
  - [ ] Test: Upload non-image file (e.g., PDF) → verify type error "Only image files allowed"
  - [ ] Test: Create unit with negative floor number → verify allowed (basement floors)
  - [ ] Test: Create unit with invalid rent amount (negative) → verify error

- [ ] Task 8: Test Documentation and Reporting
  - [ ] Write test documentation in story file completion notes
  - [ ] Generate HTML test report with Playwright reporter
  - [ ] Capture screenshots on test failures
  - [ ] Document test data fixtures (properties, units, managers)
  - [ ] Add test coverage metrics to completion notes
  - [ ] Document any edge cases discovered during testing

## Component Mapping

### shadcn/ui Components to Use

- Property form: shadcn `form`, `input`, `select`, `textarea` components
- Property list: shadcn `table` or `card` components with pagination
- Unit grid view: shadcn `card` component with `badge` for status
- Unit list view: shadcn `table` component
- Image gallery: shadcn `carousel` component or custom lightbox
- Filter panel: shadcn `select`, `input`, `slider` (for rent range)
- Bulk actions: shadcn `checkbox`, `button`, `dropdown-menu`
- Sort controls: shadcn `dropdown-menu` or `select`
- Delete confirmation: shadcn `alert-dialog`

### Custom Components Required

- PropertyCard: Display property with occupancy visualization (can use shadcn card + progress bar)
- UnitGrid: Grid layout for units with color-coded status (can use shadcn card grid)
- OccupancyMeter: Visual occupancy indicator (can use shadcn `progress` component)
- ImageUploadGallery: Multi-image upload with preview (no direct shadcn equivalent)

### Installation Command

```bash
npx shadcn@latest add form input select textarea table card badge carousel slider checkbox button dropdown-menu alert-dialog progress
```

## Dev Notes

### Testing Standards and Patterns

**Test Framework:**
- Use Playwright with TypeScript (established in Story 3.1.e2e)
- Test files location: `frontend/e2e/property-unit/`
- Fixtures location: `frontend/tests/fixtures/`
- Test utilities: `frontend/tests/utils/` (reuse from 3.1.e2e)

**Test Database:**
- Database: `ultra_bms_test` (isolated from dev data)
- Seed test data before each test suite
- Clean up test data after each test suite
- Use transactions where possible for faster cleanup

**data-testid Conventions:**
- Follow naming convention: `{component}-{element}-{action}`
- Property examples: `btn-create-property`, `input-property-name`, `select-property-type`
- Unit examples: `btn-add-unit`, `btn-bulk-create`, `input-unit-number`, `select-unit-status`
- Verify all interactive elements have data-testid (Epic 2 retrospective AI-2-1)

**Service Validation:**
- Run scripts/check-services.sh before executing E2E tests (AI-2-2)
- Backend must be running: http://localhost:8080/actuator/health
- Frontend must be running: http://localhost:3000
- Fail fast if services unavailable

**Test Organization:**
- Group tests by user flow (property management, unit management, occupancy, bulk actions)
- Use descriptive test names: "should create property with all required fields"
- Use page object model for reusable selectors and actions
- Separate test files for each major flow

**Error Handling:**
- Capture screenshots on test failures (Playwright built-in)
- Generate HTML test report with detailed logs
- Log API responses for debugging
- Use soft assertions where appropriate to gather multiple failures

### Learnings from Previous Story

**From Story 3.1.e2e (Status: drafted)**

- **Testing Architecture Established**: Playwright with TypeScript framework configured and working
- **Test Database**: `ultra_bms_test` database isolation pattern proven effective
- **Service Validation**: `scripts/check-services.sh` script in place for pre-test checks
- **Test File Structure**: Pattern established in `frontend/e2e/{feature}/` with fixtures and utils
- **data-testid Conventions**: Following Epic 2 AI-2-1 naming standard `{component}-{element}-{action}`
- **Page Object Model**: Reusable selectors and actions pattern established in utils
- **Test Fixtures**: JSON fixtures pattern for test data (leads, quotations) - replicate for properties/units
- **HTML Reporting**: Playwright reporter configured for test results visualization
- **Epic 2 Action Items**: AI-2-1 (data-testid), AI-2-2 (service checks), AI-2-8 (conventions) being applied

**Patterns to Reuse:**
- Use same test database connection configuration
- Use same service validation script before test runs
- Follow same test file naming convention: `{feature}.spec.ts`
- Use same fixtures pattern: `frontend/tests/fixtures/properties.json`, `units.json`
- Reuse test helpers from `frontend/tests/utils/test-helpers.ts`
- Reuse page object pattern from Story 3.1.e2e

**Note**: Story 3.1.e2e is drafted but not yet implemented, so this story will be the second E2E story in the epic.

[Source: docs/sprint-artifacts/3-1-e2e-lead-management-and-quotation-system.md#Dev-Agent-Record]

### Epic 2 Retrospective Action Items Applied

This story implements testing standards from Epic 2 retrospective:

- **AI-2-1 (P0):** Verify all interactive elements have data-testid attributes
- **AI-2-2 (P0):** Run scripts/check-services.sh before E2E test execution
- **AI-2-8 (P1):** Follow documented data-testid naming conventions

### Architectural Alignment

**Testing Architecture:**
- Frontend E2E tests use Playwright (aligns with modern testing standards)
- Test database separation prevents dev data pollution
- Service health checks ensure reliable test execution
- HTML reporting provides visibility into test results

**Integration Points:**
- Tests verify frontend-backend integration for Property Management API
- Tests verify frontend-backend integration for Unit Management API
- Tests verify image upload and storage functionality
- Tests verify bulk operations (bulk create units, bulk status update)
- Tests verify occupancy rate calculations

### Project Structure Notes

**Test File Structure:**
```
frontend/
├── e2e/
│   ├── property-unit/
│   │   ├── property-management.spec.ts
│   │   ├── unit-management.spec.ts
│   │   ├── occupancy-calculations.spec.ts
│   │   ├── bulk-operations.spec.ts
│   │   └── validation-errors.spec.ts
│   └── utils/
│       ├── test-helpers.ts (reuse from 3.1.e2e)
│       └── page-objects.ts (extend with property/unit pages)
├── tests/
│   └── fixtures/
│       ├── properties.json (new)
│       ├── units.json (new)
│       ├── property-managers.json (new)
│       ├── leads.json (from 3.1.e2e)
│       └── quotations.json (from 3.1.e2e)
└── playwright.config.ts (shared config)
```

**Alignment with Story 3.2:**
- Tests cover all acceptance criteria from Story 3.2 technical implementation
- Verifies property entity creation with all fields
- Verifies unit entity creation and bulk creation
- Verifies occupancy rate calculations: (occupied units / total units) * 100
- Verifies API endpoints: /api/v1/properties, /api/v1/properties/{id}/units, /api/v1/units/{id}
- Verifies soft delete functionality (active flag pattern)
- Verifies unit status transitions: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED

### References

- [Source: docs/epics/epic-3-tenant-management-portal.md#Story-3.2.e2e]
- [Source: docs/epics/epic-3-tenant-management-portal.md#Story-3.2]
- [Source: docs/retrospectives/epic-2-retrospective.md#action-items]
- [Source: docs/sprint-artifacts/3-1-e2e-lead-management-and-quotation-system.md#Testing-Standards]
- [Source: docs/architecture.md#Testing-Backend-Frontend]
- [Prerequisite: Story 3.2 status must be "done" before implementing this story]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/3-2-e2e-property-and-unit-management.context.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
