# Sprint Change Proposal: PDC Auto-Creation from OCR Cheque Details

**Date:** 2025-12-12
**Proposed By:** Bob (Scrum Master)
**Change Scope:** Minor
**Status:** Draft

---

## 1. Issue Summary

### Problem Statement
When tenant onboarding completes successfully, the system does NOT create PDC (Post-Dated Cheque) records from the OCR-processed cheque details. This is a missing integration between the tenant onboarding process and the PDC management system.

### Discovery Context
- Identified during review of quotation-to-tenant conversion flow
- Frontend already sends `chequeDetails` JSON with OCR-extracted data (bankName, chequeNumber, amount, chequeDate)
- Backend `TenantController` does not receive this parameter
- No code exists to create PDC records during tenant creation

### Evidence
1. **Frontend sends data:** `page.tsx:416` - `submitData.append('chequeDetails', JSON.stringify(...))`
2. **Backend ignores data:** `TenantController.java` - no `chequeDetails` parameter in `createTenant()`
3. **No PDC creation:** `TenantServiceImpl.java` - no call to `PDCService.createBulkPDCs()`

---

## 2. Impact Analysis

### Epic Impact
| Epic | Impact | Details |
|------|--------|---------|
| Tenant Onboarding | Minor Enhancement | Add PDC creation step after tenant saved |
| PDC Management | No Change | Existing `createBulkPDCs()` is sufficient |

### Story Impact
- **Current Stories:** No blocking issues
- **New Requirement:** Enhancement to tenant creation flow

### Artifact Conflicts
| Artifact | Conflict | Resolution |
|----------|----------|------------|
| PRD | None | Feature aligns with existing requirements |
| Architecture | None | PDC infrastructure exists |
| UI/UX | None | Frontend already implements OCR upload |

### Technical Impact
- Backend-only changes
- No database schema changes
- No breaking changes to existing APIs

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment ✅

Modify existing tenant creation flow to receive and process cheque details.

### Rationale
- **Low Effort:** 4 files to modify, 1 new DTO
- **Low Risk:** Non-breaking change, PDC infrastructure proven
- **High Value:** Completes the tenant onboarding automation
- **No Rollback Needed:** Adding new functionality, not changing existing

### Effort Estimate
| Task | Effort |
|------|--------|
| Create ChequeDetailDto | 15 min |
| Update TenantController | 15 min |
| Update TenantService interface | 10 min |
| Add PDC creation logic | 45 min |
| Testing | 30 min |
| **Total** | ~2 hours |

### Risk Assessment
- **Technical Risk:** Low - using existing PDCService.createBulkPDCs()
- **Integration Risk:** Low - frontend already sends correct data format
- **Regression Risk:** Low - additive change, doesn't modify existing behavior

---

## 4. Detailed Change Proposals

### 4.1 Create ChequeDetailDto (NEW FILE)

**File:** `backend/src/main/java/com/ultrabms/dto/tenant/ChequeDetailDto.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChequeDetailDto {
    private Integer chequeIndex;
    private String fileName;
    private String bankName;         // For PDC
    private String chequeNumber;     // For PDC
    private BigDecimal amount;       // For PDC
    private LocalDate chequeDate;    // For PDC
    private String payTo;
    private String chequeFrom;
    private String status;           // SUCCESS, PARTIAL, FAILED
    private Double confidenceScore;
}
```

### 4.2 Update TenantController

**File:** `backend/src/main/java/com/ultrabms/controller/TenantController.java`

**Change:** Add parameter to `createTenant()` method

```java
// ADD: New parameter
@RequestParam(value = "chequeDetails", required = false) String chequeDetailsJson
```

**Pass to service call.**

### 4.3 Update TenantService Interface

**File:** `backend/src/main/java/com/ultrabms/service/TenantService.java`

**Change:** Add `chequeDetailsJson` parameter to method signatures.

### 4.4 Update TenantServiceImpl

**File:** `backend/src/main/java/com/ultrabms/service/impl/TenantServiceImpl.java`

**4.4a Inject PDCService:**
```java
private final PDCService pdcService;
```

**4.4b Add helper method:**
```java
/**
 * SCP-2025-12-12: Create PDC records from OCR cheque details
 */
private void createPDCsFromChequeDetails(
    Tenant savedTenant,
    String chequeDetailsJson,
    UUID createdBy
) {
    // 1. Parse JSON to List<ChequeDetailDto>
    // 2. Filter: only SUCCESS status, has bankName & chequeNumber
    // 3. Build PDCBulkCreateDto
    // 4. Call pdcService.createBulkPDCs()
    // 5. Log results
}
```

**4.4c Call from createTenant() (both overloads):**
```java
// After tenant saved and quotation marked as converted
if (chequeDetailsJson != null && !chequeDetailsJson.isEmpty()) {
    createPDCsFromChequeDetails(savedTenant, chequeDetailsJson, userId);
}
```

---

## 5. Implementation Handoff

### Change Scope Classification: Minor

Direct implementation by development team. No backlog reorganization needed.

### Handoff Recipients

| Role | Responsibility |
|------|----------------|
| **Developer (Amelia)** | Implement backend changes |
| **Scrum Master (Bob)** | Track completion, update sprint status |

### Success Criteria

1. ✅ `TenantController` receives `chequeDetails` parameter
2. ✅ PDC records created in `pdcs` table after tenant onboarding
3. ✅ Only SUCCESS status cheques create PDCs
4. ✅ PDC creation failure does NOT rollback tenant creation
5. ✅ Existing tenant creation flow unchanged for non-quotation tenants

### Implementation Notes

- Cheque numbers are REAL numbers from OCR (not placeholders)
- Bank names come per-cheque from OCR extraction
- No filtering for first month CASH - OCR only processes uploaded cheques
- Error handling: Log and continue if PDC creation fails

---

## 6. Approval & Implementation

**Approval Status:** ✅ Approved and Implemented

- [x] Product Owner approval
- [x] Technical review
- [x] Implementation completed

### Implementation Summary

**Files Modified:**
1. `backend/src/main/java/com/ultrabms/dto/tenant/ChequeDetailDto.java` - NEW
2. `backend/src/main/java/com/ultrabms/controller/TenantController.java` - Added `chequeDetailsJson` parameter
3. `backend/src/main/java/com/ultrabms/service/TenantService.java` - Updated interface
4. `backend/src/main/java/com/ultrabms/service/impl/TenantServiceImpl.java` - Added PDC creation logic

**Build Status:** ✅ Compiled successfully

---

*Generated by BMad Method - Correct Course Workflow*
*Implemented: 2025-12-12*
