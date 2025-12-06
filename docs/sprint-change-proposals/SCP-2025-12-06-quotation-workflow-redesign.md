# Sprint Change Proposal: Quotation Workflow Redesign

**Reference:** SCP-2025-12-06-quotation-workflow-redesign
**Date:** 2025-12-06
**Status:** APPROVED
**Priority:** High

---

## 1. Summary

Refine the lead-to-tenant conversion workflow to:
1. Enforce 1:1 relationship between Lead and Quotation
2. Add cheque breakdown functionality in Quotation Step 3
3. Create printable quotation view (1-page) with header/footer placeholders
4. Remove "Create New Tenant" button from Tenant page
5. Auto-populate ALL tenant data (personal + financial) during conversion from accepted quotation
6. Display appropriate file type icons for document links (PDF/Word/Image)

---

## 2. Business Justification

- Property managers need to present quotations to customers in person (printable view critical)
- Cheque breakdown at quotation stage enables accurate financial planning and PDC management
- Single entry point (Lead conversion) ensures proper data flow and audit trail
- Full auto-population reduces data entry errors and speeds up onboarding

---

## 3. Detailed Changes

### 3.1 Database/Entity Changes

```sql
-- Enforce 1:1 relationship
ALTER TABLE quotations ADD CONSTRAINT uk_quotation_lead_id UNIQUE (lead_id);

-- Add cheque breakdown fields
ALTER TABLE quotations ADD COLUMN number_of_cheques INTEGER DEFAULT 1;
ALTER TABLE quotations ADD COLUMN first_month_payment_method VARCHAR(20) DEFAULT 'CHEQUE';
ALTER TABLE quotations ADD COLUMN cheque_breakdown JSONB;
-- cheque_breakdown format: [{"chequeNumber": 1, "amount": 5000, "dueDate": "2025-02-01"}, ...]
```

### 3.2 Backend Changes

| File | Change |
|------|--------|
| `Quotation.java` | Add fields: `numberOfCheques`, `firstMonthPaymentMethod`, `chequeBreakdown` |
| `CreateQuotationRequest.java` | Add validation for new fields, cheque split calculation |
| `QuotationServiceImpl.java` | Auto-calculate cheque breakdown when yearly payment entered |
| `TenantServiceImpl.java` | Map ALL lead + quotation data to tenant during conversion |

### 3.3 Frontend Changes

| File | Change |
|------|--------|
| `frontend/src/types/quotations.ts` | Add cheque breakdown types |
| `frontend/src/app/(dashboard)/quotations/create/page.tsx` | Add Step 3 cheque breakdown section |
| `frontend/src/app/(dashboard)/quotations/[id]/page.tsx` | Add "Print View" button |
| `frontend/src/components/quotations/QuotationPrintView.tsx` | NEW: 1-page printable layout |
| `frontend/src/app/(dashboard)/tenants/page.tsx` | REMOVE "Add Tenant" button |
| `frontend/src/components/common/DocumentLink.tsx` | NEW: Icon-based document link component |
| `frontend/src/lib/validations/quotations.ts` | Add cheque breakdown validation |

---

## 4. UI/UX Specifications (Frontend Design)

### 4.1 Quotation Step 3 — Cheque Breakdown

**Aesthetic Direction:** Refined, utilitarian with subtle warmth (matches existing terracotta/copper theme)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ PAYMENT BREAKDOWN                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                             │
│ Yearly Rent Amount                                          │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ AED ▎ 60,000                                            ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Number of Cheques          First Month Payment              │
│ ┌─────────────────┐        ┌────────────────────────────┐  │
│ │ 12 ▾           │         │ ○ Cash    ● Cheque        │  │
│ └─────────────────┘        └────────────────────────────┘  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │  Cheque Schedule                              Auto-Split ││
│ │ ─────────────────────────────────────────────────────── ││
│ │  #  │  Due Date      │  Amount                         ││
│ │ ─────────────────────────────────────────────────────── ││
│ │  1  │  01 Feb 2025   │  AED 5,000                      ││
│ │  2  │  01 Mar 2025   │  AED 5,000                      ││
│ │  3  │  01 Apr 2025   │  AED 5,000                      ││
│ │  ... (scrollable)                                       ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Design Tokens:**
- Card: `rounded-2xl border border-muted bg-muted/20 p-6`
- Table: `rounded-xl border bg-card overflow-hidden`
- Header row: `bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground`
- Data rows: `hover:bg-muted/30 transition-colors`

### 4.2 Quotation Print View

**Aesthetic Direction:** Clean editorial / invoice style

