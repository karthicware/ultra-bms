# Sprint Change Proposal: Enforce shadcn-ui MCP Usage in Workflows

**Date:** 2025-11-15
**Proposed By:** SM (Bob) via correct-course workflow
**Approved By:** Nata
**Status:** ✅ Approved for Implementation
**Scope:** Minor (workflow documentation only)

---

## Executive Summary

The project architecture (ADR-005) mandates shadcn/ui MCP integration, and the UX Design Specification provides comprehensive shadcn/ui guidance. However, the actual workflows for story creation and development do not enforce or prompt developers to use shadcn MCP tools for React component discovery and validation. This proposal implements workflow enforcement to ensure shadcn MCP usage on all future frontend development.

---

## 1. Issue Summary

**Trigger:** During Epic 3 story drafting, observation that shadcn-ui MCP tools are not being actively used despite architectural mandate.

**Root Cause:** Workflow enforcement gap between architectural intent and development practice.

**Evidence:**
- Architecture document (ADR-005, lines 84-90): "shadcn/ui MCP Server (Already Configured)"
- UX Design Spec (Section 9.3): "Check shadcn registry first - Don't rebuild existing components"
- Current workflows: No shadcn MCP steps present in create-story or dev-story workflows

**Impact Without Fix:**
- Developers may rebuild components that already exist in shadcn/ui registry
- AI agents may hallucinate incorrect component APIs
- UI implementations become inconsistent
- Team misses accessibility benefits of Radix UI primitives

---

## 2. Impact Analysis

### Epic Impact
**Status:** ✅ No changes to epic functional scope

All epics (Epic 3-9) retain their original goals, acceptance criteria, and deliverables. This is a **process quality improvement**, not a scope change.

### Artifact Impact Analysis

| Artifact | Status | Changes Required |
|----------|--------|------------------|
| **PRD** | ✅ Aligned | None - PRD defines WHAT to build |
| **Architecture** | ✅ Aligned | None - Already mandates shadcn/ui MCP (ADR-005) |
| **UX Design Spec** | ✅ Aligned | None - Already provides detailed shadcn/ui guidance |
| **create-story workflow** | ⚠️ Gap Identified | ADD: Component discovery step using MCP |
| **dev-story workflow** | ⚠️ Gap Identified | ADD: shadcn MCP validation step |
| **epic-tech-context workflow** | ⚠️ Gap Identified | ADD: Component mapping section |
| **Definition of Done** | ⚠️ Gap Identified | ADD: shadcn MCP checklist items |

### Root Cause Analysis

**Finding:** Architecture and UX documentation are **already correct and comprehensive**. The gap is in **workflow enforcement** - the step-by-step processes that guide developers don't prompt them to use the MCP tools.

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment (Workflow Enhancement)

**Option Evaluation:**
- ✅ **Option 1: Direct Adjustment** - Update workflows to enforce shadcn MCP usage
  - Effort: Low (2-3 hours of SM time)
  - Risk: Low (documentation only, non-breaking)
  - Value: High (prevents inconsistency and rework)

- ❌ **Option 2: Rollback** - Not applicable (no completed work needs reverting)

- ❌ **Option 3: PRD MVP Review** - Not needed (no scope impact)

**Rationale for Option 1:**
1. **Minimal disruption** - Updates workflow documents only, no code/architecture changes
2. **Immediate value** - Prevents future component inconsistencies starting with Epic 3
3. **Aligned with existing architecture** - Enforces what's already documented in ADR-005
4. **Low risk, high return** - Improves quality without timeline impact
5. **Proactive prevention** - Catches issue before technical debt accumulates

**Effort Estimate:** 2-3 hours (SM workflow updates)
**Risk Level:** Low
**Timeline Impact:** None (completed before Story 3-1 implementation)

---

## 4. Detailed Change Proposals

### Change 1: Update `create-story/workflow.yaml`

**File:** `.bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`

**Add new step after requirements analysis (before task breakdown):**

