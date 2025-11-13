# Epic 7: Asset & Compliance Management

**Goal:** Implement asset tracking and compliance management to maintain equipment records and ensure regulatory compliance.

## Story 7.1: Asset Registry and Tracking

As a property manager,
I want to maintain an asset registry for property equipment,
So that I can track maintenance history and warranty information.

**Acceptance Criteria:**

**Given** I am managing properties with equipment
**When** I register an asset
**Then** the asset registration includes:

**Asset Information:**
- Asset name (required, max 200 chars, e.g., "HVAC Unit - Floor 3")
- Asset category (dropdown: HVAC, ELEVATOR, GENERATOR, WATER_PUMP, FIRE_SYSTEM, SECURITY_SYSTEM, ELECTRICAL_PANEL, PLUMBING_FIXTURE, APPLIANCE, OTHER)
- Property and location (required, property dropdown + location text like "Basement", "Roof", "Unit 301")
- Manufacturer (text, max 100 chars)
- Model number (text, max 100 chars)
- Serial number (text, max 100 chars, optional)
- Installation date (date picker)
- Warranty expiry date (date picker, optional)
- Purchase cost (decimal, optional)
- Estimated useful life (integer, years, optional)

**And** asset entity:
- id (UUID), assetNumber (unique, format: AST-2025-0001)
- assetName, category
- propertyId (foreign key), location
- manufacturer, modelNumber, serialNumber
- installationDate, warrantyExpiryDate
- purchaseCost, estimatedUsefulLife
- status (enum: ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED)
- lastMaintenanceDate (updated from work orders)
- nextMaintenanceDate (calculated or manual)
- createdAt, updatedAt timestamps

**And** asset documents:
- Upload asset documents (manuals, warranties, specs)
- Document types: MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER
- Store in /uploads/assets/{assetId}/documents/
- View and download documents from asset detail page

**And** maintenance history:
- Link work orders to assets
- View all maintenance performed on asset
- Shows: work order number, date, description, cost, vendor
- Track total maintenance cost per asset
- Identify high-maintenance assets

**And** warranty tracking:
- Dashboard alert for warranties expiring in next 30 days
- Email notification 30 days before warranty expiry
- Warranty status indicator on asset list (active/expired)

**And** asset list page:
- Filters: property, category, status
- Search by: asset name, model number, serial number
- Shows: asset number, name, category, property, location, status, warranty status
- Quick actions: View, Edit, View Maintenance History, Dispose

**And** API endpoints:
- POST /api/v1/assets: Create asset
- GET /api/v1/assets: List assets with filters
- GET /api/v1/assets/{id}: Get asset details
- PUT /api/v1/assets/{id}: Update asset
- PATCH /api/v1/assets/{id}/status: Update asset status
- GET /api/v1/assets/{id}/maintenance-history: Get maintenance work orders
- POST /api/v1/assets/{id}/documents: Upload document
- GET /api/v1/assets/expiring-warranties: Get assets with expiring warranties
- DELETE /api/v1/assets/{id}: Soft delete asset

**Prerequisites:** Story 3.1 (Property management), Story 4.1 (Work orders)

**Technical Notes:**
- Asset numbers auto-increment with year prefix
- Link work orders to assets via assetId field (optional foreign key)
- Calculate total maintenance cost by summing linked work order costs
- Schedule daily job to check for expiring warranties
- Add database indexes on assetNumber, propertyId, category, status
- Frontend: Use shadcn/ui Form with cascading dropdowns (property → location suggestions)
- Display asset QR code for easy mobile access (optional)
- Track asset depreciation using straight-line method (optional)

## Story 7.2: Document Management System

As a property manager,
I want a centralized document repository,
So that all property-related documents are organized and easily accessible.

**Acceptance Criteria:**

**Given** I manage multiple properties and entities
**When** I upload a document
**Then** the document management includes:

**Document Upload:**
- Document upload form accessible from multiple contexts:
  - Property documents (ownership, permits, NOC)
  - Tenant documents (contracts, IDs, visas)
  - Vendor documents (licenses, insurance - covered in Story 5.2)
  - Asset documents (manuals, warranties - covered in Story 7.1)
  - General documents (policies, templates, certificates)
