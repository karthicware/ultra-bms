# Sprint Change Proposal: Quotation View/Edit Fixes and Pipeline Redesign

**SCP ID:** SCP-2025-12-06-QVE
**Date:** 2025-12-06
**Status:** APPROVED FOR IMPLEMENTATION
**Priority:** HIGH
**Requested By:** Nata
**Epic:** 3 - Tenant Management Portal

---

## Executive Summary

This SCP addresses multiple issues in the Quotation workflow and Lead pipeline:
1. Property/Unit details not saving during edit
2. Missing Cancel button in Create/Edit modes
3. Display Payment Mode instead of Due Date in View page
4. Incorrect cheque count in Payment Schedule header
5. Remove card borders in Quotation View page (only)
6. Reduce spacing in Quotation View page cards (only)
7. Redesign Lead pipeline statuses

---

## Change Details

### Change 1: Fix Property/Unit Save in Edit Mode

**Problem:** In Edit Quotation page, Step 1 property and unit selection changes are not persisted to the database.

**Root Cause:** The `EditQuotationForm` component properly sets form values but the update payload construction may not be correctly including the changed propertyId/unitId.

**Solution:**
- File: `frontend/src/app/(dashboard)/quotations/[id]/edit/page.tsx`
- Ensure propertyId and unitId are always included in the update payload
- Add logging to verify payload construction

**Impact:** Frontend only

---

### Change 2: Add Cancel Button to Create and Edit Pages

**Problem:** No Cancel button in quotation Create and Edit form footers.

**Solution:**
- File: `frontend/src/app/(dashboard)/quotations/create/page.tsx`
- File: `frontend/src/app/(dashboard)/quotations/[id]/edit/page.tsx`
- Add Cancel button in the form footer next to Previous button
- Cancel should navigate back using `router.back()` or to `/leads`

**Implementation:**
```tsx
// In form footer, add before Previous button:
<Button
  type="button"
  variant="ghost"
  onClick={() => router.back()}
  className="rounded-xl"
>
  Cancel
</Button>
```

**Impact:** Frontend only

---

### Change 3: Display Payment Mode Instead of Due Date

**Problem:** View Quotation page shows "Due Date" which has no functionality. Should show Payment Mode (Cash/Cheque) instead.

**Solution:**
- File: `frontend/src/app/(dashboard)/quotations/[id]/page.tsx`
- In the Financial Summary card, add Payment Mode display
- Remove any "Due Date" references if present
- Show the `firstMonthPaymentMethod` value with appropriate icon

**Implementation:**
```tsx
// Add to Financial Summary card after "Payment Schedule" line:
<div className="flex items-center justify-between text-xs text-muted-foreground">
  <span>First Payment Mode</span>
  <span className="flex items-center gap-1">
    {quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
      <>
        <Banknote className="h-3 w-3 text-green-600" />
        Cash
      </>
    ) : (
      <>
        <CreditCard className="h-3 w-3 text-blue-600" />
        Cheque
      </>
    )}
  </span>
</div>
```

**Impact:** Frontend only

---

### Change 4: Fix Cheque Count in Payment Schedule Header

**Problem:** Payment Schedule header shows total payment count (including cash) instead of only cheques.

**Current Code (line 426-430 in page.tsx):**
```tsx
<Badge variant="secondary" className="ml-2 text-xs">
  {quotation.numberOfCheques} Cheques
</Badge>
```

**Solution:**
- Calculate actual cheque count by excluding first payment if it's cash
- File: `frontend/src/app/(dashboard)/quotations/[id]/page.tsx`

**Implementation:**
```tsx
// Calculate actual cheque count
const actualChequeCount = quotation.firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH
  ? (quotation.numberOfCheques || 0) - 1
  : (quotation.numberOfCheques || 0);

// In header:
<Badge variant="secondary" className="ml-2 text-xs">
  {actualChequeCount} {actualChequeCount === 1 ? 'Cheque' : 'Cheques'}
</Badge>
```

**Impact:** Frontend only

---

### Change 5: Remove Card Borders in Quotation View Page

**Problem:** Card borders in Quotation View page don't match application theme.

**Solution:**
- File: `frontend/src/app/(dashboard)/quotations/[id]/page.tsx` ONLY
- Change Card components from `border shadow-sm` to `shadow-sm` only
- This change is ONLY for the quotation view page, not global

**Current:**
```tsx
<Card className="border shadow-sm">
```

**Updated:**
```tsx
<Card className="shadow-sm">
```

**Impact:** Frontend only (Quotation View page)

---

### Change 6: Reduce Spacing in Quotation View Page Cards

