# Sprint Change Proposal - Missing Epic 3 Stories

**Project:** Ultra BMS
**Date:** 2025-11-28
**Change Type:** Missing PRD Requirements
**Scope Classification:** Moderate
**Status:** APPROVED

---

## 1. Issue Summary

### Problem Statement

Epic 3 (Tenant Management & Portal) is missing stories that cover PRD requirements for:

1. **Tenant Lease Extension/Renewal** — No workflow for extending or renewing leases
2. **Tenant Checkout/Exit Process** — No move-out workflow, inspection, key handover
3. **Security Deposit Refund** — No deposit calculation, deductions, or refund processing

### Evidence

**PRD Section 3.3.2 (Tenant Lifecycle Management) explicitly lists:**

- Lease renewal workflows
- Exit/checkout process management

**PRD Section 3.6.1 (Revenue Management) references:**

- Security deposit tracking

### Current Epic 3 Stories (all DONE)

| Story | Title | Status |
|-------|-------|--------|
| 3.1 | Lead Management & Quotation | Done |
| 3.2 | Property & Unit Management | Done |
| 3.3 | Tenant Onboarding | Done |
| 3.4 | Tenant Portal Dashboard | Done |
| 3.5 | Maintenance Requests | Done |
| **3.6** | Lease Extension/Renewal | **MISSING** |
| **3.7** | Checkout/Deposit Refund | **MISSING** |

### Discovery Context

- Issue discovered during sprint review
- PRD requirements exist but were not translated to stories during epic planning
- All 5 existing Epic 3 stories completed successfully

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Action Needed |
|------|--------|---------------|
| **Epic 3** | Direct | Add 2 new stories (3.6, 3.7) |
| Epic 6 | Indirect | Story 6.1 (invoicing) may interact with deposit refund |
| Other Epics | None | No impact |

### Artifact Conflicts

| Artifact | Conflict? | Action |
|----------|-----------|--------|
| PRD | No conflict | Requirements already exist |
| Architecture | Minor | Add checkout workflow, deposit entity updates |
| UI/UX | Minor | Need checkout page design, deposit refund UI |
| Database | Minor | May need DepositRefund entity, Tenant status updates |

### Story Dependencies

```
Story 3.3 (Tenant Onboarding) ──► Story 3.6 (Lease Extension)
         │                                │
         └──────────────► Story 3.7 (Checkout/Deposit Refund)
                                          │
                          Story 6.1 (Invoicing) ◄──────┘
```

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Add 2 new stories to Epic 3 to cover the missing PRD requirements.

| Factor | Assessment |
|--------|------------|
| **Effort** | Medium — 2 new stories, well-defined scope |
| **Risk** | Low — Follows established patterns from 3.3 |
| **Timeline Impact** | +2-3 story cycles |
| **PRD Alignment** | Full compliance with sections 3.3.2, 3.6.1 |

---

## 4. Detailed Change Proposals

### Story 3.6: Tenant Lease Extension and Renewal

**Epic:** Epic 3 (Tenant Management & Portal)
**PRD Reference:** Section 3.3.2 — Lease renewal workflows

**Story Definition:**

```
As a property manager,
I want to extend or renew tenant leases,
So that I can manage lease continuity without re-onboarding tenants.
```

**Acceptance Criteria:**

1. **Lease Extension Form:**
   - Select tenant with expiring lease
   - New end date (required)
   - Rent adjustment (optional: increase %, flat amount)
   - Updated terms (optional)

2. **Renewal Workflow:**
   - Notify tenant of upcoming lease expiration (60, 30, 14 days)
   - Tenant receives renewal offer (email)
   - Property manager approves/rejects extension request

3. **Document Generation:**
   - Generate lease amendment/addendum PDF
   - Upload signed document
   - Update lease record with new dates

4. **Status Updates:**
   - Update tenant lease status (EXPIRING_SOON → ACTIVE)
   - Update unit availability calendar
   - Log activity: "Lease extended for Unit {unitNumber}"

5. **API Endpoints:**
   - `POST /api/v1/tenants/{id}/lease/extend`
   - `GET /api/v1/tenants/{id}/lease/renewal-offer`
   - `POST /api/v1/tenants/{id}/lease/renewal-offer/accept`

---

### Story 3.7: Tenant Checkout and Deposit Refund Processing

**Epic:** Epic 3 (Tenant Management & Portal)
**PRD Reference:** Section 3.3.2 — Exit/checkout process management; Section 3.6.1 — Security deposit tracking

**Story Definition:**

```
As a property manager,
I want to process tenant checkouts and refund security deposits,
So that I can properly close out tenant accounts and settle financial obligations.
```

**Acceptance Criteria:**

1. **Checkout Initiation:**
   - Initiate checkout from tenant detail page
   - Record notice date (when tenant gave notice)
   - Expected move-out date
   - Checkout reason (LEASE_END, EARLY_TERMINATION, EVICTION, OTHER)

2. **Move-Out Inspection:**
   - Schedule inspection date/time
   - Inspection checklist (condition of unit, fixtures, appliances)
   - Photo documentation (before/after comparison with move-in)
   - Damage assessment with cost estimates

3. **Deposit Refund Calculation:**
   - Original deposit amount (from tenant record)
   - Deductions table:
     - Unpaid rent/invoices
     - Damage repairs (from inspection)
     - Cleaning fees
     - Key replacement
     - Other deductions (with notes)
   - Net refund amount (calculated)

4. **Deposit Refund Processing:**
   - Refund method (BANK_TRANSFER, CHEQUE)
   - Bank details (if bank transfer)
   - Generate deposit refund statement PDF
   - Record refund date and reference number

5. **Final Account Settlement:**
   - Clear all outstanding invoices or record write-offs
   - Generate final statement for tenant
   - Email final statement and refund details to tenant

6. **Unit Status Update:**
   - Update unit status: OCCUPIED → AVAILABLE
   - Update tenant status: ACTIVE → TERMINATED
   - Log activity: "Tenant checked out from Unit {unitNumber}"

7. **API Endpoints:**
   - `POST /api/v1/tenants/{id}/checkout/initiate`
   - `POST /api/v1/tenants/{id}/checkout/inspection`
   - `POST /api/v1/tenants/{id}/checkout/deposit-refund`
   - `GET /api/v1/tenants/{id}/checkout/final-statement`
   - `POST /api/v1/tenants/{id}/checkout/complete`

---

## 5. Implementation Handoff

### Change Scope: MODERATE

Requires backlog reorganization + new story drafting.

### Handoff Recipients

