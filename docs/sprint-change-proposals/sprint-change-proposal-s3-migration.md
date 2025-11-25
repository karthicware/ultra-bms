# Sprint Change Proposal: AWS S3 File Storage Integration

**Date:** 2025-11-22
**Workflow:** `*correct-course` (Sprint Change Management)
**Change Type:** Direct Adjustment (Option 1)
**Scope:** Infrastructure Enhancement - Epic 1
**Impact Level:** Medium (3-5 day implementation, no PRD changes)

---

## Executive Summary

This proposal documents the acceleration of AWS S3 file storage integration from future backlog to immediate implementation. S3 was always planned in the architecture but scheduled for later implementation. A production bug with missing local files revealed the need to prioritize cloud storage infrastructure now, during the foundation phase (Epic 1), rather than retrofitting it later.

**Decision:** Add Story 1.6 to Epic 1 for immediate implementation before continuing with Epic 3+ stories.

---

## 1. Change Trigger & Context

### What Happened?
- **Trigger Event:** Production bug discovered - document uploads were rejected (PDF files not in ALLOWED_MIME_TYPES)
- **Root Cause Analysis:** FileStorageService using local filesystem with limited validation
- **User Impact:** Document download failures, orphaned database records, missing physical files
- **Discovery:** During debugging of Lead Management (Epic 3, Story 3.1)

### Why Accelerate S3 Now?
1. **Already Planned:** S3 is documented in architecture.md (lines 125, 1780, 1818) - this is NOT new scope
2. **Foundation Timing:** Better to implement infrastructure during Epic 1 (Platform Foundation) than retrofit across 7+ epics
3. **Future-Proofing:** Epic 3 (Tenant), Epic 4 (Maintenance), Epic 5 (Vendor), Epic 6 (Financial), Epic 7 (Compliance) all require document storage
4. **Reliability:** Cloud storage eliminates local file management issues
5. **Scalability:** Multi-tenant application requires scalable storage from day 1

### User Decision Points:
- **Scope:** ALL document uploads (not just leads) ✅
- **Mode:** Incremental (review each change) ✅
- **Epic Placement:** Epic 1 (infrastructure), not Epic 3 (tenants) ✅
- **Story Number:** 1.6 (after Story 1.5) ✅

---

## 2. Epic Impact Analysis

### Epic 1: Platform Foundation & Infrastructure
- **Status:** MODIFIED ✅
- **Original:** 5 stories (1.1-1.5), all DONE
- **Updated:** 6 stories (1.1-1.6)
- **New Story:** 1.6 - AWS S3 File Storage Integration (status: backlog)
- **Impact:** Extends Epic 1 completion by 3-5 days
- **Retrospective:** Remains optional (can defer until after 1.6)

### Epic 2: Authentication & User Management
- **Status:** NO CHANGE
- **Completion:** All stories DONE, retrospective completed

### Epic 3: Tenant Management & Portal
- **Status:** BENEFITS FROM CHANGE
- **Current Progress:** 5 technical stories DONE, 1 E2E story in review
- **Impact:** S3 already implemented for Story 3.1 (leads) and 3.3 (tenant onboarding)
- **Benefit:** Future Epic 3 stories use S3 from day 1 (no retrofitting needed)
- **No Delays:** Epic 3 work can pause while 1.6 is implemented

### Epic 4-9: Future Epics
- **Status:** BENEFITS FROM CHANGE
- **Impact:** All future document uploads use S3 infrastructure from day 1
- **Benefit:** Consistent storage strategy across all modules

---

## 3. Artifact Changes Summary

### ✅ Completed Changes:

#### 1. Epic 1 File
**File:** `docs/epics/epic-1-platform-foundation-infrastructure.md`
**Change:** Added Story 1.6 after Story 1.5 (lines 337-408)
**Content:** Complete user story with acceptance criteria, LocalStack integration, presigned URLs, multi-module support

#### 2. Sprint Status File
**File:** `docs/sprint-artifacts/sprint-status.yaml`
**Change:** Updated Epic 1 section (line 36: "5 stories" → "6 stories", line 43: added 1.6 entry)
**Status:** `1-6-aws-s3-file-storage-integration: backlog`
**Comment:** Documents change date (2025-11-22) and reason (sprint change via *correct-course)

#### 3. Architecture Document
**File:** `docs/architecture.md`
**Change:** Updated Development Environment Configuration (line 1813)
**Old:** "Local file storage"
**New:** "LocalStack (S3 emulation on localhost:4566)"
**Rationale:** Aligns development environment with S3 architecture

### ❌ No Changes Needed:
- **PRD:** S3 is implementation detail, not user-facing feature
- **Tech Specs:** None exist yet for Epic 1 (infrastructure stories)
- **Staging/Production:** Already documented as using S3 (lines 1818, 1822)

---

## 4. Implementation Plan

### Phase 1: Story Preparation (SM Agent)
**Timeline:** Immediate (Day 0)

✅ **Completed:**
1. Epic 1 file updated with Story 1.6
2. sprint-status.yaml updated
3. architecture.md updated
4. Sprint change proposal document created

