/**
 * Bank Account Management API Service
 * Story 6.5: Bank Account Management
 *
 * All bank account-related API calls with comprehensive JSDoc documentation
 * AC #23: Frontend bank-account.service.ts with functions for all API operations
 */

import { apiClient } from '@/lib/api';
import type {
  BankAccount,
  BankAccountDetail,
  BankAccountDropdownItem,
  CreateBankAccountRequest,
  UpdateBankAccountRequest
} from '@/types/bank-account';

const BANK_ACCOUNTS_BASE_PATH = '/v1/bank-accounts';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all bank accounts with optional search filter
 * AC #14: GET /api/v1/bank-accounts returns list with masked values
 *
 * @param search - Optional search term to filter by bank name or account name
 *
 * @returns Promise that resolves to array of bank accounts with masked values
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN, SUPER_ADMIN, or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const accounts = await getBankAccounts();
 * accounts.forEach(account => {
 *   console.log(account.bankName, account.accountNumberMasked);
 * });
 *
 * // With search filter
 * const filtered = await getBankAccounts('Emirates');
 * ```
 */
export async function getBankAccounts(search?: string): Promise<BankAccount[]> {
  const params: Record<string, string> = {};
  if (search) params.search = search;

  const response = await apiClient.get<{
    success: boolean;
    data: BankAccount[];
    count: number;
  }>(BANK_ACCOUNTS_BASE_PATH, { params });

  return response.data.data;
}

/**
 * Get single bank account by ID
 * AC #15: GET /api/v1/bank-accounts/{id} returns bank account details
 *
 * ADMIN/SUPER_ADMIN see full (decrypted) account numbers
 * FINANCE_MANAGER sees masked values
 *
 * @param id - UUID of the bank account
 *
 * @returns Promise that resolves to bank account details
 *
 * @throws {NotFoundException} When bank account not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN, SUPER_ADMIN, or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const account = await getBankAccountById('account-uuid');
 * console.log(account.bankName);
 * console.log(account.accountNumber); // Full value for ADMIN, null for others
 * ```
 */
export async function getBankAccountById(id: string): Promise<BankAccountDetail> {
  const response = await apiClient.get<{
    success: boolean;
    data: BankAccountDetail;
  }>(`${BANK_ACCOUNTS_BASE_PATH}/${id}`);

  return response.data.data;
}

/**
 * Create a new bank account
 * AC #16: POST /api/v1/bank-accounts creates new bank account
 *
 * @param data - Bank account creation data
 *
 * @returns Promise that resolves to created bank account
 *
 * @throws {ValidationException} When validation fails (IBAN format, SWIFT format) (400)
 * @throws {ConflictException} When IBAN already exists (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const newAccount = await createBankAccount({
 *   bankName: 'Emirates NBD',
 *   accountName: 'Company Main Account',
 *   accountNumber: '1234567890',
 *   iban: 'AE070331234567890123456',
 *   swiftCode: 'EMIRAEADXXX',
 *   isPrimary: true
 * });
 *
 * console.log(newAccount.id); // UUID of created account
 * ```
 */
export async function createBankAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
  const response = await apiClient.post<{
    success: boolean;
    data: BankAccount;
    message: string;
  }>(BANK_ACCOUNTS_BASE_PATH, data);

  return response.data.data;
}

/**
 * Update an existing bank account
 * AC #17: PUT /api/v1/bank-accounts/{id} updates bank account
 *
 * @param id - UUID of the bank account
 * @param data - Bank account update data
 *
 * @returns Promise that resolves to updated bank account
 *
 * @throws {ValidationException} When validation fails (IBAN format, SWIFT format) (400)
 * @throws {ConflictException} When IBAN already exists for another account (409)
 * @throws {NotFoundException} When bank account not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const updatedAccount = await updateBankAccount('account-uuid', {
 *   bankName: 'Emirates NBD',
 *   accountName: 'Updated Account Name',
 *   accountNumber: '1234567890',
 *   iban: 'AE070331234567890123456',
 *   swiftCode: 'EMIRAEADXXX',
 *   status: BankAccountStatus.ACTIVE
 * });
 * ```
 */
