# Epic 6: Financial Management

**Goal:** Implement comprehensive financial management including rent collection, expense tracking, PDC management, and financial reporting to ensure accurate financial operations.

## Story 6.1: Rent Invoicing and Payment Management

As a finance manager,
I want to generate rent invoices and track payments,
So that rental income is collected efficiently and accurately.

**Acceptance Criteria:**

**Given** a tenant has an active lease
**When** I generate a rent invoice
**Then** the invoice generation includes:

**Invoice Generation:**
- Automatic monthly invoice generation (scheduled job runs on 1st of month)
- Manual invoice generation option for ad-hoc charges
- Invoice includes:
  - Invoice number (unique, format: INV-2025-0001)
  - Tenant name and unit
  - Invoice date and due date (configurable, default: due on 5th of month)
  - Rent breakdown:
    - Base rent (from lease agreement)
    - Service charges (from lease agreement)
    - Parking fees (from lease agreement)
    - Additional charges (late fees, utilities, other)
  - Total amount due
  - Payment instructions

**And** invoice entity:
- id (UUID), invoiceNumber (unique)
- tenantId, unitId, propertyId
- leaseId (foreign key)
- invoiceDate, dueDate
- baseRent, serviceCharges, parkingFees
- additionalCharges (JSON array with description and amount)
- totalAmount
- paidAmount (running total)
- balanceAmount (totalAmount - paidAmount)
- status (enum: DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED)
- sentAt, paidAt timestamps
- createdAt, updatedAt timestamps

**And** payment recording:
- Record payment button on invoice
- Payment form includes:
  - Amount paid (decimal, up to balanceAmount)
  - Payment method (enum: CASH, BANK_TRANSFER, CARD, CHEQUE, PDC)
  - Payment date (date picker, default: today)
  - Transaction reference (text, optional, e.g., bank reference number)
  - Notes (text, optional)
- Create payment record
- Update invoice paidAmount and balanceAmount
- Update invoice status (PARTIALLY_PAID if balance remains, PAID if fully paid)
- Generate receipt (PDF) with payment details
- Send receipt email to tenant

**And** payment entity:
- id (UUID), paymentNumber (unique, format: PAY-2025-0001)
- invoiceId (foreign key)
- tenantId, amount
- paymentMethod, paymentDate
- transactionReference, notes
- receiptFilePath (PDF stored in /uploads/receipts/)
- recordedBy (userId)
- createdAt timestamp

**And** overdue tracking:
- Scheduled job runs daily
- Check invoices where dueDate < today and status != PAID
- Update status to OVERDUE
- Calculate late fees (configurable, e.g., 5% after 7 days overdue)
- Add late fee as additional charge to next invoice or current invoice
- Send overdue reminder email to tenant

**And** invoice list page:
- Filters: status, property, tenant, date range
- Search by: invoice number, tenant name
- Shows: invoice number, tenant, unit, amount, paid, balance, due date, status
- Quick actions: View, Record Payment, Send Email, Download PDF

**And** API endpoints:
- POST /api/v1/invoices: Create invoice manually
- GET /api/v1/invoices: List invoices with filters
- GET /api/v1/invoices/{id}: Get invoice details
- PUT /api/v1/invoices/{id}: Update invoice
- POST /api/v1/invoices/{id}/send: Send invoice email to tenant
- POST /api/v1/invoices/{id}/payments: Record payment
- GET /api/v1/invoices/{id}/pdf: Generate invoice PDF
- GET /api/v1/payments/{id}/receipt: Generate payment receipt PDF
- GET /api/v1/tenants/{id}/invoices: Get tenant's invoice history

**Prerequisites:** Story 3.2 (Tenant onboarding with lease terms)

**Technical Notes:**
- Use Spring Scheduler (@Scheduled) for automatic monthly invoice generation
- Calculate late fees based on configurable business rules
- Generate PDFs using iText or PDFBox library
- Email invoices as PDF attachments
- Store invoice PDFs in /uploads/invoices/
- Store payment receipts in /uploads/receipts/
- Add database indexes on invoiceNumber, tenantId, status, dueDate
- Frontend: Use shadcn/ui Table for invoice list
- Implement print-friendly invoice layout
- Support multiple payment methods including PDC (link to Story 6.3)

## Story 6.2: Expense Management and Vendor Payments

As a finance manager,
I want to track expenses and process vendor payments,
So that all costs are recorded and vendors are paid on time.

