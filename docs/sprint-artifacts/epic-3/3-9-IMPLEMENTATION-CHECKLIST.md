# Story 3.9: Implementation Checklist for Dev Agent

**Story:** Tenant Onboarding Bank Account Integration
**Status:** drafted
**SCP Reference:** docs/scp/SCP-2025-12-10-bank-account-integration.md
**Story File:** docs/sprint-artifacts/epic-3/3-9-tenant-onboarding-bank-account-integration.md
**Estimated Effort:** 1-2 days (LOW complexity)

---

## 🎯 Quick Summary

**Objective:** Enable bank account selection during tenant onboarding Step 3 (Financial Information) by replacing the read-only primary bank account display with a selectable dropdown.

**Current Issue:**
- Step 3 shows error: _"No primary bank account configured. Please contact admin to set up a bank account."_
- Users cannot select from multiple bank accounts
- Implementation added bank account field NOT in original Story 3.3 requirements

**Solution:**
- Backend: Add `bank_account_id` FK to `tenants` table
- Frontend: Replace error with bank account `Select` dropdown
- Integration: Fetch accounts via React Query, optional field (tenant can be created without bank account)

---

## 📋 Implementation Checklist

### Phase 1: Backend (4-5 hours)

#### 1.1 Database Migration ✅
- [ ] Create `backend/src/main/resources/db/migration/V68__add_bank_account_to_tenants.sql`
- [ ] Add column: `ALTER TABLE tenants ADD COLUMN bank_account_id UUID NULL;`
- [ ] Add FK constraint: `FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL`
- [ ] Add index: `CREATE INDEX idx_tenants_bank_account_id ON tenants(bank_account_id);`
- [ ] Test migration: `mvn flyway:migrate`
- [ ] Verify rollback script works