| Role | Responsibility |
|------|----------------|
| **Scrum Master** | Draft Stories 3.6 and 3.7 using `*create-story` workflow |
| **Developer** | Implement stories after context is created |
| **Product Owner** | Review and approve story acceptance criteria |

### Action Plan

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Approve this Sprint Change Proposal | User | **APPROVED** |
| 2 | Update `sprint-status.yaml` with new stories | SM | Done |
| 3 | Draft Story 3.6 (Lease Extension) | SM | Pending |
| 4 | Draft Story 3.7 (Checkout/Deposit Refund) | SM | Pending |
| 5 | Create story context for 3.6 | SM | Pending |
| 6 | Implement Story 3.6 | Dev | Pending |
| 7 | Create story context for 3.7 | SM | Pending |
| 8 | Implement Story 3.7 | Dev | Pending |

### Success Criteria

- [ ] Story 3.6 and 3.7 added to Epic 3
- [ ] PRD section 3.3.2 (Exit/checkout) fully covered
- [ ] PRD section 3.6.1 (Deposit tracking) fully covered
- [ ] Unit status properly transitions on checkout
- [ ] Deposit refund workflow functional

---

## Approval Record

**Approved by:** Nata
**Date:** 2025-11-28
**Decision:** Proceed with adding Stories 3.6 and 3.7 to Epic 3

---

*Generated by Correct Course Workflow*

---

# Sprint Change Proposal #2: Admin User Management

**Date:** 2025-11-28
**Change Type:** Missing Functionality
**Scope Classification:** Minor
**Status:** APPROVED

---

## 1. Issue Summary

### Problem Statement

Admin/Super_Admin users need the ability to create `property_manager` and other staff users, which is currently missing from all stories.

### Context

- **Discovery:** Gap analysis during implementation review
- **Root Cause:** Story 2.1 covers only self-registration. Story 2.2 Task 13 (Role Assignment API) was deferred and only assigns roles to existing users, not create new users.
- **Impact:** Property managers, maintenance supervisors, and finance managers cannot be onboarded without self-registration, which is not appropriate for staff accounts.

### Evidence

- **PRD Section 3.1.2:** Defines 6 user roles including PROPERTY_MANAGER
- **Story 2.1:** Only implements `/api/v1/auth/signup` for self-registration
- **Story 2.2 Task 13:** Deferred — only covers role assignment, not user creation
- **Gap:** No mechanism exists for admin to create users with specific roles

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| Epic 2 | **MODIFIED** | Add new Story 2.6: Admin User Management |
| Epic 3 | Indirect | Property managers needed for property assignment |
| Epic 4-9 | None | No direct impact |

### Story Impact

- **New Story Required:** Story 2.6: Admin User Management
- **Existing Stories:** No modifications needed
- **Deferred Task 13 (Story 2.2):** Subsumed into Story 2.6

### Artifact Conflicts

| Artifact | Conflict | Required Update |
|----------|----------|-----------------|
| PRD | None | Implements existing requirement |
| Architecture | None | Uses existing RBAC infrastructure |
| UI/UX | Addition | New Admin Users page needed |
| Database | Addition | Add status, mustChangePassword fields to User |

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Add new Story 2.6 to Epic 2 without modifying existing completed stories.

### Rationale

1. **Low Risk:** RBAC infrastructure is complete and tested
2. **Low Effort:** Reuses existing patterns (DTOs, Services, @PreAuthorize)
3. **No Rollback:** No completed work needs to be reverted
4. **MVP Aligned:** Implements capability implied by PRD user roles

### Effort Estimate

- **Backend:** ~1 day
- **Frontend:** ~1 day
- **Total:** 2-3 days

---

## 4. Detailed Change Proposals

### Story 2.6: Admin User Management

**Epic:** Epic 2 (Authentication & User Management)
**PRD Reference:** Section 3.1.2 — User Roles

**Story Definition:**

```
As a Super Admin or Admin,
I want to create, view, update, and deactivate user accounts,
So that I can onboard property managers and other staff members who won't self-register.
```

**Acceptance Criteria (17 total):**

1. User List API with pagination, search, filters
2. Create User API with role assignment
3. Role Coverage - Admin can create ALL roles (including TENANT, VENDOR)
4. Update User API
5. Deactivate/Reactivate User APIs
6. Welcome Email with temporary password
7. Force Password Change on first login
8. Frontend User List Page (/admin/users)
9. Create/Edit/Deactivate User Dialogs
10. Audit Logging for all user management actions
11. Sidebar Navigation update (Users menu item)
12. **DISABLE SELF-REGISTRATION** - POST /api/v1/auth/signup returns 403 Forbidden
13. Unit Test Execution - ALL backend/frontend tests must pass
14. Build Verification - mvn compile and npm run build must succeed

**Tasks (16 total):**

- Backend DTOs, Entity updates, Service, Controller
- Welcome email template
- Force password change logic
- **Disable signup endpoint** (return 403)
- Frontend types, service, page, dialogs
- Sidebar update
- **Mandatory test execution and fix any failures**
- **Build verification**

---

## 5. Implementation Handoff

### Change Scope: MINOR

Can be implemented directly by development team.

### Action Plan

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Approve Sprint Change Proposal | User | **APPROVED** |
| 2 | Create Story 2.6 file | SM | **DONE** |
| 3 | Update sprint-status.yaml | SM | **DONE** |
| 4 | Create story context for 2.6 | SM | Pending |
| 5 | Implement Story 2.6 | Dev | Pending |

### Success Criteria

- [ ] SUPER_ADMIN can create PROPERTY_MANAGER user
- [ ] SUPER_ADMIN can create TENANT and VENDOR users
- [ ] New user receives welcome email with temp password
- [ ] New user forced to change password on first login
- [ ] All CRUD operations work via /admin/users page
- [ ] Audit logs capture all user management actions
- [ ] **Self-registration endpoint disabled (returns 403)**
- [ ] **All unit tests pass (mvn test, npm test)**
- [ ] **All builds succeed (mvn compile, npm run build)**

---

## Approval Record

**Approved by:** Nata
**Date:** 2025-11-28
**Decision:** Proceed with adding Story 2.6 to Epic 2

---

*Generated by Correct Course Workflow*

---

# Sprint Change Proposal #3: Theme Settings & Bank Account Management

**Date:** 2025-11-28
**Change Type:** New Stakeholder Requirements
**Scope Classification:** Moderate
**Status:** APPROVED

---

## 1. Issue Summary

### Problem Statement

New stakeholder requirements have been identified:

1. **Theme Settings (Dark/Light Mode)**: Admin/Super Admin need ability to configure theme preferences
2. **System-Wide Theme Support**: Application must support both dark and light themes with persistence
3. **Multiple Bank Accounts**: Admin/Super Admin need ability to add/manage multiple company bank accounts

