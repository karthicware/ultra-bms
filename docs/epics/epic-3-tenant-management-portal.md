# Epic 3: Tenant Management & Portal

**Goal:** Streamline tenant lifecycle from lead generation through onboarding to exit, with comprehensive lease management, self-service portal for maintenance requests, payments, and amenity booking.

## Story 3.1: Lead Management and Quotation System

As a property manager,
I want to manage potential tenant leads and create quotations,
So that I can track prospects and convert them to tenants efficiently.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I create a new lead
**Then** the lead form includes:

**Lead Information:**
- Full name (required, max 200 chars)
- Emirates ID (required, format: XXX-XXXX-XXXXXXX-X)
- Passport number (required, max 50 chars)
- Passport expiry date (date picker)
- Home country (dropdown, required)
- Email address (required, validated as RFC 5322 compliant)
- Contact number (required, E.164 format, default prefix: +971)
- Lead source (dropdown: WEBSITE, REFERRAL, WALK_IN, PHONE_CALL, SOCIAL_MEDIA, OTHER)
- Notes (text, max 1000 chars, optional)

**And** lead entity is created:
- id (UUID), leadNumber (unique, format: LEAD-2025-0001)
- fullName, emiratesId, passportNumber, passportExpiryDate
- homeCountry, email, contactNumber
- leadSource, notes
- status (enum: NEW, CONTACTED, QUOTATION_SENT, ACCEPTED, CONVERTED, LOST)
- createdAt, updatedAt timestamps
- createdBy (userId)

**And** leads list page displays:
- Filters: status, property of interest, lead source, date range
- Search by: lead name, email, phone, Emirates ID
- Shows: lead number, name, contact, status, property interest, days in pipeline
- Quick actions: View, Create Quotation, Convert to Tenant, Mark as Lost

**And** lead detail page shows:
- All lead information
- Document uploads (Emirates ID scan, passport scan, marriage certificate if applicable)
- Communication history (notes, calls, emails)
- Quotations issued for this lead
- Status timeline

**And** create quotation for lead:

**Quotation Form:**
- Lead selection (dropdown, required - links to lead)
- Quotation issue date (date picker, default: today)
- Quotation validity date (date picker, default: 30 days from issue)
- Property and unit selection (dropdown, required)
- Stay type (dropdown: STUDIO, ONE_BHK, TWO_BHK, THREE_BHK, VILLA, required)

**Rent Details:**
- Base monthly rent (decimal, auto-populated from unit or manual)
- Service charges (decimal)
- Parking spots (integer, default: 0)
- Parking fee per spot (decimal, if parking > 0)
- Security deposit (decimal, typically 1-2 months rent)
- Admin fee (decimal, one-time)
- Total first payment (calculated: security deposit + admin fee + first month)

**Document Requirements Checklist:**
- Emirates ID scan (checkbox)
- Passport copy (checkbox)
- Marriage certificate (checkbox, if applicable)
- Visa copy (checkbox)
- Salary certificate (checkbox, if applicable)
- Bank statements (checkbox, if applicable)
- Other documents (text input for additional requirements)

**Terms and Conditions:**
- Payment terms (text, default template)
- Move-in procedures (text, default template)
- Cancellation policy (text, default template)
- Special terms (text, optional, custom terms for this quote)

**And** quotation entity:
- id (UUID), quotationNumber (unique, format: QUO-2025-0001)
- leadId (foreign key)
- propertyId, unitId (foreign keys)
- stayType, issueDate, validityDate
- baseRent, serviceCharges, parkingSpots, parkingFee
- securityDeposit, adminFee
- totalFirstPayment (calculated)
- documentRequirements (JSON array)
- paymentTerms, moveinProcedures, cancellationPolicy, specialTerms
- status (enum: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED)
- sentAt, acceptedAt, rejectedAt timestamps
- createdBy, sentBy (userIds)
- createdAt, updatedAt timestamps

**And** quotation actions:
- Save as draft (status = DRAFT, can edit later)
- Send to lead (status = SENT, send email with PDF attachment)
- Accept quotation (manual action by manager when lead accepts)
- Reject quotation (manual action with rejection reason)
- Convert to tenant (creates tenant record from lead, status = CONVERTED)

**And** quotation PDF generation:
- Company header with logo
- Quotation number and date
- Lead information (name, Emirates ID, contact)
- Property and unit details
- Rent breakdown table (itemized costs)
- Total first payment highlighted
- Document requirements checklist
- Terms and conditions
- Validity date prominently displayed
- Contact information for questions

**And** quotation dashboard (at /leads-quotes):

**KPI Cards:**
- New Quotes (last 30 days) - count
- Quotes Converted (last 30 days) - count
- Conversion Rate (%) - (converted / sent) * 100
- Avg. Time to Convert (days) - average days from sent to converted

**Sales Funnel (horizontal bar chart):**
- Quotes Issued → Quotes Accepted → Converted
- Shows progression with counts

