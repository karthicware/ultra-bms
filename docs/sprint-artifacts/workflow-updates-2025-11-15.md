# Workflow Updates: shadcn-ui MCP Enforcement

**Date:** 2025-11-15
**Implemented By:** SM (Bob)
**Approved By:** Nata
**Related:** Sprint Change Proposal 2025-11-15

---

## Summary

All workflow files have been successfully updated to enforce shadcn-ui MCP usage for React component discovery and implementation. This ensures consistent UI implementation and prevents component rebuilding.

---

## Files Modified

### 1. create-story Workflow ✅
**File:** `.bmad/bmm/workflows/4-implementation/create-story/instructions.md`

**Added Step 4.5:** "Identify and map UI components (shadcn/ui MCP)"
- Location: After step 4 (requirements analysis), before step 5 (project structure alignment)
- Forces component discovery during story drafting
- Adds "Component Mapping" section to story files with:
  - shadcn/ui components to use
  - Custom components with rationale
  - Installation commands

### 2. dev-story Workflow ✅
**File:** `.bmad/bmm/workflows/4-implementation/dev-story/instructions.md`

**Added Step 1.7:** "Validate component strategy (shadcn/ui MCP compliance)"
- Location: After step 1.6 (mark in-progress), before step 2 (implementation)
- Validates Component Mapping exists before implementation
- Runs auto-discovery if mapping missing
- Enforces priority order: 1) shadcn/ui, 2) Compose primitives, 3) Custom only if necessary

### 3. epic-tech-context Workflow ✅
**File:** `.bmad/bmm/workflows/4-implementation/epic-tech-context/instructions.md`

**Added Step 7.5:** "Define UI component strategy for epic (shadcn/ui MCP)"
- Location: After step 7 (acceptance criteria), before step 8 (risks/test strategy)
- Establishes epic-level component strategy
- Maps all UI components needed for the epic
- Provides guidance for all stories in the epic
- Prevents redundant component discovery

---

## Implementation Status

| Workflow | Status | Verification |
|----------|--------|--------------|
| create-story | ✅ Updated | Step 4.5 added to instructions.md |
| dev-story | ✅ Updated | Step 1.7 added to instructions.md |
| epic-tech-context | ✅ Updated | Step 7.5 added to instructions.md |

---

## Next Steps

### Immediate (Epic 3)

1. ✅ **Workflow files updated** - Completed 2025-11-15
2. **Apply to drafted stories:**
   - Run component mapping for Story 3-1 (Lead Management/Quotation)
   - Run component mapping for Story 3-2 (Property/Unit Management)
   - Update both story files with Component Mapping sections

### Ongoing (All Future Epics)

- SM uses updated create-story workflow → Component Mapping auto-generated
- Dev validates Component Mapping before implementation → shadcn MCP enforced
- Code reviews include shadcn/ui compliance check
- DoD includes UI Component Quality Standards

---

## Expected Benefits

### Quality Improvements
- ✅ Zero rebuilt components (shadcn equivalents always used)
- ✅ Consistent UI implementation across features
- ✅ Improved accessibility (Radix UI primitives)
- ✅ Reduced AI hallucinations about component APIs

### Process Improvements
- ✅ Component discovery happens during planning (not during rushed implementation)
- ✅ Epic-level component strategy guides all stories
- ✅ Clear documentation of custom component rationale

### Metrics Targets
- Component Reuse Rate: >90% of UI components use shadcn/ui
- Custom Component Justification: 100% have documented rationale
- Workflow Compliance: 100% of stories pass component quality checks

---

## Related Documents

- **Sprint Change Proposal:** `/docs/sprint-change-proposals/sprint-change-proposal-2025-11-15.md`
- **Architecture (ADR-005):** `/docs/architecture.md` (shadcn/ui MCP mandate)
- **UX Design Spec:** `/docs/development/ux-design-specification.md` (Section 6: Component Library)
- **Sprint Status:** `/docs/sprint-artifacts/sprint-status.yaml`

---

## Rollback Procedure (If Needed)

If workflow issues arise:

```bash
# Revert all three files
cd /Users/natarajan/Documents/Projects/ultra-bms

git checkout .bmad/bmm/workflows/4-implementation/create-story/instructions.md
git checkout .bmad/bmm/workflows/4-implementation/dev-story/instructions.md
git checkout .bmad/bmm/workflows/4-implementation/epic-tech-context/instructions.md
```

**Rollback Trigger:** Workflow errors, significant slowdown (>30 min/story), or team consensus of no value

---

_Process improvement completed via correct-course workflow. Enforces existing architectural decisions (ADR-005) without changing epic scope or MVP timeline._
