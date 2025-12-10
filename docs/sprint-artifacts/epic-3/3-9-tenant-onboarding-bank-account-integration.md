# Story 3.9: Tenant Onboarding Bank Account Integration

Status: drafted

**Sprint Change Proposal:** SCP-2025-12-10-bank-account-integration
**Prerequisites:** Story 3.3 (Tenant Onboarding), Story 6.5 (Bank Account Management)
**Epic:** Epic 3 - Tenant Management & Portal
**Estimated Effort:** 1-2 days (Low complexity)

## Story

As an Admin or Property Manager creating a new tenant,
I want to select a company bank account during onboarding Step 3 (Financial Information),
So that rent payment instructions on invoices reference the correct bank account for this tenant.

## Background & Context

**Issue Identified:** Tenant onboarding page `/tenants/create` Step 3 displays "Company Bank Account" section with error message: _"No primary bank account configured. Please contact admin to set up a bank account."_ Users cannot select from multiple configured bank accounts during tenant creation.

**Root Cause Analysis:**
1. Story 3.3 (Tenant Onboarding) Step 3 original ACs specified "Rent Breakdown" with NO bank account selection requirement
2. Implementation added bank account field that was NOT in original specifications
3. Story 6.5 (Bank Account Management) completed (2025-11-29) but NOT integrated with tenant onboarding
4. Current implementation only checks for a "primary" bank account (read-only display)
5. No dropdown or selection mechanism exists for multiple bank accounts

**Sprint Change Decision:** Option 1 - Direct Adjustment (Add Story 3.9 to integrate bank account selection into existing tenant onboarding flow)

## Acceptance Criteria

### Backend Changes