**Quotes Expiring Soon (table):**
- Shows quotes where validityDate is within next 30 days
- Columns: Lead name, property, expiry date (days remaining)
- Color-coded: red (< 7 days), yellow (7-14 days), green (14+ days)
- Sort by expiry date ascending

**And** quotation expiry handling:
- Scheduled job runs daily
- Check quotations where validityDate < today and status = SENT
- Update status to EXPIRED
- Send notification to property manager (optional)

**And** lead to tenant conversion:
- When quotation is accepted, button: "Convert to Tenant"
- Pre-populate tenant onboarding form with lead data:
  - Name, Emirates ID, passport details, contact info
  - Selected property and unit
  - Rent details from quotation
- Link converted tenant back to original lead and quotation
- Update lead status to CONVERTED
- Update quotation status to CONVERTED
- Mark unit as RESERVED (until full onboarding completes)

**And** API endpoints:
- POST /api/v1/leads: Create lead
- GET /api/v1/leads: List leads with filters
- GET /api/v1/leads/{id}: Get lead details
- PUT /api/v1/leads/{id}: Update lead
- PATCH /api/v1/leads/{id}/status: Update lead status
- POST /api/v1/leads/{id}/documents: Upload lead document
- DELETE /api/v1/leads/{id}: Soft delete lead
- POST /api/v1/quotations: Create quotation
- GET /api/v1/quotations: List quotations with filters
- GET /api/v1/quotations/{id}: Get quotation details
- PUT /api/v1/quotations/{id}: Update quotation (if DRAFT)
- POST /api/v1/quotations/{id}/send: Send quotation email
- PATCH /api/v1/quotations/{id}/accept: Accept quotation
- PATCH /api/v1/quotations/{id}/reject: Reject quotation
- POST /api/v1/quotations/{id}/convert: Convert to tenant
- GET /api/v1/quotations/{id}/pdf: Generate quotation PDF
- GET /api/v1/leads-quotes/dashboard: Get dashboard KPIs
- DELETE /api/v1/quotations/{id}: Soft delete quotation

**Prerequisites:** Story 1.4 (Core domain models)

**Technical Notes:**
- Lead numbers and quotation numbers auto-increment with year prefix
- Store lead documents in /uploads/leads/{leadId}/documents/
- Generate quotation PDFs using iText or PDFBox
- Email quotations as PDF attachments
- Quotation validity date default: issue date + 30 days
- Calculate totalFirstPayment: securityDeposit + adminFee + baseRent + serviceCharges + (parkingSpots * parkingFee)
- Implement email notification when quotation is sent
- Add database indexes on leadNumber, quotationNumber, status, validityDate
- Frontend: Use shadcn/ui Form for lead and quotation creation
- Use Recharts for sales funnel visualization
- Link quotations to units to prevent double-booking (check unit availability)
- When lead is converted, create tenant record via Story 3.2 onboarding flow
- Quotation PDF template should match company branding
- All dates displayed in UAE timezone (Gulf Standard Time - GST)

## Story 3.2: Property and Unit Management

As a property manager,
I want to manage properties and their units,
So that I can track available units and assign tenants to them.

**Acceptance Criteria:**

**Given** I am logged in as a property manager
**When** I create a new property
**Then** the property form includes:
- Property name (required, max 200 chars)
- Full address (required, max 500 chars)
- Property type (enum: RESIDENTIAL, COMMERCIAL, MIXED_USE)
- Total units count (integer, min 1)
- Assigned property manager (dropdown of PROPERTY_MANAGER users)
- Year built (optional, 4-digit year)
- Total square footage (optional, decimal)
- Amenities list (pool, gym, parking, security, etc.)
- Property image upload (optional, max 5 images, 5MB each)

**And** property is created with:
- Unique property ID (UUID)
- Status: ACTIVE by default
- Created timestamp and created by user
- Validation: duplicate property names warned but allowed (different locations)

**And** I can manage units within a property:
- Add new unit: unit number, floor, bedrooms, bathrooms, square footage, rent amount
- Unit status: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED
- Bulk unit creation (e.g., create 10 units at once with sequential numbers)
- Unit features: balcony, view, floor plan type, parking spots included

**And** unit entity includes:
- id (UUID), propertyId (foreign key to Property)
- unitNumber (required, unique within property, max 50 chars)
- floor (integer, can be negative for basement)
- bedroomCount, bathroomCount (decimal, e.g., 2.5 baths)
- squareFootage (decimal)
- monthlyRent (decimal, base rent amount)
- status (enum: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED)
- features (JSON field for flexible attributes)
- createdAt, updatedAt timestamps

**And** property list page shows:
- Searchable and filterable list (by name, type, manager)
- Sortable columns (name, total units, occupied units, occupancy %)
- Occupancy rate calculation: (occupied units / total units) * 100
- Quick actions: View details, Edit, Add unit, View tenants
- Pagination (20 properties per page)

