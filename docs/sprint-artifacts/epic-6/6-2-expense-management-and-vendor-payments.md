# Story 6.2: Expense Management and Vendor Payments

Status: drafted

## Story

As a finance manager,
I want to track expenses and process vendor payments,
So that all costs are recorded and vendors are paid on time.

## Acceptance Criteria

1. **AC1 - Expense Entity Creation:** Create Expense JPA entity with fields: id (UUID), expenseNumber (unique, format: EXP-YYYY-NNNN), category (enum: MAINTENANCE, UTILITIES, SALARIES, SUPPLIES, INSURANCE, TAXES, OTHER), propertyId (UUID foreign key, nullable for general expenses), vendorId (UUID foreign key, nullable), workOrderId (UUID foreign key, nullable), amount (BigDecimal), expenseDate (LocalDate), paymentStatus (enum: PENDING, PAID), paymentMethod (enum: CASH, BANK_TRANSFER, CARD, CHEQUE, nullable), paymentDate (LocalDate nullable), description (String, max 500 chars), receiptFilePath (String, S3 path /uploads/expenses/), recordedBy (UUID foreign key to users), createdAt, updatedAt timestamps. Add indexes on category, propertyId, vendorId, paymentStatus. [Source: docs/epics/epic-6-financial-management.md#story-62]

2. **AC2 - Expense Category Enum:** Create ExpenseCategory enum with values: MAINTENANCE, UTILITIES, SALARIES, SUPPLIES, INSURANCE, TAXES, OTHER. Each value should have a display name. Use consistent enum pattern from existing codebase. [Source: docs/epics/epic-6-financial-management.md#story-62]

3. **AC3 - Expense Number Generation:** Implement unique expense number format: EXP-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Handle concurrent generation with database sequence or optimistic locking. Example: EXP-2025-0001. [Source: docs/epics/epic-6-financial-management.md#story-62]

4. **AC4 - Manual Expense Creation:** POST /api/v1/expenses endpoint to create expense manually. Request includes: category (required), propertyId (optional), vendorId (optional), workOrderId (optional), amount (required), expenseDate (required), paymentStatus (required), paymentMethod (optional, required if PAID), description (optional), receipt file (optional). Auto-generate expenseNumber. Return created expense. [Source: docs/epics/epic-6-financial-management.md#story-62]

5. **AC5 - Automatic Expense from Work Order:** When work order status changes to COMPLETED and actualCost > 0: create expense automatically, set category = MAINTENANCE, link expense to workOrderId and vendorId from work order, set paymentStatus = PENDING, set amount = actualCost. Use @EventListener or service hook in WorkOrderService. [Source: docs/epics/epic-6-financial-management.md#story-62]

6. **AC6 - Receipt Upload:** Implement receipt upload for expenses. Accept PDF/JPG files, max 5MB. Store in S3 at /uploads/expenses/{expenseNumber}/{filename}. Use existing FileStorageService from Story 1.6. Update receiptFilePath on expense. Allow receipt replacement. Return presigned URL for download. [Source: docs/epics/epic-6-financial-management.md#story-62]

7. **AC7 - Mark Expense as Paid:** PATCH /api/v1/expenses/{id}/pay endpoint. Request includes: paymentDate (required), paymentMethod (required), transactionReference (optional). Update expense: paymentStatus = PAID, paymentDate, paymentMethod. Only PENDING expenses can be marked as paid. Return updated expense. [Source: docs/epics/epic-6-financial-management.md#story-62]

8. **AC8 - Batch Payment Processing:** POST /api/v1/expenses/batch-pay endpoint. Request includes: expenseIds (array of UUIDs), paymentDate (required), paymentMethod (required), transactionReference (optional). Validate all expenses are PENDING, mark all as PAID, generate payment summary PDF, send payment confirmation email to each unique vendor. Return updated expenses and summary PDF URL. [Source: docs/epics/epic-6-financial-management.md#story-62]

9. **AC9 - Payment Summary PDF Generation:** Generate PDF containing: company header, payment date, list of expenses paid (expense number, description, amount, vendor name), total payment amount, bank transfer reference if applicable. Store in S3 at /uploads/payment-summaries/. Use existing PDF generation pattern from Story 6.1. [Source: docs/epics/epic-6-financial-management.md#story-62]

10. **AC10 - Vendor Payment Notification:** Send email to vendor when payment processed. Email contains: payment summary, list of expenses covered, total amount paid, payment date, transaction reference. Use @Async for non-blocking. Create HTML email template vendor-payment-notification.html. [Source: docs/epics/epic-6-financial-management.md#story-62]

11. **AC11 - Expense List Page:** Create page at /property-manager/finance/expenses displaying DataTable with columns: Expense Number, Category (badge), Property, Vendor, Amount (formatted AED), Date, Status (color-coded badge). Filters: category dropdown (multi-select), property dropdown, vendor dropdown, payment status dropdown, date range picker. Search by expense number, description. Sort by expenseDate DESC default. Pagination: 20 per page. Quick actions: View, Edit, Mark as Paid, Download Receipt. Page has data-testid="page-expenses". [Source: docs/epics/epic-6-financial-management.md#story-62]

12. **AC12 - Expense Detail Page:** Create page at /property-manager/finance/expenses/{id} showing: Expense header (expense number, status badge, dates), Property/Vendor section (with links), Work order link (if linked), Amount and description, Receipt preview/download, Payment details (if paid), Action buttons (Edit if PENDING, Mark as Paid, Delete). Page has data-testid="page-expense-detail". [Source: docs/epics/epic-6-financial-management.md#story-62]

13. **AC13 - Expense Creation Form:** Create page at /property-manager/finance/expenses/new with form: Category select (required), Property select (optional, "All Properties" option), Vendor select (optional, with search), Work Order select (optional, filtered by vendor if selected), Amount input (required, decimal), Expense Date picker (required, default today), Payment Status select (PENDING/PAID), Payment Method select (required if PAID), Description textarea (optional, max 500), Receipt upload (optional, PDF/JPG, max 5MB). Form has data-testid="form-expense-create". [Source: docs/epics/epic-6-financial-management.md#story-62]

14. **AC14 - Expense Edit Page:** Create page at /property-manager/finance/expenses/{id}/edit. Only PENDING expenses can be edited. Pre-populate form with existing values. Allow editing all fields except expenseNumber. Receipt can be replaced. Form has data-testid="form-expense-edit". [Source: docs/epics/epic-6-financial-management.md#story-62]

15. **AC15 - Pending Payments Page:** Create page at /property-manager/finance/vendor-payments showing all expenses with paymentStatus = PENDING. Group by vendor (collapsible sections). Show vendor name, total pending amount, expense count. Each expense row: expense number, description, amount, date. Checkbox for selecting expenses. "Process Payment" button for selected expenses opens batch payment modal. Page has data-testid="page-vendor-payments". [Source: docs/epics/epic-6-financial-management.md#story-62]

16. **AC16 - Batch Payment Modal:** Dialog for processing batch payment. Shows: selected vendor name, list of selected expenses, total amount. Form fields: Payment Date (default today), Payment Method (select), Transaction Reference (optional). Submit processes all selected expenses, generates summary PDF, sends vendor email. Button has data-testid="btn-process-payment". [Source: docs/epics/epic-6-financial-management.md#story-62]

17. **AC17 - Expense Summary Dashboard:** Create section on expense list page or separate page showing: Total expenses by category (pie chart using Recharts), Monthly expense trend (line chart, last 12 months), Top 5 vendors by payment amount (table), Expense vs budget comparison (if budget feature exists, else skip). Add data-testid="chart-expense-category", data-testid="chart-expense-trend". [Source: docs/epics/epic-6-financial-management.md#story-62]

18. **AC18 - Expense TypeScript Types:** Create types/expense.ts with interfaces: Expense (all entity fields + vendor/property details), ExpenseCreate (for POST request), ExpenseUpdate (for PUT request), ExpenseBatchPay (for batch payment request), ExpenseCategory enum, PaymentStatus enum, ExpenseSummary (for charts). Export from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

19. **AC19 - Expense Zod Validation Schemas:** Create lib/validations/expense.ts with schemas: expenseCreateSchema (validates category required, amount > 0, expenseDate required), expenseUpdateSchema, batchPaySchema (validates expenseIds array, paymentDate, paymentMethod). Amount validations: positive numbers, 2 decimal places max. [Source: docs/architecture.md#form-pattern]

20. **AC20 - Expense Frontend Service:** Create services/expense.service.ts with methods: getExpenses(filters), getExpense(id), createExpense(data, receipt?), updateExpense(id, data, receipt?), markAsPaid(id, data), batchPay(data), deleteExpense(id), getExpenseSummary(dateRange), uploadReceipt(expenseId, file), downloadReceipt(expenseId). Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

21. **AC21 - Expense React Query Hooks:** Create hooks/useExpenses.ts with: useExpenses(filters) query, useExpense(id) query, usePendingExpenses(vendorId?) query, useExpenseSummary(dateRange) query, useCreateExpense() mutation, useUpdateExpense() mutation, useMarkAsPaid() mutation, useBatchPay() mutation, useDeleteExpense() mutation. Cache key: ['expenses'], invalidate on mutations. [Source: docs/architecture.md#custom-hook-pattern]

22. **AC22 - Expense Repository:** Create ExpenseRepository extending JpaRepository with queries: findByPropertyIdOrderByExpenseDateDesc(propertyId, Pageable), findByVendorIdOrderByExpenseDateDesc(vendorId, Pageable), findByPaymentStatus(status, Pageable), findByCategory(category, Pageable), findByCategoryAndExpenseDateBetween(category, startDate, endDate), countByPaymentStatus(status), sumAmountByCategory(category), findByVendorIdAndPaymentStatus(vendorId, status), existsByExpenseNumber(expenseNumber). [Source: docs/architecture.md#repository-pattern]

23. **AC23 - Expense Service Layer:** Create ExpenseService with methods: createExpense(dto, receipt), getExpense(id), getExpenses(filters, pageable), updateExpense(id, dto, receipt), markAsPaid(id, paymentDto), batchPay(batchDto), softDeleteExpense(id), getExpenseSummary(dateRange), createFromWorkOrder(workOrder), generateNextExpenseNumber(). Service handles: expense number generation, file upload, batch payment processing, summary calculations. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

24. **AC24 - Expense Controller:** Create ExpenseController with REST endpoints: POST /api/v1/expenses (create with optional receipt), GET /api/v1/expenses (list with filters), GET /api/v1/expenses/{id} (detail), PUT /api/v1/expenses/{id} (update), PATCH /api/v1/expenses/{id}/pay (mark as paid), POST /api/v1/expenses/batch-pay (batch payment), DELETE /api/v1/expenses/{id} (soft delete), GET /api/v1/expenses/summary (get summary for charts). All endpoints require PROPERTY_MANAGER or FINANCE_MANAGER role. [Source: docs/architecture.md#controller-pattern]

25. **AC25 - Expense DTOs:** Create DTOs: ExpenseDto (response), ExpenseCreateDto (request), ExpenseUpdateDto (request), ExpenseListDto (summary for list view), PayExpenseDto (for marking as paid), BatchPayDto (for batch payment), ExpenseSummaryDto (for dashboard/charts). Create ExpenseMapper using MapStruct. [Source: docs/architecture.md#dto-pattern]

26. **AC26 - Database Migrations:** Create Flyway migrations: V{X}__create_expenses_table.sql (expenses table with all columns, indexes, foreign keys). Use snake_case naming. Add expense_category and payment_status enum types if not exists. Determine next version number from existing migrations. [Source: docs/architecture.md#database-naming]

27. **AC27 - Work Order Integration:** Modify WorkOrderService to trigger expense creation on completion. Add method createExpenseForCompletedWorkOrder(workOrder). Call when work order status changes to COMPLETED and actualCost > 0. Handle idempotency (don't create duplicate expense). Add expenseId field to WorkOrder entity if needed for tracking. [Source: docs/epics/epic-6-financial-management.md#story-62]

28. **AC28 - Expense Status Badges:** Status badges with colors: PENDING (amber/yellow), PAID (green). Badge shows status text. Use shadcn Badge component with appropriate variant. Badge has data-testid="badge-expense-status". [Source: docs/architecture.md#styling-conventions]

29. **AC29 - Category Badges:** Category badges with colors: MAINTENANCE (blue), UTILITIES (teal), SALARIES (purple), SUPPLIES (orange), INSURANCE (indigo), TAXES (red), OTHER (gray). Badge shows category display name. Badge has data-testid="badge-expense-category". [Source: docs/architecture.md#styling-conventions]

30. **AC30 - Responsive Design:** Expense list table converts to card layout on mobile (<640px). Expense forms: single column on mobile. Batch payment modal: full-width on mobile. Charts: responsive sizing, horizontal scroll on mobile if needed. All interactive elements >= 44x44px touch target. Dark theme support. [Source: docs/architecture.md#styling-conventions]

31. **AC31 - Backend Unit Tests:** Write comprehensive tests: ExpenseServiceTest (create, update, mark as paid, batch payment, auto-create from work order), ExpenseControllerTest (endpoint authorization, validation, file upload). Test batch payment with multiple vendors. Mock S3 and email services. Achieve >= 80% code coverage for new code. [Source: docs/architecture.md#testing-backend]

32. **AC32 - Frontend Unit Tests:** Write tests using React Testing Library: Expense list page rendering and filtering, Expense form validation (create and edit), Batch payment modal functionality, Summary charts rendering (mock data), Status and category badge colors. Test all data-testid elements accessible. [Source: docs/architecture.md#testing-frontend]

33. **AC33 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

34. **AC34 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]

## Component Mapping

### shadcn/ui Components to Use

**Expense List Page:**
- table (expense list with sorting/pagination)
- badge (status and category badges)
- button (actions: view, edit, mark paid, download)
- dropdown-menu (quick actions menu)
- input (search field)
- select (category, property, vendor, status filters)
- popover + calendar (date range picker)
- pagination (for list navigation)
- skeleton (loading states)
- checkbox (for batch selection)

**Expense Detail Page:**
- card (section containers)
- badge (status, category)
- button (action buttons)
- separator (section dividers)
- avatar (vendor display)

**Expense Form (Create/Edit):**
- form (React Hook Form integration)
- input (amount, description)
- select (category, property, vendor, work order, payment method)
- popover + calendar (expense date, payment date)
- textarea (description)
- button (submit, cancel)
- label (form field labels)
- file upload (receipt)

**Pending Payments Page:**
- card (vendor groups)
- collapsible (vendor sections)
- table (expense list per vendor)
- checkbox (selection)
- button (process payment)
- dialog (batch payment modal)

**Summary Dashboard:**
- card (chart containers)
- Recharts components (PieChart, LineChart)
- table (top vendors)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert (validation errors)
- alert-dialog (confirm delete)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add table badge button dropdown-menu input select popover calendar pagination skeleton card separator dialog form label textarea alert alert-dialog sonner checkbox collapsible avatar
```

### Additional Dependencies

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.263.1",
    "zod": "^3.0.0"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Create Expense TypeScript Types** (AC: #18)
  - [ ] Create types/expense.ts with Expense interface
  - [ ] Define ExpenseCategory enum (MAINTENANCE, UTILITIES, SALARIES, SUPPLIES, INSURANCE, TAXES, OTHER)
  - [ ] Define PaymentStatus enum (PENDING, PAID)
  - [ ] Create ExpenseCreate, ExpenseUpdate interfaces
  - [ ] Create ExpenseBatchPay interface (expenseIds, paymentDate, paymentMethod, reference)
  - [ ] Create ExpenseSummary interface for charts
  - [ ] Export from types/index.ts

- [ ] **Task 2: Create Expense Zod Validation Schemas** (AC: #19)
  - [ ] Create lib/validations/expense.ts
  - [ ] Implement expenseCreateSchema (category required, amount > 0)
  - [ ] Implement expenseUpdateSchema
  - [ ] Implement batchPaySchema (expenseIds array, date, method)
  - [ ] Add amount validations (positive, 2 decimals max)
  - [ ] Export validation schemas

- [ ] **Task 3: Create Expense Frontend Service** (AC: #20)
  - [ ] Create services/expense.service.ts
  - [ ] Implement getExpenses(filters) with query params
  - [ ] Implement getExpense(id) for single expense
  - [ ] Implement createExpense(data, receipt?) with multipart form
  - [ ] Implement updateExpense(id, data, receipt?)
  - [ ] Implement markAsPaid(id, data) with PATCH
  - [ ] Implement batchPay(data) for batch payment
  - [ ] Implement deleteExpense(id)
  - [ ] Implement getExpenseSummary(dateRange)
  - [ ] Implement uploadReceipt(expenseId, file)
  - [ ] Implement downloadReceipt(expenseId) returning Blob

- [ ] **Task 4: Create Expense React Query Hooks** (AC: #21)
  - [ ] Create hooks/useExpenses.ts
  - [ ] Implement useExpenses(filters) query hook
  - [ ] Implement useExpense(id) query hook
  - [ ] Implement usePendingExpenses(vendorId?) query hook
  - [ ] Implement useExpenseSummary(dateRange) query hook
  - [ ] Implement useCreateExpense() mutation
  - [ ] Implement useUpdateExpense() mutation
  - [ ] Implement useMarkAsPaid() mutation
  - [ ] Implement useBatchPay() mutation
  - [ ] Implement useDeleteExpense() mutation
  - [ ] Add cache invalidation on mutations

- [ ] **Task 5: Create Expense Entity and Enums (Backend)** (AC: #1, #2)
  - [ ] Create ExpenseCategory enum with display names
  - [ ] Create PaymentStatus enum (PENDING, PAID)
  - [ ] Create Expense JPA entity with all fields
  - [ ] Add @ManyToOne relationships (Property, Vendor, WorkOrder, User)
  - [ ] Add validation annotations (@NotNull, @Size, @DecimalMin)
  - [ ] Add audit fields (recordedBy, createdAt, updatedAt)
  - [ ] Add @Column for receiptFilePath

- [ ] **Task 6: Create Database Migration** (AC: #26)
  - [ ] Determine next migration version number
  - [ ] Create V{X}__create_expenses_table.sql
  - [ ] Define expenses table with all columns
  - [ ] Add foreign keys to properties, vendors, work_orders, users
  - [ ] Add indexes on category, property_id, vendor_id, payment_status
  - [ ] Create expense_category and payment_status enums if needed

- [ ] **Task 7: Create Expense Repository** (AC: #22)
  - [ ] Create ExpenseRepository extending JpaRepository
  - [ ] Add findByPropertyIdOrderByExpenseDateDesc
  - [ ] Add findByVendorIdOrderByExpenseDateDesc
  - [ ] Add findByPaymentStatus for filtering
  - [ ] Add findByCategory for category filtering
  - [ ] Add findByCategoryAndExpenseDateBetween for reports
  - [ ] Add countByPaymentStatus for dashboard
  - [ ] Add sumAmountByCategory for charts
  - [ ] Add findByVendorIdAndPaymentStatus for pending payments
  - [ ] Add existsByExpenseNumber for uniqueness

- [ ] **Task 8: Create Expense DTOs and Mapper** (AC: #25)
  - [ ] Create ExpenseDto for response
  - [ ] Create ExpenseCreateDto for create request
  - [ ] Create ExpenseUpdateDto for update request
  - [ ] Create ExpenseListDto for list view summary
  - [ ] Create PayExpenseDto for marking as paid
  - [ ] Create BatchPayDto for batch payment
  - [ ] Create ExpenseSummaryDto for charts
  - [ ] Create ExpenseMapper using MapStruct
  - [ ] Add custom mapping for vendor/property details

- [ ] **Task 9: Implement Expense Number Generation** (AC: #3)
  - [ ] Create database sequence for expense numbers
  - [ ] Implement getNextSequence method
  - [ ] Format as EXP-{year}-{padded number}
  - [ ] Handle year rollover (reset sequence)
  - [ ] Ensure thread-safety with @Lock or sequence

- [ ] **Task 10: Implement Expense Service Layer** (AC: #23)
  - [ ] Create ExpenseService interface
  - [ ] Create ExpenseServiceImpl with @Service
  - [ ] Implement createExpense with number generation and file upload
  - [ ] Implement getExpense with eager loading
  - [ ] Implement getExpenses with filter support (category, property, vendor, status, date range)
  - [ ] Implement updateExpense (PENDING status only)
  - [ ] Implement markAsPaid (update status, date, method)
  - [ ] Implement batchPay (batch payment processing)
  - [ ] Implement softDeleteExpense
  - [ ] Implement getExpenseSummary for charts
  - [ ] Implement generateNextExpenseNumber

- [ ] **Task 11: Implement Receipt Upload** (AC: #6)
  - [ ] Add receipt validation (PDF/JPG, max 5MB)
  - [ ] Use FileStorageService to upload to S3
  - [ ] Store at /uploads/expenses/{expenseNumber}/{filename}
  - [ ] Update expense.receiptFilePath
  - [ ] Implement receipt replacement (delete old, upload new)
  - [ ] Return presigned URL for download

- [ ] **Task 12: Implement Batch Payment Processing** (AC: #8, #9)
  - [ ] Create batchPay method in ExpenseService
  - [ ] Validate all expenses are PENDING
  - [ ] Mark all expenses as PAID with same payment details
  - [ ] Group expenses by vendor for email notifications
  - [ ] Generate payment summary PDF
  - [ ] Upload PDF to S3 at /uploads/payment-summaries/
  - [ ] Return updated expenses and PDF URL

- [ ] **Task 13: Create Vendor Payment Email Template** (AC: #10)
  - [ ] Create vendor-payment-notification.html template
  - [ ] Include payment summary section
  - [ ] Include list of expenses paid (number, description, amount)
  - [ ] Include total amount and payment details
  - [ ] Style consistently with existing email templates

- [ ] **Task 14: Implement Vendor Payment Notification** (AC: #10)
  - [ ] Create method sendVendorPaymentNotification(vendor, expenses, paymentDetails)
  - [ ] Use @Async for non-blocking
  - [ ] Send email using existing EmailService
  - [ ] Attach payment summary PDF if available

- [ ] **Task 15: Implement Work Order Integration** (AC: #5, #27)
  - [ ] Add method createExpenseForCompletedWorkOrder in ExpenseService
  - [ ] Modify WorkOrderService to call on completion
  - [ ] Only create if actualCost > 0
  - [ ] Set category = MAINTENANCE, vendor from work order
  - [ ] Set paymentStatus = PENDING
  - [ ] Handle idempotency (check if expense already exists for work order)
  - [ ] Add workOrderId check to prevent duplicates

- [ ] **Task 16: Implement Expense Controller** (AC: #24)
  - [ ] Create ExpenseController with @RestController
  - [ ] Implement POST /api/v1/expenses with @RequestPart for file
  - [ ] Implement GET /api/v1/expenses with filters
  - [ ] Implement GET /api/v1/expenses/{id}
  - [ ] Implement PUT /api/v1/expenses/{id}
  - [ ] Implement PATCH /api/v1/expenses/{id}/pay
  - [ ] Implement POST /api/v1/expenses/batch-pay
  - [ ] Implement DELETE /api/v1/expenses/{id}
  - [ ] Implement GET /api/v1/expenses/summary
  - [ ] Add @PreAuthorize for role-based access

- [ ] **Task 17: Create Expense List Page** (AC: #11)
  - [ ] Create app/(dashboard)/property-manager/finance/expenses/page.tsx
  - [ ] Implement DataTable with expense columns
  - [ ] Add category filter dropdown (multi-select)
  - [ ] Add property filter dropdown
  - [ ] Add vendor filter dropdown (searchable)
  - [ ] Add payment status filter dropdown
  - [ ] Add date range picker for expense date
  - [ ] Implement search by expense number/description
  - [ ] Add pagination (20 per page)
  - [ ] Add quick action buttons (View, Edit, Mark Paid, Download)
  - [ ] Add checkbox column for batch selection
  - [ ] Add data-testid="page-expenses"

- [ ] **Task 18: Create Expense Detail Page** (AC: #12)
  - [ ] Create app/(dashboard)/property-manager/finance/expenses/[id]/page.tsx
  - [ ] Display expense header with number and status badge
  - [ ] Display property and vendor sections (with links)
  - [ ] Display work order link if linked
  - [ ] Display amount and description
  - [ ] Display receipt preview/download link
  - [ ] Display payment details if paid
  - [ ] Add action buttons (Edit, Mark Paid, Delete)
  - [ ] Add data-testid="page-expense-detail"

- [ ] **Task 19: Create Expense Create Form** (AC: #13)
  - [ ] Create app/(dashboard)/property-manager/finance/expenses/new/page.tsx
  - [ ] Implement form with expenseCreateSchema validation
  - [ ] Category select (required, enum values)
  - [ ] Property select (optional, with "All Properties" option)
  - [ ] Vendor select (optional, searchable)
  - [ ] Work order select (optional, filtered by vendor if selected)
  - [ ] Amount input (required, decimal)
  - [ ] Expense date picker (required, default today)
  - [ ] Payment status select (PENDING/PAID)
  - [ ] Payment method select (conditional, required if PAID)
  - [ ] Description textarea (optional, max 500)
  - [ ] Receipt upload (optional, PDF/JPG, max 5MB)
  - [ ] Add data-testid="form-expense-create"

- [ ] **Task 20: Create Expense Edit Page** (AC: #14)
  - [ ] Create app/(dashboard)/property-manager/finance/expenses/[id]/edit/page.tsx
  - [ ] Redirect if expense is not PENDING
  - [ ] Pre-populate form with existing values
  - [ ] Allow editing all fields except expenseNumber
  - [ ] Allow receipt replacement
  - [ ] Add data-testid="form-expense-edit"

- [ ] **Task 21: Create Pending Payments Page** (AC: #15)
  - [ ] Create app/(dashboard)/property-manager/finance/vendor-payments/page.tsx
  - [ ] Query expenses with paymentStatus = PENDING
  - [ ] Group expenses by vendor
  - [ ] Create collapsible sections per vendor
  - [ ] Show vendor name, total pending amount, expense count
  - [ ] Add checkbox for each expense row
  - [ ] Add "Select All" checkbox per vendor
  - [ ] Add "Process Payment" button (opens batch modal)
  - [ ] Add data-testid="page-vendor-payments"

- [ ] **Task 22: Create Batch Payment Modal** (AC: #16)
  - [ ] Create components/finance/BatchPaymentModal.tsx
  - [ ] Display selected vendor name
  - [ ] Display list of selected expenses
  - [ ] Display total amount
  - [ ] Payment Date picker (default today)
  - [ ] Payment Method select
  - [ ] Transaction Reference input (optional)
  - [ ] Handle submission with loading state
  - [ ] On success: close, refresh, toast, trigger PDF download
  - [ ] Add data-testid="btn-process-payment"

- [ ] **Task 23: Create Expense Summary Dashboard** (AC: #17)
  - [ ] Create components/finance/ExpenseSummaryCharts.tsx
  - [ ] Implement category pie chart using Recharts
  - [ ] Implement monthly trend line chart (last 12 months)
  - [ ] Create top 5 vendors by payment table
  - [ ] Add responsive chart sizing
  - [ ] Add data-testid="chart-expense-category"
  - [ ] Add data-testid="chart-expense-trend"

- [ ] **Task 24: Create Status and Category Badge Components** (AC: #28, #29)
  - [ ] Create components/finance/ExpenseStatusBadge.tsx
  - [ ] Map status to colors: PENDING=amber, PAID=green
  - [ ] Create components/finance/ExpenseCategoryBadge.tsx
  - [ ] Map categories to colors
  - [ ] Add data-testid="badge-expense-status"
  - [ ] Add data-testid="badge-expense-category"

- [ ] **Task 25: Implement Responsive Design** (AC: #30)
  - [ ] Expense list: card layout on mobile
  - [ ] Expense forms: single column on mobile
  - [ ] Batch payment modal: full-width on mobile
  - [ ] Charts: responsive sizing
  - [ ] Touch targets >= 44x44px
  - [ ] Test dark theme support
  - [ ] Test across breakpoints

- [ ] **Task 26: Write Backend Unit Tests** (AC: #31)
  - [ ] Create ExpenseServiceTest
  - [ ] Test createExpense (success, validation errors)
  - [ ] Test updateExpense (PENDING only)
  - [ ] Test markAsPaid
  - [ ] Test batchPay (multiple vendors, same vendor)
  - [ ] Test createExpenseForCompletedWorkOrder
  - [ ] Test expense number generation
  - [ ] Create ExpenseControllerTest
  - [ ] Test endpoint authorization
  - [ ] Test request validation
  - [ ] Test file upload
  - [ ] Mock S3 and email services
  - [ ] Achieve >= 80% coverage

- [ ] **Task 27: Write Frontend Unit Tests** (AC: #32)
  - [ ] Test expense list page rendering
  - [ ] Test filter functionality
  - [ ] Test expense form validation (create/edit)
  - [ ] Test batch payment modal
  - [ ] Test summary charts (with mock data)
  - [ ] Test status and category badge colors
  - [ ] Verify data-testid accessibility

- [ ] **Task 28: Mandatory Test Execution and Build Verification** (AC: #33, #34)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests before proceeding
  - [ ] Execute backend build: `mvn compile` - Zero errors required
  - [ ] Execute frontend build: `npm run build` - Zero errors required
  - [ ] Execute frontend lint: `npm run lint` - Zero errors required
  - [ ] Document results in Completion Notes

## Dev Notes

### Architecture Patterns

**Expense Flow:**
```
Manual Entry → Expense (PENDING) → Mark as Paid → Expense (PAID)
                     ↑
Work Order (COMPLETED) + actualCost > 0 → Auto-create Expense
```

**Batch Payment Flow:**
1. Select expenses for same vendor (or multiple vendors)
2. Enter payment date, method, reference
3. Validate all expenses are PENDING
4. Mark all as PAID with same payment details
5. Group by vendor, generate PDF per payment batch
6. Send notification email to each vendor
7. Invalidate React Query cache

**Auto-Creation from Work Order:**
```java
// In WorkOrderService when status changes to COMPLETED
if (workOrder.getActualCost() != null && workOrder.getActualCost().compareTo(BigDecimal.ZERO) > 0) {
    if (!expenseRepository.existsByWorkOrderId(workOrder.getId())) {
        expenseService.createExpenseForCompletedWorkOrder(workOrder);
    }
}
```

### Constraints

**Expense Rules:**
- expenseNumber must be unique (database constraint)
- Only PENDING expenses can be edited
- Only PENDING expenses can be deleted (soft delete)
- Receipt max size: 5MB
- Receipt types: PDF, JPG, JPEG, PNG
- Amount must be > 0

**Batch Payment Rules:**
- All selected expenses must be PENDING
- Same payment date/method/reference applied to all
- Email sent to each unique vendor
- PDF generated for entire batch

### Prerequisites

**From Epic 5 (Vendor Management):**
- Vendor entity with id, companyName, email
- VendorRepository and VendorService
- Vendor dropdown data

**From Epic 4 (Maintenance):**
- WorkOrder entity with actualCost field
- Work order completion flow
- Event or hook for auto-expense creation

**From Story 1.6 (AWS S3):**
- FileStorageService for receipt storage
- Presigned URL generation
- LocalStack for development

**From Story 6.1 (Invoicing):**
- PDF generation pattern (iText)
- Email notification pattern
- Number generation pattern (EXP-YYYY-NNNN same as INV-YYYY-NNNN)

### Integration Points

**With Work Order Module (Epic 4):**
- Auto-create expense when work order completed with actualCost
- Link expense to workOrderId for traceability
- Display linked work order on expense detail

**With Vendor Module (Epic 5):**
- Vendor dropdown for expense selection
- Pending payments grouped by vendor
- Payment notification emails to vendors

**With Financial Reporting (Story 6.4):**
- Expense data used in P&L reports
- Expense breakdown charts
- Cash outflow calculations

### Project Structure Notes

**Backend Files to Create:**
- `src/main/java/com/ultrabms/entity/Expense.java`
- `src/main/java/com/ultrabms/entity/ExpenseCategory.java` (enum)
- `src/main/java/com/ultrabms/entity/PaymentStatus.java` (enum)
- `src/main/java/com/ultrabms/repository/ExpenseRepository.java`
- `src/main/java/com/ultrabms/service/ExpenseService.java`
- `src/main/java/com/ultrabms/service/impl/ExpenseServiceImpl.java`
- `src/main/java/com/ultrabms/controller/ExpenseController.java`
- `src/main/java/com/ultrabms/dto/expense/*.java` (DTOs)
- `src/main/java/com/ultrabms/mapper/ExpenseMapper.java`
- `src/main/resources/db/migration/V{X}__create_expenses_table.sql`
- `src/main/resources/templates/vendor-payment-notification.html`
- `src/test/java/com/ultrabms/service/ExpenseServiceTest.java`
- `src/test/java/com/ultrabms/controller/ExpenseControllerTest.java`

**Frontend Files to Create:**
- `frontend/src/types/expense.ts`
- `frontend/src/lib/validations/expense.ts`
- `frontend/src/services/expense.service.ts`
- `frontend/src/hooks/useExpenses.ts`
- `frontend/src/app/(dashboard)/property-manager/finance/expenses/page.tsx`
- `frontend/src/app/(dashboard)/property-manager/finance/expenses/[id]/page.tsx`
- `frontend/src/app/(dashboard)/property-manager/finance/expenses/new/page.tsx`
- `frontend/src/app/(dashboard)/property-manager/finance/expenses/[id]/edit/page.tsx`
- `frontend/src/app/(dashboard)/property-manager/finance/vendor-payments/page.tsx`
- `frontend/src/components/finance/BatchPaymentModal.tsx`
- `frontend/src/components/finance/ExpenseSummaryCharts.tsx`
- `frontend/src/components/finance/ExpenseStatusBadge.tsx`
- `frontend/src/components/finance/ExpenseCategoryBadge.tsx`

### References

- [Source: docs/epics/epic-6-financial-management.md#story-62-expense-management-and-vendor-payments]
- [Source: docs/prd.md#3.6.2-expense-management]
- [Source: docs/architecture.md#financial-management]
- [Source: docs/architecture.md#data-architecture]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-28 | 1.0 | SM Agent | Initial story draft created from Epic 6 acceptance criteria |
