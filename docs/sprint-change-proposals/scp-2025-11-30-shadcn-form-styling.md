# Sprint Change Proposal: Shadcn-Studio Form/Input Styling

**Date:** 2025-11-30
**Requested By:** Nata
**Type:** UI Enhancement / Technical Debt
**Scope:** Moderate

---

## Section 1: Issue Summary

### Problem Statement
Apply consistent shadcn-studio styled form components with icons, proper spacing, and modern form patterns across the entire application. Currently, forms use inconsistent patterns - some use the old `FormLabel`/`FormDescription` pattern while others have been updated to use `Label` with icons.

### Context
- **Reference Implementation:** `frontend/src/app/(dashboard)/properties/[id]/edit/page.tsx` - Already fully styled
- **Discovery:** User requested standardization to improve UX consistency
- **Evidence:** Multiple form styles exist - some with icons, some without; inconsistent spacing and helper text styling

### Change Category
- [x] UX Enhancement - Better visual consistency and accessibility
- [x] Technical Debt - Standardizing component patterns
- [ ] New Requirement
- [ ] Technical Limitation

---

## Section 2: Impact Analysis

### Epic Impact Assessment

**Current Epic Status:** N/A - This is a cross-cutting UI enhancement affecting all epics

**Epics Affected:**
| Epic | Impact | Notes |
|------|--------|-------|
| Epic 2 (Auth/User) | Low | Settings pages need updates |
| Epic 3 (Tenant) | High | Onboarding wizard (7 steps), lead forms, quotations |
| Epic 4 (Maintenance) | Medium | Work order forms and dialogs |
| Epic 5 (Vendor) | Medium | Vendor forms and management |
| Epic 6 (Financial) | High | Invoice, expense, PDC forms |
| Epic 7 (Asset/Compliance) | Medium | Asset, document, compliance forms |
| Epic 8 (Dashboard) | None | No forms |
| Epic 9 (Communication) | Low | Announcement forms |

### Epic Changes Needed
- No epic scope changes required
- No new stories needed
- This is an enhancement to existing implementations

---

## Section 3: Artifact Conflict Analysis

### PRD Conflicts: None
- Does not affect functional requirements
- Enhances user experience (alignment with PRD quality goals)
- MVP scope unchanged

### Architecture Conflicts: None
- Uses existing shadcn/ui components
- Icons from lucide-react (already in stack)
- No new dependencies required

### UI/UX Specifications: Beneficial
- Improves form consistency across all modules
- Better accessibility with visual icons
- Clear required field indicators
- Consistent helper text styling

---

## Section 4: Recommended Path Forward

### Selected Approach: Direct Adjustment

**Effort Estimate:** Medium (40-50 files to update)
**Risk Level:** Low (visual-only changes, no logic changes)
**Timeline Impact:** None (can be done incrementally)

### Rationale
1. Changes are purely visual/cosmetic - no business logic affected
2. Reference implementation already exists and is proven
3. Pattern is well-defined and documented
4. Can be done file-by-file without breaking functionality
5. No rollback needed - existing forms still work

---

## Section 5: Detailed Change Proposals

### Files Requiring Updates

#### Category A: Page-Level Forms (24 files)