**And** unit list page (per property) shows:
- Grid or list view of all units
- Color-coded by status (green=available, red=occupied, yellow=maintenance)
- Filter by: status, floor, bedroom count, price range
- Quick assign tenant action for available units
- Bulk status updates (select multiple units)

**And** API endpoints:
- POST /api/v1/properties: Create property
- GET /api/v1/properties: List properties with filters
- GET /api/v1/properties/{id}: Get property details
- PUT /api/v1/properties/{id}: Update property
- DELETE /api/v1/properties/{id}: Soft delete property
- POST /api/v1/properties/{id}/units: Add unit to property
- GET /api/v1/properties/{id}/units: List units for property
- PUT /api/v1/units/{id}: Update unit
- DELETE /api/v1/units/{id}: Soft delete unit

**Prerequisites:** Story 1.4 (Property and Unit entities), Story 2.2 (RBAC)

**Technical Notes:**
- Use soft delete (active flag) instead of hard delete
- Cache property list in Ehcache (TTL 2 hours)
- Validate property manager has PROPERTY_MANAGER role
- Add database index on propertyId for fast unit lookups
- Frontend: Use shadcn/ui Table and Card components
- Implement optimistic UI updates for status changes
- Add map integration (Google Maps) for property location (optional)
- Store images in local file system or AWS S3 (future)

## Story 3.3: Tenant Onboarding and Registration

As a property manager,
I want to onboard new tenants with complete information capture,
So that I have all necessary details for lease management and compliance.

**Acceptance Criteria:**

**Given** I am managing a property
**When** I onboard a new tenant
**Then** the tenant registration form includes:

**Personal Information:**
- First name, last name (required, max 100 chars each)
- Email (required, unique, validated)
- Phone number (required, E.164 format)
- Date of birth (required, must be 18+ years)
- National ID / Passport number (required, max 50 chars)
- Nationality (dropdown)
- Emergency contact name and phone (required)

**Lease Information:**
- Property and unit selection (dropdowns, only AVAILABLE units shown)
- Lease start date (required, date picker)
- Lease end date (required, must be after start date)
- Lease duration (auto-calculated from dates, in months)
- Lease type (enum: FIXED_TERM, MONTH_TO_MONTH, YEARLY)
- Renewal option (checkbox: auto-renew, manual renew)

**Rent Breakdown:**
- Base rent (required, decimal, min 0)
- Admin fee (optional, decimal, one-time fee)
- Service charge (optional, decimal, monthly)
- Security deposit (required, decimal, typically 1-2 months rent)
- Total monthly rent (auto-calculated: base + service)

**Parking Allocation (Optional):**
- Number of parking spots (integer, default 0)
- Parking fee per spot (optional, decimal, monthly)
- Parking spot numbers (comma-separated, e.g., "P-101, P-102")
- Mulkiya document upload (optional, single file only, PDF/JPG, max 5MB)
- Note: Parking can be allocated during onboarding or later

**Payment Schedule:**
- Payment frequency (enum: MONTHLY, QUARTERLY, YEARLY)
- Payment due date (day of month, 1-31)
- Payment method (enum: BANK_TRANSFER, CHEQUE, PDC, CASH, ONLINE)
- Number of PDC cheques (if payment method = PDC)

**Document Upload:**
- Emirates ID / National ID scan (required, PDF/JPG, max 5MB)
- Passport copy (required, PDF/JPG, max 5MB)
- Visa copy (optional, PDF/JPG, max 5MB)
- Signed lease agreement (scanned physical document, PDF, max 10MB)
- Mulkiya document (optional, single file only, PDF/JPG, max 5MB)
- Additional documents (multiple files allowed)
- Note: All documents are physical copies signed in-person and scanned

**And** tenant entity is created with:
- id (UUID), userId (foreign key to User table)
- unitId (foreign key to Unit)
- All personal information fields
- Lease details (startDate, endDate, leaseType, etc.)
- Rent breakdown (baseRent, adminFee, serviceCharge)
- Parking details (parkingSpots count, parkingFee, spotNumbers, mulkiyaDocumentPath - single file)
- Payment schedule details
- Status (enum: PENDING, ACTIVE, EXPIRED, TERMINATED)
- leaseDocumentPath (path to uploaded signed lease PDF)
- createdAt, updatedAt timestamps

**And** when tenant is registered:
- Create user account with TENANT role (email, auto-generated password)
- Send welcome email with login credentials and password reset link
- Update unit status from AVAILABLE to OCCUPIED
- Generate tenant ID (e.g., TNT-2025-0001, auto-increment)
- If lease document is uploaded, send email with lease agreement attachment
- Log activity: "Tenant registered for Unit {unitNumber}"

**And** validation rules:
- Tenant cannot be assigned to already OCCUPIED unit
- Lease start date cannot be in the past (allow same day)
- Security deposit must be > 0
- Total monthly rent calculated correctly
- Email must be unique (one email per tenant)
- Age validation: Date of birth must result in 18+ years

