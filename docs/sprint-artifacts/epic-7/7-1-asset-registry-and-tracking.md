# Story 7.1: Asset Registry and Tracking

Status: ready-for-dev

## Story

As a property manager,
I want to maintain an asset registry for property equipment,
So that I can track maintenance history and warranty information.

## Acceptance Criteria

1. **AC1 - Asset Entity Creation:** Create Asset JPA entity with fields: id (UUID), assetNumber (unique, format: AST-YYYY-NNNN), assetName (String, required, max 200 chars), category (enum: HVAC, ELEVATOR, GENERATOR, WATER_PUMP, FIRE_SYSTEM, SECURITY_SYSTEM, ELECTRICAL_PANEL, PLUMBING_FIXTURE, APPLIANCE, OTHER), propertyId (UUID foreign key, required), location (String, max 200 chars, e.g., "Basement", "Roof", "Unit 301"), manufacturer (String, max 100 chars, nullable), modelNumber (String, max 100 chars, nullable), serialNumber (String, max 100 chars, nullable), installationDate (LocalDate, nullable), warrantyExpiryDate (LocalDate, nullable), purchaseCost (BigDecimal, nullable), estimatedUsefulLife (Integer, years, nullable), status (enum: ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED), lastMaintenanceDate (LocalDate, updated from work orders), nextMaintenanceDate (LocalDate, calculated or manual), createdAt, updatedAt timestamps. Add indexes on assetNumber, propertyId, category, status. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

2. **AC2 - Asset Category Enum:** Create AssetCategory enum with values: HVAC, ELEVATOR, GENERATOR, WATER_PUMP, FIRE_SYSTEM, SECURITY_SYSTEM, ELECTRICAL_PANEL, PLUMBING_FIXTURE, APPLIANCE, OTHER. Each value should have a display name. Use consistent enum pattern from existing codebase. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

3. **AC3 - Asset Status Enum:** Create AssetStatus enum with values: ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED. Each value should have a display name and color for UI badges. Use consistent enum pattern from existing codebase. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

4. **AC4 - Asset Number Generation:** Implement unique asset number format: AST-{YYYY}-{NNNN} where YYYY = current year, NNNN = sequential number padded to 4 digits. Reset sequence annually. Handle concurrent generation with database sequence or optimistic locking. Example: AST-2025-0001. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

5. **AC5 - Asset Document Entity:** Create AssetDocument JPA entity for asset documents (manuals, warranties, specs). Fields: id (UUID), assetId (UUID foreign key), documentType (enum: MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER), fileName (String), filePath (String, S3 path), fileSize (Long), uploadedBy (UUID foreign key to users), uploadedAt timestamp. Store at /uploads/assets/{assetId}/documents/. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

6. **AC6 - Create Asset Endpoint:** POST /api/v1/assets endpoint to create asset. Request includes all asset fields (assetName, category, propertyId, location required; others optional). Auto-generate assetNumber. Return created asset with full details. Validate property exists. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

7. **AC7 - List Assets Endpoint:** GET /api/v1/assets endpoint with query params: propertyId (filter), category (filter), status (filter), search (matches assetName, modelNumber, serialNumber), page, size, sort. Return paginated list with property name included. Default sort by createdAt DESC. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

