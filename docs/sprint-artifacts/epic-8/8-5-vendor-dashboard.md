# Story 8.5: Vendor Dashboard

Status: ready-for-dev

## Story

As an administrator or property manager,
I want a dedicated vendor dashboard with performance metrics and document tracking,
So that I can monitor vendor performance and manage compliance effectively.

## Acceptance Criteria

### KPI Cards (Top Row)
1. **AC-1:** Dashboard displays Total Active Vendors KPI card showing:
   - Count of vendors with status = ACTIVE
   - Click navigates to active vendors list

2. **AC-2:** Dashboard displays Avg SLA Compliance KPI card showing:
   - Percentage across all active vendors
   - Calculated from vendor performance metrics

3. **AC-3:** Dashboard displays Top Performing Vendor KPI card showing:
   - Vendor name with highest rating
   - Rating badge displayed (star rating)

4. **AC-4:** Dashboard displays Expiring Documents KPI card showing:
   - Count of documents expiring in next 30 days
   - Red highlight if critical documents expiring
   - Click navigates to expiring documents list

### Jobs by Specialization Chart (Bar)
5. **AC-5:** Jobs by Specialization bar chart displays:
   - X-axis: Specialization categories (Plumbing, Electrical, HVAC, etc.)
   - Y-axis: Job count
   - Shows distribution of completed work across specializations
   - Click bar navigates to vendor list by specialization

### Vendor Performance Snapshot (Scatter Plot)
6. **AC-6:** Vendor Performance scatter plot displays:
   - X-axis: SLA Compliance percentage (0-100%)
   - Y-axis: Customer Rating (1-5 scale)
   - Bubble size: Number of completed jobs
   - Hover shows vendor name, SLA %, rating, and job count
   - Color-coded by performance tier (green/yellow/red)

### Vendors with Expiring Documents List
7. **AC-7:** Vendors with Expiring Documents table displays:
   - Columns: Vendor Name, Document Type, Expiry Date, Days Until Expiry
   - Sorted by expiry date ascending
   - Red highlight for documents expiring in < 7 days
   - Quick actions: View Vendor, Upload Document

### Top Vendors by Jobs List
8. **AC-8:** Top Vendors by Jobs table displays:
   - Columns: Rank, Vendor Name, Jobs Completed (This Month), Avg Rating
   - Top 5 vendors by job volume
   - Star rating display
   - Quick action: View Vendor Profile

### API Endpoints
9. **AC-9:** Backend provides GET /api/v1/dashboard/vendor endpoint returning all vendor dashboard data

10. **AC-10:** Backend provides GET /api/v1/dashboard/vendor/jobs-by-specialization endpoint

11. **AC-11:** Backend provides GET /api/v1/dashboard/vendor/performance-snapshot endpoint returning scatter plot data

12. **AC-12:** Backend provides GET /api/v1/dashboard/vendor/expiring-documents endpoint

13. **AC-13:** Backend provides GET /api/v1/dashboard/vendor/top-vendors endpoint

### Technical Requirements
14. **AC-14:** Frontend uses Recharts ScatterChart for vendor performance snapshot

15. **AC-15:** Bubble size is proportional to completed job count

16. **AC-16:** Dashboard data cached for 5 minutes using Ehcache

17. **AC-17:** Tooltip shows vendor details on hover for scatter plot

18. **AC-18:** Role-based access for ADMIN, PROPERTY_MANAGER, or MAINTENANCE_SUPERVISOR

19. **AC-19:** All interactive elements have data-testid attributes

## Tasks / Subtasks

