/**
 * Vendor Rating Types and Interfaces
 * Story 5.3: Vendor Performance Tracking and Rating
 */

// ============================================================================
// RATING INTERFACES
// ============================================================================

/**
 * Vendor rating entity
 * Represents a single rating for a vendor after work order completion
 */
export interface VendorRating {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  vendorId: string;
  qualityScore: number; // 1-5
  timelinessScore: number; // 1-5
  communicationScore: number; // 1-5
  professionalismScore: number; // 1-5
  overallScore: number; // Calculated average, 2 decimal places
  comments?: string;
  ratedBy: string;
  ratedByName: string;
  ratedAt: string;
  canUpdate?: boolean; // Whether the rating can still be updated (within 7 days)
}

/**
 * Request payload for submitting a vendor rating
 */
export interface VendorRatingRequest {
  qualityScore: number; // 1-5
  timelinessScore: number; // 1-5
  communicationScore: number; // 1-5
  professionalismScore: number; // 1-5
  comments?: string;
}

/**
 * Response for rating submission
 */
export interface VendorRatingResponse {
  id: string;
  workOrderId: string;
  vendorId: string;
  overallScore: number;
  ratedAt: string;
}

// ============================================================================
// PERFORMANCE INTERFACES
// ============================================================================

/**
 * Rating distribution counts
 * Shows breakdown of ratings by star level
 */
export interface VendorRatingDistribution {
  fiveStarCount: number;
  fiveStarPercent: number;
  fourStarCount: number;
  fourStarPercent: number;
  threeStarCount: number;
  threeStarPercent: number;
  twoStarCount: number;
  twoStarPercent: number;
  oneStarCount: number;
  oneStarPercent: number;
  totalCount: number;
}

/**
 * Vendor performance metrics
 * Aggregated metrics for vendor performance display
 */
export interface VendorPerformance {
  vendorId: string;
  vendorName: string;
  overallRating: number; // 0-5, 2 decimal places
  totalJobsCompleted: number;
  averageCompletionTime: number | null; // Days, null if no completed jobs
  onTimeCompletionRate: number | null; // Percentage 0-100, null if no jobs
  totalAmountPaid: number; // Total actual_cost from completed work orders
  ratingDistribution: VendorRatingDistribution;
  // Average category scores
  averageQualityScore?: number | null;
  averageTimelinessScore?: number | null;
  averageCommunicationScore?: number | null;
  averageProfessionalismScore?: number | null;
}

/**
 * Vendor comparison entry
 * Single vendor data for comparison view
 */
export interface VendorComparisonEntry {
  id: string;
  vendorNumber: string;
  companyName: string;
  overallRating: number;
  totalJobsCompleted: number;
  onTimeCompletionRate: number | null;
  averageCompletionTime: number | null;
  hourlyRate: number;
  serviceCategories: string[];
}

/**
 * Vendor comparison response
 * Contains multiple vendors for side-by-side comparison
 */
export interface VendorComparison {
  vendors: VendorComparisonEntry[];
  comparedAt: string;
}

// ============================================================================
// LIST AND FILTER INTERFACES
// ============================================================================

/**
 * Paginated rating list response
 */
export interface VendorRatingPage {
  content: VendorRating[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Top-rated vendor entry for ranking
 */
export interface TopRatedVendor {
  vendorId: string;
  vendorNumber: string;
  vendorName: string;
  overallRating: number;
  totalJobsCompleted: number;
  onTimeCompletionRate: number | null;
  hourlyRate: number;
  ratingDistribution?: VendorRatingDistribution;
}

/**
 * Filters for vendor ranking page
 */
export interface VendorRankingFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minRating?: number;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Error response for 409 Conflict (duplicate rating)
 */
export interface DuplicateRatingError {
  error: string;
  message: string;
  existingRatingId: string;
}
