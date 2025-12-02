/**
 * React Query Hooks for Properties
 *
 * Provides hooks for fetching property data with automatic cache management
 */

import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/services/properties.service';
import type { PropertyListResponse, PropertySearchParams } from '@/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const propertyKeys = {
  all: ['properties'] as const,
  list: (params?: PropertySearchParams) =>
    [...propertyKeys.all, 'list', params] as const
};

// Cache configuration
const PROPERTIES_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PROPERTIES_GC_TIME = 15 * 60 * 1000;   // 15 minutes

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch properties list
 *
 * @param params - Optional search/filter parameters
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with property list data
 */
export function useProperties(
  params?: PropertySearchParams,
  enabled: boolean = true
) {
  return useQuery<PropertyListResponse>({
    queryKey: propertyKeys.list(params),
    queryFn: () => getProperties(params),
    staleTime: PROPERTIES_STALE_TIME,
    gcTime: PROPERTIES_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}