⏭️ **Next Steps:**
1. Route to Dev team for implementation
2. Optionally: Generate epic tech context for Story 1.6 (via `*epic-tech-context`)
3. Optionally: Draft full story document (via `*create-story`)

### Phase 2: Story Development (Dev Agent)
**Timeline:** 3-5 days
**Story:** 1.6 - AWS S3 File Storage Integration

**Tasks (from Story 1.6 Acceptance Criteria):**

1. **Backend Infrastructure (Days 1-2):**
   - Add AWS SDK dependency: `software.amazon.awssdk:s3:2.x`
   - Create S3FileStorageServiceImpl implementing FileStorageService interface
   - Configure S3 client with region (me-central-1) and LocalStack endpoint
   - Update application.yml with S3 properties (bucket-name, region, endpoint)
   - Implement upload with UUID-based keys: `{module}/{entityId}/documents/{uuid}.{ext}`
   - Implement download with presigned URLs (5-minute expiration)
   - Implement delete with idempotent handling
   - Add Docker Compose service for LocalStack (image: localstack/localstack:3.0)

2. **Frontend Integration (Day 3):**
   - Update download flow to use presigned URLs from backend
   - Remove direct file streaming (backend now returns URL)
   - Update upload components for all modules (leads, properties, tenants, etc.)
   - Test with PDF, JPG, PNG across all modules

3. **Testing (Day 4):**
   - Unit tests: S3FileStorageServiceImpl
   - Integration tests: LocalStack S3 operations
   - E2E tests: Document upload/download/delete flows
   - Multi-module testing: Verify all 7 modules work with S3

4. **Documentation (Day 5):**
   - Update README with LocalStack setup instructions
   - Document S3 IAM policy requirements for production
   - Update developer onboarding docs
   - Create deployment guide for staging/production S3 setup

### Phase 3: Testing & Validation
**Owner:** Dev team
**Checklist:**
- [ ] LocalStack runs successfully on localhost:4566
- [ ] All file types upload correctly (PDF, JPG, PNG)
- [ ] Presigned URLs download files without backend streaming
- [ ] Delete operations are idempotent
- [ ] All 7 modules tested (leads, properties, tenants, maintenance, vendors, financial, compliance)
- [ ] No hardcoded local filesystem paths remain
- [ ] Configuration switchable between LocalStack (dev) and AWS S3 (staging/prod)
- [ ] All tests passing (unit, integration, E2E)

### Phase 4: Story Completion
**Owner:** Dev team
**Actions:**
1. Update sprint-status.yaml: `1-6: backlog` → `1-6: done`
2. Add completion notes to Story 1.6 (files modified, dependencies, test results)
3. Commit all changes with message referencing Story 1.6
4. Mark story complete via `*story-done` workflow

---

## 5. Recommended Path Forward & Rationale

### Selected Option: **Direct Adjustment (Option 1)**

**Why This Option?**
1. **No PRD Impact:** S3 is already documented in architecture - this is implementation detail, not scope change
2. **Minimal Disruption:** 3-5 day story added to Epic 1 (foundation), no other epics blocked
3. **Logical Placement:** Infrastructure belongs in Epic 1, not bolted onto Epic 3 (tenants)
4. **Clean Handoff:** Epic 1 completed end-to-end before Epic 3+ stories resume
5. **No Backlog Entry:** Story added directly to epic file, no separate backlog management needed

**Alternative Options Rejected:**
- ❌ **Fast-Track (Option 2):** Not needed - S3 was always planned, just accelerated
- ❌ **Backlog Entry (Option 3):** Too heavyweight - this is simple epic adjustment
- ❌ **Emergency Fix (Option 4):** Not an emergency - production workaround exists (PDF fix already deployed)

---

## 6. PRD MVP Impact & Timeline

### MVP Scope: NO CHANGE ✅
- **PRD Status:** S3 is implementation detail, not user-facing feature
- **MVP Definition:** Unchanged - no new features added
- **User Stories:** No PRD updates required

### Timeline Impact: +3-5 Days
- **Original Epic 1 Timeline:** Stories 1.1-1.5 complete
- **Updated Epic 1 Timeline:** +3-5 days for Story 1.6
- **Epic 3 Timeline:** Paused during Story 1.6 (resumable afterward)
- **Overall Project:** Minimal impact - infrastructure work pays dividends across all future epics

### Risk Mitigation:
- **LocalStack Complexity:** Docker Compose simplifies local setup (no AWS credentials needed)
- **Migration Effort:** FileStorageService is already abstracted - swap implementation, not rewrite code
- **Testing Scope:** All modules tested once, then reusable pattern for future stories

---

## 7. Agent Handoff Plan

### Primary Owner: **Dev Team**
**Workflow:** Use `*dev-story` workflow
**Story ID:** 1.6 - AWS S3 File Storage Integration
**Epic File:** `docs/epics/epic-1-platform-foundation-infrastructure.md`
**Story Status:** backlog → drafted → ready-for-dev → in-progress → review → done

