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
