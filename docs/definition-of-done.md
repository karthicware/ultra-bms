# Definition of Done (DoD) Checklist

**Project:** Ultra BMS - Building Maintenance Software Platform
**Version:** 2.0
**Last Updated:** November 15, 2025
**Effective:** Epic 3 onwards

---

## Purpose

This Definition of Done checklist ensures consistent quality standards across all user stories. Every story must meet ALL criteria below before being marked as "done".

---

## Story Completion Criteria

### ✅ 1. Requirements & Acceptance Criteria

- [ ] **All acceptance criteria met** - Every AC from the story file is satisfied
- [ ] **Edge cases handled** - Common error scenarios and edge cases are addressed
- [ ] **No scope creep** - Implementation stays within defined story boundaries
- [ ] **Deviations documented** - Any changes from original ACs are noted in completion notes

---

### ✅ 2. Code Quality

- [ ] **Code follows project patterns** - Adheres to established architectural patterns
- [ ] **Clean code principles** - Readable, maintainable, and well-structured
- [ ] **No code smells** - No obvious anti-patterns or technical debt
- [ ] **Error handling implemented** - Proper try-catch blocks and error messages
- [ ] **Security best practices** - No vulnerabilities (XSS, SQL injection, etc.)
- [ ] **Performance optimized** - No obvious performance bottlenecks

---

### ✅ 3. Testability & Testing ⭐ **MANDATORY FROM EPIC 3**

#### 3.1 Test Attributes (P0 - BLOCKING)
- [ ] **All interactive elements have data-testid attributes** ⭐ **NEW**
  - Buttons: `data-testid="btn-{action}"` (e.g., `btn-submit`, `btn-cancel`)
  - Forms: `data-testid="form-{name}"` (e.g., `form-login`, `form-register`)
  - Inputs: `data-testid="input-{field}"` (e.g., `input-email`, `input-password`)
  - Links: `data-testid="link-{destination}"` (e.g., `link-register`)
  - Modals/Dialogs: `data-testid="modal-{purpose}"` (e.g., `modal-confirm`)
  - Navigation: `data-testid="nav-{page}"` (e.g., `nav-dashboard`)
- [ ] **Naming convention followed** - `{component}-{element}-{action}` pattern
- [ ] **Verified in code review** - Reviewer confirms all test attributes present

#### 3.2 Test Coverage
- [ ] **Unit tests written** - Business logic and core functionality tested
- [ ] **Integration tests added** - Component interactions tested where applicable
- [ ] **E2E tests created** - Critical user flows covered
- [ ] **Edge cases tested** - Error scenarios and boundary conditions covered
- [ ] **Coverage thresholds met**:
  - Backend: ≥80% line coverage, ≥70% branch coverage
  - Frontend: ≥70% line coverage, ≥60% branch coverage
  - E2E: All critical flows covered

#### 3.3 Test Execution (P0 - BLOCKING) ⭐ **NEW**
- [ ] **Servers verified running before tests** ⭐ **NEW**
  - Backend server health check passed (port 8080)
  - Frontend server health check passed (port 3000)
  - `scripts/check-services.sh` executed successfully
- [ ] **All tests passing** - No failing tests in the test suite
- [ ] **No regressions** - Existing tests still pass
- [ ] **Test results documented** - Pass/fail counts noted in completion notes

---

### ✅ 4. Code Review

- [ ] **Code reviewed** - At least one peer review completed
- [ ] **Review comments addressed** - All feedback resolved or discussed
- [ ] **No blocking issues** - No high-severity problems remaining
- [ ] **Approval obtained** - Reviewer has approved the changes

---

### ✅ 5. Documentation

#### 5.1 Code Documentation
- [ ] **Complex logic commented** - Non-obvious code has explanatory comments
- [ ] **API endpoints documented** - Request/response formats clear
- [ ] **Component props documented** - TypeScript interfaces/types defined

#### 5.2 Story Documentation ⭐ **UPDATED**
- [ ] **Completion notes added** ⭐ **MANDATORY FROM EPIC 3**
  - Implementation summary provided
  - All files created/modified listed
  - All dependencies added documented
  - Test results included (pass counts, coverage %)
  - Any deviations from ACs noted
  - Same quality level as Story 2-5
- [ ] **File list updated** - All changed files tracked in story
- [ ] **Change log updated** - Story changelog reflects completion
- [ ] **Status updated** - Story status reflects current state

#### 5.3 Project Documentation
- [ ] **README updated** - If setup/usage changes occurred
- [ ] **Architecture docs updated** - If architectural changes made
- [ ] **API docs updated** - If API contracts changed