| File | Priority | Fields | Status |
|------|----------|--------|--------|
| `leads/create/page.tsx` | High | 10+ | Old Pattern |
| `tenants/create/page.tsx` | High | Wizard | Old Pattern |
| `quotations/create/page.tsx` | High | 8+ | Old Pattern |
| `properties/create/page.tsx` | High | 8+ | Old Pattern |
| `invoices/new/page.tsx` | High | 10+ | Old Pattern |
| `expenses/new/page.tsx` | High | 8+ | Old Pattern |
| `expenses/[id]/edit/page.tsx` | High | 8+ | Old Pattern |
| `pdc/new/page.tsx` | High | 6+ | Old Pattern |
| `assets/new/page.tsx` | Medium | 10+ | Old Pattern |
| `assets/[id]/edit/page.tsx` | Medium | 10+ | Old Pattern |
| `announcements/new/page.tsx` | Medium | 4+ | Old Pattern |
| `documents/[id]/edit/page.tsx` | Medium | 4+ | Old Pattern |
| `property-manager/pm-schedules/new/page.tsx` | Medium | 6+ | Old Pattern |
| `property-manager/pm-schedules/[id]/edit/page.tsx` | Medium | 6+ | Old Pattern |
| `property-manager/work-orders/new/page.tsx` | Medium | 8+ | Old Pattern |
| `property-manager/vendors/new/page.tsx` | Medium | 10+ | Old Pattern |
| `property-manager/vendors/[id]/edit/page.tsx` | Medium | 10+ | Old Pattern |
| `property-manager/compliance/requirements/new/page.tsx` | Low | 6+ | Old Pattern |
| `property-manager/compliance/requirements/[id]/edit/page.tsx` | Low | 6+ | Old Pattern |
| `property-manager/compliance/violations/new/page.tsx` | Low | 6+ | Old Pattern |
| `property-manager/compliance/violations/[id]/edit/page.tsx` | Low | 6+ | Old Pattern |
| `property-manager/compliance/inspections/new/page.tsx` | Low | 6+ | Old Pattern |
| `tenant/requests/new/page.tsx` | Medium | 6+ | Old Pattern |

#### Category B: Settings Pages (9 files)

| File | Priority | Fields | Status |
|------|----------|--------|--------|
| `settings/profile/page.tsx` | High | 4+ | Partial |
| `settings/company/page.tsx` | High | 12+ | Old Pattern |
| `settings/bank-accounts/page.tsx` | Medium | Via Modal | Check Modal |
| `settings/notifications/page.tsx` | Low | Toggles | N/A |
| `settings/notifications/settings/page.tsx` | Low | Toggles | N/A |
| `settings/security/page.tsx` | Low | 2+ | Old Pattern |
| `settings/appearance/page.tsx` | Low | 1 | N/A |

#### Category C: Component Forms & Modals (15+ files)

| File | Priority | Status |
|------|----------|--------|
| `components/properties/UnitFormModal.tsx` | High | Old Pattern |
| `components/parking/ParkingSpotFormModal.tsx` | High | Old Pattern |
| `components/bank-accounts/BankAccountFormModal.tsx` | High | Old Pattern |
| `components/invoices/PaymentRecordForm.tsx` | Medium | Old Pattern |
| `components/maintenance/MaintenanceRequestForm.tsx` | Medium | Old Pattern |
| `components/maintenance/FeedbackForm.tsx` | Medium | Old Pattern |
| `components/vendors/VendorForm.tsx` | Medium | Old Pattern |
| `components/work-orders/AssignmentDialog.tsx` | Low | Check |
| `components/work-orders/ReassignmentDialog.tsx` | Low | Check |
| `components/work-orders/ProgressUpdateDialog.tsx` | Low | Check |
| `components/work-orders/StartWorkDialog.tsx` | Low | Check |
| `components/work-orders/MarkCompleteDialog.tsx` | Low | Check |
| `components/expenses/ExpensePaymentDialog.tsx` | Low | Check |
| `components/assets/AssetStatusDialog.tsx` | Low | Check |
| `components/assets/AssetDocumentUploadDialog.tsx` | Low | Check |

#### Category D: Tenant Onboarding Steps (6 files)

| File | Priority | Fields | Status |
|------|----------|--------|--------|
| `components/tenants/PersonalInfoStep.tsx` | High | 10+ | Old Pattern |
| `components/tenants/LeaseInfoStep.tsx` | High | 8+ | Old Pattern |
| `components/tenants/RentBreakdownStep.tsx` | High | 6+ | Old Pattern |
| `components/tenants/ParkingAllocationStep.tsx` | Medium | 4+ | Old Pattern |
| `components/tenants/PaymentScheduleStep.tsx` | Medium | 4+ | Old Pattern |
| `components/tenants/DocumentUploadStep.tsx` | Medium | 4+ | Old Pattern |

---

## Section 6: Implementation Pattern