**Acceptance Criteria:**

**Given** expenses occur (maintenance, utilities, etc.)
**When** I record an expense
**Then** the expense management includes:

**Expense Recording:**
- Expense form includes:
  - Expense category (dropdown: MAINTENANCE, UTILITIES, SALARIES, SUPPLIES, INSURANCE, TAXES, OTHER)
  - Property (dropdown, can be "All Properties" for general expenses)
  - Vendor (dropdown, optional, for vendor-related expenses)
  - Work order (dropdown, optional, link to maintenance work order)
  - Amount (decimal)
  - Expense date (date picker)
  - Payment status (enum: PENDING, PAID)
  - Payment method (enum: CASH, BANK_TRANSFER, CARD, CHEQUE)
  - Description (text, max 500 chars)
  - Receipt upload (PDF/JPG, max 5MB)

**And** expense entity:
- id (UUID), expenseNumber (unique, format: EXP-2025-0001)
- category, propertyId
- vendorId (foreign key, optional)
- workOrderId (foreign key, optional)
- amount, expenseDate
- paymentStatus, paymentMethod
- paymentDate (when payment was made)
- description
- receiptFilePath (stored in /uploads/expenses/)
- recordedBy (userId)
- createdAt, updatedAt timestamps

**And** automatic expense creation from work orders:
- When work order is marked as COMPLETED
- If actualCost > 0, create expense automatically
- Link expense to work order and vendor
- Category = MAINTENANCE
- Payment status = PENDING (manager approves and processes payment)

**And** vendor payment processing:
- View pending vendor payments (expenses with paymentStatus = PENDING)
- Filter by vendor
- Select multiple expenses for batch payment
- Click "Process Payment" button
- Enter payment date and transaction reference
- Mark expenses as PAID
- Update paymentDate
- Generate payment summary report (PDF)
- Send payment confirmation email to vendor

**And** expense list page:
- Filters: category, property, vendor, payment status, date range
- Search by: expense number, description
- Shows: expense number, category, property, vendor, amount, date, status
- Quick actions: View, Edit, Mark as Paid, Download Receipt

**And** expense summary:
- Total expenses by category (pie chart)
- Monthly expense trend (line chart)
- Expense vs. budget comparison
- Top vendors by payment amount

**And** API endpoints:
- POST /api/v1/expenses: Create expense
- GET /api/v1/expenses: List expenses with filters
- GET /api/v1/expenses/{id}: Get expense details
- PUT /api/v1/expenses/{id}: Update expense
- PATCH /api/v1/expenses/{id}/pay: Mark as paid
- POST /api/v1/expenses/batch-pay: Process batch payment
- GET /api/v1/expenses/summary: Get expense summary and charts
- DELETE /api/v1/expenses/{id}: Soft delete expense

**Prerequisites:** Story 5.1 (Vendor registration), Story 4.4 (Work order completion)

**Technical Notes:**
- Auto-create expenses from completed work orders with actualCost
- Store expense receipts in /uploads/expenses/
- Implement batch payment processing for multiple expenses
- Generate payment summary PDFs with expense details
- Add database indexes on category, propertyId, vendorId, paymentStatus
- Frontend: Use Recharts for expense charts
- Calculate month-over-month expense growth
- Support expense approval workflow (optional enhancement)

## Story 6.3: Post-Dated Cheque (PDC) Management

As a finance manager,
I want to manage post-dated cheques from tenants,
So that I can track cheque deposits and handle bounced cheques.

**Acceptance Criteria:**

**Given** a tenant pays rent with post-dated cheques
**When** I register PDCs
**Then** the PDC management includes:

**PDC Registration:**
- PDC registration form (accessed from tenant profile or invoice)
- Form includes:
  - Tenant selection (dropdown)
  - Lease/Invoice link (optional)
  - Number of cheques (integer, e.g., 12 for annual lease)
  - Cheque details for each:
    - Cheque number (text, max 50 chars)
    - Bank name (text, max 100 chars)
    - Cheque amount (decimal)
    - Cheque date (date picker, post-dated)
    - Status (default: RECEIVED)
- Bulk entry mode: enter details for all cheques in table format
- Save all PDCs at once

