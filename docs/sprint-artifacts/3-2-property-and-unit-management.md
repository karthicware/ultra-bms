# Story 3.2: Property and Unit Management

Status: drafted

## Story

As a property manager,
I want to manage properties and their units,
So that I can track available units and assign tenants to them.

## Acceptance Criteria

1. **AC1 - Property Creation and Management:** Property manager can create new properties via POST /api/v1/properties with form capturing: property name (required, max 200 chars), full address (required, max 500 chars), property type (enum: RESIDENTIAL, COMMERCIAL, MIXED_USE), total units count (integer, min 1), assigned property manager (dropdown of PROPERTY_MANAGER users from User table), year built (optional, 4-digit year 1900-current year), total square footage (optional, decimal > 0), amenities list (array of strings: pool, gym, parking, security, etc.), property images (max 5 files, each max 5MB, JPG/PNG). Backend creates Property entity with id (UUID), status (enum: ACTIVE, INACTIVE, default ACTIVE), createdAt/updatedAt timestamps, createdBy (userId). Frontend displays properties list at /properties with search (by name, address), filters (type, manager, occupancy range), sortable columns (name, total units, occupied units, occupancy %), pagination (20 per page). Property detail page shows all information, unit grid/list view, occupancy metrics, quick actions (Add Unit, View Tenants). Use shadcn Table, Card, Select components.

2. **AC2 - Property Image Upload:** Properties can have multiple images attached (max 5 images total) via POST /api/v1/properties/{id}/images with validation: file type (JPG/PNG only), max size 5MB per file, total max 5 images per property. Backend stores images in /uploads/properties/{propertyId}/images/ with original filename preserved, creates PropertyImage entity with id, propertyId, fileName, filePath, fileSize, uploadedBy, uploadedAt, displayOrder (integer for sorting). Frontend shows image gallery in property detail page with thumbnails, drag-and-drop upload zone, preview before upload, delete option per image, reorder images via drag-and-drop to set displayOrder. Use shadcn Dialog for image lightbox, React DnD for drag-and-drop ordering.

3. **AC3 - Unit Creation and Management:** From property detail page, property manager can add single unit via "Add Unit" button opening unit form with: unit number (required, max 50 chars, unique within property), floor (integer, can be negative for basement, e.g., -1, 0, 1, 2), bedroom count (decimal, e.g., 1, 2, 2.5 for studio with den), bathroom count (decimal, e.g., 1, 1.5, 2), square footage (decimal > 0), monthly rent (decimal > 0, base rent amount), status (enum: AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED, default AVAILABLE), features (JSON object for flexible attributes like balcony: true, view: "sea", floorPlanType: "A", parkingSpotsIncluded: 1). Backend creates Unit entity via POST /api/v1/properties/{id}/units with unitId (UUID), propertyId (foreign key to Property), createdAt/updatedAt timestamps. Frontend validates unit number uniqueness within property, shows success toast "Unit {unitNumber} created", refreshes unit list. Use React Hook Form + Zod validation, shadcn Form components.

4. **AC4 - Bulk Unit Creation:** Property detail page has "Bulk Add Units" button opening bulk creation modal with fields: starting unit number (required, e.g., "101"), count (required, integer 1-100, number of units to create), floor (required, integer, all units on same floor), increment pattern (dropdown: Sequential [101, 102, 103], Floor-Based [101, 102, 201, 202], Custom), bedroom count (required, decimal, applies to all units), bathroom count (required, decimal), square footage (optional, decimal, applies to all), monthly rent (required, decimal, applies to all), features (optional, JSON template applied to all). Backend creates multiple Unit entities in single transaction via POST /api/v1/properties/{id}/units/bulk with request body containing array of unit data, validates total units count doesn't exceed property.totalUnitsCount, ensures all unit numbers unique within property. Frontend shows progress bar during creation, displays summary "Created X units successfully", handles partial failures (show which units failed with reasons). Use shadcn Progress component, AlertDialog for confirmation.

5. **AC5 - Unit Grid and List Views:** Property detail page shows units in two view modes (toggle button: Grid | List). Grid view displays units as cards (3-4 columns on desktop, 1 column mobile) with color-coded status: AVAILABLE (green background, "Available" text), OCCUPIED (red background, "Occupied" with tenant name), UNDER_MAINTENANCE (yellow background, "Maintenance"), RESERVED (blue background, "Reserved"). Each card shows: unit number (large text), floor, bedrooms/bathrooms (icon + number), square footage, monthly rent (formatted AED), quick action buttons (View Details, Edit, Change Status). List view shows units in shadcn Table with columns: unit number, floor, type (bedroom count), bathrooms, sqft, rent, status badge, actions (View, Edit, Delete). Both views support filtering by: status (multi-select checkboxes), floor (range slider or input), bedroom count (dropdown: Studio, 1BR, 2BR, 3BR+), rent range (min/max inputs). Use shadcn Tabs for view toggle, Badge for status, Card for grid items.

6. **AC6 - Unit Status Management:** Unit list/grid has status dropdown per unit allowing quick status changes via PATCH /api/v1/units/{id}/status with new status value. Status transitions validated: AVAILABLE → RESERVED (when quotation accepted), RESERVED → OCCUPIED (when tenant onboarding complete), OCCUPIED → AVAILABLE (when tenant exits), any status → UNDER_MAINTENANCE, UNDER_MAINTENANCE → previous status. Backend validates: cannot set OCCUPIED without active tenant, cannot set AVAILABLE if tenant exists, logs status change in UnitHistory entity with id, unitId, oldStatus, newStatus, reason (optional text), changedBy (userId), changedAt timestamp. Frontend shows confirmation dialog for status changes, displays status badge with color coding, updates immediately with optimistic UI (show new status instantly, revert on error). Use shadcn Select dropdown for status, AlertDialog for confirmation.

7. **AC7 - Bulk Unit Status Update:** Unit list view has checkbox column allowing multi-select units. When units selected, toolbar appears with "Change Status" button opening dialog with: target status dropdown (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED), reason (optional text field), confirmation message "Update X units to {status}?". Backend endpoint PATCH /api/v1/units/bulk-status with request body { unitIds: string[], newStatus: UnitStatus, reason?: string }, validates all units exist and transitions are valid, performs update in transaction (rollback if any fail), returns success count and failure details. Frontend shows progress during update, displays summary "Updated X of Y units", lists any failures with reasons. Use shadcn Checkbox for selection, AlertDialog for confirmation.

