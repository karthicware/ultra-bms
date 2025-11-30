# Sprint Change Proposal: shadcn-studio Datatable Standardization

**Date:** 2025-11-30
**Type:** UI Component Standardization
**Priority:** Medium
**Estimated Effort:** 2-3 Story Points per page

---

## Executive Summary

Apply shadcn-studio datatable component (`@ss-blocks/datatable-component-04`) across all list pages in the application to provide consistent UX with advanced table features including sorting, filtering, pagination, row selection, and bulk actions.

---

## Reference Implementation

The **Properties page** (`/properties/page.tsx`) already implements the datatable pattern via `PropertyDatatable.tsx`. This serves as the reference implementation demonstrating:

- TanStack Table integration
- Column sorting with visual indicators
- Dropdown filter components
- Pagination with page size selection
- Row selection with checkboxes
- Action column with view/edit/delete buttons
- Loading skeletons
- Empty state handling

---

## Scope of Changes

### Pages Requiring Datatable Update (11 pages)

| # | Page | Path | Current Implementation | Complexity |
|---|------|------|----------------------|------------|
| 1 | Tenants | `/tenants/page.tsx` | Standard Table with manual pagination | Medium |
| 2 | Invoices | `/invoices/page.tsx` | Standard Table with filters | Medium |
| 3 | Expenses | `/expenses/page.tsx` | Standard Table with filters | Medium |
| 4 | Leads | `/leads/page.tsx` | Standard Table with filters | Medium |
| 5 | Assets | `/assets/page.tsx` | Standard Table with filters | Medium |
| 6 | Documents | `/documents/page.tsx` | Standard Table with 4 filters | Medium-High |
| 7 | Announcements | `/announcements/page.tsx` | Standard Table with tabs (3-tab UI) | High |
| 8 | PDC List | `/pdc/list/page.tsx` | Standard Table with status filters | Medium |
| 9 | Quotations | `/quotations/page.tsx` | Standard Table with status filter | Medium |
| 10 | Work Orders | `/property-manager/work-orders/page.tsx` | Standard Table with 5 filters | High |
| 11 | Vendors | `/property-manager/vendors/page.tsx` | Standard Table with 2 filters | Medium |

### Pages NOT Requiring Update

- **Properties** (`/properties/page.tsx`) - Already uses datatable (reference)
- **PDC Dashboard** (`/pdc/page.tsx`) - Dashboard with embedded summary tables, not a list page
- Various detail, edit, and create pages - Not list views

---

## Implementation Pattern

### Step 1: Install Component
```bash
npx shadcn@latest add @ss-blocks/datatable-component-04
```

### Step 2: Create Page-Specific Datatable Component

For each page, create a dedicated datatable component following the pattern:

```
frontend/src/components/{entity}/{Entity}Datatable.tsx
```

Example structure:
- `TenantsDatatable.tsx`
- `InvoicesDatatable.tsx`
- `ExpensesDatatable.tsx`
- etc.

### Step 3: Column Definition Pattern

Each datatable should define columns with:
- ID/Number column (sortable, link to detail)
- Primary info columns (sortable where applicable)
- Status badge column
- Date columns (formatted, sortable)
- Actions column (dropdown menu)

### Step 4: Filter Integration

Migrate existing filters to the datatable toolbar pattern:
- Search input with debounce
- Status dropdown filters
- Category/Type filters (as applicable)
- Clear filters button

### Step 5: Feature Checklist per Page

Each updated page should include:
- [ ] Column sorting (at least 2-3 sortable columns)
- [ ] Search with 300ms debounce
- [ ] Status filter dropdown
- [ ] Additional context filters (as applicable)
- [ ] Page size selector (10, 20, 50)
- [ ] Pagination controls
- [ ] Loading skeleton state
- [ ] Empty state with CTA
- [ ] Row selection checkboxes
- [ ] Actions dropdown (view, edit, delete)
- [ ] Bulk actions (if applicable)

---

## Impact Analysis

### Benefits
1. **Consistent UX** - Uniform table behavior across all list pages
2. **Enhanced Features** - Built-in sorting, filtering, selection
3. **Better Performance** - TanStack Table optimizations
4. **Reduced Code** - Reusable datatable pattern
5. **Accessibility** - shadcn components are WCAG compliant

### Risks
| Risk | Mitigation |
|------|------------|
| Regression in existing functionality | Test each page after migration |
| API compatibility | Ensure existing hooks return compatible data shapes |
| Custom filter logic | Preserve existing filter behavior |

### Dependencies
- `@ss-blocks/datatable-component-04` (to be installed)
- Existing hooks (`useTenants`, `useInvoices`, etc.) remain unchanged
- No backend changes required

---

## Recommended Implementation Order

**Phase 1 - Simple Tables (Low Risk)**
1. Quotations
2. PDC List
3. Vendors

**Phase 2 - Medium Complexity**
4. Leads
5. Assets
6. Expenses
7. Invoices
8. Tenants

**Phase 3 - Complex Tables**
9. Documents (multiple filters)
10. Work Orders (5 filters, category icons)
11. Announcements (tab-based UI)

---

## Acceptance Criteria

For each page migration:
1. All existing filters continue to work
2. Sorting works on key columns
3. Pagination displays correct totals
4. Page loads with proper loading state
5. Empty state displays when no data
6. Actions (view/edit/delete) work correctly
7. No console errors
8. Responsive on mobile/tablet

---

## Approval

**Proposed by:** Scrum Master (Bob)
**Date:** 2025-11-30

| Role | Approver | Decision | Date |
|------|----------|----------|------|
| Product Owner | | Pending | |
| Tech Lead | | Pending | |
| Developer | | Pending | |

---

## Notes

- The datatable component is already installed in the project (used by Properties page)
- Each page should be migrated as a separate commit for easy rollback
- Consider creating a shared `DataTableToolbar` component for filter consistency
