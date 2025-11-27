/**
 * React Query Hooks for Vendor Ratings
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Provides hooks for fetching, submitting, and managing vendor ratings
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  submitRating,
  updateRating,
  getWorkOrderRating,
  getVendorPerformance,
  getVendorRatings,
  getTopRatedVendors,
  getVendorsRanking,
  getVendorsComparison
} from '@/services/vendor-ratings.service';
import type {
  VendorRatingRequest,
  VendorRatingResponse,
  VendorRating,
  VendorPerformance,
  VendorRatingPage,
  VendorComparison,
  TopRatedVendor,
  VendorRankingFilters
} from '@/types/vendor-ratings';
import type { ServiceCategory } from '@/types/vendors';
import { vendorKeys } from './useVendors';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const vendorRatingKeys = {
  all: ['vendor-ratings'] as const,
  workOrderRating: (workOrderId: string) => [...vendorRatingKeys.all, 'work-order', workOrderId] as const,
  performance: (vendorId: string) => [...vendorRatingKeys.all, 'performance', vendorId] as const,
  ratings: (vendorId: string) => [...vendorRatingKeys.all, 'list', vendorId] as const,
  ratingsPage: (vendorId: string, page: number, size: number) => [...vendorRatingKeys.ratings(vendorId), page, size] as const,
  topRated: (category?: ServiceCategory) => [...vendorRatingKeys.all, 'top-rated', category] as const,
  ranking: (filters?: VendorRankingFilters) => [...vendorRatingKeys.all, 'ranking', filters] as const,
  comparison: (vendorIds: string[]) => [...vendorRatingKeys.all, 'comparison', vendorIds.join(',')] as const
};

// ============================================================================
// WORK ORDER RATING HOOKS
// ============================================================================

/**
 * Hook to check if a rating exists for a work order
 *
 * @param workOrderId - UUID of the work order
 * @param enabled - Whether the query should execute
 *
 * @returns UseQueryResult with existing rating or null
 *
 * @example
 * ```typescript
 * const { data: existingRating, isLoading } = useWorkOrderRating(workOrderId);
 *
 * if (existingRating) {
 *   return <RatingDisplay rating={existingRating} />;
 * }
 * return <RateVendorButton />;
 * ```
 */
export function useWorkOrderRating(workOrderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: vendorRatingKeys.workOrderRating(workOrderId),
    queryFn: () => getWorkOrderRating(workOrderId),
    enabled: !!workOrderId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false // Don't retry 404s
  });
}

/**
 * Hook to submit a vendor rating for a completed work order
 *
 * @returns UseMutationResult with submitRating function
 *
 * @example
 * ```typescript
 * const { mutate: submitRating, isPending } = useSubmitRating();
 *
 * const handleSubmit = (data: VendorRatingFormData) => {
 *   submitRating({
 *     workOrderId,
 *     data: {
 *       qualityScore: data.qualityScore,
 *       timelinessScore: data.timelinessScore,
 *       communicationScore: data.communicationScore,
 *       professionalismScore: data.professionalismScore,
 *       comments: data.comments
 *     }
 *   });
 * };
 * ```
 */
export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workOrderId, data }: { workOrderId: string; data: VendorRatingRequest }) =>
      submitRating(workOrderId, data),
    onSuccess: (response, { workOrderId }) => {
      // Invalidate work order rating query
      queryClient.invalidateQueries({
        queryKey: vendorRatingKeys.workOrderRating(workOrderId)
      });

      // Invalidate vendor performance and ratings
      if (response.vendorId) {
        queryClient.invalidateQueries({
          queryKey: vendorRatingKeys.performance(response.vendorId)
        });
        queryClient.invalidateQueries({
          queryKey: vendorRatingKeys.ratings(response.vendorId)
        });
        // Invalidate vendor detail to update rating
        queryClient.invalidateQueries({
          queryKey: vendorKeys.detail(response.vendorId)
        });
      }

      // Invalidate top-rated and ranking lists
      queryClient.invalidateQueries({
        queryKey: ['vendor-ratings', 'top-rated']
      });
      queryClient.invalidateQueries({
        queryKey: ['vendor-ratings', 'ranking']
      });

      toast.success('Rating submitted successfully!');
    },
    onError: (error: Error & { response?: { status?: number; data?: { message?: string } } }) => {
      if (error.response?.status === 409) {
        toast.error('A rating already exists for this work order');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit rating');
      }
    }
  });
}

/**
 * Hook to update an existing vendor rating (within 7-day window)
 *
 * @returns UseMutationResult with updateRating function
 */