8. **AC8 - Property Occupancy Calculation:** Property list shows occupancy rate calculated as: (count of units with status OCCUPIED) / (property.totalUnitsCount) * 100. Backend endpoint GET /api/v1/properties includes occupancyRate field in response DTO, calculated via SQL query counting occupied units. Frontend displays occupancy as: percentage badge color-coded (green ≥90%, yellow 70-89%, red <70%), progress bar showing visual representation, tooltip showing "X of Y units occupied". Property detail page shows detailed occupancy metrics: total units, available units count, occupied units count, under maintenance count, reserved count, occupancy percentage with trend (compare to last month). Use shadcn Badge for percentage, Progress for visual bar.

9. **AC9 - Property Manager Assignment:** Property form includes "Assigned Manager" dropdown populated via GET /api/v1/users?role=PROPERTY_MANAGER returning users with PROPERTY_MANAGER role. Assignment stored in property.managerId field (foreign key to User). Backend validates assigned user has PROPERTY_MANAGER role, allows null (unassigned property). Frontend property list supports filter by manager (dropdown of all property managers, option "Unassigned"). Property detail page shows manager card with: manager name, email, phone, avatar, "Reassign" button to change manager. Reassignment via PATCH /api/v1/properties/{id}/manager with new managerId. Use shadcn Avatar for manager display, Select for dropdown.

10. **AC10 - Property Search and Filtering:** Property list page supports: text search (searches name and address using LIKE query, debounced 300ms), filter by property type (multi-select: RESIDENTIAL, COMMERCIAL, MIXED_USE), filter by assigned manager (dropdown: all managers + "Unassigned"), filter by occupancy range (slider 0-100% or inputs min/max), sort by columns (name A-Z, occupancy % high-to-low, total units high-to-low). Backend endpoint GET /api/v1/properties with query params: page, size, sort, direction, search, types[], managerId, occupancyMin, occupancyMax. Results paginated (default 20 per page, options 10/20/50). Frontend uses shadcn Input for search (with search icon), Select for filters, Slider for occupancy range. Use lodash debounce (300ms) for search input.

11. **AC11 - Soft Delete for Properties and Units:** DELETE /api/v1/properties/{id} performs soft delete by setting property.active=false instead of removing record, only allowed if property has zero OCCUPIED units (validation error if occupied units exist). DELETE /api/v1/units/{id} performs soft delete by setting unit.active=false, only allowed if unit status is not OCCUPIED (validation error if occupied). Backend adds deleted flag check to all GET queries (WHERE active = true by default). Frontend shows "Delete" button with confirmation dialog warning "This action cannot be undone. Property will be archived." for properties, "Unit will be archived. This cannot be undone." for units. Displays inline error if delete blocked due to occupied units. Use shadcn AlertDialog for delete confirmation, Alert for error messages.

12. **AC12 - Property Detail Page:** Property detail page at /properties/{id} shows: header with property name, address, type badge, status badge, edit button; image gallery (carousel if multiple images, placeholder if none); info cards (total units, occupied units, occupancy %, assigned manager); tabs for Units (grid/list view), Tenants (list of all tenants in this property with links to tenant profiles), Documents (future), History (property changes log). Units tab is default, shows unit grid/list with filters and add unit button. Backend endpoint GET /api/v1/properties/{id} returns full property details with manager details, unit counts, images. Use shadcn Tabs for sections, Carousel for image gallery, Card for info metrics.

13. **AC13 - Unit Detail Page:** Unit detail page at /units/{id} shows: breadcrumb (Property Name → Units → Unit Number), header with unit number, floor, type (2 BED / 2 BATH), status badge, edit/delete buttons; rent information card (monthly rent, square footage, rent per sqft calculated); features section (displays all JSON features as key-value pairs or badges); tenant information (if OCCUPIED, shows tenant name, lease dates, contact, link to tenant profile, "View Tenant" button); history section (shows status changes from UnitHistory table as timeline). Backend endpoint GET /api/v1/units/{id} returns unit with property details, current tenant (if occupied), history records. Frontend uses shadcn Breadcrumb for navigation, Timeline component for history. Use data-testid attributes: unit-detail-page, unit-info-card, unit-features-section.

14. **AC14 - TypeScript Types and API Integration:** Define TypeScript interfaces in types/properties.ts: Property, PropertyImage, PropertySearchParams, PropertyResponse. Define in types/units.ts: Unit, UnitFeatures, UnitHistory, UnitSearchParams, UnitStatusUpdate. Define enums: PropertyType (RESIDENTIAL, COMMERCIAL, MIXED_USE), PropertyStatus (ACTIVE, INACTIVE), UnitStatus (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED). Create Zod schemas in lib/validations/properties.ts: createPropertySchema (validates name, address, totalUnitsCount ≥ 1, yearBuilt 1900-current), uploadPropertyImageSchema (validates file type JPG/PNG, size ≤ 5MB). Create lib/validations/units.ts: createUnitSchema (validates unitNumber required, floor integer, bedroomCount ≥ 0, bathroomCount ≥ 0, monthlyRent > 0, squareFootage > 0), bulkCreateUnitsSchema (validates count 1-100, starting unit number). Create services/properties.service.ts with methods: createProperty, getProperties, getPropertyById, updateProperty, deleteProperty, uploadImage, deleteImage. Create services/units.service.ts with methods: createUnit, getUnits, getUnitById, updateUnit, updateUnitStatus, bulkUpdateStatus, deleteUnit, bulkCreateUnits. Follow API integration patterns from services/leads.service.ts (Story 3.1).

15. **AC15 - Caching with Ehcache:** Backend implements Ehcache for property list with TTL 2 hours (7200 seconds). Properties are frequently viewed but change infrequently. Add @Cacheable annotation to PropertyService.findAll() method with cache name "properties", cache key includes search and filter params. Add @CacheEvict to create, update, delete methods to invalidate cache. Configure in application.properties: spring.cache.type=ehcache, ehcache.xml defines cache "properties" with maxEntriesLocalHeap=1000, timeToLiveSeconds=7200. Unit list not cached (changes frequently with tenant assignments). Frontend doesn't need to implement cache logic (relies on backend caching for performance).

16. **AC16 - Responsive Design and Accessibility:** All pages responsive: single column on mobile (<640px), grid on tablet (2 columns), multi-column on desktop (3-4 columns for unit grid). Unit grid cards min 280px width. Touch targets min 44×44px. All forms keyboard navigable with proper tab order. ARIA labels on all interactive elements: aria-label="Search properties", aria-label="Filter by type". Loading states with Skeleton components for property list, unit grid. Success/error feedback with toast notifications (green for success, red for error). Color-coded status badges include text labels for accessibility (not color-only). Use shadcn dark theme classes. All interactive elements have data-testid attributes per docs/data-testid-conventions.md: form-property-create, input-property-name, btn-add-unit, table-units, select-unit-status, btn-bulk-create, grid-units, card-unit-{unitNumber}.

