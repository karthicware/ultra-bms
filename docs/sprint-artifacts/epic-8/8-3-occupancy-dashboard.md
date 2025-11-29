# Story 8.3: Occupancy Dashboard

Status: ready-for-dev

## Story

As a property manager,
I want a dedicated occupancy dashboard with portfolio metrics and lease tracking,
So that I can monitor occupancy rates and manage lease renewals effectively.

## Acceptance Criteria

### KPI Cards (Top Row)
1. **AC-1:** Dashboard displays Portfolio Occupancy KPI card showing:
   - Percentage with visual progress indicator
   - Trend vs. previous period

2. **AC-2:** Dashboard displays Vacant Units KPI card showing:
   - Count of available/vacant units
   - Click navigates to vacant units list

3. **AC-3:** Dashboard displays Leases Expiring KPI card showing:
   - Count of leases expiring within configurable period (default: 100 days)
   - Period is configurable via settings

4. **AC-4:** Dashboard displays Average Rent/SqFt KPI card showing:
   - Currency amount (AED) per square foot
   - Calculated from active leases

### Portfolio Occupancy Chart (Donut)
5. **AC-5:** Portfolio Occupancy donut chart displays:
   - Segments: Occupied, Vacant, Under Renovation, Notice Period
   - Center displays total units count
   - Legend with percentages for each segment
   - Color-coded segments

### Lease Expirations by Month (Bar Chart)
6. **AC-6:** Lease Expirations bar chart displays:
   - X-axis: Next 12 months
   - Y-axis: Count of expiring leases
   - Color-coded bars (renewed vs pending)
   - Click bar navigates to lease list for that month

### Upcoming Lease Expirations (List)
7. **AC-7:** Upcoming Lease Expirations table displays:
   - Columns: Tenant, Unit, Property, Expiry Date, Days Remaining
   - Sorted by expiry date ascending
   - Pagination for large lists
   - Quick actions: View Lease, Initiate Renewal

### Recent Activity Feed
8. **AC-8:** Recent Activity Feed displays:
   - Timeline of lease-related activities
   - Shows: action type, tenant, unit, timestamp
   - Limited to last 10 items
   - Activities include: new lease, renewal, termination, notice period started

### API Endpoints
9. **AC-9:** Backend provides GET /api/v1/dashboard/occupancy endpoint that returns all occupancy dashboard data

10. **AC-10:** Backend provides GET /api/v1/dashboard/occupancy/lease-expirations endpoint with configurable days parameter (default: 100)

11. **AC-11:** Backend provides GET /api/v1/dashboard/occupancy/recent-activity endpoint returning last 10 lease activities

### Technical Requirements
12. **AC-12:** Leases Expiring period is configurable via company settings (default: 100 days)

13. **AC-13:** Frontend uses Recharts for donut and bar charts

14. **AC-14:** Backend implements role-based access using @PreAuthorize (PROPERTY_MANAGER or higher)

15. **AC-15:** Dashboard data is cached for 5 minutes using Ehcache

16. **AC-16:** Skeleton loaders are displayed during data fetch

17. **AC-17:** All interactive elements have data-testid attributes

## Tasks / Subtasks

