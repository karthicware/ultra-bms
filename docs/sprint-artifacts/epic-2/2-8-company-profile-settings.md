# Story 2.8: Company Profile Settings

Status: ready-for-dev

## Story

As an Admin or Super Admin,
I want to manage company profile details,
So that official documents display accurate company information.

## Acceptance Criteria

1. **AC1 - Company Profile Page Access:** Settings > Company Profile page accessible to ADMIN and SUPER_ADMIN roles. Info banner displays: "This page is only accessible to users with the 'Admin' role."

2. **AC2 - Company Information Section:** Form includes:
   - Legal Company Name (required, text, max 255 chars)
   - Company Address (required, text, max 500 chars)
   - City (required, text, max 100 chars)
   - Country (required, dropdown with UAE as default)
   - TRN - Tax Registration Number (required, validated 15-digit UAE format: 100XXXXXXXXXXX)

3. **AC3 - Official Contact Information Section:** Form includes:
   - Phone Number (required, validated UAE format +971 X XXX XXXX)
   - Email Address (required, validated RFC 5322 email format)

4. **AC4 - Company Logo Section:** Form includes:
   - Current logo preview (square display)
   - "Upload Logo" button accepting PNG/JPG (max 2MB)
   - Recommendation text: "We recommend a square image (e.g., PNG or JPG)."
   - "Remove" link to delete existing logo

5. **AC5 - Save Functionality:** "Save Changes" button persists all company profile data. Success toast notification on save. Validation errors displayed inline for each field.

6. **AC6 - CompanyProfile Entity:** Database entity includes:
   - id (UUID, single record design)
   - legalCompanyName (VARCHAR 255, NOT NULL)
   - companyAddress (VARCHAR 500, NOT NULL)
   - city (VARCHAR 100, NOT NULL)
   - country (VARCHAR 100, NOT NULL, default: "United Arab Emirates")
   - trn (VARCHAR 15, NOT NULL, unique)
   - phoneNumber (VARCHAR 20, NOT NULL)
   - emailAddress (VARCHAR 255, NOT NULL)
   - logoFilePath (VARCHAR 500, nullable, S3 key)
   - updatedBy (UUID, foreign key to users)
   - updatedAt (timestamp)

7. **AC7 - Flyway Migration:** Migration V42__create_company_profile_table.sql creates company_profile table with all required columns and constraints.

8. **AC8 - GET API Endpoint:** GET /api/v1/company-profile returns company profile data. Returns 404 if profile not yet created. Generates presigned URL for logo if exists.

9. **AC9 - PUT API Endpoint:** PUT /api/v1/company-profile creates or updates company profile (upsert). Sets updatedBy to current user and updatedAt to current timestamp.

10. **AC10 - Logo Upload Endpoint:** POST /api/v1/company-profile/logo accepts multipart file upload. Validates file type (PNG/JPG) and size (max 2MB). Stores at `/uploads/company/logo.{ext}` in S3. Deletes old logo when new one uploaded.

11. **AC11 - Logo Delete Endpoint:** DELETE /api/v1/company-profile/logo removes logo from S3. Clears logoFilePath in company_profile record.

12. **AC12 - Validation Rules:**
    - TRN: 15 digits (UAE VAT format 100XXXXXXXXXXX)
    - Phone: +971 followed by 9 digits
    - Email: RFC 5322 compliant
    - Logo: Max 2MB, PNG/JPG only
    - All text fields: Trim whitespace, reject empty strings

13. **AC13 - Single Record Constraint:** Only one company profile record allowed. PUT performs upsert (create if not exists, update if exists). Frontend shows "Set Up" state if no profile exists.

14. **AC14 - RBAC Restrictions:**
    - ADMIN/SUPER_ADMIN: Full create/update access
    - FINANCE_MANAGER, PROPERTY_MANAGER: Read-only access (for document generation)
    - Other roles: No access (403 Forbidden)

15. **AC15 - Ehcache Integration:** Company profile cached for frequent reads during document generation. Cache invalidated on profile update.

16. **AC16 - Integration Points Documented:**
    - PdfGenerationService: Logo and company details in invoice/receipt headers
    - PDC Management: Company name as "Holder" field
    - Email templates: Company name in footer signature
    - Official documents: Company address included

17. **AC17 - Frontend Form Validation:** Zod schemas validate all fields client-side before submission. Real-time validation feedback as user types.

