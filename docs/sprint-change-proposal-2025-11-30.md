# Sprint Change Proposal - Placeholder Message Cleanup

**Generated:** 2025-11-30
**Triggered By:** User-reported placeholder messages appearing in production UI
**Scope Classification:** Minor

---

## Section 1: Issue Summary

### Problem Statement
Multiple placeholder messages ("Coming soon", "Not Implemented") are visible to end users in the production UI, creating a confusing and unprofessional user experience.

### Context
During routine usage, the following placeholder messages were discovered:

| File | Message | Feature Area |
|------|---------|--------------|
| `units/[id]/page.tsx:127` | "Not Implemented" toast | Unit detail Edit button |
| `dashboard/page.tsx:115,128,141` | "Coming soon" | 3 dashboard stat widgets |
| `settings/page.tsx:34` | "Coming Soon" badge | Profile settings |
| `work-orders/[id]/page.tsx:264` | "Coming Soon" | Work order status update |

### Evidence
- Placeholders discovered via grep search for "Coming soon", "Not Implemented" patterns
- All messages are user-visible in toast notifications or UI badges
- Messages indicate incomplete implementations from completed stories

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Stories Affected | Impact Level |
|------|------------------|--------------|
| Epic 3 | 3.2 (Property & Unit Management) | LOW - 1 task incomplete |
| Epic 4 | 4.4 (Job Progress Tracking) | LOW - Misleading placeholder |
| Epic 8 | 8.1 (Executive Dashboard) | NONE - Correctly deferred |
| Epic 2 | None | MEDIUM - Missing story for Profile |

### Story Impact

1. **Story 3.2** (DONE) - Task 15 incomplete: Unit Edit/Delete button wiring
2. **Story 4.4** (DONE) - Placeholder conflicts with workflow-based status management
3. **NEW STORY NEEDED** - User profile management not covered by any story

### Artifact Conflicts
- Sprint Status shows Stories 3.2 and 4.4 as DONE but implementations have gaps
- PRD Section 3.1.5 (User Management) mentions profile editing - not covered by stories

### Technical Impact
- Frontend-only changes for Stories 3.2 and 4.4
- New backend endpoint needed for Profile story
- No infrastructure or deployment changes

---

## Section 3: Recommended Approach

### Path Forward: Direct Adjustment

**Rationale:** All issues are minor implementation gaps that can be fixed within existing sprint capacity without backlog reorganization.

### Effort Estimate

| Item | Effort | Risk |
|------|--------|------|
| Story 3.2 - Unit Edit button | 2 hours | Low |
| Story 4.4 - Remove placeholder | 0.5 hours | Low |
| Dashboard widgets | 0 hours | N/A (correct behavior) |
| New Profile Story | 4-6 hours | Medium |

### Timeline Impact
- Stories 3.2 and 4.4 fixes: Same day
- Profile story: New story to be drafted and prioritized

---

## Section 4: Detailed Change Proposals

### 4.1 Story 3.2 - Unit Edit Button Implementation

**File:** `frontend/src/app/(dashboard)/units/[id]/page.tsx`

**Current (Line 125-130):**
```typescript
const handleEdit = () => {
  toast({
    title: 'Not Implemented',
    description: 'Unit editing will be available in a future update',
  });
};
```

**Proposed:**
```typescript
const handleEdit = () => {
  router.push(`/units/${unitId}/edit`);
};
```

**Additional Work:**
- Create `/units/[id]/edit/page.tsx` using `UnitFormModal` in edit mode
- Or: Open `UnitFormModal` in dialog mode with existing unit data

**Justification:** Task 15 of Story 3.2 explicitly requires "Wire up Edit/Delete buttons in Unit Detail page"

---

### 4.2 Story 4.4 - Work Order Status Update Placeholder

**File:** `frontend/src/app/(dashboard)/property-manager/work-orders/[id]/page.tsx`

**Current (Line 261-267):**
```typescript
const handleStatusUpdate = (newStatus: WorkOrderStatus) => {
  // TODO: Implement status update dialog
  toast({
    title: 'Coming Soon',
    description: 'Status update functionality will be implemented next',
  });
};
```

**Proposed:**
```typescript
const handleStatusUpdate = (newStatus: WorkOrderStatus) => {
  // Status transitions handled by workflow-specific actions:
  // - OPEN → ASSIGNED: AssignmentDialog (Assign button)
  // - ASSIGNED → IN_PROGRESS: StartWorkDialog (Start Work button)
  // - IN_PROGRESS → COMPLETED: MarkCompleteDialog (Mark Complete button)
  // Direct status dropdown hidden per UX design - all transitions via buttons
  toast({
    title: 'Use Action Buttons',
    description: 'Use the action buttons above to change work order status',
  });
};
```

**Alternative:** Remove the status dropdown entirely if not used in the UI.

**Justification:** Story 4.4 implements workflow-based status transitions via specific dialogs, not a generic status update function.

---

### 4.3 Dashboard Widgets - No Change Required

**File:** `frontend/src/app/(dashboard)/dashboard/page.tsx`

**Status:** CORRECT BEHAVIOR

**Rationale:**
- "Total Leads", "Active Quotations", "Conversion Rate" widgets belong to Story 8.1 (Executive Summary Dashboard)
- Story 8.1 is status=ready-for-dev, not yet implemented
- "Coming soon" placeholder is appropriate until Epic 8 is developed

**Recommendation:** Leave as-is. Will be implemented with Story 8.1.

---

### 4.4 Profile Settings - New Story Required

**Current State:**
- `settings/page.tsx` shows Profile section with `comingSoon: true`
- No story in Epic 2 covers user profile editing
- PRD Section 3.1.5 mentions "Users can update their profiles"

**Proposed New Story:** `2-9-user-profile-management`

**Scope:**
- AC1: User can view their profile (name, email, phone, avatar)
- AC2: User can edit name and phone number
- AC3: User can upload/change profile avatar (S3)
- AC4: Form validation with Zod schemas
- AC5: Backend PATCH /api/v1/users/me/profile endpoint
- AC6: Success/error toast notifications
- AC7: data-testid on all interactive elements

**Priority:** P2 (Medium) - Nice to have, not blocking core functionality

---

## Section 5: Implementation Handoff

### Scope Classification: Minor

All changes can be implemented directly by the development team without backlog reorganization.

### Handoff Recipients

| Change | Assignee | Action |
|--------|----------|--------|
| Story 3.2 fix | Dev Team | Implement unit edit navigation |
| Story 4.4 fix | Dev Team | Update placeholder message |
| Profile Story | SM (Bob) | Draft new story 2-9 |

### Success Criteria

- [ ] No "Not Implemented" toasts visible in unit detail page
- [ ] Work order status placeholder provides helpful guidance
- [ ] Profile story drafted and added to backlog
- [ ] Sprint status updated with fix notes

### Next Steps

1. **Immediate (Dev Team):**
   - Fix unit edit button in Story 3.2
   - Update work order status placeholder in Story 4.4

2. **Short-term (SM):**
   - Draft Story 2-9 (User Profile Management)
   - Add to Epic 2 backlog
   - Prioritize for future sprint

3. **No Action Required:**
   - Dashboard widgets - will be addressed in Epic 8

---

## Approval

- [ ] Change proposals reviewed
- [ ] Effort estimates accepted
- [ ] Handoff recipients confirmed

**Prepared by:** Bob (Scrum Master Agent)
**Date:** 2025-11-30