17. **AC17 - Form Validation and Error Handling:** Property form validates: name required and ≤ 200 chars, address required and ≤ 500 chars, totalUnitsCount ≥ 1, yearBuilt between 1900 and current year (if provided), property type selected from enum, assigned manager exists and has PROPERTY_MANAGER role. Unit form validates: unitNumber required and unique within property, floor is integer (can be negative), bedroomCount ≥ 0 and ≤ 10, bathroomCount ≥ 0 and ≤ 10, squareFootage > 0, monthlyRent > 0. Image upload validates: file type is JPG or PNG (use MIME type check), file size ≤ 5MB, total images ≤ 5 per property. Frontend uses Zod schemas with React Hook Form, displays inline errors below fields in red text, focuses first error field on submit. Backend validates with @Valid annotation, returns 400 with field-specific errors: { success: false, error: { code: "VALIDATION_ERROR", fields: { "unitNumber": "Unit number already exists" } } }. Use shadcn Alert for general errors, inline text for field errors.

18. **AC18 - Testing and Documentation:** Write E2E tests with Playwright: create property flow with image upload, add single unit, bulk create units (10 units), unit grid/list view toggle, filter units by status and floor, change unit status, bulk status update, calculate occupancy rate, search/filter properties, soft delete property (verify occupied units block delete). Write unit tests for: Zod validation schemas, property/unit service methods, occupancy calculation, bulk creation logic. Verify all data-testid attributes exist per Epic 2 retrospective (AI-2-1). Run scripts/check-services.sh before tests per Epic 2 (AI-2-2). Document API endpoints in API.md. Add JSDoc comments to all service methods. Create component usage guide for shadcn Table, Card, Grid layouts. Test responsive breakpoints (375px mobile, 768px tablet, 1920px desktop).

## Component Mapping

### shadcn/ui Components to Use

**Property Management:**
- Property form: shadcn `form`, `input`, `select`, `textarea` components
- Property list table: shadcn `table` with sortable columns
- Property cards: shadcn `card` for displaying property information
- Image gallery: shadcn `carousel` for multiple property images
- Image upload: shadcn `dialog` with file input for drag-and-drop zone
- Delete confirmation: shadcn `alert-dialog` for property deletion

**Unit Management:**
- Unit form: shadcn `form`, `input`, `select` components
- Unit grid view: shadcn `card` for each unit with color-coded backgrounds
- Unit list view: shadcn `table` with status badges
- Status badges: shadcn `badge` component with color variants
- View toggle: shadcn `tabs` for grid/list switch
- Bulk operations: shadcn `checkbox` for multi-select, `alert-dialog` for confirmation
- Filters: shadcn `select` (dropdowns), `slider` (occupancy range), `input` (search)

**Common UI:**
- Loading states: shadcn `skeleton` components
- Notifications: shadcn `toast` for success/error messages
- Breadcrumbs: shadcn `breadcrumb` for navigation
- Progress indicators: shadcn `progress` for occupancy rate, bulk operations
- Avatars: shadcn `avatar` for property manager display

### Custom Components Required

None - all UI requirements can be met with shadcn/ui components and standard HTML elements.

### Installation Command