**And** PDC entity:
- id (UUID), chequeNumber
- tenantId (foreign key)
- invoiceId (foreign key, optional, link to specific invoice)
- leaseId (foreign key, optional)
- bankName, amount
- chequeDate (post-dated)
- status (enum: RECEIVED, DUE, DEPOSITED, CLEARED, BOUNCED, CANCELLED, REPLACED)
- depositDate (when deposited to bank)
- clearedDate (when cheque cleared)
- bouncedDate, bounceReason (if bounced)
- replacementChequeId (foreign key, if replaced)
- notes (text, optional)
- createdBy (userId)
- createdAt, updatedAt timestamps

**And** PDC dashboard:
- KPI cards:
  - PDCs due this week (count and total value)
  - PDCs deposited (count and total value)
  - Total outstanding PDC value
  - Recently bounced cheques (count)
- Upcoming PDCs list (next 30 days):
  - Shows: cheque number, tenant, bank, amount, cheque date, status
  - Quick action: Mark as Deposited
- Recently deposited PDCs:
  - Shows: cheque number, tenant, amount, deposit date
  - Quick action: Mark as Cleared or Bounced

**And** PDC status workflow:
- RECEIVED → DUE (automatic, when chequeDate is within 7 days)
- DUE → DEPOSITED (manual, when manager deposits cheque)
  - Enter deposit date
  - Status updates to DEPOSITED
  - Send deposit confirmation email to property manager
- DEPOSITED → CLEARED (manual, when bank confirms clearance)
  - Enter cleared date
  - Link PDC payment to invoice (auto-record payment if invoice linked)
  - Status updates to CLEARED
- DEPOSITED → BOUNCED (manual, if cheque bounces)
  - Enter bounced date and reason
  - Status updates to BOUNCED
  - Send bounce notification email to property manager and tenant
  - Tenant status flagged for follow-up
- BOUNCED → REPLACED (manual, when tenant provides replacement cheque)
  - Register new PDC as replacement
  - Link to original bounced PDC
  - Original PDC status updates to REPLACED

**And** PDC list page:
- Filters: status, tenant, date range, bank
- Search by: cheque number, tenant name
- Color-coded status badges
- Shows: cheque number, tenant, bank, amount, cheque date, status
- Quick actions: View, Mark as Deposited, Mark as Cleared, Report Bounce, Cancel

**And** bounce handling:
- Record bounce with reason (e.g., insufficient funds, signature mismatch)
- Add late fee to tenant invoice
- Flag tenant account for follow-up
- Track bounce history per tenant
- Send notification to property manager

**And** API endpoints:
- POST /api/v1/pdcs: Register PDCs (single or bulk)
- GET /api/v1/pdcs: List PDCs with filters
- GET /api/v1/pdcs/{id}: Get PDC details
- PUT /api/v1/pdcs/{id}: Update PDC
- PATCH /api/v1/pdcs/{id}/deposit: Mark as deposited
- PATCH /api/v1/pdcs/{id}/clear: Mark as cleared
- PATCH /api/v1/pdcs/{id}/bounce: Report bounce
- PATCH /api/v1/pdcs/{id}/cancel: Cancel PDC
- GET /api/v1/pdcs/dashboard: Get PDC dashboard data
- GET /api/v1/tenants/{id}/pdcs: Get tenant's PDC history

**Prerequisites:** Story 6.1 (Invoicing), Story 3.2 (Tenant onboarding)

**Technical Notes:**
- Scheduled job runs daily to check for PDCs becoming due (chequeDate within 7 days)
- Send email reminders for PDCs due soon (3 days before chequeDate)
- When PDC is cleared, auto-record payment on linked invoice
- Track bounce rate per tenant (number of bounces / total PDCs)
- Add database indexes on tenantId, status, chequeDate
- Frontend: Use shadcn/ui Calendar for cheque date visualization
- Display PDC calendar view showing all upcoming cheque dates
- Implement bulk deposit action (mark multiple PDCs as deposited)

## Story 6.4: Financial Reporting and Analytics

As a finance manager,
I want to view financial reports and analytics,
So that I can understand income, expenses, and profitability.

**Acceptance Criteria:**

**Given** financial data exists (invoices, payments, expenses)
**When** I view financial reports
**Then** the reporting includes:

**Income Statement (Profit & Loss):**
- Date range selector (default: current month)
- Property filter (all properties or specific)
- Revenue section:
  - Rental income (from invoices)
  - Service charges
  - Parking fees
  - Late fees
  - Other income
  - Total revenue
- Expense section:
  - Maintenance expenses
  - Utilities
  - Salaries
  - Supplies
  - Insurance
  - Taxes
  - Other expenses
  - Total expenses
