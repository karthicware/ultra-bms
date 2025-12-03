# Sprint Change Proposal: Parking Allocation Redesign

**SCP Number:** SCP-2025-12-02-parking-allocation
**Date:** 2025-12-02
**Requested By:** Nata (Product Owner)
**Priority:** P1 - High
**Status:** PENDING APPROVAL

---

## 1. Change Description

### Current Behavior
- **Quotation Create (Story 3.1):** User enters `parkingSpots` (integer 0-10) and `parkingFeePerSpot` (AED). Total parking = spots × fee.
- **Tenant Onboarding (Story 3.3):** Step 4 allows specifying `parkingSpots` (0-10), `parkingFeePerSpot`, `spotNumbers` (comma-separated text), and optional Mulkiya document upload.

### Requested Change
- **Tenant can avail only ONE parking spot** (not multiple)
- **Parking should be SELECTED from configured parking spots** (from Parking Management screens - Story 3.8)
- The parking spot dropdown should show only AVAILABLE spots for the selected property

### Business Rationale
- Simplifies parking allocation workflow
- Ensures parking inventory accuracy (no manual spot number entry)
- Prevents double-booking of parking spots
- Links allocations directly to the parking inventory system

---

## 2. Impact Analysis

### Stories Affected

| Story | Status | Impact Level | Description |
|-------|--------|--------------|-------------|
| **3.1 - Lead Management & Quotation** | ready-for-dev | HIGH | Quotation form parking fields need redesign |
| **3.3 - Tenant Onboarding** | done | HIGH | Step 4 (Parking Allocation) needs redesign |
| **3.8 - Parking Spot Inventory** | done | NONE | Already supports this - has API for available spots |
| **3.7 - Tenant Checkout** | done | LOW | May need verification (already releases spots) |

### Files Requiring Changes

#### Frontend - Quotation System
| File | Change Type | Description |
|------|-------------|-------------|
| `quotations/create/page.tsx` | MODIFY | Replace `parkingSpots`/`parkingFee` with parking spot dropdown |
| `lib/validations/quotations.ts` | MODIFY | Update schema: `parkingSpotId?: string` instead of `parkingSpots: number` |
| `types/quotations.ts` | MODIFY | Update `CreateQuotationRequest` interface |

#### Frontend - Tenant Onboarding
| File | Change Type | Description |
|------|-------------|-------------|
| `components/tenants/ParkingAllocationStep.tsx` | MODIFY | Replace numeric input with Select dropdown showing available spots |
| `lib/validations/tenant.ts` | MODIFY | Update `parkingAllocationSchema` |
| `types/tenant.ts` | MODIFY | Update parking-related types |

#### Backend (If needed)
| File | Change Type | Description |
|------|-------------|-------------|
| `Quotation.java` | MODIFY | Add `parkingSpotId` field, remove `parkingSpots`/`parkingFee` |
| `CreateQuotationRequest.java` | MODIFY | Update parking fields |
| Database migration | NEW | Migrate existing data if any quotations exist |

### Acceptance Criteria Changes

#### Story 3.1 - Quotation Form (AC3)
**Current:**
> parking spots (integer, default 0), parking fee per spot (decimal)

**Proposed:**
> Optional parking spot selection: dropdown showing AVAILABLE spots from `GET /api/v1/parking-spots/available?propertyId={id}`. Single spot selection only. When selected, `parkingFeePerSpot` field auto-populates with spot's `defaultFee` but remains **editable** (allows override). "No parking" option as default.

#### Story 3.3 - Parking Allocation Step (AC5)
**Current:**
> parkingSpots (integer, default 0, range 0-10), parkingFeePerSpot (decimal, default 0), spotNumbers (text input, comma-separated)

**Proposed:**
> Optional single parking spot selection via Select dropdown populated from `GET /api/v1/parking-spots/available?propertyId={id}`. Dropdown shows: spot number, default fee for each available spot. When selected: `parkingFeePerSpot` field auto-populates with spot's `defaultFee` but remains **editable** (allows override), Mulkiya upload zone appears. Skip/None option available. No manual spot number entry.

---

## 3. Implementation Approach

### Option A: Incremental (Recommended)
1. Update Quotation form first (smaller scope)
2. Update Tenant Onboarding Step 4
3. Verify checkout flow still works

**Pros:** Lower risk, can test each change independently
**Cons:** Two separate changes

### Option B: Batch
1. Update both forms simultaneously
2. Single testing cycle

**Pros:** Consistent behavior immediately
**Cons:** Larger change scope, higher risk

