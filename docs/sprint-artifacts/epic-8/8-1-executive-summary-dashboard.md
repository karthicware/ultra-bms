# Story 8.1: Executive Summary Dashboard

Status: ready-for-dev

## Story

As an executive or property manager,
I want an executive dashboard with key performance indicators,
So that I can quickly understand the overall business health and identify issues.

## Acceptance Criteria

### KPI Cards (Top Row)
1. **AC-1:** Dashboard displays Net Profit/Loss (Current Month) KPI card showing:
   - Amount with AED currency formatting
   - Percentage change vs. last month (green up arrow for positive, red down arrow for negative)
   - Calculated as: Total Revenue - Total Expenses (from financial data)

2. **AC-2:** Dashboard displays Overall Occupancy Rate KPI card showing:
   - Percentage (occupied units / total units)
   - Change vs. last month with trend indicator
   - Click to drill-down to see by property

3. **AC-3:** Dashboard displays Overdue Maintenance Jobs KPI card showing:
   - Count of work orders with status != COMPLETED and scheduledDate < today
   - Click navigates to filtered work order list

4. **AC-4:** Dashboard displays Outstanding Receivables KPI card showing:
   - Total amount from unpaid invoices
   - Aging breakdown (current, 30+, 60+, 90+ days)

### Priority Maintenance Queue (Card)
5. **AC-5:** Priority Maintenance Queue card displays:
   - List of HIGH priority work orders (status: OPEN or ASSIGNED)
   - Each item shows: work order number, property/unit, title, days overdue
   - Limited to top 5, with "View All" link
   - Red highlight for overdue items

### Upcoming PM Jobs Chart (Card - 30-day view)
6. **AC-6:** Upcoming PM Jobs card displays bar chart showing:
   - PM jobs by category for next 30 days
   - Categories on Y-axis, count on X-axis
   - Color-coded by status: scheduled (blue), overdue (red)
   - Click category navigates to PM job details

### Lease Expirations Timeline (Card - 12-month forecast)
7. **AC-7:** Lease Expirations card displays timeline showing:
   - Lease expirations by month for next 12 months
   - Shows: month, count of expiring leases
   - Highlight months with > 5 expirations (renewal planning needed)
   - Click month navigates to list of expiring leases for that month

### Critical Alerts Panel (Card)
8. **AC-8:** Critical Alerts Panel displays color-coded alerts:
   - Red (Urgent): Overdue compliance, bounced cheques, expired vendor licenses
   - Yellow (Warning): Documents expiring in 7 days, high-value invoices overdue
   - Blue (Info): Low occupancy rates, high maintenance costs
   - Count per alert type
   - Click alert type to view details and take action

### Property Performance Comparison
9. **AC-9:** Property Performance Comparison table displays:
   - Columns: Property name, Occupancy rate, Maintenance cost (current month), Revenue (current month), Open work orders
   - Sortable by any column
   - Visual highlighting for top and bottom performers

### Dashboard Filters
10. **AC-10:** Dashboard includes filters:
    - Date range selector (default: current month)
    - Property filter (all properties or specific property)
    - Refresh button to reload data
    - Auto-refresh every 5 minutes (configurable)

### API Endpoints
11. **AC-11:** Backend provides GET /api/v1/dashboard/executive endpoint that returns all KPIs and dashboard data in a single response

12. **AC-12:** Backend provides GET /api/v1/dashboard/kpis endpoint that returns just KPI cards data

13. **AC-13:** Backend provides GET /api/v1/dashboard/maintenance-queue endpoint that returns priority maintenance list

14. **AC-14:** Backend provides GET /api/v1/dashboard/pm-upcoming endpoint that returns upcoming PM jobs chart data

15. **AC-15:** Backend provides GET /api/v1/dashboard/lease-expirations endpoint that returns lease expiration timeline data

16. **AC-16:** Backend provides GET /api/v1/dashboard/alerts endpoint that returns critical alerts

17. **AC-17:** Backend provides GET /api/v1/dashboard/property-comparison endpoint that returns property performance table data

### Technical Requirements
18. **AC-18:** Dashboard data is cached for 5 minutes to reduce database load using Ehcache

19. **AC-19:** KPIs are calculated server-side using database aggregation queries for accuracy

20. **AC-20:** Frontend uses Recharts for all charts (bar, line, pie)

21. **AC-21:** Frontend uses shadcn/ui Card components for dashboard layout

22. **AC-22:** Skeleton loaders are displayed while dashboard data loads

23. **AC-23:** Dashboard layout is responsive for tablet devices

24. **AC-24:** Each KPI card supports drill-down capability (click to see details)

## Tasks / Subtasks

