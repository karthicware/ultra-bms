# Sprint Change Proposal: Quotation Document Upload & Lead Identity Removal

**SCP ID:** SCP-2025-12-04-quotation-document-upload
**Date:** December 4, 2025
**Author:** Bob (Scrum Master)
**Status:** APPROVED
**Affected Epic:** Epic 3 - Tenant Management Portal
**Affected Story:** 3-1 Lead Management and Quotation System

---

## Executive Summary

This SCP addresses a requirement refinement where identity document collection (Emirates ID, Passport) needs to move from the Lead form to the Quotation form as **actual document uploads** with metadata. Additionally, the Quotation form needs UI improvements including dynamic unit selection based on property and removal of the Stay Type field.

---

## Change Details

### Changes Requested

| # | Change | Location | Priority |
|---|--------|----------|----------|
| 1 | Add mandatory document upload (Emirates ID + Passport) with metadata | Quotation Create/Edit | HIGH |
| 2 | Dynamic Unit dropdown based on Property selection | Quotation Create/Edit | HIGH |
| 3 | No default property selection | Quotation Create/Edit | MEDIUM |
| 4 | Remove Stay Type field | Quotation Create/Edit | MEDIUM |
| 5 | Dynamic Parking Spot dropdown based on Property selection | Quotation Create/Edit | DONE (already exists) |
| 6 | Remove Identity Documents section from Leads | Leads Create/Edit | HIGH |

### Trigger & Context

- **Trigger Type:** Requirement refinement during implementation
- **Discovery:** User feedback on Create Quotation workflow
- **Root Cause:** Original design placed identity text fields on Lead; business requires document uploads on Quotation

---

## Impact Analysis

### Files Requiring Changes

#### Frontend - Leads (Remove Identity Documents)

| File | Change | Lines |
|------|--------|-------|
| `frontend/src/app/(dashboard)/leads/create/page.tsx` | Remove "Identity Documents" Card section | 225-358 |
| `frontend/src/app/(dashboard)/leads/[id]/edit/page.tsx` | Remove "Identity Documents" Card section | TBD |
| `frontend/src/lib/validations/leads.ts` | Make emiratesId, passportNumber, passportExpiryDate, homeCountry optional | TBD |

#### Frontend - Quotations (Add Documents, Fix Unit, Remove Stay Type)

| File | Change | Lines |
|------|--------|-------|
| `frontend/src/app/(dashboard)/quotations/create/page.tsx` | Add document upload section | NEW |
| `frontend/src/app/(dashboard)/quotations/create/page.tsx` | Dynamic unit dropdown based on propertyId | 342-362 |
| `frontend/src/app/(dashboard)/quotations/create/page.tsx` | Remove Stay Type field | 364-388 |
| `frontend/src/app/(dashboard)/quotations/create/page.tsx` | No default propertyId | 83 |
| `frontend/src/lib/validations/quotations.ts` | Add document validation, remove stayType | TBD |
| `frontend/src/types/quotations.ts` | Add document types | TBD |

#### Backend (If Needed)

| File | Change |
|------|--------|
| Quotation entity | Add document relationships (optional - can use S3 metadata) |
| Lead entity | Make identity fields nullable |

### Services Available

- `getAvailableUnits(propertyId)` - Already exists in `units.service.ts`
- `getAvailableParkingSpots(propertyId)` - Already exists in `parking.service.ts`
- S3 document upload - Already implemented in Epic 1

---

## Implementation Tasks

### Task 1: Remove Identity Documents from Lead Form
**Priority:** HIGH
**Effort:** Small
**Files:**
- `frontend/src/app/(dashboard)/leads/create/page.tsx`
- `frontend/src/app/(dashboard)/leads/[id]/edit/page.tsx`
- `frontend/src/lib/validations/leads.ts`

**Actions:**
1. Remove the entire "Identity Documents" Card component (emiratesId, passportNumber, passportExpiryDate, homeCountry fields)
2. Update Zod schema to make these fields optional (for backward compatibility)
3. Keep homeCountry field optional in Lead Details section if useful