- Form fields:
  - Document type (dropdown, context-specific)
  - Title (required, max 200 chars)
  - Description (text, max 500 chars, optional)
  - File upload (PDF/JPG/PNG/DOC/XLSX, max 10MB)
  - Expiry date (date picker, optional, for expiring documents)
  - Tags (multi-select or text input for categorization)
  - Access level (enum: PUBLIC, INTERNAL, RESTRICTED)

**And** document entity:
- id (UUID), documentNumber (unique, format: DOC-2025-0001)
- documentType, title, description
- fileName, filePath, fileSize, fileType
- entityType (enum: PROPERTY, TENANT, VENDOR, ASSET, GENERAL)
- entityId (foreign key to related entity, nullable for GENERAL)
- expiryDate (nullable)
- tags (JSON array)
- accessLevel
- uploadedBy (userId)
- uploadedAt, updatedAt timestamps
- version (integer, for version control)

**And** document list/search:
- Global document search across all entities
- Filters: entity type, document type, expiry status, access level, tags, date range
- Search by: title, description, file name
- Shows: document number, title, entity, type, expiry status, upload date
- Quick actions: View, Download, Edit, Replace (new version), Delete

**And** document versioning:
- Replace document creates new version
- Previous versions archived but accessible
- Version history shows:
  - Version number
  - Upload date and user
  - File name and size
  - Download link for each version

**And** document expiry tracking:
- Dashboard alert for documents expiring in next 30 days
- Email notifications 30 days before expiry
- Color-coded expiry status:
  - Green: Valid (expiry > 30 days away or no expiry)
  - Yellow: Expiring soon (within 30 days)
  - Red: Expired
- Expired documents highlighted in searches

**And** access control:
- PUBLIC: All authenticated users can view
- INTERNAL: Only staff (managers, supervisors, finance) can view
- RESTRICTED: Only specific users or roles can view
- Implement @PreAuthorize checks on document download endpoint

**And** document preview:
- In-browser preview for PDFs and images
- Download option for all file types
- Thumbnail generation for images

**And** API endpoints:
- POST /api/v1/documents: Upload document
- GET /api/v1/documents: List/search documents with filters
- GET /api/v1/documents/{id}: Get document metadata
- GET /api/v1/documents/{id}/download: Download document file
- GET /api/v1/documents/{id}/preview: Get document preview URL
- PUT /api/v1/documents/{id}: Update document metadata
- POST /api/v1/documents/{id}/replace: Upload new version
- GET /api/v1/documents/{id}/versions: Get version history
- DELETE /api/v1/documents/{id}: Soft delete document
- GET /api/v1/documents/expiring: Get expiring documents

**Prerequisites:** Story 3.2 (Tenants), Story 5.2 (Vendors), Story 7.1 (Assets)

**Technical Notes:**
- Store documents in /uploads/documents/{entityType}/{entityId}/
- Implement file virus scanning before storage (optional)
- Generate thumbnails for images (200x200px)
- Store document versions in /uploads/documents/{entityType}/{entityId}/versions/
- Add full-text search capability for document content (optional, using Apache Tika)
- Implement document templates for common forms (lease agreement template, etc.)
- Track document download history for audit trail
- Add database indexes on entityType, entityId, documentType, expiryDate
- Frontend: Use shadcn/ui Dialog for document preview modal
- Implement drag-and-drop file upload

## Story 7.3: Compliance and Inspection Tracking

As a property manager,
I want to track regulatory compliance and inspections,
So that all properties meet legal requirements and avoid violations.

**Acceptance Criteria:**

**Given** properties must comply with regulations
**When** I manage compliance requirements
**Then** the compliance tracking includes:

**Compliance Requirements:**
- Define compliance requirements for properties
- Requirement form includes:
  - Requirement name (required, max 200 chars, e.g., "Civil Defense Inspection")
  - Category (dropdown: SAFETY, FIRE, ELECTRICAL, PLUMBING, STRUCTURAL, ENVIRONMENTAL, LICENSING, OTHER)
  - Description (text, max 1000 chars)
  - Applicable to (multi-select properties or "All Properties")
  - Frequency (enum: ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUALLY, ANNUALLY, BIANNUALLY)
  - Authority/Agency (text, max 200 chars, e.g., "Dubai Civil Defense")
  - Penalty for non-compliance (text, max 500 chars)

