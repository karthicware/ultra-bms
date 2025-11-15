# Epic 5: Vendor Management

**Goal:** Implement vendor registration, document management, and performance tracking to maintain a reliable network of service providers.

## Story 5.1: Vendor Registration and Profile Management

As a property manager,
I want to register and manage vendor profiles,
So that I have a reliable network of service providers for maintenance work.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I register a new vendor
**Then** the vendor registration form includes:

**Company Information:**
- Company name (required, max 200 chars)
- Contact person name (required, max 100 chars)
- Email address (required, validated as RFC 5322 compliant)
- Phone number (required, E.164 format)
- Secondary phone number (optional)
- Company address (text, max 500 chars)
- Emirates ID or Trade License number (required, max 50 chars)
- TRN (Tax Registration Number, optional, for UAE tax compliance)

**Service Information:**
- Service categories (multi-select: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, PAINTING, LANDSCAPING, OTHER)
- Service areas (properties they can serve, multi-select)
- Hourly rate (decimal, per hour for labor)
- Emergency callout fee (decimal, optional)
- Payment terms (dropdown: NET_15, NET_30, NET_45, NET_60 days)

**And** vendor entity is created:
- id (UUID), vendorNumber (unique, format: VND-2025-0001)
- companyName, contactPersonName
- email, phoneNumber, secondaryPhoneNumber
- address
- emiratesIdOrTradeLicense, trn
- serviceCategories (JSON array)
- serviceAreas (JSON array of propertyIds)
- hourlyRate, emergencyCalloutFee
- paymentTerms
- status (enum: ACTIVE, INACTIVE, SUSPENDED)
- rating (decimal, 0-5, calculated from feedback)
- totalJobsCompleted (integer, counter)
- createdAt, updatedAt timestamps

**And** vendor list page displays:
- Searchable and filterable list
- Filters: status, service category, rating
- Search by: company name, contact person, vendor number
- Shows: vendor number, company name, contact person, categories, rating, status
- Quick actions: View, Edit, Deactivate/Activate

**And** vendor detail page shows:
- All vendor information
- List of completed work orders
- Performance metrics (average rating, completion rate)
- Document status (licenses, insurance expiry)
- Payment history

**And** API endpoints:
- POST /api/v1/vendors: Create vendor
- GET /api/v1/vendors: List vendors with filters
- GET /api/v1/vendors/{id}: Get vendor details
- PUT /api/v1/vendors/{id}: Update vendor
- PATCH /api/v1/vendors/{id}/status: Activate/deactivate/suspend
- GET /api/v1/vendors/{id}/work-orders: Get vendor's work order history
- DELETE /api/v1/vendors/{id}: Soft delete vendor

**Prerequisites:** Story 1.4 (Core domain models)

**Technical Notes:**
- Vendor numbers auto-increment with year prefix
- Implement email validation and duplicate check
- Add database indexes on companyName, serviceCategories, status
- Frontend: Use shadcn/ui Form with multi-select for service categories
- Store service categories as JSON array for flexibility
- Calculate rating from work order feedback (average of all ratings)
- Track totalJobsCompleted counter (increment on work order completion)

## Story 5.2: Vendor Document and License Management

As a property manager,
I want to track vendor licenses and insurance documents,
So that I ensure compliance and vendor qualifications are current.

**Acceptance Criteria:**

**Given** a vendor is registered
**When** I manage their documents
**Then** the document management includes:

**Document Types:**
- Trade License (PDF, required, with expiry date)
- Insurance Certificate (PDF, required, with expiry date)
- Certifications (PDF, multiple allowed, optional, e.g., HVAC certification)
- ID copies (PDF/JPG, optional)

**And** document upload:
- Click "Upload Document" button
- Select document type from dropdown
- Choose file (PDF/JPG, max 10MB)
- Enter expiry date (date picker, for licenses and insurance)
- Optional: Add notes (max 200 chars)
- Upload and save

**And** document entity:
- id (UUID), vendorId (foreign key)
- documentType (enum: TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY)
- fileName, filePath (stored in /uploads/vendors/{vendorId}/documents/)
- fileSize, fileType
- expiryDate (date, null for documents without expiry)
- notes (text, optional)
- uploadedBy (userId)
- uploadedAt timestamp

**And** document expiry tracking:
- Dashboard alert for documents expiring in next 30 days
- Email notification to property manager 30 days before expiry
- Email notification to vendor 15 days before expiry
- Vendor status changes to SUSPENDED if critical docs (license/insurance) expire
- Manual reactivation after expired documents updated

**And** document list view:
- Shows all documents for vendor
- Color-coded status:
  - Green: Valid (expiry > 30 days away)
  - Yellow: Expiring soon (expiry within 30 days)
  - Red: Expired
