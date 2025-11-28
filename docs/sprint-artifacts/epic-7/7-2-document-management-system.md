# Story 7.2: Document Management System

Status: drafted

## Story

As a property manager,
I want a centralized document repository,
So that all property-related documents are organized and easily accessible.

## Acceptance Criteria

1. **AC1 - Document Entity Creation:** Create Document JPA entity with fields: id (UUID), documentNumber (unique, format: DOC-YYYY-NNNN), documentType (String, max 100 chars), title (String, required, max 200 chars), description (String, max 500 chars, nullable), fileName (String), filePath (String, S3 path), fileSize (Long), fileType (String, MIME type), entityType (enum: PROPERTY, TENANT, VENDOR, ASSET, GENERAL), entityId (UUID, nullable for GENERAL), expiryDate (LocalDate, nullable), tags (JSON array), accessLevel (enum: PUBLIC, INTERNAL, RESTRICTED), version (Integer, default 1), uploadedBy (UUID foreign key to users), uploadedAt timestamp, updatedAt timestamp. Add indexes on documentNumber, entityType, entityId, expiryDate, accessLevel. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

2. **AC2 - EntityType Enum:** Create DocumentEntityType enum with values: PROPERTY, TENANT, VENDOR, ASSET, GENERAL. Each value should have a display name. Use consistent enum pattern from existing codebase. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

3. **AC3 - AccessLevel Enum:** Create DocumentAccessLevel enum with values: PUBLIC (all authenticated users), INTERNAL (staff only), RESTRICTED (specific roles). Each value should have a display name and description. Use consistent enum pattern from existing codebase. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

4. **AC4 - Document Number Generation:** Implement unique document number format: DOC-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Handle concurrent generation with database sequence or optimistic locking. Example: DOC-2025-0001. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

5. **AC5 - Document Version Entity:** Create DocumentVersion JPA entity for version tracking. Fields: id (UUID), documentId (UUID foreign key), versionNumber (Integer), fileName (String), filePath (String, S3 path /uploads/documents/{entityType}/{entityId}/versions/), fileSize (Long), uploadedBy (UUID foreign key to users), uploadedAt timestamp, notes (String, nullable). When document replaced, previous version archived here. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

6. **AC6 - Upload Document Endpoint:** POST /api/v1/documents endpoint to upload document. Request (multipart): file (required, PDF/JPG/PNG/DOC/XLSX, max 10MB), documentType (required), title (required), description (optional), entityType (required), entityId (optional, required if entityType != GENERAL), expiryDate (optional), tags (optional, JSON array), accessLevel (required, default PUBLIC). Auto-generate documentNumber. Store file in S3 at /uploads/documents/{entityType}/{entityId}/{filename}. Return created document with presigned download URL. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

7. **AC7 - List Documents Endpoint:** GET /api/v1/documents endpoint with query params: entityType (filter), entityId (filter), documentType (filter), expiryStatus (filter: all/expiring_soon/expired), accessLevel (filter), tags (filter), search (matches title, description, fileName), dateRange (uploadedAt range), page, size, sort. Return paginated list with entity name included. Default sort by uploadedAt DESC. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

8. **AC8 - Get Document Details Endpoint:** GET /api/v1/documents/{id} endpoint. Return full document details including: entity name (property/tenant/vendor/asset name), version history count, expiry status (active/expiring_soon/expired), presigned download URL, uploader name. Check accessLevel and user role before returning. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

9. **AC9 - Download Document Endpoint:** GET /api/v1/documents/{id}/download endpoint. Return presigned S3 URL for document download. Check accessLevel: PUBLIC = all authenticated, INTERNAL = staff roles only, RESTRICTED = specific role check. Log download in audit trail. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

10. **AC10 - Document Preview Endpoint:** GET /api/v1/documents/{id}/preview endpoint. For PDFs: return presigned URL for in-browser viewing. For images: return presigned URL with inline content-disposition. For DOC/XLSX: return download URL only (no preview). Check accessLevel before returning. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

11. **AC11 - Update Document Metadata Endpoint:** PUT /api/v1/documents/{id} endpoint. Allow updating: title, description, documentType, expiryDate, tags, accessLevel. Cannot change: documentNumber, entityType, entityId, file. Require PROPERTY_MANAGER or SUPER_ADMIN role. Return updated document. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

12. **AC12 - Replace Document Endpoint:** POST /api/v1/documents/{id}/replace endpoint. Upload new file version. Archive previous version in DocumentVersion table. Increment version number. Update file paths and sizes. Optional: notes for version change. Return updated document with new version number. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

13. **AC13 - Version History Endpoint:** GET /api/v1/documents/{id}/versions endpoint. Return list of all document versions including current. Each version shows: versionNumber, fileName, fileSize, uploadedBy name, uploadedAt, notes, presigned download URL. Ordered by versionNumber DESC. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

