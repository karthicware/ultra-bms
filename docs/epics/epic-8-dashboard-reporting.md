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

## Story 8.2: Operational Dashboards

As a department user (maintenance supervisor, finance manager),
I want role-specific operational dashboards,
So that I can monitor and manage my area of responsibility effectively.

**Acceptance Criteria:**

**Given** I am logged in with a specific role
**When** I access my operational dashboard
**Then** I see role-appropriate information:

**Maintenance Dashboard (for MAINTENANCE_SUPERVISOR):**

- **KPI Cards:**
  - Open work orders (count)
  - In-progress work orders (count)
  - Completed this month (count)
  - Average completion time (days)

- **Work Order Status Chart:**
  - Pie chart: distribution by status (OPEN, ASSIGNED, IN_PROGRESS, COMPLETED)
  - Click slice to filter work order list

- **Work Orders by Category:**
  - Bar chart showing count by category (PLUMBING, ELECTRICAL, etc.)
  - Identify most common issues

- **Work Order List:**
  - Filterable, sortable table
  - Shows: number, property/unit, category, priority, status, scheduled date, assigned to
  - Quick actions: View, Assign, Update Status

- **Vendor Performance:**
  - List of top 5 vendors by jobs completed this month
  - Shows: vendor name, jobs completed, average rating, on-time rate
  - Click to view vendor details

**Financial Dashboard (for FINANCE_MANAGER):**

- **KPI Cards:**
  - Total revenue (current month)
  - Total expenses (current month)
  - Net profit/loss (current month)
  - Collection rate (payments received / invoices issued)

- **Income vs. Expense Chart:**
  - Line chart showing monthly trend (last 12 months)
  - Two lines: income (green) and expenses (red)
  - Net profit/loss area in between

- **Revenue Breakdown:**
  - Pie chart: rent, service charges, parking, other
  - Shows percentage and amount for each

- **Expense Breakdown:**
  - Pie chart: maintenance, utilities, salaries, other
  - Click to see detailed expense list

- **Outstanding Invoices:**
  - Table of unpaid invoices (sorted by due date)
  - Shows: invoice number, tenant, amount, due date, days overdue
  - Quick actions: View, Record Payment

- **PDC Status:**
  - Summary of PDC status (from Story 6.3):
    - Due this week
    - Due this month
    - Deposited awaiting clearance
    - Recently bounced
  - Click to view PDC management page

**Occupancy Dashboard (for PROPERTY_MANAGER):**

- **KPI Cards:**
  - Overall occupancy rate (percentage)
  - Vacant units (count)
  - Leases expiring (next 90 days)
  - Average rent per sqft

- **Occupancy by Property:**
  - Bar chart showing occupancy rate per property
  - Identify underperforming properties

- **Unit Status Breakdown:**
  - Pie chart: occupied, vacant, under renovation, notice period
  - Count and percentage for each

- **Vacant Units List:**
  - Table of available units
  - Shows: property, unit number, type, size, rent, days vacant
  - Sort by days vacant to prioritize leasing
  - Quick action: Create Lead/Lease

- **Lease Expiration Timeline:**
  - Calendar view of upcoming expirations (next 6 months)
  - Color-coded: renewed (green), pending renewal (yellow), notice given (red)
  - Click date to see leases expiring that month

- **Tenant Satisfaction:**
  - Average rating from maintenance request feedback
  - Top 3 properties by satisfaction
  - Bottom 3 properties needing attention

**And** dashboard navigation:
- Sidebar or tab navigation between dashboards
- Breadcrumb showing current dashboard
- Quick switch dropdown to change dashboard

**And** common features across all dashboards:
- Date range filter
- Property filter (if applicable to role)
- Export to PDF/Excel
- Print-friendly layout
- Refresh button and auto-refresh

**And** API endpoints:
- GET /api/v1/dashboard/maintenance: Get maintenance dashboard data
- GET /api/v1/dashboard/financial: Get financial dashboard data
- GET /api/v1/dashboard/occupancy: Get occupancy dashboard data
- Each dashboard endpoint returns all charts and tables data

**Prerequisites:** All previous epics

**Technical Notes:**
- Implement role-based dashboard access (@PreAuthorize)
- Cache dashboard data per role (5-minute TTL)
- Use database views for complex queries
- Frontend: Consistent chart styling across dashboards
- Use shadcn/ui Tabs for dashboard navigation
- Implement drill-down from charts to detailed lists
- Add data export functionality for each dashboard
- Ensure mobile-friendly layouts
- Display loading states with skeleton screens
- Add customization: users can hide/show dashboard widgets (optional)

---
