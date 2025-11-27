/**
 * Vendor Ratings API Service
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * All vendor rating-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  VendorRating,
  VendorRatingRequest,
  VendorRatingResponse,
  VendorPerformance,
  VendorComparison,
  VendorRatingPage,
  TopRatedVendor,
  VendorRankingFilters
} from '@/types/vendor-ratings';
import type { ServiceCategory } from '@/types/vendors';

const WORK_ORDERS_BASE_PATH = '/v1/work-orders';
const VENDORS_BASE_PATH = '/v1/vendors';

// ============================================================================
// SUBMIT RATING
// ============================================================================

/**
 * Submit a vendor rating for a completed work order
 *
 * @param workOrderId - UUID of the completed work order
 * @param data - Rating data (qualityScore, timelinessScore, communicationScore, professionalismScore, comments)
 *
 * @returns Promise that resolves to the created rating
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {ConflictException} When a rating already exists for this work order (409)
 * @throws {NotFoundException} When work order not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks PROPERTY_MANAGER or MAINTENANCE_SUPERVISOR role (403)
 *
 * @example
 * ```typescript
 * const rating = await submitRating('wo-uuid', {
 *   qualityScore: 5,
 *   timelinessScore: 4,
 *   communicationScore: 5,
 *   professionalismScore: 4,
 *   comments: 'Excellent work, very professional'
 * });
 *
 * console.log(rating.overallScore); // 4.5
 * ```
 */
export async function submitRating(
  workOrderId: string,
  data: VendorRatingRequest
): Promise<VendorRatingResponse> {
  const response = await apiClient.post<{ success: boolean; data: VendorRatingResponse }>(
    `${WORK_ORDERS_BASE_PATH}/${workOrderId}/vendor-rating`,
    data
  );
  return response.data.data;
}

/**
 * Update an existing vendor rating (allowed within 7 days)
 *
 * @param workOrderId - UUID of the work order
 * @param data - Updated rating data
 *
 * @returns Promise that resolves to the updated rating
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {NotFoundException} When rating not found (404)
 * @throws {ForbiddenException} When update window (7 days) has expired (403)
 */
export async function updateRating(
  workOrderId: string,
  data: VendorRatingRequest
): Promise<VendorRatingResponse> {
  const response = await apiClient.put<{ success: boolean; data: VendorRatingResponse }>(
    `${WORK_ORDERS_BASE_PATH}/${workOrderId}/vendor-rating`,
    data
  );
  return response.data.data;
}

/**
 * Check if a rating exists for a work order
 *
 * @param workOrderId - UUID of the work order
 *
 * @returns Promise that resolves to the existing rating or null if none exists
 */