**Problem:** Too much space between details in card contents on Quotation View page.

**Solution:**
- File: `frontend/src/app/(dashboard)/quotations/[id]/page.tsx` ONLY
- Reduce CardContent padding from `p-4` to `p-3`
- Reduce grid gap from `gap-4` to `gap-3`

**Current:**
```tsx
<CardContent className="p-4">
  <div className="grid grid-cols-2 gap-4">
```

**Updated:**
```tsx
<CardContent className="p-3">
  <div className="grid grid-cols-2 gap-3">
```

**Impact:** Frontend only (Quotation View page)

---

### Change 7: Redesign Lead Pipeline Statuses

**Problem:** Current pipeline has too many statuses. Simplify to: NEW_LEAD → QUOTATION_SENT → CONVERTED

**Current Pipeline:**
```
NEW → CONTACTED → QUOTATION_SENT → ACCEPTED → CONVERTED → LOST
```

**New Pipeline:**
```
NEW_LEAD → QUOTATION_SENT → CONVERTED → LOST
```

**Files to Update:**

| File | Change |
|------|--------|
| `backend/src/main/java/com/ultrabms/entity/Lead.java` | Update `LeadStatus` enum |
| `frontend/src/types/leads.ts` | Update `LeadStatus` enum |
| `backend/src/main/java/com/ultrabms/service/impl/LeadServiceImpl.java` | Update status transitions |
| `backend/src/main/java/com/ultrabms/service/impl/QuotationServiceImpl.java` | Update status transitions |
| `backend/src/main/resources/db/migration/V64__simplify_lead_pipeline_status.sql` | Data migration |
| `frontend/src/app/(dashboard)/leads/page.tsx` | Update status badges |
| `frontend/src/app/(dashboard)/leads/[id]/page.tsx` | Update status display |

**Database Migration (V64):**
```sql
-- Migrate existing lead statuses to simplified pipeline
-- NEW_LEAD (NEW or CONTACTED become NEW_LEAD)
-- QUOTATION_SENT (QUOTATION_SENT or ACCEPTED become QUOTATION_SENT)
-- CONVERTED stays CONVERTED
-- LOST stays LOST

UPDATE leads SET status = 'NEW_LEAD' WHERE status IN ('NEW', 'CONTACTED');
UPDATE leads SET status = 'QUOTATION_SENT' WHERE status = 'ACCEPTED';
-- QUOTATION_SENT already matches, no change needed
-- CONVERTED already matches, no change needed
-- LOST already matches, no change needed
```

**Backend Enum Update:**
```java
public enum LeadStatus {
    NEW_LEAD,
    QUOTATION_SENT,
    CONVERTED,
    LOST
}
```

**Frontend Enum Update:**
```typescript
export enum LeadStatus {
  NEW_LEAD = 'NEW_LEAD',
  QUOTATION_SENT = 'QUOTATION_SENT',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}
```

**Impact:** Frontend, Backend, Database (Breaking Change)

---

## Implementation Order

1. **Phase 1 - Non-Breaking Frontend Fixes (Immediate)**
   - Change 2: Add Cancel buttons
   - Change 3: Display Payment Mode
   - Change 4: Fix cheque count
   - Change 5: Remove card borders (View page only)
   - Change 6: Reduce spacing (View page only)

2. **Phase 2 - Edit Form Fix (Immediate)**
   - Change 1: Fix property/unit save

3. **Phase 3 - Pipeline Redesign (Coordinated)**
   - Change 7: Database migration first
   - Then backend enum/logic changes
   - Finally frontend enum/UI changes

---

## Testing Checklist

- [ ] Edit Quotation: Change property and unit, save, verify saved correctly
- [ ] Create Quotation: Verify Cancel button navigates back
- [ ] Edit Quotation: Verify Cancel button navigates back
- [ ] View Quotation: Payment Mode shows Cash or Cheque correctly
- [ ] View Quotation: Cheque count excludes cash payment
- [ ] View Quotation: Cards have no visible borders
- [ ] View Quotation: Card contents have tighter spacing
- [ ] Lead list: Shows NEW_LEAD, QUOTATION_SENT, CONVERTED, LOST statuses
- [ ] Lead pipeline: Status transitions work correctly
- [ ] Existing leads: Migrated to correct new statuses

---

## Rollback Plan

- Changes 1-6: Frontend-only, can be reverted via git
- Change 7: Database migration is irreversible; would need reverse migration to restore old statuses

---

## Approval

**Approved for Implementation:** Yes
**Date:** 2025-12-06
**Approver:** Nata (Product Owner)

---

*Generated by Scrum Master Bob*