#### 1.2 Entity Update ✅
- [ ] Update `backend/src/main/java/com/ultrabms/entity/Tenant.java`
- [ ] Add field:
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "bank_account_id")
  private BankAccount bankAccount;
  ```
- [ ] Add getter/setter methods
- [ ] Verify Hibernate mapping in existing tests

#### 1.3 DTO Updates ✅
- [ ] Update `TenantRequest` DTO: Add `private String bankAccountId;` (optional)
- [ ] Create `BankAccountSummary` nested DTO with fields:
  - `id` (String)
  - `bankName` (String)
  - `accountName` (String)
  - `accountNumberMasked` (String) - format `"**** 1234"`
- [ ] Update `TenantResponse` DTO: Add `private BankAccountSummary bankAccount;` (optional)
- [ ] Update Swagger/OpenAPI annotations

#### 1.4 Service Layer ✅
- [ ] Update `TenantServiceImpl.createTenant()`:
  - Accept `bankAccountId` from request (optional)
  - If provided:
    - Validate exists: `bankAccountRepository.findById(bankAccountId).orElseThrow(() -> new ResourceNotFoundException("Bank account not found"))`
    - Validate status: `if (status != ACTIVE) throw new ValidationException("Bank account must be active")`
    - Link: `tenant.setBankAccount(bankAccount)`
  - If null/empty: proceed without validation error
- [ ] Ensure transaction rollback on failure

#### 1.5 Backend Unit Tests ✅
- [ ] Add tests to `TenantServiceTest.java`:
  - `testCreateTenantWithValidBankAccount()` - Success with bank account linked
  - `testCreateTenantWithNullBankAccount()` - Success without bank account
  - `testCreateTenantWithInvalidBankAccountId()` - Throws `ResourceNotFoundException`
  - `testCreateTenantWithInactiveBankAccount()` - Throws `ValidationException`
  - `testUpdateTenantChangeBankAccount()` - Update existing tenant's bank account
- [ ] Mock `BankAccountRepository` for isolation
- [ ] Run: `mvn test -Dtest=TenantServiceTest`

---

### Phase 2: Frontend (4-5 hours)

#### 2.1 TypeScript Types ✅
- [ ] Update `frontend/src/types/tenant.ts`:
  ```typescript
  export interface TenantCreateRequest {
    // ... existing fields
    bankAccountId?: string; // Optional: UUID of bank account
  }

  export interface TenantResponse {
    // ... existing fields
    bankAccount?: {
      id: string;
      bankName: string;
      accountName: string;
      accountNumberMasked: string; // "**** 1234"
    };
  }
  ```

#### 2.2 React Query Hook ✅
- [ ] Check if `frontend/src/hooks/useBankAccounts.ts` exists from Story 6.5
- [ ] If NOT exists, create:
  ```typescript
  export function useBankAccounts() {
    return useQuery({
      queryKey: ['bankAccounts'],
      queryFn: () => getBankAccounts(), // GET /api/v1/bank-accounts
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }
  ```
- [ ] If exists, reuse hook

#### 2.3 FinancialInfoStep Component Update ✅
**File:** `frontend/src/components/tenants/FinancialInfoStep.tsx`

**Remove:**
- [ ] Delete `getPrimaryBankAccount()` call (lines ~123-137)
- [ ] Delete error alert "No primary bank account configured..." (lines ~391-397)
- [ ] Delete primary bank account display logic (read-only section)

**Add:**
- [ ] Import `useBankAccounts` hook
- [ ] Import shadcn `Select` components (already installed)
- [ ] Add bank account dropdown AFTER cheque upload section, BEFORE Actions buttons:
  ```tsx
  <FormField
    control={form.control}
    name="bankAccountId"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Company Bank Account (Optional)
        </FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger data-testid="select-bank-account" className="h-11">
              <SelectValue placeholder="Select bank account for rent payments" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {bankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.bankName} - {account.accountName} (**** {account.accountNumber.slice(-4)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Select the bank account for rent payment instructions on invoices
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
  ```
- [ ] Add loading state: Show `<Skeleton className="h-11 w-full" />` while `isLoading`
- [ ] Add empty state: If `bankAccounts.length === 0`, show alert with link to `/settings/bank-accounts`
- [ ] Update form schema: `bankAccountId: z.string().uuid().optional()`

#### 2.4 ReviewSubmitStep Component Update ✅
**File:** `frontend/src/components/tenants/ReviewSubmitStep.tsx`

- [ ] Add bank account display in Financial Info summary section:
  - If `bankAccountId` present: Display "**Bank Account:** {bankName} - {accountName}" + "**Account Number:** **** {last4}"
  - If null/empty: Display _"No bank account selected"_
- [ ] Add Edit button to redirect to Step 3 (Financial Info)
- [ ] Fetch bank account details from `useBankAccounts()` cached data
- [ ] Add `data-testid="display-bank-account-summary"`

---

### Phase 3: Testing (2-3 hours)

#### 3.1 Frontend Validation Tests ✅
**File:** `frontend/src/components/tenants/__tests__/FinancialInfoStep.test.tsx`

- [ ] Test: Bank account dropdown renders with fetched accounts
- [ ] Test: Dropdown displays correct format `"Bank - Account (**** XXXX)"`
- [ ] Test: Empty state shows helper text + link to settings
- [ ] Test: Loading state shows Skeleton
- [ ] Test: Form submission includes `bankAccountId` in payload
- [ ] Test: Form submission succeeds without bank account (optional)
- [ ] Use `@testing-library/react` and `msw` for mocking
- [ ] Run: `npm test -- FinancialInfoStep.test.tsx`

#### 3.2 E2E Tests ✅
**File:** `frontend/e2e/tenant-onboarding.spec.ts`

- [ ] Test: Full tenant onboarding with bank account selection (5 steps)
- [ ] Test: Tenant onboarding without bank account selection (skip dropdown)
- [ ] Test: Bank account dropdown displays masked numbers correctly
- [ ] Test: Backend response includes `bankAccount` object
- [ ] Run: `npx playwright test tenant-onboarding.spec.ts`

---

### Phase 4: UI/UX Verification (1 hour)

#### 4.1 Responsive Design ✅
- [ ] Test on desktop (>768px): Full width, height 44px
- [ ] Test on tablet (768-1024px): Adaptive width
- [ ] Test on mobile (<640px): Full width, touch-friendly (44×44px min)
- [ ] Verify dropdown scrollable if >8 items, max-height 300px

#### 4.2 Accessibility ✅
- [ ] Test keyboard navigation: Tab, Arrow keys, Enter, Escape
- [ ] Test screen reader: Announces option format correctly
- [ ] Verify focus visible (ring-2 ring-primary)
- [ ] Verify ARIA attributes (`aria-label`, `aria-describedby`)
- [ ] Run: `npm run test:a11y` (if available)

#### 4.3 Dark Mode ✅
- [ ] Toggle dark mode in app
- [ ] Verify dropdown border, background, text colors adapt
- [ ] Verify hover states work in both themes
- [ ] Verify dropdown menu colors match theme

---

## 🚀 Execution Steps (Recommended Order)

1. **Backend First** (Run backend tests after each sub-phase):
   ```bash
   # Phase 1.1: Create migration V68
   mvn flyway:migrate

   # Phase 1.2-1.4: Entity, DTOs, Service
   mvn clean compile

   # Phase 1.5: Unit tests
   mvn test -Dtest=TenantServiceTest
   ```

2. **Frontend Next** (Run frontend build after each sub-phase):
   ```bash
   # Phase 2.1-2.4: Types, Hook, Components
   npm run build

   # Phase 2.3: Test FinancialInfoStep locally
   npm run dev
   # Navigate to: http://localhost:3000/tenants/create
   ```

3. **Testing** (Run all tests):
   ```bash
   # Phase 3.1: Frontend validation tests
   npm test -- FinancialInfoStep.test.tsx

   # Phase 3.2: E2E tests
   npx playwright test tenant-onboarding.spec.ts

   # Phase 3.2: Backend tests
   mvn test
   ```

4. **UI/UX Verification** (Manual testing):
   - Open browser DevTools
   - Test responsive breakpoints (375px, 768px, 1024px, 1440px)
   - Test dark mode toggle
   - Test keyboard navigation
   - Use screen reader (macOS VoiceOver or NVDA)

---

## 📦 Key Files to Modify

### Backend (6 files)
1. `backend/src/main/resources/db/migration/V68__add_bank_account_to_tenants.sql` (NEW)
2. `backend/src/main/java/com/ultrabms/entity/Tenant.java` (EDIT)
3. `backend/src/main/java/com/ultrabms/dto/TenantRequest.java` (EDIT)
4. `backend/src/main/java/com/ultrabms/dto/TenantResponse.java` (EDIT)
5. `backend/src/main/java/com/ultrabms/dto/BankAccountSummary.java` (NEW)
6. `backend/src/main/java/com/ultrabms/service/impl/TenantServiceImpl.java` (EDIT)
7. `backend/src/test/java/com/ultrabms/service/TenantServiceTest.java` (EDIT)

### Frontend (5 files)
1. `frontend/src/types/tenant.ts` (EDIT)
2. `frontend/src/hooks/useBankAccounts.ts` (REUSE or NEW)
3. `frontend/src/components/tenants/FinancialInfoStep.tsx` (EDIT - MAJOR)
4. `frontend/src/components/tenants/ReviewSubmitStep.tsx` (EDIT - MINOR)
5. `frontend/src/components/tenants/__tests__/FinancialInfoStep.test.tsx` (EDIT)
6. `frontend/e2e/tenant-onboarding.spec.ts` (EDIT)

**Total:** ~11 files to modify/create

---

## ⚠️ Critical Reminders

1. **Optional Field:** `bankAccountId` is OPTIONAL - tenant can be created without bank account
2. **Security:** NEVER expose full bank account numbers (always mask: `**** XXXX`)
3. **Validation:** Only link ACTIVE bank accounts (check status before linking)
4. **Transaction:** Backend must rollback on any validation failure (all-or-nothing)
5. **Empty State:** If no bank accounts configured, show helpful message with link to settings
6. **Caching:** React Query caches bank accounts for 5 minutes (reduces API calls)
7. **Testing:** Run tests AFTER each phase (don't wait until end)

---

## 🎯 Definition of Done

- [ ] All 16 Acceptance Criteria (AC1-AC16) implemented
- [ ] Database migration V68 created and tested
- [ ] Backend: 5 unit tests pass (TenantServiceTest)
- [ ] Frontend: 6 validation tests pass (FinancialInfoStep.test.tsx)
- [ ] E2E: 4 test cases pass (tenant-onboarding.spec.ts)
- [ ] UI/UX: Responsive design verified (desktop, tablet, mobile)
- [ ] Accessibility: WCAG 2.1 AA compliance verified
- [ ] Dark mode: Theme switching verified
- [ ] Code builds successfully: `mvn clean install` + `npm run build`
- [ ] Code review completed (use `/bmad:bmm:workflows:code-review`)
- [ ] PR merged to `main`
- [ ] Sprint status updated: `3.9-tenant-onboarding-bank-account-integration: done`

---

## 📚 Reference Documents

- **Story File:** [docs/sprint-artifacts/epic-3/3-9-tenant-onboarding-bank-account-integration.md](./3-9-tenant-onboarding-bank-account-integration.md)
- **Sprint Change Proposal:** [docs/scp/SCP-2025-12-10-bank-account-integration.md](../../scp/SCP-2025-12-10-bank-account-integration.md)
- **Epic:** [docs/epics/epic-3-tenant-management-portal.md](../../epics/epic-3-tenant-management-portal.md)
- **Architecture:** [docs/architecture.md](../../architecture.md)
- **PRD:** [docs/prd.md](../../prd.md) Section 3.3.3

---

## 💡 Dev Agent Commands

After reading this checklist, execute implementation using:

```bash
/bmad:bmm:agents:dev
```

Then follow the `/bmad:bmm:workflows:dev-story` workflow to implement Story 3.9.

---

**Good luck! 🚀**
