/**
 * Company Profile Types and Interfaces
 * Story 2.8: Company Profile Settings
 */

// ============================================================================
// API INTERFACES
// ============================================================================

/**
 * Company profile response from API
 * GET /api/v1/company-profile
 */
export interface CompanyProfileResponse {
  id: string;
  legalCompanyName: string;
  companyAddress: string;
  city: string;
  country: string;
  trn: string;
  phoneNumber: string;
  emailAddress: string;
  logoUrl: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
}

/**
 * Company profile create/update request
 * PUT /api/v1/company-profile
 */
export interface CompanyProfileRequest {
  legalCompanyName: string;
  companyAddress: string;
  city: string;
  country: string;
  trn: string;
  phoneNumber: string;
  emailAddress: string;
}

/**
 * Logo operation response
 * POST/DELETE /api/v1/company-profile/logo
 */
export interface CompanyProfileLogoResponse {
  logoUrl: string | null;
  message: string;
}

/**
 * API response wrapper
 */
export interface CompanyProfileApiResponse {
  success: boolean;
  data: CompanyProfileResponse;
  message?: string;
  timestamp: string;
}

/**
 * API response wrapper for logo operations
 */
export interface CompanyProfileLogoApiResponse {
  success: boolean;
  data: CompanyProfileLogoResponse;
  message?: string;
  timestamp: string;
}

/**
 * API response wrapper for exists check
 */
export interface CompanyProfileExistsApiResponse {
  success: boolean;
  data: boolean;
  timestamp: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Allowed logo file types
 */
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

/**
 * Maximum logo file size in bytes (2MB)
 */
export const MAX_LOGO_SIZE = 2 * 1024 * 1024;

/**
 * Maximum logo file size in MB for display
 */
export const MAX_LOGO_SIZE_MB = 2;

/**
 * Default country value
 */
export const DEFAULT_COUNTRY = 'United Arab Emirates';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate TRN format (15 digits starting with 100)
 * @param trn Tax Registration Number to validate
 * @returns true if valid, false otherwise
 */
export function isValidTRN(trn: string): boolean {
  return /^100\d{12}$/.test(trn);
}

/**
 * Validate UAE phone format (+971 followed by 9 digits)
 * @param phone Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidUAEPhone(phone: string): boolean {
  return /^\+971\d{9}$/.test(phone);
}

/**
 * Validate logo file type and size
 * @param file File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return 'Logo must be PNG or JPG format';
  }
  if (file.size > MAX_LOGO_SIZE) {
    return `Logo must be less than ${MAX_LOGO_SIZE_MB}MB`;
  }
  return null;
}

/**
 * Format TRN for display (add dashes: 100-XXX-XXX-XXX-XXX)
 * @param trn Raw TRN string
 * @returns Formatted TRN
 */
export function formatTRNDisplay(trn: string): string {
  if (!trn || trn.length !== 15) return trn;
  return `${trn.slice(0, 3)}-${trn.slice(3, 6)}-${trn.slice(6, 9)}-${trn.slice(9, 12)}-${trn.slice(12)}`;
}

/**
 * Format phone for display (+971 X XXX XXXX)
 * @param phone Raw phone string
 * @returns Formatted phone
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone || !phone.startsWith('+971')) return phone;
  const digits = phone.slice(4);
  if (digits.length !== 9) return phone;
  return `+971 ${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4)}`;
}
