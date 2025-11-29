# Story 8.6: Finance Dashboard

Status: ready-for-dev

## Story

As a finance manager or administrator,
I want a dedicated finance dashboard with YTD metrics and transaction tracking,
So that I can monitor financial performance and manage receivables effectively.

## Acceptance Criteria

### KPI Cards (Top Row)
1. **AC-1:** Dashboard displays Total Income YTD KPI card showing:
   - Currency amount (AED) year-to-date
   - Trend indicator vs. same period last year
   - Click navigates to income transactions

2. **AC-2:** Dashboard displays Total Expenses YTD KPI card showing:
   - Currency amount (AED) year-to-date
   - Trend indicator vs. same period last year
   - Click navigates to expense transactions

3. **AC-3:** Dashboard displays Net Profit/Loss YTD KPI card showing:
   - Currency amount (AED) calculated as income - expenses
   - Green color for profit, red for loss
   - Percentage margin displayed

4. **AC-4:** Dashboard displays VAT Paid YTD KPI card showing:
   - Currency amount (AED) of VAT paid year-to-date
   - Click navigates to VAT report

### Income vs Expense Chart (Stacked Bar with Line)
5. **AC-5:** Income vs Expense chart displays:
   - X-axis: Last 12 months
   - Y-axis: Amount (AED)
   - Stacked bars: Income (green), Expenses (red)
   - Line overlay showing net profit/loss trend
   - Click bar navigates to monthly transaction details

### Top Expense Categories Chart (Donut)
6. **AC-6:** Top Expense Categories donut chart displays:
   - Segments: Maintenance, Utilities, Salaries, Insurance, Other
   - Percentages and amounts for each segment
   - Click segment drills down to expense list for that category
   - Legend with amounts

### Outstanding Receivables Summary Card
7. **AC-7:** Outstanding Receivables card displays:
   - Total amount outstanding
   - Aging breakdown: Current, 30+ days, 60+ days, 90+ days
   - Visual breakdown (horizontal stacked bar)
   - Click navigates to invoice list filtered by status

### Recent High-Value Transactions List
8. **AC-8:** Recent High-Value Transactions table displays:
   - Columns: Date, Type (Income/Expense), Description, Amount, Category
   - Last 10 transactions above configurable threshold
   - Color-coded by type (green income, red expense)
   - Quick action: View Details

### PDC Status Summary Card
9. **AC-9:** PDC Status Summary card displays:
   - Due This Week: Count and total amount
   - Due This Month: Count and total amount
   - Awaiting Clearance: Count and total amount
   - Click navigates to PDC management page

### API Endpoints
10. **AC-10:** Backend provides GET /api/v1/dashboard/finance endpoint returning all finance dashboard data

11. **AC-11:** Backend provides GET /api/v1/dashboard/finance/income-vs-expense endpoint returning monthly chart data

12. **AC-12:** Backend provides GET /api/v1/dashboard/finance/expense-categories endpoint returning donut chart data

13. **AC-13:** Backend provides GET /api/v1/dashboard/finance/outstanding-receivables endpoint returning aging breakdown

14. **AC-14:** Backend provides GET /api/v1/dashboard/finance/recent-transactions endpoint with optional threshold parameter

15. **AC-15:** Backend provides GET /api/v1/dashboard/finance/pdc-status endpoint returning PDC summary

### Technical Requirements
16. **AC-16:** Frontend uses Recharts ComposedChart for income vs expense with line overlay

17. **AC-17:** Net profit/loss color-coded (green positive, red negative)

18. **AC-18:** Dashboard data cached for 5 minutes using Ehcache

19. **AC-19:** Drill-down from donut chart to expense list implemented

20. **AC-20:** Role-based access for FINANCE_MANAGER or ADMIN

21. **AC-21:** All currency values formatted in AED with proper number formatting

22. **AC-22:** All interactive elements have data-testid attributes

## Tasks / Subtasks

