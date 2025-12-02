# Story 8.4: Maintenance Dashboard

Status: review

## Story

As a maintenance supervisor,
I want a dedicated maintenance dashboard with job metrics and status tracking,
So that I can monitor work orders and prioritize maintenance activities effectively.

## Acceptance Criteria

### KPI Cards (Top Row)
1. **AC-1:** Dashboard displays Active Jobs KPI card showing:
   - Count of non-completed work orders (status != COMPLETED and != CANCELLED)
   - Click navigates to active jobs list

2. **AC-2:** Dashboard displays Overdue Jobs KPI card showing:
   - Count where scheduledDate < today and status != COMPLETED
   - Red highlight styling for urgency
   - Click navigates to overdue jobs list

3. **AC-3:** Dashboard displays Pending Jobs KPI card showing:
   - Count with status = OPEN (not yet assigned)
   - Click navigates to pending jobs list

4. **AC-4:** Dashboard displays Jobs Completed (This Month) KPI card showing:
   - Count of jobs completed in current month
   - Comparison to previous month

### Jobs by Status Chart (Pie/Donut)
5. **AC-5:** Jobs by Status chart displays:
   - Segments: Open, Assigned, In Progress, Completed, Cancelled
   - Color-coded per status using consistent color scheme
   - Click segment filters the high priority & overdue jobs list
   - Legend with counts and percentages

### Jobs by Priority Chart (Bar)
6. **AC-6:** Jobs by Priority bar chart displays:
   - X-axis: Priority levels (LOW, MEDIUM, HIGH, URGENT)
   - Y-axis: Count
   - Color gradient from green (LOW) to red (URGENT)
   - Click bar navigates to filtered job list

### Jobs by Category Chart (Horizontal Bar)
7. **AC-7:** Jobs by Category bar chart displays:
   - Categories: Plumbing, Electrical, HVAC, General, etc.
   - Horizontal bars showing count per category
   - Sorted by count descending
   - Click category navigates to category job list

### High Priority & Overdue Jobs List
8. **AC-8:** High Priority & Overdue Jobs table displays:
   - Columns: Job #, Property/Unit, Title, Priority, Status, Assigned To, Days Overdue
   - Filtered to HIGH/URGENT priority OR overdue items
   - Red highlight for overdue items
   - Quick actions: View, Assign, Update Status
   - Sortable columns
   - Pagination

### Recently Completed Jobs List
9. **AC-9:** Recently Completed Jobs table displays:
   - Columns: Job #, Title, Property, Completed Date, Completed By
   - Last 5 completed jobs
   - Quick action: View Details

### API Endpoints
10. **AC-10:** Backend provides GET /api/v1/dashboard/maintenance endpoint returning all dashboard data

11. **AC-11:** Backend provides GET /api/v1/dashboard/maintenance/jobs-by-status endpoint

12. **AC-12:** Backend provides GET /api/v1/dashboard/maintenance/jobs-by-priority endpoint

13. **AC-13:** Backend provides GET /api/v1/dashboard/maintenance/jobs-by-category endpoint

14. **AC-14:** Backend provides GET /api/v1/dashboard/maintenance/high-priority-overdue endpoint with pagination

15. **AC-15:** Backend provides GET /api/v1/dashboard/maintenance/recently-completed endpoint

### Technical Requirements
16. **AC-16:** Frontend uses Recharts for pie and bar charts

17. **AC-17:** Click-to-filter functionality implemented on chart segments

18. **AC-18:** Dashboard data cached for 5 minutes using Ehcache

19. **AC-19:** Drill-down navigation to work order list implemented

20. **AC-20:** Role-based access for MAINTENANCE_SUPERVISOR or higher

21. **AC-21:** All interactive elements have data-testid attributes

## Tasks / Subtasks

