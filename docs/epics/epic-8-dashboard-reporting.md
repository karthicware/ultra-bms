# Epic 8: Dashboard & Reporting

**Goal:** Implement comprehensive dashboards and reporting to provide real-time insights into operations, finances, and property performance.

## Story 8.1: Executive Summary Dashboard

As an executive or property manager,
I want an executive dashboard with key performance indicators,
So that I can quickly understand the overall business health and identify issues.

**Acceptance Criteria:**

**Given** I am logged in as an authorized user
**When** I access the main dashboard
**Then** the executive dashboard displays:

**KPI Cards (Top Row):**
- **Net Profit/Loss (Current Month)**
  - Amount with currency
  - Percentage change vs. last month (green up arrow or red down arrow)
  - Calculated as: Total Revenue - Total Expenses (from Story 6.4)
- **Overall Occupancy Rate**
  - Percentage (occupied units / total units)
  - Change vs. last month
  - Drill-down to see by property
- **Overdue Maintenance Jobs**
  - Count of work orders with status != COMPLETED and scheduledDate < today
  - Click to view list
- **Outstanding Receivables**
  - Total amount from unpaid invoices
  - Aging breakdown (current, 30+, 60+, 90+)

**And** visual components:

**Priority Maintenance Queue (Card):**
- List of HIGH priority work orders (status: OPEN or ASSIGNED)
- Shows: work order number, property/unit, title, days overdue
- Limited to top 5, with "View All" link
- Red highlight for overdue items

**Upcoming PM Jobs (Card - 30-day view):**
- Bar chart showing PM jobs by category (next 30 days)
- Categories on Y-axis, count on X-axis
- Color-coded by status: scheduled, overdue
- Click category to view details

**Lease Expirations (Card - 12-month forecast):**
- Timeline showing lease expirations by month
- Shows: month, count of expiring leases
- Highlight months with > 5 expirations (renewal planning needed)
- Click to see list of expiring leases for that month

**Critical Alerts Panel (Card):**
- Color-coded alerts requiring attention:
  - Red (Urgent): Overdue compliance, bounced cheques, expired vendor licenses
  - Yellow (Warning): Documents expiring in 7 days, high-value invoices overdue
  - Blue (Info): Low occupancy rates, high maintenance costs
- Count per alert type
- Click to view alert details and take action

**And** property performance comparison:
- Table showing key metrics per property:
  - Property name
  - Occupancy rate
  - Maintenance cost (current month)
  - Revenue (current month)
  - Open work orders
- Sortable by any column
- Highlight top and bottom performers

**And** dashboard filters:
- Date range selector (default: current month)
- Property filter (all or specific properties)
- Refresh button to reload data
- Auto-refresh every 5 minutes (configurable)

**And** API endpoints:
- GET /api/v1/dashboard/executive: Get all KPIs and dashboard data
- GET /api/v1/dashboard/kpis: Get just KPI cards data
- GET /api/v1/dashboard/maintenance-queue: Get priority maintenance list
- GET /api/v1/dashboard/pm-upcoming: Get upcoming PM jobs chart data
- GET /api/v1/dashboard/lease-expirations: Get lease expiration timeline
- GET /api/v1/dashboard/alerts: Get critical alerts
- GET /api/v1/dashboard/property-comparison: Get property performance table

**Prerequisites:** All previous epics (data from all modules)

**Technical Notes:**
- Cache dashboard data for 5 minutes to reduce database load
- Use database aggregation queries for efficient KPI calculation
- Implement real-time updates using WebSocket (optional) or polling
- Frontend: Use Recharts for all charts (bar, line, pie)
- Use shadcn/ui Card components for dashboard layout
- Implement skeleton loaders while dashboard data loads
- Add export dashboard as PDF feature
- Ensure responsive layout for tablets
- Calculate KPIs server-side for accuracy
- Add drill-down capability for each KPI (click to see details)

## Story 8.3: Occupancy Dashboard

**Stitch Reference:** `docs/archive/stitch_building_maintenance_software/occupancy_module_dashboard/screen.png`