- Net profit/loss: Total revenue - Total expenses
- Profit margin percentage

**And** cash flow summary:
- Cash inflows (payments received)
- Cash outflows (expenses paid)
- Net cash flow
- Month-over-month comparison

**And** accounts receivable aging:
- Outstanding invoices grouped by age:
  - Current (not yet due)
  - 1-30 days overdue
  - 31-60 days overdue
  - 61-90 days overdue
  - 90+ days overdue
- Total outstanding amount
- Collection rate percentage

**And** revenue breakdown charts:
- Revenue by property (pie chart)
- Revenue by type (rent, service charges, parking, other)
- Monthly revenue trend (line chart, last 12 months)
- Year-over-year comparison

**And** expense breakdown charts:
- Expenses by category (pie chart)
- Monthly expense trend (line chart, last 12 months)
- Top 5 vendors by payment amount
- Maintenance cost per property

**And** financial dashboard:
- KPI cards:
  - Total revenue (current month)
  - Total expenses (current month)
  - Net profit/loss (current month)
  - Collection rate (payments / invoices issued)
  - Outstanding receivables
- Quick insights:
  - Revenue growth vs. last month
  - Expense growth vs. last month
  - Top performing property (by revenue)
  - Highest expense category

**And** export capabilities:
- Export reports to PDF
- Export data to Excel/CSV
- Include charts and tables in exports
- Email reports to stakeholders

**And** API endpoints:
- GET /api/v1/reports/income-statement: Get P&L report
- GET /api/v1/reports/cash-flow: Get cash flow summary
- GET /api/v1/reports/receivables-aging: Get AR aging report
- GET /api/v1/reports/revenue-breakdown: Get revenue charts
- GET /api/v1/reports/expense-breakdown: Get expense charts
- GET /api/v1/reports/financial-dashboard: Get dashboard KPIs
- GET /api/v1/reports/export/pdf: Export report as PDF
- GET /api/v1/reports/export/excel: Export report as Excel

**Prerequisites:** Story 6.1 (Invoicing), Story 6.2 (Expense management)

**Technical Notes:**
- Calculate all metrics server-side for performance
- Cache dashboard KPIs (refresh every hour or on demand)
- Use database aggregation queries for efficient reporting
- Frontend: Use Recharts for all charts and graphs
- Implement drill-down capability (click chart to see details)
- Generate PDFs using iText or PDFBox
- Export Excel using Apache POI library
- Add comparative reporting (current vs. previous period)
- Support custom date range selection

---

## E2E Testing Stories

**Note:** The following E2E test stories should be implemented AFTER all technical implementation stories (6.1-6.4) are completed. Each E2E story corresponds to its technical story and contains comprehensive end-to-end tests covering all user flows.

## Story 6.1.e2e: E2E Tests for Rent Invoicing and Payment Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for invoicing and payment management,
So that I can ensure rent collection processes work correctly.

**Acceptance Criteria:**

**Given** Story 6.1 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Automatic Invoice Generation:**
- Create tenant with active lease starting this month
- Trigger scheduled job for monthly invoice generation (test endpoint)
- Verify invoice created with number INV-2025-XXXX
- Verify invoice includes:
  - Tenant name and unit
  - Invoice date (1st of month)
  - Due date (5th of month by default)
  - Base rent from lease
  - Service charges from lease
  - Parking fees from lease
  - Total amount calculated correctly
- Verify invoice status = SENT
- Verify email sent to tenant with PDF attachment

**Manual Invoice Generation:**
- Navigate to invoice creation page
- Select tenant from dropdown
- Verify lease details auto-populated
- Add additional charge: "Utility bill" with amount 200.00
- Set custom due date
- Create invoice
- Verify invoice number generated
- Verify status = DRAFT
- Send invoice → verify status = SENT

**Payment Recording:**
- View invoice detail page
- Click "Record Payment" button
- Fill payment form:
  - Amount paid: 5000.00 (partial payment)
  - Payment method: BANK_TRANSFER
  - Payment date: today
  - Transaction reference: "TXN123456"
  - Notes: "First installment"
- Submit payment
- Verify payment number generated (PAY-2025-XXXX)
- Verify invoice paidAmount updated
- Verify balanceAmount = totalAmount - paidAmount
- Verify invoice status = PARTIALLY_PAID
- Verify receipt PDF generated
- Verify receipt email sent to tenant