### Backend Tasks
- [ ] Task 1: Create Maintenance Dashboard DTOs (AC: #10-15)
  - [ ] Create MaintenanceDashboardDto with all fields
  - [ ] Create MaintenanceKpiDto for KPI cards
  - [ ] Create JobsByStatusDto for pie chart
  - [ ] Create JobsByPriorityDto for priority bar chart
  - [ ] Create JobsByCategoryDto for category bar chart
  - [ ] Create HighPriorityJobDto for high priority list
  - [ ] Create RecentlyCompletedJobDto for completed list

- [ ] Task 2: Create MaintenanceDashboardRepository queries (AC: #1-9)
  - [ ] Query for active jobs count (non-completed)
  - [ ] Query for overdue jobs count
  - [ ] Query for pending jobs count (status = OPEN)
  - [ ] Query for jobs completed this month
  - [ ] Query for jobs grouped by status
  - [ ] Query for jobs grouped by priority
  - [ ] Query for jobs grouped by category
  - [ ] Query for high priority and overdue jobs with pagination
  - [ ] Query for recently completed jobs

- [ ] Task 3: Create MaintenanceDashboardService (AC: #1-9, #18)
  - [ ] Implement getMaintenanceDashboard() method
  - [ ] Implement getJobsByStatus() method
  - [ ] Implement getJobsByPriority() method
  - [ ] Implement getJobsByCategory() method
  - [ ] Implement getHighPriorityAndOverdueJobs() method
  - [ ] Implement getRecentlyCompletedJobs() method
  - [ ] Add Ehcache caching with 5-minute TTL

- [ ] Task 4: Create MaintenanceDashboardController (AC: #10-15, #20)
  - [ ] GET /api/v1/dashboard/maintenance
  - [ ] GET /api/v1/dashboard/maintenance/jobs-by-status
  - [ ] GET /api/v1/dashboard/maintenance/jobs-by-priority
  - [ ] GET /api/v1/dashboard/maintenance/jobs-by-category
  - [ ] GET /api/v1/dashboard/maintenance/high-priority-overdue
  - [ ] GET /api/v1/dashboard/maintenance/recently-completed
  - [ ] Add @PreAuthorize for MAINTENANCE_SUPERVISOR role

- [ ] Task 5: Write unit tests for MaintenanceDashboardService
  - [ ] Test KPI calculations
  - [ ] Test chart data aggregations
  - [ ] Test pagination for high priority list

### Frontend Tasks
- [ ] Task 6: Create TypeScript types for maintenance dashboard
  - [ ] Create maintenance-dashboard.ts types
  - [ ] Create Zod validation schemas

- [ ] Task 7: Create maintenance-dashboard.service.ts API client
  - [ ] Implement fetchMaintenanceDashboard()
  - [ ] Implement fetchJobsByStatus()
  - [ ] Implement fetchJobsByPriority()
  - [ ] Implement fetchJobsByCategory()
  - [ ] Implement fetchHighPriorityOverdueJobs()
  - [ ] Implement fetchRecentlyCompletedJobs()

- [ ] Task 8: Create useMaintenanceDashboard React Query hook
  - [ ] Implement hook with auto-refresh
  - [ ] Handle filter state for chart interactions

- [ ] Task 9: Create MaintenanceKpiCards component (AC: #1-4)
  - [ ] Display 4 KPI cards in a row
  - [ ] Red highlight for overdue jobs card
  - [ ] Click navigation to filtered lists
  - [ ] Add data-testid attributes

- [ ] Task 10: Create JobsByStatusChart component (AC: #5, #17)
  - [ ] Use Recharts PieChart
  - [ ] Implement click-to-filter functionality
  - [ ] Color-code by status
  - [ ] Add legend with counts

- [ ] Task 11: Create JobsByPriorityChart component (AC: #6)
  - [ ] Use Recharts BarChart
  - [ ] Color gradient from green to red
  - [ ] Click navigation support

- [ ] Task 12: Create JobsByCategoryChart component (AC: #7)
  - [ ] Use Recharts horizontal BarChart
  - [ ] Sort by count descending
  - [ ] Click navigation support

- [ ] Task 13: Create HighPriorityOverdueTable component (AC: #8)
  - [ ] Create sortable data table
  - [ ] Red highlight for overdue items
  - [ ] Quick action buttons
  - [ ] Pagination support
  - [ ] Add data-testid attributes

- [ ] Task 14: Create RecentlyCompletedList component (AC: #9)
  - [ ] Display last 5 completed jobs
  - [ ] View Details quick action

- [ ] Task 15: Create Maintenance Dashboard page (AC: #16, #19, #21)
  - [ ] Create page at app/(dashboard)/maintenance/dashboard/page.tsx
  - [ ] Implement responsive grid layout
  - [ ] Add skeleton loaders for all components
  - [ ] Integrate all components with filter state
  - [ ] Implement drill-down navigation

- [ ] Task 16: Write frontend unit tests
  - [ ] Test MaintenanceKpiCards component
  - [ ] Test JobsByStatusChart with click interactions
  - [ ] Test HighPriorityOverdueTable component

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
   | Job KPIs (Active, Overdue, Pending, Completed) | `statistics-component-01` | `npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-01"` |
   | Jobs by Status Pie | `chart-component-03` | `npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-03"` |
   | High Priority/Overdue List | `widget-component-17` | `npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-17"` |
   | Recently Completed List | `widget-component-15` | `npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-15"` |

2. **Fallback:** If no matching shadcn-studio-mcp block, use shadcn-mcp or manual shadcn/ui components

### Relevant Architecture Patterns
- Use Spring Cache with Ehcache for 5-minute caching [Source: docs/architecture.md#Caching-Strategy]
- Use Recharts for all charts [Source: docs/architecture.md#Decision-Summary]
- Role-based access with @PreAuthorize [Source: docs/architecture.md#Role-Based-Access-Control]
- Follow REST API conventions [Source: docs/architecture.md#REST-API-Conventions]

### Technical Implementation Notes
- Work order statuses: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
- Work order priorities: LOW, MEDIUM, HIGH, URGENT
- Work order categories from existing category enum in work orders module
- Overdue calculation: scheduledDate < currentDate AND status NOT IN (COMPLETED, CANCELLED)
- Chart click interaction should update filter state and re-filter the table

### Project Structure Notes
- Backend: `controller/MaintenanceDashboardController.java`, `service/MaintenanceDashboardService.java`
- Frontend: `app/(dashboard)/maintenance/dashboard/page.tsx`
- Reuse existing work order types from `types/work-order.ts`

### Stitch Design Reference
- Reference design: `docs/archive/stitch_building_maintenance_software/maintenance_module_dashboard/screen.png`

### Prerequisites
- Story 4.1 (done) - Work order creation and management
- Story 4.2 (done) - Preventive maintenance scheduling
- Story 4.3 (done) - Work order assignment
- Story 4.4 (done) - Job progress tracking and completion

### References
- [Source: docs/epics/epic-8-dashboard-reporting.md#Story-8.4]
- [Source: docs/architecture.md#Maintenance-Management]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-8/8-4-maintenance-dashboard.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