### Backend Tasks
- [ ] Task 1: Create Finance Dashboard DTOs (AC: #10-15)
  - [ ] Create FinanceDashboardDto with all fields
  - [ ] Create FinanceKpiDto for KPI cards
  - [ ] Create IncomeExpenseChartDto for stacked bar chart
  - [ ] Create ExpenseCategoryDto for donut chart
  - [ ] Create OutstandingReceivablesDto for aging summary
  - [ ] Create RecentTransactionDto for transaction list
  - [ ] Create PdcStatusSummaryDto for PDC card

- [ ] Task 2: Create FinanceDashboardRepository queries (AC: #1-9)
  - [ ] Query for total income YTD
  - [ ] Query for total expenses YTD
  - [ ] Query for VAT paid YTD
  - [ ] Query for income vs expense by month (last 12)
  - [ ] Query for expenses grouped by category
  - [ ] Query for outstanding receivables with aging
  - [ ] Query for recent high-value transactions
  - [ ] Query for PDC status summary

- [ ] Task 3: Create FinanceDashboardService (AC: #1-9, #18)
  - [ ] Implement getFinanceDashboard() method
  - [ ] Implement getIncomeVsExpense() method
  - [ ] Implement getExpenseCategories() method
  - [ ] Implement getOutstandingReceivables() method
  - [ ] Implement getRecentTransactions(threshold) method
  - [ ] Implement getPdcStatus() method
  - [ ] Add Ehcache caching with 5-minute TTL

- [ ] Task 4: Create FinanceDashboardController (AC: #10-15, #20)
  - [ ] GET /api/v1/dashboard/finance
  - [ ] GET /api/v1/dashboard/finance/income-vs-expense
  - [ ] GET /api/v1/dashboard/finance/expense-categories
  - [ ] GET /api/v1/dashboard/finance/outstanding-receivables
  - [ ] GET /api/v1/dashboard/finance/recent-transactions?threshold=10000
  - [ ] GET /api/v1/dashboard/finance/pdc-status
  - [ ] Add @PreAuthorize for FINANCE_MANAGER or ADMIN

- [ ] Task 5: Write unit tests for FinanceDashboardService
  - [ ] Test YTD calculations
  - [ ] Test income vs expense chart data
  - [ ] Test aging breakdown calculations
  - [ ] Test PDC status aggregation

### Frontend Tasks
- [ ] Task 6: Create TypeScript types for finance dashboard
  - [ ] Create finance-dashboard.ts types
  - [ ] Create Zod validation schemas

- [ ] Task 7: Create finance-dashboard.service.ts API client
  - [ ] Implement fetchFinanceDashboard()
  - [ ] Implement fetchIncomeVsExpense()
  - [ ] Implement fetchExpenseCategories()
  - [ ] Implement fetchOutstandingReceivables()
  - [ ] Implement fetchRecentTransactions(threshold)
  - [ ] Implement fetchPdcStatus()

- [ ] Task 8: Create useFinanceDashboard React Query hook
  - [ ] Implement hook with auto-refresh
  - [ ] Handle loading and error states

- [ ] Task 9: Create FinanceKpiCards component (AC: #1-4, #17, #21)
  - [ ] Display 4 KPI cards in a row
  - [ ] Trend indicators (up/down arrows)
  - [ ] Color-coded profit/loss
  - [ ] AED currency formatting
  - [ ] Add data-testid attributes

- [ ] Task 10: Create IncomeExpenseChart component (AC: #5, #16)
  - [ ] Use Recharts ComposedChart
  - [ ] Stacked bar for income/expenses
  - [ ] Line overlay for net profit/loss
  - [ ] Click navigation to monthly details

- [ ] Task 11: Create ExpenseCategoriesDonut component (AC: #6, #19)
  - [ ] Use Recharts PieChart with donut configuration
  - [ ] Click to drill down to expense list
  - [ ] Legend with amounts and percentages

- [ ] Task 12: Create OutstandingReceivablesCard component (AC: #7)
  - [ ] Total amount display
  - [ ] Aging breakdown visualization
  - [ ] Click navigation to invoice list

- [ ] Task 13: Create RecentTransactionsTable component (AC: #8)
  - [ ] Data table with columns
  - [ ] Color-coded by type
  - [ ] View Details quick action
  - [ ] Add data-testid attributes

- [ ] Task 14: Create PdcStatusCard component (AC: #9)
  - [ ] Display counts and amounts
  - [ ] Three sections: This Week, This Month, Awaiting Clearance
  - [ ] Click navigation to PDC management

- [ ] Task 15: Create Finance Dashboard page (AC: #16, #22)
  - [ ] Create page at app/(dashboard)/finance/dashboard/page.tsx
  - [ ] Implement responsive grid layout
  - [ ] Add skeleton loaders for all components
  - [ ] Integrate all finance dashboard components

- [ ] Task 16: Write frontend unit tests
  - [ ] Test FinanceKpiCards component
  - [ ] Test IncomeExpenseChart component
  - [ ] Test OutstandingReceivablesCard component

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
- AED currency only [Source: docs/architecture.md#ADR-004]
- Use Recharts ComposedChart for stacked bar + line [Source: docs/architecture.md#Decision-Summary]
- PDC management patterns [Source: docs/architecture.md#PDC-Post-Dated-Cheque-Management]

### Technical Implementation Notes
- YTD calculation: From January 1st of current year to current date
- Expense categories: MAINTENANCE, UTILITIES, SALARIES, INSURANCE, OTHER
- Aging buckets: Current (0-30 days), 30+ (31-60), 60+ (61-90), 90+ (>90)
- High-value transaction threshold: Default 10,000 AED, configurable
- PDC statuses: RECEIVED, DEPOSITED, CLEARED, BOUNCED, WITHDRAWN

### Project Structure Notes
- Backend: `controller/FinanceDashboardController.java`, `service/FinanceDashboardService.java`
- Frontend: `app/(dashboard)/finance/dashboard/page.tsx`
- Reuse financial types from `types/invoice.ts`, `types/expense.ts`, `types/pdc.ts`

### Stitch Design Reference
- Reference design: `docs/archive/stitch_building_maintenance_software/finance_module_dashboard/screen.png`

### Prerequisites
- Story 6.1 (done) - Rent invoicing and payment management
- Story 6.2 (done) - Expense management and vendor payments
- Story 6.3 (ready) - PDC management

### References
- [Source: docs/epics/epic-8-dashboard-reporting.md#Story-8.6]
- [Source: docs/architecture.md#Financial-Management]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-8/8-6-finance-dashboard.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