```bash
npx shadcn@latest add form input select textarea table card carousel dialog alert-dialog badge tabs checkbox slider skeleton toast breadcrumb progress avatar button
```

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types and Enums** (AC: #14)
  - [ ] Create types/properties.ts with Property, PropertyImage, PropertySearchParams, PropertyListResponse interfaces
  - [ ] Define PropertyType enum (RESIDENTIAL, COMMERCIAL, MIXED_USE)
  - [ ] Define PropertyStatus enum (ACTIVE, INACTIVE)
  - [ ] Create types/units.ts with Unit, UnitFeatures, UnitHistory, UnitSearchParams interfaces
  - [ ] Define UnitStatus enum (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE, RESERVED)
  - [ ] Define all request/response DTOs matching backend API contracts
  - [ ] Export all types and enums for use across frontend

- [ ] **Task 2: Create Zod Validation Schemas** (AC: #14, #17)
  - [ ] Create lib/validations/properties.ts with createPropertySchema
  - [ ] Validate name required (max 200 chars), address required (max 500 chars)
  - [ ] Validate totalUnitsCount ≥ 1, yearBuilt 1900 to current year (if provided)
  - [ ] Validate property type is valid enum value
  - [ ] Create uploadPropertyImageSchema (file type JPG/PNG, size ≤ 5MB, max 5 images)
  - [ ] Create lib/validations/units.ts with createUnitSchema
  - [ ] Validate unitNumber required, floor integer, bedroomCount ≥ 0, bathroomCount ≥ 0
  - [ ] Validate squareFootage > 0, monthlyRent > 0
  - [ ] Create bulkCreateUnitsSchema (count 1-100, starting unit number required)
  - [ ] Export all schemas with TypeScript inference types

- [ ] **Task 3: Implement Property Service Layer** (AC: #14)
  - [ ] Create services/properties.service.ts using Axios instance from lib/api.ts
  - [ ] Implement createProperty(data: CreatePropertyRequest): Promise<Property>
  - [ ] Implement getProperties(params: PropertySearchParams): Promise<PropertyListResponse>
  - [ ] Implement getPropertyById(id: string): Promise<Property>
  - [ ] Implement updateProperty(id: string, data: UpdatePropertyRequest): Promise<Property>
  - [ ] Implement deleteProperty(id: string): Promise<void> (soft delete)
  - [ ] Implement uploadImage(propertyId: string, file: File): Promise<PropertyImage>
  - [ ] Implement deleteImage(propertyId: string, imageId: string): Promise<void>
  - [ ] Add error handling using try-catch with toast notifications

- [ ] **Task 4: Implement Unit Service Layer** (AC: #14)
  - [ ] Create services/units.service.ts using Axios instance
  - [ ] Implement createUnit(propertyId: string, data: CreateUnitRequest): Promise<Unit>
  - [ ] Implement getUnits(propertyId: string, params: UnitSearchParams): Promise<UnitListResponse>
  - [ ] Implement getUnitById(id: string): Promise<Unit>
  - [ ] Implement updateUnit(id: string, data: UpdateUnitRequest): Promise<Unit>
  - [ ] Implement updateUnitStatus(id: string, status: UnitStatus, reason?: string): Promise<Unit>
  - [ ] Implement bulkUpdateStatus(unitIds: string[], status: UnitStatus, reason?: string): Promise<BulkUpdateResult>
  - [ ] Implement deleteUnit(id: string): Promise<void> (soft delete)
  - [ ] Implement bulkCreateUnits(propertyId: string, data: BulkCreateRequest): Promise<BulkCreateResult>

- [ ] **Task 5: Create Property List Page** (AC: #1, #10)
  - [ ] Create app/(dashboard)/properties/page.tsx with server component for initial data
  - [ ] Implement properties table using shadcn Table component
  - [ ] Add columns: name, address, type, total units, occupied units, occupancy % with badge
  - [ ] Implement search box with 300ms debounce (use lodash debounce from Story 3.1)
  - [ ] Add filter selects: property type (multi-select), assigned manager, occupancy range (slider)
  - [ ] Implement pagination with page size selector (10, 20, 50)
  - [ ] Add "Create Property" button navigating to /properties/create
  - [ ] Add quick action buttons per row: View Details, Edit, Delete
  - [ ] Display occupancy % with color-coded badge (green ≥90%, yellow 70-89%, red <70%)
  - [ ] Add data-testid attributes: table-properties, btn-create-property, input-search-properties

- [ ] **Task 6: Create Property Detail Page** (AC: #1, #12)
  - [ ] Create app/(dashboard)/properties/[id]/page.tsx
  - [ ] Display property header: name, address, type badge, status badge, Edit button
  - [ ] Show image gallery with shadcn Carousel (or placeholder if no images)
  - [ ] Display info cards: Total Units, Occupied Units, Occupancy %, Assigned Manager (with avatar)
  - [ ] Implement tabs: Units (default), Tenants, History
  - [ ] Units tab shows unit grid/list with filters and "Add Unit" button
  - [ ] Tenants tab lists all tenants in this property with links to profiles
  - [ ] History tab shows property change log
  - [ ] Add breadcrumb navigation: Properties → {Property Name}
  - [ ] Add data-testid: property-detail-page, property-info-cards, tabs-property

- [ ] **Task 7: Create Property Form (Create/Edit)** (AC: #1, #17)
  - [ ] Create app/(dashboard)/properties/create/page.tsx
  - [ ] Create app/(dashboard)/properties/[id]/edit/page.tsx (reuse form component)
  - [ ] Build form with React Hook Form + Zod validation (createPropertySchema)
  - [ ] Add fields: name, address, property type (select), total units count (number input)
  - [ ] Add fields: assigned manager (dropdown from GET /api/v1/users?role=PROPERTY_MANAGER)
  - [ ] Add optional fields: year built (number 1900-current), square footage, amenities (multi-input)
  - [ ] Implement image upload with drag-and-drop zone (max 5 images, 5MB each, JPG/PNG)
  - [ ] Show image previews with delete option before upload
  - [ ] Display inline validation errors below each field
  - [ ] Show success toast on create/update, navigate to property detail page
  - [ ] Add data-testid: form-property-create, input-property-name, select-property-type

- [ ] **Task 8: Create Unit Form (Single Create)** (AC: #3, #17)
  - [ ] Create components/properties/UnitFormModal.tsx (reusable modal component)
  - [ ] Build form with React Hook Form + Zod validation (createUnitSchema)
  - [ ] Add fields: unit number (text, required), floor (number, can be negative)
  - [ ] Add fields: bedroom count (number/decimal), bathroom count (number/decimal)
  - [ ] Add fields: square footage (number), monthly rent (number, required)
  - [ ] Add field: status (select from UnitStatus enum, default AVAILABLE)
  - [ ] Add field: features (JSON editor or key-value inputs for balcony, view, floorPlanType, etc.)
  - [ ] Validate unit number uniqueness within property (check on submit)
  - [ ] Display inline validation errors
  - [ ] Show success toast "Unit {unitNumber} created", close modal, refresh unit list
  - [ ] Add data-testid: form-unit-create, input-unit-number, input-monthly-rent

- [ ] **Task 9: Create Bulk Unit Creation Modal** (AC: #4)
  - [ ] Create components/properties/BulkUnitCreateModal.tsx
  - [ ] Build form with fields: starting unit number, count (1-100), floor
  - [ ] Add field: increment pattern (dropdown: Sequential, Floor-Based, Custom)
  - [ ] Add fields: bedroom count, bathroom count, square footage, monthly rent (apply to all)
  - [ ] Add optional field: features JSON template (apply to all units)
  - [ ] Show preview of unit numbers to be created based on pattern (e.g., "101, 102, 103...")
  - [ ] Display progress bar during creation (POST /api/v1/properties/{id}/units/bulk)
  - [ ] Handle partial failures: show success count and list of failed units with reasons
  - [ ] Show summary toast "Created X of Y units successfully"
  - [ ] Add confirmation dialog before submitting bulk creation
  - [ ] Add data-testid: modal-bulk-create, input-starting-unit, input-unit-count

- [ ] **Task 10: Create Unit Grid View** (AC: #5)
  - [ ] Create components/properties/UnitGrid.tsx
  - [ ] Display units as shadcn Card components in responsive grid (1 col mobile, 3-4 cols desktop)
  - [ ] Color-code cards by status: AVAILABLE (green bg), OCCUPIED (red bg), UNDER_MAINTENANCE (yellow bg), RESERVED (blue bg)
  - [ ] Each card shows: unit number (large), floor, bedrooms/bathrooms (icons), sqft, rent (AED formatted)
  - [ ] Add quick action buttons on each card: View Details, Edit, Change Status
  - [ ] Implement filters: status (multi-select checkboxes), floor (range inputs), bedrooms (dropdown), rent range (min/max)
  - [ ] Add view toggle (Grid | List) using shadcn Tabs
  - [ ] Add "Add Unit" and "Bulk Add Units" buttons
  - [ ] Add data-testid: grid-units, card-unit-{unitNumber}, btn-add-unit, btn-bulk-add

- [ ] **Task 11: Create Unit List View** (AC: #5)
  - [ ] Create components/properties/UnitList.tsx
  - [ ] Display units in shadcn Table with columns: unit number, floor, type (BR count), bathrooms, sqft, rent, status badge, actions
  - [ ] Status badge color-coded: AVAILABLE (green), OCCUPIED (red), UNDER_MAINTENANCE (yellow), RESERVED (blue)
  - [ ] Add checkbox column for multi-select (for bulk status updates)
  - [ ] Actions column: View, Edit, Delete buttons (icon buttons)
  - [ ] Sortable columns: unit number, floor, rent
  - [ ] Show selected unit count in toolbar when checkboxes selected
  - [ ] Toolbar shows "Change Status" button when units selected
  - [ ] Add data-testid: table-units, checkbox-unit-{id}, btn-unit-view, btn-unit-edit

- [ ] **Task 12: Implement Unit Status Management** (AC: #6)
  - [ ] Create components/properties/UnitStatusDialog.tsx
  - [ ] Status dropdown in grid/list view per unit calling PATCH /api/v1/units/{id}/status
  - [ ] Validate status transitions: AVAILABLE ↔ RESERVED ↔ OCCUPIED, any ↔ UNDER_MAINTENANCE
  - [ ] Show confirmation dialog for status changes with reason field (optional)
  - [ ] Implement optimistic UI: update UI immediately, revert on error
  - [ ] Log status change to UnitHistory (backend handles this)
  - [ ] Show error toast if invalid transition (e.g., setting OCCUPIED without tenant)
  - [ ] Add data-testid: select-unit-status, dialog-status-change, input-status-reason

- [ ] **Task 13: Implement Bulk Status Update** (AC: #7)
  - [ ] Create components/properties/BulkStatusUpdateDialog.tsx
  - [ ] When units selected in list view, show toolbar with "Change Status" button
  - [ ] Dialog shows: target status dropdown, reason field (optional), confirmation message "Update X units?"
  - [ ] Call PATCH /api/v1/units/bulk-status with { unitIds: [], newStatus, reason }
  - [ ] Show progress during update
  - [ ] Display summary: "Updated X of Y units successfully"
  - [ ] List any failed units with failure reasons
  - [ ] Clear selection after successful update
  - [ ] Add data-testid: btn-bulk-status-update, dialog-bulk-status, select-bulk-status

- [ ] **Task 14: Implement Occupancy Calculation Display** (AC: #8)
  - [ ] Property list shows occupancy % badge per property (calculated backend)
  - [ ] Display as Badge with color: green (≥90%), yellow (70-89%), red (<70%)
  - [ ] Add Progress bar for visual representation
  - [ ] Tooltip shows "{X} of {Y} units occupied"
  - [ ] Property detail page shows detailed breakdown: total, available, occupied, maintenance, reserved counts
  - [ ] Add occupancy trend indicator if comparing to previous period (future enhancement)
  - [ ] Add data-testid: badge-occupancy, progress-occupancy

- [ ] **Task 15: Implement Property Manager Assignment** (AC: #9)
  - [ ] Property form includes "Assigned Manager" dropdown
  - [ ] Fetch managers via GET /api/v1/users?role=PROPERTY_MANAGER
  - [ ] Display manager card in property detail: name, email, phone, avatar
  - [ ] Add "Reassign Manager" button opening dropdown to select new manager
  - [ ] Update via PATCH /api/v1/properties/{id}/manager with new managerId
  - [ ] Property list supports filter by manager (dropdown of all managers + "Unassigned" option)
  - [ ] Use shadcn Avatar component for manager display
  - [ ] Add data-testid: select-property-manager, card-manager-info, btn-reassign-manager

- [ ] **Task 16: Create Unit Detail Page** (AC: #13)
  - [ ] Create app/(dashboard)/units/[id]/page.tsx
  - [ ] Display breadcrumb: Properties → {Property Name} → Units → {Unit Number}
  - [ ] Show header: unit number, floor, type (2 BED / 2 BATH), status badge, Edit/Delete buttons
  - [ ] Display rent information card: monthly rent, square footage, rent per sqft (calculated)
  - [ ] Show features section: display all JSON features as badges or key-value list
  - [ ] If OCCUPIED, show tenant card: tenant name, lease dates, contact, "View Tenant" link
  - [ ] Show history section: timeline of status changes from UnitHistory table
  - [ ] Add data-testid: unit-detail-page, unit-info-card, unit-features, unit-tenant-card

- [ ] **Task 17: Implement Soft Delete** (AC: #11)
  - [ ] Property delete button shows AlertDialog: "Archive this property? This cannot be undone."
  - [ ] Call DELETE /api/v1/properties/{id}, handle error if occupied units exist
  - [ ] Display error toast if delete blocked: "Cannot delete property with occupied units"
  - [ ] Unit delete button shows AlertDialog: "Archive this unit? This cannot be undone."
  - [ ] Call DELETE /api/v1/units/{id}, handle error if unit is OCCUPIED
  - [ ] Display error toast if delete blocked: "Cannot delete occupied unit"
  - [ ] Soft deleted items excluded from default lists (backend handles with active=true filter)
  - [ ] Add data-testid: btn-delete-property, btn-delete-unit, dialog-delete-confirm

- [ ] **Task 18: Backend - Property Entity and Repository** (AC: #1, #15)
  - [ ] Create backend/src/main/java/com/ultrabms/entity/Property.java
  - [ ] Fields: id (UUID), name (String, max 200), address (String, max 500), propertyType (enum)
  - [ ] Fields: totalUnitsCount (Integer), managerId (UUID FK to User), yearBuilt (Integer)
  - [ ] Fields: totalSquareFootage (BigDecimal), amenities (JSON or @ElementCollection List<String>)
  - [ ] Fields: status (enum: ACTIVE, INACTIVE), active (boolean for soft delete, default true)
  - [ ] Fields: createdAt, updatedAt (timestamps), createdBy (UUID)
  - [ ] Create PropertyRepository extending JpaRepository with custom query methods
  - [ ] Add method: findByActiveTrue() for non-deleted properties
  - [ ] Add method: findByPropertyTypeAndActiveTrue(PropertyType type)
  - [ ] Add method: findByManagerIdAndActiveTrue(UUID managerId)

- [ ] **Task 19: Backend - PropertyImage Entity and Repository** (AC: #2)
  - [ ] Create backend/src/main/java/com/ultrabms/entity/PropertyImage.java
  - [ ] Fields: id (UUID), propertyId (UUID FK), fileName, filePath, fileSize (Long)
  - [ ] Fields: displayOrder (Integer for sorting), uploadedBy (UUID), uploadedAt (timestamp)
  - [ ] Create PropertyImageRepository
  - [ ] Add method: findByPropertyIdOrderByDisplayOrderAsc(UUID propertyId)
  - [ ] Add method: countByPropertyId(UUID propertyId) to enforce max 5 images

- [ ] **Task 20: Backend - Unit Entity and Repository** (AC: #3)
  - [ ] Create backend/src/main/java/com/ultrabms/entity/Unit.java
  - [ ] Fields: id (UUID), propertyId (UUID FK to Property), unitNumber (String, max 50)
  - [ ] Fields: floor (Integer), bedroomCount (BigDecimal), bathroomCount (BigDecimal)
  - [ ] Fields: squareFootage (BigDecimal), monthlyRent (BigDecimal), status (UnitStatus enum)
  - [ ] Fields: features (JSON or @Type(JsonType.class) Map<String, Object>)
  - [ ] Fields: active (boolean for soft delete, default true), createdAt, updatedAt
  - [ ] Create UnitRepository with custom methods
  - [ ] Add method: findByPropertyIdAndActiveTrue(UUID propertyId)
  - [ ] Add method: existsByPropertyIdAndUnitNumberAndActiveTrue(UUID propertyId, String unitNumber)
  - [ ] Add method: countByPropertyIdAndStatusAndActiveTrue(UUID propertyId, UnitStatus status)

- [ ] **Task 21: Backend - UnitHistory Entity and Repository** (AC: #6)
  - [ ] Create backend/src/main/java/com/ultrabms/entity/UnitHistory.java
  - [ ] Fields: id (UUID), unitId (UUID FK), oldStatus (UnitStatus), newStatus (UnitStatus)
  - [ ] Fields: reason (String, optional), changedBy (UUID FK to User), changedAt (timestamp)
  - [ ] Create UnitHistoryRepository
  - [ ] Add method: findByUnitIdOrderByChangedAtDesc(UUID unitId)

- [ ] **Task 22: Backend - Property Service Layer** (AC: #1, #2, #8, #9, #11, #15)
  - [ ] Create backend/src/main/java/com/ultrabms/service/PropertyService.java
  - [ ] Implement createProperty(CreatePropertyRequest dto): validates manager has PROPERTY_MANAGER role
  - [ ] Implement findAll(PropertySearchParams params) with @Cacheable("properties") annotation
  - [ ] Calculate occupancyRate in response DTO: count occupied units / totalUnitsCount * 100
  - [ ] Implement findById(UUID id): returns property with manager details, image list
  - [ ] Implement updateProperty(UUID id, UpdatePropertyRequest dto) with @CacheEvict
  - [ ] Implement delete(UUID id): soft delete (set active=false), validate no occupied units
  - [ ] Implement uploadImage(UUID propertyId, MultipartFile file): validate JPG/PNG, max 5MB, max 5 total images
  - [ ] Store images in /uploads/properties/{propertyId}/images/ directory
  - [ ] Implement deleteImage(UUID propertyId, UUID imageId)
  - [ ] Implement assignManager(UUID propertyId, UUID managerId): validate manager role

- [ ] **Task 23: Backend - Unit Service Layer** (AC: #3, #4, #6, #7, #11)
  - [ ] Create backend/src/main/java/com/ultrabms/service/UnitService.java
  - [ ] Implement createUnit(UUID propertyId, CreateUnitRequest dto): validate unitNumber unique
  - [ ] Implement findByProperty(UUID propertyId, UnitSearchParams params): support filters
  - [ ] Implement findById(UUID id): return unit with property, tenant (if occupied), history
  - [ ] Implement updateUnit(UUID id, UpdateUnitRequest dto)
  - [ ] Implement updateStatus(UUID id, UnitStatus newStatus, String reason): validate transitions
  - [ ] Create UnitHistory record on status change (use @Transactional)
  - [ ] Implement bulkUpdateStatus(List<UUID> unitIds, UnitStatus newStatus, String reason)
  - [ ] Validate all units exist, perform updates in transaction, return success/failure details
  - [ ] Implement delete(UUID id): soft delete, validate unit not OCCUPIED
  - [ ] Implement bulkCreateUnits(UUID propertyId, BulkCreateRequest dto): validate count, create in transaction

- [ ] **Task 24: Backend - Property Controller** (AC: #1, #2, #8, #9, #10, #11)
  - [ ] Create backend/src/main/java/com/ultrabms/controller/PropertyController.java
  - [ ] POST /api/v1/properties: create property, validate with @Valid, return 201 Created
  - [ ] GET /api/v1/properties: list with pagination, search, filters (type, managerId, occupancyMin/Max)
  - [ ] GET /api/v1/properties/{id}: get property details
  - [ ] PUT /api/v1/properties/{id}: update property, return 200 OK
  - [ ] DELETE /api/v1/properties/{id}: soft delete, return 204 No Content
  - [ ] POST /api/v1/properties/{id}/images: upload image, validate file, return 201 Created
  - [ ] DELETE /api/v1/properties/{id}/images/{imageId}: delete image, return 204
  - [ ] PATCH /api/v1/properties/{id}/manager: reassign manager, validate role, return 200 OK
  - [ ] Add @PreAuthorize("hasRole('PROPERTY_MANAGER')") to create, update, delete endpoints

- [ ] **Task 25: Backend - Unit Controller** (AC: #3, #4, #6, #7, #11)
  - [ ] Create backend/src/main/java/com/ultrabms/controller/UnitController.java
  - [ ] POST /api/v1/properties/{id}/units: create single unit, validate, return 201 Created
  - [ ] POST /api/v1/properties/{id}/units/bulk: bulk create units, return 201 with BulkCreateResult
  - [ ] GET /api/v1/properties/{id}/units: list units for property with filters
  - [ ] GET /api/v1/units/{id}: get unit details with tenant and history
  - [ ] PUT /api/v1/units/{id}: update unit, return 200 OK
  - [ ] PATCH /api/v1/units/{id}/status: update unit status, validate transition, return 200 OK
  - [ ] PATCH /api/v1/units/bulk-status: bulk status update, return BulkUpdateResult
  - [ ] DELETE /api/v1/units/{id}: soft delete, validate not occupied, return 204 No Content
  - [ ] Add @PreAuthorize("hasRole('PROPERTY_MANAGER')") to all endpoints

- [ ] **Task 26: Backend - Ehcache Configuration** (AC: #15)
  - [ ] Add Ehcache dependency to pom.xml: spring-boot-starter-cache, ehcache
  - [ ] Create backend/src/main/resources/ehcache.xml
  - [ ] Define cache "properties" with maxEntriesLocalHeap=1000, timeToLiveSeconds=7200 (2 hours)
  - [ ] Configure in application.properties: spring.cache.type=ehcache, spring.cache.ehcache.config=classpath:ehcache.xml
  - [ ] Add @EnableCaching to main Application class
  - [ ] Verify @Cacheable on PropertyService.findAll() method
  - [ ] Verify @CacheEvict on create, update, delete methods

- [ ] **Task 27: Backend - File Upload Service** (AC: #2)
  - [ ] Create backend/src/main/java/com/ultrabms/service/FileStorageService.java
  - [ ] Implement storeFile(MultipartFile file, String directory): validates file type and size
  - [ ] Store files in /uploads/properties/{propertyId}/images/ with UUID filename
  - [ ] Implement deleteFile(String filePath): delete file from filesystem
  - [ ] Validate file types: check MIME type is image/jpeg or image/png
  - [ ] Validate file size: max 5MB (5 * 1024 * 1024 bytes)
  - [ ] Handle file not found exceptions

- [ ] **Task 28: Responsive Design and Accessibility** (AC: #16)
  - [ ] Test all pages on mobile (375px), tablet (768px), desktop (1920px) viewports
  - [ ] Verify unit grid shows 1 column on mobile, 2 on tablet, 3-4 on desktop
  - [ ] Verify all touch targets ≥ 44×44px on mobile
  - [ ] Test keyboard navigation: Tab through all forms, Enter to submit
  - [ ] Add ARIA labels: aria-label="Search properties", aria-label="Filter by type"
  - [ ] Verify color-coded status badges include text labels (not color-only)
  - [ ] Test with screen reader (VoiceOver/NVDA) for basic navigation
  - [ ] Ensure dark theme support works (toggle theme in app)

- [ ] **Task 29: Testing - E2E Tests** (AC: #18)
  - [ ] Run scripts/check-services.sh to verify backend (localhost:8080) and frontend (localhost:3000) are running
  - [ ] Create tests/e2e/properties.spec.ts with Playwright
  - [ ] Test: Create property with all fields → verify appears in list
  - [ ] Test: Upload 3 images to property → verify gallery shows images → delete 1 image
  - [ ] Test: Search properties by name → verify filtered results
  - [ ] Test: Filter by property type RESIDENTIAL → verify only residential shown
  - [ ] Test: Sort properties by occupancy % descending → verify order
  - [ ] Test: Add single unit to property → verify unit appears in grid
  - [ ] Test: Bulk create 10 units with sequential pattern → verify all created
  - [ ] Test: Toggle unit view Grid ↔ List → verify both views work
  - [ ] Test: Filter units by status AVAILABLE → verify filtered
  - [ ] Test: Change unit status AVAILABLE → RESERVED → verify status updated
  - [ ] Test: Select 5 units, bulk update status to UNDER_MAINTENANCE → verify all updated
  - [ ] Test: Verify occupancy rate calculation: create 10 units, set 7 to OCCUPIED → verify 70%
  - [ ] Test: Delete unit with status AVAILABLE → verify success
  - [ ] Test: Attempt delete unit with status OCCUPIED → verify error "Cannot delete occupied unit"
  - [ ] Test: Delete property with 0 occupied units → verify success
  - [ ] Test: Attempt delete property with occupied units → verify error blocked
  - [ ] Verify all data-testid attributes exist per Epic 2 retrospective requirement (AI-2-1)
  - [ ] Generate HTML test report with screenshots on failures

- [ ] **Task 30: Testing - Unit Tests** (AC: #18)
  - [ ] Write tests for lib/validations/properties.ts: test createPropertySchema validation rules
  - [ ] Write tests for lib/validations/units.ts: test createUnitSchema, bulkCreateUnitsSchema
  - [ ] Write tests for services/properties.service.ts: mock Axios responses, test all methods
  - [ ] Write tests for services/units.service.ts: mock API calls, test createUnit, bulkCreateUnits
  - [ ] Backend: test PropertyService occupancy calculation logic
  - [ ] Backend: test UnitService status transition validation (valid and invalid transitions)
  - [ ] Backend: test bulkCreateUnits logic with various patterns (sequential, floor-based)
  - [ ] Run tests: npm test (frontend), mvn test (backend)

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From docs/architecture.md:**
- API follows RESTful conventions: POST for create, GET for read, PUT for full update, PATCH for partial update, DELETE for soft delete
- All responses use standard format: `{ success: boolean, data?: any, error?: ErrorDetails }`
- Pagination uses query params: `page`, `size`, `sort`, `direction`
- File uploads use `multipart/form-data` with `MultipartFile` on backend
- Soft delete pattern: set `active=false` instead of removing records
- Use `@PreAuthorize` for role-based access control

**From Epic 2 patterns:**
- TypeScript types in `types/` folder with comprehensive interfaces
- Zod schemas in `lib/validations/` with clear error messages
- API services in `services/` using Axios instance from `lib/api.ts`
- React Hook Form + Zod for all forms
- shadcn/ui components for consistent design
- data-testid attributes on ALL interactive elements (Epic 2 retrospective AI-2-1)

**Caching Strategy (AC: #15):**
- Backend uses Ehcache for property list (TTL 2 hours)
- Cache key includes search/filter parameters
- Cache invalidated on create, update, delete operations
- Unit list NOT cached (frequent changes with tenant assignments)

**File Storage:**
- Property images stored in `/uploads/properties/{propertyId}/images/`
- Files saved with UUID filename to prevent collisions
- Original filename preserved in database for download
- Max 5 images per property, max 5MB each

**Occupancy Calculation:**
- Real-time calculation: `(count of OCCUPIED units) / totalUnitsCount * 100`
- Color coding: green ≥90%, yellow 70-89%, red <70%
- Displayed as badge with percentage and progress bar

### Source Tree Components to Touch

**Frontend:**
```
frontend/
├── src/
│   ├── types/
│   │   ├── properties.ts (new)
│   │   ├── units.ts (new)
│   │   └── index.ts (modify - export new types)
│   ├── lib/
│   │   └── validations/
│   │       ├── properties.ts (new)
│   │       └── units.ts (new)
│   ├── services/
│   │   ├── properties.service.ts (new)
│   │   └── units.service.ts (new)
│   ├── app/(dashboard)/
│   │   └── properties/
│   │       ├── page.tsx (new - list)
│   │       ├── create/page.tsx (new - create form)
│   │       ├── [id]/
│   │       │   ├── page.tsx (new - detail)
│   │       │   └── edit/page.tsx (new - edit form)
│   │   └── units/
│   │       └── [id]/page.tsx (new - unit detail)
│   └── components/
│       └── properties/
│           ├── UnitFormModal.tsx (new)
│           ├── BulkUnitCreateModal.tsx (new)
│           ├── UnitGrid.tsx (new)
│           ├── UnitList.tsx (new)
│           ├── UnitStatusDialog.tsx (new)
│           └── BulkStatusUpdateDialog.tsx (new)
```

**Backend:**
```
backend/
├── src/main/java/com/ultrabms/
│   ├── entity/
│   │   ├── Property.java (new)
│   │   ├── PropertyImage.java (new)
│   │   ├── Unit.java (new)
│   │   └── UnitHistory.java (new)
│   ├── repository/
│   │   ├── PropertyRepository.java (new)
│   │   ├── PropertyImageRepository.java (new)
│   │   ├── UnitRepository.java (new)
│   │   └── UnitHistoryRepository.java (new)
│   ├── service/
│   │   ├── PropertyService.java (new)
│   │   ├── UnitService.java (new)
│   │   └── FileStorageService.java (new)
│   ├── controller/
│   │   ├── PropertyController.java (new)
│   │   └── UnitController.java (new)
│   └── dto/
│       ├── CreatePropertyRequest.java (new)
│       ├── PropertyResponse.java (new)
│       ├── CreateUnitRequest.java (new)
│       └── BulkCreateUnitsRequest.java (new)
└── src/main/resources/
    ├── ehcache.xml (new - cache configuration)
    └── application.properties (modify - add cache config)
```

### Testing Standards Summary

**Per Epic 2 Retrospective Requirements:**
1. **AI-2-1 (P0):** ALL interactive elements MUST have data-testid attributes
   - Convention: `{component}-{element}-{action}` (e.g., `form-property-create`, `btn-add-unit`, `table-properties`)
2. **AI-2-2 (P0):** Run `scripts/check-services.sh` BEFORE executing E2E tests
   - Validates backend running on localhost:8080
   - Validates frontend running on localhost:3000
3. **AI-2-7 (P1):** Minimum test coverage thresholds
   - Backend: 80% line coverage, 70% branch coverage
   - Frontend: 70% line coverage, 60% branch coverage
   - E2E: All critical user flows

**E2E Test Scenarios:**
- Create property with image upload (max 5 images validation)
- Add single unit and bulk create units (10 units)
- Unit grid/list view toggle with filters
- Change unit status and bulk status update
- Occupancy rate calculation verification
- Soft delete validation (occupied units block delete)
- Search and filter properties

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Follow existing patterns from Epic 2 (Story 2.5 frontend structure)
- Use `app/(dashboard)/` for authenticated pages
- Use `services/` for API client methods
- Use `types/` for TypeScript interfaces
- Use `lib/validations/` for Zod schemas
- Component structure matches existing dashboard components

**No Conflicts Detected:**
- Property and Unit entities referenced in Story 1.4 (completed)
- RBAC from Story 2.2 (completed) - `@PreAuthorize("hasRole('PROPERTY_MANAGER')")`
- User entity available for property manager assignment
- File upload patterns can reuse existing multipart handling
- Ehcache config is additive (no conflicts with existing cache setup)

### Learnings from Previous Story

**From Story 3.1 (Status: ready-for-dev, Frontend Phase 1 Complete)**

- **New Patterns Established**: API service layer pattern in `services/leads.service.ts` and `services/quotations.service.ts` - use Axios instance from `lib/api.ts`, include error handling with toast notifications
- **New Files Created**: Comprehensive TypeScript types (`types/leads.ts`, `types/quotations.ts`), Zod validation schemas (`lib/validations/leads.ts`, `lib/validations/quotations.ts`), service layers, and full UI pages (list, detail, create forms)
- **Dependencies Added**: `lodash@latest` for debounce functionality (use for search inputs with 300ms delay)
- **data-testid Convention**: ALL interactive elements now have data-testid following pattern `{component}-{element}-{action}` (e.g., `form-lead-create`, `btn-create-lead`, `input-lead-name`, `table-leads`) per Epic 2 retrospective AI-2-1 requirement
- **Form Patterns**: React Hook Form + Zod validation with inline error messages, success/error toast notifications, real-time calculations (quotation form calculates total as user types)
- **Responsive Design**: Single column on mobile (<640px), multi-column on desktop, 44×44px touch targets, dark theme support
- **Testing Setup**: E2E tests with Playwright require `scripts/check-services.sh` to verify servers running before test execution (Epic 2 AI-2-2)

**Reuse Opportunities for This Story:**
1. **lodash debounce**: Already installed, use for property search input (300ms delay)
2. **API service pattern**: Follow exact same structure as `leads.service.ts` for `properties.service.ts` and `units.service.ts`
3. **Zod validation patterns**: Reuse regex patterns and validation helpers from `lib/validations/leads.ts`
4. **Form structure**: Copy React Hook Form + Zod setup from lead/quotation forms
5. **Table components**: Similar structure to leads list and quotations list for property/unit tables
6. **data-testid naming**: Apply same convention established in Story 3.1
7. **Toast notifications**: Reuse success/error toast patterns from Story 3.1
8. **Responsive grid**: Unit grid can follow similar responsive patterns (1 col mobile, 3-4 cols desktop)

**Technical Debt from Story 3.1:**
- Backend implementation pending (Tasks 11-15): PDF generation, email sending, scheduled jobs, conversion workflow
- E2E tests not yet implemented (Task 17)
- No impact on this story - Story 3.2 is independent of Story 3.1 backend completion

**Files to Reference:**
- `lib/auth-api.ts` - API service pattern with Axios
- `types/leads.ts` - TypeScript interface structure
- `lib/validations/leads.ts` - Zod schema examples
- `app/(dashboard)/leads/page.tsx` - List page with filters, search, pagination
- `app/(dashboard)/quotations/create/page.tsx` - Complex form with real-time calculations

[Source: stories/3-1-lead-management-and-quotation-system.md#Dev-Agent-Record]

### References

- [Source: docs/epics/epic-3-tenant-management-portal.md#Story-3.2-Property-and-Unit-Management]
- [Source: docs/prd.md#3.3-Tenant-Management-Module]
- [Source: docs/architecture.md#API-Design-Patterns]
- [Source: docs/patterns/api-integration-layer-epic3.md] (if created from Story 3.1)
- [Source: docs/data-testid-conventions.md] (Epic 2 retrospective requirement)
- [Source: stories/3-1-lead-management-and-quotation-system.md#Completion-Notes] (patterns and dependencies)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Model name and version will be filled during implementation -->

### Debug Log References

<!-- Links to debug logs will be added during implementation -->

### Completion Notes List

<!-- Completion notes will be added after story implementation -->

### File List

<!-- List of files created/modified will be added after implementation -->