### Backend Tasks
- [ ] Task 1: Create Occupancy Dashboard DTOs (AC: #9-11)
  - [ ] Create OccupancyDashboardDto with all fields
  - [ ] Create OccupancyKpiDto for KPI cards
  - [ ] Create PortfolioOccupancyChartDto for donut chart
  - [ ] Create LeaseExpirationChartDto for bar chart
  - [ ] Create LeaseExpirationListDto for upcoming expirations table
  - [ ] Create LeaseActivityDto for activity feed

- [ ] Task 2: Create OccupancyDashboardRepository queries (AC: #1-8)
  - [ ] Query for portfolio occupancy calculation by status
  - [ ] Query for vacant units count
  - [ ] Query for leases expiring within configurable days
  - [ ] Query for average rent per sqft calculation
  - [ ] Query for lease expirations grouped by month
  - [ ] Query for recent lease activities

- [ ] Task 3: Create OccupancyDashboardService (AC: #1-8, #12, #15)
  - [ ] Implement getOccupancyDashboard() method
  - [ ] Implement getLeaseExpirations(int days) method
  - [ ] Implement getRecentActivity() method
  - [ ] Add Ehcache caching with 5-minute TTL
  - [ ] Read configurable expiry period from company settings

- [ ] Task 4: Create OccupancyDashboardController (AC: #9-11, #14)
  - [ ] GET /api/v1/dashboard/occupancy
  - [ ] GET /api/v1/dashboard/occupancy/lease-expirations?days=100
  - [ ] GET /api/v1/dashboard/occupancy/recent-activity
  - [ ] Add @PreAuthorize for PROPERTY_MANAGER role

- [ ] Task 5: Write unit tests for OccupancyDashboardService
  - [ ] Test KPI calculations
  - [ ] Test lease expiration queries with different day parameters
  - [ ] Test activity feed ordering

### Frontend Tasks
- [ ] Task 6: Create TypeScript types for occupancy dashboard
  - [ ] Create occupancy-dashboard.ts types
  - [ ] Create Zod validation schemas

- [ ] Task 7: Create occupancy-dashboard.service.ts API client
  - [ ] Implement fetchOccupancyDashboard()
  - [ ] Implement fetchLeaseExpirations(days)
  - [ ] Implement fetchRecentActivity()

- [ ] Task 8: Create useOccupancyDashboard React Query hook
  - [ ] Implement hook with auto-refresh
  - [ ] Support configurable expiry days parameter

- [ ] Task 9: Create OccupancyKpiCards component (AC: #1-4)
  - [ ] Display 4 KPI cards in a row
  - [ ] Use shadcn/ui Card component
  - [ ] Add data-testid attributes

- [ ] Task 10: Create PortfolioOccupancyChart component (AC: #5)
  - [ ] Use Recharts PieChart with donut configuration
  - [ ] Display total units in center
  - [ ] Add legend with percentages
  - [ ] Color-code segments

- [ ] Task 11: Create LeaseExpirationBarChart component (AC: #6)
  - [ ] Use Recharts BarChart
  - [ ] Display 12 months on X-axis
  - [ ] Color-code renewed vs pending
  - [ ] Support click navigation

- [ ] Task 12: Create UpcomingLeaseExpirations component (AC: #7)
  - [ ] Create sortable data table
  - [ ] Add quick action buttons (View Lease, Initiate Renewal)
  - [ ] Implement pagination
  - [ ] Add data-testid attributes

- [ ] Task 13: Create LeaseActivityFeed component (AC: #8)
  - [ ] Display timeline with activity icons
  - [ ] Show action type, tenant, unit, timestamp
  - [ ] Limit to 10 items

- [ ] Task 14: Create Occupancy Dashboard page (AC: #13, #16, #17)
  - [ ] Create page at app/(dashboard)/occupancy/page.tsx
  - [ ] Implement responsive grid layout
  - [ ] Add skeleton loaders for all components
  - [ ] Integrate all occupancy components
  - [ ] Add data-testid to all interactive elements

- [ ] Task 15: Write frontend unit tests
  - [ ] Test OccupancyKpiCards component
  - [ ] Test PortfolioOccupancyChart component
  - [ ] Test LeaseExpirationBarChart component
  - [ ] Test UpcomingLeaseExpirations component

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
- Use Recharts for charts [Source: docs/architecture.md#Decision-Summary]
- Implement role-based access with @PreAuthorize [Source: docs/architecture.md#Role-Based-Access-Control]
- Follow consistent API response format [Source: docs/architecture.md#API-Response-Format]

### Technical Implementation Notes
- The configurable lease expiry period (default 100 days) should be read from company_profile settings
- Unit status values: VACANT, OCCUPIED, UNDER_RENOVATION, NOTICE_PERIOD
- Average rent/sqft calculation: SUM(rent_amount) / SUM(area_sqft) for active leases
- Activity feed includes: LEASE_CREATED, LEASE_RENEWED, LEASE_TERMINATED, NOTICE_GIVEN

### Project Structure Notes
- Backend: `controller/OccupancyDashboardController.java`, `service/OccupancyDashboardService.java`
- Frontend: `app/(dashboard)/occupancy/page.tsx`
- Charts: `components/charts/` folder

### Stitch Design Reference
- Reference design: `docs/archive/stitch_building_maintenance_software/occupancy_module_dashboard/screen.png`

### Prerequisites
- Story 3.2 (done) - Property/Unit management
- Story 3.3 (done) - Tenant onboarding with lease creation
- Story 3.6 (done) - Lease extension and renewal
- Story 2.8 (done) - Company profile for configurable settings

### References
- [Source: docs/epics/epic-8-dashboard-reporting.md#Story-8.3]
- [Source: docs/architecture.md#Epic-to-Architecture-Mapping]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-8/8-3-occupancy-dashboard.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