export async function updateBankAccount(
  id: string,
  data: UpdateBankAccountRequest
): Promise<BankAccount> {
  const response = await apiClient.put<{
    success: boolean;
    data: BankAccount;
    message: string;
  }>(`${BANK_ACCOUNTS_BASE_PATH}/${id}`, data);

  return response.data.data;
}

/**
 * Delete (deactivate) a bank account
 * AC #18: DELETE /api/v1/bank-accounts/{id} soft deletes bank account
 *
 * @param id - UUID of the bank account
 *
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {ValidationException} When account has active PDCs linked (400)
 * @throws {ValidationException} When it's the only active account (400)
 * @throws {NotFoundException} When bank account not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * await deleteBankAccount('account-uuid');
 * ```
 */
export async function deleteBankAccount(id: string): Promise<void> {
  await apiClient.delete(`${BANK_ACCOUNTS_BASE_PATH}/${id}`);
}

// ============================================================================
// PRIMARY ACCOUNT OPERATIONS
// ============================================================================

/**
 * Set a bank account as the primary account
 * AC #19: PATCH /api/v1/bank-accounts/{id}/primary sets bank account as primary
 *
 * Only one account can be primary at a time.
 * Previous primary account is automatically demoted.
 *
 * @param id - UUID of the bank account
 *
 * @returns Promise that resolves to updated bank account
 *
 * @throws {ValidationException} When account is inactive (400)
 * @throws {NotFoundException} When bank account not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN or SUPER_ADMIN role (403)
 *
 * @example
 * ```typescript
 * const primaryAccount = await setPrimaryBankAccount('account-uuid');
 * console.log(primaryAccount.isPrimary); // true
 * ```
 */
export async function setPrimaryBankAccount(id: string): Promise<BankAccount> {
  const response = await apiClient.patch<{
    success: boolean;
    data: BankAccount;
    message: string;
  }>(`${BANK_ACCOUNTS_BASE_PATH}/${id}/primary`);

  return response.data.data;
}

/**
 * Get the primary bank account
 *
 * @returns Promise that resolves to primary bank account or null if none set
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN, SUPER_ADMIN, or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const primary = await getPrimaryBankAccount();
 * if (primary) {
 *   console.log('Primary account:', primary.bankName);
 * }
 * ```
 */
export async function getPrimaryBankAccount(): Promise<BankAccount | null> {
  const response = await apiClient.get<{
    success: boolean;
    data: BankAccount | null;
  }>(`${BANK_ACCOUNTS_BASE_PATH}/primary`);

  return response.data.data;
}

// ============================================================================
// DROPDOWN DATA
// ============================================================================

/**
 * Get active bank accounts for dropdown selection
 * Used by PDC management for deposit destination selection
 *
 * @returns Promise that resolves to array of bank accounts for dropdown
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN, SUPER_ADMIN, or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const options = await getBankAccountsForDropdown();
 *
 * options.forEach(opt => {
 *   console.log(`${opt.bankName} - ${opt.accountNumberMasked}`);
 * });
 * ```
 */
export async function getBankAccountsForDropdown(): Promise<BankAccountDropdownItem[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: BankAccountDropdownItem[];
    count: number;
  }>(`${BANK_ACCOUNTS_BASE_PATH}/dropdown`);

  return response.data.data;
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

/**
 * Bank Account Service
 * Provides all bank account management API operations
 * AC #23: Frontend bank-account.service.ts
 */
export const bankAccountService = {
  // CRUD
  getBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,

  // Primary account
  setPrimaryBankAccount,
  getPrimaryBankAccount,

  // Dropdown data
  getBankAccountsForDropdown
};

export default bankAccountService;
