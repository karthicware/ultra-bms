/**
 * Tenant Management API Service
 * All tenant onboarding and management-related API calls
 */

import { apiClient } from '@/lib/api';
import type {
  Tenant,
  TenantResponse,
  CreateTenantResponse,
  Property,
  Unit,
  LeadConversionData,
} from '@/types';

/**
 * Spring Page structure
 */
export interface TenantPage {
  content: TenantResponse[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * API response wrapper for tenant list
 */
export interface TenantListResponse {
  success?: boolean;
  message?: string;
  data?: TenantPage;
  timestamp?: string;
}

const TENANTS_BASE_PATH = '/v1/tenants';
const PROPERTIES_BASE_PATH = '/v1/properties';

/**
 * Create a new tenant with multipart/form-data
 *
 * @param formData - FormData containing all tenant information and files
 *
 * FormData fields:
 * - Personal Info: firstName, lastName, email, phone, dateOfBirth, nationalId, nationality, emergencyContactName, emergencyContactPhone
 * - Lease Info: propertyId, unitId, leaseStartDate, leaseEndDate, leaseType, renewalOption
 * - Rent: baseRent, adminFee, serviceCharge, securityDeposit
 * - Parking: parkingSpots, parkingFeePerSpot, spotNumbers
 * - Payment: paymentFrequency, paymentDueDate, paymentMethod, pdcChequeCount
 * - Files: emiratesIdFile, passportFile, visaFile, signedLeaseFile, mulkiyaFile, additionalFiles[]
 * - Lead conversion (optional): leadId, quotationId
 *
 * @returns Promise that resolves to CreateTenantResponse with tenant ID and message
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When email already exists or unit is not AVAILABLE (409)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('firstName', 'Ahmed');
 * formData.append('lastName', 'Ali');
 * formData.append('email', 'ahmed@example.com');
 * formData.append('emiratesIdFile', emiratesIdFile);
 * // ... append all other fields
 *
 * const result = await createTenant(formData);
 * console.log(result.tenantNumber); // TNT-2025-0001
 * ```
 */
export async function createTenant(formData: FormData): Promise<CreateTenantResponse> {
  const response = await apiClient.post<{ data: CreateTenantResponse }>(
    TENANTS_BASE_PATH,
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
 * Get all tenants with pagination
 *
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @param sort - Sort field and direction (e.g., 'createdAt,desc')
 *
 * @returns Promise that resolves to paginated tenant list
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const tenants = await getAllTenants(0, 20, 'createdAt,desc');
 * ```
 */
export async function getAllTenants(
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<TenantListResponse> {
  const response = await apiClient.get<TenantListResponse>(TENANTS_BASE_PATH, {
    params: { page, size, sort },
  });
  return response.data;
}

/**
 * Search tenants by name, email, or tenant number
 *
 * @param searchTerm - Search query string
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 *
 * @returns Promise that resolves to paginated search results
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const results = await searchTenants('john', 0, 20);
 * ```
 */
export async function searchTenants(
  searchTerm: string,
  page: number = 0,
  size: number = 20
): Promise<TenantListResponse> {
  const response = await apiClient.get<TenantListResponse>(
    `${TENANTS_BASE_PATH}/search`,
    {
      params: { q: searchTerm, page, size },
    }
  );
  return response.data;
}

/**
 * Check if email is available (not already used by another tenant)
 *
 * @param email - Email address to check
 *
 * @returns Promise that resolves to true if available, false if already exists
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const isAvailable = await checkEmailAvailability('ahmed@example.com');
 * if (!isAvailable) {
 *   console.log('Email already exists');
 * }
 * ```
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const response = await apiClient.get<{ available: boolean }>(
      `${TENANTS_BASE_PATH}/check-email/${encodeURIComponent(email)}`
    );
    return response.data.available;
  } catch (error) {
    // If email exists, backend returns 409 Conflict
    return false;
  }
}

/**
 * Get list of all properties (for property dropdown)
 *
 * @returns Promise that resolves to array of properties
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const properties = await getProperties();
 * ```
 */
export async function getProperties(): Promise<Property[]> {
  const response = await apiClient.get<{ success: boolean; data: { content: Property[] } }>(PROPERTIES_BASE_PATH, {
    params: {
      page: 0,
      size: 1000, // Get all properties for dropdown
      status: 'ACTIVE',
    },
  });
  return response.data.data?.content ?? [];
}

/**
 * Get available units for a specific property
 *
 * @param propertyId - Property UUID
 *
 * @returns Promise that resolves to array of available units
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When property does not exist (404)
 *
 * @example
 * ```typescript
 * const units = await getAvailableUnits('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export async function getAvailableUnits(propertyId: string): Promise<Unit[]> {
  const response = await apiClient.get<Unit[]>(
    `${PROPERTIES_BASE_PATH}/${propertyId}/units`,
    {
      params: {
        status: 'AVAILABLE',
      },
    }
  );
  return response.data;
}

/**
 * Get tenant details by ID
 *
 * @param tenantId - Tenant UUID
 *
 * @returns Promise that resolves to full tenant details
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When tenant does not exist (404)
 *
 * @example
 * ```typescript
 * const tenant = await getTenantById('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export async function getTenantById(tenantId: string): Promise<TenantResponse> {
  const response = await apiClient.get<{ data: TenantResponse }>(`${TENANTS_BASE_PATH}/${tenantId}`);
  return response.data.data;
}

/**
 * Get lead conversion data for pre-populating tenant form
 *
 * @param leadId - Lead UUID
 * @param quotationId - Quotation UUID
 *
 * @returns Promise that resolves to lead and quotation data for pre-population
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When lead or quotation does not exist (404)
 *
 * @example
 * ```typescript
 * const conversionData = await getLeadConversionData(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   '660e8400-e29b-41d4-a716-446655440001'
 * );
 * // Use conversionData to pre-populate form
 * ```
 */
export async function getLeadConversionData(
  leadId: string,
  quotationId: string
): Promise<LeadConversionData> {
  const response = await apiClient.get<{ data: LeadConversionData }>(
    '/v1/leads/conversion-data',
    {
      params: {
        leadId,
        quotationId,
      },
    }
  );
  return response.data.data;
}

/**
 * Upload tenant document
 *
 * @param tenantId - Tenant UUID
 * @param file - File to upload
 * @param documentType - Type of document (EMIRATES_ID, PASSPORT, etc.)
 *
 * @returns Promise that resolves when upload completes
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {NotFoundException} When tenant does not exist (404)
 * @throws {ValidationException} When file validation fails (400)
 *
 * @example
 * ```typescript
 * await uploadTenantDocument(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   file,
 *   'PASSPORT'
 * );
 * ```
 */
export async function uploadTenantDocument(
  tenantId: string,
  file: File,
  documentType: string
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  await apiClient.post(`${TENANTS_BASE_PATH}/${tenantId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Get tenants by property ID
 *
 * @param propertyId - Property UUID
 *
 * @returns Promise that resolves to array of tenants for the property
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const tenants = await getTenantsByProperty('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export async function getTenantsByProperty(propertyId: string): Promise<TenantResponse[]> {
  const response = await apiClient.get<{ success: boolean; data: TenantResponse[] }>(
    `${TENANTS_BASE_PATH}/by-property/${propertyId}`
  );
  return response.data.data;
}