As a property manager,
I want a dedicated occupancy dashboard with portfolio metrics and lease tracking,
So that I can monitor occupancy rates and manage lease renewals effectively.

**Acceptance Criteria:**

**Given** I am logged in as PROPERTY_MANAGER or higher role
**When** I navigate to the Occupancy Dashboard
**Then** I see the following components:

**KPI Cards (Top Row):**
- **Portfolio Occupancy** - Percentage with visual indicator
- **Vacant Units** - Count of available units
- **Leases Expiring** - Count in configurable period (default: 100 days)
- **Average Rent/SqFt** - Currency amount

**Portfolio Occupancy Chart (Donut):**
- Segments: Occupied, Vacant, Under Renovation, Notice Period
- Center displays total units count
- Legend with percentages

**Lease Expirations by Month (Bar Chart):**
- X-axis: Next 12 months
- Y-axis: Count of expiring leases
- Color-coded bars (renewed vs pending)

**Upcoming Lease Expirations (List):**
- Table: Tenant, Unit, Property, Expiry Date, Days Remaining
- Sorted by expiry date ascending
- Quick actions: View Lease, Initiate Renewal

**Recent Activity Feed:**
- Timeline of lease-related activities
- Shows: action, tenant, unit, timestamp
- Limited to last 10 items

**And** API endpoints:
- GET /api/v1/dashboard/occupancy
- GET /api/v1/dashboard/occupancy/lease-expirations
- GET /api/v1/dashboard/occupancy/recent-activity

**Prerequisites:** Epic 4 (Tenant & Lease Management)

**Technical Notes:**
- Leases Expiring period is configurable via settings (default: 100 days)
- Use Recharts for donut and bar charts
- Implement role-based access (@PreAuthorize)
- Cache data for 5 minutes
- Add skeleton loaders during data fetch

---

## Story 8.4: Maintenance Dashboard

**Stitch Reference:** `docs/archive/stitch_building_maintenance_software/maintenance_module_dashboard/screen.png`

As a maintenance supervisor,
I want a dedicated maintenance dashboard with job metrics and status tracking,
So that I can monitor work orders and prioritize maintenance activities effectively.

**Acceptance Criteria:**

**Given** I am logged in as MAINTENANCE_SUPERVISOR or higher role
**When** I navigate to the Maintenance Dashboard
**Then** I see the following components:

**KPI Cards (Top Row):**
- **Active Jobs** - Count of non-completed work orders
- **Overdue Jobs** - Count where scheduledDate < today and status != COMPLETED (red highlight)
- **Pending Jobs** - Count with status OPEN
- **Jobs Completed (This Month)** - Count completed in current month

**Jobs by Status (Pie/Donut Chart):**
- Segments: Open, Assigned, In Progress, Completed, Cancelled
- Color-coded per status
- Click segment to filter job list

**Jobs by Priority (Bar Chart):**
- X-axis: Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Y-axis: Count
- Color gradient from green to red

**Jobs by Category (Bar Chart):**
- Categories: Plumbing, Electrical, HVAC, General, etc.
- Horizontal bars showing count per category
- Sorted by count descending

**High Priority & Overdue Jobs (List):**
- Table: Job #, Property/Unit, Title, Priority, Status, Assigned To, Days Overdue
- Filtered to HIGH/URGENT priority or overdue
- Red highlight for overdue items
- Quick actions: View, Assign, Update Status

**Recently Completed Jobs (List):**
- Table: Job #, Title, Property, Completed Date, Completed By
- Last 5 completed jobs
- Quick action: View Details

**And** API endpoints:
- GET /api/v1/dashboard/maintenance
- GET /api/v1/dashboard/maintenance/jobs-by-status
- GET /api/v1/dashboard/maintenance/jobs-by-priority
- GET /api/v1/dashboard/maintenance/jobs-by-category
- GET /api/v1/dashboard/maintenance/high-priority-overdue
- GET /api/v1/dashboard/maintenance/recently-completed

**Prerequisites:** Epic 5 (Maintenance & Work Orders)