- Quick actions: View, Download, Replace, Delete

**And** API endpoints:
- POST /api/v1/vendors/{vendorId}/documents: Upload document
- GET /api/v1/vendors/{vendorId}/documents: List vendor documents
- GET /api/v1/vendors/{vendorId}/documents/{id}: Download document
- PUT /api/v1/vendors/{vendorId}/documents/{id}: Replace document
- DELETE /api/v1/vendors/{vendorId}/documents/{id}: Delete document
- GET /api/v1/vendors/expiring-documents: Get all expiring documents (next 30 days)

**Prerequisites:** Story 5.1 (Vendor registration)

**Technical Notes:**
- Schedule daily job to check for expiring documents
- Send expiry notifications via email
- Auto-suspend vendors with expired critical documents
- Store documents in /uploads/vendors/{vendorId}/documents/
- Implement document versioning (keep history of replaced docs)
- Frontend: Use shadcn/ui Badge for expiry status colors
- Add calendar view for document expiry dates

## Story 5.3: Vendor Performance Tracking and Rating

As a property manager,
I want to track vendor performance and ratings,
So that I can make informed decisions when assigning work orders.

**Acceptance Criteria:**

**Given** a vendor has completed work orders
**When** I view their performance
**Then** the performance metrics include:

**Performance Summary:**
- Overall rating (1-5 stars, calculated from all work order feedback)
- Total jobs completed (counter)
- Average completion time (days)
- On-time completion rate (percentage of jobs completed by scheduled date)
- Total amount paid (sum of all work order costs)

**And** rating calculation:
- When work order is closed, property manager can rate vendor:
  - Quality of work (1-5 stars)
  - Timeliness (1-5 stars)
  - Communication (1-5 stars)
  - Professionalism (1-5 stars)
  - Comments (optional, max 500 chars)
- Overall vendor rating = average of all work order ratings
- Rating displayed on vendor profile and list

**And** performance dashboard shows:
- Vendor ranking table (sorted by rating)
- Filters: service category, date range
- Shows: rank, vendor name, rating, jobs completed, on-time rate
- Click to view vendor detail

**And** work order feedback:
- After work order completion, manager rates vendor
- Feedback linked to work order and vendor
- Feedback visible on vendor profile
- Historical feedback list with dates and comments

**And** API endpoints:
- POST /api/v1/work-orders/{id}/vendor-rating: Submit vendor rating
- GET /api/v1/vendors/{id}/performance: Get vendor performance metrics
- GET /api/v1/vendors/{id}/ratings: Get vendor rating history
- GET /api/v1/vendors/top-rated: Get top-rated vendors by category

**Prerequisites:** Story 5.1 (Vendor registration), Story 4.4 (Work order completion)

**Technical Notes:**
- Store vendor ratings in work_order_vendor_ratings table
- Calculate average rating on each new rating submission
- Update vendor.rating field (cached for performance)
- Implement scheduled job to recalculate all vendor ratings weekly
- Frontend: Use star rating component for rating input
- Display rating distribution (5-star: X%, 4-star: Y%, etc.)
- Add vendor comparison feature (compare multiple vendors side-by-side)

---

## E2E Testing Stories

**Note:** The following E2E test stories should be implemented AFTER all technical implementation stories (5.1-5.3) are completed. Each E2E story corresponds to its technical story and contains comprehensive end-to-end tests covering all user flows.

## Story 5.1.e2e: E2E Tests for Vendor Registration and Profile Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for vendor registration and management,
So that I can ensure vendor profiles are managed correctly.

**Acceptance Criteria:**

**Given** Story 5.1 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Vendor Registration Flow:**
- Navigate to vendor registration page
- Fill company information:
  - Company name: "ABC Plumbing Services" → verify required
  - Contact person: "John Doe" → verify required
  - Email: "contact@abcplumbing.com" → verify RFC 5322 validation
  - Phone: "+971501234567" → verify E.164 format
  - Secondary phone: "+97142345678" → verify optional
  - Address: "123 Main St, Dubai" → verify text area
  - Trade license: "123456" → verify required
  - TRN: "100123456789012" → verify optional
- Fill service information:
  - Service categories: Select PLUMBING, ELECTRICAL → verify multi-select
  - Service areas: Select properties from dropdown → verify multi-select
  - Hourly rate: 150.00 → verify decimal
  - Emergency callout fee: 300.00 → verify decimal
  - Payment terms: NET_30 → verify dropdown
- Submit form
- Verify vendor number generated (VND-2025-XXXX)
- Verify status = ACTIVE by default
- Verify vendor appears in vendor list