**And** API endpoints:
- POST /api/v1/tenants: Create tenant (includes user creation)
- GET /api/v1/tenants: List tenants with filters
- GET /api/v1/tenants/{id}: Get tenant details
- PUT /api/v1/tenants/{id}: Update tenant information
- POST /api/v1/tenants/{id}/documents: Upload tenant documents
- POST /api/v1/tenants/{id}/parking: Allocate parking (can be done during or after onboarding)
- PUT /api/v1/tenants/{id}/parking: Update parking allocation
- DELETE /api/v1/tenants/{id}/parking/{spotId}: Remove parking allocation
- POST /api/v1/tenants/{id}/parking/mulkiya: Upload Mulkiya document for vehicle

**Prerequisites:** Story 3.1 (Property and Unit management), Story 2.1 (User creation)

**Technical Notes:**
- Use database transaction for tenant + user creation (rollback if either fails)
- Hash and store tenant ID documents securely
- Implement file upload with validation (file type, size)
- Store files in /uploads/tenants/{tenantId}/ directory
- Store lease agreements in /uploads/leases/{tenantId}/ directory
- Store Mulkiya document in /uploads/parking/{tenantId}/ directory (single file only)
- Auto-generate secure random password (12 chars, mixed case, numbers, symbols)
- Send email with lease agreement PDF as attachment after upload
- Frontend: Multi-step form wizard (Personal → Lease → Rent → Parking → Documents → Review)
- Use React Hook Form with Zod for complex validation
- Add field-level help text and tooltips for clarity
- Calculate total rent in real-time as user fills fields (including parking fees)
- Parking can be added later via tenant management page
- Store Mulkiya document as single file path (mulkiyaDocumentPath) in tenant record

## Story 3.4: Tenant Portal - Dashboard and Profile Management

As a tenant,
I want to access my portal dashboard and manage my profile,
So that I can view my lease details and update my information.

**Acceptance Criteria:**

**Given** I am logged in as a tenant
**When** I access my dashboard at /tenant/dashboard
**Then** I see:

**Dashboard Overview:**
- Welcome message: "Welcome back, {firstName}!"
- Current unit information:
  - Property name and address
  - Unit number, floor, bedroom/bathroom count
  - Lease start and end dates
  - Days remaining until lease expiration (countdown)
  - Lease status badge (ACTIVE, EXPIRING_SOON if < 60 days)

**Quick Stats Cards:**
- Outstanding balance (total unpaid amount)
- Next payment due date and amount
- Open maintenance requests count
- Upcoming amenity bookings count

**Quick Actions:**
- Submit maintenance request (button)
- Make payment (button)
- Book amenity (button)
- View lease agreement (button, downloads PDF)

**And** profile management page at /tenant/profile:

**Personal Information Section (Read-Only):**
- First name, last name (display only)
- Email (display only, tied to login)
- Phone number (display only)
- Date of birth (display only)
- National ID (display only)
- Emergency contact name and phone (display only)
- Note: "To update personal information, please contact property management"

**Lease Information Section (read-only):**
- Property and unit details
- Lease start and end dates
- Monthly rent breakdown (base, service, parking fees, total)
- Security deposit amount
- Payment schedule
- Download lease agreement button

**Parking Information Section (read-only):**
- Allocated parking spots (spot numbers)
- Parking fee per spot
- View/download Mulkiya document (if uploaded)
- Note: "To update parking allocation, please contact property management"

**Account Settings:**
- Change password (redirects to /settings/security)
- Language preference (future: English, Arabic)
- Note: All notifications are sent via email

**Document Repository:**
- List of uploaded documents (ID, passport, visa, etc.)
- Upload additional documents (e.g., salary certificate for renewal)
- Download previously uploaded documents
- File size and upload date shown for each

**And** API endpoints:
- GET /api/v1/tenant/dashboard: Get dashboard data (stats, activities, quick links)
- GET /api/v1/tenant/profile: Get tenant profile (read-only)
- GET /api/v1/tenant/lease: Get lease details and download PDF
- GET /api/v1/tenant/parking: Get parking allocation details
- POST /api/v1/tenant/documents: Upload document
- GET /api/v1/tenant/documents/{id}: Download document
- GET /api/v1/tenant/activities: Get activity history with pagination

**And** responsive design:
- Mobile-friendly layout (tenant portal primarily used on mobile)
- Touch-optimized buttons (min 44x44px)
- Collapsible sections on mobile
- Bottom navigation for quick access (dashboard, requests, payments, profile)

**Prerequisites:** Story 3.2 (Tenant registration)

**Technical Notes:**
- Use Next.js App Router with server components for dashboard (faster loading)
- Implement skeleton loaders for dashboard data
- Cache dashboard stats in browser (refresh every 5 minutes)
- Frontend: Use shadcn/ui Card, Badge, and Avatar components
- Add real-time updates for outstanding balance (refetch on payment)
- Implement activity logging service for audit trail
- Display dates in UAE timezone (all system dates in Gulf Standard Time - GST)
- Add breadcrumb navigation for better UX
- Profile is read-only - tenant must contact property management for changes
- All notifications sent via email only