```yaml
<step n="4.5" goal="Identify and Map UI Components">
  <action>Review story acceptance criteria and identify all UI components needed</action>
  <action>Use MCP shadcn tools to discover available components:</action>
    - Search: mcp__shadcn__search_items_in_registries
    - View details: mcp__shadcn__view_items_in_registries
    - Get examples: mcp__shadcn__get_item_examples_from_registries
  <action>Document component mapping in story file under "## Component Mapping" section</action>
  <action>Identify custom components needed (only if shadcn alternative doesn't exist)</action>

  <example>
    ## Component Mapping

    ### shadcn/ui Components to Use
    - Lead form: shadcn `form`, `input`, `select` components
    - Quotation table: shadcn `data-table` component
    - Status badges: shadcn `badge` component
    - Action buttons: shadcn `button` component

    ### Custom Components Required
    - QuotationCalculator: Complex pricing logic (no shadcn equivalent)

    ### Installation Command
    ```bash
    npx shadcn@latest add form input select data-table badge button
    ```
  </example>

  <critical>This step ensures component discovery happens during planning, not during implementation</critical>
</step>
```

**Rationale:** Forces component discovery during story creation when SM has full context of requirements. Prevents developers from reinventing components during rushed implementation.

---

### Change 2: Update `dev-story/workflow.yaml`

**File:** `.bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`

**Add validation step before implementation (after loading story context):**

```yaml
<step n="1.5" goal="Validate Component Strategy">
  <action>Review story's "## Component Mapping" section</action>

  <check if="Component mapping missing or incomplete">
    <action>HALT and notify SM: Component mapping must be completed before implementation</action>
    <action>If urgent, run component discovery using MCP shadcn tools now</action>
    <action>Update story file with component mapping before proceeding</action>
  </check>

  <action>Before creating ANY custom component during implementation:</action>
    - Verify shadcn alternative doesn't exist using mcp__shadcn__search_items_in_registries
    - Document rationale for custom component in code comments
    - Ensure custom component follows UX Design Spec patterns

  <reminder>Priority Order: 1) Use shadcn/ui, 2) Compose from shadcn primitives, 3) Custom only if necessary</reminder>

  <critical>Custom components should ONLY be created when shadcn/ui has no suitable alternative</critical>
</step>
```

**Add to Definition of Done validation (before marking story complete):**

```yaml
<step n="X" goal="Validate UI Component Quality">
  <action>Verify all UI component quality criteria met:</action>

  <checklist>
    - [ ] All UI components checked against shadcn/ui registry using MCP tools
    - [ ] shadcn/ui components used where available (not custom rebuilds)
    - [ ] Custom components only created when shadcn alternative verified as non-existent
    - [ ] Component usage documented in story's "Component Mapping" section
    - [ ] All components follow UX Design Spec guidelines (Section 9.3)
    - [ ] Component installation commands documented (npx shadcn@latest add ...)
  </checklist>

  <check if="Any checklist item fails">
    <action>Fix non-compliance before marking story complete</action>
    <action>Update story documentation to reflect actual components used</action>
  </check>
</step>
```

**Rationale:** Prevents developers from skipping component discovery. Makes shadcn MCP usage a required quality gate for story completion.

---

### Change 3: Update `epic-tech-context/workflow.yaml`

**File:** `.bmad/bmm/workflows/4-implementation/epic-tech-context/workflow.yaml`

**Add section to tech spec generation (after architecture review, before implementation guidance):**

```yaml
<step n="X" goal="Define UI Component Strategy for Epic">
  <action>Based on PRD requirements and UX Design Spec, identify all UI component categories needed for this epic</action>
  <action>Map components to shadcn/ui using MCP tools (search and view available components)</action>
  <action>Review UX Design Spec Section 6 for component recommendations specific to this epic's module</action>
  <action>Identify custom components needed (those without shadcn equivalents)</action>

  <template-output>
    ## UI Component Strategy

    ### shadcn/ui Components Required

    **Forms & Inputs:**
    - form, input, textarea, select, checkbox, radio-group
    - date-picker, combobox (for searchable dropdowns)

    **Data Display:**
    - table, data-table (for list views)
    - card (for summary displays)
    - badge (for status indicators)

    **Navigation & Actions:**
    - button (primary, secondary, destructive variants)
    - dialog, sheet (for modals and side panels)
    - tabs, breadcrumb

    **Feedback:**
    - toast, alert
    - skeleton (for loading states)

    **Installation Command:**
    ```bash
    npx shadcn@latest add form input textarea select checkbox radio-group date-picker combobox table data-table card badge button dialog sheet tabs breadcrumb toast alert skeleton
    ```

    ### Custom Components Required

    **[ComponentName]**
    - **Purpose:** [What it does]
    - **Rationale:** [Why shadcn alternative doesn't exist]
    - **Composition:** [Built from which shadcn primitives, if any]

    ### Component Usage Guidelines for This Epic

    - [Any epic-specific patterns, e.g., "All forms use standard validation pattern from Story 2.1"]
    - [Consistency requirements, e.g., "Status badges follow color scheme: blue=draft, green=approved, red=rejected"]
    - [Reference to UX Design Spec sections relevant to this epic]
  </template-output>

  <note>This component strategy guides all stories in the epic, ensuring consistency and preventing redundant component discovery</note>
</step>
```

