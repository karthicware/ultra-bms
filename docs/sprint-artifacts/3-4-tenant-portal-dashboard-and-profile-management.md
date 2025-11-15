# Story 3.4: Tenant Portal - Dashboard and Profile Management

Status: drafted

## Story

As a tenant,
I want to access my portal dashboard and manage my profile,
So that I can view my lease details and update my information.

## Acceptance Criteria

1. **AC1 - Dashboard Route and Layout:** Tenant dashboard accessible at /tenant/dashboard for users with TENANT role. Uses Next.js App Router with (dashboard) route group. Dashboard page is server component that fetches initial data server-side for faster load. Layout includes: top navigation bar with property logo, user avatar menu (dropdown with Profile, Settings, Logout), main content area, bottom navigation on mobile (<768px) with icons for Dashboard, Requests, Payments, Profile. Implements responsive layout: single column on mobile, 2-column grid on tablet (768px-1024px), 3-column grid on desktop (>1024px). Skeleton loaders shown while data fetching. Page requires authentication middleware - redirect to /login if not authenticated. [Source: docs/epics/epic-3-tenant-management-portal.md#story-34-tenant-portal-dashboard-and-profile-management, docs/architecture.md#frontend-implementation-patterns]

2. **AC2 - Dashboard Welcome Section:** Display welcome message at top: "Welcome back, {firstName}!" with current date/time in GST timezone. Show current unit information card with: Property name and full address, Unit number with floor indicator (e.g., "Unit 204, Floor 2"), Bedroom/bathroom count with icons (e.g., "🛏️ 2 Bed, 🚿 2 Bath"), Lease start and end dates formatted as "dd MMM yyyy" (e.g., "13 Nov 2025"), Days remaining countdown calculated using differenceInDays(leaseEndDate, today) with visual indicator, Lease status badge: "ACTIVE" (green) if > 60 days remaining, "EXPIRING_SOON" (yellow) if ≤ 60 days remaining, "EXPIRED" (red) if past end date. Use shadcn Card component for unit info with CardHeader, CardTitle, CardContent. Fetch data via GET /api/v1/tenant/dashboard. [Source: docs/epics/epic-3-tenant-management-portal.md#dashboard-overview, docs/architecture.md#date-and-time-handling]

3. **AC3 - Quick Stats Cards:** Display 4 KPI cards in responsive grid (2×2 on mobile, 4×1 on desktop): (1) Outstanding Balance: total unpaid invoices sum in AED, formatted using formatCurrency helper, red text if > 0, green if 0, icon: 💰. (2) Next Payment Due: date and amount, formatted as "dd MMM yyyy - AED X,XXX.XX", orange if due within 7 days, icon: 📅. (3) Open Maintenance Requests: count of requests with status IN (SUBMITTED, IN_PROGRESS), clickable to navigate to /tenant/requests?filter=open, icon: 🔧. (4) Upcoming Amenity Bookings: count of future bookings, clickable to /tenant/amenities, icon: 🏊. Each card uses shadcn Card with hover effect, shows loading skeleton during data fetch. Data fetched from GET /api/v1/tenant/dashboard endpoint. Handle null/empty states gracefully: show 0 or "No upcoming payments". [Source: docs/epics/epic-3-tenant-management-portal.md#quick-stats-cards, docs/architecture.md#currency-formatting]

4. **AC4 - Quick Actions Section:** Display 4 prominent action buttons below stats: (1) "Submit Maintenance Request" → navigate to /tenant/requests/new, primary variant, icon: tools. (2) "Make Payment" → navigate to /tenant/payments/new, secondary variant, icon: credit-card. (3) "Book Amenity" → navigate to /tenant/amenities/book, secondary variant, icon: calendar. (4) "View Lease Agreement" → trigger PDF download via GET /api/v1/tenant/lease/download, outline variant, icon: file-text. Buttons use shadcn Button component with loading state. Arrange in 2×2 grid on mobile, 4×1 row on desktop. Each button has data-testid attribute: "btn-maintenance", "btn-payment", "btn-amenity", "btn-lease". Add tooltips on hover explaining each action. [Source: docs/epics/epic-3-tenant-management-portal.md#quick-actions]

5. **AC5 - Profile Route and Layout:** Profile page at /tenant/profile displays tenant information in organized sections. Uses shadcn Tabs component for section navigation on desktop: Personal, Lease, Parking, Documents, Settings. On mobile, use Accordion for collapsible sections. All sections are read-only except Account Settings and Document Upload. Display banner at top: "To update personal or lease information, please contact property management at {propertyManagerEmail} or {propertyManagerPhone}". Fetch profile data via GET /api/v1/tenant/profile returning complete Tenant entity with nested Lease, User, Documents. Implement optimistic UI updates for password change and document upload. [Source: docs/epics/epic-3-tenant-management-portal.md#profile-management-page, docs/architecture.md#component-pattern]

6. **AC6 - Personal Information Section (Read-Only):** Display personal details in two-column layout (single column on mobile): First name, Last name (display as "{firstName} {lastName}"), Email (display with envelope icon, copy button), Phone number (E.164 format with phone icon, click-to-call link), Date of birth (formatted as "dd MMM yyyy", show age in parentheses), National ID / Passport number (masked: show last 4 digits, full on click, e.g., "****-****-****-1234"), Emergency contact name and phone. All fields use shadcn Label + plain text (not Input), styled consistently. Add "Contact property management to update" note in muted text below section. [Source: docs/epics/epic-3-tenant-management-portal.md#personal-information-section-read-only]

7. **AC7 - Lease Information Section (Read-Only):** Display lease details in Card components: Property name and full address with map pin icon (optional: clickable to open Google Maps), Unit number, floor, bedroom/bathroom count, Lease type badge (FIXED_TERM, MONTH_TO_MONTH, YEARLY with color coding), Lease start and end dates with calendar icon, Lease duration (auto-calculated in months and days), Monthly rent breakdown table with 4 columns: Item, Amount (AED), bordered shadcn Table component: rows for Base Rent, Service Charge, Parking Fee (if > 0), Total Monthly Rent (bold, highlighted background). Security deposit amount displayed separately with info icon tooltip explaining refund terms. Payment schedule: frequency, due date (day of month), payment method. Download lease agreement button (shadcn Button outline variant) triggers GET /api/v1/tenant/lease/download, opens PDF in new tab or downloads based on browser. [Source: docs/epics/epic-3-tenant-management-portal.md#lease-information-section, docs/architecture.md#rest-api-conventions]

8. **AC8 - Parking Information Section (Read-Only):** If tenant has parking allocation (parkingSpots > 0), display: Number of allocated spots (count with car icon), Parking spot numbers (comma-separated list, e.g., "P-101, P-102"), Parking fee per spot (AED formatted), Total parking fee (spots × fee per spot, included in monthly rent), Mulkiya document section: if uploaded, show filename with download button (GET /api/v1/tenant/parking/mulkiya/download), if not uploaded, show "No Mulkiya document on file". If no parking allocated (parkingSpots = 0), display message: "No parking allocated. Contact property management to request parking." Use shadcn Card for parking info, shadcn Badge for spot numbers. [Source: docs/epics/epic-3-tenant-management-portal.md#parking-information-section, docs/epics/epic-3-tenant-management-portal.md#story-33-parking-allocation]

9. **AC9 - Account Settings Section (Editable):** Implement change password functionality: Form with 3 fields: Current Password (password input, required, validation: min 8 chars), New Password (password input, required, validation: min 12 chars, must include uppercase, lowercase, number, symbol), Confirm New Password (password input, required, validation: must match new password). Use Zod schema for validation: currentPassword (min 8), newPassword (min 12, regex for complexity), confirmPassword (refine to match newPassword). Form uses React Hook Form with shadcn Form components. Submit via POST /api/v1/tenant/account/change-password with body {currentPassword, newPassword}. Show success toast: "Password updated successfully. Please log in again with your new password." Redirect to /login after 3 seconds. Show validation errors inline below fields. Include PasswordStrengthMeter component (from Story 2.5) below new password field. Language preference setting: shadcn Select dropdown with options: English (default), Arabic (future). Save via PATCH /api/v1/tenant/preferences {language}. Note: "Notification preferences managed via email - all notifications sent to {email}". [Source: docs/epics/epic-3-tenant-management-portal.md#account-settings, docs/architecture.md#form-pattern-with-react-hook-form-zod]

10. **AC10 - Document Repository Section:** Display list of uploaded documents in shadcn Table: columns: Document Type (EMIRATES_ID, PASSPORT, VISA, SIGNED_LEASE, MULKIYA, OTHER with icons), File Name, File Size (formatted as KB/MB), Upload Date (formatted "dd MMM yyyy"). Action column with Download button (eye icon) triggers GET /api/v1/tenant/documents/{id}/download. Add new document upload section: drag-and-drop zone using react-dropzone, accepts PDF/JPG/PNG only, max 5MB per file, multiple files allowed, shows upload progress bar per file, POST /api/v1/tenant/documents with multipart/form-data, optional document type selector (shadcn Select), after upload success: refresh documents table, show toast "Document uploaded successfully". Empty state if no documents: "No documents uploaded yet. Use the upload section above to add documents." Implement optimistic UI: add to table immediately on upload start with loading spinner, remove on error. [Source: docs/epics/epic-3-tenant-management-portal.md#document-repository, docs/sprint-artifacts/3-3-tenant-onboarding-and-registration.md#ac7-document-upload-step]

11. **AC11 - API Endpoints (Backend):** Implement REST endpoints: GET /api/v1/tenant/dashboard returns {currentUnit: {propertyName, address, unitNumber, floor, bedrooms, bathrooms, leaseStartDate, leaseEndDate, daysRemaining, leaseStatus}, stats: {outstandingBalance, nextPaymentDue: {date, amount}, openRequestsCount, upcomingBookingsCount}, quickActions: [{name, url, icon}]}. GET /api/v1/tenant/profile returns {tenant: {id, firstName, lastName, email, phone, dateOfBirth, nationalId, emergencyContactName, emergencyContactPhone}, lease: {propertyName, address, unitNumber, leaseType, startDate, endDate, duration, baseRent, serviceCharge, parkingFee, totalMonthlyRent, securityDeposit, paymentFrequency, paymentDueDate, paymentMethod}, parking: {spots, spotNumbers, feePerSpot, totalFee, mulkiyaDocumentPath}, documents: [{id, type, fileName, fileSize, uploadedAt}]}. POST /api/v1/tenant/account/change-password {currentPassword, newPassword} validates current password using BCrypt, updates password hash, returns 200 or 400 with error. GET /api/v1/tenant/lease/download returns signed lease PDF (Content-Type: application/pdf, Content-Disposition: attachment). POST /api/v1/tenant/documents multipart/form-data creates TenantDocument entity, stores file in /uploads/tenants/{tenantId}/additional/. GET /api/v1/tenant/documents/{id}/download streams file with correct Content-Type. [Source: docs/epics/epic-3-tenant-management-portal.md#api-endpoints, docs/architecture.md#api-response-format]

12. **AC12 - Responsive Design and Mobile Optimization:** Dashboard and profile fully responsive: Mobile (<768px): single column layout, bottom navigation (fixed position, 64px height, 4 tabs with icons and labels), collapsible sections using Accordion, stack stats cards vertically, action buttons full width, hidden table columns (show essential only). Tablet (768px-1024px): 2-column grid for stats, side navigation, full table visible, modal forms instead of page navigation. Desktop (>1024px): 3-column grid for dashboard, side navigation with Tabs, full tables with all columns, inline forms. Touch targets ≥ 44×44px on mobile (buttons, links, interactive elements). Use Next.js Image component for property images (if added in future). Implement skeleton loaders for all data fetching: CardSkeleton, TableSkeleton, use shadcn Skeleton component. Test on viewport sizes: 320px (mobile), 768px (tablet), 1024px (desktop), 1440px (large desktop). [Source: docs/epics/epic-3-tenant-management-portal.md#responsive-design, docs/architecture.md#styling-conventions]

13. **AC13 - Data Fetching and Caching:** Use React Query (TanStack Query) for data fetching and caching: Dashboard data: useQuery with queryKey ['tenant', 'dashboard'], queryFn: () => apiClient.get('/api/v1/tenant/dashboard'), staleTime 5 minutes (300000ms), refetchOnWindowFocus false, show skeleton while loading. Profile data: useQuery with queryKey ['tenant', 'profile'], queryFn: () => apiClient.get('/api/v1/tenant/profile'), staleTime 10 minutes, cache indefinitely until logout. Implement mutation for password change: useMutation for POST /api/v1/tenant/account/change-password, onSuccess: invalidate queries, show toast, redirect. Implement mutation for document upload: useMutation, onSuccess: invalidate ['tenant', 'profile'], refetch documents list. Handle loading, error, and success states consistently across all queries. Create custom hooks: useTenantDashboard(), useTenantProfile(), useChangePassword(), useUploadDocument(). [Source: docs/architecture.md#api-client-pattern, docs/sprint-artifacts/2-5-frontend-authentication-components-and-protected-routes.md#dependencies-to-add]

14. **AC14 - TypeScript Types and Schemas:** Create types/tenant-portal.ts with interfaces: DashboardData {currentUnit: UnitInfo, stats: DashboardStats, quickActions: QuickAction[]}, UnitInfo {propertyName, address, unitNumber, floor, bedrooms, bathrooms, leaseStartDate, leaseEndDate, daysRemaining, leaseStatus}, DashboardStats {outstandingBalance, nextPaymentDue, openRequestsCount, upcomingBookingsCount}, TenantProfile {tenant: TenantPersonalInfo, lease: LeaseDetails, parking: ParkingInfo, documents: TenantDocument[]}, QuickAction {name, url, icon}. Create lib/validations/tenant-portal.ts with changePasswordSchema using Zod: currentPassword string min(8), newPassword string min(12) regex for complexity (uppercase, lowercase, digit, special char), confirmPassword refinement to match newPassword. Export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>. Create services/tenant-portal.service.ts with methods: getDashboardData(): Promise<DashboardData>, getTenantProfile(): Promise<TenantProfile>, changePassword(data: ChangePasswordFormData): Promise<void>, uploadDocument(file: File, type?: string): Promise<TenantDocument>, downloadDocument(id: string): Promise<Blob>. [Source: docs/architecture.md#typescript-strict-mode, docs/sprint-artifacts/2-5-frontend-authentication-components-and-protected-routes.md#typescript-types-and-zod-schemas]

15. **AC15 - Testing and Accessibility:** All interactive elements have data-testid attributes following convention {component}-{element}-{action}: "card-unit-info", "btn-maintenance", "btn-payment", "btn-download-lease", "input-current-password", "btn-change-password", "table-documents", "btn-upload-document". Implement keyboard navigation: Tab through all interactive elements, Enter to activate buttons/links, Escape to close modals/dialogs, Arrow keys for navigation in bottom nav (mobile). ARIA labels: role="navigation" on bottom nav, aria-label on icon-only buttons, aria-describedby for form field hints, aria-live="polite" for dynamic content updates (stats). Color contrast ratio ≥ 4.5:1 for text, support dark theme using shadcn dark mode. Focus indicators visible on all interactive elements. Success/error feedback via shadcn toast (screen reader accessible). Implement loading states with aria-busy="true" and aria-label="Loading dashboard data". [Source: docs/epics/epic-3-tenant-management-portal.md#responsive-design, docs/ux-design-specification.md#8.2-wcag-compliance]

## Component Mapping

### shadcn/ui Components to Use

**Layout Components:**
- card (dashboard stats, unit info, profile sections)
- tabs (profile section navigation on desktop)
- accordion (profile sections on mobile)
- separator (dividing sections)

**Data Display:**
- table (rent breakdown, document repository)
- badge (lease status, lease type)
- avatar (user profile menu)
- skeleton (loading states)

**Form Components:**
- form (password change form)
- input (password fields)
- label (form field labels)
- button (action buttons, submit, download)
- select (language preference, document type)

**Feedback Components:**
- toast/sonner (success/error notifications)
- dialog (confirmation dialogs)
- alert (informational banners)
- progress (document upload progress)

**Navigation:**
- Custom bottom navigation (no shadcn equivalent - build with shadcn Button)

### Installation Command

```bash
npx shadcn@latest add card tabs accordion separator table badge avatar skeleton form input label button select toast dialog alert progress
```

### Additional Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react-dropzone": "^14.2.3",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types and API Service** (AC: #14)
  - [ ] Create types/tenant-portal.ts with DashboardData, TenantProfile, UnitInfo interfaces
  - [ ] Create lib/validations/tenant-portal.ts with changePasswordSchema (Zod)
  - [ ] Create services/tenant-portal.service.ts with API methods
  - [ ] Export types from types/index.ts

- [ ] **Task 2: Implement Backend Dashboard API** (AC: #11)
  - [ ] Create TenantPortalController with @RestController("/api/v1/tenant")
  - [ ] Implement GET /dashboard endpoint: calculate days remaining, fetch invoices for outstanding balance, count open requests
  - [ ] Implement GET /profile endpoint: join Tenant → Lease → Unit → Property, include documents list
  - [ ] Add @PreAuthorize("hasRole('TENANT')") to all endpoints
  - [ ] Write unit tests for controller methods

- [ ] **Task 3: Implement Backend Profile Management APIs** (AC: #11)
  - [ ] Implement POST /account/change-password endpoint: validate current password with BCrypt, hash new password, update User entity
  - [ ] Implement GET /lease/download endpoint: read lease PDF from /uploads/leases/{tenantId}/, return as attachment
  - [ ] Implement POST /documents multipart upload: validate file type/size, save to /uploads/tenants/{tenantId}/additional/, create TenantDocument entity
  - [ ] Implement GET /documents/{id}/download: stream file with Content-Type based on extension
  - [ ] Write integration tests for all endpoints

- [ ] **Task 4: Create Dashboard Page Structure** (AC: #1, #2)
  - [ ] Create app/(dashboard)/tenant/dashboard/page.tsx as server component
  - [ ] Implement route protection middleware for /tenant/* routes
  - [ ] Create layout with top nav (logo, avatar menu) and bottom nav for mobile
  - [ ] Implement welcome section with current date in GST timezone using date-fns-tz
  - [ ] Add responsive grid layout: single column mobile, 2-col tablet, 3-col desktop
  - [ ] Create skeleton loaders for dashboard sections

- [ ] **Task 5: Implement Dashboard Unit Info and Stats** (AC: #2, #3)
  - [ ] Create components/tenant/UnitInfoCard.tsx: display property, unit, lease details with countdown timer
  - [ ] Implement lease status badge logic: ACTIVE (green), EXPIRING_SOON (yellow if ≤ 60 days), EXPIRED (red)
  - [ ] Create components/tenant/DashboardStatsGrid.tsx with 4 stat cards
  - [ ] Implement useTenantDashboard() custom hook with React Query
  - [ ] Format currency using formatCurrency helper (AED)
  - [ ] Make stat cards clickable where applicable (navigate to relevant pages)
  - [ ] Handle empty states gracefully (show 0 or "No upcoming")

- [ ] **Task 6: Implement Quick Actions Section** (AC: #4)
  - [ ] Create components/tenant/QuickActionsGrid.tsx with 4 action buttons
  - [ ] Implement navigation to /tenant/requests/new, /tenant/payments/new, /tenant/amenities/book
  - [ ] Implement lease download button: trigger GET /api/v1/tenant/lease/download, open PDF
  - [ ] Add loading states to buttons during navigation/download
  - [ ] Add data-testid attributes: btn-maintenance, btn-payment, btn-amenity, btn-lease
  - [ ] Add tooltips on hover explaining each action

- [ ] **Task 7: Create Profile Page Structure** (AC: #5)
  - [ ] Create app/(dashboard)/tenant/profile/page.tsx
  - [ ] Implement Tabs navigation (desktop) with Personal, Lease, Parking, Documents, Settings
  - [ ] Implement Accordion sections (mobile) for responsive design
  - [ ] Add banner at top: "To update information, contact property management"
  - [ ] Implement useTenantProfile() custom hook with React Query
  - [ ] Create skeleton loaders for profile sections

- [ ] **Task 8: Implement Personal and Lease Info Sections** (AC: #6, #7)
  - [ ] Create components/tenant/PersonalInfoSection.tsx: display all personal fields read-only
  - [ ] Add copy button for email, click-to-call for phone
  - [ ] Implement national ID masking: show last 4 digits, reveal on click
  - [ ] Create components/tenant/LeaseInfoSection.tsx: display lease details with rent breakdown table
  - [ ] Implement rent breakdown table using shadcn Table: rows for base, service, parking, total
  - [ ] Add download lease button with PDF download functionality
  - [ ] Format all dates as "dd MMM yyyy" using date-fns
  - [ ] Display lease type as colored badge (FIXED_TERM, MONTH_TO_MONTH, YEARLY)

- [ ] **Task 9: Implement Parking and Document Sections** (AC: #8, #10)
  - [ ] Create components/tenant/ParkingInfoSection.tsx: display parking spots, fees, Mulkiya download
  - [ ] Handle no parking case: show "No parking allocated" message
  - [ ] Create components/tenant/DocumentRepositorySection.tsx with documents table
  - [ ] Implement document upload zone using react-dropzone (PDF/JPG/PNG, max 5MB)
  - [ ] Add document type selector (shadcn Select) for uploads
  - [ ] Implement useUploadDocument() mutation hook
  - [ ] Show upload progress bar per file
  - [ ] Implement document download buttons with GET /api/v1/tenant/documents/{id}/download
  - [ ] Handle empty state: "No documents uploaded yet"

- [ ] **Task 10: Implement Account Settings and Password Change** (AC: #9)
  - [ ] Create components/tenant/AccountSettingsSection.tsx
  - [ ] Implement password change form with 3 fields: current, new, confirm
  - [ ] Add Zod validation schema: currentPassword min 8, newPassword min 12 with complexity regex
  - [ ] Integrate PasswordStrengthMeter component from Story 2.5
  - [ ] Create useChangePassword() mutation hook
  - [ ] On success: show toast, invalidate auth queries, redirect to /login after 3 seconds
  - [ ] Add language preference selector (English/Arabic) - save to backend
  - [ ] Add note about email notifications

- [ ] **Task 11: Implement Responsive Design and Mobile Navigation** (AC: #12)
  - [ ] Create components/tenant/BottomNavigation.tsx for mobile (<768px)
  - [ ] Implement 4 nav items: Dashboard, Requests, Payments, Profile with icons
  - [ ] Add active state highlighting for current route
  - [ ] Ensure touch targets ≥ 44×44px on all mobile buttons
  - [ ] Test responsive layouts at 320px, 768px, 1024px, 1440px viewports
  - [ ] Implement conditional rendering: bottom nav on mobile, side tabs on desktop
  - [ ] Add viewport meta tag for proper mobile scaling

- [ ] **Task 12: Setup Data Fetching and Caching** (AC: #13)
  - [ ] Configure React Query provider in app layout
  - [ ] Create hooks/useTenantDashboard.ts with queryKey ['tenant', 'dashboard'], staleTime 5 min
  - [ ] Create hooks/useTenantProfile.ts with queryKey ['tenant', 'profile'], staleTime 10 min
  - [ ] Create hooks/useChangePassword.ts mutation hook with onSuccess invalidation
  - [ ] Create hooks/useUploadDocument.ts mutation hook with optimistic updates
  - [ ] Implement error handling with toast notifications
  - [ ] Add refetch on window focus for critical data

- [ ] **Task 13: Add Accessibility and Testing Attributes** (AC: #15)
  - [ ] Add data-testid to all interactive elements following convention
  - [ ] Implement keyboard navigation: Tab, Enter, Escape, Arrow keys
  - [ ] Add ARIA labels: role="navigation" on bottom nav, aria-label on icon buttons
  - [ ] Add aria-describedby for form hints, aria-live for dynamic content
  - [ ] Ensure color contrast ≥ 4.5:1, test with dark theme
  - [ ] Add focus indicators to all interactive elements
  - [ ] Test screen reader accessibility with VoiceOver/NVDA
  - [ ] Add aria-busy and loading labels for async operations

- [ ] **Task 14: Write Unit and Integration Tests** (AC: #15)
  - [ ] Write frontend component tests: Dashboard, Profile, Account Settings
  - [ ] Write React Query hook tests with MSW for API mocking
  - [ ] Write backend controller tests: TenantPortalController
  - [ ] Write service layer tests: dashboard data calculation, password change validation
  - [ ] Write E2E tests: login as tenant → view dashboard → change password → upload document
  - [ ] Test responsive layouts in different viewports
  - [ ] Verify all data-testid attributes present and functional
  - [ ] Achieve ≥ 80% code coverage for new code

## Dev Notes

### Architecture Patterns

**Route Protection:**
- Use Next.js middleware to protect /tenant/* routes
- Verify user has TENANT role from JWT token
- Redirect to /login if not authenticated
- Follow pattern from Story 2.5 middleware implementation

**Server vs Client Components:**
- Dashboard page: Server Component for initial data fetch (faster load)
- Interactive sections: Client Components for state management
- Use 'use client' directive only where needed for hooks/state

**API Integration:**
- Follow Axios interceptor pattern from Story 2.5
- All API calls through centralized apiClient from lib/api.ts
- Use React Query for caching and state management
- Implement optimistic UI updates for better UX

### Constraints

**Read-Only vs Editable:**
- Personal info, lease info, parking info: READ-ONLY (display only)
- Account settings (password): EDITABLE with validation
- Document upload: EDITABLE (add new documents)
- Contact property management for any profile/lease changes

**File Handling:**
- Store lease PDFs in /uploads/leases/{tenantId}/
- Store additional documents in /uploads/tenants/{tenantId}/additional/
- Mulkiya document path already stored from Story 3.3 onboarding
- Validate file types: PDF/JPG/PNG only, max 5MB per file

**Security:**
- All endpoints require TENANT role authorization
- Password change requires current password validation
- No ability to change email or personal info (prevents account takeover)
- Document downloads must verify tenant owns the document

**Date/Time:**
- All dates displayed in UAE timezone (GST)
- Use date-fns for date manipulation and formatting
- Store dates as UTC in database, convert to GST for display
- Lease expiration countdown updates daily at midnight GST

### Testing Standards

From retrospective action items (AI-2-1):
- ALL interactive elements MUST have data-testid attributes
- Convention: {component}-{element}-{action}
- Mandatory for buttons, inputs, links, modals
- Verified in code review before PR approval

### Learnings from Previous Story (Story 3.3: Tenant Onboarding)

**From Story 3.3 (Status: ready-for-dev)**

Story 3.3 created the tenant onboarding flow with multi-step wizard. This story (3.4) will consume the tenant data created in 3.3:

- **Tenant Entity Structure**: Story 3.3 creates complete Tenant entity with personal info, lease details, parking allocation, and uploaded documents
- **User Account Pattern**: Each tenant has associated User entity with TENANT role, email login, BCrypt password
- **Document Storage**: Documents stored in /uploads/tenants/{tenantId}/ with TenantDocument entities
- **Parking Integration**: Parking allocation (spots, fees, spot numbers, Mulkiya) stored in Tenant entity
- **Lease PDF**: Signed lease agreement stored and emailed to tenant on upload

**Key Components to Reuse:**
- Types from types/tenant.ts (Tenant interface, LeaseType, PaymentMethod enums)
- Validation schemas pattern from lib/validations/tenant.ts
- API service pattern from services/tenant.service.ts
- formatCurrency helper for AED amounts

**Integration Points:**
- Dashboard will display Tenant.unit, Tenant.lease data
- Profile will show all Tenant fields as read-only
- Documents section will list TenantDocument entities created in onboarding
- Parking section will display Tenant.parkingSpots, Tenant.parkingFeePerSpot, Tenant.mulkiyaDocumentPath

**Patterns to Follow:**
- Multi-step forms use React Hook Form + Zod (if needed in future)
- shadcn components: form, input, select, calendar, card, tabs, accordion
- Date formatting: "dd MMM yyyy" using date-fns
- File uploads: react-dropzone with validation
- Responsive: Tabs (desktop) → Accordion (mobile)

### Learnings from Completed Stories

**From Story 2.5 (Frontend Authentication - Status: done)**

Established patterns that MUST be reused:

- **AuthContext Pattern**: Global state management at `contexts/AuthContext.tsx`
  - Used for authentication state across app
  - Provides `useAuth()` hook for components
  - This story should use `useAuth()` to verify TENANT role

- **Axios API Client**: Centralized at `lib/api.ts`
  - Interceptors for JWT token attachment
  - Error handling and token refresh
  - All API calls in this story MUST use this apiClient instance

- **File Structure**:
  - Components: `components/{feature}/{ComponentName}.tsx`
  - Hooks: `hooks/use{FeatureName}.ts`
  - Types: `types/{feature}.ts`
  - Schemas: `lib/validations/{feature}.ts`
  - Services: `services/{feature}.service.ts`

- **Form Validation Pattern**:
  - React Hook Form + Zod schemas
  - Inline validation errors below fields
  - PasswordStrengthMeter component available for reuse
  - Schema: currentPassword min 8, newPassword min 12 with complexity

- **Components Installed**:
  - Already available: form, input, button, card, dialog, badge, skeleton, toast, alert-dialog
  - Need to add: tabs, accordion, table, avatar, progress, separator

- **Dependencies Available**:
  - axios, react-hook-form, @hookform/resolvers, zod, jwt-decode
  - Need to add: @tanstack/react-query, react-dropzone, date-fns

### References

- [Source: docs/epics/epic-3-tenant-management-portal.md#story-34-tenant-portal-dashboard-and-profile-management]
- [Source: docs/architecture.md#frontend-implementation-patterns]
- [Source: docs/architecture.md#api-response-format]
- [Source: docs/architecture.md#date-and-time-handling]
- [Source: docs/sprint-artifacts/3-3-tenant-onboarding-and-registration.md]
- [Source: docs/sprint-artifacts/2-5-frontend-authentication-components-and-protected-routes.md]

## Dev Agent Record

### Context Reference

- Story Context: `docs/sprint-artifacts/stories/3-4-tenant-portal-dashboard-and-profile-management.context.xml`
- Generated: 2025-11-15
- Status: ready-for-dev

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