**Handoff Checklist:**
- ✅ Epic 1 file contains complete Story 1.6 with acceptance criteria
- ✅ sprint-status.yaml tracks Story 1.6
- ✅ architecture.md updated for LocalStack
- ✅ Sprint change proposal documents rationale
- ⏭️ Dev team reviews Story 1.6 acceptance criteria
- ⏭️ Dev team implements Story 1.6
- ⏭️ Dev team updates sprint-status.yaml on completion

### Secondary Owner: **DevOps Team** (Optional)
**Scope:** LocalStack Docker Compose setup, S3 bucket creation (staging/prod)
**Timeline:** Can happen in parallel with dev work
**Deliverables:**
- LocalStack service in docker-compose.yml
- S3 bucket creation scripts for staging/prod
- IAM policy documentation for production deployment

---

## 8. Risks & Mitigation Strategies

### Risk 1: LocalStack Learning Curve
**Probability:** Low
**Impact:** Low (1 day delay max)
**Mitigation:**
- LocalStack is S3-compatible - same AWS SDK calls
- Extensive documentation available
- Docker Compose simplifies setup

### Risk 2: Presigned URL Implementation
**Probability:** Medium
**Impact:** Medium (2 day delay max)
**Mitigation:**
- Well-documented AWS SDK pattern
- Frontend already handles download URLs (just switch from backend stream to presigned URL)
- Can test with LocalStack before production deployment

### Risk 3: Multi-Module Testing Scope
**Probability:** Medium
**Impact:** Low (1 day testing extension)
**Mitigation:**
- FileStorageService abstraction means one implementation serves all modules
- Test pattern is reusable (upload → download → delete)
- Current modules already implement upload (just switching backend)

### Risk 4: Production S3 Bucket Setup
**Probability:** Low
**Impact:** Low (DevOps handles separately)
**Mitigation:**
- DevOps team creates buckets and IAM policies
- Configuration in application.yml (no code changes)
- Staging environment tests production S3 before release

---

## 9. Success Criteria

### Story 1.6 Complete When:
1. ✅ LocalStack runs successfully in Docker
2. ✅ All file uploads use S3 (no local filesystem)
3. ✅ Presigned URLs work for downloads
4. ✅ All 7 modules tested with S3
5. ✅ All tests passing (unit, integration, E2E)
6. ✅ Documentation updated
7. ✅ sprint-status.yaml updated to `done`

### Sprint Change Successful When:
1. ✅ Epic 1 file contains Story 1.6
2. ✅ sprint-status.yaml tracks Story 1.6
3. ✅ architecture.md reflects LocalStack
4. ✅ Dev team implements Story 1.6
5. ✅ Future epics (3-9) benefit from S3 infrastructure

---

## 10. Communication Plan

### Stakeholders Notified:
- ✅ **User (Nata):** Participated in *correct-course workflow, approved all changes
- ⏭️ **Dev Team:** Handoff via this proposal document
- ⏭️ **DevOps Team:** Optional notification for LocalStack/S3 setup

### Documentation Updated:
- ✅ `docs/epics/epic-1-platform-foundation-infrastructure.md`
- ✅ `docs/sprint-artifacts/sprint-status.yaml`
- ✅ `docs/architecture.md`
- ✅ `docs/sprint-change-proposals/sprint-change-proposal-s3-migration.md` (this document)

### Next Communication:
- Dev team updates sprint-status.yaml when Story 1.6 moves to `in-progress`
- Dev team adds completion notes when Story 1.6 moves to `done`
- SM reviews via `*code-review` when Story 1.6 moves to `review`

---

## 11. Appendix: Technical References

### Relevant Architecture Sections:
- **Line 125:** "File Storage: AWS S3 - Latest - Scalable object storage in UAE region"
- **Line 1780:** "Application Storage: Amazon S3 (UAE region)"
- **Line 1813:** "Development: LocalStack (S3 emulation on localhost:4566)"
- **Line 1818:** "Staging: S3 storage"

### Related Files:
- Backend: `backend/src/main/java/com/ultrabms/service/impl/FileStorageServiceImpl.java`
- Frontend: `frontend/src/services/leads.service.ts` (downloadDocument function)
- Controller: `backend/src/main/java/com/ultrabms/controller/LeadController.java` (download endpoint)

### Dependencies to Add:
```xml
<!-- pom.xml -->
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.x</version>
</dependency>
```

### Docker Compose Addition:
```yaml
# docker-compose.yml
services:
  localstack:
    image: localstack/localstack:3.0
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - ./localstack-data:/tmp/localstack/data
```

---

## Approval & Sign-Off

**Prepared By:** SM Agent (Scrum Master)
**Date:** 2025-11-22
**Workflow:** `*correct-course` (Sprint Change Management)
**Mode:** Incremental (all changes reviewed and approved)

**Approved By:** Nata (Product Owner)
**Approval Date:** 2025-11-22
**Decision:** Proceed with Story 1.6 implementation

**Next Step:** Route to Dev team for Story 1.6 implementation

---

*This proposal was generated using the BMad Method *correct-course workflow for managing sprint changes during implementation phase.*