**Rationale:** Establishes component strategy at epic level, providing clear guidance for all stories. Prevents each story from rediscovering the same components.

---

### Change 4: Update Definition of Done Checklist

**File:** Story template or standalone DoD document

**Add new section to DoD:**

```markdown
## UI Component Quality Standards

### shadcn/ui MCP Compliance
- [ ] All React components checked against shadcn/ui registry using MCP tools
- [ ] shadcn/ui components used where available (no unnecessary custom rebuilds)
- [ ] Custom components only created when shadcn alternative verified as non-existent
- [ ] Component rationale documented in code comments (for custom components)

### Component Documentation
- [ ] Story includes "Component Mapping" section with:
  - List of shadcn components used
  - List of custom components with rationale
  - Installation commands (npx shadcn@latest add ...)
- [ ] Component usage follows UX Design Spec Section 9.3 guidelines
- [ ] All interactive elements have proper data-testid attributes (per Epic 2 retrospective AI-2-1)

### Component Implementation
- [ ] Components use theme tokens (not hardcoded colors)
- [ ] Components are accessible (WCAG 2.1 Level AA per UX Design Spec)
- [ ] Components support dark mode (if applicable)
- [ ] Components tested in responsive breakpoints
```

**Rationale:** Makes shadcn MCP usage a non-negotiable quality requirement. Integrates with existing Epic 2 retrospective action items (AI-2-1: data-testid requirement).

---

## 5. Implementation Plan

### Phase 1: Workflow File Updates (Immediate)

**Owner:** SM (Bob)
**Timeline:** Before Story 3-1 moves to "ready-for-dev"