### Evidence

- **Stitch Designs Available:**
  - `docs/archive/stitch_building_maintenance_software/settings_page_1/` — My Profile (dark theme)
  - `docs/archive/stitch_building_maintenance_software/settings_page_2/` — Company Details
  - `docs/archive/stitch_building_maintenance_software/bank_account_management_page/` — Bank accounts UI
- **Existing Code:** Settings page at `frontend/src/app/(dashboard)/settings/page.tsx` has "Appearance" section marked "Coming Soon" (lines 34-39)

### Discovery Context

- **Trigger Type:** New stakeholder requirement
- **Trigger Source:** Direct request from Nata
- **Related PRD:** Not explicitly covered — need PRD section 3.12 addition

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Action Needed |
|------|--------|---------------|
| **Epic 2** | MODERATE | Add Story 2.7: Theme Settings |
| **Epic 6** | MODERATE | Add Story 6.5: Bank Account Management |
| Other Epics | NONE | No impact |

### Story Dependencies

```
Story 2.6 (Admin User Mgmt) ──► Story 2.7 (Theme Settings)

Story 6.2 (Expense Mgmt) ──► Story 6.5 (Bank Accounts)
```

### Artifact Conflicts

| Artifact | Conflict? | Required Updates |
|----------|-----------|------------------|
| PRD | MINOR | Add section 3.12 "System Settings Management" |
| Architecture | MINOR | Add `system_settings`, `bank_accounts` tables |
| UI/UX | NONE | Stitch designs already exist |
| Epic Files | YES | Add stories to Epic 2 and Epic 6 |
| Sprint Status | YES | Add new story entries |

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Add two new stories without disrupting current sprint.

### Rationale

- Both features are self-contained
- Stitch designs provide complete UI specs
- Settings page infrastructure exists ("Appearance" marked "Coming Soon")
- No rollback or MVP scope reduction needed

### Effort Estimate

| Story | Effort | Timeline |
|-------|--------|----------|
| 2.7 Theme Settings | Medium | 2-3 days |
| 6.5 Bank Accounts | Medium | 3-4 days |
| **Total** | — | **5-7 days** |

---

## 4. Detailed Change Proposals

### Story 2.7: Admin Theme Settings & System Theme Support

**Epic:** Epic 2 (Authentication & User Management)

```
As an Admin or Super Admin,
I want to configure the application theme (dark/light mode),
So that users can customize their viewing experience.
```

**Acceptance Criteria:**

1. **Theme Selection UI:**
   - Theme toggle: System (default) / Light / Dark
   - Live preview of theme change
   - Immediate application on selection
   - Persist to user profile

2. **Backend Storage:**
   - `users.theme_preference` column (enum: SYSTEM, LIGHT, DARK)
   - System default in `system_settings` table
   - API: GET/PUT /api/v1/settings/appearance

3. **Frontend Implementation:**
   - ThemeProvider component
   - useTheme hook
   - Tailwind dark mode class strategy
   - LocalStorage fallback
   - System preference detection (prefers-color-scheme)

4. **Theme Application:**
   - All components support both themes
   - Smooth transition (200ms)
   - shadcn/ui dark mode support (built-in)

5. **RBAC:**
   - ADMIN/SUPER_ADMIN: system-wide defaults
   - All users: personal preference

**Technical Notes:**
- Use `next-themes` library
- Flyway migration for new column
- Reference: `docs/archive/stitch_building_maintenance_software/settings_page_1/`

---

### Story 6.5: Bank Account Management

**Epic:** Epic 6 (Financial Management)

```
As an Admin or Super Admin,
I want to manage company bank accounts,
So that financial operations can be linked to specific bank accounts.
```

**Acceptance Criteria:**

1. **Bank Account List Page:**
   - Table: Bank Name, Account Name, Account Number (masked), IBAN, SWIFT/BIC, Actions
   - Search by bank/account name
   - Edit, Delete actions
   - "Add New Bank Account" button

2. **Add/Edit Form:**
   - Bank Name (required, max 100)
   - Account Name (required, max 255)
   - Account Number (encrypted at rest, masked on display)
   - IBAN (validated UAE format: AE + 21 digits)
   - SWIFT/BIC (8 or 11 chars)
   - Is Primary (boolean)
   - Status (ACTIVE/INACTIVE)

3. **bank_accounts Entity:**
   - id (UUID), bankName, accountName
   - accountNumber_encrypted, iban_encrypted (AES-256)
   - swiftCode, isPrimary, status
   - createdBy, createdAt, updatedAt

4. **Validation Rules:**
   - IBAN checksum validation
   - SWIFT/BIC format validation
   - No duplicate account numbers
   - At least one account must remain active

5. **API Endpoints:**
   - POST /api/v1/bank-accounts
   - GET /api/v1/bank-accounts
   - GET /api/v1/bank-accounts/{id}
   - PUT /api/v1/bank-accounts/{id}
   - DELETE /api/v1/bank-accounts/{id}
   - PATCH /api/v1/bank-accounts/{id}/primary

6. **RBAC:**
   - ADMIN/SUPER_ADMIN: full CRUD
   - FINANCE_MANAGER: read-only

**Technical Notes:**
- Encrypt sensitive fields with AES-256
- Flyway migration V41__create_bank_accounts_table.sql
- Reference: `docs/archive/stitch_building_maintenance_software/bank_account_management_page/`

---

## 5. Implementation Handoff

### Change Scope: MODERATE

Requires SM to add stories, Developer to implement.

### Handoff Responsibilities

| Role | Responsibility |
|------|----------------|
| **Scrum Master** | Update epic files, add to sprint-status.yaml |
| **Developer** | Implement Stories 2.7 and 6.5 |

### Recommended Sequence

1. **Story 2.7** (Theme Settings) — Foundation for dark/light mode
2. **Story 6.5** (Bank Accounts) — Independent feature

### Success Criteria

- [ ] Theme toggle works across all pages
- [ ] Theme persists across sessions
- [ ] Bank accounts CRUD functional
- [ ] Account numbers properly masked
- [ ] IBAN/SWIFT validation working
- [ ] RBAC enforced (Admin/Super Admin only)
- [ ] Stitch design alignment verified

---

## 6. Approval

**Approved by:** Nata
**Date:** 2025-11-28
**Decision:** Proceed with adding Stories 2.7 and 6.5

### Actions Completed:
- [x] Story 2.7 added to Epic 2 file
- [x] Story 6.5 added to Epic 6 file
- [x] sprint-status.yaml updated with new story entries
- [x] SCP marked as APPROVED