## Story 3.5: Tenant Portal - Maintenance Request Submission

As a tenant,
I want to submit maintenance requests through the portal,
So that I can report issues and track their resolution.

**Acceptance Criteria:**

**Given** I am logged in as a tenant
**When** I submit a maintenance request
**Then** the request form includes:

**Request Details:**
- Category (dropdown: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, CARPENTRY, PEST_CONTROL, CLEANING, OTHER)
- Priority (auto-suggested based on category, editable):
  - HIGH: No water, no electricity, AC not working in summer, gas leak
  - MEDIUM: Leaking faucet, broken appliance, door lock issue
  - LOW: Paint touch-up, minor repairs, general maintenance
- Title (required, max 100 chars, e.g., "Leaking kitchen faucet")
- Description (required, max 1000 chars, rich text editor for formatting)
- Preferred access time:
  - Immediate (emergencies)
  - Morning (8 AM - 12 PM)
  - Afternoon (12 PM - 5 PM)
  - Evening (5 PM - 8 PM)
  - Any time
- Preferred access date (date picker, default: today for HIGH, tomorrow for others)

**Attachments:**
- Upload up to 5 photos (JPG/PNG, max 5MB each)
- Photo preview with remove option
- Note: Video uploads not supported

**And** form validation:
- Title and description are required
- Category must be selected
- Photos are optional but recommended for faster resolution
- Description must be at least 20 characters
- Show character count for description (1000 chars max)

**And** request submission:
- API call: POST /api/v1/maintenance-requests
- Request body: {category, priority, title, description, preferredAccessTime, preferredAccessDate, attachments[]}
- Backend creates MaintenanceRequest entity:
  - id (UUID), tenantId, unitId, propertyId
  - requestNumber (unique, format: MR-2025-0001)
  - category, priority, title, description
  - status (default: SUBMITTED)
  - preferredAccessTime, preferredAccessDate
  - submittedAt timestamp
  - assignedTo (null initially, assigned by manager later)
  - attachments (array of file paths)
- Upload files to /uploads/maintenance/{requestId}/
- Send notification to property manager
- Return request number to tenant

**And** after submission:
- Success message: "Request #{requestNumber} submitted successfully"
- Redirect to request details page
- Email confirmation sent to tenant with request number
- Push notification to property manager (if enabled)

**And** request tracking page at /tenant/requests:
- List all requests (newest first)
- Filter by: status (all, open, in progress, completed, closed)
- Filter by: category
- Search by: request number, title, description
- Each request shows:
  - Request number (clickable link)
  - Title and category
  - Status badge with color coding:
    - SUBMITTED (yellow): "Waiting for assignment"
    - ASSIGNED (blue): "Assigned to {vendorName}"
    - IN_PROGRESS (orange): "Work in progress"
    - COMPLETED (green): "Work completed"
    - CLOSED (gray): "Request closed"
  - Submitted date and priority
  - Last updated timestamp

**And** request details page at /tenant/requests/{id}:
- Full request information (title, description, category, priority)
- Photo/video gallery (thumbnails, click to enlarge)
- Status timeline:
  - Submitted on {date}
  - Assigned to {vendor} on {date}
  - In progress on {date}
  - Completed on {date}
  - Closed on {date}
- Assigned vendor information (name, contact - if assigned)
- Estimated completion date (if provided)
- Actual completion date (if completed)
- Work notes from vendor (visible after completion)
- Completion photos (before/after photos from vendor)
- Tenant rating and feedback section (after completion):
  - Rate service: 1-5 stars
  - Comment field (optional, max 500 chars)
  - Submit feedback button

**And** status updates:
- Real-time status changes (polling every 30 seconds or WebSocket)
- Email notification on status change:
  - Assigned: "Your request has been assigned to {vendor}"
  - In Progress: "Work has started on your request"
  - Completed: "Your request has been completed. Please review."
  - Closed: "Your request has been closed"
- In-app notification badge on dashboard

**And** API endpoints:
- POST /api/v1/maintenance-requests: Create request
- GET /api/v1/maintenance-requests: List tenant's requests with filters
- GET /api/v1/maintenance-requests/{id}: Get request details
- POST /api/v1/maintenance-requests/{id}/feedback: Submit rating and feedback
- DELETE /api/v1/maintenance-requests/{id}: Cancel request (only if status = SUBMITTED)

**Prerequisites:** Story 3.3 (Tenant dashboard), Story 1.4 (Unit entity)

**Technical Notes:**
- Use React Hook Form with file upload component
- Implement image compression before upload (reduce 5MB to ~500KB)
- Store images with thumbnail generation (200x200px for list view)
- Use shadcn/ui Dialog for photo lightbox/gallery
- Implement optimistic UI update (show request immediately, then confirm)
- Add service worker for offline request drafts (save to IndexedDB)
- Frontend: Use react-rating-stars-component for star rating
- WebSocket for real-time status updates (or polling as fallback)
- Add analytics tracking for request categories to identify common issues
- No video upload support - photos only
- All status notifications sent via email