1. **AC1 - Database Schema Update:** Add `bank_account_id` column to `tenants` table (nullable UUID, foreign key referencing `bank_accounts.id`). Create Flyway migration `V68__add_bank_account_to_tenants.sql` with:
   ```sql
   ALTER TABLE tenants ADD COLUMN bank_account_id UUID NULL;
   ALTER TABLE tenants ADD CONSTRAINT fk_tenants_bank_account
     FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
   CREATE INDEX idx_tenants_bank_account_id ON tenants(bank_account_id);
   ```
   Index ensures performant lookups when querying tenants by bank account. ON DELETE SET NULL prevents orphaned records if bank account deleted (tenant remains valid but bank account reference removed). [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

2. **AC2 - Tenant Entity Update:** Update `Tenant` JPA entity (`backend/src/main/java/com/ultrabms/entity/Tenant.java`) to add `@ManyToOne` relationship to `BankAccount`:
   ```java
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "bank_account_id")
   private BankAccount bankAccount;

   // getter/setter
   public BankAccount getBankAccount() { return bankAccount; }
   public void setBankAccount(BankAccount bankAccount) { this.bankAccount = bankAccount; }
   ```
   Use LAZY fetching to avoid N+1 queries. Field is nullable (tenant can be created without bank account initially). [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

3. **AC3 - Tenant Request DTO Update:** Update `TenantRequest` DTO to accept `bankAccountId` (optional String UUID field):
   ```java
   @Schema(description = "Bank account ID for rent payment instructions (optional)")
   private String bankAccountId;
   ```
   Validation: If provided, must be valid UUID format and reference existing active bank account. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

4. **AC4 - Tenant Response DTO Update:** Update `TenantResponse` DTO to include nested `bankAccount` object (only if linked):
   ```java
   @Schema(description = "Bank account details for rent payments")
   private BankAccountSummary bankAccount; // Nested DTO with: id, bankName, accountName, accountNumberMasked
   ```
   `BankAccountSummary` contains: `id`, `bankName`, `accountName`, `accountNumberMasked` (format: `**** 1234`). Never expose full account number in API response. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

5. **AC5 - Service Layer Update:** Update `TenantServiceImpl.createTenant()` method to:
   - Accept `bankAccountId` from `TenantRequest` (optional)
   - If `bankAccountId` provided:
     - Validate bank account exists: `bankAccountRepository.findById(bankAccountId).orElseThrow(() -> new ResourceNotFoundException("Bank account not found"))`
     - Validate bank account status is ACTIVE: `if (bankAccount.getStatus() != BankAccountStatus.ACTIVE) throw new ValidationException("Bank account must be active")`
     - Link bank account: `tenant.setBankAccount(bankAccount)`
   - If `bankAccountId` is null/empty, proceed without bank account (field remains NULL in DB)
   Transaction ensures atomic operation. Rollback on any validation failure. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

6. **AC6 - Backend Unit Tests:** Add test cases to `TenantServiceTest.java`:
   - `testCreateTenantWithValidBankAccount()`: Verify tenant created successfully with bank account linked, response includes `bankAccount` object
   - `testCreateTenantWithNullBankAccount()`: Verify tenant created successfully without bank account (null field), response `bankAccount` is null
   - `testCreateTenantWithInvalidBankAccountId()`: Verify throws `ResourceNotFoundException` with message "Bank account not found", HTTP 404
   - `testCreateTenantWithInactiveBankAccount()`: Verify throws `ValidationException` with message "Bank account must be active", HTTP 400
   - `testUpdateTenantChangeBankAccount()`: Verify existing tenant can update bank account reference
   All tests use `@Transactional` and rollback. Mock `BankAccountRepository` for isolation. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

### Frontend Changes

7. **AC7 - TypeScript Types Update:** Update `frontend/src/types/tenant.ts` to add `bankAccountId` field:
   ```typescript
   export interface TenantCreateRequest {
     // ... existing fields
     bankAccountId?: string; // Optional: UUID of bank account for rent payments
   }

   export interface TenantResponse {
     // ... existing fields
     bankAccount?: {
       id: string;
       bankName: string;
       accountName: string;
       accountNumberMasked: string; // Format: "**** 1234"
     };
   }
   ```
   `bankAccountId` is optional (tenant can be created without bank account). [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

8. **AC8 - React Query Hook:** Create `frontend/src/hooks/useBankAccounts.ts` using React Query (reuse existing hook from Story 6.5 if already exists):
   ```typescript
   export function useBankAccounts() {
     return useQuery({
       queryKey: ['bankAccounts'],
       queryFn: () => getBankAccounts(), // Fetches GET /api/v1/bank-accounts
     });
   }
   ```
   Returns `{ data: BankAccount[], isLoading, error }`. Cache bank accounts list for 5 minutes (staleTime: 5 * 60 * 1000). [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

9. **AC9 - Financial Info Step Update:** Modify `frontend/src/components/tenants/FinancialInfoStep.tsx` to:
   - **Remove:** Error alert "No primary bank account configured. Please contact admin..." (lines 391-397)
   - **Remove:** `getPrimaryBankAccount()` call and primary bank account display logic
   - **Add:** Bank account dropdown using shadcn `Select` component:
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
   - Display format: `"{bankName} - {accountName} (**** XXXX)"` where XXXX = last 4 digits of account number
   - Position: After cheque upload section, before Actions buttons (Back/Next)
   - Loading state: Show `Skeleton` component while `isLoading` from `useBankAccounts()`
   - Empty state: If `bankAccounts.length === 0`, show helper text: _"No bank accounts configured. Contact admin to add a bank account via Settings → Bank Accounts."_ with link to `/settings/bank-accounts`
   [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

10. **AC10 - Form Schema Update:** Update `financialInfoSchema` in form validation to include optional `bankAccountId`:
    ```typescript
    const financialInfoSchema = z.object({
      // ... existing cheque fields
      bankAccountId: z.string().uuid().optional(),
    });
    ```
    Field is optional (no validation error if not selected). [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

11. **AC11 - Review Submit Step Update:** Update `frontend/src/components/tenants/ReviewSubmitStep.tsx` to display selected bank account in Financial Information summary section:
    - If `bankAccountId` present in form data, fetch bank account details from `useBankAccounts()` data
    - Display:
      ```
      **Bank Account:** {bankName} - {accountName}
      **Account Number:** **** {lastFourDigits}
      ```
    - If `bankAccountId` is null/empty, display: _"No bank account selected"_
    - Edit button redirects to Step 3 (Financial Info) to change selection
    [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

### Testing

12. **AC12 - Frontend Validation Tests:** Add test cases to `FinancialInfoStep.test.tsx`:
    - Test bank account dropdown renders with fetched accounts
    - Test bank account dropdown displays correct format: "Bank - Account (**** XXXX)"
    - Test bank account dropdown handles empty state (shows helper text + link)
    - Test bank account dropdown handles loading state (shows Skeleton)
    - Test form submission includes selected `bankAccountId` in payload
    - Test form submission succeeds without bank account (optional field)
    Use `@testing-library/react` and `msw` to mock API responses. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

13. **AC13 - E2E Tests:** Add test cases to `frontend/e2e/tenant-onboarding.spec.ts`:
    - Test complete tenant onboarding flow with bank account selection:
      1. Fill Personal Info (Step 1)
      2. Fill Lease Info (Step 2)
      3. Select bank account from dropdown (Step 3)
      4. Upload documents (Step 4)
      5. Review shows selected bank account
      6. Submit creates tenant with `bankAccountId` linked
    - Test tenant onboarding flow without bank account selection (skip dropdown, proceed to next step)
    - Test bank account dropdown displays masked account numbers correctly
    - Verify backend response includes `bankAccount` object in tenant response
    Use Playwright to automate browser interactions. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

### UI/UX Requirements

14. **AC14 - Responsive Design:** Bank account dropdown responsive:
    - Desktop (>768px): Full width within card, height 44px (h-11)
    - Mobile (<640px): Full width, touch-friendly tap target (44×44px min)
    - Tablet (768-1024px): Adaptive width, maintains spacing
    - Dropdown menu scrollable if >8 items, max height 300px
    [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

15. **AC15 - Accessibility:** Bank account dropdown meets WCAG 2.1 AA:
    - Label: "Company Bank Account (Optional)" with `<FormLabel>` association
    - Placeholder: "Select bank account for rent payments"
    - Keyboard navigation: Tab to focus, Arrow keys to navigate options, Enter to select, Escape to close
    - Screen reader: Announces option format: "Emirates NBD - Corporate Account ending in 1234"
    - Focus visible: Blue ring on focus (ring-2 ring-primary)
    - Error state: Red border + error message if validation fails (not applicable for optional field)
    - ARIA attributes: `aria-label`, `aria-describedby` for FormDescription
    [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

16. **AC16 - Dark Mode Support:** Bank account dropdown supports dark theme:
    - Border: `border-input` (adapts to theme)
    - Background: `bg-background` (white in light, dark in dark theme)
    - Text: `text-foreground` (black in light, white in dark)
    - Hover: `hover:bg-muted/50` (subtle highlight)
    - Dropdown menu: `bg-popover` with `border-border`
    Use shadcn's CSS variables for automatic theme switching. [Source: docs/scp/SCP-2025-12-10-bank-account-integration.md#section-2.2]

## Component Mapping

### shadcn/ui Components to Use

**Form Components:**
- `select` (bank account dropdown)
- `form-field` (wrapper for bank account field)
- `form-label` (label with icon)
- `form-description` (helper text below dropdown)
- `form-message` (validation errors - not used for optional field)

**Feedback Components:**
- `skeleton` (loading state while fetching bank accounts)
- `alert` (empty state helper text with link)

**Icons (from lucide-react):**
- `Building2` (bank account icon in label)
- `ChevronDown` (dropdown indicator - auto-added by shadcn Select)

### Installation Command

```bash
npx shadcn@latest add select
```

**Note:** `select` component already installed in project from Story 3.3. No new installations required.

### Additional Dependencies

No new dependencies. Reuse existing:
- `@tanstack/react-query` (already installed)
- `lucide-react` (already installed)

## Tasks / Subtasks

### Backend Implementation

- [ ] **Task 1: Database Migration** (AC: #1)
  - [ ] Create `V68__add_bank_account_to_tenants.sql` migration file
  - [ ] Add `bank_account_id` column (UUID, nullable)
  - [ ] Add foreign key constraint with ON DELETE SET NULL
  - [ ] Add index on `bank_account_id` column
  - [ ] Test migration rollback script
  - [ ] Add data-testid: N/A (backend)

- [ ] **Task 2: Update Tenant Entity** (AC: #2)
  - [ ] Add `@ManyToOne` relationship to `BankAccount` in `Tenant.java`
  - [ ] Configure `fetch = FetchType.LAZY`
  - [ ] Add getter/setter methods
  - [ ] Verify Hibernate mapping in tests
  - [ ] Add data-testid: N/A (backend)

- [ ] **Task 3: Update DTOs** (AC: #3, #4)
  - [ ] Add `bankAccountId` field to `TenantRequest` DTO (optional String)
  - [ ] Create `BankAccountSummary` nested DTO (id, bankName, accountName, accountNumberMasked)
  - [ ] Add `bankAccount` field to `TenantResponse` DTO (optional `BankAccountSummary`)
  - [ ] Update Swagger/OpenAPI annotations
  - [ ] Add data-testid: N/A (backend)

- [ ] **Task 4: Update Service Layer** (AC: #5)
  - [ ] Modify `TenantServiceImpl.createTenant()` to accept `bankAccountId`
  - [ ] Add validation: bank account exists (throw `ResourceNotFoundException` if not found)
  - [ ] Add validation: bank account status is ACTIVE (throw `ValidationException` if inactive)
  - [ ] Link bank account to tenant: `tenant.setBankAccount(bankAccount)`
  - [ ] Handle null `bankAccountId` gracefully (no validation error)
  - [ ] Ensure transaction rollback on validation failure
  - [ ] Add data-testid: N/A (backend)

- [ ] **Task 5: Backend Unit Tests** (AC: #6)
  - [ ] Test: `testCreateTenantWithValidBankAccount()` - Success case with bank account linked
  - [ ] Test: `testCreateTenantWithNullBankAccount()` - Success case without bank account
  - [ ] Test: `testCreateTenantWithInvalidBankAccountId()` - Throws `ResourceNotFoundException`
  - [ ] Test: `testCreateTenantWithInactiveBankAccount()` - Throws `ValidationException`
  - [ ] Test: `testUpdateTenantChangeBankAccount()` - Update existing tenant's bank account
  - [ ] Mock `BankAccountRepository` for isolation
  - [ ] Verify response DTOs include/exclude `bankAccount` correctly
  - [ ] Add data-testid: N/A (backend)

### Frontend Implementation

- [ ] **Task 6: Update TypeScript Types** (AC: #7)
  - [ ] Add `bankAccountId?: string` to `TenantCreateRequest` in `types/tenant.ts`
  - [ ] Add `bankAccount?: { id, bankName, accountName, accountNumberMasked }` to `TenantResponse`
  - [ ] Export updated types
  - [ ] Verify type inference with Zod schemas
  - [ ] Add data-testid: N/A (types)

- [ ] **Task 7: Create/Update React Query Hook** (AC: #8)
  - [ ] Check if `hooks/useBankAccounts.ts` exists from Story 6.5
  - [ ] If not exists, create hook using `@tanstack/react-query`
  - [ ] Query key: `['bankAccounts']`
  - [ ] Query function: `getBankAccounts()` fetching `GET /api/v1/bank-accounts`
  - [ ] Configure staleTime: 5 minutes (5 * 60 * 1000)
  - [ ] Return `{ data, isLoading, error }`
  - [ ] Add data-testid: N/A (hook)

- [ ] **Task 8: Update FinancialInfoStep Component** (AC: #9, #10)
  - [ ] Import `useBankAccounts` hook
  - [ ] Remove `getPrimaryBankAccount()` call and primary bank logic
  - [ ] Remove error alert "No primary bank account configured..."
  - [ ] Add bank account dropdown using shadcn `Select` component
  - [ ] Configure dropdown format: `{bankName} - {accountName} (**** {last4Digits})`
  - [ ] Add loading state with `Skeleton` component while fetching
  - [ ] Add empty state with helper text + link to `/settings/bank-accounts`
  - [ ] Position dropdown after cheque section, before Actions buttons
  - [ ] Update `financialInfoSchema` to include `bankAccountId: z.string().uuid().optional()`
  - [ ] Add data-testid: select-bank-account, skeleton-bank-accounts

- [ ] **Task 9: Update ReviewSubmitStep Component** (AC: #11)
  - [ ] Display selected bank account in Financial Info summary
  - [ ] Format: "**Bank Account:** {bankName} - {accountName}" + "**Account Number:** **** {last4}"
  - [ ] Handle null case: Display "No bank account selected"
  - [ ] Add Edit button to redirect to Step 3
  - [ ] Fetch bank account details from `useBankAccounts()` cached data
  - [ ] Add data-testid: display-bank-account-summary

### Testing

- [ ] **Task 10: Frontend Validation Tests** (AC: #12)
  - [ ] Test: Bank account dropdown renders with fetched accounts
  - [ ] Test: Dropdown displays correct format "Bank - Account (**** XXXX)"
  - [ ] Test: Empty state shows helper text + link
  - [ ] Test: Loading state shows Skeleton
  - [ ] Test: Form submission includes `bankAccountId` in payload
  - [ ] Test: Form submission succeeds without bank account (optional)
  - [ ] Use `@testing-library/react` and `msw` for mocking
  - [ ] Add data-testid: N/A (tests)

- [ ] **Task 11: E2E Tests** (AC: #13)
  - [ ] Test: Full tenant onboarding with bank account selection
  - [ ] Test: Tenant onboarding without bank account selection
  - [ ] Test: Bank account dropdown displays masked numbers correctly
  - [ ] Test: Backend response includes `bankAccount` object
  - [ ] Use Playwright for browser automation
  - [ ] Add data-testid: Reuse existing (select-bank-account, etc.)

### UI/UX Implementation

- [ ] **Task 12: Responsive Design** (AC: #14)
  - [ ] Verify dropdown responsive on desktop, tablet, mobile
  - [ ] Test touch-friendly tap targets on mobile (44×44px min)
  - [ ] Verify dropdown menu scrollable if >8 items, max-height 300px
  - [ ] Add data-testid: N/A (visual testing)

- [ ] **Task 13: Accessibility** (AC: #15)
  - [ ] Verify WCAG 2.1 AA compliance
  - [ ] Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
  - [ ] Test screen reader announcements
  - [ ] Verify focus visible (ring-2 ring-primary)
  - [ ] Verify ARIA attributes (`aria-label`, `aria-describedby`)
  - [ ] Add data-testid: N/A (accessibility testing)

- [ ] **Task 14: Dark Mode Support** (AC: #16)
  - [ ] Test dropdown in light theme
  - [ ] Test dropdown in dark theme
  - [ ] Verify shadcn CSS variables auto-switch themes
  - [ ] Verify border, background, text colors adapt correctly
  - [ ] Add data-testid: N/A (visual testing)

## Definition of Done

- [ ] All acceptance criteria (AC1-AC16) implemented and verified
- [ ] Database migration `V68` created and tested (rollback verified)
- [ ] Backend: `Tenant` entity, DTOs, service layer updated
- [ ] Backend: 5 unit tests pass (valid, null, invalid, inactive, update scenarios)
- [ ] Frontend: `FinancialInfoStep` updated with bank account dropdown
- [ ] Frontend: `ReviewSubmitStep` displays selected bank account
- [ ] Frontend: React Query hook fetches bank accounts with 5-min cache
- [ ] Frontend: Validation tests pass (6 test cases)
- [ ] E2E: Playwright tests pass (4 test cases for full flow)
- [ ] UI/UX: Responsive design verified (desktop, tablet, mobile)
- [ ] Accessibility: WCAG 2.1 AA compliance verified (keyboard nav, screen reader)
- [ ] Dark mode: Theme switching verified
- [ ] Code review completed by Senior Dev
- [ ] PR merged to `main` branch
- [ ] Sprint status updated: `3.9-tenant-onboarding-bank-account-integration: done`
- [ ] Story marked as `done` in epic file

## Technical Notes

**Security Considerations:**
- Never expose full bank account numbers in API responses (always use masked format `**** XXXX`)
- Bank account foreign key uses ON DELETE SET NULL (prevents orphaned tenants if account deleted)
- Validate bank account status = ACTIVE before linking (prevent linking inactive accounts)

**Performance Considerations:**
- Use LAZY fetching for `BankAccount` relationship (avoid N+1 queries)
- Index on `bank_account_id` column for performant lookups
- React Query caches bank accounts list for 5 minutes (reduces API calls)

**Data Integrity:**
- Transaction ensures atomic tenant creation + bank account linking
- Rollback on any validation failure (all-or-nothing approach)
- Optional field design: Tenant can be created without bank account (flexible for future updates)

**User Experience:**
- Empty state provides clear guidance (link to bank accounts settings)
- Loading state prevents user confusion during data fetch
- Optional field reduces friction (tenant creation not blocked by missing bank account)
- Masked account numbers balance transparency with security

## Related Stories

- **Story 3.3:** Tenant Onboarding and Registration (DONE) - Base multi-step wizard this story enhances
- **Story 6.5:** Bank Account Management (DONE) - Provides bank accounts CRUD and API endpoints

## References

- Sprint Change Proposal: `docs/scp/SCP-2025-12-10-bank-account-integration.md`
- Epic: `docs/epics/epic-3-tenant-management-portal.md`
- Architecture: `docs/architecture.md` (Database schema, API patterns)
- PRD: `docs/prd.md` Section 3.3.3 (Updated with bank account selection requirement)
