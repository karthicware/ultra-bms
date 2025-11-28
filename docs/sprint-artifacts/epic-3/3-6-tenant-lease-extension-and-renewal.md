# Story 3.6: Tenant Lease Extension and Renewal

Status: drafted

## Story

As a property manager,
I want to extend or renew tenant leases,
so that I can manage lease continuity without re-onboarding tenants.

## Acceptance Criteria

1. **AC1 - Lease Extension Page Route and Structure:** Lease extension accessible at /tenants/{id}/lease/extend for users with PROPERTY_MANAGER or ADMIN role. Uses Next.js App Router within (dashboard) route group. Page is client component with React Hook Form state management. Form sections: Current Lease Summary (read-only), Extension Details (new dates, rent adjustments), Terms Update (optional). Implements responsive layout: single column on mobile, two-column on desktop. Skeleton loader shown while tenant data loads. Page requires authentication middleware with role check. Breadcrumb navigation: Dashboard > Tenants > {tenantName} > Extend Lease. [Source: docs/prd.md#3.3.2-tenant-lifecycle-management, docs/architecture.md#frontend-implementation-patterns]

2. **AC2 - Current Lease Summary Section:** Display read-only tenant and lease information: tenant name (full name from tenant record), current unit (property name, unit number, floor), current lease period (start date - end date, formatted "dd MMM yyyy"), days remaining (calculated countdown, badge: green if >60 days, yellow if 30-60, red if <30), current monthly rent (base rent + service charge), security deposit on file, payment schedule. Section styled as shadcn Card with header "Current Lease Details". All dates displayed in UAE timezone (GST). [Source: docs/epics/epic-3-tenant-management-portal.md#story-33, docs/architecture.md#date-and-time-handling]

3. **AC3 - Extension Details Section:** New lease end date (shadcn Calendar date picker, required, must be > current end date, default: current end date + 12 months). Auto-calculate and display new lease duration (months) based on original start date and new end date. Rent adjustment type (shadcn Radio Group: "No Change", "Percentage Increase", "Flat Amount Increase", "Custom Amount"). If percentage increase: input field (0-100%, decimal allowed, default 5%), display calculated new rent amount live. If flat amount increase: input field (AED, decimal, min 0), display calculated new rent amount live. If custom amount: input field for new base rent (AED, decimal, min > 0), display difference from current rent. New total monthly rent (auto-calculated: new base rent + service charge). Effective date for rent change (shadcn Calendar, default: new lease period start). [Source: docs/prd.md#3.3.2-tenant-lifecycle-management]

4. **AC4 - Terms Update Section (Optional):** Collapsible section (shadcn Collapsible) titled "Update Terms (Optional)". Renewal type dropdown (shadcn Select: "FIXED_TERM", "MONTH_TO_MONTH", "YEARLY", default: current type). Auto-renewal checkbox (shadcn Checkbox: "Enable automatic renewal at end of new term"). Special terms textarea (shadcn Textarea, max 2000 chars, placeholder: "Add any special terms or conditions for this renewal..."). Payment due date update (shadcn Select: day of month 1-28). Section collapsed by default, expand button shows edit icon. [Source: docs/prd.md#3.3.2-tenant-lifecycle-management]

5. **AC5 - Form Validation and Submission:** Zod validation schema leaseExtensionSchema with rules: newEndDate (required, must be date > currentEndDate), rentAdjustmentType (required enum), percentageIncrease (required if type=percentage, 0-100), flatIncrease (required if type=flat, >= 0), customRent (required if type=custom, > 0), renewalType (optional enum), autoRenewal (optional boolean), specialTerms (optional, max 2000 chars), paymentDueDate (optional, 1-28). Form uses React Hook Form with zodResolver. Submit button: "Extend Lease" (shadcn Button primary variant, loading spinner during submission, disabled if form invalid). Cancel button: "Cancel" (shadcn Button secondary variant, returns to tenant detail). On validation failure: focus first error field, display inline errors, show toast: "Please fix validation errors". [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]

6. **AC6 - Backend Lease Extension Processing:** On form submit: call POST /api/v1/tenants/{id}/lease/extend with body: {newEndDate, rentAdjustmentType, adjustmentValue, renewalType, autoRenewal, specialTerms, paymentDueDate}. Backend processing: validate tenant exists and has ACTIVE status, validate newEndDate > current leaseEndDate, calculate new rent based on adjustment type, create LeaseExtension record: {id (UUID), tenantId (FK), previousEndDate, newEndDate, previousRent, newRent, adjustmentType, adjustmentValue, renewalType, autoRenewal, specialTerms, extendedAt (timestamp), extendedBy (userId)}, update Tenant entity: leaseEndDate = newEndDate, baseRent = newRent (if changed), leaseType = renewalType (if provided), autoRenewal flag. Update tenant status: if was EXPIRING_SOON, change to ACTIVE. Log activity: "Lease extended for {tenantName} - Unit {unitNumber} until {newEndDate}". Return response: {success: true, data: {tenantId, newEndDate, newRent, extensionId}}. [Source: docs/architecture.md#rest-api-conventions]

7. **AC7 - Lease Amendment Document Generation:** After successful extension: generate lease amendment PDF using existing PDF generation patterns. Amendment document includes: company header with logo, amendment reference number (format: LA-2025-0001), original lease reference, tenant information (name, unit, property), previous lease terms (dates, rent), new lease terms (dates, rent, changes highlighted), effective date, signature blocks (tenant, property manager), terms and conditions from specialTerms field. Store PDF in S3: /documents/lease-amendments/{tenantId}/{amendmentId}.pdf. Return presigned URL for download (1 hour expiry). Add document reference to tenant's document repository. [Source: docs/architecture.md#file-handling, docs/epics/epic-3-tenant-management-portal.md#story-33]

8. **AC8 - Post-Extension Notifications:** Send email to tenant (lease-extension-confirmation.html template): subject: "Your Lease Has Been Extended - {propertyName}", body includes: tenant name, property and unit details, previous and new lease end dates, rent changes (if any), link to download amendment document, contact information for questions. Send email to property manager (lease-extension-notification.html template): subject: "Lease Extended: {tenantName} - Unit {unitNumber}", body includes: tenant details, extension summary, new dates and rent, link to tenant profile. Create audit log entry: action: "LEASE_EXTENDED", userId: managerId, entityType: "TENANT", entityId: tenantId, details: {previousEndDate, newEndDate, previousRent, newRent}. All emails sent asynchronously using Spring @Async. [Source: docs/architecture.md#email-service]

9. **AC9 - Lease Expiration Monitoring and Alerts:** Scheduled job (LeaseExpirationJob) runs daily at 7 AM UAE time. Query tenants where: status = ACTIVE, leaseEndDate between today and today + 60 days. For each expiring tenant, check if notification already sent for this expiration period. Send notifications at thresholds: 60 days (first notice), 30 days (second notice), 14 days (final notice). Update tenant status to EXPIRING_SOON if leaseEndDate <= today + 60 days. Email template (lease-expiring-notice.html): subject varies by threshold ("Your Lease Expires in {days} Days"), body includes: tenant name, unit details, expiration date, renewal instructions, contact information. Log all notifications sent in audit_logs. Property manager receives consolidated daily report of expiring leases. [Source: docs/prd.md#3.3.2-tenant-lifecycle-management]

10. **AC10 - Tenant Renewal Request (Self-Service):** Tenant can request renewal from portal at /tenant/profile. "Request Lease Renewal" button shown if: lease expires within 90 days AND no pending renewal request exists. Button opens shadcn Dialog with: confirmation message, optional comments textarea (max 500 chars), preferred renewal term dropdown (12 months, 24 months, Other). On submit: call POST /api/v1/tenant/lease/renewal-request with {preferredTerm, comments}. Create RenewalRequest entity: {id (UUID), tenantId (FK), requestedAt, preferredTerm, comments, status: PENDING}. Notify property manager via email (renewal-request-notification.html). Show tenant confirmation: "Your renewal request has been submitted. Property management will contact you shortly." Display pending request status on tenant profile: "Renewal Request Pending (submitted {date})". [Source: docs/prd.md#3.3.2-tenant-lifecycle-management, docs/epics/epic-3-tenant-management-portal.md#story-34]

11. **AC11 - Renewal Requests Management (Property Manager):** Property manager dashboard shows renewal requests at /tenants/renewal-requests. Table with columns: Tenant Name (link), Unit, Lease Expires, Requested Term, Requested Date, Status, Actions. Filter by: status (PENDING, APPROVED, REJECTED), property, date range. Status badges: PENDING (yellow), APPROVED (green), REJECTED (red). Actions dropdown per request: "View Details" (opens Dialog with full request info), "Approve & Extend" (redirects to lease extension page with tenant pre-selected), "Reject" (opens rejection dialog with required reason), "Contact Tenant" (opens email compose). On reject: update status to REJECTED, send notification to tenant with rejection reason. Pending requests count shown in sidebar badge. [Source: docs/prd.md#3.3.2-tenant-lifecycle-management]

12. **AC12 - Lease Extension History:** Tenant detail page (/tenants/{id}) shows "Extension History" section. Table/list of all lease extensions for this tenant: extension date, previous end date → new end date, rent change (if any), extended by (manager name). Most recent extension highlighted. Click extension row to view amendment document (download PDF). Empty state: "No lease extensions recorded". API endpoint: GET /api/v1/tenants/{id}/lease/extensions returns array of LeaseExtension records sorted by extendedAt DESC. [Source: docs/architecture.md#component-pattern]

13. **AC13 - TypeScript Types and Validation Schemas:** Create types/lease.ts with interfaces: LeaseExtension {id, tenantId, previousEndDate, newEndDate, previousRent, newRent, adjustmentType, adjustmentValue, renewalType, autoRenewal, specialTerms, extendedAt, extendedBy}, LeaseExtensionRequest {newEndDate, rentAdjustmentType, adjustmentValue, renewalType?, autoRenewal?, specialTerms?, paymentDueDate?}, RenewalRequest {id, tenantId, requestedAt, preferredTerm, comments, status}. Define enums: RentAdjustmentType (NO_CHANGE, PERCENTAGE, FLAT, CUSTOM), RenewalRequestStatus (PENDING, APPROVED, REJECTED). Create lib/validations/lease.ts with leaseExtensionSchema, renewalRequestSchema using Zod. Create services/lease.service.ts with methods: extendLease(tenantId, data), getRenewalRequests(filters), submitRenewalRequest(data), approveRenewalRequest(id), rejectRenewalRequest(id, reason), getExtensionHistory(tenantId). [Source: docs/architecture.md#typescript-strict-mode]

14. **AC14 - Backend API Endpoints:** Implement REST endpoints: POST /api/v1/tenants/{id}/lease/extend (PROPERTY_MANAGER, ADMIN) - extends lease, returns extension details. GET /api/v1/tenants/{id}/lease/extensions (PROPERTY_MANAGER, ADMIN) - returns extension history. GET /api/v1/tenants/{id}/lease/renewal-offer (PROPERTY_MANAGER, ADMIN) - generates renewal offer details. POST /api/v1/tenant/lease/renewal-request (TENANT) - submits renewal request. GET /api/v1/tenants/renewal-requests (PROPERTY_MANAGER, ADMIN) - lists all renewal requests with filters. PATCH /api/v1/tenants/renewal-requests/{id}/approve (PROPERTY_MANAGER, ADMIN) - approves request. PATCH /api/v1/tenants/renewal-requests/{id}/reject (PROPERTY_MANAGER, ADMIN) - rejects with reason. GET /api/v1/tenants/{id}/lease/amendment/{extensionId}/pdf - generates/retrieves amendment PDF. All endpoints use proper authorization annotations. [Source: docs/architecture.md#rest-api-conventions]

15. **AC15 - Database Schema and Migrations:** Create Flyway migration V{next}_create_lease_extension_tables.sql. LeaseExtension table: id (UUID PK), tenant_id (FK to tenants), previous_end_date (DATE), new_end_date (DATE), previous_rent (DECIMAL), new_rent (DECIMAL), adjustment_type (VARCHAR), adjustment_value (DECIMAL), renewal_type (VARCHAR), auto_renewal (BOOLEAN), special_terms (TEXT), extended_at (TIMESTAMP), extended_by (UUID FK to users), created_at, updated_at. RenewalRequest table: id (UUID PK), tenant_id (FK to tenants), requested_at (TIMESTAMP), preferred_term (VARCHAR), comments (TEXT), status (VARCHAR), rejected_reason (TEXT), processed_at (TIMESTAMP), processed_by (UUID FK to users), created_at, updated_at. Add indexes on tenant_id, status, extended_at. Update Tenant entity: add autoRenewal (Boolean) field if not exists. [Source: docs/architecture.md#database-conventions]

16. **AC16 - Testing Requirements:** Backend: LeaseExtensionServiceTest with 15+ test cases covering extension validation, rent calculations, notification triggers, edge cases. RenewalRequestServiceTest with 10+ test cases covering request lifecycle. LeaseExpirationJobTest with 5+ test cases for scheduled notifications. Frontend: LeaseExtensionForm.test.tsx with 12+ test cases for form validation, submission, calculations. RenewalRequestDialog.test.tsx with 8+ test cases. All interactive elements have data-testid following convention: "form-lease-extension", "input-new-end-date", "radio-adjustment-type", "btn-extend-lease", "btn-request-renewal", "dialog-reject-renewal". Minimum coverage: Backend 80% line, Frontend 70% line. [Source: docs/architecture.md#testing-strategy]

17. **AC17 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

18. **AC18 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types, Enums, and Validation Schemas** (AC: #13)
  - [ ] Create types/lease.ts with LeaseExtension, LeaseExtensionRequest, RenewalRequest interfaces
  - [ ] Define enums: RentAdjustmentType, RenewalRequestStatus
  - [ ] Create lib/validations/lease.ts with leaseExtensionSchema and renewalRequestSchema
  - [ ] Create services/lease.service.ts with API methods
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Create Database Schema and Entities** (AC: #15)
  - [ ] Create Flyway migration for lease_extensions table
  - [ ] Create Flyway migration for renewal_requests table
  - [ ] Create LeaseExtension entity with all fields
  - [ ] Create RenewalRequest entity with all fields
  - [ ] Create LeaseExtensionRepository extending JpaRepository
  - [ ] Create RenewalRequestRepository extending JpaRepository
  - [ ] Add autoRenewal field to Tenant entity if not exists
  - [ ] Add indexes on tenant_id, status, extended_at

- [ ] **Task 3: Implement Lease Extension Service** (AC: #6, #7)
  - [ ] Create LeaseExtensionService with extendLease() method
  - [ ] Implement rent calculation logic for all adjustment types
  - [ ] Implement lease amendment PDF generation
  - [ ] Store amendment document in S3
  - [ ] Update Tenant entity with new lease details
  - [ ] Log activity using audit service
  - [ ] Write unit tests (15+ test cases)

- [ ] **Task 4: Implement Backend API Endpoints** (AC: #14)
  - [ ] Create LeaseExtensionController with @RestController("/api/v1/tenants")
  - [ ] Implement POST /{id}/lease/extend endpoint
  - [ ] Implement GET /{id}/lease/extensions endpoint
  - [ ] Implement GET /{id}/lease/renewal-offer endpoint
  - [ ] Implement GET /{id}/lease/amendment/{extensionId}/pdf endpoint
  - [ ] Add @PreAuthorize annotations for role-based access

- [ ] **Task 5: Implement Renewal Request Service** (AC: #10, #11)
  - [ ] Create RenewalRequestService with submit, approve, reject methods
  - [ ] Implement tenant renewal request submission flow
  - [ ] Implement property manager approval/rejection flow
  - [ ] Send notifications on status changes
  - [ ] Write unit tests (10+ test cases)

- [ ] **Task 6: Implement Renewal Request API Endpoints** (AC: #14)
  - [ ] Create RenewalRequestController
  - [ ] Implement POST /tenant/lease/renewal-request (tenant-facing)
  - [ ] Implement GET /tenants/renewal-requests (manager-facing)
  - [ ] Implement PATCH /tenants/renewal-requests/{id}/approve
  - [ ] Implement PATCH /tenants/renewal-requests/{id}/reject
  - [ ] Add proper authorization annotations

- [ ] **Task 7: Implement Lease Expiration Scheduled Job** (AC: #9)
  - [ ] Create LeaseExpirationJob with @Scheduled(cron = "0 0 7 * * ?", zone = "Asia/Dubai")
  - [ ] Query expiring tenants (60, 30, 14 day thresholds)
  - [ ] Send notification emails at each threshold
  - [ ] Update tenant status to EXPIRING_SOON when applicable
  - [ ] Track notifications sent to avoid duplicates
  - [ ] Write unit tests (5+ test cases)

- [ ] **Task 8: Create Email Templates** (AC: #8, #9)
  - [ ] Create lease-extension-confirmation.html template (tenant)
  - [ ] Create lease-extension-notification.html template (manager)
  - [ ] Create lease-expiring-notice.html template (60/30/14 day variants)
  - [ ] Create renewal-request-notification.html template
  - [ ] Create renewal-request-status.html template (approved/rejected)
  - [ ] Ensure mobile-responsive HTML styling

- [ ] **Task 9: Create Lease Extension Frontend Page** (AC: #1, #2, #3, #4, #5)
  - [ ] Create app/(dashboard)/tenants/[id]/lease/extend/page.tsx
  - [ ] Implement React Hook Form with leaseExtensionSchema validation
  - [ ] Create Current Lease Summary section (read-only card)
  - [ ] Create Extension Details section with date picker and rent adjustment
  - [ ] Implement live rent calculation based on adjustment type
  - [ ] Create Terms Update collapsible section
  - [ ] Add submit and cancel buttons with loading states
  - [ ] Add breadcrumb navigation
  - [ ] Add all data-testid attributes

- [ ] **Task 10: Implement Lease Extension Form Logic** (AC: #3, #5)
  - [ ] Implement date validation (newEndDate > currentEndDate)
  - [ ] Implement percentage increase calculation
  - [ ] Implement flat amount increase calculation
  - [ ] Implement custom amount with difference display
  - [ ] Create useExtendLease() mutation hook with React Query
  - [ ] Handle success: show toast, redirect to tenant detail
  - [ ] Handle error: show toast, preserve form data

- [ ] **Task 11: Create Tenant Renewal Request Feature** (AC: #10)
  - [ ] Add "Request Lease Renewal" button to tenant portal profile
  - [ ] Create RenewalRequestDialog component
  - [ ] Implement conditional display (expires within 90 days, no pending request)
  - [ ] Create useSubmitRenewalRequest() mutation hook
  - [ ] Display pending request status on profile
  - [ ] Write frontend tests (8+ test cases)

- [ ] **Task 12: Create Renewal Requests Management Page** (AC: #11)
  - [ ] Create app/(dashboard)/tenants/renewal-requests/page.tsx
  - [ ] Implement useRenewalRequests() hook with filters
  - [ ] Create table with all specified columns
  - [ ] Implement status badges and action dropdowns
  - [ ] Create approval redirect to extension page
  - [ ] Create rejection dialog with reason input
  - [ ] Add pending count badge to sidebar

- [ ] **Task 13: Create Lease Extension History Component** (AC: #12)
  - [ ] Add ExtensionHistory section to tenant detail page
  - [ ] Create useExtensionHistory() hook
  - [ ] Display table/list of extensions
  - [ ] Implement PDF download for amendments
  - [ ] Handle empty state

- [ ] **Task 14: Frontend Unit Tests** (AC: #16)
  - [ ] Create LeaseExtensionForm.test.tsx (12+ test cases)
  - [ ] Create RenewalRequestDialog.test.tsx (8+ test cases)
  - [ ] Create ExtensionHistory.test.tsx (5+ test cases)
  - [ ] Verify all data-testid attributes present
  - [ ] Achieve 70%+ line coverage

- [ ] **Task 15: Mandatory Test Execution and Build Verification** (AC: #17, #18)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests before proceeding
  - [ ] Execute backend build: `mvn compile` - Zero errors required
  - [ ] Execute frontend build: `npm run build` - Zero errors required
  - [ ] Execute frontend lint: `npm run lint` - Zero errors required
  - [ ] Document results in Completion Notes

## Dev Notes

### Architecture Patterns to Follow

1. **Form Validation:**
   - Use React Hook Form with Zod schema resolver (established in Story 3.5)
   - Inline error display below fields
   - Character counters for text fields

2. **API Integration:**
   - Use React Query for data fetching and mutations
   - Invalidate relevant cache keys on mutations
   - Handle loading and error states consistently

3. **Email Notifications:**
   - Follow EmailService patterns from Story 3.5
   - Use Spring @Async for non-blocking sends
   - Store templates in resources/templates/

4. **PDF Generation:**
   - Use existing PDF generation patterns from quotation system (Story 3.1)
   - Store documents in S3 with presigned URLs
   - Include company branding

5. **Scheduled Jobs:**
   - Follow Spring @Scheduled patterns
   - Use UAE timezone (Asia/Dubai)
   - Log job execution and results

### Project Structure Notes

- Frontend pages: `frontend/src/app/(dashboard)/tenants/[id]/lease/extend/`
- Frontend components: `frontend/src/components/lease/`
- Backend service: `backend/src/main/java/com/ultrabms/service/LeaseExtensionService.java`
- Backend controller: `backend/src/main/java/com/ultrabms/controller/LeaseExtensionController.java`
- Email templates: `backend/src/main/resources/templates/`
- Migrations: `backend/src/main/resources/db/migration/`

### Learnings from Previous Story

**From Story 3.5 (Status: done)**

- **Form Patterns:** React Hook Form + Zod schema validation works well, use zodResolver
- **Email Templates:** 6 email templates created for maintenance notifications - follow same patterns
- **Test Structure:** 38 passing frontend tests across 4 component suites - maintain similar coverage
- **Dependencies Added:** browser-image-compression@2.0.2, react-rating-stars-component@2.2.0 - already available
- **Status Badges:** StatusBadge logic duplicated - consider refactoring to shared component
- **Real-time Updates:** Polling every 30 seconds pattern established - use if needed for request status
- **Data-testid Convention:** All interactive elements have data-testid following {component}-{element}-{action}

[Source: docs/sprint-artifacts/epic-3/3-5-tenant-portal-maintenance-request-submission.md#Dev-Agent-Record]

### References

- [Source: docs/prd.md#3.3.2-tenant-lifecycle-management]
- [Source: docs/epics/epic-3-tenant-management-portal.md]
- [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]
- [Source: docs/architecture.md#email-service]
- [Source: docs/architecture.md#rest-api-conventions]
- [Source: docs/sprint-change-proposals/sprint-change-proposal-2025-11-28.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-28 | Story drafted via correct-course workflow | SM Agent (Bob) |