### Backend Tasks
- [ ] Task 1: Create Vendor Dashboard DTOs (AC: #9-13)
  - [ ] Create VendorDashboardDto with all fields
  - [ ] Create VendorKpiDto for KPI cards
  - [ ] Create JobsBySpecializationDto for bar chart
  - [ ] Create VendorPerformanceSnapshotDto for scatter plot
  - [ ] Create ExpiringDocumentDto for documents list
  - [ ] Create TopVendorDto for top vendors list

- [ ] Task 2: Create VendorDashboardRepository queries (AC: #1-8)
  - [ ] Query for active vendors count
  - [ ] Query for average SLA compliance calculation
  - [ ] Query for top performing vendor by rating
  - [ ] Query for documents expiring in 30 days
  - [ ] Query for jobs grouped by specialization
  - [ ] Query for vendor performance snapshot data
  - [ ] Query for vendors with expiring documents
  - [ ] Query for top vendors by jobs completed

- [ ] Task 3: Create VendorDashboardService (AC: #1-8, #16)
  - [ ] Implement getVendorDashboard() method
  - [ ] Implement getJobsBySpecialization() method
  - [ ] Implement getPerformanceSnapshot() method
  - [ ] Implement getExpiringDocuments() method
  - [ ] Implement getTopVendors() method
  - [ ] Add Ehcache caching with 5-minute TTL
  - [ ] Calculate SLA compliance from vendor ratings

- [ ] Task 4: Create VendorDashboardController (AC: #9-13, #18)
  - [ ] GET /api/v1/dashboard/vendor
  - [ ] GET /api/v1/dashboard/vendor/jobs-by-specialization
  - [ ] GET /api/v1/dashboard/vendor/performance-snapshot
  - [ ] GET /api/v1/dashboard/vendor/expiring-documents
  - [ ] GET /api/v1/dashboard/vendor/top-vendors
  - [ ] Add @PreAuthorize for authorized roles

- [ ] Task 5: Write unit tests for VendorDashboardService
  - [ ] Test KPI calculations
  - [ ] Test performance snapshot data aggregation
  - [ ] Test expiring documents query

### Frontend Tasks
- [ ] Task 6: Create TypeScript types for vendor dashboard
  - [ ] Create vendor-dashboard.ts types
  - [ ] Create Zod validation schemas

- [ ] Task 7: Create vendor-dashboard.service.ts API client
  - [ ] Implement fetchVendorDashboard()
  - [ ] Implement fetchJobsBySpecialization()
  - [ ] Implement fetchPerformanceSnapshot()
  - [ ] Implement fetchExpiringDocuments()
  - [ ] Implement fetchTopVendors()

- [ ] Task 8: Create useVendorDashboard React Query hook
  - [ ] Implement hook with auto-refresh
  - [ ] Handle loading and error states

- [ ] Task 9: Create VendorKpiCards component (AC: #1-4)
  - [ ] Display 4 KPI cards in a row
  - [ ] Star rating badge for top vendor
  - [ ] Red highlight for critical expiring docs
  - [ ] Add data-testid attributes

- [ ] Task 10: Create JobsBySpecializationChart component (AC: #5)
  - [ ] Use Recharts BarChart
  - [ ] Click navigation to vendor list
  - [ ] Color-coded bars

- [ ] Task 11: Create VendorPerformanceScatter component (AC: #6, #14, #15, #17)
  - [ ] Use Recharts ScatterChart
  - [ ] Bubble size proportional to job count
  - [ ] Custom tooltip with vendor details
  - [ ] Color-code by performance tier
  - [ ] Add hover interactions

- [ ] Task 12: Create ExpiringDocumentsTable component (AC: #7)
  - [ ] Create sortable data table
  - [ ] Red highlight for < 7 days
  - [ ] Quick action buttons
  - [ ] Add data-testid attributes

- [ ] Task 13: Create TopVendorsTable component (AC: #8)
  - [ ] Display top 5 vendors
  - [ ] Star rating component
  - [ ] View Profile quick action

- [ ] Task 14: Create Vendor Dashboard page (AC: #14, #19)
  - [ ] Create page at app/(dashboard)/vendors/dashboard/page.tsx
  - [ ] Implement responsive grid layout
  - [ ] Add skeleton loaders for all components
  - [ ] Integrate all vendor dashboard components

- [ ] Task 15: Write frontend unit tests
  - [ ] Test VendorKpiCards component
  - [ ] Test VendorPerformanceScatter with hover
  - [ ] Test ExpiringDocumentsTable component

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

### Relevant Architecture Patterns
- Use Spring Cache with Ehcache for 5-minute caching [Source: docs/architecture.md#Caching-Strategy]
- Use Recharts ScatterChart for performance snapshot [Source: docs/architecture.md#Decision-Summary]
- Role-based access with @PreAuthorize [Source: docs/architecture.md#Role-Based-Access-Control]
- Vendor Performance Scoring algorithm in architecture [Source: docs/architecture.md#Vendor-Performance-Scoring]

### Technical Implementation Notes
- SLA Compliance calculated from: (on-time completions / total completions) * 100
- Performance tiers: Green (rating >= 4 AND SLA >= 80%), Yellow (rating >= 3 OR SLA >= 60%), Red (below thresholds)
- Bubble size formula: MIN_SIZE + (job_count / MAX_JOBS) * (MAX_SIZE - MIN_SIZE)
- Vendor specializations from VendorService enum
- Critical documents: trade_license, insurance

### Project Structure Notes
- Backend: `controller/VendorDashboardController.java`, `service/VendorDashboardService.java`
- Frontend: `app/(dashboard)/vendors/dashboard/page.tsx`
- Reuse vendor types from `types/vendor.ts`

### Stitch Design Reference
- Reference design: `docs/archive/stitch_building_maintenance_software/vendor_module_dashboard/screen.png`

### Prerequisites
- Story 5.1 (done) - Vendor registration and profile management
- Story 5.2 (done) - Vendor document and license management
- Story 5.3 (done) - Vendor performance tracking and rating

### References
- [Source: docs/epics/epic-8-dashboard-reporting.md#Story-8.5]
- [Source: docs/architecture.md#Vendor-Management]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-8/8-5-vendor-dashboard.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