**Technical Notes:**
- Use Recharts for pie and bar charts
- Implement click-to-filter functionality on chart segments
- Cache data for 5 minutes
- Add drill-down navigation to work order list

---

## Story 8.5: Vendor Dashboard

**Stitch Reference:** `docs/archive/stitch_building_maintenance_software/vendor_module_dashboard/screen.png`

As an administrator or property manager,
I want a dedicated vendor dashboard with performance metrics and document tracking,
So that I can monitor vendor performance and manage compliance effectively.

**Acceptance Criteria:**

**Given** I am logged in as ADMIN, PROPERTY_MANAGER, or MAINTENANCE_SUPERVISOR
**When** I navigate to the Vendor Dashboard
**Then** I see the following components:

**KPI Cards (Top Row):**
- **Total Active Vendors** - Count of active vendors
- **Avg SLA Compliance** - Percentage across all vendors
- **Top Performing Vendor** - Name with rating badge
- **Expiring Documents** - Count of documents expiring in 30 days

**Jobs by Specialization (Bar Chart):**
- X-axis: Specialization categories (Plumbing, Electrical, HVAC, etc.)
- Y-axis: Job count
- Shows distribution of work across specializations

**Vendor Performance Snapshot (Scatter Plot):**
- X-axis: SLA Compliance %
- Y-axis: Customer Rating (1-5)
- Bubble size: Number of completed jobs
- Hover shows vendor name and details

**Vendors with Expiring Documents (List):**
- Table: Vendor Name, Document Type, Expiry Date, Days Until Expiry
- Sorted by expiry date ascending
- Red highlight for < 7 days
- Quick action: View Vendor, Upload Document

**Top Vendors by Jobs (List):**
- Table: Rank, Vendor Name, Jobs Completed (This Month), Avg Rating
- Top 5 vendors by job volume
- Quick action: View Vendor Profile

**And** API endpoints:
- GET /api/v1/dashboard/vendor
- GET /api/v1/dashboard/vendor/jobs-by-specialization
- GET /api/v1/dashboard/vendor/performance-snapshot
- GET /api/v1/dashboard/vendor/expiring-documents
- GET /api/v1/dashboard/vendor/top-vendors

**Prerequisites:** Epic 5 (Vendor Management)

**Technical Notes:**
- Use Recharts ScatterChart for vendor performance snapshot
- Bubble size proportional to completed job count
- Cache data for 5 minutes
- Implement tooltip with vendor details on hover

---

## Story 8.6: Finance Dashboard

**Stitch Reference:** `docs/archive/stitch_building_maintenance_software/finance_module_dashboard/screen.png`

As a finance manager or administrator,
I want a dedicated finance dashboard with YTD metrics and transaction tracking,
So that I can monitor financial performance and manage receivables effectively.

**Acceptance Criteria:**

**Given** I am logged in as FINANCE_MANAGER or ADMIN
**When** I navigate to the Finance Dashboard
**Then** I see the following components:

**KPI Cards (Top Row):**
- **Total Income YTD** - Currency amount with trend indicator
- **Total Expenses YTD** - Currency amount with trend indicator
- **Net Profit/Loss YTD** - Currency amount (green/red based on value)
- **VAT Paid YTD** - Currency amount

**Income vs Expense (Stacked Bar Chart):**
- X-axis: Last 12 months
- Y-axis: Amount
- Stacked bars: Income (green), Expenses (red)
- Line overlay showing net profit/loss trend

**Top Expense Categories (Donut Chart):**
- Segments: Maintenance, Utilities, Salaries, Insurance, Other
- Percentages and amounts
- Click to drill down to expense list

**Outstanding Receivables (Summary Card):**
- Total amount outstanding
- Aging breakdown: Current, 30+, 60+, 90+ days
- Click to view invoice list

**Recent High-Value Transactions (List):**
- Table: Date, Type (Income/Expense), Description, Amount, Category
- Last 10 transactions above threshold
- Quick action: View Details

