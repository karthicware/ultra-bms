/**
 * Bank Account Validation Schemas
 * Story 6.5: Bank Account Management
 *
 * Zod schemas for form validation following React Hook Form pattern
 * AC #21, #22: Frontend TypeScript interfaces and Zod validation schemas
 */

import { z } from 'zod';
import { BankAccountStatus } from '@/types/bank-account';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Schema for BankAccountStatus enum validation
 */
export const bankAccountStatusSchema = z.nativeEnum(BankAccountStatus);

// ============================================================================
// IBAN VALIDATION
// ============================================================================

/**
 * UAE IBAN format validation
 * AC #7: IBAN Validation - UAE format (AE + 21 digits)
 *
 * UAE IBAN Structure:
 * - AE (country code) + 2 (check digits) + 3 (bank code) + 16 (account number)
 * - Total: 23 characters
 */
const UAE_IBAN_REGEX = /^AE\d{21}$/i;

/**
 * IBAN Mod 97 checksum validation (ISO 7064)
 * Steps:
 * 1. Move first 4 chars to end
 * 2. Replace letters with numbers (A=10, B=11, ..., Z=35)
 * 3. Calculate mod 97
 * 4. Valid if remainder = 1
 */
export function validateIbanChecksum(iban: string): boolean {
  const normalizedIban = iban.toUpperCase().replace(/\s/g, '');

  // Move first 4 chars to end
  const rearranged = normalizedIban.slice(4) + normalizedIban.slice(0, 4);

  // Convert letters to numbers
  let numericIban = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numericIban += (char.charCodeAt(0) - 55).toString(); // A=10, B=11, etc.
    } else {
      numericIban += char;
    }
  }

  // Calculate mod 97 using BigInt for large numbers
  try {
    const remainder = BigInt(numericIban) % BigInt(97);
    return remainder === BigInt(1);
  } catch {
    return false;
  }
}

/**
 * Custom IBAN validation with format and checksum
 */
export const ibanSchema = z
  .string()
  .min(1, 'IBAN is required')
  .transform((val) => val.toUpperCase().replace(/\s/g, ''))
  .refine((val) => UAE_IBAN_REGEX.test(val), {
    message: "Invalid IBAN format. UAE IBANs start with 'AE' followed by 21 digits."
  })
  .refine((val) => validateIbanChecksum(val), {
    message: 'Invalid IBAN checksum. Please verify the IBAN is correct.'
  });

// ============================================================================
// SWIFT/BIC VALIDATION
// ============================================================================

/**
 * SWIFT/BIC code format validation
 * AC #8: SWIFT Validation - 8 or 11 characters
 *
 * SWIFT/BIC Structure:
 * - Position 1-4: Bank code (letters only)
 * - Position 5-6: Country code (letters only, ISO 3166-1)
 * - Position 7-8: Location code (alphanumeric)
 * - Position 9-11: Branch code (optional, alphanumeric)
 */
const SWIFT_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i;

/**
 * Custom SWIFT/BIC validation
 */
export const swiftSchema = z
  .string()
  .min(1, 'SWIFT/BIC code is required')
  .transform((val) => val.toUpperCase().replace(/\s/g, ''))
  .refine((val) => val.length === 8 || val.length === 11, {
    message: 'SWIFT/BIC code must be exactly 8 or 11 characters.'
  })
  .refine((val) => SWIFT_REGEX.test(val), {
    message:
      'Invalid SWIFT/BIC format. Expected: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch).'
  });

// ============================================================================
// CREATE BANK ACCOUNT SCHEMA
// ============================================================================

/**
 * Validation schema for creating a new bank account
 * AC #3: Add Bank Account Form validation
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(createBankAccountSchema),
 *   defaultValues: createBankAccountDefaults
 * });
 * ```
 */
export const createBankAccountSchema = z.object({
  /**
   * Bank name (required, max 100 chars)
   */
  bankName: z
    .string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name must be less than 100 characters')
    .trim(),

  /**
   * Account name / holder name (required, max 255 chars)
   */
  accountName: z
    .string()
    .min(1, 'Account name is required')
    .max(255, 'Account name must be less than 255 characters')
    .trim(),

  /**
   * Bank account number (required, max 100 chars)
   */
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .max(100, 'Account number must be less than 100 characters')
    .trim(),

  /**
   * IBAN - UAE format with checksum validation
   */
  iban: ibanSchema,

  /**
   * SWIFT/BIC code - format validation
   */
  swiftCode: swiftSchema,

  /**
   * Primary account flag (optional, defaults to false)
   */
  isPrimary: z.boolean().optional().default(false),

  /**
   * Account status (optional, defaults to ACTIVE)
   */
  status: bankAccountStatusSchema.optional().default(BankAccountStatus.ACTIVE)
});

/**
 * Type inference from create bank account schema
 */
export type CreateBankAccountFormData = z.infer<typeof createBankAccountSchema>;

/**
 * Default values for create bank account form
 */
export const createBankAccountDefaults: CreateBankAccountFormData = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  iban: '',
  swiftCode: '',
  isPrimary: false,
  status: BankAccountStatus.ACTIVE
};

