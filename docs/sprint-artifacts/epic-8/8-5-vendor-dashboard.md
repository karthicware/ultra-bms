# Story 8.5: Vendor Dashboard

Status: done

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
- [x] Task 1: Create Vendor Dashboard DTOs (AC: #9-13)
  - [x] Create VendorDashboardDto with all fields
  - [x] Create VendorKpiDto for KPI cards
  - [x] Create JobsBySpecializationDto for bar chart
  - [x] Create VendorPerformanceSnapshotDto for scatter plot
  - [x] Create ExpiringDocumentDto for documents list
  - [x] Create TopVendorDto for top vendors list

- [x] Task 2: Create VendorDashboardRepository queries (AC: #1-8)
  - [x] Query for active vendors count
  - [x] Query for average SLA compliance calculation
  - [x] Query for top performing vendor by rating
  - [x] Query for documents expiring in 30 days
  - [x] Query for jobs grouped by specialization
  - [x] Query for vendor performance snapshot data
  - [x] Query for vendors with expiring documents
  - [x] Query for top vendors by jobs completed

- [x] Task 3: Create VendorDashboardService (AC: #1-8, #16)
  - [x] Implement getVendorDashboard() method
  - [x] Implement getJobsBySpecialization() method
  - [x] Implement getPerformanceSnapshot() method
  - [x] Implement getExpiringDocuments() method
  - [x] Implement getTopVendors() method
  - [x] Add Ehcache caching with 5-minute TTL
  - [x] Calculate SLA compliance from vendor ratings

- [x] Task 4: Create VendorDashboardController (AC: #9-13, #18)
  - [x] GET /api/v1/dashboard/vendor
  - [x] GET /api/v1/dashboard/vendor/jobs-by-specialization
  - [x] GET /api/v1/dashboard/vendor/performance-snapshot
  - [x] GET /api/v1/dashboard/vendor/expiring-documents
  - [x] GET /api/v1/dashboard/vendor/top-vendors
  - [x] Add @PreAuthorize for authorized roles

- [x] Task 5: Write unit tests for VendorDashboardService
  - [x] Test KPI calculations
  - [x] Test performance snapshot data aggregation
  - [x] Test expiring documents query

### Frontend Tasks
- [x] Task 6: Create TypeScript types for vendor dashboard
  - [x] Create vendor-dashboard.ts types
  - [x] Create Zod validation schemas

- [x] Task 7: Create vendor-dashboard.service.ts API client
  - [x] Implement fetchVendorDashboard()
  - [x] Implement fetchJobsBySpecialization()
  - [x] Implement fetchPerformanceSnapshot()
  - [x] Implement fetchExpiringDocuments()
  - [x] Implement fetchTopVendors()

- [x] Task 8: Create useVendorDashboard React Query hook
  - [x] Implement hook with auto-refresh
  - [x] Handle loading and error states

- [x] Task 9: Create VendorKpiCards component (AC: #1-4)
  - [x] Display 4 KPI cards in a row
  - [x] Star rating badge for top vendor
  - [x] Red highlight for critical expiring docs
  - [x] Add data-testid attributes

- [x] Task 10: Create JobsBySpecializationChart component (AC: #5)
  - [x] Use Recharts BarChart
  - [x] Click navigation to vendor list
  - [x] Color-coded bars

- [x] Task 11: Create VendorPerformanceScatter component (AC: #6, #14, #15, #17)
  - [x] Use Recharts ScatterChart
  - [x] Bubble size proportional to job count
  - [x] Custom tooltip with vendor details
  - [x] Color-code by performance tier
  - [x] Add hover interactions

- [x] Task 12: Create ExpiringDocumentsTable component (AC: #7)
  - [x] Create sortable data table
  - [x] Red highlight for < 7 days
  - [x] Quick action buttons
  - [x] Add data-testid attributes

- [x] Task 13: Create TopVendorsTable component (AC: #8)
  - [x] Display top 5 vendors
  - [x] Star rating component
  - [x] View Profile quick action

- [x] Task 14: Create Vendor Dashboard page (AC: #14, #19)
  - [x] Create page at app/(dashboard)/vendors/dashboard/page.tsx
  - [x] Implement responsive grid layout
  - [x] Add skeleton loaders for all components
  - [x] Integrate all vendor dashboard components

- [x] Task 15: Write frontend unit tests
  - [x] Test VendorKpiCards component
  - [x] Test VendorPerformanceScatter with hover
  - [x] Test ExpiringDocumentsTable component

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

### UI Component Sourcing (Priority Order)
**Reference:** Sprint Change Proposal 2025-12-01

1. **Primary:** shadcn-studio-mcp blocks (install via `npx shadcn@latest add "https://shadcn-studio.com/r/{block-name}"`)
   | UI Element | Block Name | Install Command |
   |------------|------------|-----------------|
   | Vendor KPIs (Active, SLA, Top Performer, Expiring Docs) | `statistics-component-04` | `npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-04"` |
   | Performance Scatter Plot | `chart-component-13` | `npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-13"` |
   | Expiring Documents Widget | `widget-component-07` | `npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-07"` |
   | Top Vendors Table | `datatable-component-04` | `npx shadcn@latest add "https://shadcn-studio.com/r/datatable-component-04"` |

2. **Fallback:** If no matching shadcn-studio-mcp block, use shadcn-mcp or manual shadcn/ui components

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

**Implementation Date:** 2025-12-02

**Backend Implementation:**
- 6 DTOs created in `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/`
- VendorDashboardRepository interface with 8 query methods
- VendorDashboardRepositoryImpl with native SQL queries for performance
- VendorDashboardService interface with 6 methods
- VendorDashboardServiceImpl with @Cacheable (5-minute TTL) on all methods
- VendorDashboardController with 6 REST endpoints and @PreAuthorize security
- Ehcache configuration added to ehcache.xml (6 vendor dashboard caches)
- VendorDashboardServiceTest with 16 unit tests (all passing)

**Frontend Implementation:**
- TypeScript types in `frontend/src/types/vendor-dashboard.ts` (~250 lines)
- Zod validation schemas in `frontend/src/lib/validations/vendor-dashboard.ts` (~150 lines)
- API service in `frontend/src/services/vendor-dashboard.service.ts` (~105 lines)
- React Query hooks in `frontend/src/hooks/useVendorDashboard.ts` (~150 lines)
- 5 dashboard components in `frontend/src/components/vendor-dashboard/`
- Dashboard page at `frontend/src/app/(dashboard)/vendors/dashboard/page.tsx`
- 47 frontend unit tests (all passing)

**Test Results:**
- Backend: 16/16 tests PASS (VendorDashboardServiceTest)
- Frontend: 47/47 tests PASS (VendorKpiCards, VendorPerformanceScatter, ExpiringDocumentsTable, useVendorDashboard)

**Build Status:**
- Backend: mvn compile SUCCESS
- Frontend: npm run build SUCCESS

**Fixes Applied During Implementation:**
1. Fixed `List.of()` type issue in tests - used `new ArrayList<>()` with `.add()`
2. Fixed import error - changed `import api from '@/lib/api'` to `import { apiClient } from '@/lib/api'`
3. Fixed Recharts Bar onClick type issue - used index-based lookup
4. Fixed Zod schema mismatch - removed nullable from serviceCategorySchema, aligned with TypeScript enum
5. Added type assertions to service functions for Zod/TypeScript compatibility

### File List

**Backend Files Created:**
- `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/VendorKpiDto.java`
- `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/JobsBySpecializationDto.java`
- `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/VendorPerformanceSnapshotDto.java`
- `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/ExpiringDocumentDto.java`
- `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/TopVendorDto.java`
- `backend/src/main/java/com/ultrabms/dto/dashboard/vendor/VendorDashboardDto.java`
- `backend/src/main/java/com/ultrabms/repository/VendorDashboardRepository.java`
- `backend/src/main/java/com/ultrabms/repository/impl/VendorDashboardRepositoryImpl.java`
- `backend/src/main/java/com/ultrabms/service/VendorDashboardService.java`
- `backend/src/main/java/com/ultrabms/service/impl/VendorDashboardServiceImpl.java`
- `backend/src/main/java/com/ultrabms/controller/VendorDashboardController.java`
- `backend/src/test/java/com/ultrabms/service/VendorDashboardServiceTest.java`

**Backend Files Modified:**
- `backend/src/main/resources/ehcache.xml` (added vendor dashboard caches)

**Frontend Files Created:**
- `frontend/src/types/vendor-dashboard.ts`
- `frontend/src/lib/validations/vendor-dashboard.ts`
- `frontend/src/services/vendor-dashboard.service.ts`
- `frontend/src/hooks/useVendorDashboard.ts`
- `frontend/src/components/vendor-dashboard/VendorKpiCards.tsx`
- `frontend/src/components/vendor-dashboard/JobsBySpecializationChart.tsx`
- `frontend/src/components/vendor-dashboard/VendorPerformanceScatter.tsx`
- `frontend/src/components/vendor-dashboard/ExpiringDocumentsTable.tsx`
- `frontend/src/components/vendor-dashboard/TopVendorsTable.tsx`
- `frontend/src/components/vendor-dashboard/index.ts`
- `frontend/src/app/(dashboard)/vendors/dashboard/page.tsx`
- `frontend/src/components/vendor-dashboard/__tests__/VendorKpiCards.test.tsx`
- `frontend/src/components/vendor-dashboard/__tests__/VendorPerformanceScatter.test.tsx`
- `frontend/src/components/vendor-dashboard/__tests__/ExpiringDocumentsTable.test.tsx`
- `frontend/src/hooks/__tests__/useVendorDashboard.test.tsx`

**Frontend Files Modified:**
- `frontend/src/types/index.ts` (added vendor-dashboard exports)
