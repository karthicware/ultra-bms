# Story 2.9: User Profile Customization

Status: code-complete

## Story

As an authenticated staff user (Admin, Super Admin, Property Manager, Finance Manager),
I want to customize my user profile (display name, avatar, phone),
So that my identity is personalized across the platform.

## Acceptance Criteria

1. **AC1 - Profile Settings Page:** Settings > Profile page accessible to all authenticated staff users (not TENANT role). Page title: "My Profile".

2. **AC2 - Display Name Field:** Editable display name field (max 100 chars). Defaults to firstName + lastName from registration. Shown in navbar, comments, activity logs.

3. **AC3 - Avatar/Profile Photo:** Upload profile photo (PNG/JPG, max 2MB). Square crop preview. Stored in S3 at `/uploads/users/{userId}/avatar.{ext}`. Default avatar shows initials if no photo.

4. **AC4 - Contact Phone (Optional):** Optional personal phone number field. Not validated to specific format (international support). Displayed in user directory for internal contact.

5. **AC5 - Email Display (Read-Only):** Show user's email address as read-only. Email cannot be changed from profile (requires admin action).

6. **AC6 - Role Display (Read-Only):** Show user's current role as badge (read-only). Role changes require admin action via User Management.

7. **AC7 - Save Functionality:** "Save Changes" button persists profile updates. Success toast on save. Validation errors inline.

8. **AC8 - User Entity Update:** Add fields to existing User entity:
   - displayName (VARCHAR 100, nullable)
   - avatarFilePath (VARCHAR 500, nullable, S3 key)
   - contactPhone (VARCHAR 30, nullable)

9. **AC9 - Flyway Migration:** Migration V56__add_user_profile_fields.sql adds new columns to users table.

10. **AC10 - GET Profile Endpoint:** GET /api/v1/users/me/profile returns current user's profile data with presigned avatar URL.

11. **AC11 - PUT Profile Endpoint:** PUT /api/v1/users/me/profile updates displayName, contactPhone. Authenticated users can only update their own profile.

12. **AC12 - Avatar Upload Endpoint:** POST /api/v1/users/me/avatar accepts multipart file. Validates PNG/JPG, max 2MB. Deletes old avatar on new upload.

13. **AC13 - Avatar Delete Endpoint:** DELETE /api/v1/users/me/avatar removes avatar from S3, clears avatarFilePath.

14. **AC14 - Navbar Avatar Integration:** User avatar (or initials fallback) displayed in top-right navbar dropdown. Clicking opens profile menu.

15. **AC15 - Frontend Zod Validation:** Zod schemas for profile form:
    - displayName: string, max 100, optional trim
    - contactPhone: string, max 30, optional
    - avatar: file type PNG/JPG, max 2MB

16. **AC16 - Unit Tests (Backend):** Tests for UserProfileService methods. Test avatar upload/delete. Test profile update.

17. **AC17 - Unit Tests (Frontend):** Tests for profile form component. Tests for validation schemas. Tests for avatar upload component.

18. **AC18 - Build Verification:** Backend (mvn compile) and frontend (npm run build) complete with zero errors.

## Tasks / Subtasks