---

## E2E Testing Stories

**Note:** The following E2E test stories should be implemented AFTER all technical implementation stories (3.1-3.5) are completed. Each E2E story corresponds to its technical story and contains comprehensive end-to-end tests covering all user flows.

## Story 3.1.e2e: E2E Tests for Lead Management and Quotation System

As a QA engineer / developer,
I want comprehensive end-to-end tests for the lead management and quotation system,
So that I can ensure the complete user flows work correctly across frontend and backend.

**Acceptance Criteria:**

**Given** Story 3.1 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Lead Management Flow:**
- Create lead with all required fields → verify lead appears in list
- Upload document to lead (Emirates ID, passport) → verify document appears
- Search leads by name, email, Emirates ID → verify correct results
- Filter leads by status, source, date range → verify filtered list
- Update lead status → verify status change reflected
- View lead communication history → verify timeline events
- Delete lead → verify soft delete (not in default list)

**Quotation Management Flow:**
- Create quotation from lead detail page → verify form pre-filled
- Fill quotation form with rent details → verify real-time total calculation
- Add document requirements checklist → verify selections saved
- Save quotation as draft → verify status = DRAFT, can edit
- Send quotation via email → verify status = SENT, email triggered
- Download quotation PDF → verify PDF contains all details
- Accept quotation → verify status = ACCEPTED
- Reject quotation with reason → verify status = REJECTED
- Handle quotation expiry → verify status = EXPIRED after validity date

**Lead to Tenant Conversion:**
- Accept quotation → verify "Convert to Tenant" button appears
- Click convert → verify redirect to tenant onboarding (Story 3.3)
- Verify lead status = CONVERTED
- Verify quotation status = CONVERTED
- Verify unit status = RESERVED

**Dashboard and Analytics:**
- View leads/quotes dashboard → verify KPI cards display correct counts
- Verify conversion rate calculation: (converted / sent) * 100
- Check sales funnel chart → verify data visualization renders
- Review "Quotes Expiring Soon" table → verify color coding (red <7 days, yellow 7-14, green 14+)
- Verify dashboard auto-refresh (5 minutes)

**Validation and Error Handling:**
- Submit lead form with missing required fields → verify inline errors
- Submit invalid Emirates ID format → verify format error
- Submit invalid email → verify validation error
- Create quotation with validity date < issue date → verify error
- Send quotation with no email → verify error handling

**Prerequisites:** Story 3.1 (status: done)

**Technical Notes:**
- Use Playwright with TypeScript for all tests
- Verify all data-testid attributes exist per docs/data-testid-conventions.md
- Run scripts/check-services.sh before test execution
- Backend must be running on localhost:8080
- Frontend must be running on localhost:3000
- Use test database (ultra_bms_test) to avoid polluting dev data
- Mock external services (email sending, PDF generation) if needed
- Generate test data fixtures for leads, quotations
- Clean up test data after each test suite
- Test coverage target: All AC from Story 3.1
- Include screenshot capture on test failures
- Generate HTML test report with Playwright reporter

## Story 3.2.e2e: E2E Tests for Property and Unit Management

As a QA engineer / developer,
I want comprehensive end-to-end tests for property and unit management,
So that I can ensure property managers can effectively manage properties and units.

**Acceptance Criteria:**

**Given** Story 3.2 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Property Management Flow:**
- Create property with all fields → verify property appears in list
- Upload property images (max 5) → verify images displayed in gallery
- Search properties by name, address → verify search results
- Filter properties by type, manager, occupancy range → verify filters work
- Sort properties by name, occupancy % → verify sorting
- Edit property details → verify updates saved
- Delete property (no occupied units) → verify soft delete
- Attempt delete with occupied units → verify validation error

**Unit Management Flow:**
- Add single unit to property → verify unit appears in unit list
- Bulk create units (e.g., 10 units) → verify all units created with sequential numbers
- View unit in grid view → verify color-coded status badges (green/red/yellow)
- View unit in list view → verify table displays correctly
- Filter units by status, floor, bedrooms, rent range → verify filters
- Update unit details → verify changes saved
- Change unit status AVAILABLE → RESERVED → OCCUPIED → verify status transitions
- Delete unit (not occupied) → verify soft delete
- Attempt delete occupied unit → verify validation error

**Occupancy Calculations:**
- Create property with 10 total units → create 7 occupied units
- Verify occupancy rate displays: 70%
- Verify color coding: yellow (70-90% range)
- Change unit status → verify occupancy recalculates

**Property Manager Assignment:**
- Assign property to manager → verify manager dropdown populated
- Filter properties by assigned manager → verify only assigned properties shown
- Reassign property to different manager → verify update

**Quick Actions:**
- Quick assign tenant to available unit → verify assignment dialog
- Bulk status update (select multiple units) → verify all updated

**Validation and Error Handling:**
- Create property with totalUnits = 0 → verify error
- Create unit with duplicate unitNumber in same property → verify error
- Upload image > 5MB → verify size error
- Upload non-image file → verify type error