export async function getWorkOrderRating(workOrderId: string): Promise<VendorRating | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: VendorRating }>(
      `${WORK_ORDERS_BASE_PATH}/${workOrderId}/vendor-rating`
    );
    return response.data.data;
  } catch (error: unknown) {
    // Return null if rating doesn't exist (404)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}

// ============================================================================
// VENDOR PERFORMANCE
// ============================================================================

/**
 * Get vendor performance metrics
 *
 * @param vendorId - UUID of the vendor
 *
 * @returns Promise that resolves to VendorPerformance with all metrics
 *
 * @throws {NotFoundException} When vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const performance = await getVendorPerformance('vendor-uuid');
 *
 * console.log(performance.overallRating); // 4.25
 * console.log(performance.totalJobsCompleted); // 47
 * console.log(performance.onTimeCompletionRate); // 92.5
 * console.log(performance.averageCompletionTime); // 2.3 (days)
 * ```
 */
export async function getVendorPerformance(vendorId: string): Promise<VendorPerformance> {
  const response = await apiClient.get<{ success: boolean; data: VendorPerformance }>(
    `${VENDORS_BASE_PATH}/${vendorId}/performance`
  );
  return response.data.data;
}

// ============================================================================
// VENDOR RATINGS LIST
// ============================================================================

/**
 * Get paginated list of ratings for a vendor
 *
 * @param vendorId - UUID of the vendor
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 *
 * @returns Promise that resolves to paginated list of VendorRating
 *
 * @throws {NotFoundException} When vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const ratings = await getVendorRatings('vendor-uuid', 0, 10);
 *
 * console.log(ratings.content); // Array of VendorRating
 * console.log(ratings.totalElements); // Total number of ratings
 * ```
 */
export async function getVendorRatings(
  vendorId: string,
  page: number = 0,
  size: number = 10
): Promise<VendorRatingPage> {
  const response = await apiClient.get<{ success: boolean; data: VendorRatingPage }>(
    `${VENDORS_BASE_PATH}/${vendorId}/ratings`,
    {
      params: { page, size }
    }
  );
  return response.data.data;
}

// ============================================================================
// TOP-RATED VENDORS
// ============================================================================

/**
 * Get list of top-rated vendors
 *
 * @param filters - Optional filters (category, limit)
 *
 * @returns Promise that resolves to list of top-rated vendors
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * // Get top 10 plumbing vendors
 * const topVendors = await getTopRatedVendors({
 *   category: 'PLUMBING',
 *   limit: 10
 * });
 * ```
 */
export async function getTopRatedVendors(
  filters?: {
    category?: ServiceCategory;
    limit?: number;
  }
): Promise<TopRatedVendor[]> {
  const response = await apiClient.get<{ success: boolean; data: TopRatedVendor[] }>(
    `${VENDORS_BASE_PATH}/top-rated`,
    {
      params: {
        category: filters?.category,
        limit: filters?.limit || 10
      }
    }
  );
  return response.data.data;
}

/**
 * Get vendors for ranking page with filters
 *
 * @param filters - Ranking filters (category, dateFrom, dateTo, minRating)
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @param sortBy - Sort field (rating, jobsCompleted, onTimeRate, hourlyRate)
 * @param sortDirection - Sort direction (ASC, DESC)
 *
 * @returns Promise that resolves to paginated list of vendors for ranking
 */
export async function getVendorsRanking(
  filters?: VendorRankingFilters,
  page: number = 0,
  size: number = 20,
  sortBy: string = 'rating',
  sortDirection: 'ASC' | 'DESC' = 'DESC'
): Promise<VendorRatingPage> {
  const response = await apiClient.get<{ success: boolean; data: VendorRatingPage }>(
    `${VENDORS_BASE_PATH}/ranking`,
    {
      params: {
        ...filters,
        page,
        size,
        sortBy,
        sortDirection
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// VENDOR COMPARISON
// ============================================================================

/**
 * Get comparison data for multiple vendors
 *
 * @param vendorIds - Array of vendor UUIDs (2-4 vendors)
 *
 * @returns Promise that resolves to VendorComparison with side-by-side data
 *
 * @throws {ValidationException} When less than 2 or more than 4 vendors specified (400)
 * @throws {NotFoundException} When any vendor not found (404)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 *
 * @example
 * ```typescript
 * const comparison = await getVendorsComparison([
 *   'vendor-uuid-1',
 *   'vendor-uuid-2',
 *   'vendor-uuid-3'
 * ]);
 *
 * console.log(comparison.vendors); // Array of VendorComparisonEntry
 * ```
 */
export async function getVendorsComparison(vendorIds: string[]): Promise<VendorComparison> {
  const response = await apiClient.get<{ success: boolean; data: VendorComparison }>(
    `${VENDORS_BASE_PATH}/compare`,
    {
      params: {
        ids: vendorIds.join(',')
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

/**
 * Vendor Ratings Service
 * Provides all vendor rating-related API operations
 */
export const vendorRatingsService = {
  submitRating,
  updateRating,
  getWorkOrderRating,
  getVendorPerformance,
  getVendorRatings,
  getTopRatedVendors,
  getVendorsRanking,
  getVendorsComparison
};

export default vendorRatingsService;