**Recommendation:** Option A (Incremental) - Start with Quotation form since Story 3.1 is still in development.

---

## 4. Technical Design

### UI Changes

#### Quotation Form - Parking Section
```
┌─────────────────────────────────────────────┐
│ Parking Allocation (Optional)               │
├─────────────────────────────────────────────┤
│ Select Parking Spot: [▼ None (No Parking)]  │
│                      ├─ None (No Parking)   │
│                      ├─ P-101 - AED 500/mo  │
│                      ├─ P-102 - AED 500/mo  │
│                      └─ G-15 - AED 750/mo   │
│                                             │
│ [Only shown if spot selected]               │
│ Parking Fee (AED): [  500  ] ← EDITABLE     │
│                    (Auto-filled from spot,  │
│                     can be overridden)      │
└─────────────────────────────────────────────┘
```

#### Tenant Onboarding Step 4
```
┌─────────────────────────────────────────────┐
│ Step 4: Parking Allocation (Optional)       │
├─────────────────────────────────────────────┤
│ Would you like to allocate a parking spot?  │
│                                             │
│ [Select Parking Spot ▼]                     │
│   ├─ Skip - No parking needed               │
│   ├─ P-101 (Available) - AED 500/mo         │
│   ├─ P-102 (Available) - AED 500/mo         │
│   └─ G-15 (Available) - AED 750/mo          │
│                                             │
│ [If spot selected:]                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Selected: P-101                         │ │
│ │ Parking Fee (AED): [  500  ] ← EDITABLE │ │
│ │                                         │ │
│ │ Mulkiya Document (Optional)             │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │   📄 Drop file or click to upload   │ │ │
│ │ │      PDF, JPG, PNG (max 5MB)        │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [← Back]                    [Skip] [Next →] │
└─────────────────────────────────────────────┘
```

### API Integration

**Existing Endpoint (Story 3.8):**
```
GET /api/v1/parking-spots/available?propertyId={propertyId}

Response:
{
  "content": [
    {
      "id": "uuid-1",
      "spotNumber": "P-101",
      "propertyId": "prop-1",
      "propertyName": "Building A",
      "defaultFee": 500.00,
      "status": "AVAILABLE"
    }
  ]
}
```

### Schema Changes

**Quotation Schema (New):**
```typescript
const createQuotationSchema = z.object({
  // ... existing fields ...
  parkingSpotId: z.string().uuid().optional().nullable(),
  // Remove: parkingSpots, parkingFee
});
```

**Tenant Parking Schema (New):**
```typescript
const parkingAllocationSchema = z.object({
  parkingSpotId: z.string().uuid().optional().nullable(),
  mulkiyaDocument: fileSchema.optional(),
});
```

---

## 5. Testing Requirements

### Unit Tests
- [ ] Quotation schema validates `parkingSpotId` as optional UUID
- [ ] Tenant parking schema validates single spot selection
- [ ] Total calculation works without parking (null spot)
- [ ] Total calculation includes parking fee when spot selected

### Integration Tests
- [ ] Parking dropdown shows only AVAILABLE spots for selected property
- [ ] When property changes, parking dropdown refreshes
- [ ] Selected spot shows correct fee
- [ ] Spot becomes ASSIGNED after tenant creation

### E2E Tests
- [ ] Create quotation without parking → success
- [ ] Create quotation with parking spot → fee included in total
- [ ] Tenant onboarding with parking selection → spot marked ASSIGNED
- [ ] Tenant checkout → spot released to AVAILABLE

---

## 6. Rollback Plan

If issues arise:
1. Revert frontend changes (dropdown → numeric input)
2. Backend changes are additive (parkingSpotId), old fields remain
3. No database migration needed if keeping backward compatibility

---

## 7. Estimated Effort

| Task | Estimate |
|------|----------|
| Quotation form changes | 2-3 hours |
| Tenant onboarding changes | 2-3 hours |
| Backend updates (if needed) | 1-2 hours |
| Testing | 2-3 hours |
| **Total** | **7-11 hours** |

---

## 8. Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Product Owner | Nata | PENDING | |
| Scrum Master | Bob (AI) | RECOMMEND APPROVAL | 2025-12-02 |
| Tech Lead | | PENDING | |

---

## 9. Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-02 | SM Agent (Bob) | Initial SCP created |

---

**Next Steps (After Approval):**
1. Create implementation tasks
2. Update Story 3.1 AC3 (Quotation form)
3. Update Story 3.3 AC5 (Parking allocation step)
4. Implement changes
5. Run full test suite
6. Deploy