**Prerequisites:** Story 3.2 (status: done)

**Technical Notes:**
- Use Playwright with TypeScript
- Verify all data-testid attributes per conventions
- Test occupancy calculation accuracy
- Test bulk operations (create 50+ units)
- Verify image upload and preview functionality
- Test grid/list view toggle
- Clean up test properties and units after tests
- Use test fixtures for property managers

## Story 3.3.e2e: E2E Tests for Tenant Onboarding

As a QA engineer / developer,
I want comprehensive end-to-end tests for tenant onboarding,
So that I can ensure the complete tenant registration process works correctly.

**Acceptance Criteria:**

**Given** Story 3.3 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Tenant Onboarding Flow (Multi-Step Wizard):**
- Step 1: Personal Information
  - Fill all required fields (name, email, phone, DOB, nationality)
  - Add emergency contact → verify saved
  - Validate age 18+ → verify validation
  - Continue to next step
- Step 2: Lease Information
  - Select property and unit (only AVAILABLE units shown)
  - Set lease start/end dates → verify duration calculated
  - Select lease type (FIXED_TERM, MONTH_TO_MONTH, YEARLY)
  - Continue to next step
- Step 3: Rent Breakdown
  - Enter base rent, service charge, security deposit
  - Verify total monthly rent calculated: base + service
  - Continue to next step
- Step 4: Parking Allocation (Optional)
  - Add parking spots → verify parking fee included in total
  - Enter spot numbers (comma-separated)
  - Upload Mulkiya document → verify single file only
  - Skip parking → verify optional
- Step 5: Payment Schedule
  - Select payment frequency (MONTHLY, QUARTERLY, YEARLY)
  - Set payment due date
  - Select payment method (PDC, BANK_TRANSFER, etc.)
  - Continue to next step
- Step 6: Document Upload
  - Upload Emirates ID (required) → verify uploaded
  - Upload passport (required) → verify uploaded
  - Upload visa (optional) → verify uploaded
  - Upload signed lease agreement → verify PDF uploaded
  - Upload additional documents → verify multiple files allowed
- Step 7: Review and Submit
  - Review all entered data → verify accuracy
  - Submit form → verify tenant created

**Post-Registration Verification:**
- Verify tenant ID generated (TNT-2025-XXXX)
- Verify user account created with TENANT role
- Verify welcome email sent with credentials
- Verify unit status changed to OCCUPIED
- Verify lease document email sent

**Validation and Error Handling:**
- Submit form with email already in use → verify unique email error
- Select OCCUPIED unit → verify validation error
- Set lease start date in past → verify error
- Set security deposit = 0 → verify error
- Upload file > 5MB → verify size error
- Upload invalid file type → verify type error
- Age < 18 years → verify validation error

**Database Transaction Testing:**
- Simulate failure during user creation → verify rollback (no tenant or user created)
- Verify tenant + user creation is atomic

**Prerequisites:** Story 3.3 (status: done), Story 3.2 (for available units)

**Technical Notes:**
- Test multi-step wizard navigation (next, back, jump to step)
- Verify form data persists across wizard steps
- Test real-time calculation of total monthly rent
- Test file upload validation (type, size)
- Verify Mulkiya upload is single file only
- Clean up created tenants and users after tests
- Use test fixtures for properties and units

## Story 3.4.e2e: E2E Tests for Tenant Portal Dashboard

As a QA engineer / developer,
I want comprehensive end-to-end tests for the tenant portal dashboard,
So that I can ensure tenants can view their information correctly.

**Acceptance Criteria:**

**Given** Story 3.4 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Tenant Login and Dashboard Access:**
- Login as tenant → verify redirect to /tenant/dashboard
- Verify welcome message displays: "Welcome back, {firstName}!"
- Verify current unit information card displays:
  - Property name and address
  - Unit number, floor, bedroom/bathroom count
  - Lease start and end dates
  - Days remaining until lease expiration
  - Lease status badge (ACTIVE or EXPIRING_SOON if < 60 days)

**Quick Stats Cards:**
- Verify outstanding balance displayed (mock data)
- Verify next payment due date and amount
- Verify open maintenance requests count = 0 initially
- Verify upcoming amenity bookings count = 0 initially

**Quick Actions:**
- Click "Submit Maintenance Request" → verify redirect to request form
- Click "Make Payment" → verify redirect to payment page (future story)
- Click "Book Amenity" → verify redirect to amenity booking (future story)
- Click "View Lease Agreement" → verify PDF download triggers

**Profile Management Page:**
- Navigate to /tenant/profile
- Verify personal information section (read-only):
  - Name, email, phone, DOB, national ID displayed
  - Emergency contact displayed
  - Note about contacting management to update
- Verify lease information section (read-only):
  - Property and unit details
  - Lease dates
  - Monthly rent breakdown (base, service, parking, total)
  - Security deposit amount
  - Payment schedule