**Tasks:**
1. ✅ Update `.bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
   - Add step 4.5: "Identify and Map UI Components"

2. ✅ Update `.bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`
   - Add step 1.5: "Validate Component Strategy"
   - Add DoD validation step: "Validate UI Component Quality"

3. ✅ Update `.bmad/bmm/workflows/4-implementation/epic-tech-context/workflow.yaml`
   - Add step: "Define UI Component Strategy for Epic"

4. ✅ Update Definition of Done checklist
   - Add "UI Component Quality Standards" section

5. ✅ Update story template
   - Add "## Component Mapping" section placeholder

### Phase 2: Apply to Current Stories (Immediate)

**Owner:** SM (Bob)
**Timeline:** Immediately after Phase 1

**Tasks:**
1. ✅ Run component mapping for Story 3-1 (Lead Management/Quotation)
2. ✅ Run component mapping for Story 3-2 (Property/Unit Management)
3. ✅ Update both story files with Component Mapping sections
4. ✅ Generate installation commands for Epic 3 components

### Phase 3: Ongoing Enforcement (Standard Practice)

**Owner:** All agents (SM, Dev)
**Timeline:** Starting Epic 3, continuing all future epics

**Process:**
- SM uses updated create-story workflow for all new stories
- Dev validates component mapping exists before implementation
- Code reviews include shadcn/ui compliance check
- DoD includes UI Component Quality Standards verification

---

## 6. Success Criteria

### Immediate Success (Phase 1-2)
- ✅ All 4 workflow YAML files updated with shadcn MCP steps
- ✅ DoD checklist includes UI Component Quality Standards
- ✅ Story template includes Component Mapping section
- ✅ Stories 3-1 and 3-2 have Component Mapping documented before implementation

### Long-term Success (Phase 3+)
- ✅ 100% of new stories include Component Mapping section
- ✅ Zero instances of rebuilt components that exist in shadcn/ui
- ✅ Consistent UI implementation across all frontend features
- ✅ Reduced AI hallucinations about component APIs
- ✅ Improved accessibility through Radix UI primitives

### Quality Metrics
- **Component Reuse Rate:** >90% of UI components use shadcn/ui
- **Custom Component Justification:** 100% of custom components have documented rationale
- **Workflow Compliance:** 100% of stories pass DoD component quality checks

---

## 7. Risk Assessment and Mitigation

### Risk 1: Workflow Overhead
**Risk:** Adding steps to workflows may slow down story creation
**Likelihood:** Low
**Impact:** Low
**Mitigation:** Component discovery takes 5-10 minutes per story, prevents hours of rework during implementation

### Risk 2: Developer Resistance
**Risk:** Developers may view new checks as bureaucratic
**Likelihood:** Low
**Impact:** Low
**Mitigation:** Changes enforce existing architecture (ADR-005), not new requirements. Benefits clear (no component rebuilding, better consistency)

### Risk 3: Incomplete Component Mapping
**Risk:** SM or Dev may skip component mapping to save time
**Likelihood:** Low
**Impact:** Medium
**Mitigation:** Workflow includes explicit validation steps and HALT conditions if mapping missing

**Overall Risk Level:** ✅ **Low** - Non-breaking change with clear benefits

---

## 8. Rollback Plan

**If implementation issues arise:**

1. **Revert workflow files** to previous versions (git checkout)
2. **Remove DoD checklist items** related to shadcn MCP
3. **Continue with current process** (manual shadcn checks)

**Rollback Trigger Conditions:**
- Workflow changes cause agent errors or failures
- SM reports significant slowdown in story creation (>30 min overhead per story)
- Team consensus that process adds no value

**Rollback Owner:** SM (Bob)
**Rollback Effort:** <1 hour (git revert + remove DoD items)

---

## 9. Communication Plan

### Stakeholders to Notify
- ✅ **Nata (Product Owner)** - Approved this proposal
- ✅ **Dev Agent** - Aware of new DoD requirements
- ✅ **SM (Bob)** - Owner of implementation

### Communication Channels
- **This Document** - Saved to `/docs/sprint-artifacts/sprint-change-proposal-2025-11-15.md`
- **Sprint Status File** - No update needed (process change, not story status change)
- **Retrospective Notes** - Document as process improvement from Epic 3

### No External Communication Needed
- No client/stakeholder communication required (internal process improvement)
- No architectural change announcements needed (enforcing existing ADR-005)

---

## 10. Appendix

### Related Documents
- **Architecture:** `/docs/architecture.md` (ADR-005: shadcn/ui MCP Server Integration)
- **UX Design Spec:** `/docs/ux-design-specification.md` (Section 6: Component Library, Section 9.3: Development Guidelines)
- **Epic 2 Retrospective:** `/docs/retrospectives/epic-2-retrospective.md` (AI-2-1: data-testid requirement)
- **Sprint Status:** `/docs/sprint-artifacts/sprint-status.yaml`

### Workflow Files to Modify
1. `.bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
2. `.bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`
3. `.bmad/bmm/workflows/4-implementation/epic-tech-context/workflow.yaml`
4. Definition of Done checklist (location TBD - may be in story template or separate doc)

### Reference: shadcn MCP Tools Available
```typescript
// Component Discovery
mcp__shadcn__search_items_in_registries({ registries: ['@shadcn'], query: 'form' })
mcp__shadcn__view_items_in_registries({ items: ['@shadcn/form'] })
mcp__shadcn__get_item_examples_from_registries({ registries: ['@shadcn'], query: 'form-demo' })

// Installation Command Generation
mcp__shadcn__get_add_command_for_items({ items: ['@shadcn/form', '@shadcn/input'] })

// Project Registry Check
mcp__shadcn__get_project_registries({})
```

---

## Approval and Sign-off

**Proposed By:** Bob (SM Agent) via correct-course workflow
**Proposal Date:** 2025-11-15
**Reviewed By:** Nata
**Approval Status:** ✅ **APPROVED**
**Approval Date:** 2025-11-15

**Implementation Start:** Immediately (before Story 3-1 ready-for-dev)
**Expected Completion:** 2025-11-15 (same day)

---

**Change Scope:** Minor (workflow documentation only)
**Impact:** Epic 3 and all future frontend development
**Risk:** Low
**Value:** High (prevents inconsistency and rework)

---

_This Sprint Change Proposal was generated using the BMad Method correct-course workflow. All analysis and recommendations follow systematic evaluation of trigger, epic impact, artifact conflicts, and path forward options._