**Vendor List Page:**
- View all vendors → verify list displays
- Search by company name → verify search works
- Search by vendor number → verify search works
- Search by contact person → verify search works
- Filter by status (ACTIVE, INACTIVE, SUSPENDED) → verify filter
- Filter by service category (PLUMBING) → verify only plumbing vendors shown
- Filter by rating (4+ stars) → verify rating filter
- Sort by rating descending → verify sorting
- View vendor card → verify company name, rating, categories shown

**Vendor Detail Page:**
- Click vendor from list → navigate to detail page
- Verify all vendor information displayed
- Verify service categories shown as badges
- Verify service areas listed
- Verify payment terms displayed
- Verify performance metrics section:
  - Overall rating (stars)
  - Total jobs completed
  - Average rating value
- View completed work orders list → verify work orders linked to vendor
- View document status → verify licenses and insurance shown

**Vendor Updates:**
- Edit vendor profile → update phone number and hourly rate
- Save changes → verify updates reflected
- Deactivate vendor → verify status = INACTIVE
- Verify inactive vendors filtered by default in assignments
- Reactivate vendor → verify status = ACTIVE

**Vendor Status Management:**
- Change status to SUSPENDED → verify work orders cannot be assigned
- Change status back to ACTIVE → verify can assign work orders again

**Validation and Error Handling:**
- Submit form without company name → verify required field error
- Submit form without contact person → verify required field error
- Submit invalid email format → verify validation error
- Submit invalid phone format → verify E.164 validation
- Submit form without service categories → verify at least one required
- Submit negative hourly rate → verify validation error
- Register vendor with duplicate email → verify duplicate error

**Prerequisites:** Story 5.1 (status: done)

**Technical Notes:**
- Use Playwright with TypeScript
- Verify all data-testid attributes per conventions
- Test vendor number auto-generation
- Verify multi-select components for categories and service areas
- Test email and phone format validation
- Clean up test vendors after tests
- Use test fixtures for properties (service areas)

## Story 5.2.e2e: E2E Tests for Vendor Document Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for vendor document management,
So that I can ensure document tracking and expiry notifications work correctly.

**Acceptance Criteria:**

**Given** Story 5.2 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Document Upload Flow:**
- Navigate to vendor detail page
- Click "Upload Document" button
- Select document type: TRADE_LICENSE
- Choose PDF file (< 10MB) → verify file selection
- Enter expiry date: 1 year from now → verify date picker
- Add notes: "Valid until renewal" → verify optional field
- Submit upload → verify document uploaded
- Verify document appears in document list
- Verify uploaded by user and timestamp shown

**Multiple Document Types:**
- Upload Trade License → verify uploaded
- Upload Insurance Certificate → verify uploaded
- Upload HVAC Certification → verify uploaded
- Upload ID copy → verify uploaded
- Verify all documents listed with correct types

**Document List View:**
- View vendor documents list
- Verify document type badges shown
- Verify expiry dates displayed
- Verify color-coded status:
  - Green: Valid (expiry > 30 days) → verify green badge
  - Yellow: Expiring soon (expiry 1-30 days) → verify yellow badge
  - Red: Expired (past expiry) → verify red badge

**Document Actions:**
- Click "View" → verify document opens in new tab or modal
- Click "Download" → verify file downloads
- Click "Replace" → upload new document → verify old version replaced
- Click "Delete" → confirm deletion → verify document removed

**Document Expiry Tracking:**
- Create vendor with trade license expiring in 15 days
- Verify yellow "Expiring Soon" status displayed
- View dashboard → verify vendor appears in "Expiring Documents" alert
- Create vendor with expired insurance (expiry date in past)
- Verify red "Expired" status displayed
- Verify vendor status auto-changed to SUSPENDED

**Expiry Notifications:**
- Create vendor with document expiring in 30 days
- Trigger scheduled job (test endpoint)
- Verify email sent to property manager (30 days before)
- Create vendor with document expiring in 15 days
- Trigger scheduled job
- Verify email sent to vendor (15 days before)

**Auto-Suspension on Expiry:**
- Create vendor with valid trade license
- Manually set expiry date to yesterday (simulate expiry)
- Trigger scheduled job
- Verify vendor status changed to SUSPENDED
- Verify cannot assign work orders to suspended vendor
- Upload new valid trade license
- Manually reactivate vendor → verify status = ACTIVE

**Document Versioning:**
- Upload trade license v1 → verify uploaded
- Replace with trade license v2 → verify new version shown
- View document history → verify v1 archived (if implemented)

**Validation and Error Handling:**
- Upload file > 10MB → verify size error
- Upload non-PDF/JPG file → verify type error
- Upload document without selecting type → verify required field error
- Upload trade license without expiry date → verify expiry required for critical docs

**Prerequisites:** Story 5.2 (status: done), Story 5.1 (for vendors)

