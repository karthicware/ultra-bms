# Story 3.1.e2e: E2E Tests for Lead Management and Quotation System

Status: drafted

## Story

As a QA engineer / developer,
I want comprehensive end-to-end tests for the lead management and quotation system,
So that I can ensure the complete user flows work correctly across frontend and backend.

## Acceptance Criteria

1. **Lead Management Flow Tests**
   - Create lead with all required fields → verify lead appears in list
   - Upload document to lead (Emirates ID, passport) → verify document appears
   - Search leads by name, email, Emirates ID → verify correct results
   - Filter leads by status, source, date range → verify filtered list
   - Update lead status → verify status change reflected
   - View lead communication history → verify timeline events
   - Delete lead → verify soft delete (not in default list)

2. **Quotation Management Flow Tests**
   - Create quotation from lead detail page → verify form pre-filled
   - Fill quotation form with rent details → verify real-time total calculation
   - Add document requirements checklist → verify selections saved
   - Save quotation as draft → verify status = DRAFT, can edit
   - Send quotation via email → verify status = SENT, email triggered
   - Download quotation PDF → verify PDF contains all details
   - Accept quotation → verify status = ACCEPTED
   - Reject quotation with reason → verify status = REJECTED
   - Handle quotation expiry → verify status = EXPIRED after validity date

3. **Lead to Tenant Conversion Tests**
   - Accept quotation → verify "Convert to Tenant" button appears
   - Click convert → verify redirect to tenant onboarding (Story 3.3)
   - Verify lead status = CONVERTED
   - Verify quotation status = CONVERTED
   - Verify unit status = RESERVED

4. **Dashboard and Analytics Tests**
   - View leads/quotes dashboard → verify KPI cards display correct counts
   - Verify conversion rate calculation: (converted / sent) * 100
   - Check sales funnel chart → verify data visualization renders
   - Review "Quotes Expiring Soon" table → verify color coding (red <7 days, yellow 7-14, green 14+)
   - Verify dashboard auto-refresh (5 minutes)

5. **Validation and Error Handling Tests**
   - Submit lead form with missing required fields → verify inline errors
   - Submit invalid Emirates ID format → verify format error
   - Submit invalid email → verify validation error
   - Create quotation with validity date < issue date → verify error
   - Send quotation with no email → verify error handling

## Tasks / Subtasks

- [ ] Task 1: Test Environment Setup (AC: All)
  - [ ] Install Playwright and TypeScript dependencies
  - [ ] Configure playwright.config.ts with test database settings
  - [ ] Create test data fixtures for leads, quotations, properties, units
  - [ ] Implement test database seeding and cleanup utilities
  - [ ] Verify scripts/check-services.sh exists and works
  - [ ] Configure test reporter (HTML + screenshots on failure)

- [ ] Task 2: Lead Management Flow Tests (AC: 1)
  - [ ] Test: Create lead with all required fields
  - [ ] Test: Upload Emirates ID and passport documents
  - [ ] Test: Search leads by name, email, Emirates ID
  - [ ] Test: Filter leads by status, source, date range
  - [ ] Test: Update lead status transitions (NEW → CONTACTED → QUOTATION_SENT)
  - [ ] Test: View lead communication history timeline
  - [ ] Test: Soft delete lead (not in default list)
  - [ ] Verify all data-testid attributes exist per conventions

- [ ] Task 3: Quotation Management Flow Tests (AC: 2)
  - [ ] Test: Create quotation from lead detail page (form pre-fill)
  - [ ] Test: Real-time total calculation (rent + service + parking)
  - [ ] Test: Document requirements checklist selections
  - [ ] Test: Save quotation as DRAFT (editable)
  - [ ] Test: Send quotation via email (status=SENT)
  - [ ] Test: Download quotation PDF (verify content)
  - [ ] Test: Accept quotation (status=ACCEPTED)
  - [ ] Test: Reject quotation with reason (status=REJECTED)
  - [ ] Test: Quotation expiry handling (status=EXPIRED)

- [ ] Task 4: Lead to Tenant Conversion Tests (AC: 3)
  - [ ] Test: "Convert to Tenant" button appears after acceptance
  - [ ] Test: Click convert redirects to tenant onboarding (Story 3.3)
  - [ ] Test: Lead status updates to CONVERTED
  - [ ] Test: Quotation status updates to CONVERTED
  - [ ] Test: Unit status updates to RESERVED
  - [ ] Verify data propagation to tenant onboarding form

