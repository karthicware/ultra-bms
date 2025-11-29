/**
 * Bank Account Management Types
 * Story 6.5: Bank Account Management
 *
 * Defines all types related to company bank account management for PDC deposits and payments
 */

// ===========================
// Enums
// ===========================

/**
 * Status of a bank account
 */
export enum BankAccountStatus {
  /** Bank account is active and can be used for transactions */
  ACTIVE = 'ACTIVE',
  /** Bank account is inactive (soft deleted or disabled) */
  INACTIVE = 'INACTIVE'
}

// ===========================
// Core Entity Types
// ===========================

/**
 * Bank Account entity (list view with masked values)
 * AC #2: Account numbers shown masked in list
 */
export interface BankAccount {
  /** UUID of the bank account */
  id: string;
  /** Name of the bank (e.g., Emirates NBD, ADCB) */
  bankName: string;
  /** Account name / holder name */
  accountName: string;
  /** Masked account number (****XXXX showing last 4 digits) */
  accountNumberMasked: string;
  /** Masked IBAN (showing first 4 and last 4 characters) */
  ibanMasked: string;
  /** SWIFT/BIC code (not sensitive, shown in full) */
  swiftCode: string;
  /** Whether this is the primary bank account */
  isPrimary: boolean;
  /** Account status (ACTIVE/INACTIVE) */
  status: BankAccountStatus;
  /** When the account was created */
  createdAt: string;
  /** When the account was last updated */
  updatedAt: string;
}

/**
 * Bank Account detail view (for ADMIN/SUPER_ADMIN with full values)
 * AC #15: GET /api/v1/bank-accounts/{id} returns full details to admins
 */
export interface BankAccountDetail extends BankAccount {
  /** Full account number (decrypted, for ADMIN/SUPER_ADMIN only) */
  accountNumber: string | null;
  /** Full IBAN (decrypted, for ADMIN/SUPER_ADMIN only) */
  iban: string | null;
  /** User who created this bank account */
  createdBy: string;
}

/**
 * Bank Account for dropdown selection (PDC deposit destination)
 */
export interface BankAccountDropdownItem {
  /** UUID of the bank account */
  id: string;
  /** Bank name */
  bankName: string;
  /** Account name */
  accountName: string;
  /** Masked account number for display */
  accountNumberMasked: string;
  /** Whether this is the primary account */
  isPrimary: boolean;
  /** Account status */
  status: BankAccountStatus;
}

// ===========================
// API Request Types
// ===========================

/**
 * Request to create a new bank account
 * AC #3: Add Bank Account Form fields
 */
export interface CreateBankAccountRequest {
  /** Name of the bank */
  bankName: string;
  /** Account name / holder name */
  accountName: string;
  /** Bank account number */
  accountNumber: string;
  /** IBAN (UAE format: AE + 21 digits) */
  iban: string;
  /** SWIFT/BIC code (8 or 11 characters) */
  swiftCode: string;
  /** Whether this should be the primary account */
  isPrimary?: boolean;
  /** Account status */
  status?: BankAccountStatus;
}

/**
 * Request to update an existing bank account
 * AC #4: Edit Bank Account Form fields
 */
export interface UpdateBankAccountRequest {
  /** Name of the bank */
  bankName: string;
  /** Account name / holder name */
  accountName: string;
  /** Bank account number */
  accountNumber: string;
  /** IBAN (UAE format: AE + 21 digits) */
  iban: string;
  /** SWIFT/BIC code (8 or 11 characters) */
  swiftCode: string;
  /** Whether this should be the primary account */
  isPrimary?: boolean;
  /** Account status */
  status: BankAccountStatus;
}

// ===========================
// API Response Types
// ===========================

/**
 * Standard API response wrapper
 */
export interface BankAccountApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  timestamp: string;
}

/**
 * List response for bank accounts
 */
export type BankAccountListResponse = BankAccountApiResponse<BankAccount[]>;

/**
 * Single bank account response
 */
export type BankAccountDetailResponse = BankAccountApiResponse<BankAccountDetail>;

/**
 * Dropdown items response
 */
export type BankAccountDropdownResponse = BankAccountApiResponse<BankAccountDropdownItem[]>;

// ===========================
// Form Data Types
// ===========================

/**
 * Form data for creating/editing a bank account
 */