**Technical Notes:**
- Test scheduled job for expiry checks
- Verify email notifications (mock email service)
- Test auto-suspension logic
- Verify document storage in correct path
- Test color-coded status badges
- Clean up uploaded test documents
- Use test fixtures for vendors with various document states

## Story 5.3.e2e: E2E Tests for Vendor Performance Tracking

As a QA engineer / developer,
I want comprehensive end-to-end tests for vendor performance tracking,
So that I can ensure ratings and performance metrics are calculated correctly.

**Acceptance Criteria:**

**Given** Story 5.3 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Vendor Rating Flow:**
- Complete work order assigned to vendor
- Navigate to work order detail page
- Click "Rate Vendor" button
- Fill rating form:
  - Quality of work: 5 stars → verify star selection
  - Timeliness: 4 stars → verify star selection
  - Communication: 5 stars → verify star selection
  - Professionalism: 4 stars → verify star selection
  - Comments: "Excellent service, completed on time" → verify text field
- Submit rating → verify saved
- Verify rating appears in vendor profile
- Verify vendor overall rating updated

**Overall Rating Calculation:**
- Create vendor with 0 ratings → verify rating = 0.0
- Submit first rating (4.5 average) → verify vendor rating = 4.5
- Submit second rating (5.0 average) → verify vendor rating = (4.5 + 5.0) / 2 = 4.75
- Submit third rating (3.0 average) → verify vendor rating recalculated
- Verify overall rating displayed with decimal precision

**Performance Metrics Dashboard:**
- Navigate to vendor performance page
- Verify performance summary displayed:
  - Overall rating (stars and numeric value)
  - Total jobs completed counter
  - Average completion time in days
  - On-time completion rate percentage
  - Total amount paid (sum of costs)

**Performance Metrics Calculation:**
- Create vendor with 3 completed work orders:
  - WO1: completed in 2 days (scheduled 3 days) → on-time
  - WO2: completed in 5 days (scheduled 3 days) → late
  - WO3: completed in 1 day (scheduled 2 days) → on-time
- Verify total jobs completed = 3
- Verify average completion time = (2 + 5 + 1) / 3 = 2.67 days
- Verify on-time rate = 2/3 = 66.67%

**Vendor Ranking Table:**
- Navigate to vendor ranking dashboard
- Verify vendors sorted by rating descending
- Verify rank numbers displayed (1, 2, 3...)
- Filter by service category: PLUMBING → verify only plumbing vendors shown
- Filter by date range: last 30 days → verify work orders in range considered
- View vendor columns:
  - Rank
  - Vendor name
  - Rating (stars)
  - Jobs completed
  - On-time rate percentage

**Rating History View:**
- Navigate to vendor detail page
- View rating history section
- Verify all ratings listed chronologically
- Verify each rating shows:
  - Work order number (linked)
  - Date of rating
  - Individual category ratings (quality, timeliness, etc.)
  - Overall rating for that job
  - Comments
  - Rated by (property manager name)

**Top-Rated Vendors:**
- Navigate to "Top Rated Vendors" page
- Filter by category: ELECTRICAL
- Verify top 10 electrical vendors by rating
- Verify vendors with rating ≥ 4.0 shown first
- Verify vendors with no ratings shown last

**Rating Distribution:**
- View vendor profile
- Verify rating distribution chart:
  - 5 stars: X% (count and percentage)
  - 4 stars: Y%
  - 3 stars: Z%
  - 2 stars: W%
  - 1 star: V%
- Verify percentages sum to 100%

**Vendor Comparison:**
- Select 2-3 vendors for comparison
- Click "Compare Vendors" button
- Verify side-by-side comparison table:
  - Company name
  - Overall rating
  - Jobs completed
  - On-time rate
  - Hourly rate
  - Service categories
- Verify comparison helps decision-making

**Scheduled Rating Recalculation:**
- Create multiple ratings over time
- Trigger weekly recalculation job (test endpoint)
- Verify all vendor ratings recalculated correctly
- Verify vendor.rating field updated in database

**Validation and Error Handling:**
- Submit rating without quality score → verify required field error
- Submit rating without timeliness score → verify required field error
- Submit rating with 0 stars → verify minimum 1 star required
- Rate vendor twice for same work order → verify duplicate error or update

**Prerequisites:** Story 5.3 (status: done), Story 4.4 (for work order completion)

**Technical Notes:**
- Test rating calculations with various scenarios
- Verify star rating component functionality
- Test on-time completion rate calculation
- Verify scheduled job for weekly recalculation
- Test vendor comparison feature
- Clean up test ratings and work orders
- Use test fixtures for vendors with completed work orders
- Verify rating distribution percentages accuracy

---
