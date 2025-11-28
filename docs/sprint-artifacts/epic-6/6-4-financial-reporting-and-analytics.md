# Story 6.4: Financial Reporting and Analytics

Status: ready

## Story

As a finance manager,
I want to view financial reports and analytics,
So that I can understand income, expenses, and profitability to make informed business decisions.

## Acceptance Criteria

1. **AC1 - Income Statement (P&L) Report Page:** Create page at /finance/reports/income-statement. Includes: Date range selector (default: current month), Property filter (all properties or specific dropdown), Revenue section (rental income, service charges, parking fees, late fees, other income, total revenue), Expense section (maintenance, utilities, salaries, supplies, insurance, taxes, other expenses, total expenses), Net profit/loss calculation (total revenue - total expenses), Profit margin percentage. Page has data-testid="page-income-statement". [Source: docs/epics/epic-6-financial-management.md#story-64]

2. **AC2 - Cash Flow Summary Report:** Create page at /finance/reports/cash-flow. Shows: Cash inflows (payments received from invoices), Cash outflows (expenses paid), Net cash flow (inflows - outflows), Month-over-month comparison chart. Date range selector. Property filter. Page has data-testid="page-cash-flow". [Source: docs/epics/epic-6-financial-management.md#story-64]

3. **AC3 - Accounts Receivable Aging Report:** Create page at /finance/reports/receivables-aging. Shows outstanding invoices grouped by age: Current (not yet due), 1-30 days overdue, 31-60 days overdue, 61-90 days overdue, 90+ days overdue. Each bucket shows: count, total amount, percentage of total. Summary shows: Total outstanding amount, Collection rate percentage (paid/issued). Click bucket to drill-down to invoice list. Page has data-testid="page-ar-aging". [Source: docs/epics/epic-6-financial-management.md#story-64]

4. **AC4 - Revenue Breakdown Charts:** Create revenue analytics section on /finance/reports/revenue. Charts include: Revenue by property (pie chart using Recharts PieChart), Revenue by type (rent, service charges, parking, other - pie chart), Monthly revenue trend (line chart for last 12 months using Recharts LineChart), Year-over-year comparison (bar chart). Date range selector. Click chart segment to drill-down. Charts have data-testid="chart-revenue-*". [Source: docs/epics/epic-6-financial-management.md#story-64]

5. **AC5 - Expense Breakdown Charts:** Create expense analytics section on /finance/reports/expenses. Charts include: Expenses by category (pie chart), Monthly expense trend (line chart for last 12 months), Top 5 vendors by payment amount (horizontal bar chart), Maintenance cost per property (bar chart). Date range selector. Property filter. Charts have data-testid="chart-expense-*". [Source: docs/epics/epic-6-financial-management.md#story-64]

6. **AC6 - Financial Dashboard Page:** Create main financial dashboard at /finance/reports (or /finance/dashboard). KPI cards showing: Total revenue (current month with % change from previous), Total expenses (current month with % change), Net profit/loss (current month), Collection rate (payments received / invoices issued as percentage), Outstanding receivables total. Quick insights panel: Revenue growth vs last month, Expense growth vs last month, Top performing property (by revenue), Highest expense category. Dashboard has data-testid="page-finance-dashboard". [Source: docs/epics/epic-6-financial-management.md#story-64]

7. **AC7 - Export to PDF:** Implement PDF export for all reports. "Export PDF" button on each report page. PDF includes: Report title, date range, property filter applied, all data tables, charts rendered as images, Net profit/loss highlighted. Use iTextPDF or Apache PDFBox (backend) or jsPDF (frontend). PDF filename format: {report-type}_{date-range}.pdf. [Source: docs/epics/epic-6-financial-management.md#story-64]

8. **AC8 - Export to Excel:** Implement Excel/CSV export for all reports. "Export Excel" button on each report page. Excel includes: Multiple sheets (P&L, Cash Flow, AR Aging summary), Data in tabular format, Formulas for calculations where applicable, Conditional formatting for negative values (red). Use Apache POI (backend) or xlsx library (frontend). Export button has data-testid="btn-export-excel". [Source: docs/epics/epic-6-financial-management.md#story-64]

9. **AC9 - Email Reports:** Implement email report functionality. "Email Report" button on report pages. Modal to enter: Recipient email addresses (comma-separated, max 10), Optional message/notes. Send email with PDF attachment. Use existing EmailService. Track sent reports in audit log. Email button has data-testid="btn-email-report". [Source: docs/epics/epic-6-financial-management.md#story-64]

10. **AC10 - Income Statement API:** GET /api/v1/reports/income-statement endpoint. Query params: startDate, endDate (required), propertyId (optional). Response includes: revenueBreakdown (rentalIncome, serviceCharges, parkingFees, lateFees, otherIncome, totalRevenue), expenseBreakdown (maintenance, utilities, salaries, supplies, insurance, taxes, otherExpenses, totalExpenses), netProfitLoss, profitMarginPercentage. Calculate from invoices (revenue) and expenses tables. [Source: docs/epics/epic-6-financial-management.md#story-64]

11. **AC11 - Cash Flow API:** GET /api/v1/reports/cash-flow endpoint. Query params: startDate, endDate, propertyId (optional). Response includes: cashInflows (total payments received), cashOutflows (total expenses paid), netCashFlow, monthOverMonthComparison (array of {month, inflows, outflows, net}). Calculate from payments and expenses tables where paymentStatus = PAID. [Source: docs/epics/epic-6-financial-management.md#story-64]

12. **AC12 - AR Aging API:** GET /api/v1/reports/receivables-aging endpoint. Query params: propertyId (optional), asOfDate (default: today). Response includes: agingBuckets array with {bucket: "Current|1-30|31-60|61-90|90+", count, amount, percentage}, totalOutstanding, collectionRate (calculated as total paid / total issued for period). Calculate from invoices where status != PAID. [Source: docs/epics/epic-6-financial-management.md#story-64]

13. **AC13 - Revenue Breakdown API:** GET /api/v1/reports/revenue-breakdown endpoint. Query params: startDate, endDate, propertyId (optional). Response includes: byProperty (array of {propertyId, propertyName, amount, percentage}), byType (array of {type: "RENT|SERVICE_CHARGE|PARKING|LATE_FEE|OTHER", amount, percentage}), monthlyTrend (array of {month, amount} for last 12 months), yearOverYear (array of {year, amount}). [Source: docs/epics/epic-6-financial-management.md#story-64]

14. **AC14 - Expense Breakdown API:** GET /api/v1/reports/expense-breakdown endpoint. Query params: startDate, endDate, propertyId (optional). Response includes: byCategory (array of {category, amount, percentage}), monthlyTrend (array of {month, amount} for last 12 months), topVendors (array of {vendorId, vendorName, totalPaid} top 5), maintenanceCostByProperty (array of {propertyId, propertyName, amount}). [Source: docs/epics/epic-6-financial-management.md#story-64]

15. **AC15 - Financial Dashboard API:** GET /api/v1/reports/financial-dashboard endpoint. Query params: propertyId (optional). Response includes: totalRevenue (current month), totalExpenses (current month), netProfitLoss, collectionRate, outstandingReceivables, revenueGrowth (% vs previous month), expenseGrowth (%, vs previous month), topPerformingProperty (propertyId, propertyName, revenue), highestExpenseCategory (category, amount). Cache response for 1 hour (configurable). [Source: docs/epics/epic-6-financial-management.md#story-64]

16. **AC16 - PDF Export API:** GET /api/v1/reports/export/pdf endpoint. Query params: reportType (income-statement|cash-flow|ar-aging|revenue|expenses), startDate, endDate, propertyId (optional). Returns PDF file as application/pdf. Use iTextPDF library. Include charts as embedded images. Filename in Content-Disposition header. [Source: docs/epics/epic-6-financial-management.md#story-64]

17. **AC17 - Excel Export API:** GET /api/v1/reports/export/excel endpoint. Query params: reportType, startDate, endDate, propertyId (optional). Returns Excel file as application/vnd.openxmlformats-officedocument.spreadsheetml.sheet. Use Apache POI library. Multiple sheets based on report type. Filename in Content-Disposition header. [Source: docs/epics/epic-6-financial-management.md#story-64]

18. **AC18 - Report TypeScript Types:** Create types/reports.ts with interfaces: IncomeStatement (revenue/expense breakdowns, totals), CashFlowSummary, ARAgingReport (buckets, totals), RevenueBreakdown (byProperty, byType, trends), ExpenseBreakdown, FinancialDashboard (KPIs, insights), ExportFormat enum (PDF, EXCEL, CSV), ReportType enum. Export from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

19. **AC19 - Report Frontend Service:** Create services/reports.service.ts with methods: getIncomeStatement(params), getCashFlow(params), getARAging(params), getRevenueBreakdown(params), getExpenseBreakdown(params), getFinancialDashboard(params), exportPDF(reportType, params), exportExcel(reportType, params), emailReport(reportType, params, recipients, message). Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

20. **AC20 - Report React Query Hooks:** Create hooks/useReports.ts with: useIncomeStatement(params) query, useCashFlow(params) query, useARAging(params) query, useRevenueBreakdown(params) query, useExpenseBreakdown(params) query, useFinancialDashboard(params) query, useExportPDF() mutation, useExportExcel() mutation, useEmailReport() mutation. StaleTime: 5 minutes for dashboard, 15 minutes for reports. [Source: docs/architecture.md#custom-hook-pattern]

21. **AC21 - Report Service Layer:** Create ReportService interface and ReportServiceImpl with methods: getIncomeStatement(startDate, endDate, propertyId), getCashFlow(startDate, endDate, propertyId), getARAging(asOfDate, propertyId), getRevenueBreakdown(startDate, endDate, propertyId), getExpenseBreakdown(startDate, endDate, propertyId), getFinancialDashboard(propertyId), exportToPDF(reportType, params), exportToExcel(reportType, params). Use @Cacheable for dashboard (1 hour TTL). All calculations server-side using database aggregation queries. [Source: docs/architecture.md#service-pattern]

22. **AC22 - Report Controller:** Create ReportController with REST endpoints: GET /api/v1/reports/income-statement, GET /api/v1/reports/cash-flow, GET /api/v1/reports/receivables-aging, GET /api/v1/reports/revenue-breakdown, GET /api/v1/reports/expense-breakdown, GET /api/v1/reports/financial-dashboard, GET /api/v1/reports/export/pdf, GET /api/v1/reports/export/excel, POST /api/v1/reports/email. All endpoints require ADMIN, PROPERTY_MANAGER, or FINANCE_MANAGER role. Use @RequestParam for query params. [Source: docs/architecture.md#controller-pattern]

23. **AC23 - Report DTOs:** Create DTOs: IncomeStatementDto (revenueBreakdown, expenseBreakdown, netProfitLoss, profitMargin), CashFlowSummaryDto (inflows, outflows, net, monthComparison), ARAgingDto (buckets, totalOutstanding, collectionRate), RevenueBreakdownDto (byProperty, byType, monthlyTrend, yearOverYear), ExpenseBreakdownDto (byCategory, monthlyTrend, topVendors, maintenanceByProperty), FinancialDashboardDto (KPIs, insights), ExportRequestDto (reportType, startDate, endDate, propertyId), EmailReportDto (reportType, recipients, message). [Source: docs/architecture.md#dto-pattern]

24. **AC24 - Database Aggregation Queries:** Create efficient aggregation queries in InvoiceRepository: sumByInvoiceTypeAndDateRange(type, startDate, endDate, propertyId), countByStatusAndDateRange(status, startDate, endDate), getAgingBuckets(asOfDate, propertyId). In ExpenseRepository: sumByCategoryAndDateRange(category, startDate, endDate, propertyId), getTopVendorsByPayment(startDate, endDate, limit), getMaintenanceCostByProperty(startDate, endDate). In PaymentRepository: sumByDateRange(startDate, endDate, propertyId). Use native queries with GROUP BY for performance. [Source: docs/architecture.md#query-optimization]

25. **AC25 - Recharts Integration:** Use Recharts library for all charts. Components: PieChart for breakdowns, LineChart for trends, BarChart for comparisons, ResponsiveContainer for responsive sizing. Consistent color palette using Airbnb-inspired colors (coral/salmon theme). Chart tooltips with formatted values (AED currency). Legend positioning below charts. All charts must be responsive. [Source: docs/architecture.md#charts]

26. **AC26 - Date Range Selector Component:** Create reusable DateRangeSelector component. Presets: This Month, Last Month, This Quarter, Last Quarter, This Year, Last Year, Custom. Custom mode uses shadcn Calendar with date range selection. Default: Current month. Store selection in URL query params for shareability. Component has data-testid="date-range-selector". [Source: UI consistency requirement]

27. **AC27 - Property Filter Component:** Create reusable PropertyFilter component. Dropdown with "All Properties" option plus list of properties from PropertyService. Store selection in URL query params. Works with date range selector. Component has data-testid="property-filter". [Source: UI consistency requirement]

28. **AC28 - Drill-Down Navigation:** Implement drill-down capability. Click pie chart segment → navigate to filtered list (e.g., click "RENT" → invoices filtered by type=RENT). Click AR aging bucket → navigate to invoices filtered by overdue range. Click property in revenue chart → navigate to property-specific P&L. Use router.push with query params. [Source: docs/epics/epic-6-financial-management.md#story-64]

29. **AC29 - Dashboard Caching:** Implement server-side caching for dashboard endpoint. Use Spring Cache with @Cacheable annotation. Cache key includes propertyId. TTL: 1 hour (configurable via application.yml). Manual cache refresh: POST /api/v1/reports/financial-dashboard/refresh with @CacheEvict. Frontend uses React Query with staleTime: 5 minutes. [Source: docs/architecture.md#caching-strategy]

30. **AC30 - Export File Generation:** Backend PDF generation using iTextPDF: Include header with company name (from CompanyProfile if available), report title, date range, generate tables and embed chart images. Backend Excel generation using Apache POI: Create workbook with multiple sheets, format cells (currency, percentage), add conditional formatting for negative values. Set Content-Disposition header with filename. [Source: docs/epics/epic-6-financial-management.md#story-64]

31. **AC31 - Comparative Reporting:** Add "Compare with previous period" toggle on reports. When enabled: Show current vs previous period columns side-by-side, Calculate variance (amount and percentage), Color-code variance (green positive, red negative). Available on Income Statement, Cash Flow, Revenue pages. Toggle has data-testid="toggle-compare-period". [Source: docs/epics/epic-6-financial-management.md#story-64]

32. **AC32 - Responsive Design:** All report pages must be responsive. Mobile (<640px): Single column layout, Charts scale down with ResponsiveContainer, Tables convert to card layout, Export buttons in bottom sticky bar. Tablet (640-1024px): Two-column grid for KPIs, Full-width charts. Desktop (>1024px): Multi-column dashboard layout. Dark theme support for all charts and tables. [Source: docs/architecture.md#styling-conventions]

33. **AC33 - Loading States:** All report pages show loading skeletons during data fetch. Use shadcn Skeleton component. Chart areas show placeholder with spinner. KPI cards show skeleton cards. Error states show Alert component with retry button. Empty states show appropriate message with icon. [Source: UI best practice]

34. **AC34 - Backend Unit Tests:** Create ReportServiceTest with tests: getIncomeStatement (revenue aggregation, expense aggregation, net calculation), getCashFlow (inflows, outflows, month comparison), getARAging (bucket calculation, collection rate), getRevenueBreakdown (by property, by type, trends), getExpenseBreakdown (by category, top vendors), getFinancialDashboard (KPIs, insights, caching). Create ReportControllerTest for all endpoints. Mock InvoiceRepository, ExpenseRepository, PaymentRepository. Achieve >= 80% coverage. [Source: docs/architecture.md#testing-backend]

35. **AC35 - Frontend Unit Tests:** Write tests: Report page rendering (all 5 report pages), DateRangeSelector (preset selection, custom range), PropertyFilter (selection, clear), Chart rendering (PieChart, LineChart, BarChart), Export buttons (PDF, Excel triggers), Dashboard KPI cards, Drill-down navigation. Use React Testing Library and Vitest. [Source: docs/architecture.md#testing-frontend]

36. **AC36 - Mandatory Test Execution:** After all implementation tasks complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes. [Source: Sprint Change Proposal]

37. **AC37 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal]

## Component Mapping

### shadcn/ui Components to Use

**Financial Dashboard:**
- card (KPI cards, insight cards, section containers)
- skeleton (loading states)
- badge (change indicators +/-)
- button (export, refresh, email)
- dropdown-menu (export options)

**Report Pages:**
- card (section containers)
- table (data tables for P&L, cash flow)
- select (property filter)
- popover + calendar (date range picker)
- tabs (report sections)
- button (export, email, compare toggle)
- switch (compare with previous period)
- separator (section dividers)

**Charts (Recharts):**
- PieChart, Pie, Cell (breakdowns)
- LineChart, Line, XAxis, YAxis (trends)
- BarChart, Bar (comparisons)
- ResponsiveContainer (responsive sizing)
- Tooltip, Legend (interactivity)

**Modals/Dialogs:**
- dialog (email report modal)
- form (email form)
- input (email addresses)
- textarea (message)

**Feedback:**
- toast/sonner (export success/error)
- alert (error states)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add card table skeleton badge button dropdown-menu select popover calendar tabs switch separator dialog form input textarea sonner alert
```

### Additional Dependencies

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Create Report TypeScript Types** (AC: #18)
  - [ ] Create types/reports.ts
  - [ ] Define IncomeStatement interface (revenueBreakdown, expenseBreakdown, netProfitLoss, profitMargin)
  - [ ] Define CashFlowSummary interface (inflows, outflows, net, monthComparison)
  - [ ] Define ARAgingReport interface (buckets, totalOutstanding, collectionRate)
  - [ ] Define RevenueBreakdown interface (byProperty, byType, monthlyTrend, yearOverYear)
  - [ ] Define ExpenseBreakdown interface (byCategory, monthlyTrend, topVendors, maintenanceByProperty)
  - [ ] Define FinancialDashboard interface (KPIs, insights)
  - [ ] Define ExportFormat and ReportType enums
  - [ ] Export from types/index.ts

- [ ] **Task 2: Create Report Frontend Service** (AC: #19)
  - [ ] Create services/reports.service.ts
  - [ ] Implement getIncomeStatement(params)
  - [ ] Implement getCashFlow(params)
  - [ ] Implement getARAging(params)
  - [ ] Implement getRevenueBreakdown(params)
  - [ ] Implement getExpenseBreakdown(params)
  - [ ] Implement getFinancialDashboard(params)
  - [ ] Implement exportPDF(reportType, params)
  - [ ] Implement exportExcel(reportType, params)
  - [ ] Implement emailReport(reportType, params, recipients, message)

- [ ] **Task 3: Create Report React Query Hooks** (AC: #20)
  - [ ] Create hooks/useReports.ts
  - [ ] Implement useIncomeStatement(params) query
  - [ ] Implement useCashFlow(params) query
  - [ ] Implement useARAging(params) query
  - [ ] Implement useRevenueBreakdown(params) query
  - [ ] Implement useExpenseBreakdown(params) query
  - [ ] Implement useFinancialDashboard(params) query
  - [ ] Implement useExportPDF() mutation
  - [ ] Implement useExportExcel() mutation
  - [ ] Implement useEmailReport() mutation
  - [ ] Configure staleTime (5 min dashboard, 15 min reports)

- [ ] **Task 4: Create Report DTOs (Backend)** (AC: #23)
  - [ ] Create IncomeStatementDto
  - [ ] Create CashFlowSummaryDto
  - [ ] Create ARAgingDto with AgingBucket inner class
  - [ ] Create RevenueBreakdownDto with PropertyRevenue, TypeRevenue inner classes
  - [ ] Create ExpenseBreakdownDto with CategoryExpense, VendorPayment inner classes
  - [ ] Create FinancialDashboardDto with KPI fields and insights
  - [ ] Create ExportRequestDto (reportType, startDate, endDate, propertyId)
  - [ ] Create EmailReportDto (reportType, recipients, message)

- [ ] **Task 5: Create Repository Aggregation Queries** (AC: #24)
  - [ ] Add to InvoiceRepository: sumByInvoiceTypeAndDateRange (native query)
  - [ ] Add to InvoiceRepository: countByStatusAndDateRange
  - [ ] Add to InvoiceRepository: getAgingBuckets (native query with CASE WHEN)
  - [ ] Add to ExpenseRepository: sumByCategoryAndDateRange
  - [ ] Add to ExpenseRepository: getTopVendorsByPayment (native query with GROUP BY, ORDER BY, LIMIT)
  - [ ] Add to ExpenseRepository: getMaintenanceCostByProperty
  - [ ] Add to PaymentRepository: sumByDateRange

- [ ] **Task 6: Implement Report Service Layer** (AC: #21)
  - [ ] Create ReportService interface
  - [ ] Create ReportServiceImpl with @Service
  - [ ] Implement getIncomeStatement (aggregate invoices by type, expenses by category)
  - [ ] Implement getCashFlow (aggregate payments, expenses with status PAID)
  - [ ] Implement getARAging (calculate buckets based on days overdue)
  - [ ] Implement getRevenueBreakdown (by property, by type, monthly trend)
  - [ ] Implement getExpenseBreakdown (by category, top vendors, maintenance by property)
  - [ ] Implement getFinancialDashboard with @Cacheable (1 hour TTL)
  - [ ] Implement exportToPDF using iTextPDF
  - [ ] Implement exportToExcel using Apache POI

- [ ] **Task 7: Implement PDF Export Service** (AC: #16, #30)
  - [ ] Add iTextPDF dependency to pom.xml
  - [ ] Create PdfExportService class
  - [ ] Implement income statement PDF template
  - [ ] Implement cash flow PDF template
  - [ ] Implement AR aging PDF template
  - [ ] Include company header (from CompanyProfile if available)
  - [ ] Format currency values as AED
  - [ ] Handle chart embedding (optional - can use table representation)

- [ ] **Task 8: Implement Excel Export Service** (AC: #17, #30)
  - [ ] Add Apache POI dependency to pom.xml
  - [ ] Create ExcelExportService class
  - [ ] Implement workbook creation with multiple sheets
  - [ ] Format cells (currency style, percentage style)
  - [ ] Add conditional formatting for negative values (red)
  - [ ] Set column widths and headers
  - [ ] Generate filename with timestamp

- [ ] **Task 9: Implement Report Controller** (AC: #22)
  - [ ] Create ReportController with @RestController
  - [ ] Implement GET /api/v1/reports/income-statement
  - [ ] Implement GET /api/v1/reports/cash-flow
  - [ ] Implement GET /api/v1/reports/receivables-aging
  - [ ] Implement GET /api/v1/reports/revenue-breakdown
  - [ ] Implement GET /api/v1/reports/expense-breakdown
  - [ ] Implement GET /api/v1/reports/financial-dashboard
  - [ ] Implement GET /api/v1/reports/export/pdf (returns PDF file)
  - [ ] Implement GET /api/v1/reports/export/excel (returns Excel file)
  - [ ] Implement POST /api/v1/reports/email
  - [ ] Implement POST /api/v1/reports/financial-dashboard/refresh (@CacheEvict)
  - [ ] Add @PreAuthorize for ADMIN, PROPERTY_MANAGER, FINANCE_MANAGER

- [ ] **Task 10: Create Date Range Selector Component** (AC: #26)
  - [ ] Create components/reports/DateRangeSelector.tsx
  - [ ] Implement preset buttons (This Month, Last Month, etc.)
  - [ ] Implement custom date range with Calendar
  - [ ] Store selection in URL query params
  - [ ] Add data-testid="date-range-selector"

- [ ] **Task 11: Create Property Filter Component** (AC: #27)
  - [ ] Create components/reports/PropertyFilter.tsx
  - [ ] Fetch properties from PropertyService
  - [ ] Implement dropdown with "All Properties" option
  - [ ] Store selection in URL query params
  - [ ] Add data-testid="property-filter"

- [ ] **Task 12: Create Financial Dashboard Page** (AC: #6)
  - [ ] Create app/(dashboard)/finance/reports/page.tsx
  - [ ] Implement KPI cards (revenue, expenses, net P/L, collection rate, receivables)
  - [ ] Show % change from previous month
  - [ ] Implement quick insights panel
  - [ ] Add refresh button with cache invalidation
  - [ ] Add loading skeletons
  - [ ] Add data-testid="page-finance-dashboard"

- [ ] **Task 13: Create Income Statement Page** (AC: #1)
  - [ ] Create app/(dashboard)/finance/reports/income-statement/page.tsx
  - [ ] Add date range selector and property filter
  - [ ] Implement revenue section table
  - [ ] Implement expense section table
  - [ ] Show net profit/loss with highlighting
  - [ ] Show profit margin percentage
  - [ ] Add export buttons (PDF, Excel)
  - [ ] Add compare toggle (AC#31)
  - [ ] Add data-testid="page-income-statement"

- [ ] **Task 14: Create Cash Flow Page** (AC: #2)
  - [ ] Create app/(dashboard)/finance/reports/cash-flow/page.tsx
  - [ ] Add date range selector and property filter
  - [ ] Show cash inflows, outflows, net
  - [ ] Implement month-over-month comparison chart (LineChart)
  - [ ] Add export buttons
  - [ ] Add compare toggle (AC#31)
  - [ ] Add data-testid="page-cash-flow"

- [ ] **Task 15: Create AR Aging Page** (AC: #3)
  - [ ] Create app/(dashboard)/finance/reports/receivables-aging/page.tsx
  - [ ] Add property filter and as-of-date selector
  - [ ] Implement aging buckets display (cards or table)
  - [ ] Show count, amount, percentage per bucket
  - [ ] Show total outstanding and collection rate
  - [ ] Implement drill-down on bucket click (AC#28)
  - [ ] Add export buttons
  - [ ] Add data-testid="page-ar-aging"

- [ ] **Task 16: Create Revenue Breakdown Page** (AC: #4)
  - [ ] Create app/(dashboard)/finance/reports/revenue/page.tsx
  - [ ] Add date range selector and property filter
  - [ ] Implement revenue by property pie chart
  - [ ] Implement revenue by type pie chart
  - [ ] Implement monthly trend line chart (12 months)
  - [ ] Implement year-over-year bar chart
  - [ ] Implement drill-down on chart click (AC#28)
  - [ ] Add export buttons
  - [ ] Add data-testid="chart-revenue-*"

- [ ] **Task 17: Create Expense Breakdown Page** (AC: #5)
  - [ ] Create app/(dashboard)/finance/reports/expenses/page.tsx
  - [ ] Add date range selector and property filter
  - [ ] Implement expenses by category pie chart
  - [ ] Implement monthly expense trend line chart
  - [ ] Implement top 5 vendors horizontal bar chart
  - [ ] Implement maintenance cost per property bar chart
  - [ ] Add export buttons
  - [ ] Add data-testid="chart-expense-*"

- [ ] **Task 18: Implement Chart Components** (AC: #25)
  - [ ] Create components/charts/RevenuePieChart.tsx
  - [ ] Create components/charts/ExpensePieChart.tsx
  - [ ] Create components/charts/TrendLineChart.tsx
  - [ ] Create components/charts/ComparisonBarChart.tsx
  - [ ] Use Airbnb-inspired color palette
  - [ ] Add tooltips with AED formatting
  - [ ] Implement ResponsiveContainer for all charts
  - [ ] Handle empty data states

- [ ] **Task 19: Implement Export Functionality (Frontend)** (AC: #7, #8)
  - [ ] Create components/reports/ExportButtons.tsx
  - [ ] Implement PDF download (call backend API, trigger download)
  - [ ] Implement Excel download
  - [ ] Show loading state during export
  - [ ] Show toast on success/error
  - [ ] Add data-testid="btn-export-pdf" and "btn-export-excel"

- [ ] **Task 20: Implement Email Report Modal** (AC: #9)
  - [ ] Create components/reports/EmailReportModal.tsx
  - [ ] Implement email form (recipients, message)
  - [ ] Validate email addresses
  - [ ] Call backend email API
  - [ ] Show loading state
  - [ ] Show success/error toast
  - [ ] Add data-testid="btn-email-report"

- [ ] **Task 21: Implement Drill-Down Navigation** (AC: #28)
  - [ ] Add click handlers to chart segments
  - [ ] Navigate to filtered invoice list for revenue drill-down
  - [ ] Navigate to filtered expense list for expense drill-down
  - [ ] Navigate to invoice list for AR aging bucket click
  - [ ] Pass filter params via URL query

- [ ] **Task 22: Implement Comparative Reporting** (AC: #31)
  - [ ] Add compare toggle switch to reports
  - [ ] Fetch current and previous period data
  - [ ] Calculate variance (amount and percentage)
  - [ ] Display side-by-side columns
  - [ ] Color-code variance (green/red)
  - [ ] Add data-testid="toggle-compare-period"

- [ ] **Task 23: Implement Responsive Design** (AC: #32)
  - [ ] Dashboard: mobile card layout for KPIs
  - [ ] Tables: convert to cards on mobile
  - [ ] Charts: ResponsiveContainer with min-height
  - [ ] Export buttons: sticky bottom bar on mobile
  - [ ] Test dark theme for all charts
  - [ ] Verify touch targets >= 44x44px

- [ ] **Task 24: Implement Loading States** (AC: #33)
  - [ ] Add skeleton loaders to dashboard KPIs
  - [ ] Add skeleton to chart areas
  - [ ] Add skeleton to tables
  - [ ] Implement error states with Alert and retry
  - [ ] Implement empty states with appropriate messaging

- [ ] **Task 25: Write Backend Unit Tests** (AC: #34)
  - [ ] Create ReportServiceTest
  - [ ] Test getIncomeStatement calculations
  - [ ] Test getCashFlow calculations
  - [ ] Test getARAging bucket logic
  - [ ] Test getRevenueBreakdown aggregations
  - [ ] Test getExpenseBreakdown aggregations
  - [ ] Test getFinancialDashboard KPIs
  - [ ] Test caching behavior
  - [ ] Create ReportControllerTest
  - [ ] Test all endpoints
  - [ ] Test authorization
  - [ ] Mock repositories
  - [ ] Achieve >= 80% coverage

- [ ] **Task 26: Write Frontend Unit Tests** (AC: #35)
  - [ ] Test DateRangeSelector (presets, custom)
  - [ ] Test PropertyFilter (selection)
  - [ ] Test dashboard page rendering
  - [ ] Test report pages rendering
  - [ ] Test chart components
  - [ ] Test export button triggers
  - [ ] Test drill-down navigation
  - [ ] Verify data-testid accessibility

- [ ] **Task 27: Mandatory Test Execution and Build Verification** (AC: #36, #37)
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

### Architecture Patterns

**Report Data Flow:**
```
Frontend Request → Controller → ReportService → Repository Aggregations → DTOs → Response
                                    ↓
                            @Cacheable (dashboard only, 1hr TTL)
```

**Export Flow:**
```
Frontend clicks Export → GET /api/v1/reports/export/{format}
                              ↓
                    ReportService generates data
                              ↓
                    PdfExportService / ExcelExportService
                              ↓
                    Returns file with Content-Disposition
```

### Prerequisites

**From Story 6.1 (Invoicing) - DONE:**
- Invoice entity with id, totalAmount, paidAmount, status, invoiceType, dueDate
- InvoiceRepository with existing queries
- Payment entity and PaymentRepository

**From Story 6.2 (Expense Management) - DONE:**
- Expense entity with category, amount, paymentStatus, propertyId, vendorId
- ExpenseRepository with existing queries
- Service layer patterns

**From Story 3.2 (Properties) - DONE:**
- Property entity with id, name
- PropertyRepository for property list

**From Story 2.8 (Company Profile) - IN PROGRESS:**
- CompanyProfile for PDF header (graceful fallback if not available)

### Technical Considerations

**Database Performance:**
- Use native SQL queries with GROUP BY for aggregations
- Add indexes on frequently filtered columns (dueDate, status, propertyId)
- Consider materialized views for complex reports if performance issues arise
- Cache dashboard results (Spring @Cacheable, 1 hour TTL)

**Chart Libraries:**
- Recharts for React charts (already in use for expense charts in 6.2)
- ResponsiveContainer for responsive sizing
- Consistent Airbnb-inspired color palette

**Export Libraries:**
- Backend: iTextPDF for PDF, Apache POI for Excel
- Alternative: Frontend jsPDF/xlsx (consider for simpler reports)

### Color Palette for Charts

```typescript
// Airbnb-inspired colors for charts
const chartColors = {
  primary: '#FF5A5F',    // Coral red
  secondary: '#00A699',  // Teal
  tertiary: '#FC642D',   // Orange
  quaternary: '#484848', // Dark gray
  quinary: '#767676',    // Medium gray
  success: '#008489',    // Green-teal
  warning: '#FFB400',    // Yellow
  error: '#C13515',      // Dark red
}
```

### Project Structure Notes

**Backend Files to Create:**
- `src/main/java/com/ultrabms/controller/ReportController.java`
- `src/main/java/com/ultrabms/service/ReportService.java`
- `src/main/java/com/ultrabms/service/impl/ReportServiceImpl.java`
- `src/main/java/com/ultrabms/service/PdfExportService.java`
- `src/main/java/com/ultrabms/service/ExcelExportService.java`
- `src/main/java/com/ultrabms/dto/report/*.java` (DTOs)
- `src/test/java/com/ultrabms/service/ReportServiceTest.java`
- `src/test/java/com/ultrabms/controller/ReportControllerTest.java`

**Frontend Files to Create:**
- `frontend/src/types/reports.ts`
- `frontend/src/services/reports.service.ts`
- `frontend/src/hooks/useReports.ts`
- `frontend/src/app/(dashboard)/finance/reports/page.tsx` (dashboard)
- `frontend/src/app/(dashboard)/finance/reports/income-statement/page.tsx`
- `frontend/src/app/(dashboard)/finance/reports/cash-flow/page.tsx`
- `frontend/src/app/(dashboard)/finance/reports/receivables-aging/page.tsx`
- `frontend/src/app/(dashboard)/finance/reports/revenue/page.tsx`
- `frontend/src/app/(dashboard)/finance/reports/expenses/page.tsx`
- `frontend/src/components/reports/DateRangeSelector.tsx`
- `frontend/src/components/reports/PropertyFilter.tsx`
- `frontend/src/components/reports/ExportButtons.tsx`
- `frontend/src/components/reports/EmailReportModal.tsx`
- `frontend/src/components/charts/RevenuePieChart.tsx`
- `frontend/src/components/charts/ExpensePieChart.tsx`
- `frontend/src/components/charts/TrendLineChart.tsx`
- `frontend/src/components/charts/ComparisonBarChart.tsx`

### Learnings from Previous Stories

**From Story 6-2-expense-management-and-vendor-payments (Status: done):**
- Use Recharts for charts (ExpenseSummaryCharts component exists)
- Service layer pattern with @Transactional for writes
- React Query hooks with mutations for actions
- Test patterns with mocked dependencies

**From Story 6-3-post-dated-cheque-pdc-management (Status: ready):**
- Comprehensive TypeScript types pattern
- Zod validation schemas pattern
- Frontend service with all CRUD methods
- React Query hooks with cache invalidation
- Test coverage >= 80% requirement

[Source: docs/sprint-artifacts/epic-6/6-2-expense-management-and-vendor-payments.md]
[Source: docs/sprint-artifacts/epic-6/6-3-post-dated-cheque-pdc-management.md]

### References

- [Source: docs/epics/epic-6-financial-management.md#story-64-financial-reporting-and-analytics]
- [Source: docs/architecture.md#caching-strategy]
- [Source: docs/architecture.md#performance-considerations]
- [Source: docs/prd.md#3.10-reporting-analytics-module]

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epic-6/6-4-financial-reporting-and-analytics.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-29 | 1.0 | SM Agent (Bob) | Initial story draft created from Epic 6 acceptance criteria |
