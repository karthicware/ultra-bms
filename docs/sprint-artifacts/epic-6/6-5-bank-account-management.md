# Story 6.5: Bank Account Management

Status: ready-for-dev

## Story

As an Admin or Super Admin,
I want to manage company bank accounts,
So that financial operations can be linked to specific bank accounts for PDC deposits and payment processing.

## Acceptance Criteria

1. **AC1 - Bank Account List Page Access:** Finance > Bank Accounts page (or Settings > Bank Accounts) accessible to ADMIN and SUPER_ADMIN roles. FINANCE_MANAGER has read-only access. Other roles receive 403 Forbidden. Page has data-testid="page-bank-accounts". [Source: docs/epics/epic-6-financial-management.md#story-65]

2. **AC2 - Bank Account List Table:** Table displays columns: Bank Name, Account Name, Account Number (masked ****1234), IBAN (masked), SWIFT/BIC Code, Status badge (ACTIVE/INACTIVE), Actions (Edit/Delete). Search by bank name or account name. "Add New Bank Account" button (top right). Table has data-testid="table-bank-accounts". [Source: docs/epics/epic-6-financial-management.md#story-65]

3. **AC3 - Add Bank Account Form:** Modal dialog for adding new bank account. Form fields:
   - Bank Name (required, text, max 100 chars)
   - Account Name (required, text, max 255 chars)
   - Account Number (required, text, encrypted at rest, masked on display)
   - IBAN (required, validated UAE format: AE + 21 digits)
   - SWIFT/BIC Code (required, 8 or 11 characters)
   - Is Primary (checkbox, only one can be primary)
   - Status (ACTIVE/INACTIVE dropdown, default: ACTIVE)
   Form has data-testid="form-bank-account". [Source: docs/epics/epic-6-financial-management.md#story-65]

4. **AC4 - Edit Bank Account Form:** Same form as add, pre-populated with existing values. Account Number shown masked with option to reveal/edit. IBAN shown masked. Edit button has data-testid="btn-edit-bank-account-{id}". [Source: docs/epics/epic-6-financial-management.md#story-65]

5. **AC5 - Delete Bank Account:** Confirmation dialog before deletion. Soft delete (set status = INACTIVE or is_deleted flag). Cannot delete if account is linked to active PDCs or pending payments. Delete button has data-testid="btn-delete-bank-account-{id}". [Source: docs/epics/epic-6-financial-management.md#story-65]

6. **AC6 - Primary Account Toggle:** "Set as Primary" action on non-primary accounts. Only one bank account can be primary at a time. When setting new primary, previous primary is demoted automatically. Confirmation dialog: "This will make [Bank Name] the primary bank account. Continue?" [Source: docs/epics/epic-6-financial-management.md#story-65]

7. **AC7 - IBAN Validation:** Client-side and server-side validation for UAE IBAN format. Format: AE (country code) + 2 check digits + 3 bank code + 16 account number = 23 characters total. Validate IBAN checksum (mod 97 algorithm). Error message: "Invalid IBAN format. UAE IBANs start with 'AE' followed by 21 digits." [Source: docs/epics/epic-6-financial-management.md#story-65]

8. **AC8 - SWIFT/BIC Validation:** Validate SWIFT code format: 8 or 11 alphanumeric characters. Format: 4 bank code + 2 country code + 2 location code + optional 3 branch code. Error message: "Invalid SWIFT/BIC code. Must be 8 or 11 characters." [Source: docs/epics/epic-6-financial-management.md#story-65]

9. **AC9 - Duplicate Prevention:** Cannot add duplicate account numbers or IBANs. Server validates uniqueness. Error message: "A bank account with this [Account Number/IBAN] already exists." [Source: docs/epics/epic-6-financial-management.md#story-65]

10. **AC10 - At Least One Active Account:** System must have at least one active bank account if any accounts exist. Cannot deactivate the last active account. Error message: "At least one bank account must remain active." [Source: docs/epics/epic-6-financial-management.md#story-65]

11. **AC11 - BankAccount Entity:** Database entity includes:
    - id (UUID)
    - bankName (VARCHAR 100, NOT NULL)
    - accountName (VARCHAR 255, NOT NULL)
    - accountNumber (VARCHAR 100, NOT NULL, encrypted)
    - iban (VARCHAR 34, NOT NULL, encrypted, unique)
    - swiftCode (VARCHAR 11, NOT NULL)
    - isPrimary (BOOLEAN, default false)
    - status (VARCHAR 20, NOT NULL, default 'ACTIVE')
    - createdBy (UUID, foreign key to users)
    - createdAt (TIMESTAMP)
    - updatedAt (TIMESTAMP)
    [Source: docs/epics/epic-6-financial-management.md#story-65]

12. **AC12 - AES-256 Encryption:** Account number and IBAN encrypted at rest using AES-256. Use Spring's @Convert with AttributeConverter for transparent encryption/decryption. Encryption key stored in application secrets (not in code). [Source: docs/epics/epic-6-financial-management.md#story-65, docs/architecture.md#security-architecture]

13. **AC13 - Flyway Migration:** Migration V43__create_bank_accounts_table.sql creates bank_accounts table with all required columns, indexes, and constraints. [Source: docs/epics/epic-6-financial-management.md#story-65]

14. **AC14 - GET List API:** GET /api/v1/bank-accounts returns list of all bank accounts. Account numbers masked (****XXXX showing last 4 digits). IBAN masked (showing first 4 and last 4 characters). Supports search query param for filtering. [Source: docs/epics/epic-6-financial-management.md#story-65]

15. **AC15 - GET Single API:** GET /api/v1/bank-accounts/{id} returns single bank account details. Full account number and IBAN available only to ADMIN/SUPER_ADMIN (with reveal endpoint). [Source: docs/epics/epic-6-financial-management.md#story-65]

16. **AC16 - POST Create API:** POST /api/v1/bank-accounts creates new bank account. Validates all fields. Encrypts sensitive fields. Sets createdBy to current user. Returns created bank account (masked). [Source: docs/epics/epic-6-financial-management.md#story-65]

17. **AC17 - PUT Update API:** PUT /api/v1/bank-accounts/{id} updates existing bank account. Validates all fields. Re-encrypts sensitive fields if changed. Sets updatedAt to current timestamp. [Source: docs/epics/epic-6-financial-management.md#story-65]

18. **AC18 - DELETE API:** DELETE /api/v1/bank-accounts/{id} soft deletes bank account (sets status = INACTIVE or is_deleted = true). Validates not linked to active PDCs. Validates at least one active account remains. [Source: docs/epics/epic-6-financial-management.md#story-65]

19. **AC19 - PATCH Primary API:** PATCH /api/v1/bank-accounts/{id}/primary sets bank account as primary. Demotes current primary automatically. Returns updated bank account. [Source: docs/epics/epic-6-financial-management.md#story-65]

20. **AC20 - RBAC Restrictions:**
    - ADMIN, SUPER_ADMIN: Full CRUD access
    - FINANCE_MANAGER: Read-only access (GET endpoints only)
    - Other roles: 403 Forbidden
    Use @PreAuthorize annotations on controller methods. [Source: docs/epics/epic-6-financial-management.md#story-65]

21. **AC21 - TypeScript Types:** Create types/bank-account.ts with:
    - BankAccount interface (id, bankName, accountName, accountNumberMasked, ibanMasked, swiftCode, isPrimary, status, createdAt, updatedAt)
    - BankAccountRequest interface (for create/update)
    - BankAccountStatus enum (ACTIVE, INACTIVE)
    Export from types/index.ts. [Source: docs/architecture.md#typescript-strict-mode]

22. **AC22 - Zod Validation Schemas:** Create lib/validations/bank-account.ts with Zod schemas:
    - bankAccountSchema for form validation
    - IBAN regex validation: ^AE\d{21}$
    - SWIFT regex validation: ^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$
    - Bank name, account name length validation
    [Source: docs/architecture.md#form-pattern-with-react-hook-form-zod]

23. **AC23 - Frontend Service:** Create services/bank-account.service.ts with methods:
    - getBankAccounts(search?: string)
    - getBankAccountById(id: string)
    - createBankAccount(data: BankAccountRequest)
    - updateBankAccount(id: string, data: BankAccountRequest)
    - deleteBankAccount(id: string)
    - setPrimaryBankAccount(id: string)
    Use existing API client pattern. [Source: docs/architecture.md#api-client-pattern]

24. **AC24 - React Query Hooks:** Create hooks/useBankAccounts.ts with:
    - useBankAccounts(search?: string) - query for list
    - useBankAccount(id: string) - query for single
    - useCreateBankAccount() - mutation
    - useUpdateBankAccount() - mutation
    - useDeleteBankAccount() - mutation
    - useSetPrimaryBankAccount() - mutation
    Invalidate queries on mutations. [Source: docs/architecture.md#custom-hook-pattern]

25. **AC25 - Loading and Error States:** List page shows skeleton loaders during fetch. Empty state shows "No bank accounts found. Add your first bank account." Error states show Alert component with retry option. [Source: UI best practice]

26. **AC26 - Toast Notifications:** Success toast on create: "Bank account added successfully". Success toast on update: "Bank account updated successfully". Success toast on delete: "Bank account removed". Success toast on primary: "[Bank Name] is now the primary bank account". Error toast with descriptive message on failures. [Source: UI best practice]

27. **AC27 - Responsive Design:** Page responsive on all screen sizes. Table converts to card layout on mobile (<640px). Modal dialog responsive with proper padding. Form fields stack vertically on mobile. [Source: docs/architecture.md#styling-conventions]

28. **AC28 - Unit Tests (Backend):** Create BankAccountServiceTest with tests for:
    - Create bank account with encryption
    - Update bank account
    - Delete validation (linked PDCs, last active)
    - Set primary (demotes existing)
    - IBAN/SWIFT validation
    - Duplicate prevention
    Create BankAccountControllerTest for all endpoints. Test RBAC restrictions. Achieve >= 80% coverage. [Source: docs/architecture.md#testing-backend]

29. **AC29 - Unit Tests (Frontend):** Write tests for:
    - Bank account list page rendering
    - Bank account form validation
    - IBAN validation (valid/invalid formats)
    - SWIFT validation (8 and 11 char formats)
    - Add/Edit/Delete flows
    - Set primary flow
    Verify data-testid accessibility. [Source: docs/architecture.md#testing-frontend]

30. **AC30 - Mandatory Test Execution:** After all implementation tasks complete, execute full backend test suite (`mvn test`) and frontend test suite (`npm test`). ALL tests must pass with zero failures. Fix any failing tests before marking story complete. Document test results in Completion Notes. [Source: Sprint Change Proposal]

31. **AC31 - Build Verification:** Backend compilation (`mvn compile`) and frontend build (`npm run build`) must complete with zero errors. Frontend lint check (`npm run lint`) must pass with zero errors. Document in Completion Notes: "Backend build: SUCCESS, Frontend build: SUCCESS, Lint: PASSED". [Source: Sprint Change Proposal]

## Component Mapping

### shadcn/ui Components to Use

**Bank Account List Page:**
- card (page container)
- table, table-header, table-body, table-row, table-cell (account list)
- input (search field)
- button (Add New, Edit, Delete actions)
- badge (status indicators ACTIVE/INACTIVE)
- skeleton (loading states)
- dropdown-menu (action menu per row)

**Add/Edit Modal:**
- dialog, dialog-content, dialog-header, dialog-footer (modal structure)
- form (form container with react-hook-form)
- input (text fields: bank name, account name, account number, IBAN, SWIFT)
- select (status dropdown)
- checkbox (is primary toggle)
- label (field labels)
- button (Cancel, Save)

**Delete Confirmation:**
- alert-dialog (confirmation modal)
- alert-dialog-action, alert-dialog-cancel (buttons)

**Feedback:**
- toast/sonner (success/error notifications)
- alert (error states)

### Installation Command

Verify and add if missing:

```bash
npx shadcn@latest add card table input button badge skeleton dropdown-menu dialog form select checkbox label alert-dialog sonner alert
```

## Tasks / Subtasks

- [ ] **Task 1: Create Backend Entity and Migration** (AC: #11, #13)
  - [ ] Create BankAccount entity in com.ultrabms.entity
  - [ ] Add JPA annotations (@Entity, @Table, @Column)
  - [ ] Add @Convert for encrypted fields (accountNumber, iban)
  - [ ] Create Flyway migration V43__create_bank_accounts_table.sql
  - [ ] Add indexes on iban (unique), status
  - [ ] Create BankAccountRepository extending JpaRepository

- [ ] **Task 2: Implement AES-256 Encryption Converter** (AC: #12)
  - [ ] Create EncryptionConverter implementing AttributeConverter
  - [ ] Use AES-256 encryption algorithm
  - [ ] Store encryption key in application.yml (encrypted with jasypt or env var)
  - [ ] Implement convertToDatabaseColumn (encrypt)
  - [ ] Implement convertToEntityAttribute (decrypt)
  - [ ] Handle null values gracefully

- [ ] **Task 3: Create Backend DTOs** (AC: #14, #15, #16)
  - [ ] Create BankAccountRequest DTO with @NotBlank/@Size validations
  - [ ] Create BankAccountResponse DTO (masked account number, IBAN)
  - [ ] Create BankAccountListResponse DTO for list endpoint
  - [ ] Add masking utility for account number (****XXXX)
  - [ ] Add masking utility for IBAN (AE12****1234)

- [ ] **Task 4: Implement IBAN/SWIFT Validators** (AC: #7, #8)
  - [ ] Create IBANValidator with @Constraint annotation
  - [ ] Implement UAE IBAN format validation (AE + 21 digits)
  - [ ] Implement IBAN checksum validation (mod 97)
  - [ ] Create SWIFTValidator with @Constraint annotation
  - [ ] Implement SWIFT format validation (8 or 11 chars)
  - [ ] Add validators to DTO fields

- [ ] **Task 5: Create BankAccountService** (AC: #14-19)
  - [ ] Create BankAccountService interface
  - [ ] Create BankAccountServiceImpl with @Service
  - [ ] Implement findAll(search: String) with filtering
  - [ ] Implement findById(id: UUID)
  - [ ] Implement create(request: BankAccountRequest) with encryption
  - [ ] Implement update(id: UUID, request: BankAccountRequest)
  - [ ] Implement delete(id: UUID) with validations
  - [ ] Implement setPrimary(id: UUID) with demote logic
  - [ ] Add @Transactional for write operations

- [ ] **Task 6: Implement Business Validations** (AC: #9, #10)
  - [ ] Validate unique account number on create/update
  - [ ] Validate unique IBAN on create/update
  - [ ] Validate at least one active account on delete/deactivate
  - [ ] Check for linked PDCs before deletion
  - [ ] Throw appropriate BusinessException with user-friendly messages

- [ ] **Task 7: Create BankAccountController** (AC: #14-19, #20)
  - [ ] Create controller with @RestController
  - [ ] Add @RequestMapping("/api/v1/bank-accounts")
  - [ ] GET / endpoint with optional search param
  - [ ] GET /{id} endpoint
  - [ ] POST / endpoint with @Valid @RequestBody
  - [ ] PUT /{id} endpoint with @Valid @RequestBody
  - [ ] DELETE /{id} endpoint
  - [ ] PATCH /{id}/primary endpoint
  - [ ] Add @PreAuthorize for RBAC (ADMIN, SUPER_ADMIN = write, FINANCE_MANAGER = read)

- [ ] **Task 8: Create Frontend Types and Validation** (AC: #21, #22)
  - [ ] Create types/bank-account.ts with BankAccount interface
  - [ ] Add BankAccountRequest, BankAccountResponse types
  - [ ] Add BankAccountStatus enum
  - [ ] Create lib/validations/bank-account.ts with Zod schemas
  - [ ] Add IBAN regex validation (^AE\d{21}$)
  - [ ] Add SWIFT regex validation (^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$)
  - [ ] Export from types/index.ts

- [ ] **Task 9: Create Frontend Service** (AC: #23)
  - [ ] Create services/bank-account.service.ts
  - [ ] Implement getBankAccounts(search?: string)
  - [ ] Implement getBankAccountById(id: string)
  - [ ] Implement createBankAccount(data: BankAccountRequest)
  - [ ] Implement updateBankAccount(id: string, data: BankAccountRequest)
  - [ ] Implement deleteBankAccount(id: string)
  - [ ] Implement setPrimaryBankAccount(id: string)

- [ ] **Task 10: Create React Query Hooks** (AC: #24)
  - [ ] Create hooks/useBankAccounts.ts
  - [ ] Implement useBankAccounts(search?: string) query
  - [ ] Implement useBankAccount(id: string) query
  - [ ] Implement useCreateBankAccount() mutation
  - [ ] Implement useUpdateBankAccount() mutation
  - [ ] Implement useDeleteBankAccount() mutation
  - [ ] Implement useSetPrimaryBankAccount() mutation
  - [ ] Configure query invalidation on mutations

- [ ] **Task 11: Create Bank Accounts List Page** (AC: #1, #2, #25)
  - [ ] Create app/(dashboard)/finance/bank-accounts/page.tsx
  - [ ] Add search input for filtering
  - [ ] Implement data table with columns
  - [ ] Add mask utility for displaying account number and IBAN
  - [ ] Add status badges (ACTIVE green, INACTIVE gray)
  - [ ] Add action dropdown (Edit, Delete, Set Primary)
  - [ ] Implement loading skeletons
  - [ ] Implement empty state
  - [ ] Add data-testid="page-bank-accounts"

- [ ] **Task 12: Create Bank Account Form Modal** (AC: #3, #4, #26)
  - [ ] Create components/finance/BankAccountFormModal.tsx
  - [ ] Build form with react-hook-form + zodResolver
  - [ ] Add all form fields (bank name, account name, account number, IBAN, SWIFT, status, isPrimary)
  - [ ] Add IBAN validation with error message
  - [ ] Add SWIFT validation with error message
  - [ ] Implement create mode (empty form)
  - [ ] Implement edit mode (pre-populated)
  - [ ] Add data-testid="form-bank-account"

- [ ] **Task 13: Implement Delete Confirmation** (AC: #5)
  - [ ] Create delete confirmation AlertDialog
  - [ ] Show bank name in confirmation message
  - [ ] Handle delete mutation
  - [ ] Show error if validation fails (linked PDCs, last active)
  - [ ] Add data-testid="dialog-delete-bank-account"

- [ ] **Task 14: Implement Set Primary Flow** (AC: #6)
  - [ ] Add "Set as Primary" action in dropdown
  - [ ] Show confirmation dialog
  - [ ] Call setPrimary mutation
  - [ ] Show success toast
  - [ ] Refresh list to show updated primary indicator

- [ ] **Task 15: Add Sidebar Navigation** (AC: #1)
  - [ ] Add "Bank Accounts" link to Finance sidebar section
  - [ ] Add "Bank Accounts" link to Settings sidebar (optional)
  - [ ] Use Building icon (or similar bank icon from Lucide)

- [ ] **Task 16: Implement Responsive Design** (AC: #27)
  - [ ] Table converts to cards on mobile
  - [ ] Modal responsive with proper padding
  - [ ] Form fields stack on mobile
  - [ ] Touch targets >= 44x44px

- [ ] **Task 17: Write Backend Unit Tests** (AC: #28)
  - [ ] Create BankAccountServiceTest
  - [ ] Test create with encryption
  - [ ] Test update
  - [ ] Test delete validations
  - [ ] Test setPrimary logic
  - [ ] Test IBAN/SWIFT validation
  - [ ] Test duplicate prevention
  - [ ] Create BankAccountControllerTest
  - [ ] Test all endpoints
  - [ ] Test RBAC restrictions
  - [ ] Achieve >= 80% coverage

- [ ] **Task 18: Write Frontend Unit Tests** (AC: #29)
  - [ ] Test bank account list page rendering
  - [ ] Test form validation (all fields)
  - [ ] Test IBAN validation (valid/invalid)
  - [ ] Test SWIFT validation (8 and 11 char)
  - [ ] Test add/edit/delete flows
  - [ ] Test set primary flow
  - [ ] Verify data-testid accessibility

- [ ] **Task 19: Mandatory Test Execution and Build Verification** (AC: #30, #31)
  - [ ] Execute backend test suite: `mvn test` - ALL tests must pass
  - [ ] Execute frontend test suite: `npm test` - ALL tests must pass
  - [ ] Fix any failing tests before proceeding
  - [ ] Execute backend build: `mvn compile` - Zero errors required
  - [ ] Execute frontend build: `npm run build` - Zero errors required
  - [ ] Execute frontend lint: `npm run lint` - Zero errors required
  - [ ] Document results in Completion Notes

## Final Validation Requirements

**MANDATORY:** These requirements apply to ALL stories and MUST be completed after all implementation tasks are done. The dev agent CANNOT mark a story complete without passing all validations.

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

### Architecture Patterns

**Data Flow:**
```
Frontend Form → BankAccountService → Controller → BankAccountService → Repository
                                                        ↓
                                            EncryptionConverter (AES-256)
                                                        ↓
                                                   PostgreSQL
```

**Encryption Approach:**
- Use Spring JPA `@Convert` annotation for transparent field-level encryption
- EncryptionConverter handles encrypt/decrypt automatically
- Encryption key stored in environment variable `ENCRYPTION_KEY`
- AES-256 in GCM mode for authenticated encryption

### Prerequisites

**From Story 6.2 (Expense Management) - DONE:**
- Expense entity may reference bank account for payment destination
- Can add bankAccountId field to Expense entity in future

**From Story 2.8 (Company Profile) - IN PROGRESS:**
- Similar settings page pattern to follow
- Same RBAC approach (ADMIN/SUPER_ADMIN write, FINANCE_MANAGER read)

**From Story 6.3 (PDC Management) - READY:**
- PDC entity will reference bank accounts for deposit destination
- Add bankAccountId field to PDC entity when PDC story is implemented

### Technical Considerations

**Database Indexes:**
```sql
CREATE UNIQUE INDEX idx_bank_accounts_iban ON bank_accounts(iban);
CREATE INDEX idx_bank_accounts_status ON bank_accounts(status);
```

**IBAN Validation Algorithm:**
1. Check length = 23 for UAE (AE + 21 digits)
2. Move first 4 chars to end
3. Convert letters to numbers (A=10, B=11, ..., Z=35)
4. Calculate modulo 97
5. Valid if remainder = 1

**SWIFT/BIC Format:**
- 8 characters: BBBB CC LL (Bank code, Country, Location)
- 11 characters: BBBB CC LL BBB (+ Branch code)
- All uppercase alphanumeric

### Project Structure Notes

**Backend Files to Create:**
- `backend/src/main/java/com/ultrabms/entity/BankAccount.java`
- `backend/src/main/java/com/ultrabms/repository/BankAccountRepository.java`
- `backend/src/main/java/com/ultrabms/service/BankAccountService.java`
- `backend/src/main/java/com/ultrabms/service/impl/BankAccountServiceImpl.java`
- `backend/src/main/java/com/ultrabms/controller/BankAccountController.java`
- `backend/src/main/java/com/ultrabms/dto/BankAccountRequest.java`
- `backend/src/main/java/com/ultrabms/dto/BankAccountResponse.java`
- `backend/src/main/java/com/ultrabms/config/EncryptionConverter.java`
- `backend/src/main/java/com/ultrabms/validation/IBANValidator.java`
- `backend/src/main/java/com/ultrabms/validation/SWIFTValidator.java`
- `backend/src/main/resources/db/migration/V43__create_bank_accounts_table.sql`
- `backend/src/test/java/com/ultrabms/service/BankAccountServiceTest.java`
- `backend/src/test/java/com/ultrabms/controller/BankAccountControllerTest.java`

**Frontend Files to Create:**
- `frontend/src/types/bank-account.ts`
- `frontend/src/lib/validations/bank-account.ts`
- `frontend/src/services/bank-account.service.ts`
- `frontend/src/hooks/useBankAccounts.ts`
- `frontend/src/app/(dashboard)/finance/bank-accounts/page.tsx`
- `frontend/src/components/finance/BankAccountFormModal.tsx`
- `frontend/src/components/finance/BankAccountDeleteDialog.tsx`

### Learnings from Previous Story

**From Story 6-4-financial-reporting-and-analytics (Status: drafted):**
- Story drafted but not yet implemented - no implementation learnings available
- Once implemented, will provide patterns for Finance module components

**From Story 2-8-company-profile-settings (Status: in-progress):**
- Similar settings page pattern
- Single record vs. multi-record difference (company profile = single, bank accounts = multiple)
- RBAC pattern: @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
- Form validation with Zod
- S3 integration pattern (not needed for bank accounts)

[Source: docs/sprint-artifacts/epic-6/6-4-financial-reporting-and-analytics.md]
[Source: docs/sprint-artifacts/epic-2/2-8-company-profile-settings.md]

### Integration Points

**PDC Management (Story 6.3):**
- Bank account selection dropdown for PDC deposit destination
- Display format: "Bank Name - ****XXXX" (masked account number)

**Expense Management (Story 6.2):**
- Optional: Bank account for expense payments
- Future enhancement: Link expenses to bank accounts

**Company Profile (Story 2.8):**
- Company name may be used as "Account Holder" label in UI

### References

- [Source: docs/epics/epic-6-financial-management.md#story-65-bank-account-management]
- [Source: docs/architecture.md#security-architecture]
- [Source: docs/architecture.md#backend-implementation-patterns]
- [Source: docs/architecture.md#frontend-implementation-patterns]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic-6/6-5-bank-account-management.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-29 | 1.0 | SM Agent (Bob) | Initial story draft created from Epic 6 acceptance criteria |