**Full Payment:**
- Record second payment for remaining balance
- Verify invoice status changed to PAID
- Verify balanceAmount = 0
- Verify paidAt timestamp set

**Overdue Invoice Tracking:**
- Create invoice with due date yesterday
- Trigger scheduled job for overdue checking
- Verify invoice status changed to OVERDUE
- Verify late fee calculated (5% after 7 days)
- Verify overdue reminder email sent to tenant

**Invoice List and Filtering:**
- View invoice list page
- Filter by status: OVERDUE → verify only overdue invoices shown
- Filter by tenant → verify tenant-specific invoices
- Filter by date range → verify invoices in range
- Search by invoice number → verify found
- Sort by due date ascending → verify sorting

**Invoice PDF Generation:**
- Click "Download PDF" on invoice
- Verify PDF downloads with correct filename
- Verify PDF contains all invoice details
- Verify print-friendly layout

**Tenant Invoice History:**
- Login as tenant
- View my invoices page
- Verify only own invoices displayed
- View invoice detail → verify payment history shown
- Download invoice PDF → verify accessible

**Validation and Error Handling:**
- Record payment with amount > balanceAmount → verify error
- Record payment with negative amount → verify validation error
- Record payment without payment method → verify required field error
- Create invoice for tenant without active lease → verify error

**Prerequisites:** Story 6.1 (status: done), Story 3.3 (for tenants with leases)

**Technical Notes:**
- Test scheduled job for automatic invoice generation
- Test scheduled job for overdue tracking
- Verify PDF generation for invoices and receipts
- Test email notifications (mock email service)
- Verify late fee calculation logic
- Clean up test invoices and payments
- Use test fixtures for tenants with active leases

## Story 6.2.e2e: E2E Tests for Expense Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for expense management,
So that I can ensure expense tracking and vendor payments work correctly.

**Acceptance Criteria:**

**Given** Story 6.2 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Manual Expense Recording:**
- Navigate to expense creation page
- Fill expense form:
  - Category: MAINTENANCE
  - Property: Select from dropdown
  - Vendor: Select vendor
  - Work order: Leave blank (optional)
  - Amount: 1500.00
  - Expense date: today
  - Payment status: PENDING
  - Description: "HVAC repair parts"
  - Upload receipt (PDF < 5MB)
- Submit expense
- Verify expense number generated (EXP-2025-XXXX)
- Verify expense appears in list
- Verify receipt uploaded and downloadable

**Automatic Expense from Work Order:**
- Complete work order with actualCost = 2000.00
- Mark work order as COMPLETED
- Verify expense auto-created
- Verify expense linked to work order
- Verify category = MAINTENANCE
- Verify vendorId matches work order vendor
- Verify paymentStatus = PENDING

**Vendor Payment Processing:**
- Navigate to pending payments page
- Filter by vendor
- Verify list of pending expenses for vendor
- Select multiple expenses (batch selection)
- Click "Process Payment" button
- Enter payment date and transaction reference
- Confirm batch payment
- Verify all selected expenses status = PAID
- Verify paymentDate set for all
- Verify payment summary PDF generated
- Verify payment confirmation email sent to vendor

**Expense List and Filtering:**
- View expense list
- Filter by category: UTILITIES → verify only utilities shown
- Filter by property → verify property-specific expenses
- Filter by vendor → verify vendor-specific expenses
- Filter by payment status: PENDING → verify unpaid expenses
- Filter by date range → verify expenses in range
- Search by expense number → verify search works

**Expense Summary Dashboard:**
- Navigate to expense summary page
- Verify total expenses by category (pie chart displayed)
- Verify monthly expense trend (line chart for last 12 months)
- Verify top vendors by payment amount table
- Verify expense vs budget comparison (if budget set)

**Mark Individual Expense as Paid:**
- View pending expense detail
- Click "Mark as Paid"
- Enter payment date and reference
- Confirm payment
- Verify status = PAID
- Verify paymentDate updated

**Receipt Management:**
- Upload receipt to expense
- View receipt → verify PDF opens
- Download receipt → verify file downloads
- Replace receipt → verify old receipt replaced

**Validation and Error Handling:**
- Create expense without category → verify required field error
- Create expense without amount → verify required field error
- Create expense with negative amount → verify validation error
- Upload receipt > 5MB → verify size error
- Upload non-PDF/JPG file → verify type error

**Prerequisites:** Story 6.2 (status: done), Story 5.1 (for vendors)

