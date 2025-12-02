/**
 * React Query Hooks for Occupancy Dashboard
 * Story 8.3: Occupancy Dashboard
 *
 * Provides hooks for fetching occupancy dashboard data with automatic cache management
 * and stale-while-revalidate strategy for optimal UX
 */

import { useQuery } from '@tanstack/react-query';
import {
  getOccupancyDashboard,
  getOccupancyLeaseExpirations,
  getRecentActivity
} from '@/services/occupancy-dashboard.service';
import type {
  OccupancyDashboard,
  LeaseExpirationItem,
  LeaseActivityItem,
  OccupancyDashboardFilter,
  OccupancyLeaseExpirationsFilter,
  RecentActivityFilter
} from '@/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const occupancyDashboardKeys = {
  all: ['occupancy-dashboard'] as const,
  dashboard: (filter?: OccupancyDashboardFilter) =>
    [...occupancyDashboardKeys.all, 'dashboard', filter] as const,
  leaseExpirations: (filter?: OccupancyLeaseExpirationsFilter) =>
    [...occupancyDashboardKeys.all, 'lease-expirations', filter] as const,
  recentActivity: (filter?: RecentActivityFilter) =>
    [...occupancyDashboardKeys.all, 'recent-activity', filter] as const
};

// Cache configuration - matches backend 5-minute cache (AC-15)
// Frontend uses 2-minute staleTime for stale-while-revalidate UX
const OCCUPANCY_DASHBOARD_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const OCCUPANCY_DASHBOARD_GC_TIME = 10 * 60 * 1000;   // 10 minutes

// ============================================================================
// COMPLETE DASHBOARD HOOK (AC-9)
// ============================================================================

/**
 * Hook to fetch complete occupancy dashboard data
 *
 * @param filter - Optional filter parameters (propertyId)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with complete occupancy dashboard data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useOccupancyDashboard();
 *
 * if (isLoading) return <OccupancySkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <OccupancyDashboardPage
 *     kpis={data.kpis}
 *     occupancyChart={data.occupancyChart}
 *     leaseExpirationChart={data.leaseExpirationChart}
 *     upcomingExpirations={data.upcomingExpirations}
 *     recentActivity={data.recentActivity}
 *   />
 * );
 * ```
 */
export function useOccupancyDashboard(
  filter?: OccupancyDashboardFilter,
  enabled: boolean = true
) {
  return useQuery<OccupancyDashboard>({
    queryKey: occupancyDashboardKeys.dashboard(filter),
    queryFn: () => getOccupancyDashboard(filter),
    staleTime: OCCUPANCY_DASHBOARD_STALE_TIME,
    gcTime: OCCUPANCY_DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// LEASE EXPIRATIONS LIST HOOK (AC-10)
// ============================================================================

/**
 * Hook to fetch upcoming lease expirations with pagination
 *
 * @param filter - Optional filter parameters (propertyId, days, page, size)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with lease expiration items
 *
 * @example
 * ```typescript
 * const [page, setPage] = useState(0);
 * const { data: expirations, isLoading } = useOccupancyLeaseExpirations({
 *   days: 100,
 *   page,
 *   size: 10
 * });
 *
 * return (
 *   <LeaseExpirationTable
 *     items={expirations}
 *     isLoading={isLoading}
 *     page={page}
 *     onPageChange={setPage}
 *   />
 * );
 * ```
 */
export function useOccupancyLeaseExpirations(
  filter?: OccupancyLeaseExpirationsFilter,
  enabled: boolean = true
) {
  return useQuery<LeaseExpirationItem[]>({
    queryKey: occupancyDashboardKeys.leaseExpirations(filter),
    queryFn: () => getOccupancyLeaseExpirations(filter),
    staleTime: OCCUPANCY_DASHBOARD_STALE_TIME,
    gcTime: OCCUPANCY_DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// RECENT ACTIVITY HOOK (AC-11)
// ============================================================================

/**
 * Hook to fetch recent lease activity feed
 *
 * @param filter - Optional filter parameters (propertyId, limit)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with lease activity items
 *
 * @example
 * ```typescript
 * const { data: activities, isLoading } = useRecentActivity({ limit: 10 });
 *
 * return (
 *   <ActivityFeed
 *     items={activities}
 *     isLoading={isLoading}
 *   />
 * );
 * ```
 */
export function useRecentActivity(
  filter?: RecentActivityFilter,
  enabled: boolean = true
) {
  return useQuery<LeaseActivityItem[]>({
    queryKey: occupancyDashboardKeys.recentActivity(filter),
    queryFn: () => getRecentActivity(filter),
    staleTime: OCCUPANCY_DASHBOARD_STALE_TIME,
    gcTime: OCCUPANCY_DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}