### Before (Old Pattern)
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email *</FormLabel>
      <FormControl>
        <Input placeholder="email@example.com" {...field} />
      </FormControl>
      <FormDescription>Your contact email</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### After (New Pattern)
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem className="space-y-2">
      <Label htmlFor="email" className="flex items-center gap-1">
        Email <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MailIcon className="size-4" />
        </div>
        <FormControl>
          <Input id="email" className="pl-9" placeholder="email@example.com" {...field} />
        </FormControl>
      </div>
      <p className="text-muted-foreground text-xs">Your contact email</p>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Icon Mapping Reference
| Field Type | Icon | Import |
|------------|------|--------|
| Name/Title | Building2, FileTextIcon | lucide-react |
| Address/Location | MapPinIcon | lucide-react |
| Email | MailIcon | lucide-react |
| Phone | PhoneIcon | lucide-react |
| User/Person | UserIcon | lucide-react |
| Date/Year | CalendarIcon | lucide-react |
| Number/Count | HashIcon | lucide-react |
| Money/Amount | DollarSignIcon, BanknoteIcon | lucide-react |
| Area/Size | RulerIcon, SquareIcon | lucide-react |
| Description/Notes | FileTextIcon, MessageSquareIcon | lucide-react |
| Search | SearchIcon | lucide-react |
| Password | LockIcon, KeyIcon | lucide-react |
| URL/Link | LinkIcon, GlobeIcon | lucide-react |
| Tags/Categories | TagIcon, SparklesIcon | lucide-react |
| Percentage | PercentIcon | lucide-react |

---

## Section 7: Implementation Handoff

### Scope Classification: Moderate
Direct implementation by development team with no backlog reorganization needed.

### Route To: Development Team (Dev Agent)

### Deliverables
1. Updated form files following the new pattern
2. Consistent icon usage per field type
3. Proper spacing (space-y-2 for items, space-y-6 for sections)
4. Required field indicators (red asterisk)
5. Helper text using `text-muted-foreground text-xs`

### Implementation Order
1. **Phase 1 (High Priority):** Lead, tenant, property, invoice, expense forms
2. **Phase 2 (Medium Priority):** Work orders, vendors, assets, PDC
3. **Phase 3 (Low Priority):** Compliance, settings, dialogs

### Acceptance Criteria
- [ ] All form inputs have appropriate icons
- [ ] Required fields show red asterisk indicator
- [ ] Consistent spacing across all forms
- [ ] Helper text uses `text-muted-foreground text-xs` styling
- [ ] Select dropdowns with icons where applicable
- [ ] Textarea fields have top-aligned icons
- [ ] Number inputs with units show suffix text (e.g., "sq ft", "%", "AED")
- [ ] No visual regressions in existing functionality

### Success Criteria
- All 50+ form files updated to new pattern
- Frontend build passes
- All existing tests pass
- Visual consistency across application

---

## Checklist Status Summary

| Section | Status |
|---------|--------|
| 1. Understand Trigger | [x] Done |
| 2. Epic Impact | [x] Done |
| 3. Artifact Conflicts | [x] Done |
| 4. Path Forward | [x] Done - Direct Adjustment |
| 5. Proposal Components | [x] Done |
| 6. Final Review | [x] Done - APPROVED |

---

## Approval Record

**Status:** ✅ APPROVED
**Approved By:** Nata
**Approval Date:** 2025-11-30
**Conditions:** None

---

## Implementation Handoff

**Routed To:** Development Team (Dev Agent)
**Handoff Date:** 2025-11-30
**Priority:** Normal - Can be implemented incrementally

### Next Steps for Dev Team:
1. Use `*dev-story` workflow or direct implementation
2. Follow the pattern from `frontend/src/app/(dashboard)/properties/[id]/edit/page.tsx`
3. Work through files in priority order (High → Medium → Low)
4. Run `npm run build` after each batch to verify no regressions
5. Commit changes with message referencing this SCP

---

**Generated by:** Bob (SM Agent)
**Date:** 2025-11-30