14. **AC14 - Soft Delete Document Endpoint:** DELETE /api/v1/documents/{id} endpoint. Implement soft delete (set isDeleted flag or status = DELETED). Do not remove from S3 (retain for audit). Require PROPERTY_MANAGER or SUPER_ADMIN role. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

15. **AC15 - Expiring Documents Endpoint:** GET /api/v1/documents/expiring endpoint. Query params: days (default 30). Return documents with expiryDate within specified days, ordered by expiryDate ASC. Include entity name, document title, expiry date, days remaining. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

16. **AC16 - Entity Documents Endpoints:** Create convenience endpoints: GET /api/v1/properties/{id}/documents, GET /api/v1/tenants/{id}/documents, GET /api/v1/vendors/{id}/documents, GET /api/v1/assets/{id}/documents. Each returns documents for that entity type and ID. Support same filters as main list endpoint. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

17. **AC17 - Document Expiry Notifications:** Create scheduled job (DocumentExpiryNotificationJob) running daily at 8 AM. Find documents with expiryDate within 30 days. Group by uploader/property manager. Send email notification listing expiring documents. Template: document-expiry-notification.html. Use @Async for non-blocking. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

18. **AC18 - Access Control Implementation:** Implement @PreAuthorize checks on download/preview endpoints. PUBLIC: all authenticated users (@PreAuthorize("isAuthenticated()")). INTERNAL: staff roles (@PreAuthorize("hasAnyRole('PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'FINANCE_MANAGER', 'SUPER_ADMIN')")). RESTRICTED: specific role check based on entity type. Log unauthorized access attempts. [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

19. **AC19 - Document List Page:** Create page at /documents displaying DataTable with columns: Document Number, Title, Entity (type + name), Type (badge), Expiry Status (color-coded badge), Access Level (badge), Upload Date, Actions. Filters: entity type dropdown, document type dropdown, expiry status dropdown (All/Valid/Expiring Soon/Expired), access level dropdown, tags multi-select, date range picker. Search by title, description, file name. Sort by documentNumber, uploadedAt. Pagination: 20 per page. Quick actions: View, Download, Edit, Replace, Delete. Page has data-testid="page-documents". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

20. **AC20 - Document Detail Page:** Create page at /documents/{id} showing: Document header (document number, title, access badge), Entity section (type, name with link to entity), File info section (file name, size, type, upload date), Expiry section (date, status badge, days remaining if expiring), Tags section (tag badges), Version history section (list with download links), Action buttons (Edit, Replace, Download, Delete). Preview panel for PDFs/images. Page has data-testid="page-document-detail". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

21. **AC21 - Document Upload Form:** Create page at /documents/new with form: Document Type input (required, max 100 chars), Title (required, max 200 chars), Description textarea (optional, max 500 chars), Entity Type select (required), Entity select (dynamic based on type, searchable, required if type != GENERAL), Expiry Date picker (optional), Tags input (multi-value, chips), Access Level select (required, default PUBLIC), File upload (required, PDF/JPG/PNG/DOC/XLSX, max 10MB, drag-and-drop). Show file preview for images. Form has data-testid="form-document-upload". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

22. **AC22 - Document Edit Form:** Create page at /documents/{id}/edit. Pre-populate form with existing values. Allow editing: title, description, documentType, expiryDate, tags, accessLevel. Cannot change: documentNumber, file, entityType, entityId (show as read-only). "Replace Document" button opens replace dialog. Form has data-testid="form-document-edit". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

23. **AC23 - Document Replace Dialog:** Create dialog component for replacing document file. Shows current file info, file upload for new version, optional notes for version change. On success: archive old version, update document, close dialog, refresh. Dialog has data-testid="dialog-document-replace". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

24. **AC24 - Document Preview Modal:** Create modal component for in-browser preview. For PDFs: embed PDF viewer (iframe with presigned URL). For images: display image with zoom controls. For DOC/XLSX: show "Preview not available" with download button. Modal has data-testid="modal-document-preview". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

25. **AC25 - Version History Component:** Create component displaying version history list. Each row shows: version number, file name, file size (formatted), uploaded by, upload date, notes, download button. Current version highlighted. Component has data-testid="component-version-history". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

26. **AC26 - Expiry Status Badge Component:** Create component displaying expiry status: Green "Valid" badge (no expiry or expiry > 30 days), Yellow "Expiring Soon" badge (expiry within 30 days, shows days remaining), Red "Expired" badge (past expiry), Gray "No Expiry" (null expiry). Component has data-testid="badge-expiry-status". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

27. **AC27 - Access Level Badge Component:** Create component displaying access level: Green "Public" badge, Yellow "Internal" badge, Red "Restricted" badge. Tooltip shows access description. Component has data-testid="badge-access-level". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

28. **AC28 - Entity Type Badge Component:** Create component displaying entity type: Blue "Property" badge, Purple "Tenant" badge, Orange "Vendor" badge, Teal "Asset" badge, Gray "General" badge. Component has data-testid="badge-entity-type". [Source: docs/epics/epic-7-asset-compliance-management.md#story-72]

29. **AC29 - Document TypeScript Types:** Create types/document.ts with interfaces: Document (all entity fields + entity name + version count + presigned URLs), DocumentUpload (for POST), DocumentUpdate (for PUT), DocumentReplace (for replace), DocumentVersion, DocumentEntityType enum, DocumentAccessLevel enum, ExpiryStatus type. Export from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

30. **AC30 - Document Zod Validation Schemas:** Create lib/validations/document.ts with schemas: documentUploadSchema (documentType required, title required, entityType required, accessLevel required, file required + type + size validations), documentUpdateSchema (title required, accessLevel required), documentReplaceSchema (file required, notes optional). File validations: PDF/JPG/PNG/DOC/XLSX, max 10MB. [Source: docs/architecture.md#form-pattern]

31. **AC31 - Document Frontend Service:** Create services/document.service.ts with methods: getDocuments(filters), getDocument(id), uploadDocument(data), updateDocument(id, data), replaceDocument(id, file, notes?), deleteDocument(id), getVersionHistory(id), downloadDocument(id), previewDocument(id), getExpiringDocuments(days), getEntityDocuments(entityType, entityId, filters). Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

32. **AC32 - Document React Query Hooks:** Create hooks/useDocuments.ts with: useDocuments(filters) query, useDocument(id) query, useExpiringDocuments(days) query, useDocumentVersions(id) query, useEntityDocuments(entityType, entityId, filters) query, useUploadDocument() mutation, useUpdateDocument() mutation, useReplaceDocument() mutation, useDeleteDocument() mutation. Cache key: ['documents'], invalidate on mutations. [Source: docs/architecture.md#custom-hook-pattern]

33. **AC33 - Document Repository:** Create DocumentRepository extending JpaRepository with queries: findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId, Pageable), findByDocumentTypeOrderByUploadedAtDesc(documentType, Pageable), findByAccessLevel(accessLevel, Pageable), findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search, search, Pageable), findByExpiryDateBetween(today, futureDate), findByExpiryDateBeforeAndIsDeletedFalse(today), countByEntityType(entityType), existsByDocumentNumber(documentNumber). Create DocumentVersionRepository. [Source: docs/architecture.md#repository-pattern]

34. **AC34 - Document Service Layer:** Create DocumentService with methods: uploadDocument(dto, file), getDocument(id), getDocuments(filters, pageable), updateDocument(id, dto), replaceDocument(id, file, notes), softDeleteDocument(id), getVersionHistory(id, pageable), getExpiringDocuments(days), getEntityDocuments(entityType, entityId, pageable), generateNextDocumentNumber(), checkAccessPermission(documentId, user). Service handles: document number generation, file upload to S3, version management, access control. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

35. **AC35 - Document Controller:** Create DocumentController with REST endpoints as defined in AC6-AC16. All endpoints require authentication. Apply @PreAuthorize based on accessLevel. Follow existing controller patterns. Log access attempts. [Source: docs/architecture.md#controller-pattern]

36. **AC36 - Document DTOs:** Create DTOs: DocumentDto (response with entity name, version count, presigned URLs), DocumentUploadDto (request), DocumentUpdateDto (request), DocumentReplaceDto (request), DocumentListDto (summary for list), DocumentVersionDto. Create DocumentMapper using MapStruct. Handle JSON array for tags field. [Source: docs/architecture.md#dto-pattern]

37. **AC37 - Database Migrations:** Create Flyway migrations: V{X}__create_documents_table.sql (documents table with all columns, indexes, foreign keys), V{X+1}__create_document_versions_table.sql (document_versions table). Use snake_case naming. Create entity_type, access_level enum types. Determine next version from existing migrations. [Source: docs/architecture.md#database-naming]

38. **AC38 - Document Expiry Email Template:** Create document-expiry-notification.html template. Include: company header, list of expiring documents grouped by entity type (document title, entity name, expiry date, days remaining), call to action (review documents). Style consistently with existing email templates. [Source: docs/architecture.md#email-templates]

39. **AC39 - Backend Unit Tests:** Write comprehensive tests: DocumentServiceTest (upload, update, replace with versioning, access control, expiry tracking), DocumentControllerTest (endpoint authorization per accessLevel, validation, file upload). Test version history creation. Mock S3 and email services. Achieve >= 80% code coverage for new code. [Source: docs/architecture.md#testing-backend]

40. **AC40 - Frontend Unit Tests:** Write tests using React Testing Library: Document list page rendering and filtering, Document form validation (upload and edit), Replace dialog functionality, Preview modal behavior, Expiry status badge colors, Access level badge colors. Test all data-testid elements accessible. [Source: docs/architecture.md#testing-frontend]

41. **AC41 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

42. **AC42 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]

## Component Mapping

### shadcn/ui Components to Use

**Document List Page:**
- table (document list with sorting/pagination)
- badge (entity type, document type, expiry status, access level badges)
- button (actions: view, download, edit, replace, delete)
- dropdown-menu (quick actions menu)
- input (search field)
- select (entity type, document type, expiry status, access level filters)
- popover + calendar (date range picker)
- pagination (for list navigation)
- skeleton (loading states)

**Document Detail Page:**
- card (section containers)
- badge (all status badges)
- button (action buttons)
- separator (section dividers)
- table (version history)
- tooltip (access level descriptions)
- tabs (for organizing sections)

**Document Upload Form:**
- form (React Hook Form integration)
- input (document type, title)
- textarea (description)
- select (entity type, access level)
- combobox (entity select with search)
- popover + calendar (expiry date)
- tags-input (custom or multi-select for tags)
- dropzone (drag-and-drop file upload)
- button (submit, cancel)
- label (form field labels)

**Document Edit Form:**
- form (React Hook Form integration)
- input (title)
- textarea (description)
- select (document type, access level)
- popover + calendar (expiry date)
- tags-input (tags)
- button (edit, replace, cancel)

**Dialogs and Modals:**
- dialog (replace document dialog)
- dialog (preview modal)
- dropzone (in replace dialog)
- progress (upload progress)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert (validation errors)
- alert-dialog (confirm delete)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add table badge button dropdown-menu input select popover calendar pagination skeleton card separator dialog form label textarea alert alert-dialog sonner tooltip tabs
```

### Additional Dependencies

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.263.1",
    "zod": "^3.0.0",
    "react-dropzone": "^14.0.0"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Create Document TypeScript Types** (AC: #29)
  - [ ] Create types/document.ts with Document interface (all entity fields)
  - [ ] Define DocumentEntityType enum (PROPERTY, TENANT, VENDOR, ASSET, GENERAL)
  - [ ] Define DocumentAccessLevel enum (PUBLIC, INTERNAL, RESTRICTED)
  - [ ] Create DocumentUpload, DocumentUpdate, DocumentReplace interfaces
  - [ ] Create DocumentVersion interface
  - [ ] Create ExpiryStatus type (valid, expiring_soon, expired, no_expiry)
  - [ ] Export from types/index.ts

- [ ] **Task 2: Create Document Zod Validation Schemas** (AC: #30)
  - [ ] Create lib/validations/document.ts
  - [ ] Implement documentUploadSchema (documentType, title, entityType, accessLevel required, file validation)
  - [ ] Implement documentUpdateSchema (title, accessLevel required)
  - [ ] Implement documentReplaceSchema (file required, notes optional)
  - [ ] Add file type validations (PDF/JPG/PNG/DOC/XLSX)
  - [ ] Add file size validation (max 10MB)
  - [ ] Export validation schemas

- [ ] **Task 3: Create Document Frontend Service** (AC: #31)
  - [ ] Create services/document.service.ts
  - [ ] Implement getDocuments(filters) with query params
  - [ ] Implement getDocument(id) for single document with details
  - [ ] Implement uploadDocument(data) multipart form
  - [ ] Implement updateDocument(id, data)
  - [ ] Implement replaceDocument(id, file, notes)
  - [ ] Implement deleteDocument(id) soft delete
  - [ ] Implement getVersionHistory(id)
  - [ ] Implement downloadDocument(id) return presigned URL
  - [ ] Implement previewDocument(id)
  - [ ] Implement getExpiringDocuments(days)
  - [ ] Implement getEntityDocuments(entityType, entityId, filters)

- [ ] **Task 4: Create Document React Query Hooks** (AC: #32)
  - [ ] Create hooks/useDocuments.ts
  - [ ] Implement useDocuments(filters) query hook
  - [ ] Implement useDocument(id) query hook
  - [ ] Implement useExpiringDocuments(days) query hook
  - [ ] Implement useDocumentVersions(id) query hook
  - [ ] Implement useEntityDocuments(entityType, entityId, filters) query hook
  - [ ] Implement useUploadDocument() mutation
  - [ ] Implement useUpdateDocument() mutation
  - [ ] Implement useReplaceDocument() mutation
  - [ ] Implement useDeleteDocument() mutation
  - [ ] Add cache invalidation on mutations

- [ ] **Task 5: Create Document Entity and Enums (Backend)** (AC: #1, #2, #3)
  - [ ] Create DocumentEntityType enum with display names
  - [ ] Create DocumentAccessLevel enum with display names and descriptions
  - [ ] Create Document JPA entity with all fields
  - [ ] Add @ManyToOne relationship to User (uploadedBy)
  - [ ] Add @OneToMany relationship to DocumentVersion
  - [ ] Add @Column for JSON tags field (use @Convert or @Type)
  - [ ] Add validation annotations (@NotNull, @NotBlank, @Size)
  - [ ] Add audit fields (uploadedAt, updatedAt)
  - [ ] Add isDeleted flag for soft delete

- [ ] **Task 6: Create DocumentVersion Entity** (AC: #5)
  - [ ] Create DocumentVersion JPA entity
  - [ ] Add @ManyToOne relationship to Document
  - [ ] Add @ManyToOne relationship to User (uploadedBy)
  - [ ] Add fields: versionNumber, fileName, filePath, fileSize, notes, uploadedAt

- [ ] **Task 7: Create Database Migrations** (AC: #37)
  - [ ] Determine next migration version number from existing
  - [ ] Create V{X}__create_documents_table.sql
  - [ ] Define documents table with all columns and indexes
  - [ ] Create entity_type and access_level enum types
  - [ ] Add indexes on documentNumber, entityType, entityId, expiryDate, accessLevel
  - [ ] Create V{X+1}__create_document_versions_table.sql
  - [ ] Add foreign keys to documents and users

- [ ] **Task 8: Create Document Repository** (AC: #33)
  - [ ] Create DocumentRepository extending JpaRepository
  - [ ] Add findByEntityTypeAndEntityIdOrderByUploadedAtDesc
  - [ ] Add findByDocumentTypeOrderByUploadedAtDesc
  - [ ] Add findByAccessLevel for access filtering
  - [ ] Add search query (title, description)
  - [ ] Add findByExpiryDateBetween for expiry check
  - [ ] Add findByExpiryDateBeforeAndIsDeletedFalse for expired docs
  - [ ] Add countByEntityType for dashboard
  - [ ] Add existsByDocumentNumber for uniqueness
  - [ ] Create DocumentVersionRepository

- [ ] **Task 9: Create Document DTOs and Mapper** (AC: #36)
  - [ ] Create DocumentDto for response (includes entity name, version count, presigned URLs)
  - [ ] Create DocumentUploadDto for upload request
  - [ ] Create DocumentUpdateDto for update request
  - [ ] Create DocumentReplaceDto for replace request
  - [ ] Create DocumentListDto for list view
  - [ ] Create DocumentVersionDto for version history
  - [ ] Create DocumentMapper using MapStruct
  - [ ] Add custom mapping for tags JSON array

- [ ] **Task 10: Implement Document Number Generation** (AC: #4)
  - [ ] Create database sequence for document numbers
  - [ ] Implement getNextSequence method in repository
  - [ ] Format as DOC-{year}-{padded number}
  - [ ] Handle year rollover (reset sequence)
  - [ ] Ensure thread-safety with @Lock or sequence

- [ ] **Task 11: Implement Document Service Layer** (AC: #34)
  - [ ] Create DocumentService interface
  - [ ] Create DocumentServiceImpl with @Service
  - [ ] Implement uploadDocument with number generation and S3 upload
  - [ ] Implement getDocument with access check
  - [ ] Implement getDocuments with filter support
  - [ ] Implement updateDocument with validation
  - [ ] Implement replaceDocument with version archiving
  - [ ] Implement softDeleteDocument
  - [ ] Implement getVersionHistory
  - [ ] Implement getExpiringDocuments
  - [ ] Implement getEntityDocuments
  - [ ] Implement checkAccessPermission (user role vs accessLevel)

- [ ] **Task 12: Implement Access Control** (AC: #18)
  - [ ] Create AccessControlService or method in DocumentService
  - [ ] Implement PUBLIC access check (isAuthenticated)
  - [ ] Implement INTERNAL access check (staff roles only)
  - [ ] Implement RESTRICTED access check (entity-specific rules)
  - [ ] Log unauthorized access attempts to audit log
  - [ ] Apply @PreAuthorize annotations to controller endpoints

- [ ] **Task 13: Implement Version Management** (AC: #5, #12)
  - [ ] Create method archiveCurrentVersion in DocumentService
  - [ ] Copy current file info to DocumentVersion
  - [ ] Move S3 file to versions folder
  - [ ] Increment version number on Document
  - [ ] Update document with new file info
  - [ ] Return updated document

- [ ] **Task 14: Create Document Expiry Email Template** (AC: #38)
  - [ ] Create document-expiry-notification.html template
  - [ ] Include company header
  - [ ] Include grouped list of expiring documents by entity type
  - [ ] Show document title, entity name, expiry date, days remaining
  - [ ] Include call to action (review documents)
  - [ ] Style consistently with existing email templates

- [ ] **Task 15: Implement Document Expiry Scheduler Job** (AC: #17)
  - [ ] Create DocumentExpiryNotificationJob with @Scheduled
  - [ ] Run daily at 8 AM (cron: 0 0 8 * * *)
  - [ ] Query documents expiring in 30 days
  - [ ] Group by uploader/property manager
  - [ ] Send email using EmailService
  - [ ] Use @Async for non-blocking

- [ ] **Task 16: Implement Document Controller** (AC: #35)
  - [ ] Create DocumentController with @RestController
  - [ ] Implement POST /api/v1/documents (upload)
  - [ ] Implement GET /api/v1/documents (list with filters)
  - [ ] Implement GET /api/v1/documents/{id} (detail)
  - [ ] Implement GET /api/v1/documents/{id}/download (download)
  - [ ] Implement GET /api/v1/documents/{id}/preview (preview)
  - [ ] Implement PUT /api/v1/documents/{id} (update)
  - [ ] Implement POST /api/v1/documents/{id}/replace (replace with version)
  - [ ] Implement GET /api/v1/documents/{id}/versions (version history)
  - [ ] Implement DELETE /api/v1/documents/{id} (soft delete)
  - [ ] Implement GET /api/v1/documents/expiring (expiring docs)
  - [ ] Add @PreAuthorize for role-based access per accessLevel

- [ ] **Task 17: Implement Entity Documents Endpoints** (AC: #16)
  - [ ] Add GET /api/v1/properties/{id}/documents to PropertyController
  - [ ] Add GET /api/v1/tenants/{id}/documents to TenantController
  - [ ] Add GET /api/v1/vendors/{id}/documents to VendorController
  - [ ] Add GET /api/v1/assets/{id}/documents to AssetController (if exists)
  - [ ] Each endpoint calls DocumentService.getEntityDocuments

- [ ] **Task 18: Create Document List Page** (AC: #19)
  - [ ] Create app/(dashboard)/documents/page.tsx
  - [ ] Implement DataTable with document columns
  - [ ] Add entity type filter dropdown
  - [ ] Add document type filter dropdown
  - [ ] Add expiry status filter dropdown
  - [ ] Add access level filter dropdown
  - [ ] Add tags filter multi-select
  - [ ] Add date range picker filter
  - [ ] Implement search by title/description/filename
  - [ ] Add pagination (20 per page)
  - [ ] Add sorting by documentNumber, uploadedAt
  - [ ] Add quick action buttons (View, Download, Edit, Replace, Delete)
  - [ ] Add data-testid="page-documents"

- [ ] **Task 19: Create Document Detail Page** (AC: #20)
  - [ ] Create app/(dashboard)/documents/[id]/page.tsx
  - [ ] Display document header (number, title, access badge)
  - [ ] Display entity section with link to entity
  - [ ] Display file info section (name, size, type, upload date)
  - [ ] Display expiry section with status badge
  - [ ] Display tags section with tag badges
  - [ ] Display version history section
  - [ ] Add preview panel for PDFs/images
  - [ ] Add action buttons (Edit, Replace, Download, Delete)
  - [ ] Add data-testid="page-document-detail"

- [ ] **Task 20: Create Document Upload Form** (AC: #21)
  - [ ] Create app/(dashboard)/documents/new/page.tsx
  - [ ] Implement form with documentUploadSchema validation
  - [ ] Document Type input (required, max 100 chars)
  - [ ] Title input (required, max 200 chars)
  - [ ] Description textarea (optional, max 500 chars)
  - [ ] Entity Type select (required)
  - [ ] Entity select (dynamic based on type, searchable)
  - [ ] Expiry Date picker (optional)
  - [ ] Tags input (multi-value chips)
  - [ ] Access Level select (required, default PUBLIC)
  - [ ] File upload dropzone (PDF/JPG/PNG/DOC/XLSX, max 10MB)
  - [ ] Add data-testid="form-document-upload"

- [ ] **Task 21: Create Document Edit Form** (AC: #22)
  - [ ] Create app/(dashboard)/documents/[id]/edit/page.tsx
  - [ ] Pre-populate form with existing values
  - [ ] Show documentNumber as read-only
  - [ ] Show entityType and entityId as read-only
  - [ ] Allow editing: title, description, documentType, expiryDate, tags, accessLevel
  - [ ] Add "Replace Document" button to open dialog
  - [ ] Add data-testid="form-document-edit"

- [ ] **Task 22: Create Document Replace Dialog** (AC: #23)
  - [ ] Create components/documents/DocumentReplaceDialog.tsx
  - [ ] Show current file info (name, size, version)
  - [ ] File upload dropzone for new version
  - [ ] Notes textarea (optional)
  - [ ] Submit replaces document and creates version
  - [ ] Handle loading state
  - [ ] On success: close, invalidate cache, toast
  - [ ] Add data-testid="dialog-document-replace"

- [ ] **Task 23: Create Document Preview Modal** (AC: #24)
  - [ ] Create components/documents/DocumentPreviewModal.tsx
  - [ ] For PDFs: iframe with presigned URL
  - [ ] For images: img with zoom controls
  - [ ] For DOC/XLSX: "Preview not available" message + download button
  - [ ] Handle loading state
  - [ ] Add data-testid="modal-document-preview"

- [ ] **Task 24: Create Version History Component** (AC: #25)
  - [ ] Create components/documents/VersionHistory.tsx
  - [ ] Display list of versions (current + archived)
  - [ ] Each row: version number, file name, file size, uploader, date, notes, download
  - [ ] Highlight current version
  - [ ] Add data-testid="component-version-history"

- [ ] **Task 25: Create Expiry Status Badge Component** (AC: #26)
  - [ ] Create components/documents/ExpiryStatusBadge.tsx
  - [ ] Accept expiryDate prop
  - [ ] Calculate status: Valid (>30 days), Expiring Soon (<=30), Expired, No Expiry
  - [ ] Map to colors: green, yellow, red, gray
  - [ ] Show days remaining for expiring soon
  - [ ] Add data-testid="badge-expiry-status"

- [ ] **Task 26: Create Access Level Badge Component** (AC: #27)
  - [ ] Create components/documents/AccessLevelBadge.tsx
  - [ ] Map access levels to colors (PUBLIC=green, INTERNAL=yellow, RESTRICTED=red)
  - [ ] Add tooltip with access description
  - [ ] Add data-testid="badge-access-level"

- [ ] **Task 27: Create Entity Type Badge Component** (AC: #28)
  - [ ] Create components/documents/EntityTypeBadge.tsx
  - [ ] Map entity types to colors (PROPERTY=blue, TENANT=purple, VENDOR=orange, ASSET=teal, GENERAL=gray)
  - [ ] Add data-testid="badge-entity-type"

- [ ] **Task 28: Write Backend Unit Tests** (AC: #39)
  - [ ] Create DocumentServiceTest
  - [ ] Test uploadDocument (success, validation errors, file type validation)
  - [ ] Test updateDocument
  - [ ] Test replaceDocument with version creation
  - [ ] Test access control per accessLevel
  - [ ] Test getExpiringDocuments
  - [ ] Test document number generation uniqueness
  - [ ] Create DocumentControllerTest
  - [ ] Test endpoint authorization per accessLevel
  - [ ] Test request validation
  - [ ] Test file upload
  - [ ] Mock S3 and email services
  - [ ] Achieve >= 80% coverage

- [ ] **Task 29: Write Frontend Unit Tests** (AC: #40)
  - [ ] Test document list page rendering
  - [ ] Test filter functionality
  - [ ] Test document form validation (upload and edit)
  - [ ] Test replace dialog functionality
  - [ ] Test preview modal behavior (PDF vs image vs unsupported)
  - [ ] Test expiry status badge colors
  - [ ] Test access level badge colors
  - [ ] Verify data-testid accessibility

- [ ] **Task 30: Mandatory Test Execution and Build Verification** (AC: #41, #42)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests before proceeding
  - [ ] Execute backend build: `mvn compile` - Zero errors required
  - [ ] Execute frontend build: `npm run build` - Zero errors required
  - [ ] Execute frontend lint: `npm run lint` - Zero errors required
  - [ ] Document results in Completion Notes

## Final Validation Requirements

**MANDATORY:** These requirements apply to ALL stories and MUST be completed after all implementation tasks are done. The dev agent CANNOT mark a story complete without passing all validations.

### FV-1: Test Execution (Backend)
Execute full backend test suite: `mvn test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Document test results in Completion Notes

### FV-2: Test Execution (Frontend)
Execute full frontend test suite: `npm test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Excludes E2E tests (run separately if story includes E2E)

### FV-3: Build Verification (Backend)
Execute backend compilation: `mvn compile`
- Zero compilation errors required
- Zero Checkstyle violations (if configured)

### FV-4: Build Verification (Frontend)
Execute frontend build: `npm run build`
- Zero TypeScript compilation errors
- Zero lint errors
- Build must complete successfully

### FV-5: Lint Check (Frontend)
Execute lint check: `npm run lint`
- Zero lint errors required
- Fix any errors before marking story complete

## Dev Notes

### Architecture Patterns

**Document Flow:**
```
Upload Document → Document (version 1) → Optional: Replace Document
                        ↓                          ↓
              Archive to DocumentVersion    → Document (version 2+)
                        ↓
              Stored in S3 /versions/ folder
```

**Access Control Flow:**
```
User requests document → Check accessLevel
                              ↓
PUBLIC: isAuthenticated? → Allow/Deny
INTERNAL: hasStaffRole? → Allow/Deny
RESTRICTED: checkEntityAccess? → Allow/Deny
                              ↓
Log access attempt → Return document/403
```

**Expiry Notification Flow:**
```
Daily Job (8 AM) → Query documents with expiry in 30 days
                → Group by uploader/manager
                → Send email notification
                → Dashboard shows expiring count
```

### Constraints

**Document Rules:**
- documentNumber must be unique (database constraint)
- File types allowed: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX
- Max file size: 10MB
- entityId required when entityType != GENERAL
- Access control enforced on download/preview endpoints
- Version history retained indefinitely for audit

**Number Format:**
- Pattern: DOC-{YYYY}-{NNNN}
- Example: DOC-2025-0001, DOC-2025-0002
- Reset sequence at year change (DOC-2026-0001)

**S3 Storage Structure:**
```
/uploads/documents/
  ├── PROPERTY/
  │   └── {propertyId}/
  │       ├── filename.pdf
  │       └── versions/
  │           └── v1_filename.pdf
  ├── TENANT/
  │   └── {tenantId}/
  ├── VENDOR/
  │   └── {vendorId}/
  ├── ASSET/
  │   └── {assetId}/
  └── GENERAL/
      └── filename.pdf
```

### Prerequisites

**From Story 3.2 (Property Management):**
- Property entity and PropertyRepository
- Property listing for entity dropdown

**From Story 3.3 (Tenant Onboarding):**
- Tenant entity and TenantRepository
- Tenant listing for entity dropdown

**From Story 5.1 (Vendor Registration):**
- Vendor entity and VendorRepository
- Vendor listing for entity dropdown

**From Story 7.1 (Asset Registry):**
- Asset entity and AssetRepository
- Asset listing for entity dropdown (if implemented)

**From Story 1.6 (AWS S3):**
- FileStorageService for document storage
- Presigned URL generation
- LocalStack for development

### Learnings from Previous Epic Stories

**From Completed Epic 6 Stories (Status: done)**

- **Backend Patterns**: Entity with enums, Repository with custom queries, Service layer with @Transactional, Controller with @PreAuthorize, DTOs with MapStruct
- **Frontend Patterns**: TypeScript types in types/*.ts, Zod validation schemas in lib/validations/*.ts, Frontend service in services/*.service.ts, React Query hooks in hooks/use*.ts, Pages with data-testid attributes
- **Number Generation**: Use database sequence with year prefix, format XXX-YYYY-NNNN
- **File Storage**: Use existing FileStorageService, store at /uploads/{entity}/{entityId}/
- **Scheduler Jobs**: Use @Scheduled with cron expression, @Async for email sending
- **Test Patterns**: Service tests covering all methods, Controller tests for authorization and validation
- **Build Verification**: Always run mvn test, npm test, npm run build, npm run lint before marking done

[Source: docs/sprint-artifacts/epic-6/6-2-expense-management-and-vendor-payments.md#Dev-Agent-Record]

### Project Structure Notes

**Backend Files to Create:**
- `backend/src/main/java/com/ultrabms/entity/Document.java`
- `backend/src/main/java/com/ultrabms/entity/DocumentVersion.java`
- `backend/src/main/java/com/ultrabms/entity/enums/DocumentEntityType.java`
- `backend/src/main/java/com/ultrabms/entity/enums/DocumentAccessLevel.java`
- `backend/src/main/java/com/ultrabms/repository/DocumentRepository.java`
- `backend/src/main/java/com/ultrabms/repository/DocumentVersionRepository.java`
- `backend/src/main/java/com/ultrabms/service/DocumentService.java`
- `backend/src/main/java/com/ultrabms/service/impl/DocumentServiceImpl.java`
- `backend/src/main/java/com/ultrabms/controller/DocumentController.java`
- `backend/src/main/java/com/ultrabms/dto/document/*.java` (DTOs)
- `backend/src/main/java/com/ultrabms/mapper/DocumentMapper.java`
- `backend/src/main/java/com/ultrabms/scheduler/DocumentExpiryNotificationJob.java`
- `backend/src/main/resources/db/migration/V{X}__create_documents_table.sql`
- `backend/src/main/resources/db/migration/V{X+1}__create_document_versions_table.sql`
- `backend/src/main/resources/templates/email/document-expiry-notification.html`
- `backend/src/test/java/com/ultrabms/service/DocumentServiceTest.java`
- `backend/src/test/java/com/ultrabms/controller/DocumentControllerTest.java`

**Frontend Files to Create:**
- `frontend/src/types/document.ts`
- `frontend/src/lib/validations/document.ts`
- `frontend/src/services/document.service.ts`
- `frontend/src/hooks/useDocuments.ts`
- `frontend/src/app/(dashboard)/documents/page.tsx`
- `frontend/src/app/(dashboard)/documents/[id]/page.tsx`
- `frontend/src/app/(dashboard)/documents/new/page.tsx`
- `frontend/src/app/(dashboard)/documents/[id]/edit/page.tsx`
- `frontend/src/components/documents/DocumentReplaceDialog.tsx`
- `frontend/src/components/documents/DocumentPreviewModal.tsx`
- `frontend/src/components/documents/VersionHistory.tsx`
- `frontend/src/components/documents/ExpiryStatusBadge.tsx`
- `frontend/src/components/documents/AccessLevelBadge.tsx`
- `frontend/src/components/documents/EntityTypeBadge.tsx`

### References

- [Source: docs/epics/epic-7-asset-compliance-management.md#story-72-document-management-system]
- [Source: docs/prd.md#3.8-document-and-compliance-module]
- [Source: docs/architecture.md#documents-and-compliance]
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
| 2025-11-29 | 1.0 | SM Agent (Bob) | Initial story draft created from Epic 7 acceptance criteria in YOLO mode |