**PDC Status Summary (Card):**
- Due This Week: Count and amount
- Due This Month: Count and amount
- Awaiting Clearance: Count and amount
- Click to view PDC management

**And** API endpoints:
- GET /api/v1/dashboard/finance
- GET /api/v1/dashboard/finance/income-vs-expense
- GET /api/v1/dashboard/finance/expense-categories
- GET /api/v1/dashboard/finance/outstanding-receivables
- GET /api/v1/dashboard/finance/recent-transactions
- GET /api/v1/dashboard/finance/pdc-status

**Prerequisites:** Epic 6 (Financial Management)

**Technical Notes:**
- Use ComposedChart for income vs expense with line overlay
- Color-code net profit/loss (green positive, red negative)
- Cache data for 5 minutes
- Implement drill-down from donut chart to expense list

---

## Story 8.7: Assets Dashboard

**Stitch Reference:** `docs/archive/stitch_building_maintenance_software/assets_module_dashboard/screen.png`

As an administrator or property manager,
I want a dedicated assets dashboard with asset metrics and PM tracking,
So that I can monitor asset value and manage preventive maintenance effectively.

**Acceptance Criteria:**

**Given** I am logged in as ADMIN, PROPERTY_MANAGER, or MAINTENANCE_SUPERVISOR
**When** I navigate to the Assets Dashboard
**Then** I see the following components:

**KPI Cards (Top Row):**
- **Total Registered Assets** - Count of all assets
- **Total Asset Value** - Sum of all asset values (currency)
- **Assets with Overdue PM** - Count needing preventive maintenance
- **Most Expensive Asset (TCO)** - Name and total cost of ownership

**Assets by Category (Donut Chart):**
- Segments: HVAC, Electrical, Plumbing, Mechanical, Other
- Count and percentage per category
- Click to view category assets

**Top 5 Assets by Maintenance Spend (Bar Chart):**
- Horizontal bars showing maintenance cost
- Asset name on Y-axis
- Amount on X-axis
- Click to view asset details

**Overdue Preventive Maintenance (List):**
- Table: Asset Name, Category, Property, Last PM Date, Days Overdue
- Sorted by days overdue descending
- Red highlight for > 30 days overdue
- Quick action: Create Work Order

**Recently Added Assets (List):**
- Table: Asset Name, Category, Property, Added Date, Value
- Last 5 added assets
- Quick action: View Asset

**Asset Depreciation Summary (Card):**
- Original Value Total
- Current Value Total
- Total Depreciation
- Click for detailed report

**And** API endpoints:
- GET /api/v1/dashboard/assets
- GET /api/v1/dashboard/assets/by-category
- GET /api/v1/dashboard/assets/top-maintenance-spend
- GET /api/v1/dashboard/assets/overdue-pm
- GET /api/v1/dashboard/assets/recently-added
- GET /api/v1/dashboard/assets/depreciation-summary

**Prerequisites:** Epic 7 (Asset Management)

**Technical Notes:**
- Use horizontal BarChart for maintenance spend
- Calculate TCO as purchase price + total maintenance cost
- Cache data for 5 minutes
- Implement drill-down from donut chart to asset list

---

## E2E Testing Stories

**Note:** The following E2E test stories should be implemented AFTER all technical implementation stories (8.1, 8.3-8.7) are completed. Each E2E story corresponds to its technical story and contains comprehensive end-to-end tests covering all user flows.

## Story 8.1.e2e: E2E Tests for Executive Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the executive dashboard,
So that I can ensure KPIs and visualizations are accurate.

**Acceptance Criteria:**

**Given** Story 8.1 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**KPI Card Calculations:**
- Verify net profit/loss calculated correctly (revenue - expenses)
- Verify occupancy rate = (occupied units / total units) * 100
- Verify overdue maintenance count accurate
- Verify outstanding receivables sum correct

**Dashboard Charts:**
- Verify all charts render without errors
- Click chart elements → verify drill-down navigation works
- Filter by date range → verify charts update

**Critical Alerts:**
- Create overdue compliance item → verify appears in alerts panel
- Create bounced cheque → verify alert shown

