# Story 5.1: Vendor Registration and Profile Management

Status: done

## Story

As a property manager,
I want to register and manage vendor profiles,
So that I have a reliable network of service providers for maintenance work.

## Acceptance Criteria

1. **AC1 - Vendor List Page and Access Control:** Vendor list page accessible at /property-manager/vendors for users with PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR roles. Page displays searchable and filterable list of all vendors. Main navigation includes "Vendors" menu item. Page has data-testid="page-vendors-list". [Source: docs/epics/epic-5-vendor-management.md#story-51]

2. **AC2 - Vendor List Table Structure:** shadcn DataTable displays vendors with columns: Vendor Number (sortable), Company Name (sortable, primary link), Contact Person, Service Categories (badges, max 3 visible), Rating (1-5 stars, sortable), Status (badge: ACTIVE=green, INACTIVE=gray, SUSPENDED=red), Actions (View, Edit, Toggle Status). Server-side pagination (default 20 per page), sorting, and filtering. Mobile view converts to card layout. Table has data-testid="table-vendors". [Source: docs/epics/epic-5-vendor-management.md#story-51, docs/architecture.md#component-pattern]

3. **AC3 - Vendor List Search and Filters:** Search input searches across: company name, contact person name, vendor number. Filter controls: Status dropdown (ALL, ACTIVE, INACTIVE, SUSPENDED), Service Category multi-select (PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER), Rating filter (Any, 4+ stars, 3+ stars). Clear filters button resets all filters. Filters persist in URL query params. Search and filters have data-testid attributes. [Source: docs/epics/epic-5-vendor-management.md#story-51]

4. **AC4 - Add Vendor Button and Navigation:** "Add Vendor" button (shadcn Button, primary variant, Plus icon) displayed prominently on vendor list page. Button navigates to /property-manager/vendors/new registration page. Button disabled if user lacks PROPERTY_MANAGER role. Button has data-testid="btn-add-vendor". [Source: docs/epics/epic-5-vendor-management.md#story-51]

5. **AC5 - Vendor Registration Page Structure:** Registration page at /property-manager/vendors/new with form sections: (1) Company Information, (2) Contact Information, (3) Service Information, (4) Payment Information. Page title: "Register New Vendor". Breadcrumb: Vendors > New Vendor. Form uses React Hook Form with vendorSchema validation. Page has data-testid="page-vendor-registration". [Source: docs/epics/epic-5-vendor-management.md#story-51, docs/architecture.md#form-pattern-with-react-hook-form-zod]

6. **AC6 - Company Information Section:** Form fields: Company Name (required, max 200 chars, text input), Contact Person Name (required, max 100 chars, text input), Emirates ID or Trade License Number (required, max 50 chars, text input), TRN - Tax Registration Number (optional, 15-digit UAE TRN format). All required fields marked with asterisk (*). Section has data-testid="section-company-info". [Source: docs/epics/epic-5-vendor-management.md#story-51]

7. **AC7 - Contact Information Section:** Form fields: Email Address (required, RFC 5322 compliant, validated for uniqueness), Phone Number (required, E.164 format, placeholder "+971XXXXXXXXX"), Secondary Phone Number (optional, E.164 format), Company Address (optional, max 500 chars, textarea). Email duplicate check shows inline error: "A vendor with this email already exists". Section has data-testid="section-contact-info". [Source: docs/epics/epic-5-vendor-management.md#story-51]

8. **AC8 - Service Information Section:** Form fields: Service Categories (required, multi-select with checkboxes, min 1 selection): PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER. Service Areas (optional, multi-select, populated from properties API): lists all properties with name and address, allows vendor to indicate which properties they can service. Section has data-testid="section-service-info". [Source: docs/epics/epic-5-vendor-management.md#story-51]

9. **AC9 - Payment Information Section:** Form fields: Hourly Rate (required, decimal input, AED currency, min 0, precision 2 decimals), Emergency Callout Fee (optional, decimal input, AED currency), Payment Terms (required, dropdown: NET_15, NET_30, NET_45, NET_60 days, default NET_30). Currency displayed as "AED" prefix or suffix. Section has data-testid="section-payment-info". [Source: docs/epics/epic-5-vendor-management.md#story-51, docs/architecture.md#aed-currency-only]

10. **AC10 - Form Validation Schema:** Zod validation schema vendorSchema with rules: companyName (required string, max 200), contactPersonName (required string, max 100), email (required, valid email, RFC 5322), phoneNumber (required, E.164 regex), secondaryPhoneNumber (optional, E.164 regex), address (optional string, max 500), emiratesIdOrTradeLicense (required string, max 50), trn (optional, UAE TRN format regex), serviceCategories (required array, min 1 item), serviceAreas (optional array of UUIDs), hourlyRate (required number, min 0), emergencyCalloutFee (optional number, min 0), paymentTerms (required enum). Form shows inline validation errors in red. [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]

11. **AC11 - Form Submission and Vendor Creation:** On form submit: validate all fields, disable submit button, show loading spinner. Call POST /api/v1/vendors with form data. Backend creates Vendor entity: id (UUID), vendorNumber (auto-generated: VND-{year}-{4-digit-sequence}), all form fields, status = ACTIVE (default), rating = 0.0 (default), totalJobsCompleted = 0 (default), createdAt/updatedAt timestamps. On success: redirect to /property-manager/vendors/{id}, show toast "Vendor {companyName} registered successfully!". On error: show toast with error message, keep form data intact. Submit button has data-testid="btn-submit-vendor". [Source: docs/epics/epic-5-vendor-management.md#story-51, docs/architecture.md#rest-api-conventions]

12. **AC12 - Vendor Number Auto-Generation:** Backend generates unique vendor number on creation with format: VND-{YYYY}-{NNNN} where YYYY is current year, NNNN is zero-padded 4-digit sequence (0001-9999). Sequence resets each year. Example: VND-2025-0001, VND-2025-0002. Vendor number is read-only after creation, displayed prominently on vendor detail page. Handle race conditions with database sequence or atomic increment. [Source: docs/epics/epic-5-vendor-management.md#story-51]

13. **AC13 - Vendor Detail Page Structure:** Vendor detail page at /property-manager/vendors/{id} displays all vendor information. Page sections: (1) Header with vendor number, company name, status badge, action buttons, (2) Company Information card, (3) Contact Information card, (4) Service Information card with category badges, (5) Payment Information card, (6) Performance Metrics summary (rating, total jobs, completion rate), (7) Work Order History table (completed work orders for this vendor), (8) Document Status section (placeholder for Story 5.2). Breadcrumb: Vendors > {companyName}. Page has data-testid="page-vendor-detail". [Source: docs/epics/epic-5-vendor-management.md#story-51]

14. **AC14 - Vendor Detail Page Action Buttons:** Action buttons in header: "Edit" button (Edit icon, secondary variant) opens edit page, "Change Status" dropdown (Archive icon) with options: Activate (if INACTIVE/SUSPENDED), Deactivate (if ACTIVE), Suspend (if ACTIVE/INACTIVE). Status change shows confirmation dialog: "Are you sure you want to {action} this vendor? {consequence message}". "Delete" button (Trash icon, destructive variant) soft deletes vendor with confirmation. All buttons have data-testid attributes. [Source: docs/epics/epic-5-vendor-management.md#story-51]

15. **AC15 - Vendor Edit Page and Flow:** Edit page at /property-manager/vendors/{id}/edit pre-populates form with current vendor data. Page title: "Edit Vendor - {companyName}". Same form structure as registration but with existing values. Vendor number displayed as read-only badge. On submit: call PUT /api/v1/vendors/{id} with updated data. On success: redirect to detail page, show toast "Vendor updated successfully!". Cancel button returns to detail page without saving. Page has data-testid="page-vendor-edit". [Source: docs/epics/epic-5-vendor-management.md#story-51]

16. **AC16 - Vendor Status Management:** Status transitions: ACTIVE (default) → INACTIVE (deactivated by manager), ACTIVE → SUSPENDED (compliance issue, cannot receive work orders), INACTIVE → ACTIVE (reactivated), SUSPENDED → ACTIVE (after compliance resolved). Call PATCH /api/v1/vendors/{id}/status with {status: "ACTIVE"|"INACTIVE"|"SUSPENDED"}. Status change creates audit log entry. Suspended vendors cannot be assigned to work orders (validated in assignment flow). Status badge colors: ACTIVE=green, INACTIVE=gray, SUSPENDED=red. [Source: docs/epics/epic-5-vendor-management.md#story-51]

17. **AC17 - Vendor Soft Delete:** DELETE /api/v1/vendors/{id} performs soft delete: set isDeleted = true, deletedAt = now(), deletedBy = current user. Soft-deleted vendors excluded from list queries by default. Soft-deleted vendors cannot be assigned to work orders. Confirmation dialog: "Are you sure you want to delete {companyName}? This vendor will be removed from all lists and cannot be assigned to work orders." On success: redirect to vendor list, show toast "Vendor deleted successfully!". [Source: docs/epics/epic-5-vendor-management.md#api-endpoints]

18. **AC18 - Work Order History Section:** Vendor detail page includes "Work Order History" section showing all completed work orders assigned to this vendor. Query: GET /api/v1/vendors/{id}/work-orders returns paginated list. Table columns: Work Order # (link), Property/Unit, Title, Category, Status, Completed Date, Cost. Sort by completedDate DESC (newest first). Pagination: 10 per page. Empty state: "No completed work orders yet." Section has data-testid="section-work-order-history". [Source: docs/epics/epic-5-vendor-management.md#story-51]

19. **AC19 - Performance Metrics Summary:** Vendor detail page displays performance metrics card: Overall Rating (1-5 stars, numeric value), Total Jobs Completed (integer counter), Average Completion Time (days, placeholder for Story 5.3). Metrics calculated from work order data. Rating default 0.0 for new vendors (no ratings yet). Metrics card has data-testid="card-performance-metrics". [Source: docs/epics/epic-5-vendor-management.md#story-51]

20. **AC20 - Backend Vendor Entity:** Create Vendor JPA entity with fields: id (UUID, @Id), vendorNumber (String, unique, auto-generated), companyName (String, required, max 200), contactPersonName (String, required, max 100), email (String, required, unique, validated), phoneNumber (String, required, E.164), secondaryPhoneNumber (String, nullable), address (String, nullable, max 500), emiratesIdOrTradeLicense (String, required, max 50), trn (String, nullable), serviceCategories (JSON array), serviceAreas (JSON array of property UUIDs), hourlyRate (BigDecimal, scale 2), emergencyCalloutFee (BigDecimal, nullable), paymentTerms (PaymentTerms enum), status (VendorStatus enum, default ACTIVE), rating (BigDecimal, default 0.0, scale 2), totalJobsCompleted (Integer, default 0), isDeleted (Boolean, default false), deletedAt (LocalDateTime), deletedBy (UUID), createdAt/updatedAt (timestamps). Create indexes on: companyName, email, status, serviceCategories (GIN index for JSON). [Source: docs/epics/epic-5-vendor-management.md#story-51, docs/architecture.md#database-naming]

21. **AC21 - Backend API Endpoints:** Implement REST endpoints: POST /api/v1/vendors creates vendor (returns 201 with created vendor), GET /api/v1/vendors lists vendors with filters (status, serviceCategory, rating), search (companyName, contactPerson, vendorNumber), pagination, sorting (returns paginated VendorListDto), GET /api/v1/vendors/{id} returns vendor detail (VendorDetailDto), PUT /api/v1/vendors/{id} updates vendor (returns updated VendorDto), PATCH /api/v1/vendors/{id}/status updates vendor status (returns {id, status}), GET /api/v1/vendors/{id}/work-orders returns vendor's work order history (paginated), DELETE /api/v1/vendors/{id} soft deletes vendor (returns 204). All endpoints require PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR role via @PreAuthorize. [Source: docs/epics/epic-5-vendor-management.md#story-51, docs/architecture.md#rest-api-conventions]

22. **AC22 - Vendor DTOs and Mappers:** Create DTOs: VendorRequestDto (for create/update requests), VendorDto (basic vendor info for responses), VendorListDto (minimal fields for list view: id, vendorNumber, companyName, contactPersonName, serviceCategories, rating, status), VendorDetailDto (full vendor info including work order history count, performance metrics). Create VendorMapper using MapStruct for entity-DTO conversion. [Source: docs/architecture.md#dto-pattern]

23. **AC23 - Vendor Service Layer:** Create VendorService interface and VendorServiceImpl with methods: createVendor(VendorRequestDto), getVendorById(UUID), getAllVendors(VendorFilterDto, Pageable), updateVendor(UUID, VendorRequestDto), updateVendorStatus(UUID, VendorStatus), deleteVendor(UUID), getVendorWorkOrders(UUID, Pageable), generateVendorNumber(). Service handles: validation, vendor number generation, email uniqueness check, status transitions, audit logging. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

24. **AC24 - Vendor Repository and Database Migration:** Create VendorRepository extending JpaRepository with custom queries: findByEmail(String), findByVendorNumber(String), findByStatusAndServiceCategoriesContaining(VendorStatus, String), existsByEmail(String). Create Flyway migration V{X}__create_vendors_table.sql with: vendors table DDL, indexes, enum types (vendor_status, payment_terms). Add foreign key constraint for deletedBy referencing users table. [Source: docs/architecture.md#repository-pattern]

25. **AC25 - Email Uniqueness Validation:** On vendor create/update: check if email already exists in database (excluding current vendor on update). If duplicate found: return 400 Bad Request with error: "A vendor with email {email} already exists". Frontend shows inline error under email field. Allow same email for soft-deleted vendors (email can be reused after deletion). [Source: docs/architecture.md#validation]

26. **AC26 - TypeScript Types and Frontend Services:** Create types/vendors.ts with interfaces: Vendor, VendorListItem, VendorRequest, VendorFilter, VendorStatus enum, PaymentTerms enum, ServiceCategory enum. Create lib/validations/vendor.ts with vendorSchema, vendorFilterSchema using Zod. Create services/vendors.service.ts with methods: getVendors(filters, pagination), getVendorById(id), createVendor(data), updateVendor(id, data), updateVendorStatus(id, status), deleteVendor(id), getVendorWorkOrders(id, pagination). [Source: docs/architecture.md#typescript-strict-mode]

27. **AC27 - React Query Hooks:** Create hooks in hooks/useVendors.ts: useVendors(filters) returns paginated vendor list with loading/error states, useVendor(id) returns single vendor detail, useCreateVendor() mutation hook with success/error handling, useUpdateVendor() mutation hook, useUpdateVendorStatus() mutation hook, useDeleteVendor() mutation hook. Invalidate ['vendors'] cache on mutations. [Source: docs/architecture.md#custom-hook-pattern]

28. **AC28 - Responsive Design and Mobile Optimization:** Vendor list page: table converts to card layout on mobile (<640px), touch targets >= 44x44px, filters collapse into drawer on mobile. Vendor form pages: single column on mobile, full-width fields. Vendor detail page: card sections stack vertically on mobile. All pages support dark theme via shadcn dark mode classes. [Source: docs/architecture.md#styling-conventions]

29. **AC29 - Accessibility Requirements:** All interactive elements have data-testid attributes following convention. Keyboard navigation: Tab through fields, Enter to submit forms. ARIA labels: role="dialog" on confirmation dialogs, aria-label on icon buttons, aria-describedby for field hints. Screen reader support: form error announcements with aria-live="polite". Color contrast >= 4.5:1 for all text. Focus indicators on all interactive elements. [Source: docs/architecture.md#accessibility]

30. **AC30 - Backend Unit Tests:** Write comprehensive tests: VendorServiceTest with test cases for createVendor (success, duplicate email, validation errors), updateVendor, updateVendorStatus (valid transitions, invalid transitions), deleteVendor (soft delete verification), generateVendorNumber (uniqueness, format, year reset). VendorControllerTest for endpoint authorization and response formats. Achieve >= 80% code coverage for new code. [Source: docs/architecture.md#testing-backend]

## Component Mapping

### shadcn/ui Components to Use

**Form Components:**
- form (React Hook Form integration)
- input (text inputs)
- textarea (address field)
- select (payment terms, status filter)
- checkbox (service categories multi-select)
- label (form field labels)
- button (submit, cancel, action buttons)

**Layout Components:**
- card (information sections, metrics)
- separator (dividing sections)
- badge (status, service categories, rating)
- tabs (if grouping form sections)

**Data Display:**
- table (vendor list, work order history)
- pagination (list pagination)
- avatar (vendor logo placeholder)
- skeleton (loading states)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert-dialog (confirmation dialogs)
- alert (validation errors, info messages)

**Navigation:**
- breadcrumb (page navigation)
- dropdown-menu (status change, quick actions)

### Installation Command

Most shadcn components already installed from previous stories. Verify and add if missing:

```bash
npx shadcn@latest add checkbox alert-dialog dropdown-menu breadcrumb
```

### Additional Dependencies

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.11.0",
    "lucide-react": "^0.263.1"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types, Enums, and Zod Schemas** (AC: #26)
  - [ ] Create types/vendors.ts with Vendor, VendorListItem, VendorRequest, VendorFilter interfaces
  - [ ] Define enums: VendorStatus (ACTIVE, INACTIVE, SUSPENDED), PaymentTerms (NET_15, NET_30, NET_45, NET_60), ServiceCategory (PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER)
  - [ ] Create lib/validations/vendor.ts with vendorSchema, vendorFilterSchema using Zod
  - [ ] Add E.164 phone validation regex, UAE TRN validation regex
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Create Frontend Vendor Service** (AC: #26, #27)
  - [ ] Create services/vendors.service.ts with API methods
  - [ ] Implement getVendors(filters, pagination) with query params
  - [ ] Implement getVendorById(id), createVendor(data), updateVendor(id, data)
  - [ ] Implement updateVendorStatus(id, status), deleteVendor(id)
  - [ ] Implement getVendorWorkOrders(id, pagination)
  - [ ] Add proper error handling and response typing

- [ ] **Task 3: Create React Query Hooks** (AC: #27)
  - [ ] Create hooks/useVendors.ts with all vendor hooks
  - [ ] Implement useVendors(filters) with pagination support
  - [ ] Implement useVendor(id) for single vendor detail
  - [ ] Implement mutation hooks: useCreateVendor, useUpdateVendor, useUpdateVendorStatus, useDeleteVendor
  - [ ] Add cache invalidation on mutations

- [ ] **Task 4: Create Backend Vendor Entity and Enums** (AC: #20)
  - [ ] Create VendorStatus enum (ACTIVE, INACTIVE, SUSPENDED)
  - [ ] Create PaymentTerms enum (NET_15, NET_30, NET_45, NET_60)
  - [ ] Create ServiceCategory enum with all categories
  - [ ] Create Vendor JPA entity with all fields
  - [ ] Add JSON column handling for serviceCategories and serviceAreas arrays
  - [ ] Add audit fields (createdAt, updatedAt, isDeleted, deletedAt, deletedBy)
  - [ ] Add validation annotations (@NotNull, @Size, @Email, etc.)

- [ ] **Task 5: Create Database Migration** (AC: #24)
  - [ ] Create Flyway migration V{X}__create_vendors_table.sql
  - [ ] Define vendors table with all columns
  - [ ] Add indexes: idx_vendors_company_name, idx_vendors_email, idx_vendors_status
  - [ ] Add GIN index on service_categories for JSON array searching
  - [ ] Add unique constraint on email (for non-deleted vendors)
  - [ ] Add unique constraint on vendor_number
  - [ ] Create sequence for vendor number generation

- [ ] **Task 6: Create Vendor Repository** (AC: #24)
  - [ ] Create VendorRepository extending JpaRepository<Vendor, UUID>
  - [ ] Add findByEmail(String email) query method
  - [ ] Add findByVendorNumber(String vendorNumber) query method
  - [ ] Add existsByEmailAndIdNot(String email, UUID id) for update validation
  - [ ] Add custom query for filtering by status and service category
  - [ ] Add @Query for vendor search (company name, contact person, vendor number)

- [ ] **Task 7: Create Vendor DTOs and Mapper** (AC: #22)
  - [ ] Create VendorRequestDto for create/update requests
  - [ ] Create VendorDto for basic vendor info responses
  - [ ] Create VendorListDto for list view (minimal fields)
  - [ ] Create VendorDetailDto with full info + metrics
  - [ ] Create VendorMapper using MapStruct
  - [ ] Add custom mapping for serviceCategories (JSON to List)

- [ ] **Task 8: Implement Vendor Service Layer** (AC: #23)
  - [ ] Create VendorService interface with all methods
  - [ ] Create VendorServiceImpl with @Service annotation
  - [ ] Implement createVendor with vendor number generation
  - [ ] Implement email uniqueness validation
  - [ ] Implement getVendorById, getAllVendors with filters
  - [ ] Implement updateVendor with validation
  - [ ] Implement updateVendorStatus with transition validation
  - [ ] Implement deleteVendor (soft delete)
  - [ ] Implement getVendorWorkOrders
  - [ ] Add audit logging for status changes

- [ ] **Task 9: Implement Vendor Number Generation** (AC: #12)
  - [ ] Create generateVendorNumber() method in service
  - [ ] Format: VND-{YYYY}-{NNNN}
  - [ ] Use database sequence or atomic counter
  - [ ] Handle year rollover (reset sequence each year)
  - [ ] Ensure uniqueness under concurrent requests

- [ ] **Task 10: Implement Vendor Controller** (AC: #21)
  - [ ] Create VendorController with @RestController
  - [ ] Implement POST /api/v1/vendors (create)
  - [ ] Implement GET /api/v1/vendors (list with filters)
  - [ ] Implement GET /api/v1/vendors/{id} (detail)
  - [ ] Implement PUT /api/v1/vendors/{id} (update)
  - [ ] Implement PATCH /api/v1/vendors/{id}/status (status change)
  - [ ] Implement DELETE /api/v1/vendors/{id} (soft delete)
  - [ ] Implement GET /api/v1/vendors/{id}/work-orders (work order history)
  - [ ] Add @PreAuthorize for all endpoints
  - [ ] Add proper response status codes

- [ ] **Task 11: Create Vendor List Page** (AC: #1, #2, #3, #4)
  - [ ] Create app/(dashboard)/property-manager/vendors/page.tsx
  - [ ] Implement shadcn DataTable with server-side pagination
  - [ ] Add columns: Vendor Number, Company Name, Contact Person, Categories, Rating, Status, Actions
  - [ ] Add search input for company name, contact person, vendor number
  - [ ] Add filter controls: status, service category, rating
  - [ ] Add "Add Vendor" button with navigation
  - [ ] Implement mobile card layout
  - [ ] Add data-testid to all elements
  - [ ] Add to main navigation menu

- [ ] **Task 12: Create Vendor Registration Form Component** (AC: #5, #6, #7, #8, #9, #10, #11)
  - [ ] Create components/vendors/VendorForm.tsx reusable form component
  - [ ] Implement React Hook Form with vendorSchema
  - [ ] Create Company Information section with fields
  - [ ] Create Contact Information section with fields
  - [ ] Create Service Information section with multi-select
  - [ ] Create Payment Information section with fields
  - [ ] Add inline validation error display
  - [ ] Add submit and cancel buttons
  - [ ] Handle form submission with loading state
  - [ ] Add data-testid to all form elements

- [ ] **Task 13: Create Vendor Registration Page** (AC: #5, #11)
  - [ ] Create app/(dashboard)/property-manager/vendors/new/page.tsx
  - [ ] Integrate VendorForm component
  - [ ] Add page title and breadcrumb
  - [ ] Handle form submission with useCreateVendor hook
  - [ ] Navigate to detail page on success
  - [ ] Show success/error toasts
  - [ ] Add data-testid="page-vendor-registration"

- [ ] **Task 14: Create Vendor Detail Page** (AC: #13, #14, #18, #19)
  - [ ] Create app/(dashboard)/property-manager/vendors/[id]/page.tsx
  - [ ] Implement header with vendor number, name, status, actions
  - [ ] Create Company Information card
  - [ ] Create Contact Information card
  - [ ] Create Service Information card with category badges
  - [ ] Create Payment Information card
  - [ ] Create Performance Metrics card
  - [ ] Create Work Order History section with table
  - [ ] Add action buttons: Edit, Change Status, Delete
  - [ ] Implement status change confirmation dialog
  - [ ] Implement delete confirmation dialog
  - [ ] Add data-testid to all elements

- [ ] **Task 15: Create Vendor Edit Page** (AC: #15)
  - [ ] Create app/(dashboard)/property-manager/vendors/[id]/edit/page.tsx
  - [ ] Pre-populate VendorForm with existing data
  - [ ] Display vendor number as read-only badge
  - [ ] Handle form submission with useUpdateVendor hook
  - [ ] Navigate to detail page on success
  - [ ] Add cancel button returning to detail page
  - [ ] Add data-testid="page-vendor-edit"

- [ ] **Task 16: Implement Status Management Flow** (AC: #14, #16)
  - [ ] Create status change dropdown with options based on current status
  - [ ] Implement confirmation dialog with consequence message
  - [ ] Call PATCH /api/v1/vendors/{id}/status on confirm
  - [ ] Update UI optimistically
  - [ ] Show success toast
  - [ ] Create audit log entry in backend

- [ ] **Task 17: Implement Soft Delete Flow** (AC: #17)
  - [ ] Create delete confirmation dialog
  - [ ] Call DELETE /api/v1/vendors/{id} on confirm
  - [ ] Redirect to vendor list on success
  - [ ] Show success toast
  - [ ] Backend sets isDeleted, deletedAt, deletedBy

- [ ] **Task 18: Implement Responsive Design** (AC: #28)
  - [ ] Test vendor list on mobile: card layout
  - [ ] Test vendor form on mobile: single column, full-width
  - [ ] Test vendor detail on mobile: stacked cards
  - [ ] Ensure touch targets >= 44x44px
  - [ ] Test dark theme support
  - [ ] Test filter drawer on mobile

- [ ] **Task 19: Add Accessibility Features** (AC: #29)
  - [ ] Add data-testid to all interactive elements
  - [ ] Implement keyboard navigation
  - [ ] Add ARIA labels to icon buttons
  - [ ] Add aria-describedby for form hints
  - [ ] Add aria-live for error announcements
  - [ ] Verify color contrast >= 4.5:1
  - [ ] Add focus indicators

- [ ] **Task 20: Write Backend Unit Tests** (AC: #30)
  - [ ] Create VendorServiceTest with test cases
  - [ ] Test createVendor: success, duplicate email, validation errors
  - [ ] Test updateVendor: success, validation errors
  - [ ] Test updateVendorStatus: valid transitions, invalid transitions
  - [ ] Test deleteVendor: soft delete verification
  - [ ] Test generateVendorNumber: format, uniqueness
  - [ ] Create VendorControllerTest for endpoints
  - [ ] Achieve >= 80% code coverage

- [ ] **Task 21: Write Frontend Unit Tests**
  - [ ] Test VendorForm component with React Testing Library
  - [ ] Test form validation errors display
  - [ ] Test service category multi-select
  - [ ] Test vendor list table rendering
  - [ ] Test filter controls functionality
  - [ ] Test confirmation dialogs
  - [ ] Test React Query hooks with MSW

## Dev Notes

### Learnings from Previous Story

**From Story 4.3 (Work Order Assignment and Vendor Coordination - Status: done):**

Key patterns and components to reuse:

- **Dialog Pattern**: Reuse shadcn Dialog for confirmation dialogs
  - Full-screen on mobile, centered on desktop
  - Close on Escape or outside click
  - Form validation with React Hook Form + Zod
  - [Source: Story 4.3, AssignmentDialog]

- **Data Table Pattern**: Reuse server-side data table pattern
  - @tanstack/react-table for server-side pagination, sorting, filtering
  - Persist filter state in URL query params
  - Column visibility toggle
  - Mobile: convert to card view
  - [Source: Story 4.3, UnassignedWorkOrdersTable]

- **Badge Pattern**: Reuse badge components for status and categories
  - Color-coded status badges
  - Service category badges
  - [Source: Story 4.3, AssignmentDialog]

- **Email Notification Pattern**: Spring Mail + @Async pattern
  - Asynchronous email sending
  - HTML templates
  - Audit logging
  - [Source: Story 4.3, Email templates]

- **TypeScript Types Pattern**: Interfaces, enums, Zod schemas
  - Separate request/response DTOs
  - Enum types matching backend
  - [Source: Story 4.3, types/work-order-assignment.ts]

- **API Integration Pattern**: Axios + React Query
  - Centralized API client
  - Mutation hooks with cache invalidation
  - Loading/error states
  - [Source: Story 4.3, work-orders.service.ts]

**Dependencies Already Available** (from previous stories):
- date-fns, @tanstack/react-query, @tanstack/react-table, lucide-react
- Most shadcn/ui components already installed

**New Components Needed**:
- VendorForm (registration/edit form)
- VendorListTable (vendor list with filters)
- VendorDetailCard (information cards)
- ServiceCategoryMultiSelect (checkbox multi-select)
- StatusChangeDialog (confirmation dialog)

### Architecture Patterns

**Vendor Entity Pattern:**
- vendorNumber auto-generated with year prefix (VND-2025-0001)
- serviceCategories stored as JSON array for flexibility
- serviceAreas stored as JSON array of property UUIDs
- Soft delete with isDeleted, deletedAt, deletedBy fields
- Rating calculated from work order feedback (Story 5.3)

**Status Management Pattern:**
- VendorStatus enum: ACTIVE, INACTIVE, SUSPENDED
- Status affects work order assignment eligibility
- Status changes create audit log entries
- Confirmation dialog before status change

**Payment Terms Pattern:**
- PaymentTerms enum: NET_15, NET_30, NET_45, NET_60
- Used for vendor invoicing and payment tracking (Epic 6)
- Default: NET_30

**Service Category Pattern:**
- ServiceCategory enum with 10 categories
- Multi-select in form (checkbox group)
- Stored as JSON array for flexibility
- Filtered when assigning work orders by category

### Constraints

**Validation Rules:**
- Email: RFC 5322 compliant, unique per vendor
- Phone: E.164 format (+971XXXXXXXXX)
- TRN: UAE Tax Registration Number format (15 digits)
- Company name: max 200 chars
- Address: max 500 chars
- Hourly rate: decimal, min 0
- Service categories: min 1 selection

**Status Transition Rules:**
- ACTIVE → INACTIVE (deactivated)
- ACTIVE → SUSPENDED (compliance issue)
- INACTIVE → ACTIVE (reactivated)
- SUSPENDED → ACTIVE (after resolution)
- Cannot delete vendors with active work orders

**Soft Delete Rules:**
- isDeleted = true, deletedAt = timestamp, deletedBy = userId
- Excluded from list queries by default
- Cannot be assigned to work orders
- Email can be reused after deletion

### Testing Standards

From retrospective action items:
- ALL interactive elements MUST have data-testid attributes
- Convention: {component}-{element}-{action}
- Backend tests: >= 80% coverage
- Frontend tests: form validation, user flows
- Test email uniqueness validation

### Integration Points

**With Work Order Module (Epic 4):**
- Vendor dropdown in work order assignment (Story 4.3)
- Filter by service category matching work order category
- Only ACTIVE vendors shown in assignment dropdown
- Vendor work order history on detail page

**With Story 5.2 (Vendor Documents) - Next Story:**
- Document status section placeholder on detail page
- Will display license/insurance expiry status
- Document upload functionality added in Story 5.2

**With Story 5.3 (Vendor Performance) - Future:**
- Rating calculated from work order feedback
- Performance metrics displayed on detail page
- Vendor ranking and comparison features

### Backend Implementation Notes

**Vendor Number Generation:**
```java
public String generateVendorNumber() {
    int year = LocalDate.now().getYear();
    int sequence = getNextSequence(year); // database sequence or atomic counter
    return String.format("VND-%d-%04d", year, sequence);
}
```

**JSON Column Handling:**
```java
@Column(columnDefinition = "jsonb")
@Convert(converter = ServiceCategoryListConverter.class)
private List<ServiceCategory> serviceCategories;
```

**Soft Delete Query:**
```java
@Query("SELECT v FROM Vendor v WHERE v.isDeleted = false")
List<Vendor> findAllActive();
```

### References

- [Source: docs/epics/epic-5-vendor-management.md#story-51-vendor-registration-and-profile-management]
- [Source: docs/prd.md#3.5-vendor-management-module]
- [Source: docs/architecture.md#vendor-management]
- [Source: docs/architecture.md#frontend-implementation-patterns]
- [Source: docs/sprint-artifacts/epic-4/4-3-work-order-assignment-and-vendor-coordination.md]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-5/5-1-vendor-registration-and-profile-management.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