### Backend Tasks
- [ ] Task 1: Create Dashboard DTOs (AC: #11-17)
  - [ ] Create ExecutiveDashboardDto with all KPI fields
  - [ ] Create KpiCardDto for individual KPI data
  - [ ] Create MaintenanceQueueItemDto for priority queue items
  - [ ] Create PmJobChartDataDto for PM jobs chart
  - [ ] Create LeaseExpirationTimelineDto for lease timeline
  - [ ] Create AlertDto for critical alerts
  - [ ] Create PropertyComparisonDto for property table

- [ ] Task 2: Create DashboardRepository with aggregation queries (AC: #1-4, #19)
  - [ ] Query for net profit/loss calculation (revenue - expenses)
  - [ ] Query for occupancy rate calculation
  - [ ] Query for overdue maintenance count
  - [ ] Query for outstanding receivables with aging breakdown
  - [ ] Query for month-over-month comparison data

- [ ] Task 3: Create DashboardService with KPI calculations (AC: #1-9)
  - [ ] Implement getExecutiveDashboard() method
  - [ ] Implement getKpis() method
  - [ ] Implement getPriorityMaintenanceQueue() method
  - [ ] Implement getUpcomingPmJobs() method
  - [ ] Implement getLeaseExpirations() method
  - [ ] Implement getCriticalAlerts() method
  - [ ] Implement getPropertyComparison() method

- [ ] Task 4: Create DashboardController with REST endpoints (AC: #11-17)
  - [ ] GET /api/v1/dashboard/executive
  - [ ] GET /api/v1/dashboard/kpis
  - [ ] GET /api/v1/dashboard/maintenance-queue
  - [ ] GET /api/v1/dashboard/pm-upcoming
  - [ ] GET /api/v1/dashboard/lease-expirations
  - [ ] GET /api/v1/dashboard/alerts
  - [ ] GET /api/v1/dashboard/property-comparison

- [ ] Task 5: Configure Ehcache for dashboard data (AC: #18)
  - [ ] Add dashboard cache configuration to ehcache.xml
  - [ ] Set TTL to 5 minutes
  - [ ] Add @Cacheable annotations to service methods

- [ ] Task 6: Write unit tests for DashboardService
  - [ ] Test KPI calculations with known data
  - [ ] Test aggregation query results
  - [ ] Test cache eviction scenarios

### Frontend Tasks
- [ ] Task 7: Create TypeScript types and Zod schemas (AC: #11-17)
  - [ ] Create dashboard.ts with all dashboard types
  - [ ] Create Zod validation schemas for API responses

- [ ] Task 8: Create dashboard.service.ts API client (AC: #11-17)
  - [ ] Implement fetchExecutiveDashboard()
  - [ ] Implement fetchKpis()
  - [ ] Implement fetchMaintenanceQueue()
  - [ ] Implement fetchUpcomingPmJobs()
  - [ ] Implement fetchLeaseExpirations()
  - [ ] Implement fetchAlerts()
  - [ ] Implement fetchPropertyComparison()

- [ ] Task 9: Create useDashboard React Query hook
  - [ ] Implement hook with auto-refresh (5 min)
  - [ ] Handle loading, error, and success states

- [ ] Task 10: Create KpiCard component (AC: #1-4, #24)
  - [ ] Display value with proper formatting
  - [ ] Show trend indicator (up/down arrow)
  - [ ] Support click for drill-down
  - [ ] Use shadcn/ui Card

- [ ] Task 11: Create MaintenanceQueueCard component (AC: #5)
  - [ ] Display top 5 high priority work orders
  - [ ] Show work order details (number, property/unit, title, days overdue)
  - [ ] Highlight overdue items in red
  - [ ] Add "View All" link

- [ ] Task 12: Create PmJobsChart component (AC: #6)
  - [ ] Use Recharts BarChart
  - [ ] Display categories on Y-axis, count on X-axis
  - [ ] Color-code by status
  - [ ] Support click navigation

- [ ] Task 13: Create LeaseExpirationTimeline component (AC: #7)
  - [ ] Display 12-month timeline
  - [ ] Show month and count
  - [ ] Highlight months with > 5 expirations
  - [ ] Support click navigation

- [ ] Task 14: Create AlertsPanel component (AC: #8)
  - [ ] Group alerts by severity (urgent, warning, info)
  - [ ] Display count per type
  - [ ] Use appropriate colors (red, yellow, blue)
  - [ ] Support click to view details

- [ ] Task 15: Create PropertyComparisonTable component (AC: #9)
  - [ ] Display sortable data table
  - [ ] Show all required columns
  - [ ] Highlight top/bottom performers

- [ ] Task 16: Create DashboardFilters component (AC: #10)
  - [ ] Date range selector (default: current month)
  - [ ] Property dropdown filter
  - [ ] Refresh button
  - [ ] Auto-refresh toggle

- [ ] Task 17: Create Executive Dashboard page (AC: #20-23)
  - [ ] Implement responsive grid layout
  - [ ] Add skeleton loaders for all components
  - [ ] Integrate all dashboard components
  - [ ] Handle loading and error states

- [ ] Task 18: Write frontend unit tests
  - [ ] Test KpiCard component
  - [ ] Test PmJobsChart component
  - [ ] Test dashboard page rendering

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
- Use Spring Cache with Ehcache for 5-minute caching of dashboard data [Source: docs/architecture.md#Caching-Strategy]
- All financial amounts in AED only [Source: docs/architecture.md#ADR-004]
- Use Recharts for all chart components [Source: docs/architecture.md#Decision-Summary]
- Follow REST API response format with success/data/timestamp structure [Source: docs/architecture.md#API-Response-Format]

### Technical Implementation Notes
- KPI calculations should use database aggregation queries for performance
- Dashboard data endpoint should use a single optimized query where possible
- Implement proper null handling for properties with no data
- Consider partial loading for dashboard components that take longer
- Use database views or materialized views for complex aggregations if needed

### Project Structure Notes
- Backend: `controller/DashboardController.java`, `service/DashboardService.java`
- Frontend: `app/(dashboard)/page.tsx` is the executive dashboard
- Charts: `components/charts/` folder for reusable chart components

### Prerequisites
- Story 6.1 (done) - Invoice/Payment data for receivables
- Story 6.2 (done) - Expense data for profit/loss
- Story 4.1 (done) - Work order data for maintenance queue
- Story 4.2 (done) - PM schedule data for upcoming jobs
- Story 3.2 (done) - Property/Unit data for occupancy
- Story 3.6 (done) - Lease data for expirations

### References
- [Source: docs/epics/epic-8-dashboard-reporting.md#Story-8.1]
- [Source: docs/architecture.md#Dashboard-APIs]
- [Source: docs/architecture.md#Performance-Considerations]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-8/8-1-executive-summary-dashboard.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