**Prerequisites:** Story 8.1 (status: done)

**Technical Notes:**
- Test KPI calculations with known data
- Verify chart rendering
- Test drill-down functionality
- Verify auto-refresh mechanism

## Story 8.3.e2e: E2E Tests for Occupancy Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the occupancy dashboard,
So that I can ensure occupancy metrics and lease tracking are accurate.

**Acceptance Criteria:**

**Given** Story 8.3 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**KPI Accuracy:**
- Verify portfolio occupancy percentage matches database
- Verify vacant units count accurate
- Verify leases expiring count with configurable period
- Test configurable lease expiry period (default 100 days)

**Chart Functionality:**
- Verify donut chart segments match unit status
- Verify bar chart shows correct monthly data
- Click chart elements → verify navigation works

**List Functionality:**
- Verify upcoming lease expirations sorted correctly
- Test quick actions (View Lease, Initiate Renewal)
- Verify recent activity feed displays correctly

**Prerequisites:** Story 8.3 (status: done)

## Story 8.4.e2e: E2E Tests for Maintenance Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the maintenance dashboard,
So that I can ensure job metrics and status tracking are accurate.

**Acceptance Criteria:**

**Given** Story 8.4 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**KPI Accuracy:**
- Verify active jobs count matches database
- Verify overdue jobs count (scheduledDate < today)
- Verify pending jobs count (status = OPEN)
- Verify jobs completed this month count

**Chart Interactions:**
- Click pie chart segment → verify job list filters
- Verify priority bar chart color coding
- Verify category bar chart sorted correctly

**List Functionality:**
- Verify high priority & overdue list filtering
- Test quick actions (View, Assign, Update Status)
- Verify recently completed jobs list

**Prerequisites:** Story 8.4 (status: done)

## Story 8.5.e2e: E2E Tests for Vendor Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the vendor dashboard,
So that I can ensure vendor performance metrics are accurate.

**Acceptance Criteria:**

**Given** Story 8.5 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**KPI Accuracy:**
- Verify total active vendors count
- Verify average SLA compliance calculation
- Verify top performing vendor identification
- Verify expiring documents count (30 days)

**Scatter Plot:**
- Verify vendor positions match SLA/rating data
- Hover vendor bubble → verify tooltip details
- Verify bubble size proportional to job count

**List Functionality:**
- Verify expiring documents sorted by date
- Test red highlight for < 7 days expiry
- Verify top vendors list ranking

**Prerequisites:** Story 8.5 (status: done)

## Story 8.6.e2e: E2E Tests for Finance Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the finance dashboard,
So that I can ensure financial metrics are accurate.

**Acceptance Criteria:**

**Given** Story 8.6 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**KPI Accuracy:**
- Verify total income YTD matches database
- Verify total expenses YTD calculation
- Verify net profit/loss calculation
- Verify VAT paid YTD amount

**Chart Functionality:**
- Verify stacked bar chart shows monthly data
- Verify line overlay trend is accurate
- Click donut segment → verify drill-down works

**Receivables and PDC:**
- Verify outstanding receivables aging breakdown
- Verify PDC status summary counts
- Test navigation to PDC management

**Prerequisites:** Story 8.6 (status: done)

## Story 8.7.e2e: E2E Tests for Assets Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the assets dashboard,
So that I can ensure asset metrics and PM tracking are accurate.

**Acceptance Criteria:**

**Given** Story 8.7 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**KPI Accuracy:**
- Verify total registered assets count
- Verify total asset value sum
- Verify assets with overdue PM count
- Verify TCO calculation for most expensive asset

**Chart Functionality:**
- Verify donut chart category breakdown
- Click category → verify asset list navigation
- Verify bar chart shows top 5 by maintenance spend

**List Functionality:**
- Verify overdue PM list sorted by days overdue
- Test red highlight for > 30 days overdue
- Test Create Work Order quick action
- Verify recently added assets list

**Depreciation:**
- Verify depreciation summary calculations
- Test navigation to detailed report

**Prerequisites:** Story 8.7 (status: done)

---