export interface BankAccountFormData {
  /** Name of the bank */
  bankName: string;
  /** Account name / holder name */
  accountName: string;
  /** Bank account number */
  accountNumber: string;
  /** IBAN (UAE format: AE + 21 digits) */
  iban: string;
  /** SWIFT/BIC code (8 or 11 characters) */
  swiftCode: string;
  /** Whether this should be the primary account */
  isPrimary: boolean;
  /** Account status */
  status: BankAccountStatus;
}

// ===========================
// Status Display Helpers
// ===========================

/**
 * Status badge configuration for UI display
 * AC #2: Status badge (ACTIVE/INACTIVE) in list table
 */
export const BANK_ACCOUNT_STATUS_CONFIG: Record<
  BankAccountStatus,
  { label: string; variant: 'success' | 'secondary'; className: string }
> = {
  [BankAccountStatus.ACTIVE]: {
    label: 'Active',
    variant: 'success',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  [BankAccountStatus.INACTIVE]: {
    label: 'Inactive',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
};

/**
 * Status options for filter dropdown
 */
export const BANK_ACCOUNT_STATUS_OPTIONS: { value: BankAccountStatus; label: string }[] = [
  { value: BankAccountStatus.ACTIVE, label: 'Active' },
  { value: BankAccountStatus.INACTIVE, label: 'Inactive' }
];

// ===========================
// Common UAE Banks
// ===========================

/**
 * List of common UAE banks for autocomplete/dropdown
 */
export const UAE_BANKS = [
  'Emirates NBD',
  'Abu Dhabi Commercial Bank (ADCB)',
  'First Abu Dhabi Bank (FAB)',
  'Dubai Islamic Bank',
  'Mashreq Bank',
  'Abu Dhabi Islamic Bank (ADIB)',
  'Commercial Bank of Dubai',
  'National Bank of Fujairah',
  'RAK Bank',
  'Sharjah Islamic Bank',
  'Union National Bank',
  'Al Hilal Bank',
  'Ajman Bank',
  'Noor Bank',
  'Emirates Islamic Bank'
];

// ===========================
// Helper Functions
// ===========================

/**
 * Format display name for dropdown
 * Example: "Emirates NBD - ****1234"
 */
export function formatBankAccountDropdownLabel(account: BankAccountDropdownItem): string {
  const primary = account.isPrimary ? ' (Primary)' : '';
  return `${account.bankName} - ${account.accountNumberMasked}${primary}`;
}

/**
 * Check if bank account can be deleted
 * AC #5: Delete button available for non-linked accounts
 */
export function canDeleteBankAccount(account: BankAccount): boolean {
  // Note: Active PDC check happens server-side
  return account.status === BankAccountStatus.ACTIVE || account.status === BankAccountStatus.INACTIVE;
}

/**
 * Check if bank account can be set as primary
 * AC #6: Primary toggle only for active accounts
 */
export function canSetAsPrimary(account: BankAccount): boolean {
  return account.status === BankAccountStatus.ACTIVE && !account.isPrimary;
}

/**
 * Validate IBAN format (basic frontend check)
 * AC #7: UAE IBAN format: AE + 21 digits
 */
export function isValidIbanFormat(iban: string): boolean {
  const normalizedIban = iban.toUpperCase().replace(/\s/g, '');
  return /^AE\d{21}$/.test(normalizedIban);
}

/**
 * Validate SWIFT/BIC format (basic frontend check)
 * AC #8: 8 or 11 alphanumeric characters
 */
export function isValidSwiftFormat(swift: string): boolean {
  const normalizedSwift = swift.toUpperCase().replace(/\s/g, '');
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalizedSwift);
}

/**
 * Format IBAN with spaces for display (every 4 characters)
 * Example: "AE07 0331 2345 6789 0123 456"
 */
export function formatIbanForDisplay(iban: string): string {
  const normalized = iban.toUpperCase().replace(/\s/g, '');
  return normalized.match(/.{1,4}/g)?.join(' ') || iban;
}

/**
 * Normalize IBAN (uppercase, no spaces)
 */
export function normalizeIban(iban: string): string {
  return iban.toUpperCase().replace(/\s/g, '');
}

/**
 * Normalize SWIFT code (uppercase, no spaces)
 */
export function normalizeSwift(swift: string): string {
  return swift.toUpperCase().replace(/\s/g, '');
}
