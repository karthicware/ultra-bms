# Sprint Change Proposal: Mandatory Test Execution in Story Development

**Date:** 2025-11-28
**Author:** SM Agent (Bob)
**Trigger:** User request for mandatory test execution after all story tasks

---

## Section 1: Issue Summary

### Problem Statement
Currently, stories have acceptance criteria for *writing* tests (e.g., "Write backend unit tests with 80% coverage") but do not have explicit acceptance criteria requiring the *execution* of all tests and builds as a final validation step before marking a story complete.

### Context
- Tests may be written but not executed before story completion
- Compilation errors and lint errors may slip through
- No enforcement mechanism ensures all tests pass before story is marked "done"

### Evidence
Story 2-6 (Admin User Management) already has the correct pattern:
- **AC16 - Unit Test Execution:** Execute full backend (`mvn test`) and frontend (`npm test`) test suites. ALL tests must pass. Fix any failures.
- **AC17 - Build Verification:** Backend build (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors.

Other stories (3-6, 3-7, 6-1, 6-2) lack these explicit execution requirements.

---

## Section 2: Impact Analysis

### Epic Impact
- **Epic 2:** Already compliant (Story 2-6)
- **Epic 3:** Stories 3-6, 3-7 need updates
- **Epic 6:** Stories 6-1, 6-2 need updates
- **Future Epics:** Template and workflow changes will apply automatically

### Story Impact

| Story | Current Status | Action Required |
|-------|---------------|-----------------|
| 2-6-admin-user-management | backlog | No change (already compliant) |
| 3-6-tenant-lease-extension-and-renewal | ready-for-dev | Add AC17, AC18 (test execution, build verification) |
| 3-7-tenant-checkout-and-deposit-refund | ready-for-dev | Add AC19, AC20 (test execution, build verification) |
| 6-1-rent-invoicing-and-payment-management | in-progress | Add AC32, AC33 (test execution, build verification) |
| 6-2-expense-management-and-vendor-payments | ready | Add AC33, AC34 (test execution, build verification) |

### Artifact Changes

1. **Story Template** (`.bmad/bmm/workflows/4-implementation/create-story/template.md`)
   - Add mandatory acceptance criteria for test execution and build verification

2. **Dev-Story Workflow** (`.bmad/bmm/workflows/4-implementation/dev-story/instructions.md`)
   - Add explicit step for mandatory test execution after all tasks complete

3. **Dev-Story Checklist** (`.bmad/bmm/workflows/4-implementation/dev-story/checklist.md`)
   - Add checklist items for mandatory test execution and build verification

4. **Current Drafted Stories**
   - 3-6, 3-7, 6-1, 6-2 need new acceptance criteria

---

## Section 3: Recommended Approach

**Approach: Direct Adjustment** - Modify/add to stories and templates within existing plan.

**Rationale:**
- Change is process-focused, not scope change
- Pattern already exists in Story 2-6 (proven approach)
- Low risk - enhances quality without changing functionality
- Aligns with retrospective action item AI-2-4 (Update Definition of Done checklist)

**Effort Estimate:** Low - Template/workflow edits only
**Risk Assessment:** Very Low - Quality improvement, no code impact
**Timeline Impact:** None - Stories can proceed immediately after update

---

## Section 4: Detailed Change Proposals

### Change 4.1: Story Template Update

**File:** `.bmad/bmm/workflows/4-implementation/create-story/template.md`

**OLD:**
```markdown
## Dev Notes

- Relevant architecture patterns and constraints
```

**NEW:**
```markdown
## Final Validation Requirements

**MANDATORY:** These acceptance criteria are automatically included in every story and MUST be completed after all implementation tasks are done.

### FV-1: Test Execution (Backend)
Execute full backend test suite: `mvn test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Document test results in Completion Notes

### FV-2: Test Execution (Frontend)
Execute full frontend test suite: `npm test`
- ALL tests must pass (zero failures)
- Fix any failing tests before proceeding
- Excludes E2E tests (run separately if story includes E2E)

### FV-3: Build Verification (Backend)
Execute backend compilation: `mvn compile`
- Zero compilation errors required
- Zero Checkstyle violations (if configured)

### FV-4: Build Verification (Frontend)
Execute frontend build: `npm run build`
- Zero TypeScript compilation errors
- Zero lint errors
- Build must complete successfully

### FV-5: Lint Check (Frontend)
Execute lint check: `npm run lint`
- Zero lint errors required
- Fix any errors before marking story complete

## Dev Notes

- Relevant architecture patterns and constraints
```

**Rationale:** Makes test execution and build verification a standard part of every story, preventing the need to manually add these ACs.

---

### Change 4.2: Dev-Story Workflow Update

**File:** `.bmad/bmm/workflows/4-implementation/dev-story/instructions.md`

**Insert after Step 5 (Mark task complete), before Step 6 (Story completion):**

**NEW STEP 5.5:**
```xml
  <step n="5.5" goal="Mandatory test execution and build verification">
    <critical>This step is MANDATORY and cannot be skipped. ALL tests must pass.</critical>

    <action>Execute backend test suite: mvn test (in backend directory)</action>
    <action if="backend tests fail">HALT: Fix all failing tests before continuing. Do NOT proceed to Step 6.</action>

    <action>Execute frontend test suite: npm test (in frontend directory)</action>
    <action if="frontend tests fail">HALT: Fix all failing tests before continuing. Do NOT proceed to Step 6.</action>

    <action>Execute backend compilation check: mvn compile</action>
    <action if="compilation errors">HALT: Fix all compilation errors before continuing.</action>

    <action>Execute frontend build: npm run build</action>
    <action if="build errors">HALT: Fix all TypeScript/build errors before continuing.</action>

    <action>Execute frontend lint: npm run lint</action>
    <action if="lint errors">HALT: Fix all lint errors before continuing.</action>

    <output>✅ All tests passed, builds successful, no lint errors. Proceeding to completion.</output>

    <action>Add test execution results to Dev Agent Record → Completion Notes:
      - Backend tests: X/X passed
      - Frontend tests: X/X passed
      - Backend build: SUCCESS
      - Frontend build: SUCCESS
      - Lint check: PASSED
    </action>
  </step>
```

**Rationale:** Makes test execution a required workflow step that cannot be skipped.

---

### Change 4.3: Dev-Story Checklist Update

**File:** `.bmad/bmm/workflows/4-implementation/dev-story/checklist.md`

**OLD:**
```markdown
## Final Status

- [ ] Regression suite executed successfully
- [ ] Story Status is set to "Ready for Review"
```

**NEW:**
```markdown
## Mandatory Test Execution (Cannot Skip)

- [ ] Backend test suite executed (`mvn test`) - ALL tests pass
- [ ] Frontend test suite executed (`npm test`) - ALL tests pass
- [ ] Backend compilation verified (`mvn compile`) - Zero errors
- [ ] Frontend build verified (`npm run build`) - Zero errors
- [ ] Frontend lint check passed (`npm run lint`) - Zero errors
- [ ] Test results documented in Completion Notes

## Final Status

- [ ] All mandatory tests passed and builds verified
- [ ] Regression suite executed successfully
- [ ] Story Status is set to "Ready for Review"
```

**Rationale:** Adds explicit checklist items for test execution requirements.

---

### Change 4.4: Story 3-6 Update

**File:** `docs/sprint-artifacts/epic-3/3-6-tenant-lease-extension-and-renewal.md`

**Add after AC16 (Testing Requirements):**

```markdown
17. **AC17 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

18. **AC18 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]
```

**Add to Tasks section after Task 14:**

```markdown
- [ ] **Task 15: Mandatory Test Execution and Build Verification** (AC: #17, #18)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests
  - [ ] Execute backend build: `mvn compile` - Zero errors
  - [ ] Execute frontend build: `npm run build` - Zero errors
  - [ ] Execute frontend lint: `npm run lint` - Zero errors
  - [ ] Document results in Completion Notes
```

---

### Change 4.5: Story 3-7 Update

**File:** `docs/sprint-artifacts/epic-3/3-7-tenant-checkout-and-deposit-refund.md`

**Add after AC18 (Testing Requirements):**

```markdown
19. **AC19 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

20. **AC20 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]
```

**Add to Tasks section after Task 14:**

```markdown
- [ ] **Task 15: Mandatory Test Execution and Build Verification** (AC: #19, #20)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests
  - [ ] Execute backend build: `mvn compile` - Zero errors
  - [ ] Execute frontend build: `npm run build` - Zero errors
  - [ ] Execute frontend lint: `npm run lint` - Zero errors
  - [ ] Document results in Completion Notes
```

---

### Change 4.6: Story 6-1 Update

**File:** `docs/sprint-artifacts/epic-6/6-1-rent-invoicing-and-payment-management.md`

**Add after AC31 (Frontend Unit Tests):**

```markdown
32. **AC32 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

33. **AC33 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]
```

**Add to Tasks section after Task 25:**

```markdown
- [ ] **Task 26: Mandatory Test Execution and Build Verification** (AC: #32, #33)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests
  - [ ] Execute backend build: `mvn compile` - Zero errors
  - [ ] Execute frontend build: `npm run build` - Zero errors
  - [ ] Execute frontend lint: `npm run lint` - Zero errors
  - [ ] Document results in Completion Notes
```

---

### Change 4.7: Story 6-2 Update

**File:** `docs/sprint-artifacts/epic-6/6-2-expense-management-and-vendor-payments.md`

**Add after AC32 (Frontend Unit Tests):**

```markdown
33. **AC33 - Mandatory Test Execution:** After all implementation tasks are complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes: "Backend: X/X passed, Frontend: X/X passed". [Source: Sprint Change Proposal 2025-11-28]

34. **AC34 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal 2025-11-28]
```

**Add to Tasks section after Task 27:**

```markdown
- [ ] **Task 28: Mandatory Test Execution and Build Verification** (AC: #33, #34)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests
  - [ ] Execute backend build: `mvn compile` - Zero errors
  - [ ] Execute frontend build: `npm run build` - Zero errors
  - [ ] Execute frontend lint: `npm run lint` - Zero errors
  - [ ] Document results in Completion Notes
```

---

## Section 5: Implementation Handoff

### Change Scope: Minor

**Rationale:** Changes are process-focused, affect templates and story files only, no code changes required.

### Handoff: Development Team (Direct Implementation)

**Deliverables:**
1. Update story template with Final Validation Requirements section
2. Update dev-story workflow with Step 5.5 (mandatory test execution)
3. Update dev-story checklist with new items
4. Update stories 3-6, 3-7, 6-1, 6-2 with new ACs and tasks

### Success Criteria:
- All future stories automatically include Final Validation Requirements
- Dev-story workflow enforces test execution before completion
- All current drafted stories have explicit test execution ACs
- No story can be marked "done" without passing all tests and builds

---

## Approval

**Prepared by:** Bob (SM Agent)
**Date:** 2025-11-28

**Approval Status:** Awaiting User Review

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