**Technical Notes:**
- Test auto-creation of expenses from work orders
- Test batch payment processing
- Verify payment summary PDF generation
- Test email notifications to vendors
- Verify expense charts render correctly
- Clean up test expenses
- Use test fixtures for vendors and work orders

## Story 6.3.e2e: E2E Tests for PDC Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for PDC management,
So that I can ensure cheque tracking and bounce handling work correctly.

**Acceptance Criteria:**

**Given** Story 6.3 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**PDC Registration (Bulk Entry):**
- Navigate to PDC registration page
- Select tenant
- Enter number of cheques: 12
- Fill bulk entry table:
  - Row 1: Cheque #001, Emirates NBD, 5000, date: next month 1st
  - Row 2: Cheque #002, Emirates NBD, 5000, date: next month + 1
  - ... continue for 12 cheques
- Save all PDCs
- Verify all 12 PDCs created with status = RECEIVED
- Verify all cheques appear in PDC list

**PDC Dashboard:**
- View PDC dashboard
- Verify KPI cards:
  - PDCs due this week (count and value)
  - PDCs deposited (count and value)
  - Total outstanding PDC value
  - Recently bounced cheques
- View upcoming PDCs list (next 30 days)
- Verify cheques sorted by cheque date

**PDC Status Workflow - Deposit:**
- Create PDC with chequeDate = today
- Trigger scheduled job → verify status changed to DUE
- Click "Mark as Deposited" on PDC
- Enter deposit date
- Confirm deposit
- Verify status changed to DEPOSITED
- Verify depositDate set
- Verify deposit confirmation email sent

**PDC Status Workflow - Cleared:**
- View deposited PDC
- Click "Mark as Cleared"
- Enter cleared date
- Confirm clearance
- Verify status = CLEARED
- Verify clearedDate set
- If PDC linked to invoice → verify payment auto-recorded on invoice
- Verify invoice paidAmount updated

**PDC Status Workflow - Bounced:**
- View deposited PDC
- Click "Report Bounce"
- Fill bounce form:
  - Bounced date: today
  - Bounce reason: "Insufficient funds"
- Confirm bounce
- Verify status = BOUNCED
- Verify bouncedDate and bounceReason set
- Verify bounce notification email sent to manager and tenant
- Verify tenant account flagged for follow-up
- Verify late fee added to tenant invoice (if configured)

**PDC Replacement:**
- View bounced PDC
- Click "Register Replacement"
- Register new PDC with new cheque number
- Link to bounced PDC
- Verify new PDC created
- Verify original PDC status = REPLACED
- Verify replacementChequeId linked

**PDC List and Filtering:**
- View PDC list page
- Filter by status: DEPOSITED → verify only deposited cheques
- Filter by tenant → verify tenant-specific cheques
- Filter by bank → verify bank-specific cheques
- Filter by date range → verify cheques in range
- Search by cheque number → verify search
- Verify color-coded status badges

**PDC Calendar View:**
- Navigate to PDC calendar
- Verify all upcoming cheque dates displayed on calendar
- Click date → verify PDCs for that date shown
- Verify visual indicators for different statuses

**Bulk Deposit:**
- Select multiple PDCs with status DUE
- Click "Bulk Deposit"
- Enter deposit date
- Confirm bulk deposit
- Verify all selected PDCs status = DEPOSITED

**Tenant PDC History:**
- Navigate to tenant profile
- View PDC history tab
- Verify all tenant PDCs listed
- Verify bounce rate calculated (bounces / total PDCs)
- Identify payment reliability trend

**PDC Due Reminders:**
- Create PDC with chequeDate = 3 days from now
- Trigger scheduled job for due reminders
- Verify reminder email sent to finance manager

**Validation and Error Handling:**
- Register PDC with chequeDate in past → verify validation error
- Register PDC without cheque number → verify required field error
- Register PDC without amount → verify required field error
- Mark as deposited without deposit date → verify required field error
- Report bounce without reason → verify required field error

**Prerequisites:** Story 6.3 (status: done), Story 6.1 (for invoices)

**Technical Notes:**
- Test scheduled job for PDC status updates (RECEIVED → DUE)
- Test scheduled job for due reminders
- Verify bulk entry table functionality
- Test bounce handling and late fee calculation
- Verify calendar view rendering
- Test auto-payment recording when PDC cleared
- Clean up test PDCs
- Use test fixtures for tenants with payment terms = PDC