### Task 2: Add Document Upload to Quotation Form
**Priority:** HIGH
**Effort:** Medium
**Files:**
- `frontend/src/app/(dashboard)/quotations/create/page.tsx`
- `frontend/src/lib/validations/quotations.ts`
- `frontend/src/types/quotations.ts`

**Actions:**
1. Add new "Identity Documents" Card section after Property Details
2. Add Emirates ID upload field (mandatory)
   - Front side image
   - Back side image
   - Emirates ID number (text field)
   - Expiry date
3. Add Passport upload field (mandatory)
   - Main page image
   - Passport number (text field)
   - Expiry date
   - Nationality/Home country
4. Use existing S3 upload pattern from document management
5. Update Zod schema with document validation

### Task 3: Make Unit Dropdown Dynamic
**Priority:** HIGH
**Effort:** Small
**Files:**
- `frontend/src/app/(dashboard)/quotations/create/page.tsx`

**Actions:**
1. Add state for available units: `const [availableUnits, setAvailableUnits] = useState<Unit[]>([])`
2. Add loading state: `const [loadingUnits, setLoadingUnits] = useState(false)`
3. Add useEffect to watch `propertyId`:
```typescript
useEffect(() => {
  if (watchedPropertyId) {
    setLoadingUnits(true);
    getAvailableUnits(watchedPropertyId)
      .then(setAvailableUnits)
      .catch(() => setAvailableUnits([]))
      .finally(() => setLoadingUnits(false));
    // Reset unit selection when property changes
    form.setValue('unitId', '');
  } else {
    setAvailableUnits([]);
  }
}, [watchedPropertyId, form]);
```
4. Update unit SelectContent to map over availableUnits

### Task 4: Remove Stay Type Field
**Priority:** MEDIUM
**Effort:** Small
**Files:**
- `frontend/src/app/(dashboard)/quotations/create/page.tsx`
- `frontend/src/lib/validations/quotations.ts`

**Actions:**
1. Remove the stayType FormField (lines 364-388)
2. Remove stayType from defaultValues
3. Remove stayType from Zod schema
4. Remove StayType import if no longer used

### Task 5: No Default Property Selection
**Priority:** MEDIUM
**Effort:** Trivial
**Files:**
- `frontend/src/app/(dashboard)/quotations/create/page.tsx`

**Actions:**
1. Ensure `propertyId` default value is empty string `''`
2. Update placeholder text if needed

---

## Acceptance Criteria Updates for Story 3-1

### Remove from Lead Form AC:
- ~~Emirates ID field with format validation~~
- ~~Passport number field~~
- ~~Passport expiry date picker~~
- ~~Home country field~~

### Add to Quotation Form AC:
- [ ] Emirates ID document upload (front + back images) - mandatory
- [ ] Emirates ID number text field with format validation
- [ ] Emirates ID expiry date picker
- [ ] Passport document upload (main page image) - mandatory
- [ ] Passport number text field
- [ ] Passport expiry date picker
- [ ] Nationality/Home country field
- [ ] Unit dropdown dynamically populated based on selected property
- [ ] Unit dropdown shows only AVAILABLE units
- [ ] No default property selected on form load
- [ ] Stay Type field removed

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing leads have identity data | Low | Low | Keep fields in backend, make optional |
| Document upload fails | Low | Medium | Use existing S3 pattern, proper error handling |
| Unit service unavailable | Low | Low | Show loading state, disable submit until loaded |

---

## Approval & Handoff

**Approved by:** Nata (User)
**Approval Date:** December 4, 2025

### Handoff Plan

| Role | Responsibility |
|------|----------------|
| Dev Agent | Implement all 5 tasks |
| SM (Bob) | Update Story 3-1 acceptance criteria |
| Tester | Verify document upload, unit selection |

---

## Implementation Notes

- Use existing `FileUpload` or `DocumentUpload` components if available
- Follow existing S3 upload pattern from document management
- Ensure mobile-responsive document upload UI
- Add proper loading states for async operations
- Test with various file types and sizes