- Verify parking information section (if allocated):
  - Parking spot numbers displayed
  - Parking fee per spot
  - Mulkiya document download link (if uploaded)
- Account settings:
  - Change password link → verify redirect to /settings/security

**Document Repository:**
- Upload additional document → verify uploaded
- Download previously uploaded document → verify download
- Verify file size and upload date shown

**Responsive Design:**
- Test on mobile viewport (375px) → verify single column layout
- Test on tablet viewport (768px) → verify optimized layout
- Test on desktop (1920px) → verify multi-column layout
- Verify touch targets ≥ 44x44px on mobile
- Verify bottom navigation visible on mobile

**Caching and Performance:**
- Verify dashboard stats cached (check network tab for 5min cache)
- Verify skeleton loaders shown during data fetch
- Verify real-time balance update on payment (future integration)

**Prerequisites:** Story 3.4 (status: done), Story 3.3 (for tenant data)

**Technical Notes:**
- Test with tenant user credentials (not property manager)
- Verify read-only fields cannot be edited
- Test PDF download functionality
- Test responsive breakpoints
- Verify UAE timezone (GST) for all dates
- Clean up uploaded test documents
- Use test fixtures for tenant with complete profile

## Story 3.5.e2e: E2E Tests for Tenant Portal Maintenance Requests

As a QA engineer / developer,
I want comprehensive end-to-end tests for maintenance request submission,
So that I can ensure tenants can report and track maintenance issues.

**Acceptance Criteria:**

**Given** Story 3.5 implementation is complete (status: done)
**When** E2E tests are executed with Playwright
**Then** the following user flows are tested:

**Maintenance Request Submission:**
- Navigate to /tenant/requests
- Click "Submit Request" button
- Fill request form:
  - Select category (PLUMBING) → verify priority auto-suggested (MEDIUM)
  - Override priority to HIGH
  - Enter title: "Leaking kitchen faucet"
  - Enter description (min 20 chars) → verify character count shown
  - Select preferred access time: Morning
  - Select preferred access date: Tomorrow
  - Upload 3 photos (JPG, each < 5MB) → verify previews shown
  - Remove 1 photo → verify removed from list
- Submit request → verify:
  - Success message: "Request #MR-2025-XXXX submitted"
  - Redirect to request details page
  - Email confirmation sent to tenant
  - Notification sent to property manager

**Request Tracking Page:**
- View all requests list (/tenant/requests)
- Verify newest requests shown first
- Filter by status: SUBMITTED → verify only submitted requests
- Filter by category: PLUMBING → verify filtered results
- Search by request number → verify found
- Verify each request card shows:
  - Request number (clickable)
  - Title and category
  - Status badge with color (SUBMITTED = yellow)
  - Submitted date and priority
  - Last updated timestamp

**Request Details Page:**
- Click request number → navigate to /tenant/requests/{id}
- Verify full request information displayed
- Verify uploaded photos in gallery (thumbnails)
- Click photo → verify lightbox/enlarge
- Verify status timeline:
  - "Submitted on {date}" ✓
  - "Assigned to {vendor}" (pending)
  - "In progress" (pending)
  - "Completed" (pending)

**Status Updates (Simulated):**
- Simulate backend status change to ASSIGNED
- Verify status badge updates to blue
- Verify email notification sent: "Your request has been assigned"
- Verify assigned vendor information displayed
- Simulate status change to IN_PROGRESS
- Verify status badge updates to orange
- Simulate status change to COMPLETED
- Verify status badge updates to green
- Verify work notes from vendor displayed
- Verify completion photos displayed (before/after)

**Tenant Feedback:**
- Rate service: 4 stars → verify rating captured
- Enter comment: "Quick response, thank you!"
- Submit feedback → verify saved
- Verify feedback displayed on request details

**Request Cancellation:**
- Create new request (status SUBMITTED)
- Click cancel button → verify confirmation dialog
- Confirm cancellation → verify request cancelled
- Attempt to cancel ASSIGNED request → verify error (cannot cancel)

**Validation and Error Handling:**
- Submit form without title → verify error
- Submit form without category → verify error
- Submit description < 20 chars → verify error
- Upload file > 5MB → verify size error
- Upload video file → verify not supported error
- Upload 6 photos → verify max 5 photos error

**Image Compression:**
- Upload 5MB photo → verify compressed to ~500KB before upload
- Verify thumbnail generated (200x200px)

**Real-Time Updates:**
- Verify polling every 30 seconds for status updates (or WebSocket)
- Simulate status change during active viewing → verify UI updates

**Prerequisites:** Story 3.5 (status: done), Story 3.4 (for tenant login)

**Technical Notes:**
- Test image upload and compression
- Test photo gallery and lightbox
- Verify email notifications (use email testing service)
- Test real-time status updates (polling or WebSocket)
- Test with multiple concurrent requests
- Verify character counter for description
- Clean up uploaded test photos and requests
- Use test fixtures for maintenance categories and priorities
- Mock vendor assignment (property manager action)

---