**And** compliance requirement entity:
- id (UUID), requirementNumber (unique, format: CMP-2025-0001)
- requirementName, category, description
- applicableProperties (JSON array of propertyIds, or null for all)
- frequency
- authorityAgency, penaltyDescription
- status (enum: ACTIVE, INACTIVE)
- createdAt, updatedAt timestamps

**And** compliance schedule:
- Auto-generate compliance tasks based on frequency
- Schedule entity tracks:
  - complianceRequirementId (foreign key)
  - propertyId (foreign key)
  - dueDate (calculated based on frequency)
  - status (enum: UPCOMING, DUE, COMPLETED, OVERDUE, EXEMPT)
  - completedDate, completedBy
  - notes (text, compliance results or notes)
  - certificateFilePath (PDF of compliance certificate)

**And** inspection scheduling:
- Create inspection record for compliance requirement
- Inspection form:
  - Property and requirement (dropdowns)
  - Inspector name (text, may be external agency)
  - Scheduled date (date picker)
  - Status (enum: SCHEDULED, IN_PROGRESS, PASSED, FAILED, CANCELLED)
- Link to compliance schedule

**And** inspection completion:
- Record inspection results
  - Inspection date (date picker)
  - Result (dropdown: PASSED, FAILED, PARTIAL_PASS)
  - Issues found (text, max 1000 chars)
  - Recommendations (text, max 1000 chars)
  - Certificate upload (PDF, if passed)
  - Next inspection date (date picker, if recurring)
- If passed: mark compliance schedule as COMPLETED
- If failed: create remediation work order (link to maintenance)

**And** compliance dashboard:
- KPI cards:
  - Upcoming inspections (next 30 days)
  - Overdue compliance items
  - Recent violations
  - Compliance rate percentage (completed / total)
- Compliance calendar view showing all scheduled inspections
- Alerts for overdue items

**And** compliance list page:
- View all compliance schedules
- Filters: property, category, status, due date range
- Color-coded status indicators
- Shows: requirement name, property, due date, status, last completed
- Quick actions: Mark Complete, Schedule Inspection, Upload Certificate

**And** violation tracking:
- Record violations if compliance failed
- Violation entity:
  - complianceScheduleId (foreign key)
  - violationDate, description
  - fine amount (decimal, if applicable)
  - fineStatus (enum: PENDING, PAID, APPEALED, WAIVED)
  - remediation work order ID (link to fix)
  - resolutionDate
- Track violations per property for reporting

**And** API endpoints:
- POST /api/v1/compliance-requirements: Create requirement
- GET /api/v1/compliance-requirements: List requirements
- GET /api/v1/compliance-requirements/{id}: Get requirement details
- PUT /api/v1/compliance-requirements/{id}: Update requirement
- GET /api/v1/compliance-schedules: List scheduled compliance items
- PATCH /api/v1/compliance-schedules/{id}/complete: Mark as completed
- POST /api/v1/inspections: Schedule inspection
- PUT /api/v1/inspections/{id}: Update inspection results
- POST /api/v1/violations: Record violation
- GET /api/v1/compliance/dashboard: Get dashboard data
- GET /api/v1/properties/{id}/compliance-history: Get property compliance history

**Prerequisites:** Story 3.1 (Properties), Story 4.1 (Work orders for remediation)

**Technical Notes:**
- Scheduled job runs daily to check for due compliance items
- Send email reminders 30 days before compliance due date
- Auto-generate recurring compliance schedules based on frequency
- Calculate next due date after completion
- Store compliance certificates in /uploads/compliance/{scheduleId}/
- Add database indexes on propertyId, dueDate, status
- Frontend: Use FullCalendar for compliance calendar view
- Implement color-coding: green (completed), yellow (upcoming), red (overdue)
- Link failed inspections to work order creation for remediation
- Generate compliance reports for property audits

---
