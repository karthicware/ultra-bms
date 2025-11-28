# Story 6.1: Rent Invoicing and Payment Management

Status: ready-for-dev

## Story

As a finance manager,
I want to generate rent invoices and track payments,
So that rental income is collected efficiently and accurately.

## Acceptance Criteria

1. **AC1 - Invoice Entity Creation:** Create Invoice JPA entity with fields: id (UUID), invoiceNumber (unique, format: INV-YYYY-NNNN), tenantId (UUID foreign key), unitId (UUID foreign key), propertyId (UUID foreign key), leaseId (UUID foreign key), invoiceDate (LocalDate), dueDate (LocalDate), baseRent (BigDecimal), serviceCharges (BigDecimal), parkingFees (BigDecimal), additionalCharges (JSONB array with description and amount), totalAmount (BigDecimal), paidAmount (BigDecimal, default 0), balanceAmount (BigDecimal, computed), status (enum: DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED), sentAt (LocalDateTime nullable), paidAt (LocalDateTime nullable), createdAt, updatedAt timestamps. Add indexes on invoiceNumber, tenantId, status, dueDate. [Source: docs/epics/epic-6-financial-management.md#story-61]

2. **AC2 - Payment Entity Creation:** Create Payment JPA entity with fields: id (UUID), paymentNumber (unique, format: PAY-YYYY-NNNN), invoiceId (UUID foreign key), tenantId (UUID foreign key), amount (BigDecimal), paymentMethod (enum: CASH, BANK_TRANSFER, CARD, CHEQUE, PDC), paymentDate (LocalDate), transactionReference (String nullable), notes (String nullable, max 500 chars), receiptFilePath (String, S3 path /uploads/receipts/), recordedBy (UUID foreign key to users), createdAt (LocalDateTime). Add index on invoiceId. [Source: docs/epics/epic-6-financial-management.md#story-61]

3. **AC3 - Automatic Monthly Invoice Generation:** Implement scheduled job (@Scheduled, cron: "0 0 6 1 * *" - runs 6 AM on 1st of each month) that: queries all active leases, generates invoice for each lease with rent breakdown from lease agreement (baseRent, serviceCharges, parkingFees), sets invoiceDate = 1st of month, dueDate = 5th of month (configurable), generates unique invoiceNumber (INV-YYYY-NNNN), sets status = DRAFT for review. Log job execution with count of invoices generated. [Source: docs/epics/epic-6-financial-management.md#story-61]

4. **AC4 - Manual Invoice Creation:** POST /api/v1/invoices endpoint to create invoice manually. Request includes: tenantId (required), leaseId (optional, auto-populated if tenant has single active lease), invoiceDate, dueDate, baseRent, serviceCharges, parkingFees, additionalCharges array (description, amount). Auto-calculate totalAmount as sum of all charges. Set status = DRAFT. Return created invoice with generated invoiceNumber. [Source: docs/epics/epic-6-financial-management.md#story-61]

5. **AC5 - Invoice List Page:** Create page at /property-manager/finance/invoices displaying DataTable with columns: Invoice Number, Tenant Name, Unit, Total Amount (formatted AED), Paid Amount, Balance, Due Date, Status (color-coded badge). Filters: status dropdown (multi-select), property dropdown, tenant search, date range picker (invoice date). Search by invoice number or tenant name. Sort by dueDate ASC default. Pagination: 20 per page. Quick actions: View, Record Payment, Send Email, Download PDF. Page has data-testid="page-invoices". [Source: docs/epics/epic-6-financial-management.md#story-61]

6. **AC6 - Invoice Detail Page:** Create page at /property-manager/finance/invoices/{id} showing: Invoice header (invoice number, status badge, dates), Tenant section (name, unit, property), Charges breakdown table (description, amount for each line item), Totals section (subtotal, total, paid, balance), Payment history table (date, amount, method, reference, receipt link), Action buttons (Record Payment, Send Email, Download PDF, Edit if DRAFT). Page has data-testid="page-invoice-detail". [Source: docs/epics/epic-6-financial-management.md#story-61]

7. **AC7 - Record Payment Functionality:** POST /api/v1/invoices/{id}/payments endpoint. Request: amount (required, decimal, must be > 0 and <= balanceAmount), paymentMethod (required, enum), paymentDate (required, date, default today), transactionReference (optional), notes (optional). On success: create Payment record with generated paymentNumber, update invoice.paidAmount += amount, update invoice.balanceAmount = totalAmount - paidAmount, update invoice.status (PARTIALLY_PAID if balance > 0, PAID if balance = 0), set invoice.paidAt if fully paid, generate receipt PDF, send receipt email to tenant. Return created payment. [Source: docs/epics/epic-6-financial-management.md#story-61]

8. **AC8 - Payment Recording UI:** On invoice detail page, "Record Payment" button opens modal with form: Amount (number input, default = balanceAmount, max = balanceAmount), Payment Method (select: CASH, BANK_TRANSFER, CARD, CHEQUE, PDC), Payment Date (date picker, default today), Transaction Reference (text input, optional), Notes (textarea, optional). Show current balance prominently. Submit button disabled while processing. On success: close modal, refresh invoice, show toast "Payment recorded successfully!", trigger receipt download. Button has data-testid="btn-record-payment". [Source: docs/epics/epic-6-financial-management.md#story-61]

9. **AC9 - Invoice PDF Generation:** GET /api/v1/invoices/{id}/pdf generates PDF invoice document containing: Company header (Ultra BMS logo, company name, address), Invoice details (number, date, due date), Tenant details (name, unit, property), Charges table (description, amount per line), Totals (subtotal, tax if any, total, paid, balance), Payment instructions (bank details), Footer (terms and conditions). Use iText or PDFBox library. Store PDF in S3 at /uploads/invoices/{invoiceNumber}.pdf. Return PDF as download. [Source: docs/epics/epic-6-financial-management.md#story-61]

10. **AC10 - Payment Receipt PDF Generation:** GET /api/v1/payments/{id}/receipt generates PDF receipt containing: Company header, Receipt number and date, Tenant details, Invoice reference, Payment details (amount, method, date, reference), Current invoice status (balance remaining if partial). Store in S3 at /uploads/receipts/{paymentNumber}.pdf. Return PDF as download. [Source: docs/epics/epic-6-financial-management.md#story-61]

11. **AC11 - Send Invoice Email:** POST /api/v1/invoices/{id}/send sends invoice email to tenant. Email contains: Subject "Invoice {invoiceNumber} from Ultra BMS", Body with invoice summary (amount due, due date), PDF attachment, Payment instructions link. Use @Async for asynchronous sending. Update invoice.sentAt timestamp. Update invoice.status from DRAFT to SENT. Create HTML email template invoice-notification.html. [Source: docs/epics/epic-6-financial-management.md#story-61]

12. **AC12 - Overdue Invoice Tracking:** Implement scheduled job (@Scheduled, cron: "0 0 7 * * *" - runs 7 AM daily) that: queries invoices where dueDate < today AND status IN (SENT, PARTIALLY_PAID), updates status to OVERDUE, logs count of newly overdue invoices. Does NOT auto-add late fees (handled by AC13). [Source: docs/epics/epic-6-financial-management.md#story-61]

13. **AC13 - Late Fee Calculation:** Implement scheduled job (@Scheduled, cron: "0 30 7 * * *" - runs 7:30 AM daily) that: queries invoices where status = OVERDUE AND (dueDate + 7 days) < today AND no late fee already applied, calculates late fee (configurable, default: 5% of balanceAmount, min: 50 AED, max: 500 AED), adds late fee to additionalCharges JSON array with description "Late Payment Fee", updates totalAmount and balanceAmount, sends overdue reminder email to tenant with late fee notice. Track late fee in separate column or flag to prevent duplicate charges. [Source: docs/epics/epic-6-financial-management.md#story-61]

14. **AC14 - Overdue Reminder Email:** Create email template invoice-overdue.html with: Subject "Overdue Invoice Notice - {invoiceNumber}", Body includes invoice amount, days overdue, late fee if applied, warning message, payment instructions. Send when invoice becomes overdue and when late fee is applied. [Source: docs/epics/epic-6-financial-management.md#story-61]

15. **AC15 - Tenant Invoice History API:** GET /api/v1/tenants/{id}/invoices returns paginated list of tenant's invoices. Query params: status (optional filter), page, size. Response includes invoice summary (id, invoiceNumber, totalAmount, paidAmount, balanceAmount, status, dueDate). Sorted by invoiceDate DESC. Used for tenant portal and tenant detail page. [Source: docs/epics/epic-6-financial-management.md#story-61]

16. **AC16 - Invoice Status Badges:** Status badges with colors: DRAFT (gray), SENT (blue), PARTIALLY_PAID (amber/yellow), PAID (green), OVERDUE (red), CANCELLED (dark gray). Badge shows status text and icon. Use shadcn Badge component with appropriate variant. Badge has data-testid="badge-invoice-status". [Source: docs/epics/epic-6-financial-management.md#story-61]

17. **AC17 - Invoice TypeScript Types:** Create types/invoice.ts with interfaces: Invoice (all entity fields + tenant details), InvoiceCreate (for POST request), InvoiceUpdate (for PUT request), Payment, PaymentCreate, InvoiceStatus enum, PaymentMethod enum, AdditionalCharge (description, amount). Create types/index.ts export. [Source: docs/architecture.md#typescript-strict-mode]

18. **AC18 - Invoice Zod Validation Schemas:** Create lib/validations/invoice.ts with schemas: invoiceCreateSchema (validates tenant, dates, amounts), paymentCreateSchema (validates amount > 0, paymentMethod required, date required). Amount validations: positive numbers, 2 decimal places max. Date validations: dueDate >= invoiceDate, paymentDate <= today. [Source: docs/architecture.md#form-pattern]

19. **AC19 - Invoice Frontend Service:** Create services/invoice.service.ts with methods: getInvoices(filters), getInvoice(id), createInvoice(data), updateInvoice(id, data), sendInvoice(id), recordPayment(id, payment), downloadInvoicePdf(id), downloadReceiptPdf(paymentId), getTenantInvoices(tenantId). Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

20. **AC20 - Invoice React Query Hooks:** Create hooks/useInvoices.ts with: useInvoices(filters) query, useInvoice(id) query, useTenantInvoices(tenantId) query, useCreateInvoice() mutation, useUpdateInvoice() mutation, useSendInvoice() mutation, useRecordPayment() mutation. Cache key: ['invoices'], invalidate on mutations. [Source: docs/architecture.md#custom-hook-pattern]

21. **AC21 - Invoice Repository:** Create InvoiceRepository extending JpaRepository with queries: findByTenantIdOrderByInvoiceDateDesc(tenantId, Pageable), findByStatusIn(statuses, Pageable), findByStatusAndDueDateBefore(status, date), findByPropertyId(propertyId, Pageable), countByStatus(status), existsByInvoiceNumber(invoiceNumber). [Source: docs/architecture.md#repository-pattern]

22. **AC22 - Payment Repository:** Create PaymentRepository extending JpaRepository with queries: findByInvoiceIdOrderByPaymentDateDesc(invoiceId), findByTenantIdOrderByPaymentDateDesc(tenantId, Pageable), sumAmountByInvoiceId(invoiceId). [Source: docs/architecture.md#repository-pattern]

23. **AC23 - Invoice Service Layer:** Create InvoiceService with methods: createInvoice(dto), getInvoice(id), getInvoices(filters, pageable), updateInvoice(id, dto), sendInvoice(id), recordPayment(id, paymentDto), generateInvoicePdf(id), getTenantInvoices(tenantId, pageable), generateNextInvoiceNumber(). Service handles: invoice number generation, status transitions, balance calculations, PDF generation, email sending. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

24. **AC24 - Invoice Controller:** Create InvoiceController with REST endpoints: POST /api/v1/invoices (create), GET /api/v1/invoices (list with filters), GET /api/v1/invoices/{id} (detail), PUT /api/v1/invoices/{id} (update), POST /api/v1/invoices/{id}/send (send email), POST /api/v1/invoices/{id}/payments (record payment), GET /api/v1/invoices/{id}/pdf (download PDF), GET /api/v1/payments/{id}/receipt (download receipt), GET /api/v1/tenants/{id}/invoices (tenant history). All endpoints require PROPERTY_MANAGER or FINANCE_MANAGER role. [Source: docs/architecture.md#controller-pattern]

25. **AC25 - Invoice DTOs:** Create DTOs: InvoiceDto (response), InvoiceCreateDto (request), InvoiceUpdateDto (request), PaymentDto (response), PaymentCreateDto (request), InvoiceListDto (summary for list view), InvoiceSummaryDto (for dashboard). Create InvoiceMapper using MapStruct. [Source: docs/architecture.md#dto-pattern]

26. **AC26 - Database Migrations:** Create Flyway migrations: V{X}__create_invoices_table.sql (invoices table with all columns, indexes, foreign keys), V{X+1}__create_payments_table.sql (payments table with columns, indexes, foreign keys). Use snake_case naming. Add invoice_status and payment_method enum types. [Source: docs/architecture.md#database-naming]

27. **AC27 - Invoice Number Generation:** Implement unique invoice number format: INV-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Handle concurrent generation with database sequence or optimistic locking. Example: INV-2025-0001, INV-2025-0002. [Source: docs/epics/epic-6-financial-management.md#story-61]

28. **AC28 - Payment Number Generation:** Implement unique payment number format: PAY-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Same pattern as invoice number. Example: PAY-2025-0001. [Source: docs/epics/epic-6-financial-management.md#story-61]

29. **AC29 - Responsive Design:** Invoice list table converts to card layout on mobile (<640px). Invoice detail page: single column on mobile. Payment modal: full-width fields on mobile. PDF download buttons prominent on all screen sizes. All interactive elements >= 44x44px touch target. Dark theme support. [Source: docs/architecture.md#styling-conventions]

30. **AC30 - Backend Unit Tests:** Write comprehensive tests: InvoiceServiceTest (create, update, payment recording, status transitions, PDF generation), InvoiceScheduledJobsTest (monthly generation, overdue tracking, late fee calculation), InvoiceControllerTest (endpoint authorization, validation). Achieve >= 80% code coverage for new code. Mock S3 and email services. [Source: docs/architecture.md#testing-backend]

31. **AC31 - Frontend Unit Tests:** Write tests using React Testing Library: Invoice list page rendering and filtering, Invoice detail page rendering, Payment modal form validation, Status badge color logic, Invoice hooks (mock API calls). Test all data-testid elements accessible. [Source: docs/architecture.md#testing-frontend]

## Component Mapping

### shadcn/ui Components to Use

**Invoice List Page:**
- table (invoice list with sorting/pagination)
- badge (status badges with colors)
- button (actions: view, record payment, send, download)
- dropdown-menu (quick actions menu)
- input (search field)
- select (status filter)
- popover + calendar (date range picker)
- pagination (for list navigation)
- skeleton (loading states)

**Invoice Detail Page:**
- card (section containers)
- table (charges breakdown, payment history)
- badge (status badge)
- button (action buttons)
- separator (section dividers)
- dialog (payment modal)

**Payment Modal:**
- dialog (modal container)
- form (React Hook Form integration)
- input (amount, reference, notes)
- select (payment method)
- popover + calendar (payment date)
- button (submit, cancel)
- label (form field labels)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert (validation errors)
- alert-dialog (confirm actions)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add table badge button dropdown-menu input select popover calendar pagination skeleton card separator dialog form label alert alert-dialog sonner
```

### Additional Dependencies

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.263.1",
    "zod": "^3.0.0"
  }
}
```

**Backend PDF Generation:**
```xml
<dependency>
  <groupId>com.itextpdf</groupId>
  <artifactId>itext7-core</artifactId>
  <version>8.0.2</version>
</dependency>
```

## Tasks / Subtasks

- [ ] **Task 1: Create Invoice and Payment TypeScript Types** (AC: #17)
  - [ ] Create types/invoice.ts with Invoice, InvoiceCreate, InvoiceUpdate interfaces
  - [ ] Define InvoiceStatus enum (DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED)
  - [ ] Define PaymentMethod enum (CASH, BANK_TRANSFER, CARD, CHEQUE, PDC)
  - [ ] Create Payment, PaymentCreate interfaces
  - [ ] Create AdditionalCharge interface (description, amount)
  - [ ] Export from types/index.ts

- [ ] **Task 2: Create Invoice Zod Validation Schemas** (AC: #18)
  - [ ] Create lib/validations/invoice.ts
  - [ ] Implement invoiceCreateSchema with tenant, date, amount validations
  - [ ] Implement paymentCreateSchema with amount > 0, method required
  - [ ] Add date validations (dueDate >= invoiceDate, paymentDate <= today)
  - [ ] Add amount validations (positive, 2 decimals max)
  - [ ] Export validation schemas

- [ ] **Task 3: Create Invoice Frontend Service** (AC: #19)
  - [ ] Create services/invoice.service.ts
  - [ ] Implement getInvoices(filters) with query params
  - [ ] Implement getInvoice(id) for single invoice
  - [ ] Implement createInvoice(data) with POST
  - [ ] Implement updateInvoice(id, data) with PUT
  - [ ] Implement sendInvoice(id) with POST
  - [ ] Implement recordPayment(id, payment) with POST
  - [ ] Implement downloadInvoicePdf(id) returning Blob
  - [ ] Implement downloadReceiptPdf(paymentId) returning Blob
  - [ ] Implement getTenantInvoices(tenantId)

- [ ] **Task 4: Create Invoice React Query Hooks** (AC: #20)
  - [ ] Create hooks/useInvoices.ts
  - [ ] Implement useInvoices(filters) query hook
  - [ ] Implement useInvoice(id) query hook
  - [ ] Implement useTenantInvoices(tenantId) query hook
  - [ ] Implement useCreateInvoice() mutation
  - [ ] Implement useUpdateInvoice() mutation
  - [ ] Implement useSendInvoice() mutation
  - [ ] Implement useRecordPayment() mutation
  - [ ] Add cache invalidation on mutations

- [ ] **Task 5: Create Invoice Entity and Enums (Backend)** (AC: #1)
  - [ ] Create InvoiceStatus enum
  - [ ] Create PaymentMethod enum
  - [ ] Create Invoice JPA entity with all fields
  - [ ] Add @ManyToOne relationships (Tenant, Unit, Property, Lease)
  - [ ] Add additionalCharges as @Type(JsonType.class)
  - [ ] Add validation annotations (@NotNull, @Size)
  - [ ] Add computed field balanceAmount with @Formula or @Transient

- [ ] **Task 6: Create Payment Entity (Backend)** (AC: #2)
  - [ ] Create Payment JPA entity with all fields
  - [ ] Add @ManyToOne relationship to Invoice
  - [ ] Add validation annotations
  - [ ] Add audit fields (recordedBy, createdAt)

- [ ] **Task 7: Create Database Migrations** (AC: #26)
  - [ ] Create V{X}__create_invoices_table.sql
  - [ ] Define invoices table with all columns
  - [ ] Add foreign keys to tenants, units, properties, leases
  - [ ] Add indexes on invoice_number, tenant_id, status, due_date
  - [ ] Create invoice_status and payment_method enums
  - [ ] Create V{X+1}__create_payments_table.sql
  - [ ] Define payments table with all columns
  - [ ] Add foreign key to invoices
  - [ ] Add index on invoice_id

- [ ] **Task 8: Create Invoice Repository** (AC: #21)
  - [ ] Create InvoiceRepository extending JpaRepository
  - [ ] Add findByTenantIdOrderByInvoiceDateDesc
  - [ ] Add findByStatusIn for filtering
  - [ ] Add findByStatusAndDueDateBefore for overdue tracking
  - [ ] Add findByPropertyId for property filtering
  - [ ] Add countByStatus for dashboard
  - [ ] Add existsByInvoiceNumber for uniqueness check

- [ ] **Task 9: Create Payment Repository** (AC: #22)
  - [ ] Create PaymentRepository extending JpaRepository
  - [ ] Add findByInvoiceIdOrderByPaymentDateDesc
  - [ ] Add findByTenantIdOrderByPaymentDateDesc
  - [ ] Add sumAmountByInvoiceId for balance calculation

- [ ] **Task 10: Create Invoice DTOs and Mapper** (AC: #25)
  - [ ] Create InvoiceDto for response
  - [ ] Create InvoiceCreateDto for create request
  - [ ] Create InvoiceUpdateDto for update request
  - [ ] Create InvoiceListDto for list view summary
  - [ ] Create PaymentDto for response
  - [ ] Create PaymentCreateDto for create request
  - [ ] Create InvoiceMapper using MapStruct
  - [ ] Add custom mapping for tenant/unit details

- [ ] **Task 11: Implement Invoice Service Layer** (AC: #23)
  - [ ] Create InvoiceService interface
  - [ ] Create InvoiceServiceImpl with @Service
  - [ ] Implement createInvoice with number generation
  - [ ] Implement getInvoice with eager loading
  - [ ] Implement getInvoices with filter support
  - [ ] Implement updateInvoice (DRAFT status only)
  - [ ] Implement sendInvoice (update status, send email)
  - [ ] Implement recordPayment (update amounts, status)
  - [ ] Implement generateNextInvoiceNumber (INV-YYYY-NNNN)
  - [ ] Implement getTenantInvoices

- [ ] **Task 12: Implement Invoice Number Generation** (AC: #27)
  - [ ] Create database sequence for invoice numbers
  - [ ] Implement getNextSequence method
  - [ ] Format as INV-{year}-{padded number}
  - [ ] Handle year rollover (reset sequence)
  - [ ] Ensure thread-safety with @Lock or sequence

- [ ] **Task 13: Implement Payment Number Generation** (AC: #28)
  - [ ] Create database sequence for payment numbers
  - [ ] Format as PAY-{year}-{padded number}
  - [ ] Same pattern as invoice number
  - [ ] Ensure thread-safety

- [ ] **Task 14: Implement PDF Generation Service** (AC: #9, #10)
  - [ ] Add iText7 dependency to pom.xml
  - [ ] Create PdfGenerationService
  - [ ] Implement generateInvoicePdf(invoice)
  - [ ] Create invoice PDF template with company header
  - [ ] Include charges table, totals, payment instructions
  - [ ] Implement generateReceiptPdf(payment)
  - [ ] Create receipt PDF template
  - [ ] Upload PDFs to S3 and return presigned URL

- [ ] **Task 15: Create Email Templates** (AC: #11, #14)
  - [ ] Create invoice-notification.html template
  - [ ] Include invoice summary, amount due, due date
  - [ ] Include payment instructions link
  - [ ] Create invoice-overdue.html template
  - [ ] Include days overdue, late fee notice
  - [ ] Style consistently with existing templates

- [ ] **Task 16: Implement Email Notification Service** (AC: #11, #14)
  - [ ] Create InvoiceNotificationService
  - [ ] Implement sendInvoiceEmail(invoice) @Async
  - [ ] Attach invoice PDF to email
  - [ ] Implement sendOverdueReminderEmail(invoice) @Async
  - [ ] Use existing EmailService pattern

- [ ] **Task 17: Implement Invoice Controller** (AC: #24)
  - [ ] Create InvoiceController with @RestController
  - [ ] Implement POST /api/v1/invoices
  - [ ] Implement GET /api/v1/invoices with filters
  - [ ] Implement GET /api/v1/invoices/{id}
  - [ ] Implement PUT /api/v1/invoices/{id}
  - [ ] Implement POST /api/v1/invoices/{id}/send
  - [ ] Implement POST /api/v1/invoices/{id}/payments
  - [ ] Implement GET /api/v1/invoices/{id}/pdf
  - [ ] Implement GET /api/v1/payments/{id}/receipt
  - [ ] Implement GET /api/v1/tenants/{id}/invoices
  - [ ] Add @PreAuthorize for role-based access

- [ ] **Task 18: Implement Scheduled Jobs** (AC: #3, #12, #13)
  - [ ] Create InvoiceScheduledJobs class
  - [ ] Implement generateMonthlyInvoices (cron: 1st of month 6 AM)
  - [ ] Query active leases, create invoices for each
  - [ ] Implement markOverdueInvoices (cron: daily 7 AM)
  - [ ] Implement applyLateFees (cron: daily 7:30 AM)
  - [ ] Calculate late fee (5% of balance, min 50, max 500)
  - [ ] Add late fee to additionalCharges
  - [ ] Send overdue reminder email
  - [ ] Log all job executions

- [ ] **Task 19: Create Invoice List Page** (AC: #5)
  - [ ] Create app/(dashboard)/property-manager/finance/invoices/page.tsx
  - [ ] Implement DataTable with invoice columns
  - [ ] Add status filter dropdown (multi-select)
  - [ ] Add property filter dropdown
  - [ ] Add tenant search input
  - [ ] Add date range picker for invoice date
  - [ ] Implement search by invoice number/tenant name
  - [ ] Add pagination (20 per page)
  - [ ] Add quick action buttons (View, Payment, Send, PDF)
  - [ ] Add data-testid="page-invoices"

- [ ] **Task 20: Create Invoice Detail Page** (AC: #6)
  - [ ] Create app/(dashboard)/property-manager/finance/invoices/[id]/page.tsx
  - [ ] Display invoice header with number and status badge
  - [ ] Display tenant section (name, unit, property)
  - [ ] Display charges breakdown table
  - [ ] Display totals section
  - [ ] Display payment history table
  - [ ] Add action buttons (Record Payment, Send, PDF, Edit)
  - [ ] Add data-testid="page-invoice-detail"

- [ ] **Task 21: Create Payment Recording Modal** (AC: #8)
  - [ ] Create components/finance/RecordPaymentModal.tsx
  - [ ] Implement form with paymentCreateSchema validation
  - [ ] Amount input (default = balance, max = balance)
  - [ ] Payment method select dropdown
  - [ ] Payment date picker (default today)
  - [ ] Transaction reference input (optional)
  - [ ] Notes textarea (optional)
  - [ ] Display current balance prominently
  - [ ] Handle submission with loading state
  - [ ] On success: close, refresh, toast, trigger receipt download
  - [ ] Add data-testid="btn-record-payment"

- [ ] **Task 22: Create Invoice Status Badge Component** (AC: #16)
  - [ ] Create components/finance/InvoiceStatusBadge.tsx
  - [ ] Map status to colors: DRAFT=gray, SENT=blue, PARTIAL=amber, PAID=green, OVERDUE=red, CANCELLED=dark
  - [ ] Include status icon (clock, check, alert, etc.)
  - [ ] Add data-testid="badge-invoice-status"

- [ ] **Task 23: Implement Responsive Design** (AC: #29)
  - [ ] Invoice list: card layout on mobile
  - [ ] Invoice detail: single column on mobile
  - [ ] Payment modal: full-width on mobile
  - [ ] Touch targets >= 44x44px
  - [ ] Test dark theme support
  - [ ] Test across breakpoints

- [ ] **Task 24: Write Backend Unit Tests** (AC: #30)
  - [ ] Create InvoiceServiceTest
  - [ ] Test createInvoice (success, validation errors)
  - [ ] Test recordPayment (full, partial, exceeds balance)
  - [ ] Test status transitions
  - [ ] Test PDF generation (mock S3)
  - [ ] Create InvoiceScheduledJobsTest
  - [ ] Test monthly invoice generation
  - [ ] Test overdue marking
  - [ ] Test late fee calculation
  - [ ] Create InvoiceControllerTest
  - [ ] Test endpoint authorization
  - [ ] Test request validation
  - [ ] Achieve >= 80% coverage

- [ ] **Task 25: Write Frontend Unit Tests** (AC: #31)
  - [ ] Test invoice list page rendering
  - [ ] Test filter functionality
  - [ ] Test invoice detail page
  - [ ] Test payment modal validation
  - [ ] Test status badge colors
  - [ ] Test hooks with mocked API
  - [ ] Verify data-testid accessibility

## Dev Notes

### Architecture Patterns

**Invoice Flow:**
```
Lease (active) → Invoice (DRAFT) → Invoice (SENT) → Payment → Invoice (PAID)
                                        ↓
                                Invoice (OVERDUE) → Late Fee → Overdue Reminder
```

**Payment Recording:**
1. Validate amount <= balanceAmount
2. Create Payment record
3. Update Invoice: paidAmount, balanceAmount, status
4. Generate receipt PDF, upload to S3
5. Send receipt email to tenant
6. Invalidate React Query cache

**Invoice Status Transitions:**
- DRAFT → SENT (on sendInvoice)
- SENT → PARTIALLY_PAID (on payment, balance > 0)
- SENT → PAID (on payment, balance = 0)
- PARTIALLY_PAID → PAID (on payment, balance = 0)
- SENT/PARTIALLY_PAID → OVERDUE (scheduled job, past due date)

**Late Fee Calculation:**
```java
BigDecimal calculateLateFee(Invoice invoice) {
    BigDecimal feePercent = new BigDecimal("0.05"); // 5%
    BigDecimal fee = invoice.getBalanceAmount().multiply(feePercent);
    BigDecimal minFee = new BigDecimal("50");
    BigDecimal maxFee = new BigDecimal("500");

    if (fee.compareTo(minFee) < 0) return minFee;
    if (fee.compareTo(maxFee) > 0) return maxFee;
    return fee;
}
```

### Constraints

**Invoice Rules:**
- invoiceNumber must be unique (database constraint)
- Only DRAFT invoices can be edited
- Cannot delete invoices with payments
- Due date must be >= invoice date

**Payment Rules:**
- Amount must be > 0
- Amount must be <= invoice balanceAmount
- Payment date must be <= today
- Cannot edit or delete payments (audit trail)

**Scheduled Jobs:**
- Monthly generation: 1st of month at 6:00 AM
- Overdue marking: Daily at 7:00 AM
- Late fee application: Daily at 7:30 AM
- Late fee applies 7 days after due date
- Late fee applied only once per invoice

### Prerequisites

**From Epic 3 (Tenant Management):**
- Tenant entity with lease relationship
- Lease entity with rent breakdown (baseRent, serviceCharges, parkingFees)
- Unit and Property entities

**From Story 1.6 (AWS S3):**
- FileStorageService for PDF storage
- Presigned URL generation
- LocalStack for development

**From Epic 2 (Authentication):**
- User roles: PROPERTY_MANAGER, FINANCE_MANAGER
- @PreAuthorize annotations

### Integration Points

**With Tenant Module (Epic 3):**
- Invoice linked to tenant, unit, property, lease
- Tenant invoice history endpoint
- Tenant email for notifications

**With PDC Management (Story 6.3):**
- PaymentMethod includes PDC option
- PDC clearance creates payment (future story)

**With Dashboard (Epic 8):**
- Outstanding receivables count
- Revenue metrics
- Overdue invoices alert

### References

- [Source: docs/epics/epic-6-financial-management.md#story-61-rent-invoicing-and-payment-management]
- [Source: docs/prd.md#3.6-financial-management-module]
- [Source: docs/architecture.md#financial-management]
- [Source: docs/architecture.md#data-architecture]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-6/6-1-rent-invoicing-and-payment-management.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-26 | 1.0 | SM Agent | Initial story draft created from Epic 6 acceptance criteria |
