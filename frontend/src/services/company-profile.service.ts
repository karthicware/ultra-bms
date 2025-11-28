/**
 * Company Profile API Service
 * Story 2.8: Company Profile Settings
 *
 * All company profile management API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  CompanyProfileResponse,
  CompanyProfileRequest,
  CompanyProfileApiResponse,
  CompanyProfileLogoApiResponse,
  CompanyProfileExistsApiResponse,
} from '@/types/company-profile';

const COMPANY_PROFILE_BASE_PATH = '/v1/company-profile';

// ============================================================================
// GET COMPANY PROFILE
// ============================================================================

/**
 * Get the company profile
 *
 * @returns Promise that resolves to CompanyProfileResponse or null if not exists
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have required role (403)
 *
 * @example
 * ```typescript
 * const profile = await getCompanyProfile();
 * if (profile) {
 *   console.log(profile.legalCompanyName);
 * }
 * ```
 */
export async function getCompanyProfile(): Promise<CompanyProfileResponse | null> {
  try {
    const response = await apiClient.get<CompanyProfileApiResponse>(
      COMPANY_PROFILE_BASE_PATH
    );
    return response.data.data;
  } catch (error) {
    // Return null for 404 (profile not found)
    if ((error as { response?: { status: number } }).response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// SAVE COMPANY PROFILE (CREATE/UPDATE)
// ============================================================================

/**
 * Create or update the company profile (upsert)
 *
 * @param request - The company profile data
 *
 * @returns Promise that resolves to saved CompanyProfileResponse
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have ADMIN/SUPER_ADMIN role (403)
 * @throws {ValidationException} When request body fails validation (400)
 * @throws {ConflictException} When TRN already exists (409)
 *
 * @example
 * ```typescript
 * const profile = await saveCompanyProfile({
 *   legalCompanyName: "My Company LLC",
 *   companyAddress: "123 Main St",
 *   city: "Dubai",
 *   country: "United Arab Emirates",
 *   trn: "100123456789012",
 *   phoneNumber: "+971501234567",
 *   emailAddress: "info@mycompany.ae"
 * });
 * console.log(profile.id);
 * ```
 */
export async function saveCompanyProfile(
  request: CompanyProfileRequest
): Promise<CompanyProfileResponse> {
  const response = await apiClient.put<CompanyProfileApiResponse>(
    COMPANY_PROFILE_BASE_PATH,
    request
  );
  return response.data.data;
}

// ============================================================================
// LOGO OPERATIONS
// ============================================================================

/**
 * Upload company logo
 *
 * Accepts PNG/JPG images up to 2MB.
 * Automatically deletes existing logo if present.
 *
 * @param file - The logo file to upload
 *
 * @returns Promise that resolves to presigned URL for the uploaded logo
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have ADMIN/SUPER_ADMIN role (403)
 * @throws {ValidationException} When file type/size is invalid (400)
 * @throws {BadRequestException} When company profile doesn't exist (400)
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input[type="file"]');
 * const file = input.files[0];
 * const response = await uploadCompanyLogo(file);
 * console.log(response.logoUrl);
 * ```
 */
export async function uploadCompanyLogo(
  file: File
): Promise<{ logoUrl: string | null; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<CompanyProfileLogoApiResponse>(
    `${COMPANY_PROFILE_BASE_PATH}/logo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

/**
 * Delete company logo
 *
 * Removes logo from S3 and clears logo path in profile.
 *
 * @returns Promise that resolves when deletion is complete
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have ADMIN/SUPER_ADMIN role (403)
 * @throws {NotFoundException} When company profile doesn't exist (404)
 *
 * @example
 * ```typescript
 * await deleteCompanyLogo();
 * console.log("Logo deleted");
 * ```
 */
export async function deleteCompanyLogo(): Promise<void> {
  await apiClient.delete(`${COMPANY_PROFILE_BASE_PATH}/logo`);
}

// ============================================================================
// EXISTS CHECK
// ============================================================================

/**
 * Check if company profile exists
 *
 * @returns Promise that resolves to boolean indicating if profile exists
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user doesn't have required role (403)
 *
 * @example
 * ```typescript
 * const exists = await companyProfileExists();
 * if (!exists) {
 *   console.log("No company profile configured");
 * }
 * ```
 */
export async function companyProfileExists(): Promise<boolean> {
  const response = await apiClient.get<CompanyProfileExistsApiResponse>(
    `${COMPANY_PROFILE_BASE_PATH}/exists`
  );
  return response.data.data;
}