**Layout (A4 portrait):**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [HEADER PLACEHOLDER - Company Logo & Address]          ││
│  │ Future enhancement: configurable per company           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  QUOTATION                                     Q-2025-0042  │
│  ════════════════════════════════════════════════════════  │
│                                                             │
│  Prepared For:                      Date: 06 Dec 2025      │
│  John Smith                         Valid Until: 13 Dec    │
│  john.smith@email.com                                      │
│  +971 50 123 4567                                          │
│                                                             │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  PROPERTY DETAILS                                          │
│  Property: Al Barsha Heights                               │
│  Unit: 1204 • 2 Bedroom                                    │
│  Parking: P-042                                            │
│                                                             │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  FINANCIAL BREAKDOWN                                       │
│  ┌──────────────────────────────────┬────────────────────┐ │
│  │ Monthly Rent                     │      AED 5,000     │ │
│  │ Service Charges                  │        AED 500     │ │
│  │ Parking Fee                      │        AED 300     │ │
│  ├──────────────────────────────────┼────────────────────┤ │
│  │ Security Deposit                 │     AED 10,000     │ │
│  │ Admin Fee                        │        AED 500     │ │
│  ├══════════════════════════════════╪════════════════════┤ │
│  │ TOTAL FIRST PAYMENT              │     AED 16,300     │ │
│  └──────────────────────────────────┴────────────────────┘ │
│                                                             │
│  CHEQUE SCHEDULE (12 cheques)                              │
│  ┌────┬──────────────┬────────────────────────────────────┐│
│  │ #  │ Due Date     │ Amount                             ││
│  ├────┼──────────────┼────────────────────────────────────┤│
│  │ 1  │ 01 Feb 2025  │ AED 5,000 (Cash/Cheque)            ││
│  │ 2  │ 01 Mar 2025  │ AED 5,000                          ││
│  │ 3  │ 01 Apr 2025  │ AED 5,000                          ││
│  │... │              │                                    ││
│  └────┴──────────────┴────────────────────────────────────┘│
│                                                             │
│  TERMS & CONDITIONS                                        │
│  • Payment due before 5th of each month                    │
│  • Security deposit refundable upon lease end              │
│  • Valid for 7 days from issue date                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [FOOTER PLACEHOLDER - Contact Info & Legal]            ││
│  │ Future enhancement: configurable per company           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Print Styles:**
- `@media print` CSS for clean output
- Hide navigation, buttons during print
- Page break handling for long cheque schedules

### 4.3 Document Link Icons

**Icon Mapping:**
| Extension | Icon | Color |
|-----------|------|-------|
| `.pdf` | FileText | `text-red-500` |
| `.doc`, `.docx` | FileText | `text-blue-500` |
| `.jpg`, `.jpeg`, `.png` | Image | `text-green-500` |
| Other | File | `text-muted-foreground` |

**Component Design:**
```tsx
<a className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
  <FileIcon className="h-5 w-5" />
  <span className="text-sm font-medium truncate">{filename}</span>
  <Download className="h-4 w-4 ml-auto text-muted-foreground" />
</a>
```

### 4.4 Tenant Page — Remove Create Button

**Current State (Line 313-321 in tenants/page.tsx):**
```tsx
<Button
  onClick={handleCreateTenant}
  size="lg"
  className="gap-2 shadow-lg shadow-primary/20"
  data-testid="btn-create-tenant"
>
  <Plus className="h-5 w-5" />
  Add Tenant
</Button>
```

**New State:** REMOVE this button entirely. Tenant creation only via Lead conversion.

### 4.5 Conversion Auto-Population

When converting Lead → Tenant from accepted quotation, pre-populate:

**From Lead:**
- firstName, lastName
- email, phone
- Emirates ID, passport number
- Nationality, home country
- All uploaded documents (paths only)

**From Quotation:**
- Property ID, Unit ID
- Base rent, service charges, admin fee
- Security deposit
- Parking spot ID, parking fee
- Number of cheques
- First month payment method
- Cheque breakdown (amounts, due dates)
- Lease dates (if captured)

**All fields editable** — user can modify before final submission.

---

## 5. Implementation Notes

### 5.1 Cheque Auto-Split Logic

```typescript
function calculateChequeBreakdown(
  yearlyAmount: number,
  numberOfCheques: number,
  leaseStartDate: Date
): ChequeBreakdownItem[] {
  const monthlyAmount = yearlyAmount / numberOfCheques;
  const breakdown: ChequeBreakdownItem[] = [];

  for (let i = 0; i < numberOfCheques; i++) {
    const dueDate = addMonths(leaseStartDate, i);
    breakdown.push({
      chequeNumber: i + 1,
      amount: monthlyAmount,
      dueDate: dueDate.toISOString(),
    });
  }

  return breakdown;
}
```

### 5.2 Print View Implementation

- Use `react-to-print` or native `window.print()`
- Apply `@media print` CSS for clean output
- Header/footer placeholders styled as dashed border boxes with "Configure in settings" text

---

## 6. Affected Stories

| Story | Impact |
|-------|--------|
| 3.1 Lead Management & Quotation | MODIFY: Add cheque breakdown, print view |
| 3.3 Tenant Onboarding | MODIFY: Auto-populate from quotation, remove direct create |

---

## 7. Acceptance Criteria

- [ ] Quotation form includes cheque breakdown in Step 3
- [ ] Yearly amount auto-splits across selected number of cheques
- [ ] First month payment method (Cash/Cheque) selectable
- [ ] Quotation detail page has "Print" button
- [ ] Print view renders clean A4 layout with all details
- [ ] Header/footer placeholders visible in print view
- [ ] "Add Tenant" button removed from Tenant list page
- [ ] Lead conversion pre-populates all tenant fields
- [ ] All pre-populated fields remain editable
- [ ] Document links show appropriate file type icons
- [ ] Only ONE quotation can exist per lead (enforce unique constraint)

---

## 8. Approved By

**User:** Nata
**Date:** 2025-12-06
**Agent:** SM (Bob)

---

## 9. Handoff

**Assigned To:** Dev Agent
**Implementation Mode:** Frontend Design Skills Active
**Priority:** Implement in order listed