---

*Generated by Correct Course Workflow*
*Scrum Master: Bob*
*Date: 2025-11-28*

---

# Sprint Change Proposal #4: Company Profile Settings & PDC Management Priority

**Date:** 2025-11-28
**Change Type:** Missing Core Functionality
**Scope Classification:** Moderate
**Status:** APPROVED

---

## 1. Issue Summary

### Problem Statement

Two significant gaps have been identified:

1. **Company Profile & Details** — No settings page exists for managing company information:
   - Legal Company Name
   - Company Address (Address, City, Country)
   - TRN (Tax Registration Number)
   - Official Contact Information (Phone, Email)
   - Company Logo upload
   - **Use Cases:** Invoice headers, tenant cheque holder details, official documents

2. **PDC Management Priority** — Story 6.3 (PDC Management) exists in backlog but needs prioritization for immediate development given:
   - Tenants paying via post-dated cheques
   - Need to track cheque deposits, clearances, and bounces
   - Integration with invoicing (Story 6.1) already complete

### Evidence

**Stitch Designs Available:**
- `docs/archive/stitch_building_maintenance_software/settings_page_2/` — Company Profile & Details
- `docs/archive/stitch_building_maintenance_software/pdc_management_dashboard/` — PDC Dashboard
- `docs/archive/stitch_building_maintenance_software/pdc_details_page_2/` — PDC Details (Credited)
- `docs/archive/stitch_building_maintenance_software/pdc_details_page_3/` — PDC Details (Bounced)
- `docs/archive/stitch_building_maintenance_software/withdraw_pdc_modal/` — Withdraw PDC Modal
- `docs/archive/stitch_building_maintenance_software/cheque_withdrawal_history_page/` — Withdrawal History

### Discovery Context

- **Trigger Type:** Missing functionality identified during sprint review
- **Trigger Source:** Direct request from Nata with screenshot reference
- **Current Status:**
  - Company Profile: Not covered in any story
  - PDC Management: Story 6.3 exists but is in `backlog` status

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Action Needed |
|------|--------|---------------|
| **Epic 2** | MODERATE | Add Story 2.8: Company Profile Settings |
| **Epic 6** | PRIORITY CHANGE | Move Story 6.3 to `ready-for-dev` or `in-progress` |
| Other Epics | NONE | No impact |

### Story Dependencies

```
Story 6.1 (Invoicing - DONE) ──► Story 2.8 (Company Profile)
         │                              │
         │                              ├── Invoice PDF Header (logo, company details)
         │                              │
         └──────────────► Story 6.3 (PDC Management)
                                        │
                                        ├── PDC Holder = Company Name
                                        ├── Deposit to Company Bank Account
                                        └── Integration with invoices
```

### Artifact Conflicts

| Artifact | Conflict? | Required Updates |
|----------|-----------|------------------|
| PRD | MINOR | Add section 3.12 "Company Profile Management" |
| Architecture | MINOR | Add `company_profile` table, update PdfGenerationService |
| UI/UX | NONE | Stitch designs already exist |
| Epic 2 | YES | Add Story 2.8 |
| Sprint Status | YES | Add 2.8, prioritize 6.3 |

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Add one new story (2.8) and prioritize existing story (6.3) for immediate development.

### Rationale

1. **Company Profile is foundational** — Required for professional invoice generation
2. **PDC Management already specified** — Story 6.3 is complete with 31 acceptance criteria
3. **Bank Account Management (6.5)** — Already approved, provides bank account selection for PDC deposits
4. **No disruption** — Both can proceed in parallel with Story 3.7 (Checkout)

### Effort Estimate

| Story | Effort | Timeline |
|-------|--------|----------|
| 2.8 Company Profile | Low-Medium | 1-2 days |
| 6.3 PDC Management | Medium-High | 4-5 days |
| **Total** | — | **5-7 days** |

---

## 4. Detailed Change Proposals

### Story 2.8: Company Profile Settings

**Epic:** Epic 2 (Authentication & User Management)

```
As an Admin or Super Admin,
I want to manage company profile details,
So that official documents display accurate company information.
```

**Acceptance Criteria:**

1. **Company Profile Page:**
   - Navigate to Settings > Company Profile
   - Admin-only access (info banner shown)
   - Form fields:
     - Legal Company Name (required, text, max 255 chars)
     - Company Address (required, text, max 500 chars)
     - City (required, text, max 100 chars)
     - Country (required, dropdown, UAE countries)
     - TRN (Tax Registration Number) (required, validated 15-digit format)
     - Phone Number (required, validated UAE format +971)
     - Email Address (required, validated email)
   - "Save Changes" button

2. **Company Logo Management:**
   - Current logo preview
   - "Upload Logo" button
   - Accepts: PNG, JPG (max 2MB)
   - Recommended: Square image
   - "Remove" link to delete logo
   - Logo stored in S3: `/uploads/company/logo.png`

3. **company_profile Entity:**
   - id (UUID, single record)
   - legalCompanyName, companyAddress
   - city, country
   - trn (Tax Registration Number)
   - phoneNumber, emailAddress
   - logoFilePath (S3 key)
   - updatedBy (userId), updatedAt

4. **API Endpoints:**
   - GET /api/v1/company-profile: Get company profile
   - PUT /api/v1/company-profile: Update company profile
   - POST /api/v1/company-profile/logo: Upload company logo
   - DELETE /api/v1/company-profile/logo: Remove company logo

5. **Integration Points:**
   - PdfGenerationService: Include logo and company details in invoice headers
   - PDC Management: Company name as "Holder" on cheque details
   - Email templates: Company signature in footer

6. **RBAC:**
   - ADMIN/SUPER_ADMIN: Full CRUD
   - Other roles: Read-only (for display purposes)

7. **Validation:**
   - TRN format: 15 digits (UAE VAT number format)
   - Phone: +971 followed by 9 digits
   - Email: Standard email validation
   - Logo: Max 2MB, PNG/JPG only

**Technical Notes:**
- Single record design (no multiple companies)
- Use existing S3 integration for logo upload
- Cache company profile (frequently read for documents)
- Flyway migration V42__create_company_profile_table.sql
- Reference: docs/archive/stitch_building_maintenance_software/settings_page_2/

---

### Story 6.3: PDC Management (EXISTING — PRIORITY CHANGE)

**Status Change:** `backlog` → `ready-for-dev`

**Story 6.3 is already fully specified** in Epic 6 with:
- 31 detailed acceptance criteria
- Complete entity design (PDC entity)
- Full API endpoint specification
- Dashboard, list, detail, workflow specifications
- Bounce handling and replacement flow
- Scheduled jobs for status updates and reminders