export function useUpdateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workOrderId, data }: { workOrderId: string; data: VendorRatingRequest }) =>
      updateRating(workOrderId, data),
    onSuccess: (response, { workOrderId }) => {
      // Invalidate work order rating query
      queryClient.invalidateQueries({
        queryKey: vendorRatingKeys.workOrderRating(workOrderId)
      });

      // Invalidate vendor performance and ratings
      if (response.vendorId) {
        queryClient.invalidateQueries({
          queryKey: vendorRatingKeys.performance(response.vendorId)
        });
        queryClient.invalidateQueries({
          queryKey: vendorRatingKeys.ratings(response.vendorId)
        });
        queryClient.invalidateQueries({
          queryKey: vendorKeys.detail(response.vendorId)
        });
      }

      toast.success('Rating updated successfully!');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update rating');
    }
  });
}

// ============================================================================
// VENDOR PERFORMANCE HOOKS
// ============================================================================

/**
 * Hook to fetch vendor performance metrics
 *
 * @param vendorId - UUID of the vendor
 * @param enabled - Whether the query should execute
 *
 * @returns UseQueryResult with VendorPerformance data
 *
 * @example
 * ```typescript
 * const { data: performance, isLoading } = useVendorPerformance(vendorId);
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <VendorPerformanceCard
 *     rating={performance.overallRating}
 *     jobsCompleted={performance.totalJobsCompleted}
 *     onTimeRate={performance.onTimeCompletionRate}
 *   />
 * );
 * ```
 */
export function useVendorPerformance(vendorId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: vendorRatingKeys.performance(vendorId),
    queryFn: () => getVendorPerformance(vendorId),
    enabled: !!vendorId && enabled,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Hook to fetch paginated list of ratings for a vendor
 *
 * @param vendorId - UUID of the vendor
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @param enabled - Whether the query should execute
 *
 * @returns UseQueryResult with VendorRatingPage data
 *
 * @example
 * ```typescript
 * const { data: ratings, isLoading } = useVendorRatings(vendorId, 0, 10);
 *
 * return (
 *   <RatingHistoryList
 *     ratings={ratings.content}
 *     totalPages={ratings.totalPages}
 *   />
 * );
 * ```
 */
export function useVendorRatings(
  vendorId: string,
  page: number = 0,
  size: number = 10,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: vendorRatingKeys.ratingsPage(vendorId, page, size),
    queryFn: () => getVendorRatings(vendorId, page, size),
    enabled: !!vendorId && enabled,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// ============================================================================
// TOP-RATED AND RANKING HOOKS
// ============================================================================

/**
 * Hook to fetch top-rated vendors
 *
 * @param category - Optional service category filter
 * @param limit - Maximum number of vendors to return
 * @param enabled - Whether the query should execute
 *
 * @returns UseQueryResult with list of TopRatedVendor
 *
 * @example
 * ```typescript
 * const { data: topVendors } = useTopRatedVendors('PLUMBING', 10);
 *
 * return (
 *   <TopVendorsList vendors={topVendors} />
 * );
 * ```
 */
export function useTopRatedVendors(
  category?: ServiceCategory,
  limit: number = 10,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: vendorRatingKeys.topRated(category),
    queryFn: () => getTopRatedVendors({ category, limit }),
    enabled,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}

/**
 * Hook to fetch vendors for ranking page with filters
 *
 * @param filters - Ranking filters (category, dateFrom, dateTo, minRating)
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @param sortBy - Sort field
 * @param sortDirection - Sort direction
 * @param enabled - Whether the query should execute
 *
 * @returns UseQueryResult with paginated vendor ranking data
 */
export function useVendorsRanking(
  filters?: VendorRankingFilters,
  page: number = 0,
  size: number = 20,
  sortBy: string = 'rating',
  sortDirection: 'ASC' | 'DESC' = 'DESC',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...vendorRatingKeys.ranking(filters), page, size, sortBy, sortDirection],
    queryFn: () => getVendorsRanking(filters, page, size, sortBy, sortDirection),
    enabled,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// ============================================================================
// COMPARISON HOOKS
// ============================================================================

/**
 * Hook to fetch comparison data for multiple vendors
 *
 * @param vendorIds - Array of vendor UUIDs (2-4 vendors)
 * @param enabled - Whether the query should execute
 *
 * @returns UseQueryResult with VendorComparison data
 *
 * @example
 * ```typescript
 * const { data: comparison, isLoading } = useVendorsComparison(
 *   ['vendor-1', 'vendor-2', 'vendor-3']
 * );
 *
 * return (
 *   <VendorComparisonTable vendors={comparison.vendors} />
 * );
 * ```
 */
export function useVendorsComparison(vendorIds: string[], enabled: boolean = true) {
  return useQuery({
    queryKey: vendorRatingKeys.comparison(vendorIds),
    queryFn: () => getVendorsComparison(vendorIds),
    enabled: vendorIds.length >= 2 && vendorIds.length <= 4 && enabled,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to invalidate all vendor rating caches
 * Useful after bulk operations or manual cache refresh
 */
export function useInvalidateVendorRatings() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: vendorRatingKeys.all
    });
  };
}