// ============================================================================
// UPDATE BANK ACCOUNT SCHEMA
// ============================================================================

/**
 * Validation schema for updating an existing bank account
 * AC #4: Edit Bank Account Form validation
 */
export const updateBankAccountSchema = z.object({
  /**
   * Bank name (required, max 100 chars)
   */
  bankName: z
    .string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name must be less than 100 characters')
    .trim(),

  /**
   * Account name / holder name (required, max 255 chars)
   */
  accountName: z
    .string()
    .min(1, 'Account name is required')
    .max(255, 'Account name must be less than 255 characters')
    .trim(),

  /**
   * Bank account number (required, max 100 chars)
   */
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .max(100, 'Account number must be less than 100 characters')
    .trim(),

  /**
   * IBAN - UAE format with checksum validation
   */
  iban: ibanSchema,

  /**
   * SWIFT/BIC code - format validation
   */
  swiftCode: swiftSchema,

  /**
   * Primary account flag
   */
  isPrimary: z.boolean().optional().default(false),

  /**
   * Account status (required for update)
   */
  status: bankAccountStatusSchema
});

/**
 * Type inference from update bank account schema
 */
export type UpdateBankAccountFormData = z.infer<typeof updateBankAccountSchema>;

// ============================================================================
// SEARCH FILTER SCHEMA
// ============================================================================

/**
 * Validation schema for bank account search/filter
 */
export const bankAccountFilterSchema = z.object({
  /**
   * Search term for bank name or account name
   */
  search: z.string().max(100, 'Search term too long').optional().or(z.literal('')),

  /**
   * Filter by status
   */
  status: bankAccountStatusSchema.optional()
});

/**
 * Type inference from filter schema
 */
export type BankAccountFilterFormData = z.infer<typeof bankAccountFilterSchema>;

/**
 * Default values for filter form
 */
export const bankAccountFilterDefaults: BankAccountFilterFormData = {
  search: '',
  status: undefined
};

// ============================================================================
// HELPER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate IBAN format without checksum (for real-time feedback)
 *
 * @param iban - IBAN to validate
 * @returns Object with validity and error message
 */
export function validateIbanFormat(iban: string): { valid: boolean; error?: string } {
  const normalized = iban.toUpperCase().replace(/\s/g, '');

  if (!normalized) {
    return { valid: false, error: 'IBAN is required' };
  }

  if (!normalized.startsWith('AE')) {
    return { valid: false, error: "UAE IBANs must start with 'AE'" };
  }

  if (normalized.length !== 23) {
    return { valid: false, error: `UAE IBANs must be exactly 23 characters. Current: ${normalized.length}` };
  }

  if (!UAE_IBAN_REGEX.test(normalized)) {
    return { valid: false, error: "Invalid IBAN format. Expected: 'AE' followed by 21 digits" };
  }

  return { valid: true };
}

/**
 * Validate SWIFT/BIC format (for real-time feedback)
 *
 * @param swift - SWIFT code to validate
 * @returns Object with validity and error message
 */
export function validateSwiftFormat(swift: string): { valid: boolean; error?: string } {
  const normalized = swift.toUpperCase().replace(/\s/g, '');

  if (!normalized) {
    return { valid: false, error: 'SWIFT/BIC code is required' };
  }

  if (normalized.length !== 8 && normalized.length !== 11) {
    return { valid: false, error: 'SWIFT/BIC code must be 8 or 11 characters' };
  }

  if (!SWIFT_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        'Invalid format. Expected: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch)'
    };
  }

  return { valid: true };
}

/**
 * Get IBAN validation hints for user
 *
 * @returns Array of validation rules
 */
export function getIbanValidationHints(): string[] {
  return [
    'UAE IBAN format: AE followed by 21 digits',
    'Total length: 23 characters',
    'Example: AE070331234567890123456',
    'Spaces will be removed automatically'
  ];
}

/**
 * Get SWIFT validation hints for user
 *
 * @returns Array of validation rules
 */
export function getSwiftValidationHints(): string[] {
  return [
    '8 or 11 characters',
    'Format: BANKUS33 or BANKUS33XXX',
    '4 letters (bank) + 2 letters (country) + 2 alphanumeric (location)',
    'Optional: 3 alphanumeric (branch)'
  ];
}

/**
 * Check if form data has unsaved changes compared to original
 *
 * @param current - Current form data
 * @param original - Original data (from server)
 * @returns true if there are unsaved changes
 */
export function hasUnsavedChanges(
  current: Partial<CreateBankAccountFormData>,
  original: Partial<CreateBankAccountFormData>
): boolean {
  const keys: (keyof CreateBankAccountFormData)[] = [
    'bankName',
    'accountName',
    'accountNumber',
    'iban',
    'swiftCode',
    'isPrimary',
    'status'
  ];

  return keys.some((key) => {
    const currentVal = current[key];
    const originalVal = original[key];

    // Normalize strings for comparison
    if (typeof currentVal === 'string' && typeof originalVal === 'string') {
      return currentVal.trim().toUpperCase() !== originalVal.trim().toUpperCase();
    }

    return currentVal !== originalVal;
  });
}