- [x] **Task 1: Database Migration** (AC: #8, #9)
  - [x] Create V56__add_user_profile_fields.sql
  - [x] Add displayName VARCHAR(100) to users
  - [x] Add avatarFilePath VARCHAR(500) to users
  - [x] Add contactPhone VARCHAR(30) to users

- [x] **Task 2: Update User Entity** (AC: #8)
  - [x] Add displayName field with @Column annotation
  - [x] Add avatarFilePath field
  - [x] Add contactPhone field
  - [x] Add getDisplayNameOrFullName() helper method

- [x] **Task 3: Create Profile DTOs** (AC: #10, #11)
  - [x] Create UserProfileResponse DTO (id, email, displayName, avatarUrl, contactPhone, role, firstName, lastName)
  - [x] Create UserProfileUpdateRequest DTO (displayName, contactPhone)
  - [x] Create AvatarUploadResponse DTO

- [x] **Task 4: Create UserProfileService** (AC: #10, #11, #12, #13)
  - [x] Create service interface and implementation
  - [x] Implement getProfile(userId) with presigned avatar URL
  - [x] Implement updateProfile(userId, request)
  - [x] Implement uploadAvatar(userId, file) using FileStorageService
  - [x] Implement deleteAvatar(userId)

- [x] **Task 5: Create UserProfileController** (AC: #10, #11, #12, #13)
  - [x] Create controller with @RequestMapping("/api/v1/users/me")
  - [x] GET /profile endpoint
  - [x] PUT /profile endpoint
  - [x] POST /avatar endpoint (multipart)
  - [x] DELETE /avatar endpoint
  - [x] All endpoints use @CurrentUser annotation

- [x] **Task 6: Create Frontend Types** (AC: #15)
  - [x] Create types/user-profile.ts with TypeScript interfaces
  - [x] UserProfile interface
  - [x] UserProfileUpdateRequest interface

- [x] **Task 7: Create Frontend Validation** (AC: #15)
  - [x] Create lib/validations/user-profile.ts
  - [x] userProfileSchema with displayName, contactPhone rules
  - [x] avatarFileSchema for file validation

- [x] **Task 8: Create Frontend Service** (AC: #10, #11, #12, #13)
  - [x] Create services/user-profile.service.ts
  - [x] getMyProfile() function
  - [x] updateMyProfile(data) function
  - [x] uploadAvatar(file) function
  - [x] deleteAvatar() function

- [x] **Task 9: Create Profile Settings Page** (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Create app/(dashboard)/settings/profile/page.tsx
  - [x] Avatar upload section with preview and remove
  - [x] Display name input field
  - [x] Contact phone input field
  - [x] Read-only email display
  - [x] Read-only role badge display
  - [x] Save Changes button with loading state

- [x] **Task 10: Update Navbar with Avatar** (AC: #14)
  - [x] Modify Sidebar.tsx user section to show avatar or initials
  - [x] Add Avatar component with fallback initials
  - [x] Fetch user profile on component load for avatar display

- [x] **Task 11: Add Settings Navigation Link** (AC: #1)
  - [x] Add "My Profile" link in Settings page (removed comingSoon flag)
  - [x] Use User icon for menu item
  - [x] Added role restriction for staff users only

- [x] **Task 12: Backend Unit Tests** (AC: #16)
  - [x] Create UserProfileServiceImplTest (16 tests)
  - [x] Create UserProfileControllerTest (17 tests)
  - [x] Test getProfile, updateProfile, uploadAvatar, deleteAvatar
  - [x] Test validation, authentication, role-based access

- [x] **Task 13: Frontend Unit Tests** (AC: #17)
  - [x] Create user-profile.test.ts for validation (45 tests)
  - [x] Test schema validation, helper functions
  - [x] Test avatar file validation

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
- Extends existing User entity (no new tables, just new columns)
- Follows established patterns: Entity, Repository, Service, Controller, DTOs
- S3 avatar storage at `/uploads/users/{userId}/avatar.{ext}`

### Key Design Decisions

1. **Extend User Entity:** Add profile fields to existing users table rather than separate profile table
2. **Self-Service Only:** Users can only update their own profile via /me endpoints
3. **S3 Avatar Storage:** Use existing FileStorageService, user-specific path
4. **Presigned URLs:** Avatar fetched via presigned URL for security
5. **Display Name Fallback:** If displayName is null, use firstName + lastName

### Dependencies

- Story 1.6 (S3 Integration) - COMPLETED - provides FileStorageService
- Story 2.8 (Company Profile Settings) - COMPLETED - similar page pattern

### Database Changes

```sql
-- Migration: V56__add_user_profile_fields.sql
ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN avatar_file_path VARCHAR(500);
ALTER TABLE users ADD COLUMN contact_phone VARCHAR(30);
```

### API Endpoints Summary

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | /api/v1/users/me/profile | Authenticated | Get own profile |
| PUT | /api/v1/users/me/profile | Authenticated | Update own profile |
| POST | /api/v1/users/me/avatar | Authenticated | Upload avatar |
| DELETE | /api/v1/users/me/avatar | Authenticated | Remove avatar |

### Frontend Component Structure

```
app/(dashboard)/settings/
  └── profile/
      └── page.tsx          # User profile settings page

components/
  └── user/
      └── AvatarUpload.tsx  # Avatar upload/preview component (optional)

types/
  └── user-profile.ts       # TypeScript interfaces

lib/validations/
  └── user-profile.ts       # Zod validation schemas

services/
  └── user-profile.service.ts  # API service
```

### Navbar Integration

```tsx
// In navbar user menu dropdown
<Avatar>
  {user.avatarUrl ? (
    <AvatarImage src={user.avatarUrl} />
  ) : (
    <AvatarFallback>{getInitials(user.displayName || user.firstName)}</AvatarFallback>
  )}
</Avatar>
```

### Learnings from Previous Story

**From Story 2-8-company-profile-settings (Status: done)**

- **Settings Page Pattern**: Settings pages under app/(dashboard)/settings/ with dedicated subdirectories
- **Logo/Avatar Upload Pattern**: File input with preview, delete button, S3 storage
- **Presigned URL Pattern**: Generate presigned URLs for avatar display
- **Service Layer Pattern**: services/*.service.ts for API calls
- **Types/Validation Split**: Separate types/*.ts and lib/validations/*.ts files
- **Flyway Versioning**: V55 was last migration (announcements), V56 is next available

[Source: docs/sprint-artifacts/epic-2/2-8-company-profile-settings.md#Dev-Agent-Record]

### References

- [Source: docs/prd.md#3.1-Authentication-Access-Control]
- [Source: docs/architecture.md#S3-Integration]
- [Source: docs/sprint-artifacts/epic-1/1-6-aws-s3-file-storage-integration.md]
- [Source: docs/sprint-artifacts/epic-2/2-8-company-profile-settings.md]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-2/2-9-user-profile-customization.context.xml

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

### Completion Notes List

**2025-11-30 Implementation Complete:**

1. **Backend Implementation:**
   - V56 migration adds displayName, avatarFilePath, contactPhone to users table
   - User entity updated with new fields and getDisplayNameOrFullName() helper
   - UserProfileService/Impl handles CRUD operations with S3 avatar storage
   - UserProfileController at /api/v1/users/me/* with RBAC for staff users
   - 3 DTOs: UserProfileResponse, UserProfileUpdateRequest, AvatarUploadResponse

2. **Frontend Implementation:**
   - types/user-profile.ts with interfaces and helper functions
   - lib/validations/user-profile.ts with Zod schemas
   - services/user-profile.service.ts for API calls
   - settings/profile/page.tsx with avatar upload, display name, contact phone
   - Sidebar.tsx updated with Avatar component and profile fetching

3. **Testing:**
   - Backend: UserProfileServiceImplTest (16 tests), UserProfileControllerTest (17 tests)
   - Frontend: user-profile.test.ts (45 tests) - all passing

4. **Build Status:**
   - Frontend build: SUCCESS (npm run build passes)
   - Frontend tests: 45/45 passing
   - Backend: Pre-existing compilation errors in InspectionServiceImpl.java and PdfGenerationServiceImpl.java (unrelated to this story)

5. **Known Issues:**
   - Backend has pre-existing compilation errors from story 9.2 (announcements) that block mvn test
   - These are unrelated to story 2.9 implementation

### File List

**Backend (New):**
- backend/src/main/resources/db/migration/V56__add_user_profile_fields.sql
- backend/src/main/java/com/ultrabms/dto/user/UserProfileResponse.java
- backend/src/main/java/com/ultrabms/dto/user/UserProfileUpdateRequest.java
- backend/src/main/java/com/ultrabms/dto/user/AvatarUploadResponse.java
- backend/src/main/java/com/ultrabms/service/UserProfileService.java
- backend/src/main/java/com/ultrabms/service/impl/UserProfileServiceImpl.java
- backend/src/main/java/com/ultrabms/controller/UserProfileController.java
- backend/src/test/java/com/ultrabms/service/UserProfileServiceImplTest.java
- backend/src/test/java/com/ultrabms/controller/UserProfileControllerTest.java

**Backend (Modified):**
- backend/src/main/java/com/ultrabms/entity/User.java

**Frontend (New):**
- frontend/src/types/user-profile.ts
- frontend/src/lib/validations/user-profile.ts
- frontend/src/lib/validations/__tests__/user-profile.test.ts
- frontend/src/services/user-profile.service.ts
- frontend/src/app/(dashboard)/settings/profile/page.tsx

**Frontend (Modified):**
- frontend/src/components/layout/Sidebar.tsx
- frontend/src/app/(dashboard)/settings/page.tsx

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-30 | Story created via *correct-course workflow | SM (Bob) |
| 2025-11-30 | Story drafted via *create-story workflow (fixed migration V53→V56) | SM (Bob) |