## Story 6.4.e2e: E2E Tests for Financial Reporting

As a QA engineer / developer,
I want comprehensive end-to-end tests for financial reporting,
So that I can ensure reports are accurate and exports work correctly.

**Acceptance Criteria:**

**Given** Story 6.4 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Income Statement (P&L) Report:**
- Navigate to income statement report
- Select date range: current month
- Select property: All properties
- Verify revenue section displays:
  - Rental income (sum of invoice amounts)
  - Service charges
  - Parking fees
  - Late fees
  - Total revenue calculated correctly
- Verify expense section displays:
  - Maintenance expenses
  - Utilities
  - Salaries
  - Total expenses calculated correctly
- Verify net profit/loss = total revenue - total expenses
- Verify profit margin percentage calculated

**Cash Flow Summary:**
- View cash flow report
- Verify cash inflows (payments received)
- Verify cash outflows (expenses paid)
- Verify net cash flow = inflows - outflows
- Verify month-over-month comparison shown

**Accounts Receivable Aging:**
- View AR aging report
- Verify outstanding invoices grouped by age:
  - Current (not yet due)
  - 1-30 days overdue
  - 31-60 days overdue
  - 61-90 days overdue
  - 90+ days overdue
- Verify total outstanding amount calculated
- Verify collection rate percentage displayed

**Revenue Breakdown Charts:**
- View revenue dashboard
- Verify revenue by property pie chart renders
- Verify revenue by type pie chart (rent, service, parking)
- Verify monthly revenue trend line chart (last 12 months)
- Verify year-over-year comparison data
- Click chart segment → verify drill-down to details

**Expense Breakdown Charts:**
- View expense dashboard
- Verify expenses by category pie chart
- Verify monthly expense trend line chart
- Verify top 5 vendors by payment amount table
- Verify maintenance cost per property chart

**Financial Dashboard KPIs:**
- Navigate to financial dashboard
- Verify KPI cards:
  - Total revenue (current month)
  - Total expenses (current month)
  - Net profit/loss
  - Collection rate (payments / invoices)
  - Outstanding receivables
- Verify quick insights:
  - Revenue growth vs last month
  - Expense growth vs last month
  - Top performing property
  - Highest expense category

**Custom Date Range:**
- Select custom date range: Last quarter
- Verify all reports update with filtered data
- Verify charts recalculate for selected range

**Property-Specific Reporting:**
- Filter by specific property
- Verify all metrics calculated for that property only
- Verify charts show property-specific data

**Export to PDF:**
- Click "Export to PDF" on P&L report
- Verify PDF downloads
- Verify PDF contains:
  - Report title and date range
  - All revenue and expense data
  - Charts embedded as images
  - Net profit/loss highlighted
- Verify print-friendly formatting

**Export to Excel:**
- Click "Export to Excel"
- Verify Excel file downloads
- Verify Excel contains:
  - Multiple sheets (P&L, Cash Flow, AR Aging, etc.)
  - Data in tabular format
  - Formulas for calculations
  - Conditional formatting for negatives

**Email Reports:**
- Click "Email Report"
- Enter recipient email addresses
- Add optional message
- Send report
- Verify email sent with PDF attachment

**Comparative Reporting:**
- Enable "Compare with previous period"
- Verify current vs previous period columns shown
- Verify variance calculated (amount and percentage)
- Verify positive/negative variance color-coded

**Report Caching and Performance:**
- Load financial dashboard
- Verify KPIs load quickly (<2 seconds)
- Verify charts render within 3 seconds
- Refresh dashboard → verify cached data used (check network tab)
- Trigger manual refresh → verify data refetched

**Drill-Down Capability:**
- Click "Total revenue" on dashboard
- Verify navigates to detailed invoice list
- Click expense category on pie chart
- Verify navigates to expenses filtered by that category

**Validation and Error Handling:**
- Select invalid date range (end < start) → verify error
- Export report with no data → verify graceful handling with message
- Select future date range → verify warning or empty report

**Prerequisites:** Story 6.4 (status: done), Story 6.1 and 6.2 (for data)

**Technical Notes:**
- Test with realistic financial data (multiple invoices, payments, expenses)
- Verify all chart calculations are accurate
- Test PDF generation with charts
- Test Excel export with formulas
- Verify email functionality (mock email service)
- Test report caching mechanism
- Verify drill-down navigation
- Clean up test financial data
- Use test fixtures for properties with transaction history

---