8. **AC8 - Get Asset Details Endpoint:** GET /api/v1/assets/{id} endpoint. Return full asset details including: property name, list of documents, maintenance history summary (total maintenance count, total cost), warranty status (active/expired). [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

9. **AC9 - Update Asset Endpoint:** PUT /api/v1/assets/{id} endpoint. Allow updating all fields except assetNumber and createdAt. Validate property exists if changed. Return updated asset. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

10. **AC10 - Update Asset Status Endpoint:** PATCH /api/v1/assets/{id}/status endpoint. Request includes: status (required), notes (optional). Log status change in audit trail. If status = DISPOSED, prevent future maintenance linking. Return updated asset. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

11. **AC11 - Asset Maintenance History Endpoint:** GET /api/v1/assets/{id}/maintenance-history endpoint. Return list of work orders linked to this asset, showing: workOrderNumber, createdAt, description, status, actualCost, vendorName. Support pagination. Calculate totalMaintenanceCost. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

12. **AC12 - Upload Asset Document Endpoint:** POST /api/v1/assets/{id}/documents endpoint. Accept multipart file (PDF/JPG/PNG, max 10MB) with documentType. Store in S3 at /uploads/assets/{assetId}/documents/{filename}. Use existing FileStorageService from Story 1.6. Return created AssetDocument with presigned download URL. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

13. **AC13 - Delete Asset Document Endpoint:** DELETE /api/v1/assets/{id}/documents/{documentId} endpoint. Remove document from S3 and database. Require PROPERTY_MANAGER role. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

14. **AC14 - Expiring Warranties Endpoint:** GET /api/v1/assets/expiring-warranties endpoint. Query params: days (default 30). Return assets with warrantyExpiryDate within specified days, ordered by expiryDate ASC. Include property name, asset name, category, expiry date. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

15. **AC15 - Soft Delete Asset Endpoint:** DELETE /api/v1/assets/{id} endpoint. Implement soft delete (set status = DISPOSED or add isDeleted flag). Do not remove from database. Require PROPERTY_MANAGER or SUPER_ADMIN role. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

16. **AC16 - Work Order Asset Linking:** Modify WorkOrder entity to add assetId (UUID foreign key, nullable). Update WorkOrderCreateDto to accept optional assetId. When work order completed, update asset.lastMaintenanceDate. Display asset link on work order detail page. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

17. **AC17 - Warranty Expiry Notifications:** Create scheduled job (AssetWarrantyExpiryJob) running daily at 7 AM. Find assets with warranties expiring in 30 days. Send email notification to property manager listing expiring warranties. Template: asset-warranty-expiry-notification.html. [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

18. **AC18 - Asset List Page:** Create page at /assets displaying DataTable with columns: Asset Number, Name, Category (badge), Property, Location, Status (color-coded badge), Warranty Status (icon/badge). Filters: property dropdown, category multi-select, status dropdown. Search by asset name, model number, serial number. Sort by assetNumber, createdAt. Pagination: 20 per page. Quick actions: View, Edit, View History, Dispose. Page has data-testid="page-assets". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

19. **AC19 - Asset Detail Page:** Create page at /assets/{id} showing: Asset header (asset number, name, status badge, warranty status), Property/Location section (with link to property), Specifications section (manufacturer, model, serial, installation date, purchase cost, useful life), Warranty section (expiry date, status, days remaining), Documents section (list with download/delete), Maintenance History section (linked work orders table with total cost). Action buttons: Edit, Update Status, Upload Document, Dispose. Page has data-testid="page-asset-detail". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

20. **AC20 - Asset Create Form:** Create page at /assets/new with form: Asset Name (required, max 200), Category select (required), Property select (required, searchable), Location text (required, max 200), Manufacturer (optional), Model Number (optional), Serial Number (optional), Installation Date picker (optional), Warranty Expiry Date picker (optional), Purchase Cost input (optional, AED), Estimated Useful Life (optional, years integer). Form has data-testid="form-asset-create". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

21. **AC21 - Asset Edit Page:** Create page at /assets/{id}/edit. Pre-populate form with existing values. Cannot edit assetNumber. Status cannot be edited here (use status dialog). Allow editing all other fields. Form has data-testid="form-asset-edit". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

22. **AC22 - Asset Status Dialog:** Create dialog component for changing asset status. Shows current status, status dropdown (excluding current), optional notes field. Confirm button triggers PATCH endpoint. Used from asset list quick actions and detail page. Dialog has data-testid="dialog-asset-status". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

23. **AC23 - Document Upload Dialog:** Create dialog component for uploading asset documents. Document Type select (MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER), File upload (PDF/JPG/PNG, max 10MB), drag-and-drop support. Show upload progress. On success: close, refresh document list, toast. Dialog has data-testid="dialog-document-upload". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

24. **AC24 - Warranty Status Component:** Create component displaying warranty status: Green "Active" badge (expiry > 30 days), Yellow "Expiring Soon" badge (expiry within 30 days), Red "Expired" badge (past expiry), Gray "No Warranty" (null expiry). Show days remaining for active warranties. Component has data-testid="badge-warranty-status". [Source: docs/epics/epic-7-asset-compliance-management.md#story-71]

25. **AC25 - Asset TypeScript Types:** Create types/asset.ts with interfaces: Asset (all entity fields + property details + documents + maintenance summary), AssetCreate (for POST), AssetUpdate (for PUT), AssetStatusUpdate (for PATCH), AssetDocument, AssetMaintenanceHistory, AssetCategory enum, AssetStatus enum, DocumentType enum. Export from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

26. **AC26 - Asset Zod Validation Schemas:** Create lib/validations/asset.ts with schemas: assetCreateSchema (assetName required, category required, propertyId required, location required), assetUpdateSchema, assetStatusUpdateSchema (status required), documentUploadSchema (documentType required, file required, size <= 10MB). [Source: docs/architecture.md#form-pattern]

27. **AC27 - Asset Frontend Service:** Create services/asset.service.ts with methods: getAssets(filters), getAsset(id), createAsset(data), updateAsset(id, data), updateAssetStatus(id, data), deleteAsset(id), getMaintenanceHistory(id, page), uploadDocument(assetId, file, documentType), deleteDocument(assetId, documentId), getExpiringWarranties(days). Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

28. **AC28 - Asset React Query Hooks:** Create hooks/useAssets.ts with: useAssets(filters) query, useAsset(id) query, useExpiringWarranties(days) query, useAssetMaintenanceHistory(id, page) query, useCreateAsset() mutation, useUpdateAsset() mutation, useUpdateAssetStatus() mutation, useDeleteAsset() mutation, useUploadDocument() mutation, useDeleteDocument() mutation. Cache key: ['assets'], invalidate on mutations. [Source: docs/architecture.md#custom-hook-pattern]

29. **AC29 - Asset Repository:** Create AssetRepository extending JpaRepository with queries: findByPropertyIdOrderByCreatedAtDesc(propertyId, Pageable), findByCategoryOrderByCreatedAtDesc(category, Pageable), findByStatus(status, Pageable), findByAssetNameContainingIgnoreCaseOrModelNumberContainingIgnoreCaseOrSerialNumberContainingIgnoreCase(search, search, search, Pageable), findByWarrantyExpiryDateBetween(today, futureDate), countByStatus(status), existsByAssetNumber(assetNumber). [Source: docs/architecture.md#repository-pattern]

30. **AC30 - Asset Service Layer:** Create AssetService with methods: createAsset(dto), getAsset(id), getAssets(filters, pageable), updateAsset(id, dto), updateAssetStatus(id, statusDto), softDeleteAsset(id), getMaintenanceHistory(id, pageable), getExpiringWarranties(days), generateNextAssetNumber(), updateLastMaintenanceDate(assetId, date). Service handles: asset number generation, property validation, warranty status calculation. Use @Transactional for write operations. [Source: docs/architecture.md#service-pattern]

31. **AC31 - Asset Controller:** Create AssetController with REST endpoints as defined in AC6-AC15. All endpoints require PROPERTY_MANAGER or SUPER_ADMIN role. Use @PreAuthorize for role checks. Follow existing controller patterns. [Source: docs/architecture.md#controller-pattern]

32. **AC32 - Asset DTOs:** Create DTOs: AssetDto (response with property name, documents, maintenance summary), AssetCreateDto (request), AssetUpdateDto (request), AssetStatusUpdateDto (status + notes), AssetListDto (summary for list), AssetMaintenanceHistoryDto, AssetDocumentDto. Create AssetMapper using MapStruct. [Source: docs/architecture.md#dto-pattern]

33. **AC33 - Database Migrations:** Create Flyway migrations: V{X}__create_assets_table.sql (assets table), V{X+1}__create_asset_documents_table.sql (asset_documents table), V{X+2}__add_asset_id_to_work_orders.sql (adds asset_id column to work_orders). Determine next version from existing migrations. [Source: docs/architecture.md#database-naming]

34. **AC34 - Backend Unit Tests:** Write comprehensive tests: AssetServiceTest (create, update, status change, maintenance history, warranty expiry), AssetControllerTest (endpoint authorization, validation, file upload). Test asset number generation uniqueness. Mock S3 and email services. Achieve >= 80% code coverage for new code. [Source: docs/architecture.md#testing-backend]

35. **AC35 - Frontend Unit Tests:** Write tests using React Testing Library: Asset list page rendering and filtering, Asset form validation (create and edit), Status dialog functionality, Document upload dialog, Warranty status badge colors. Test all data-testid elements accessible. [Source: docs/architecture.md#testing-frontend]

36. **AC36 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

37. **AC37 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]

## Component Mapping

### shadcn/ui Components to Use

**Asset List Page:**
- table (asset list with sorting/pagination)
- badge (category, status, warranty status badges)
- button (actions: view, edit, history, dispose)
- dropdown-menu (quick actions menu)
- input (search field)
- select (property, category, status filters)
- pagination (for list navigation)
- skeleton (loading states)

**Asset Detail Page:**
- card (section containers)
- badge (status, category, warranty)
- button (action buttons)
- separator (section dividers)
- table (documents list, maintenance history)
- tooltip (warranty days remaining)

**Asset Form (Create/Edit):**
- form (React Hook Form integration)
- input (name, location, manufacturer, model, serial, cost, useful life)
- select (category, property)
- popover + calendar (installation date, warranty expiry)
- button (submit, cancel)
- label (form field labels)

**Status Dialog:**
- dialog (modal container)
- select (status dropdown)
- textarea (notes field)
- button (confirm, cancel)

**Document Upload Dialog:**
- dialog (modal container)
- select (document type)
- dropzone (drag-and-drop file upload)
- progress (upload progress)
- button (upload, cancel)

**Feedback Components:**
- toast/sonner (success/error notifications)
- alert (validation errors)
- alert-dialog (confirm dispose)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add table badge button dropdown-menu input select popover calendar pagination skeleton card separator dialog form label textarea alert alert-dialog sonner tooltip progress
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

- [ ] **Task 1: Create Asset TypeScript Types** (AC: #25)
  - [ ] Create types/asset.ts with Asset interface (all entity fields)
  - [ ] Define AssetCategory enum (HVAC, ELEVATOR, GENERATOR, etc.)
  - [ ] Define AssetStatus enum (ACTIVE, UNDER_MAINTENANCE, OUT_OF_SERVICE, DISPOSED)
  - [ ] Define DocumentType enum (MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER)
  - [ ] Create AssetCreate, AssetUpdate, AssetStatusUpdate interfaces
  - [ ] Create AssetDocument interface
  - [ ] Create AssetMaintenanceHistory interface
  - [ ] Export from types/index.ts

- [ ] **Task 2: Create Asset Zod Validation Schemas** (AC: #26)
  - [ ] Create lib/validations/asset.ts
  - [ ] Implement assetCreateSchema (name required, category required, propertyId required, location required)
  - [ ] Implement assetUpdateSchema
  - [ ] Implement assetStatusUpdateSchema (status required)
  - [ ] Implement documentUploadSchema (documentType required, file <= 10MB)
  - [ ] Add cost validations (positive number, 2 decimals max)
  - [ ] Export validation schemas

- [ ] **Task 3: Create Asset Frontend Service** (AC: #27)
  - [ ] Create services/asset.service.ts
  - [ ] Implement getAssets(filters) with query params
  - [ ] Implement getAsset(id) for single asset with details
  - [ ] Implement createAsset(data)
  - [ ] Implement updateAsset(id, data)
  - [ ] Implement updateAssetStatus(id, data)
  - [ ] Implement deleteAsset(id) soft delete
  - [ ] Implement getMaintenanceHistory(assetId, page)
  - [ ] Implement uploadDocument(assetId, file, documentType) multipart
  - [ ] Implement deleteDocument(assetId, documentId)
  - [ ] Implement getExpiringWarranties(days)

- [ ] **Task 4: Create Asset React Query Hooks** (AC: #28)
  - [ ] Create hooks/useAssets.ts
  - [ ] Implement useAssets(filters) query hook
  - [ ] Implement useAsset(id) query hook
  - [ ] Implement useExpiringWarranties(days) query hook
  - [ ] Implement useAssetMaintenanceHistory(id, page) query hook
  - [ ] Implement useCreateAsset() mutation
  - [ ] Implement useUpdateAsset() mutation
  - [ ] Implement useUpdateAssetStatus() mutation
  - [ ] Implement useDeleteAsset() mutation
  - [ ] Implement useUploadDocument() mutation
  - [ ] Implement useDeleteDocument() mutation
  - [ ] Add cache invalidation on mutations

- [ ] **Task 5: Create Asset Entity and Enums (Backend)** (AC: #1, #2, #3)
  - [ ] Create AssetCategory enum with display names
  - [ ] Create AssetStatus enum with display names and colors
  - [ ] Create Asset JPA entity with all fields
  - [ ] Add @ManyToOne relationship to Property
  - [ ] Add @OneToMany relationship to AssetDocument
  - [ ] Add validation annotations (@NotNull, @NotBlank, @Size, @DecimalMin)
  - [ ] Add audit fields (createdAt, updatedAt)
  - [ ] Add @Column for all nullable fields

- [ ] **Task 6: Create AssetDocument Entity** (AC: #5)
  - [ ] Create DocumentType enum (MANUAL, WARRANTY, PURCHASE_INVOICE, SPECIFICATION, OTHER)
  - [ ] Create AssetDocument JPA entity
  - [ ] Add @ManyToOne relationship to Asset
  - [ ] Add @ManyToOne relationship to User (uploadedBy)
  - [ ] Add fields: fileName, filePath, fileSize, uploadedAt

- [ ] **Task 7: Create Database Migrations** (AC: #33)
  - [ ] Determine next migration version number from existing
  - [ ] Create V{X}__create_assets_table.sql
  - [ ] Define assets table with all columns and indexes
  - [ ] Add foreign key to properties
  - [ ] Create V{X+1}__create_asset_documents_table.sql
  - [ ] Add foreign keys to assets and users
  - [ ] Create V{X+2}__add_asset_id_to_work_orders.sql
  - [ ] Add asset_id column to work_orders table with foreign key

- [ ] **Task 8: Create Asset Repository** (AC: #29)
  - [ ] Create AssetRepository extending JpaRepository
  - [ ] Add findByPropertyIdOrderByCreatedAtDesc
  - [ ] Add findByCategoryOrderByCreatedAtDesc
  - [ ] Add findByStatus for status filtering
  - [ ] Add search query (name, model, serial)
  - [ ] Add findByWarrantyExpiryDateBetween for expiry check
  - [ ] Add countByStatus for dashboard
  - [ ] Add existsByAssetNumber for uniqueness
  - [ ] Create AssetDocumentRepository

- [ ] **Task 9: Create Asset DTOs and Mapper** (AC: #32)
  - [ ] Create AssetDto for response (includes property name, documents, maintenance summary)
  - [ ] Create AssetCreateDto for create request
  - [ ] Create AssetUpdateDto for update request
  - [ ] Create AssetStatusUpdateDto (status + notes)
  - [ ] Create AssetListDto for list view
  - [ ] Create AssetMaintenanceHistoryDto
  - [ ] Create AssetDocumentDto
  - [ ] Create AssetMapper using MapStruct
  - [ ] Add custom mappings for computed fields (warrantyStatus, totalMaintenanceCost)

- [ ] **Task 10: Implement Asset Number Generation** (AC: #4)
  - [ ] Create database sequence for asset numbers
  - [ ] Implement getNextSequence method in repository
  - [ ] Format as AST-{year}-{padded number}
  - [ ] Handle year rollover (reset sequence)
  - [ ] Ensure thread-safety with @Lock or sequence

- [ ] **Task 11: Implement Asset Service Layer** (AC: #30)
  - [ ] Create AssetService interface
  - [ ] Create AssetServiceImpl with @Service
  - [ ] Implement createAsset with number generation and property validation
  - [ ] Implement getAsset with eager loading (documents, maintenance summary)
  - [ ] Implement getAssets with filter support (property, category, status, search)
  - [ ] Implement updateAsset with validation
  - [ ] Implement updateAssetStatus with audit logging
  - [ ] Implement softDeleteAsset (set status = DISPOSED)
  - [ ] Implement getMaintenanceHistory (query work orders by assetId)
  - [ ] Implement getExpiringWarranties
  - [ ] Implement updateLastMaintenanceDate (called from work order completion)

- [ ] **Task 12: Implement Document Upload Service** (AC: #12, #13)
  - [ ] Add document validation (PDF/JPG/PNG, max 10MB)
  - [ ] Use FileStorageService to upload to S3
  - [ ] Store at /uploads/assets/{assetId}/documents/{filename}
  - [ ] Save AssetDocument record
  - [ ] Return presigned URL for download
  - [ ] Implement document deletion (S3 + database)

- [ ] **Task 13: Implement Work Order Asset Integration** (AC: #16)
  - [ ] Add assetId field to WorkOrder entity
  - [ ] Update WorkOrderCreateDto to accept assetId
  - [ ] Modify WorkOrderService to update asset.lastMaintenanceDate on completion
  - [ ] Query work orders by assetId for maintenance history
  - [ ] Display asset info on work order detail page

- [ ] **Task 14: Create Warranty Expiry Email Template** (AC: #17)
  - [ ] Create asset-warranty-expiry-notification.html template
  - [ ] Include company header
  - [ ] Include list of expiring assets (name, property, expiry date, days remaining)
  - [ ] Include call to action (review/renew)
  - [ ] Style consistently with existing email templates

- [ ] **Task 15: Implement Warranty Expiry Scheduler Job** (AC: #17)
  - [ ] Create AssetWarrantyExpiryJob with @Scheduled
  - [ ] Run daily at 7 AM (cron: 0 0 7 * * *)
  - [ ] Query assets expiring in 30 days
  - [ ] Group by property manager
  - [ ] Send email using EmailService
  - [ ] Use @Async for non-blocking

- [ ] **Task 16: Implement Asset Controller** (AC: #31)
  - [ ] Create AssetController with @RestController
  - [ ] Implement POST /api/v1/assets (create)
  - [ ] Implement GET /api/v1/assets (list with filters)
  - [ ] Implement GET /api/v1/assets/{id} (detail)
  - [ ] Implement PUT /api/v1/assets/{id} (update)
  - [ ] Implement PATCH /api/v1/assets/{id}/status (status update)
  - [ ] Implement GET /api/v1/assets/{id}/maintenance-history (history)
  - [ ] Implement POST /api/v1/assets/{id}/documents (upload)
  - [ ] Implement DELETE /api/v1/assets/{id}/documents/{docId} (delete doc)
  - [ ] Implement GET /api/v1/assets/expiring-warranties (expiring)
  - [ ] Implement DELETE /api/v1/assets/{id} (soft delete)
  - [ ] Add @PreAuthorize for role-based access

- [ ] **Task 17: Create Asset List Page** (AC: #18)
  - [ ] Create app/(dashboard)/assets/page.tsx
  - [ ] Implement DataTable with asset columns
  - [ ] Add property filter dropdown (searchable)
  - [ ] Add category filter multi-select
  - [ ] Add status filter dropdown
  - [ ] Implement search by name/model/serial
  - [ ] Add pagination (20 per page)
  - [ ] Add sorting by assetNumber, createdAt
  - [ ] Add quick action buttons (View, Edit, History, Dispose)
  - [ ] Add warranty status column with badge
  - [ ] Add data-testid="page-assets"

- [ ] **Task 18: Create Asset Detail Page** (AC: #19)
  - [ ] Create app/(dashboard)/assets/[id]/page.tsx
  - [ ] Display asset header (number, name, status, warranty)
  - [ ] Display property/location section with link
  - [ ] Display specifications section (all optional fields)
  - [ ] Display warranty section with status badge and days
  - [ ] Display documents section with list and actions
  - [ ] Display maintenance history table with total cost
  - [ ] Add action buttons (Edit, Status, Upload, Dispose)
  - [ ] Add data-testid="page-asset-detail"

- [ ] **Task 19: Create Asset Create Form** (AC: #20)
  - [ ] Create app/(dashboard)/assets/new/page.tsx
  - [ ] Implement form with assetCreateSchema validation
  - [ ] Asset Name input (required, max 200)
  - [ ] Category select (required)
  - [ ] Property select (required, searchable)
  - [ ] Location input (required, max 200)
  - [ ] Manufacturer input (optional)
  - [ ] Model Number input (optional)
  - [ ] Serial Number input (optional)
  - [ ] Installation Date picker (optional)
  - [ ] Warranty Expiry Date picker (optional)
  - [ ] Purchase Cost input (optional, AED format)
  - [ ] Estimated Useful Life input (optional, integer years)
  - [ ] Add data-testid="form-asset-create"

- [ ] **Task 20: Create Asset Edit Page** (AC: #21)
  - [ ] Create app/(dashboard)/assets/[id]/edit/page.tsx
  - [ ] Pre-populate form with existing values
  - [ ] Show assetNumber as read-only display
  - [ ] Exclude status field (use separate dialog)
  - [ ] Allow editing all other fields
  - [ ] Add data-testid="form-asset-edit"

- [ ] **Task 21: Create Asset Status Dialog** (AC: #22)
  - [ ] Create components/assets/AssetStatusDialog.tsx
  - [ ] Display current status
  - [ ] Status dropdown (exclude current status)
  - [ ] Notes textarea (optional)
  - [ ] Confirm button triggers PATCH
  - [ ] Handle loading state
  - [ ] On success: close, invalidate cache, toast
  - [ ] Add data-testid="dialog-asset-status"

- [ ] **Task 22: Create Document Upload Dialog** (AC: #23)
  - [ ] Create components/assets/DocumentUploadDialog.tsx
  - [ ] Document Type select (required)
  - [ ] File dropzone (react-dropzone)
  - [ ] Accept PDF/JPG/PNG, max 10MB
  - [ ] Show file preview/name
  - [ ] Show upload progress
  - [ ] Handle loading state
  - [ ] On success: close, refresh documents, toast
  - [ ] Add data-testid="dialog-document-upload"

- [ ] **Task 23: Create Warranty Status Badge Component** (AC: #24)
  - [ ] Create components/assets/WarrantyStatusBadge.tsx
  - [ ] Accept warrantyExpiryDate prop
  - [ ] Calculate status: Active (>30 days), Expiring Soon (<=30), Expired, No Warranty
  - [ ] Map to colors: green, yellow, red, gray
  - [ ] Show days remaining tooltip for active
  - [ ] Add data-testid="badge-warranty-status"

- [ ] **Task 24: Create Category and Status Badge Components** (AC: #18)
  - [ ] Create components/assets/AssetCategoryBadge.tsx
  - [ ] Map categories to colors (HVAC=blue, ELEVATOR=purple, etc.)
  - [ ] Create components/assets/AssetStatusBadge.tsx
  - [ ] Map statuses to colors (ACTIVE=green, UNDER_MAINTENANCE=amber, OUT_OF_SERVICE=red, DISPOSED=gray)
  - [ ] Add data-testid attributes

- [ ] **Task 25: Update Work Order UI for Asset Link** (AC: #16)
  - [ ] Update work order create form to include asset select (optional)
  - [ ] Asset select filtered by property if property selected
  - [ ] Display linked asset on work order detail page
  - [ ] Link navigates to asset detail

- [ ] **Task 26: Write Backend Unit Tests** (AC: #34)
  - [ ] Create AssetServiceTest
  - [ ] Test createAsset (success, validation errors, property not found)
  - [ ] Test updateAsset
  - [ ] Test updateAssetStatus with all transitions
  - [ ] Test getMaintenanceHistory
  - [ ] Test getExpiringWarranties
  - [ ] Test asset number generation uniqueness
  - [ ] Create AssetControllerTest
  - [ ] Test endpoint authorization
  - [ ] Test request validation
  - [ ] Test file upload
  - [ ] Mock S3 and email services
  - [ ] Achieve >= 80% coverage

- [ ] **Task 27: Write Frontend Unit Tests** (AC: #35)
  - [ ] Test asset list page rendering
  - [ ] Test filter functionality
  - [ ] Test asset form validation (create/edit)
  - [ ] Test status dialog functionality
  - [ ] Test document upload dialog
  - [ ] Test warranty status badge colors
  - [ ] Verify data-testid accessibility

- [ ] **Task 28: Mandatory Test Execution and Build Verification** (AC: #36, #37)
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

**Asset Flow:**
```
Create Asset → Asset (ACTIVE) → Link to Work Orders → Track Maintenance History
                     ↓
            Update Status (UNDER_MAINTENANCE / OUT_OF_SERVICE)
                     ↓
            Dispose Asset (DISPOSED) → No further work orders
```

**Warranty Tracking Flow:**
```
Daily Job (7 AM) → Query assets with warranty expiring in 30 days
                → Group by property manager
                → Send email notification
                → Dashboard shows expiring count
```

**Work Order Integration:**
```
Work Order Created → Optional: Link to Asset (assetId)
Work Order Completed → Update asset.lastMaintenanceDate
                    → Add to asset maintenance history
                    → Calculate total maintenance cost
```

### Constraints

**Asset Rules:**
- assetNumber must be unique (database constraint)
- Property must exist when creating asset
- Only ACTIVE/UNDER_MAINTENANCE assets can link to new work orders
- DISPOSED assets cannot be edited or linked to work orders
- Document max size: 10MB
- Document types: PDF, JPG, JPEG, PNG

**Number Format:**
- Pattern: AST-{YYYY}-{NNNN}
- Example: AST-2025-0001, AST-2025-0002
- Reset sequence at year change (AST-2026-0001)

### Prerequisites

**From Story 3.2 (Property Management):**
- Property entity with id, name
- PropertyRepository and PropertyService
- Property dropdown data

**From Story 4.1 (Work Orders):**
- WorkOrder entity
- Work order completion flow
- Add assetId foreign key to work_orders table

**From Story 1.6 (AWS S3):**
- FileStorageService for document storage
- Presigned URL generation
- LocalStack for development

**From Story 6.2 (Expenses):**
- Number generation pattern (AST-YYYY-NNNN same as EXP-YYYY-NNNN)
- Scheduler job pattern
- Email notification pattern

### Learnings from Previous Story

**From Story 6-2-expense-management-and-vendor-payments (Status: done)**

- **Backend Patterns**: Entity with enums, Repository with custom queries, Service layer with @Transactional, Controller with @PreAuthorize, DTOs with MapStruct
- **Frontend Patterns**: TypeScript types in types/*.ts, Zod validation schemas in lib/validations/*.ts, Frontend service in services/*.service.ts, React Query hooks in hooks/use*.ts, Pages with data-testid attributes
- **Number Generation**: Use database sequence with year prefix, format XXX-YYYY-NNNN
- **File Storage**: Use existing FileStorageService, store at /uploads/{entity}/{entityId}/
- **Test Patterns**: Service tests covering all methods, Controller tests for authorization and validation
- **Build Verification**: Always run mvn test, npm test, npm run build, npm run lint before marking done

[Source: docs/sprint-artifacts/epic-6/6-2-expense-management-and-vendor-payments.md#Dev-Agent-Record]

### Project Structure Notes

**Backend Files to Create:**
- `backend/src/main/java/com/ultrabms/entity/Asset.java`
- `backend/src/main/java/com/ultrabms/entity/AssetDocument.java`
- `backend/src/main/java/com/ultrabms/entity/enums/AssetCategory.java`
- `backend/src/main/java/com/ultrabms/entity/enums/AssetStatus.java`
- `backend/src/main/java/com/ultrabms/entity/enums/DocumentType.java` (if not exists)
- `backend/src/main/java/com/ultrabms/repository/AssetRepository.java`
- `backend/src/main/java/com/ultrabms/repository/AssetDocumentRepository.java`
- `backend/src/main/java/com/ultrabms/service/AssetService.java`
- `backend/src/main/java/com/ultrabms/service/impl/AssetServiceImpl.java`
- `backend/src/main/java/com/ultrabms/controller/AssetController.java`
- `backend/src/main/java/com/ultrabms/dto/asset/*.java` (DTOs)
- `backend/src/main/java/com/ultrabms/mapper/AssetMapper.java`
- `backend/src/main/java/com/ultrabms/scheduler/AssetWarrantyExpiryJob.java`
- `backend/src/main/resources/db/migration/V{X}__create_assets_table.sql`
- `backend/src/main/resources/db/migration/V{X+1}__create_asset_documents_table.sql`
- `backend/src/main/resources/db/migration/V{X+2}__add_asset_id_to_work_orders.sql`
- `backend/src/main/resources/templates/email/asset-warranty-expiry-notification.html`
- `backend/src/test/java/com/ultrabms/service/AssetServiceTest.java`
- `backend/src/test/java/com/ultrabms/controller/AssetControllerTest.java`

**Frontend Files to Create:**
- `frontend/src/types/asset.ts`
- `frontend/src/lib/validations/asset.ts`
- `frontend/src/services/asset.service.ts`
- `frontend/src/hooks/useAssets.ts`
- `frontend/src/app/(dashboard)/assets/page.tsx`
- `frontend/src/app/(dashboard)/assets/[id]/page.tsx`
- `frontend/src/app/(dashboard)/assets/new/page.tsx`
- `frontend/src/app/(dashboard)/assets/[id]/edit/page.tsx`
- `frontend/src/components/assets/AssetStatusDialog.tsx`
- `frontend/src/components/assets/DocumentUploadDialog.tsx`
- `frontend/src/components/assets/WarrantyStatusBadge.tsx`
- `frontend/src/components/assets/AssetCategoryBadge.tsx`
- `frontend/src/components/assets/AssetStatusBadge.tsx`

### References

- [Source: docs/epics/epic-7-asset-compliance-management.md#story-71-asset-registry-and-tracking]
- [Source: docs/prd.md#3.7-asset-management-module]
- [Source: docs/architecture.md#asset-management]
- [Source: docs/architecture.md#data-architecture]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-7/7-1-asset-registry-and-tracking.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-29 | 1.0 | SM Agent (Bob) | Initial story draft created from Epic 7 acceptance criteria in YOLO mode |