- [ ] Task 5: Dashboard and Analytics Tests (AC: 4)
  - [ ] Test: KPI cards display correct counts (new quotes, converted, conversion rate)
  - [ ] Test: Conversion rate calculation: (converted / sent) * 100
  - [ ] Test: Sales funnel chart renders with correct data
  - [ ] Test: Quotes expiring soon table with color coding (red <7 days, yellow 7-14, green 14+)
  - [ ] Test: Dashboard auto-refresh every 5 minutes

- [ ] Task 6: Validation and Error Handling Tests (AC: 5)
  - [ ] Test: Lead form missing required fields → inline errors
  - [ ] Test: Invalid Emirates ID format → format error
  - [ ] Test: Invalid email format → validation error
  - [ ] Test: Quotation validity date < issue date → error
  - [ ] Test: Send quotation with no email → error
  - [ ] Test: File upload > 5MB → size error
  - [ ] Test: Invalid file type upload → type error

- [ ] Task 7: Test Documentation and Reporting
  - [ ] Write test documentation in story file
  - [ ] Generate HTML test report with Playwright reporter
  - [ ] Capture screenshots on test failures
  - [ ] Document test data fixtures and cleanup procedures
  - [ ] Add test coverage metrics to completion notes

## Dev Notes

### Testing Standards and Patterns

**Test Framework:**
- Use Playwright with TypeScript for all E2E tests
- Test files location: `frontend/e2e/lead-quotation/`
- Fixtures location: `frontend/tests/fixtures/`
- Test utilities: `frontend/tests/utils/`

**Test Database:**
- Database: `ultra_bms_test` (isolated from dev data)
- Seed test data before each test suite
- Clean up test data after each test suite
- Use transactions where possible for faster cleanup

**data-testid Conventions:**
- Follow naming convention: `{component}-{element}-{action}`
- Examples: `btn-create-lead`, `input-email`, `select-lead-source`
- Verify all interactive elements have data-testid (Epic 2 retrospective AI-2-1)
- Reference: docs/development/data-testid-conventions.md (if exists) or establish conventions

**Service Validation:**
- Run scripts/check-services.sh before executing E2E tests (AI-2-2)
- Backend must be running: http://localhost:8080/actuator/health
- Frontend must be running: http://localhost:3000
- Fail fast if services unavailable

**Test Organization:**
- Group tests by user flow (lead management, quotation, conversion, dashboard)
- Use descriptive test names: "should create lead with all required fields"
- Mock external services (email sending, PDF generation) if needed
- Use page object model for reusable selectors and actions

**Error Handling:**
- Capture screenshots on test failures (Playwright built-in)
- Generate HTML test report with detailed logs
- Log API responses for debugging
- Use soft assertions where appropriate to gather multiple failures

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
- Tests verify frontend-backend integration for Lead Management API
- Tests verify frontend-backend integration for Quotation Management API
- Tests verify email notification triggers (mock or real)
- Tests verify PDF generation functionality

### Project Structure Notes

**Test File Structure:**
```
frontend/
├── e2e/
│   ├── lead-quotation/
│   │   ├── lead-management.spec.ts
│   │   ├── quotation-management.spec.ts
│   │   ├── lead-conversion.spec.ts
│   │   ├── dashboard-analytics.spec.ts
│   │   └── validation-errors.spec.ts
│   └── utils/
│       ├── test-helpers.ts
│       └── page-objects.ts
├── tests/
│   └── fixtures/
│       ├── leads.json
│       ├── quotations.json
│       ├── properties.json
│       └── units.json
└── playwright.config.ts
```

**Alignment with Story 3.1:**
- Tests cover all acceptance criteria from Story 3.1 technical implementation
- Verifies lead entity creation with all fields
- Verifies quotation entity creation and status transitions
- Verifies dashboard KPI calculations
- Verifies API endpoints: /api/v1/leads, /api/v1/quotations, /api/v1/leads-quotes/dashboard

### References

- [Source: docs/epics/epic-3-tenant-management-portal.md#Story-3.1.e2e]
- [Source: docs/retrospectives/epic-2-retrospective.md#action-items]
- [Source: docs/prd.md#3.3-Tenant-Management-Module]
- [Source: docs/architecture.md#Testing-Backend-Frontend]
- [Prerequisite: Story 3.1 status must be "done" before implementing this story]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