**Additional Enhancements Based on Stitch Designs:**

1. **Cheque Withdrawal History Page:**
   - New page: `/finance/pdc/withdrawals`
   - Table columns: Original Cheque No, Tenant Name, Withdrawal Date, Amount, Reason, New Payment Method, Associated PDC ID
   - Filters: Reason (All, Cheque Bounced, Replacement Requested, Early Termination), Date Range
   - Export to PDF/Excel

2. **PDC Holder Field:**
   - Display company name from `company_profile` as "Holder" on PDC details
   - Example: "Emirates Property Care FZ-LLC"

3. **Beneficiary Bank Account:**
   - When marking PDC as Deposited/Credited, select bank account from `bank_accounts` (Story 6.5)
   - Display: "Emirates NBD - **** **** **** 1025"

**References:**
- docs/archive/stitch_building_maintenance_software/pdc_management_dashboard/
- docs/archive/stitch_building_maintenance_software/pdc_details_page_2/
- docs/archive/stitch_building_maintenance_software/pdc_details_page_3/
- docs/archive/stitch_building_maintenance_software/withdraw_pdc_modal/
- docs/archive/stitch_building_maintenance_software/cheque_withdrawal_history_page/

---

## 5. Implementation Handoff

### Change Scope: MODERATE

Requires SM to add Story 2.8, Developer to implement both stories.

### Recommended Implementation Sequence

1. **Story 2.8 (Company Profile)** — Foundation for document headers
2. **Story 6.5 (Bank Account Management)** — Already approved, provides bank selection
3. **Story 6.3 (PDC Management)** — Integrates with both above

### Handoff Responsibilities

| Role | Responsibility |
|------|----------------|
| **Scrum Master** | Add Story 2.8 to Epic 2, update sprint-status.yaml |
| **Developer** | Implement Stories 2.8 → 6.5 → 6.3 in sequence |

### Action Plan

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Approve this Sprint Change Proposal | User | Pending |
| 2 | Add Story 2.8 to Epic 2 file | SM | Pending |
| 3 | Update sprint-status.yaml with 2.8 | SM | Pending |
| 4 | Draft Story 2.8 details | SM | Pending |
| 5 | Update Story 6.3 with Stitch design enhancements | SM | Pending |
| 6 | Move Story 6.3 to ready-for-dev | SM | Pending |
| 7 | Implement Story 2.8 | Dev | Pending |
| 8 | Implement Story 6.5 (Bank Accounts) | Dev | Pending |
| 9 | Implement Story 6.3 (PDC Management) | Dev | Pending |

### Success Criteria

- [ ] Company Profile page functional at Settings > Company Profile
- [ ] Company logo uploads to S3 and displays
- [ ] Invoice PDFs include company logo and details in header
- [ ] PDC Dashboard shows KPIs (due this week, outstanding, bounced)
- [ ] PDC lifecycle: Received → Due → Deposited → Cleared/Bounced
- [ ] PDC withdrawal history page with filtering
- [ ] PDC details show company as "Holder"
- [ ] Bank account selection when marking PDC as deposited

---

## 6. Approval

**Approved by:** Nata
**Date:** 2025-11-28
**Decision:** Proceed with adding Story 2.8 and prioritizing Story 6.3

### Actions Completed:
- [x] Story 2.8 added to Epic 2 file
- [x] Story 6.3 updated with Stitch design enhancements
- [x] sprint-status.yaml updated with Story 2.8 and Story 6.3 priority note
- [x] SCP #4 marked as APPROVED

---

*Generated by Correct Course Workflow*
*Scrum Master: Bob*
*Date: 2025-11-28*

---

# Sprint Change Proposal #5: Parking Spot Inventory Management

**Date:** 2025-11-28
**Change Type:** Missing PRD Requirement (FR16)
**Scope Classification:** Minor
**Status:** APPROVED

---

## 1. Issue Summary

### Problem Statement

**FR16: Parking Management** is documented in the PRD but not covered by any dedicated story:

| FR16 Requirement | Current Coverage | Gap |
|------------------|------------------|-----|
| Spot categorization and allocation management | Story 3.3 (partial - only during tenant onboarding) | **NO dedicated CRUD** |
| Tenant and visitor parking workflows | Story 3.3 (tenant only) | Visitor parking not covered |
| Monthly permits and violation management | None | Not covered |
| Revenue tracking and utilization reporting | Story 6.1 (parking fees in invoices) | No dedicated parking reports |

### Evidence

**Stitch Designs Available:**
- `docs/archive/stitch_building_maintenance_software/parking_spot_inventory/` — Inventory list page
- `docs/archive/stitch_building_maintenance_software/add/edit_parking_spot_form/` — Add/Edit form

**Stitch Design Features:**
1. **Parking Spot Inventory Page:**
   - Table: Spot Number, Building, Default Fee (AED), Status, Assigned To, Actions
   - Statuses: Available (green), Assigned (blue), Under Maintenance (orange)
   - Search by Spot Number or Tenant
   - Filters: Building, Status
   - Pagination (24 results shown)
   - "Add New Parking Spot" button

2. **Add/Edit Parking Spot Form:**
   - Building (dropdown, required)
   - Spot Number (text, e.g., P2-115)
   - Default Fee (AED) (number)

### Discovery Context

- **Trigger Type:** Planned requirement missing from sprint backlog
- **Current Status:** FR16 exists in PRD but only partially covered by Story 3.3

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Action Needed |
|------|--------|---------------|
| **Epic 3** | MODERATE | Add Story 3.8: Parking Spot Inventory Management |
| Epic 7 | None | FR coverage map mentions parking but Epic 3 is better fit |
| Other Epics | None | No impact |

### Story Dependencies

```
Story 3.2 (Property & Unit - DONE) ──► Story 3.8 (Parking Spots)
                                              │
         Story 3.3 (Tenant Onboarding - DONE) ◄──── Parking allocation references
                                              │
         Story 3.7 (Checkout - IN PROGRESS) ◄────── Parking release on checkout
                                              │
         Story 6.1 (Invoicing - DONE) ◄──────────── Parking fees in invoices
```

### Artifact Conflicts

| Artifact | Conflict? | Required Updates |
|----------|-----------|------------------|
| PRD | None | FR16 already exists |
| Architecture | MINOR | Add ParkingSpot entity with Property relationship |
| UI/UX | None | Stitch designs provide complete spec |
| Database | MINOR | Add parking_spots table, update tenant parking references |
| Epic 3 | YES | Add Story 3.8 definition |
| Sprint Status | YES | Add Story 3.8 entry |

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Add Story 3.8 to Epic 3 without modifying existing stories.

