## Epic 5: Vendor Management

**Goal:** Implement vendor registration, document management, and performance tracking to maintain a reliable network of service providers.

### Story 5.1: Vendor Registration and Profile Management

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

### Story 5.2: Vendor Document and License Management

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

### Story 5.3: Vendor Performance Tracking and Rating

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

