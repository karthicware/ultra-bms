## Epic 6: Financial Management

**Goal:** Implement comprehensive financial management including rent collection, expense tracking, PDC management, and financial reporting to ensure accurate financial operations.

### Story 6.1: Rent Invoicing and Payment Management

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

### Story 6.2: Expense Management and Vendor Payments

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

### Story 6.3: Post-Dated Cheque (PDC) Management

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

### Story 6.4: Financial Reporting and Analytics

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