### Rationale

1. **Low Risk:** Follows established patterns from Story 3.2 (Property/Unit CRUD)
2. **Clear Design:** Stitch mockups provide complete UI specification
3. **Self-Contained:** Independent feature that doesn't block current work
4. **Proper Integration:** Natural fit with Epic 3 (Property & Tenant Management)

### Effort Estimate

| Factor | Assessment |
|--------|------------|
| **Effort** | Medium — 2-3 days |
| **Risk** | Low — Standard CRUD following existing patterns |
| **Timeline Impact** | +1 story cycle |
| **PRD Alignment** | Implements FR16 parking spot management |

---

## 4. Detailed Change Proposals

### Story 3.8: Parking Spot Inventory Management

**Epic:** Epic 3 (Tenant Management & Portal)
**PRD Reference:** FR16 — Parking Management

**Story Definition:**

```
As a property manager,
I want to manage parking spot inventory for each building,
So that I can track available spots and allocate them to tenants.
```

**Acceptance Criteria:**

1. **Parking Spot List Page (/property-management/parking):**
   - Table columns: Checkbox, Spot Number, Building, Default Fee (AED), Status, Assigned To, Actions
   - Status badges:
     - Available (green)
     - Assigned (blue) — clickable tenant name
     - Under Maintenance (orange)
   - Search by Spot Number or Tenant name
   - Filters: Building (dropdown), Status (dropdown)
   - Pagination (10/20/50 per page)
   - "Add New Parking Spot" button (top right)
   - Bulk actions: Delete selected, Change status

2. **Add New Parking Spot Modal:**
   - Building (required, dropdown of properties)
   - Spot Number (required, text, max 20 chars, e.g., "P2-115", "A-101")
   - Default Fee (AED) (required, decimal, min 0)
   - Validation: Spot number unique within building
   - Buttons: Cancel, Save Spot

3. **Edit Parking Spot:**
   - Same form as Add, pre-populated
   - Cannot change building if spot is assigned
   - Can update fee (affects future allocations, not existing)

4. **Delete Parking Spot:**
   - Confirmation dialog
   - Cannot delete if status = ASSIGNED
   - Soft delete (active = false)

5. **Change Status:**
   - Available → Under Maintenance (from Actions menu)
   - Under Maintenance → Available
   - Assigned → Available (only when tenant releases)

6. **ParkingSpot Entity:**
   - id (UUID)
   - spotNumber (required, unique within property)
   - propertyId (foreign key to Property)
   - defaultFee (decimal)
   - status (enum: AVAILABLE, ASSIGNED, UNDER_MAINTENANCE)
   - assignedTenantId (nullable, foreign key to Tenant)
   - assignedAt (timestamp, when assigned)
   - notes (text, optional)
   - createdAt, updatedAt timestamps
   - active (boolean, for soft delete)

7. **Database Migration:**
   - V43__create_parking_spots_table.sql
   - Index on propertyId, status, spotNumber
   - Unique constraint: (propertyId, spotNumber) WHERE active = true

8. **API Endpoints:**
   - POST /api/v1/parking-spots: Create parking spot
   - GET /api/v1/parking-spots: List with filters (propertyId, status, search)
   - GET /api/v1/parking-spots/{id}: Get spot details
   - PUT /api/v1/parking-spots/{id}: Update spot
   - PATCH /api/v1/parking-spots/{id}/status: Change status
   - DELETE /api/v1/parking-spots/{id}: Soft delete
   - GET /api/v1/properties/{id}/parking-spots: List spots for property
   - GET /api/v1/parking-spots/available: List available spots (for allocation dropdown)

9. **Integration with Tenant Onboarding (Story 3.3):**
   - Update parking allocation to select from ParkingSpot entity
   - When tenant allocated: Update spot status to ASSIGNED, set assignedTenantId
   - When tenant checkout (Story 3.7): Update spot status to AVAILABLE, clear assignedTenantId

10. **RBAC:**
    - SUPER_ADMIN, ADMIN, PROPERTY_MANAGER: Full CRUD
    - FINANCE_MANAGER: Read-only
    - TENANT: No access

11. **Sidebar Navigation:**
    - Add "Parking Spots" under Property Management menu
    - Icon: `local_parking` (Material Symbols)

12. **Tests:**
    - Backend: ParkingSpotServiceTest (CRUD, status transitions, uniqueness)
    - Frontend: Validation tests, component tests
    - All existing tests must pass

**Technical Notes:**
- Use existing Property dropdown component
- Status color coding matches Stitch design
- Spot number format flexible (alphanumeric)
- Fee is per-month default (can be overridden at allocation)
- Reference: docs/archive/stitch_building_maintenance_software/parking_spot_inventory/
- Reference: docs/archive/stitch_building_maintenance_software/add/edit_parking_spot_form/

**Prerequisites:**
- Story 3.2 (Property & Unit Management) — DONE
- Story 3.3 (Tenant Onboarding) — DONE (needs integration update)

---

## 5. Implementation Handoff

### Change Scope: MINOR

Can be implemented directly by development team.

### Handoff Responsibilities

| Role | Responsibility |
|------|----------------|
| **Scrum Master** | Add Story 3.8 to Epic 3 file, update sprint-status.yaml |
| **Developer** | Implement Story 3.8 |

### Action Plan

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Approve this Sprint Change Proposal | User | **PENDING** |
| 2 | Add Story 3.8 to Epic 3 file | SM | Pending |
| 3 | Update sprint-status.yaml with 3.8 | SM | Pending |
| 4 | Draft Story 3.8 using *create-story | SM | Pending |
| 5 | Create story context for 3.8 | SM | Pending |
| 6 | Implement Story 3.8 | Dev | Pending |
| 7 | Update Story 3.3 integration | Dev | Pending |

### Success Criteria

- [ ] Parking Spot list page functional at /property-management/parking
- [ ] Add/Edit/Delete parking spots working
- [ ] Status transitions working (Available ↔ Under Maintenance)
- [ ] Search and filters working (Building, Status, Spot Number)
- [ ] Pagination working
- [ ] Integration with tenant allocation (Story 3.3) updated
- [ ] Sidebar navigation updated
- [ ] All tests passing (backend + frontend)
- [ ] Build succeeds (mvn compile, npm run build)

---

## 6. Approval

**Approved by:** Nata
**Date:** 2025-11-28
**Decision:** Proceed with adding Story 3.8 to Epic 3

### Actions Completed:
- [x] Story 3.8 added to Epic 3 file
- [x] sprint-status.yaml updated with Story 3.8 entry
- [x] SCP #5 marked as APPROVED

---