18. **AC18 - Unit Tests (Backend):** Tests for CompanyProfileService (create, update, get, logo upload/delete). Tests verify RBAC restrictions.

19. **AC19 - Unit Tests (Frontend):** Tests for company profile form component. Tests for validation schemas.

20. **AC20 - Build Verification:** Backend (mvn compile) and frontend (npm run build) complete with zero errors.

## Tasks / Subtasks

- [ ] **Task 1: Create Backend Entity and Migration** (AC: #6, #7)
  - [ ] Create CompanyProfile entity in com.ultrabms.entity
  - [ ] Add JPA annotations and field validations
  - [ ] Create Flyway migration V42__create_company_profile_table.sql
  - [ ] Create CompanyProfileRepository extending JpaRepository

- [ ] **Task 2: Create Backend DTOs** (AC: #8, #9)
  - [ ] Create CompanyProfileRequest DTO with @NotBlank/@Size validations
  - [ ] Create CompanyProfileResponse DTO (includes presigned logo URL)
  - [ ] Create CompanyProfileLogoResponse DTO for logo operations

- [ ] **Task 3: Create CompanyProfileService** (AC: #8, #9, #10, #11, #15)
  - [ ] Create service interface and implementation
  - [ ] Implement getCompanyProfile() with Optional return
  - [ ] Implement saveCompanyProfile() with upsert logic
  - [ ] Implement uploadLogo() using FileStorageService
  - [ ] Implement deleteLogo() with S3 cleanup
  - [ ] Add @Cacheable and @CacheEvict for Ehcache integration

- [ ] **Task 4: Create CompanyProfileController** (AC: #8, #9, #10, #11, #14)
  - [ ] Create controller with @RequestMapping("/api/v1/company-profile")
  - [ ] GET / endpoint with @PreAuthorize for read access
  - [ ] PUT / endpoint with @PreAuthorize for admin write access
  - [ ] POST /logo endpoint for multipart upload
  - [ ] DELETE /logo endpoint for logo removal
  - [ ] Implement RBAC: admins = write, finance/pm = read, others = 403

- [ ] **Task 5: Add Validation Utilities** (AC: #12)
  - [ ] Create TRN validator (15 digits, starts with 100)
  - [ ] Create UAE phone validator (+971 format)
  - [ ] Add validation annotations to DTOs

- [ ] **Task 6: Create Frontend Types and Validation** (AC: #17)
  - [ ] Create types/company-profile.ts with TypeScript interfaces
  - [ ] Create lib/validations/company-profile.ts with Zod schemas
  - [ ] Add TRN regex validation (^100\d{12}$)
  - [ ] Add UAE phone regex validation (^\+971\d{9}$)
  - [ ] Add file size/type validation helpers

- [ ] **Task 7: Create Frontend Service** (AC: #8, #9, #10, #11)
  - [ ] Create services/company-profile.service.ts
  - [ ] Implement getCompanyProfile() to fetch from API
  - [ ] Implement saveCompanyProfile() for upsert
  - [ ] Implement uploadLogo() with FormData
  - [ ] Implement deleteLogo()

- [ ] **Task 8: Create Company Profile Page** (AC: #1, #2, #3, #4, #5)
  - [ ] Create app/(dashboard)/settings/company-profile/page.tsx
  - [ ] Add info banner for admin-only access
  - [ ] Build Company Information section with form fields
  - [ ] Build Official Contact section with phone/email fields
  - [ ] Build Logo section with preview, upload, and remove

- [ ] **Task 9: Implement Logo Upload Component** (AC: #4, #10)
  - [ ] Create LogoUpload component with drag-drop support
  - [ ] Add file type and size validation (PNG/JPG, 2MB)
  - [ ] Show upload progress indicator
  - [ ] Display current logo preview with presigned URL
  - [ ] Add "Remove" action with confirmation

- [ ] **Task 10: Add Country Dropdown** (AC: #2)
  - [ ] Create countries.ts data file with country list
  - [ ] Default to "United Arab Emirates" in form
  - [ ] Use shadcn/ui Select component

- [ ] **Task 11: Update Settings Navigation** (AC: #1)
  - [ ] Add "Company Profile" link in Settings page
  - [ ] Use Building2 icon for menu item
  - [ ] Position after Appearance in settings menu

- [ ] **Task 12: Backend Unit Tests** (AC: #18)
  - [ ] Create CompanyProfileServiceTest with CRUD tests
  - [ ] Test logo upload and delete operations
  - [ ] Test RBAC restrictions (admin vs non-admin)
  - [ ] Test upsert behavior (create and update paths)

- [ ] **Task 13: Frontend Unit Tests** (AC: #19)
  - [ ] Test company profile form rendering
  - [ ] Test validation schema behavior
  - [ ] Test logo upload component states

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

### Architecture Alignment

- Uses existing FileStorageService from Story 1.6 (S3 integration)
- Follows established patterns: Entity, Repository, Service, Controller, DTOs
- Single-record design (not multi-tenant) - only one company profile allowed
- Ehcache integration for frequently-read company profile data
- S3 logo storage following existing document upload patterns

### Key Design Decisions

1. **Single Record Design:** Only one company profile exists. PUT performs upsert.
2. **S3 Logo Storage:** Use existing FileStorageService at `/uploads/company/logo.{ext}`
3. **Presigned URLs:** Logo fetched via presigned URL for security
4. **RBAC Tiered Access:** Admin=write, Finance/PM=read-only, others=no access
5. **Ehcache:** Cache profile for document generation performance

### Dependencies

- Story 1.6 (S3 Integration) - COMPLETED - provides FileStorageService
- Story 2.6 (Admin User Management) - COMPLETED - Settings section in sidebar
- Story 2.7 (Theme Settings) - COMPLETED - Appearance settings pattern

### Database Changes

```sql
-- Migration: V42__create_company_profile_table.sql
CREATE TABLE company_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_company_name VARCHAR(255) NOT NULL,
    company_address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United Arab Emirates',
    trn VARCHAR(15) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    logo_file_path VARCHAR(500),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure single record with check constraint or application logic
CREATE UNIQUE INDEX idx_company_profile_singleton ON company_profile ((TRUE));
```

### API Endpoints Summary

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/company-profile | ADMIN, SUPER_ADMIN, FINANCE_MANAGER, PROPERTY_MANAGER | Get company profile |
| PUT | /api/v1/company-profile | ADMIN, SUPER_ADMIN | Create or update profile |
| POST | /api/v1/company-profile/logo | ADMIN, SUPER_ADMIN | Upload company logo |
| DELETE | /api/v1/company-profile/logo | ADMIN, SUPER_ADMIN | Remove company logo |

### Validation Patterns

```typescript
// TRN validation (15 digits, starts with 100)
const trnRegex = /^100\d{12}$/;

// UAE phone validation (+971 followed by 9 digits)
const uaePhoneRegex = /^\+971\d{9}$/;

// Logo file validation
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
```

### Frontend Component Structure

```
app/(dashboard)/settings/
  └── company-profile/
      └── page.tsx          # Company profile settings page

components/
  └── company/
      └── LogoUpload.tsx    # Logo upload/preview component

types/
  └── company-profile.ts    # TypeScript interfaces

lib/validations/
  └── company-profile.ts    # Zod validation schemas

services/
  └── company-profile.service.ts  # API service
```

### Learnings from Previous Story

**From Story 2-7-admin-theme-settings-and-system-theme-support (Status: ready-for-review)**

- **Settings Pattern Established**: Settings pages under app/(dashboard)/settings/ with dedicated subdirectories
- **Service Layer Pattern**: services/settings.service.ts pattern for API calls
- **Types/Validation Split**: Separate types/settings.ts and lib/validations/settings.ts files
- **ThemeProvider Wrapper**: Existing provider setup in app/providers.tsx
- **Tailwind v4 Syntax**: Using @custom-variant for dark mode, not darkMode config
- **Backend Pattern**: SettingsController, SettingsService structure to follow
- **Flyway Versioning**: V41 was last migration, use V42 for this story

[Source: docs/sprint-artifacts/epic-2/2-7-admin-theme-settings-and-system-theme-support.md#Dev-Agent-Record]

### Integration Notes for Dependent Stories

- **Story 6.3 (PDC Management)**: Will use company profile for PDC holder field
- **Story 6.1 (Invoicing)**: PdfGenerationService should fetch company profile for headers
- **Email Templates**: Company name for footer signatures

### References

- [Source: docs/epics/epic-2-authentication-user-management.md#Story-2.8]
- [Source: docs/architecture.md#S3-Integration]
- [Source: docs/sprint-artifacts/epic-1/1-6-aws-s3-file-storage-integration.md]
- Reference design: docs/archive/stitch_building_maintenance_software/settings_page_2/

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-2/2-8-company-profile-settings.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-28 | Story drafted via *create-story workflow | SM (Bob) |