---

### ✅ 6. Integration & Build

- [ ] **Linting passes** - No linting errors or warnings
- [ ] **Type checking passes** - No TypeScript errors
- [ ] **Build succeeds** - Project builds without errors
- [ ] **No console errors** - Browser/terminal console is clean
- [ ] **Dependencies properly added** - package.json / pom.xml updated correctly

---

### ✅ 7. User Experience

- [ ] **Responsive design verified** - Works on desktop, tablet, mobile
- [ ] **Accessibility checked** - Keyboard navigation, ARIA labels where needed
- [ ] **Loading states implemented** - User feedback during async operations
- [ ] **Error messages clear** - Users understand what went wrong
- [ ] **Happy path tested** - Normal user flow works end-to-end

---

### ✅ 8. Sprint Tracking ⭐ **MANDATORY FROM EPIC 3**

- [ ] **sprint-status.yaml updated** ⭐ **NEW**
  - Story status accurately reflects completion
  - Update committed in same commit as final code
  - Verified in code review

---

### ✅ 9. Security & Performance

- [ ] **No security vulnerabilities** - OWASP top 10 considered
- [ ] **Sensitive data protected** - No credentials in code, proper encryption
- [ ] **Performance acceptable** - Page load < 2s, API response < 200ms
- [ ] **No memory leaks** - Proper cleanup of listeners/subscriptions

---

### ✅ 10. Deployment Readiness

- [ ] **Environment variables documented** - New env vars noted in .env.example
- [ ] **Database migrations created** - If schema changes were made
- [ ] **Backward compatible** - Changes don't break existing functionality
- [ ] **Rollback plan exists** - Clear path to revert if needed

---

## Story Workflow States

| Status | Description | DoD Requirements |
|--------|-------------|------------------|
| **backlog** | Story only exists in epic file | None |
| **drafted** | Story file created by SM | None |
| **ready-for-dev** | Story approved and ready | None |
| **in-progress** | Developer actively working | Partial - work in progress |
| **review** | Implementation complete, awaiting review | **ALL DoD items checked** ✅ |
| **done** | Story completed and merged | **ALL DoD items checked + Review approved** ✅ |

---

## Epic 2 Retrospective Learnings

### What We Learned
- ❌ **Missing data-testid attributes** caused many E2E test failures
- ❌ **No server health checks** led to wasted time running tests against stopped servers
- ❌ **Inconsistent completion notes** made it difficult to understand implementation details
- ❌ **sprint-status.yaml not updated** led to inaccurate sprint tracking

### What We Fixed (Epic 3+)
- ✅ **Mandatory data-testid attributes** on all interactive elements
- ✅ **Pre-test server validation** via `scripts/check-services.sh`
- ✅ **Mandatory completion notes** with comprehensive details
- ✅ **Mandatory sprint-status.yaml updates** in same commit as code

---

## How to Use This Checklist

### For Developers

1. **Before starting a story:**
   - Read this DoD checklist
   - Understand all requirements
   - Keep it open while developing

2. **During development:**
   - Add `data-testid` attributes as you create components
   - Write tests alongside implementation
   - Document as you go

3. **Before marking story "review":**
   - Go through this entire checklist
   - Check every box
   - Fix any missing items

### For Reviewers

1. **During code review:**
   - Verify developer checked all DoD items
   - Spot-check critical items (data-testid, tests, docs)
   - Ensure no items were overlooked

2. **Before approval:**
   - All DoD items must be satisfied
   - No exceptions for P0 items (testability, server checks, documentation)

### For Scrum Master

1. **When creating stories:**
   - Reference this DoD in story template
   - Ensure ACs align with DoD standards

2. **During retrospectives:**
   - Review DoD effectiveness
   - Update DoD based on learnings
   - Track DoD compliance metrics

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-11-15 | Added mandatory data-testid, server validation, completion notes, sprint-status updates based on Epic 2 retrospective | Bob (SM) |
| 1.0 | 2025-11-01 | Initial DoD checklist | Team |

---

## References

- **Epic 2 Retrospective:** `docs/retrospectives/epic-2-retrospective.md`
- **Action Items:** `docs/sprint-artifacts/sprint-status.yaml` (action_items section)
- **data-testid Naming Conventions:** See "Testability by Design" in retrospective
- **Pre-test Validation Script:** `frontend/scripts/check-services.sh`

---

**Remember:** The Definition of Done is not just a checklist - it's a commitment to quality. Every item represents a lesson learned or a standard we uphold. Take it seriously, and our codebase will reflect that commitment.