*Generated by Correct Course Workflow*
*Scrum Master: Bob*
*Date: 2025-11-28*

---

# Sprint Change Proposal #6: Internal Announcements

**Date:** 2025-11-28
**Change Type:** New Feature Request (Simplified Scope)
**Scope Classification:** Moderate
**Status:** APPROVED

---

## 1. Issue Summary

### Problem Statement

Stakeholder request for **Internal Announcements** functionality based on Stitch design reference with **simplified scope**:

| Original PRD/Epic 9 | Simplified Requirement |
|---------------------|------------------------|
| Multi-channel (Email, SMS, In-app) | **Email + Website only** |
| Targeted messaging (property/tenant-specific) | **All tenants always** |
| Emergency broadcasts | **Removed** |
| Complex audience targeting | **Removed** |
| — | **ADD: Expiry date with auto-archive** |
| — | **ADD: Printable/PDF support** |
| — | **ADD: Dashboard widget (active count)** |
| — | **ADD: Copy/duplicate announcement** |
| — | **ADD: Multiple drafts allowed** |

### Evidence

**Stitch Design Reference:**
- `docs/archive/stitch_building_maintenance_software/announcements_management_page/`

**Design Features:**
1. "Internal Announcements" header with "Create New Announcement" button
2. Create form: Template selector (optional), Title, Rich text body (Bold, Italic, Lists)
3. Announcements table: Title, Published by, Date Published, Actions (Edit/Delete)
4. Templates: Office Closure Notice, Maintenance Schedule, Policy Update

### Discovery Context

- **Trigger Type:** New stakeholder requirement with design reference
- **Trigger Source:** Direct request from Nata
- **PRD Section:** 3.11 Communication & Notifications (needs simplification)
- **Epic 9:** Story 9.2 exists but needs acceptance criteria modification

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Action Needed |
|------|--------|---------------|
| **Epic 9** | MODERATE | Modify Story 9.2 acceptance criteria |
| Epic 8 | MINOR | Add announcement count widget to dashboard |
| Other Epics | NONE | No impact |

### Story Dependencies

```
Story 9.1 (Email System - backlog) ──► Story 9.2 (Internal Announcements)
                                              │
         Story 3.4 (Tenant Portal - DONE) ◄───┴── Tenant announcement list view
```

### Artifact Conflicts

| Artifact | Conflict? | Required Updates |
|----------|-----------|------------------|
| PRD Section 3.11.1 | YES | Simplify announcement management definition |
| Epic 9 Story 9.2 | YES | Rewrite acceptance criteria |
| Sprint Status | YES | Prioritize Stories 9.1 and 9.2 |
| Architecture | MINOR | Add announcements table, email templates |

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

Modify existing Epic 9 Story 9.2 with simplified scope and prioritize for current sprint.

### Rationale

1. **Simplified Scope:** Removing multi-channel and targeting reduces complexity by ~50%
2. **Clear Design:** Stitch mockup provides complete UI specification
3. **Existing Story:** Story 9.2 exists with comprehensive structure - just needs AC modification
4. **Prerequisite Ready:** Story 3.4 (Tenant Portal) is DONE
5. **Email System:** Story 9.1 needs to be prioritized as prerequisite

### Effort Estimate

| Story | Effort | Timeline |
|-------|--------|----------|
| 9.1 Email Notification System | Medium | 3-4 days |
| 9.2 Internal Announcements | Medium | 3-4 days |
| **Total** | — | **6-8 days** |

---

## 4. Detailed Change Proposals

### PRD Section 3.11.1 Modification

**File:** `docs/prd.md`
**Section:** 3.11.1 Announcement Management

**OLD:**
```markdown
#### 3.11.1 Announcement Management
- Building-wide announcements
- Targeted messaging
- Emergency broadcasts
- Maintenance notifications
- Event communications
```

**NEW:**
```markdown
#### 3.11.1 Internal Announcement Management
- Internal announcements for all tenants (no targeting)
- Rich text formatting with print/PDF support
- Template-based creation (Office Closure, Maintenance Schedule, Policy Update)
- Announcement expiry with auto-archive to history
- Dashboard widget showing active announcement count
- Email delivery to all tenants on publish
- Tenant portal announcement list (active only)
- Copy/duplicate existing announcements
- Multiple drafts supported simultaneously
```

---

### Story 9.2: Internal Announcement Management (REVISED)

**Epic:** Epic 9 (Communication & Notifications)
**PRD Reference:** Section 3.11.1

**Story Definition:**

```
As a property manager,
I want to create and publish internal announcements,
So that I can communicate important information to all tenants via email and website.
```

**Acceptance Criteria (REVISED):**

**1. Announcement Creation Form:**
- Title (required, max 200 chars)
- Message (required, rich text editor with: Bold, Italic, Underline, Lists, Headings, Tables, Images)
- Template selector (optional dropdown):
  - Office Closure Notice
  - Maintenance Schedule
  - Policy Update
- Expiry Date (required, date picker, must be future date)
- Attachment (optional, PDF, max 5MB)

**2. Copy/Duplicate Announcement:**
- "Copy" action on existing announcements
- Creates new draft with "[Copy] Original Title"
- Copies: title, message, template, attachment
- Does NOT copy: expiry date (must set new)
- Redirects to edit form for new draft

**3. Multiple Drafts Support:**
- Multiple announcements can exist in DRAFT status simultaneously
- Drafts list shows all unpublished announcements
- Each draft can be edited, published, or deleted independently

**4. Announcement Entity:**
- id (UUID)
- announcementNumber (unique, format: ANN-2025-0001)
- title, message (HTML)
- templateUsed (nullable enum: OFFICE_CLOSURE, MAINTENANCE_SCHEDULE, POLICY_UPDATE)
- expiresAt (datetime, required)
- status (enum: DRAFT, PUBLISHED, EXPIRED, ARCHIVED)
- publishedAt (timestamp, nullable)
- attachmentFilePath (nullable)
- createdBy (userId)
- createdAt, updatedAt timestamps

**5. Announcement Publishing:**
- "Publish" button on draft detail page
- On publish: status = PUBLISHED, publishedAt = now
- Email sent to ALL active tenants:
  - Subject: "Announcement: {title}"
  - Body: rendered message HTML
  - Attachment included if present
- Cannot edit published announcements (only archive/delete)

**6. Expiry Handling:**
- Scheduled job runs daily at midnight
- Announcements with expiresAt < now AND status = PUBLISHED → status = EXPIRED
- Expired announcements hidden from tenant portal
- Expired announcements visible in History tab (manager view)

