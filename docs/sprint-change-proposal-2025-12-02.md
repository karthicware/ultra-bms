# Sprint Change Proposal: Tenant Dashboard shadcn-studio Component Upgrade

**Date:** 2025-12-02
**Author:** Bob (Scrum Master Agent)
**Status:** Approved - Ready for Implementation
**Change Scope:** Minor

---

## 1. Issue Summary

### Problem Statement
The Tenant Dashboard (`/tenant/dashboard`) uses basic shadcn/ui Card and Button components, while Epic 8 dashboards have been upgraded to use the more polished shadcn-studio-mcp blocks. This creates visual inconsistency across the application's dashboard pages.

### Context
- **Discovery:** During Epic 8 implementation, shadcn-studio-mcp blocks were established as the primary UI component source (ref: Sprint Change Proposal 2025-12-01)
- **Scope:** Tenant Dashboard is the only dashboard page outside Epic 8 that needs upgrading
- **Evidence:** Current Tenant Dashboard uses emoji icons and basic Card components vs. Epic 8's professional statistics cards and widget blocks

### Trigger Type
- [x] Strategic improvement - UI component library standardization
- [ ] Technical limitation
- [ ] New requirement
- [ ] Misunderstanding of requirements
- [ ] Failed approach

---

## 2. Impact Analysis

### Epic Impact
| Epic | Impact | Details |
|------|--------|---------|
| Epic 3 (Tenant Management Portal) | Minor | Tenant Dashboard UI component upgrade |
| Epic 8 (Dashboard & Reporting) | None | Already uses shadcn-studio components (excluded) |

### Story Impact
| Story | Status | Change Required |
|-------|--------|-----------------|
| Story 3.4 (Tenant Portal Dashboard) | Completed | UI enhancement - non-breaking |

### Artifact Conflicts
- **PRD:** No conflicts - aligns with professional UI goal
- **Architecture:** No conflicts - follows established patterns
- **UI/UX Specification:** No conflicts - enhances consistency

### Technical Impact
- **Code Changes:** 3 component files in `frontend/src/components/tenant/`
- **New Dependencies:** None (shadcn-studio blocks already available)
- **Breaking Changes:** None - internal component refactoring only

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment

**Rationale:**
- Low effort, low risk enhancement
- Non-breaking changes to existing functionality
- Aligns with established shadcn-studio pattern from Epic 8
- Improves UI consistency without scope changes

**Effort Estimate:** Low (2-4 hours implementation)
**Risk Level:** Low
**Timeline Impact:** None

---

## 4. Detailed Change Proposals

### 4.1 DashboardStatsGrid Component

**File:** `frontend/src/components/tenant/DashboardStatsGrid.tsx`

**OLD:**
```tsx
// Uses basic Card with CardHeader/CardContent
<Card data-testid="card-outstanding-balance">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
  </CardHeader>
  <CardContent>
    <div className={`text-2xl font-bold ${stats.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
      {formatCurrency(stats.outstandingBalance)}
    </div>
  </CardContent>
</Card>
```

**NEW:**
```tsx
// Use statistics-component-03 pattern with trend badges
// Install: npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-03"
// Adapt statistics-card-03 for tenant metrics:
// - Outstanding Balance (with trend indicator)
// - Next Payment Due (with date formatting)
// - Open Requests (with count badge)
// - Upcoming Bookings (with count badge)
```

**Rationale:** Provides consistent visual language with Epic 8 executive dashboard statistics cards.

---

### 4.2 UnitInfoCard Component

**File:** `frontend/src/components/tenant/UnitInfoCard.tsx`

**OLD:**
```tsx
// Basic Card with manual grid layout
<Card data-testid="card-unit-info" className="col-span-full">
  <CardHeader>
    <CardTitle>Your Unit</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4 md:grid-cols-2">
      {/* Manual property/lease info layout */}
    </div>
  </CardContent>
</Card>
```

**NEW:**
```tsx
// Use widget-component-10 pattern for structured display
// Install: npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-10"
// Adapt widget-for-business-shark for unit info:
// - Property details section with badges
// - Lease status with visual indicators
// - Better visual hierarchy
```

**Rationale:** Provides a more polished, structured unit information display.

---

### 4.3 QuickActionsGrid Component

**File:** `frontend/src/components/tenant/QuickActionsGrid.tsx`

**OLD:**
```tsx
// Emoji-based icons
const getIconElement = (icon: string) => {
  const icons: Record<string, string> = {
    'tools': '🔧',
    'credit-card': '💳',
    'calendar': '📅',
    'file-text': '📄',
  };
  return icons[icon] || '📌';
};
```

**NEW:**
```tsx
// lucide-react icons for consistency
import { Wrench, CreditCard, Calendar, FileText } from 'lucide-react';

const getIconElement = (icon: string) => {
  const icons: Record<string, React.ReactNode> = {
    'tools': <Wrench className="h-6 w-6" />,
    'credit-card': <CreditCard className="h-6 w-6" />,
    'calendar': <Calendar className="h-6 w-6" />,
    'file-text': <FileText className="h-6 w-6" />,
  };
  return icons[icon] || <FileText className="h-6 w-6" />;
};
```

**Rationale:** Replaces emoji icons with professional lucide-react icons for consistency with rest of application.

---

## 5. Implementation Handoff

### Change Scope Classification: Minor

**Routing:** Development Team for direct implementation

### Implementation Tasks

| # | Task | Component | Estimated Effort |
|---|------|-----------|------------------|
| 1 | Install statistics-component-03 block | - | 5 min |
| 2 | Install widget-component-10 block | - | 5 min |
| 3 | Refactor DashboardStatsGrid with statistics-card-03 pattern | DashboardStatsGrid.tsx | 1 hour |
| 4 | Refactor UnitInfoCard with widget pattern | UnitInfoCard.tsx | 1 hour |
| 5 | Replace emoji icons with lucide-react in QuickActionsGrid | QuickActionsGrid.tsx | 30 min |
| 6 | Run frontend tests and fix any failures | - | 30 min |
| 7 | Run frontend build verification | - | 10 min |

### Installation Commands

```bash
# Install shadcn-studio blocks
cd frontend
npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-03"
npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-10"
```

### Success Criteria

1. [ ] Tenant Dashboard uses shadcn-studio component patterns
2. [ ] All emoji icons replaced with lucide-react icons
3. [ ] Visual consistency with Epic 8 dashboards achieved
4. [ ] All existing functionality preserved
5. [ ] Frontend tests pass
6. [ ] Frontend build succeeds with no errors

### Handoff Recipients

| Role | Responsibility |
|------|----------------|
| Development Team | Implement component refactoring |
| QA (if applicable) | Verify visual consistency and functionality |

---

## 6. Approval

- [x] User Approved (2025-12-02)
- [x] Ready for Implementation

---

**Generated by:** Correct Course Workflow
**Workflow Version:** BMad Method 6.0
