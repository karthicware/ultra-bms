# Story 5.2: Vendor Document and License Management

Status: done

## Story

As a property manager,
I want to track vendor licenses and insurance documents,
So that I ensure compliance and vendor qualifications are current.

## Acceptance Criteria

1. **AC1 - Document Management Section on Vendor Detail Page:** Vendor detail page at /property-manager/vendors/{id} includes a "Documents" section displaying all uploaded documents for the vendor. Section shows document count in header. Empty state: "No documents uploaded yet. Upload required documents to ensure vendor compliance." Section has data-testid="section-vendor-documents". [Source: docs/epics/epic-5-vendor-management.md#story-52]

2. **AC2 - Upload Document Button and Modal:** "Upload Document" button (Plus icon, primary variant) in Documents section header opens upload modal. Modal title: "Upload Vendor Document". Modal has form with: document type dropdown, file input, expiry date picker, notes textarea. Button has data-testid="btn-upload-document". Modal has data-testid="modal-upload-document". [Source: docs/epics/epic-5-vendor-management.md#story-52]

3. **AC3 - Document Type Selection:** Document type dropdown (required) with options: TRADE_LICENSE ("Trade License"), INSURANCE ("Insurance Certificate"), CERTIFICATION ("Certification"), ID_COPY ("ID Copy"). Document type determines if expiry date is required: TRADE_LICENSE and INSURANCE require expiry date, others optional. Dropdown has data-testid="select-document-type". [Source: docs/epics/epic-5-vendor-management.md#story-52]

4. **AC4 - File Upload Input:** File input accepts PDF and JPG/JPEG/PNG files only. Maximum file size: 10MB. Drag-and-drop zone with click-to-browse. Shows selected file name, size, and type. Validation error for invalid file type: "Only PDF, JPG, JPEG, and PNG files are allowed." Validation error for size: "File size must not exceed 10MB." File input has data-testid="input-document-file". [Source: docs/epics/epic-5-vendor-management.md#story-52]

5. **AC5 - Expiry Date Input:** Date picker for document expiry date. Required for TRADE_LICENSE and INSURANCE document types. Optional for CERTIFICATION and ID_COPY. Must be a future date for new uploads. Shows inline validation error: "Expiry date must be in the future." Date picker has data-testid="input-expiry-date". [Source: docs/epics/epic-5-vendor-management.md#story-52]

6. **AC6 - Document Notes Input:** Optional textarea for notes about the document. Maximum 200 characters. Character counter shown. Example placeholder: "Add any notes about this document..." Textarea has data-testid="input-document-notes". [Source: docs/epics/epic-5-vendor-management.md#story-52]

7. **AC7 - Document Upload Submission:** On form submit: validate all fields, disable submit button, show upload progress indicator. Call POST /api/v1/vendors/{vendorId}/documents with multipart form data. On success: close modal, refresh document list, show toast "Document uploaded successfully!". On error: show toast with error message, keep modal open. Submit button has data-testid="btn-submit-document". [Source: docs/epics/epic-5-vendor-management.md#story-52]

8. **AC8 - Backend VendorDocument Entity:** Create VendorDocument JPA entity with fields: id (UUID, @Id), vendorId (UUID, foreign key to vendors), documentType (DocumentType enum: TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY), fileName (String, original file name), filePath (String, S3 path: /vendors/{vendorId}/documents/{uuid}-{fileName}), fileSize (Long, bytes), fileType (String, MIME type), expiryDate (LocalDate, nullable), notes (String, nullable, max 200), uploadedBy (UUID, foreign key to users), uploadedAt (LocalDateTime, default now). Create index on vendorId. [Source: docs/epics/epic-5-vendor-management.md#story-52, docs/architecture.md#database-naming]

9. **AC9 - Document Storage in S3:** Documents uploaded to AWS S3 bucket in path: /vendors/{vendorId}/documents/{uuid}-{fileName}. Use existing FileStorageService from Story 1.6. Generate presigned URL for secure download (1-hour expiry). LocalStack for development environment. Validate file size and type on backend before S3 upload. [Source: docs/epics/epic-5-vendor-management.md#story-52, docs/architecture.md#deployment-architecture]

10. **AC10 - Document List Table:** Documents displayed in shadcn DataTable with columns: Document Type (badge), File Name (truncated, full name on hover), Expiry Date (formatted dd MMM yyyy, or "-" if no expiry), Expiry Status (color-coded badge), Upload Date (formatted), Actions (View, Download, Replace, Delete). Sort by uploadedAt DESC (newest first). Table has data-testid="table-vendor-documents". [Source: docs/epics/epic-5-vendor-management.md#story-52]

11. **AC11 - Expiry Status Badges:** Color-coded expiry status badges: "Valid" (green badge) when expiry > 30 days away or no expiry date, "Expiring Soon" (yellow/amber badge) when expiry within 30 days, "Expired" (red badge) when past expiry date. Badge text includes days remaining for "Expiring Soon": e.g., "Expiring in 15 days". For expired: "Expired {N} days ago". Badge has data-testid="badge-expiry-status". [Source: docs/epics/epic-5-vendor-management.md#story-52]

12. **AC12 - Document View Action:** "View" button (Eye icon) opens document in new browser tab. Uses presigned S3 URL with 1-hour expiry. PDFs open in browser PDF viewer. Images open in browser image viewer. Button has data-testid="btn-view-document". [Source: docs/epics/epic-5-vendor-management.md#story-52]

13. **AC13 - Document Download Action:** "Download" button (Download icon) initiates file download to user's device. Uses presigned S3 URL with content-disposition: attachment. File downloads with original file name. Button has data-testid="btn-download-document". [Source: docs/epics/epic-5-vendor-management.md#story-52]

14. **AC14 - Document Replace Action:** "Replace" button (RefreshCw icon) opens upload modal pre-filled with document type. User selects new file and updates expiry date. On submit: uploads new file to S3, updates VendorDocument record with new file path, fileName, fileSize, expiryDate, uploadedBy, uploadedAt. Previous file NOT deleted (versioning: old files retained in S3). Show toast "Document replaced successfully!". Button has data-testid="btn-replace-document". [Source: docs/epics/epic-5-vendor-management.md#story-52]

15. **AC15 - Document Delete Action:** "Delete" button (Trash icon, destructive variant) shows confirmation dialog: "Are you sure you want to delete this document? This action cannot be undone." On confirm: call DELETE /api/v1/vendors/{vendorId}/documents/{id}. Backend deletes record from database. File retained in S3 for audit (soft delete pattern for files). On success: refresh document list, show toast "Document deleted successfully!". Button has data-testid="btn-delete-document". [Source: docs/epics/epic-5-vendor-management.md#story-52]

16. **AC16 - Dashboard Expiring Documents Alert:** Property manager dashboard displays alert card for "Expiring Vendor Documents" when any vendor has documents expiring in next 30 days. Card shows count and list of expiring documents (max 5, with "View All" link). Each item shows: vendor name, document type, days until expiry. Click item navigates to vendor detail page. Alert card has data-testid="card-expiring-documents". [Source: docs/epics/epic-5-vendor-management.md#story-52]

17. **AC17 - Expiring Documents List Page:** GET /api/v1/vendors/expiring-documents returns all documents expiring in next 30 days. Response includes: vendorId, vendorNumber, companyName, documentType, expiryDate, daysUntilExpiry. Sorted by expiryDate ASC (soonest first). Optional query param: days (default 30) to customize threshold. Create dedicated page at /property-manager/vendors/expiring-documents to view full list. Page has data-testid="page-expiring-documents". [Source: docs/epics/epic-5-vendor-management.md#story-52]

18. **AC18 - Scheduled Job for Expiry Checks:** Create VendorDocumentExpiryJob scheduled task running daily at 9:00 AM. Job queries for documents expiring in exactly 30 days → send notification to property manager. Job queries for documents expiring in exactly 15 days → send notification to vendor. Job queries for documents expired today → trigger auto-suspension if critical docs (TRADE_LICENSE, INSURANCE). Use @Scheduled annotation with cron expression. Log job execution start/end and document counts. [Source: docs/epics/epic-5-vendor-management.md#story-52, docs/architecture.md#async-processing]

19. **AC19 - Email Notification to Property Manager (30 Days):** When document expires in 30 days, send email to property manager with: Subject: "Vendor Document Expiring Soon - {vendorName} - {documentType}". Body: vendor details, document type, expiry date, days remaining, link to vendor detail page. Email sent asynchronously using @Async. Create HTML template vendor-document-expiring-pm.html. [Source: docs/epics/epic-5-vendor-management.md#story-52]

20. **AC20 - Email Notification to Vendor (15 Days):** When document expires in 15 days, send email to vendor's email address with: Subject: "Your {documentType} is Expiring Soon". Body: document type, expiry date, days remaining, request to submit updated document, property management company contact info. Email sent asynchronously. Create HTML template vendor-document-expiring-vendor.html. [Source: docs/epics/epic-5-vendor-management.md#story-52]

21. **AC21 - Auto-Suspension on Critical Document Expiry:** When TRADE_LICENSE or INSURANCE document expires: Automatically change vendor status from ACTIVE to SUSPENDED. Create audit log entry: "Vendor auto-suspended due to expired {documentType}". Send email to property manager: "Vendor {vendorName} has been suspended due to expired {documentType}". Send email to vendor: "Your vendor account has been suspended due to expired {documentType}. Please submit updated documents." Suspended vendor cannot be assigned to work orders. [Source: docs/epics/epic-5-vendor-management.md#story-52]

22. **AC22 - Manual Reactivation After Document Update:** After suspended vendor uploads new valid TRADE_LICENSE or INSURANCE: Display "Reactivate Vendor" button on vendor detail page if vendor is SUSPENDED and has valid critical documents. Property manager clicks button to manually reactivate vendor. On reactivate: change status from SUSPENDED to ACTIVE, create audit log entry. Show toast "Vendor reactivated successfully!". Button visible only to PROPERTY_MANAGER role. Button has data-testid="btn-reactivate-vendor". [Source: docs/epics/epic-5-vendor-management.md#story-52]

23. **AC23 - Backend API Endpoints for Documents:** Implement REST endpoints: POST /api/v1/vendors/{vendorId}/documents (multipart upload, returns 201 with created document), GET /api/v1/vendors/{vendorId}/documents (list vendor documents, sorted by uploadedAt DESC), GET /api/v1/vendors/{vendorId}/documents/{id} (returns presigned download URL, 302 redirect or URL in response), PUT /api/v1/vendors/{vendorId}/documents/{id} (replace document), DELETE /api/v1/vendors/{vendorId}/documents/{id} (delete document, returns 204), GET /api/v1/vendors/expiring-documents (list all expiring documents). All endpoints require PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR role. [Source: docs/epics/epic-5-vendor-management.md#story-52, docs/architecture.md#rest-api-conventions]

24. **AC24 - Document DTOs and Mapper:** Create DTOs: VendorDocumentUploadDto (documentType, expiryDate, notes - file handled separately in multipart), VendorDocumentDto (id, vendorId, documentType, fileName, fileSize, fileType, expiryDate, notes, uploadedBy, uploadedAt, expiryStatus, downloadUrl), ExpiringDocumentDto (vendorId, vendorNumber, companyName, documentType, expiryDate, daysUntilExpiry). Create VendorDocumentMapper using MapStruct. [Source: docs/architecture.md#dto-pattern]

25. **AC25 - Document Service Layer:** Create VendorDocumentService interface and VendorDocumentServiceImpl with methods: uploadDocument(UUID vendorId, VendorDocumentUploadDto dto, MultipartFile file), getDocumentsByVendorId(UUID vendorId), getDocumentById(UUID documentId), replaceDocument(UUID documentId, VendorDocumentUploadDto dto, MultipartFile file), deleteDocument(UUID documentId), getExpiringDocuments(int days), getDocumentDownloadUrl(UUID documentId). Service handles: file validation, S3 upload, expiry calculations. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

26. **AC26 - Document Repository and Database Migration:** Create VendorDocumentRepository extending JpaRepository with custom queries: findByVendorIdOrderByUploadedAtDesc(UUID vendorId), findByExpiryDateBetween(LocalDate start, LocalDate end), findByExpiryDateLessThanAndDocumentTypeIn(LocalDate date, List<DocumentType> types). Create Flyway migration V{X}__create_vendor_documents_table.sql with: vendor_documents table DDL, foreign key to vendors, indexes. [Source: docs/architecture.md#repository-pattern]

27. **AC27 - TypeScript Types and Frontend Services:** Create types/vendor-documents.ts with interfaces: VendorDocument, VendorDocumentUpload, ExpiringDocument, DocumentType enum (TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY). Create lib/validations/vendor-document.ts with vendorDocumentUploadSchema using Zod. Create services/vendor-documents.service.ts with methods: getDocuments(vendorId), uploadDocument(vendorId, formData), replaceDocument(vendorId, documentId, formData), deleteDocument(vendorId, documentId), getExpiringDocuments(days?). [Source: docs/architecture.md#typescript-strict-mode]

28. **AC28 - React Query Hooks for Documents:** Create hooks/useVendorDocuments.ts: useVendorDocuments(vendorId) returns document list with loading/error states, useExpiringDocuments(days?) returns expiring documents for dashboard, useUploadDocument() mutation hook with progress tracking, useReplaceDocument() mutation hook, useDeleteDocument() mutation hook. Invalidate ['vendor-documents', vendorId] cache on mutations. [Source: docs/architecture.md#custom-hook-pattern]

29. **AC29 - Responsive Design for Document Section:** Document table converts to card layout on mobile (<640px). Each card shows: document type badge, file name, expiry status badge, action buttons. Upload modal: single column on mobile, full-width fields. File drag-and-drop zone: touch-friendly on mobile. All interactive elements >= 44x44px touch target. [Source: docs/architecture.md#styling-conventions]

30. **AC30 - Backend Unit Tests for Documents:** Write comprehensive tests: VendorDocumentServiceTest with test cases for uploadDocument (success, invalid file type, file too large, vendor not found), replaceDocument, deleteDocument, getExpiringDocuments. Test VendorDocumentExpiryJob execution and notification triggers. Test auto-suspension logic. VendorDocumentControllerTest for endpoint authorization and multipart handling. Achieve >= 80% code coverage for new code. [Source: docs/architecture.md#testing-backend]

## Component Mapping

### shadcn/ui Components to Use

**Form Components (Upload Modal):**
- dialog (upload modal container)
- form (React Hook Form integration)
- select (document type dropdown)
- input (file input wrapper)
- popover + calendar (date picker for expiry)
- textarea (notes field)
- button (submit, cancel, action buttons)
- label (form field labels)

**Data Display:**
- table (document list)
- badge (document type, expiry status)
- card (expiring documents dashboard alert)
- skeleton (loading states)
- tooltip (file name on hover)
- progress (upload progress indicator)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert-dialog (delete confirmation)
- alert (validation errors)

**Navigation:**
- breadcrumb (expiring documents page)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add calendar popover progress
```

### Additional Dependencies

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

Note: File upload uses native FormData and fetch API. No additional upload library required.

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types and Zod Schemas** (AC: #27)
  - [ ] Create types/vendor-documents.ts with VendorDocument, VendorDocumentUpload, ExpiringDocument interfaces
  - [ ] Define DocumentType enum (TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY)
  - [ ] Create lib/validations/vendor-document.ts with vendorDocumentUploadSchema
  - [ ] Add file type validation (PDF, JPG, JPEG, PNG)
  - [ ] Add file size validation (max 10MB)
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Create Frontend Document Service** (AC: #27)
  - [ ] Create services/vendor-documents.service.ts
  - [ ] Implement getDocuments(vendorId) with GET /api/v1/vendors/{vendorId}/documents
  - [ ] Implement uploadDocument(vendorId, formData) with multipart POST
  - [ ] Implement replaceDocument(vendorId, documentId, formData) with multipart PUT
  - [ ] Implement deleteDocument(vendorId, documentId) with DELETE
  - [ ] Implement getExpiringDocuments(days?) for dashboard
  - [ ] Handle upload progress tracking

- [ ] **Task 3: Create React Query Hooks for Documents** (AC: #28)
  - [ ] Create hooks/useVendorDocuments.ts
  - [ ] Implement useVendorDocuments(vendorId) query hook
  - [ ] Implement useExpiringDocuments(days?) query hook
  - [ ] Implement useUploadDocument() mutation with onUploadProgress
  - [ ] Implement useReplaceDocument() mutation hook
  - [ ] Implement useDeleteDocument() mutation hook
  - [ ] Add cache invalidation on mutations

- [ ] **Task 4: Create Backend VendorDocument Entity and Enum** (AC: #8)
  - [ ] Create DocumentType enum (TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY)
  - [ ] Create VendorDocument JPA entity with all fields
  - [ ] Add @ManyToOne relationship to Vendor entity
  - [ ] Add validation annotations (@NotNull, @Size)
  - [ ] Add audit fields (uploadedBy, uploadedAt)

- [ ] **Task 5: Create Database Migration for Documents** (AC: #26)
  - [ ] Create Flyway migration V{X}__create_vendor_documents_table.sql
  - [ ] Define vendor_documents table with all columns
  - [ ] Add foreign key constraint to vendors table
  - [ ] Add index on vendor_id
  - [ ] Add document_type enum type

- [ ] **Task 6: Create VendorDocument Repository** (AC: #26)
  - [ ] Create VendorDocumentRepository extending JpaRepository<VendorDocument, UUID>
  - [ ] Add findByVendorIdOrderByUploadedAtDesc(UUID vendorId)
  - [ ] Add findByExpiryDateBetween(LocalDate start, LocalDate end)
  - [ ] Add findByExpiryDateLessThanAndDocumentTypeIn for auto-suspension
  - [ ] Add findByExpiryDateEquals for notification triggers

- [ ] **Task 7: Create Document DTOs and Mapper** (AC: #24)
  - [ ] Create VendorDocumentUploadDto for upload requests
  - [ ] Create VendorDocumentDto for responses with expiryStatus, downloadUrl
  - [ ] Create ExpiringDocumentDto for dashboard/list view
  - [ ] Create VendorDocumentMapper using MapStruct
  - [ ] Add custom mapping for expiryStatus calculation

- [ ] **Task 8: Implement VendorDocument Service Layer** (AC: #25)
  - [ ] Create VendorDocumentService interface
  - [ ] Create VendorDocumentServiceImpl with @Service annotation
  - [ ] Implement uploadDocument with file validation and S3 upload
  - [ ] Implement getDocumentsByVendorId
  - [ ] Implement getDocumentById with presigned URL generation
  - [ ] Implement replaceDocument
  - [ ] Implement deleteDocument (database delete, S3 retain)
  - [ ] Implement getExpiringDocuments with configurable days

- [ ] **Task 9: Integrate with FileStorageService for S3** (AC: #9)
  - [ ] Use existing FileStorageService from Story 1.6
  - [ ] Implement uploadVendorDocument with path: /vendors/{vendorId}/documents/
  - [ ] Implement generatePresignedUrl for download
  - [ ] Validate file type (PDF, JPG, JPEG, PNG) before upload
  - [ ] Validate file size (max 10MB) before upload
  - [ ] Handle LocalStack for development environment

- [ ] **Task 10: Implement VendorDocument Controller** (AC: #23)
  - [ ] Create VendorDocumentController with @RestController
  - [ ] Implement POST /api/v1/vendors/{vendorId}/documents (multipart)
  - [ ] Implement GET /api/v1/vendors/{vendorId}/documents
  - [ ] Implement GET /api/v1/vendors/{vendorId}/documents/{id}
  - [ ] Implement PUT /api/v1/vendors/{vendorId}/documents/{id} (replace)
  - [ ] Implement DELETE /api/v1/vendors/{vendorId}/documents/{id}
  - [ ] Implement GET /api/v1/vendors/expiring-documents
  - [ ] Add @PreAuthorize for all endpoints
  - [ ] Handle MultipartFile for uploads

- [ ] **Task 11: Create Document Upload Modal Component** (AC: #2, #3, #4, #5, #6, #7)
  - [ ] Create components/vendors/DocumentUploadModal.tsx
  - [ ] Implement React Hook Form with vendorDocumentUploadSchema
  - [ ] Create document type dropdown (select component)
  - [ ] Create file upload zone with drag-and-drop
  - [ ] Create expiry date picker (conditional required based on type)
  - [ ] Create notes textarea with character counter
  - [ ] Add upload progress indicator
  - [ ] Handle form submission with loading state
  - [ ] Add data-testid to all elements

- [ ] **Task 12: Create Document List Component** (AC: #10, #11, #12, #13, #14, #15)
  - [ ] Create components/vendors/VendorDocumentList.tsx
  - [ ] Implement shadcn DataTable with columns
  - [ ] Create document type badge component
  - [ ] Create expiry status badge with color logic
  - [ ] Implement View action with presigned URL
  - [ ] Implement Download action with content-disposition
  - [ ] Implement Replace action opening modal
  - [ ] Implement Delete action with confirmation
  - [ ] Add empty state message
  - [ ] Add data-testid to all elements

- [ ] **Task 13: Integrate Documents Section into Vendor Detail Page** (AC: #1)
  - [ ] Add Documents section to vendor detail page
  - [ ] Add "Upload Document" button in section header
  - [ ] Integrate DocumentUploadModal
  - [ ] Integrate VendorDocumentList
  - [ ] Show document count in section header
  - [ ] Add data-testid="section-vendor-documents"

- [ ] **Task 14: Create Expiring Documents Dashboard Card** (AC: #16)
  - [ ] Create components/dashboard/ExpiringDocumentsCard.tsx
  - [ ] Fetch expiring documents using useExpiringDocuments hook
  - [ ] Display count and list (max 5 items)
  - [ ] Each item: vendor name, document type, days until expiry
  - [ ] Add "View All" link to expiring documents page
  - [ ] Click item navigates to vendor detail page
  - [ ] Add to property manager dashboard
  - [ ] Add data-testid="card-expiring-documents"

- [ ] **Task 15: Create Expiring Documents List Page** (AC: #17)
  - [ ] Create app/(dashboard)/property-manager/vendors/expiring-documents/page.tsx
  - [ ] Implement DataTable with expiring documents
  - [ ] Columns: Vendor, Document Type, Expiry Date, Days Remaining, Action
  - [ ] Sort by expiry date ascending (soonest first)
  - [ ] Add filter for days threshold (7, 15, 30)
  - [ ] Click row navigates to vendor detail page
  - [ ] Add breadcrumb: Vendors > Expiring Documents
  - [ ] Add data-testid="page-expiring-documents"

- [ ] **Task 16: Implement VendorDocumentExpiryJob** (AC: #18)
  - [ ] Create VendorDocumentExpiryJob with @Scheduled
  - [ ] Schedule daily at 9:00 AM: cron = "0 0 9 * * *"
  - [ ] Query documents expiring in exactly 30 days
  - [ ] Query documents expiring in exactly 15 days
  - [ ] Query documents expired today
  - [ ] Trigger appropriate notifications for each category
  - [ ] Log job execution details

- [ ] **Task 17: Create Email Templates for Notifications** (AC: #19, #20, #21)
  - [ ] Create vendor-document-expiring-pm.html template (30-day PM notification)
  - [ ] Create vendor-document-expiring-vendor.html template (15-day vendor notification)
  - [ ] Create vendor-suspended-pm.html template (auto-suspension PM notification)
  - [ ] Create vendor-suspended-vendor.html template (auto-suspension vendor notification)
  - [ ] Use consistent styling with existing email templates
  - [ ] Include action links (view vendor, upload document)

- [ ] **Task 18: Implement Email Notification Logic** (AC: #19, #20)
  - [ ] Create VendorDocumentNotificationService
  - [ ] Implement sendExpiryNotificationToPropertyManager(document) @Async
  - [ ] Implement sendExpiryNotificationToVendor(document) @Async
  - [ ] Implement sendSuspensionNotificationToPropertyManager(vendor, document) @Async
  - [ ] Implement sendSuspensionNotificationToVendor(vendor, document) @Async
  - [ ] Use existing EmailService pattern from Story 4.3

- [ ] **Task 19: Implement Auto-Suspension Logic** (AC: #21)
  - [ ] In VendorDocumentExpiryJob, check for expired TRADE_LICENSE and INSURANCE
  - [ ] Call VendorService.updateVendorStatus(vendorId, SUSPENDED)
  - [ ] Create audit log entry with reason
  - [ ] Trigger suspension notification emails
  - [ ] Ensure suspended vendors excluded from work order assignment

- [ ] **Task 20: Implement Reactivation Flow** (AC: #22)
  - [ ] Add logic to detect if suspended vendor has valid critical documents
  - [ ] Add "Reactivate Vendor" button on vendor detail page (conditional)
  - [ ] Button visible only when: status = SUSPENDED AND valid TRADE_LICENSE AND valid INSURANCE
  - [ ] On click: call PATCH /api/v1/vendors/{id}/status with ACTIVE
  - [ ] Create audit log entry: "Vendor reactivated after document update"
  - [ ] Show success toast
  - [ ] Add data-testid="btn-reactivate-vendor"

- [ ] **Task 21: Implement Responsive Design** (AC: #29)
  - [ ] Test document table on mobile: card layout
  - [ ] Test upload modal on mobile: single column
  - [ ] Test file upload zone: touch-friendly
  - [ ] Ensure touch targets >= 44x44px
  - [ ] Test expiring documents page on mobile
  - [ ] Test dark theme support

- [ ] **Task 22: Write Backend Unit Tests** (AC: #30)
  - [ ] Create VendorDocumentServiceTest
  - [ ] Test uploadDocument: success, invalid file type, file too large
  - [ ] Test replaceDocument: success, document not found
  - [ ] Test deleteDocument: success, verification
  - [ ] Test getExpiringDocuments: various date scenarios
  - [ ] Create VendorDocumentExpiryJobTest
  - [ ] Test notification triggers for 30-day, 15-day, expired
  - [ ] Test auto-suspension logic
  - [ ] Create VendorDocumentControllerTest
  - [ ] Test multipart upload handling
  - [ ] Achieve >= 80% code coverage

- [ ] **Task 23: Write Frontend Unit Tests**
  - [ ] Test DocumentUploadModal with React Testing Library
  - [ ] Test file type validation display
  - [ ] Test file size validation display
  - [ ] Test expiry date required logic based on document type
  - [ ] Test VendorDocumentList rendering
  - [ ] Test expiry status badge colors
  - [ ] Test delete confirmation dialog
  - [ ] Test ExpiringDocumentsCard rendering

## Dev Notes

### Learnings from Previous Story

**From Story 5.1 (Vendor Registration - Status: ready-for-dev):**

Story 5.1 has not been implemented yet (status: ready-for-dev), but contains important patterns to follow:

- **Vendor Entity**: Use Vendor entity with id, vendorNumber, status fields
- **VendorService**: Use existing VendorService.updateVendorStatus() for suspension/reactivation
- **Frontend Patterns**: Follow same React Hook Form + Zod patterns
- **TypeScript Types**: Follow same interface/enum structure
- **Data-testid Convention**: {component}-{element}-{action}

**Dependencies from Story 5.1:**
- Vendor entity must exist before documents can be uploaded
- VendorService.updateVendorStatus() used for auto-suspension
- Vendor detail page structure to integrate Documents section

**From Story 1.6 (AWS S3 File Storage - Status: done):**

Reuse existing FileStorageService patterns:
- LocalStack for development, AWS S3 for production
- Presigned URL generation for secure downloads
- File validation before upload
- Path structure: /vendors/{vendorId}/documents/{uuid}-{fileName}

[Source: stories/1-6-aws-s3-file-storage-integration.md]

**From Story 4.3 (Work Order Assignment - Status: done):**

Reuse email notification patterns:
- Spring Mail + @Async for asynchronous sending
- HTML email templates in resources/templates/
- EmailService pattern

[Source: stories/4-3-work-order-assignment-and-vendor-coordination.md]

### Architecture Patterns

**Document Entity Pattern:**
- VendorDocument linked to Vendor via vendorId foreign key
- DocumentType enum: TRADE_LICENSE, INSURANCE, CERTIFICATION, ID_COPY
- Expiry date required for TRADE_LICENSE and INSURANCE (critical documents)
- File stored in S3, path stored in database
- Soft delete pattern: delete from database, retain file in S3

**Expiry Status Calculation:**
```typescript
function getExpiryStatus(expiryDate: Date | null): ExpiryStatus {
  if (!expiryDate) return 'valid'; // no expiry
  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'valid';
}
```

**Auto-Suspension Pattern:**
- Scheduled job runs daily at 9:00 AM
- Checks for expired TRADE_LICENSE or INSURANCE documents
- Auto-suspends vendor (status = SUSPENDED)
- Creates audit log entry
- Sends notification emails
- Vendor excluded from work order assignment

**Reactivation Pattern:**
- Manual reactivation by property manager only
- Button visible only when valid critical documents uploaded
- Status transitions: SUSPENDED → ACTIVE
- Requires both valid TRADE_LICENSE and valid INSURANCE

**Email Notification Schedule:**
- 30 days before expiry: Email to property manager
- 15 days before expiry: Email to vendor
- On expiry (if critical doc): Suspension emails to both

### Constraints

**File Validation:**
- Allowed types: PDF, JPG, JPEG, PNG (MIME type check)
- Maximum size: 10MB
- Validation on frontend (before upload) and backend (before S3)

**Expiry Date Rules:**
- Required for TRADE_LICENSE and INSURANCE
- Optional for CERTIFICATION and ID_COPY
- Must be future date for new uploads
- Past dates allowed for existing documents (already expired)

**Critical Documents:**
- TRADE_LICENSE and INSURANCE are critical
- Expiry triggers auto-suspension
- Both required for vendor reactivation

**S3 Storage:**
- Path: /vendors/{vendorId}/documents/{uuid}-{fileName}
- Files retained on delete (audit trail)
- Presigned URLs: 1-hour expiry for security

### Testing Standards

From retrospective action items:
- ALL interactive elements MUST have data-testid attributes
- Convention: {component}-{element}-{action}
- Backend tests: >= 80% coverage
- Test scheduled job logic
- Test notification triggers
- Mock S3 for unit tests

### Integration Points

**With Vendor Module (Story 5.1):**
- Documents section on vendor detail page
- Auto-suspension updates vendor status
- Reactivation button on vendor detail page
- Document status affects vendor eligibility

**With Dashboard:**
- Expiring documents alert card
- Count of documents expiring in 30 days
- Quick navigation to vendor detail

**With Work Order Module (Epic 4):**
- Suspended vendors excluded from assignment dropdown
- Document compliance affects vendor availability

**With Email System:**
- Expiry notification emails
- Suspension notification emails
- Reuse existing email infrastructure

### Backend Implementation Notes

**Scheduled Job:**
```java
@Service
@RequiredArgsConstructor
public class VendorDocumentExpiryJob {

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9:00 AM
    public void checkExpiringDocuments() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);
        LocalDate fifteenDaysFromNow = today.plusDays(15);

        // 30-day notifications to property managers
        List<VendorDocument> expiringIn30Days =
            documentRepository.findByExpiryDateEquals(thirtyDaysFromNow);
        expiringIn30Days.forEach(this::notifyPropertyManager);

        // 15-day notifications to vendors
        List<VendorDocument> expiringIn15Days =
            documentRepository.findByExpiryDateEquals(fifteenDaysFromNow);
        expiringIn15Days.forEach(this::notifyVendor);

        // Auto-suspend for expired critical docs
        List<VendorDocument> expiredCritical = documentRepository
            .findByExpiryDateLessThanAndDocumentTypeIn(
                today, List.of(DocumentType.TRADE_LICENSE, DocumentType.INSURANCE));
        expiredCritical.forEach(this::suspendVendor);
    }
}
```

**Multipart Upload:**
```java
@PostMapping(value = "/{vendorId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<VendorDocumentDto> uploadDocument(
    @PathVariable UUID vendorId,
    @RequestPart("file") MultipartFile file,
    @RequestPart("metadata") @Valid VendorDocumentUploadDto metadata) {
    // Validate file and upload
}
```

### References

- [Source: docs/epics/epic-5-vendor-management.md#story-52-vendor-document-and-license-management]
- [Source: docs/prd.md#3.5-vendor-management-module]
- [Source: docs/architecture.md#vendor-management]
- [Source: docs/architecture.md#deployment-architecture]
- [Source: docs/sprint-artifacts/epic-5/5-1-vendor-registration-and-profile-management.md]
- [Source: docs/sprint-artifacts/epic-1/1-6-aws-s3-file-storage-integration.md]

## Dev Agent Record

### Context Reference

- [Story Context XML](./5-2-vendor-document-and-license-management.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