**7. Announcement List Page (Manager View):**
- Route: /admin/announcements
- Tabs: Active | Drafts | History
- Active tab: PUBLISHED announcements not yet expired
- Drafts tab: DRAFT announcements (multiple allowed)
- History tab: EXPIRED and ARCHIVED announcements
- Table columns: Number, Title, Published Date, Expires, Status, Actions
- Actions: View, Edit (if draft), Copy, Archive, Delete, Print/Download PDF
- "Create New Announcement" button (top right)

**8. Print/PDF Support:**
- "Print Preview" button on announcement detail page
- "Download PDF" button
- PDF includes:
  - Company letterhead (from company profile - Story 2.8)
  - Announcement title and date
  - Full message body with formatting preserved
  - Professional layout suitable for physical distribution

**9. Dashboard Widget:**
- Admin dashboard shows "Announcements" card
- Displays count: "{n} Active Announcements"
- Click navigates to announcements list page
- Icon: campaign (Material Symbols)

**10. Tenant Portal View:**
- Route: /tenant/announcements (or dashboard section)
- Shows list of PUBLISHED (non-expired) announcements only
- List columns: Title, Date Published
- Click to view full announcement
- Download attachment if available
- Sorted by publishedAt DESC (newest first)

**11. API Endpoints:**
- POST /api/v1/announcements: Create announcement (draft)
- GET /api/v1/announcements: List all announcements (manager, with filters)
- GET /api/v1/announcements/{id}: Get announcement details
- PUT /api/v1/announcements/{id}: Update announcement (if draft)
- POST /api/v1/announcements/{id}/copy: Duplicate announcement as new draft
- PATCH /api/v1/announcements/{id}/publish: Publish announcement
- PATCH /api/v1/announcements/{id}/archive: Archive announcement
- DELETE /api/v1/announcements/{id}: Delete announcement
- GET /api/v1/announcements/{id}/pdf: Download PDF
- GET /api/v1/tenant/announcements: List active announcements for tenant
- GET /api/v1/dashboard/stats: Include announcementCount

**12. Email Templates:**
- Create announcement email template at: /resources/email-templates/announcement.html
- Template variables: {{title}}, {{message}}, {{companyName}}, {{publishDate}}
- Include company logo (from company profile)
- Include "View Online" link to tenant portal

**13. Database Migration:**
- V44__create_announcements_table.sql
- Indexes on status, expiresAt, createdBy

**14. Scheduled Jobs:**
- AnnouncementExpiryJob: Daily at midnight, expires past-due announcements

**15. RBAC:**
- SUPER_ADMIN, ADMIN, PROPERTY_MANAGER: Full CRUD
- FINANCE_MANAGER, MAINTENANCE_SUPERVISOR: Read-only
- TENANT: Read active announcements only (via tenant portal)
- VENDOR: No access

**16. Sidebar Navigation:**
- Add "Announcements" menu item under main navigation
- Icon: campaign (Material Symbols)
- Route: /admin/announcements

**17. Tests:**
- Backend: AnnouncementServiceTest (CRUD, copy, publish, expiry job)
- Frontend: Validation tests, component tests
- All existing tests must pass

**Prerequisites:**
- Story 9.1 (Email Notification System)
- Story 3.4 (Tenant Portal Dashboard) — DONE
- Story 2.8 (Company Profile) — for PDF letterhead

**Technical Notes:**
- Use Quill or TipTap for rich text editor
- Sanitize HTML input (DOMPurify) to prevent XSS
- Use iTextPDF (existing) for PDF generation
- Store attachments in S3: /uploads/announcements/{id}/
- Reference: docs/archive/stitch_building_maintenance_software/announcements_management_page/

---

### Sprint Status Update

**File:** `docs/sprint-artifacts/sprint-status.yaml`
**Section:** Epic 9

**OLD:**
```yaml
# Epic 9: Communication & Notifications (2 technical stories + 2 E2E stories)
epic-9: backlog
9-1-email-notification-system: backlog
9-2-announcement-management: backlog
```

**NEW:**
```yaml
# Epic 9: Communication & Notifications (2 technical stories + 2 E2E stories)
# NOTE: Stories 9.1-9.2 PRIORITIZED 2025-11-28 via correct-course SCP #6
# Internal Announcements: Simplified scope (email+web, all tenants, expiry, printable, copy, multi-draft)
epic-9: backlog
9-1-email-notification-system: backlog  # PRIORITIZED - Prerequisite for 9.2
9-2-internal-announcement-management: backlog  # PRIORITIZED - Simplified scope per SCP #6. Reference: Stitch announcements_management_page design.
```

---

## 5. Implementation Handoff

### Change Scope: MODERATE

Requires story modification and sprint prioritization.

### Recommended Implementation Sequence

1. **Story 9.1** (Email Notification System) — Foundation for email delivery
2. **Story 9.2** (Internal Announcements) — Depends on 9.1

### Handoff Responsibilities

| Role | Responsibility |
|------|----------------|
| **Scrum Master** | Update Epic 9 file, PRD section, sprint-status.yaml |
| **Developer** | Implement Stories 9.1 → 9.2 in sequence |

### Action Plan

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Approve this Sprint Change Proposal | User | **APPROVED** |
| 2 | Update PRD section 3.11.1 | SM | Pending |
| 3 | Update Epic 9 Story 9.2 with revised ACs | SM | Pending |
| 4 | Update sprint-status.yaml | SM | Pending |
| 5 | Draft Story 9.1 (if not already detailed) | SM | Pending |
| 6 | Implement Story 9.1 | Dev | Pending |
| 7 | Implement Story 9.2 | Dev | Pending |

### Success Criteria

- [ ] Announcement list page functional at /admin/announcements
- [ ] Create/Edit/Delete/Copy announcements working
- [ ] Multiple drafts can exist simultaneously
- [ ] Publish sends email to all active tenants
- [ ] Expiry job moves past-due announcements to EXPIRED
- [ ] Print/Download PDF working with company letterhead
- [ ] Dashboard widget shows active announcement count
- [ ] Tenant portal shows active announcements
- [ ] Sidebar navigation updated
- [ ] All tests passing (backend + frontend)

---

## 6. Approval

**Approved by:** Nata
**Date:** 2025-11-28
**Decision:** Proceed with simplified Internal Announcements (Epic 9 Story 9.2)

### Key Simplifications Approved:
- Email + Website only (no SMS, no in-app push)
- All tenants always (no targeting)
- No emergency broadcasts
- Expiry with auto-archive
- Printable/PDF support
- Dashboard widget
- Copy/duplicate announcements
- Multiple drafts allowed

---

*Generated by Correct Course Workflow*
*Scrum Master: Bob*
*Date: 2025-11-28*
