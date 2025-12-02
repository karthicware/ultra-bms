/**
 * React Query Hooks for Executive Dashboard
 * Story 8.1: Executive Summary Dashboard
 *
 * Provides hooks for fetching dashboard data with automatic cache management
 * and stale-while-revalidate strategy for optimal UX
 */

import { useQuery } from '@tanstack/react-query';
import {
  getExecutiveDashboard,
  getKpiCards,
  getMaintenanceQueue,
  getUpcomingPmJobs,
  getLeaseExpirations,
  getCriticalAlerts,
  getPropertyComparison
} from '@/services/dashboard.service';
import type {
  ExecutiveDashboard,
  KpiCards,
  MaintenanceQueueItem,
  PmJobChartData,
  LeaseExpirationTimeline,
  Alert,
  PropertyComparison,
  DashboardFilter,
  MaintenanceQueueFilter,
  PmJobsFilter,
  LeaseExpirationsFilter,
  PropertyComparisonFilter
} from '@/types/dashboard';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  executive: (filter?: DashboardFilter) => [...dashboardKeys.all, 'executive', filter] as const,
  kpis: (filter?: DashboardFilter) => [...dashboardKeys.all, 'kpis', filter] as const,
  maintenanceQueue: (filter?: MaintenanceQueueFilter) => [...dashboardKeys.all, 'maintenance-queue', filter] as const,
  pmJobs: (filter?: PmJobsFilter) => [...dashboardKeys.all, 'pm-jobs', filter] as const,
  leaseExpirations: (filter?: LeaseExpirationsFilter) => [...dashboardKeys.all, 'lease-expirations', filter] as const,
  alerts: (propertyId?: string) => [...dashboardKeys.all, 'alerts', propertyId] as const,
  propertyComparison: (filter?: PropertyComparisonFilter) => [...dashboardKeys.all, 'property-comparison', filter] as const
};

// Cache configuration
// AC-20: 2-minute staleTime for React Query
const DASHBOARD_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const DASHBOARD_GC_TIME = 10 * 60 * 1000;   // 10 minutes

// ============================================================================
// EXECUTIVE DASHBOARD HOOK (AC-11)
// ============================================================================

/**
 * Hook to fetch complete executive dashboard data
 *
 * @param filter - Optional filter parameters (propertyId, startDate, endDate)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with complete dashboard data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useExecutiveDashboard();
 *
 * if (isLoading) return <DashboardSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <Dashboard
 *     kpis={data.kpis}
 *     maintenanceQueue={data.priorityMaintenanceQueue}
 *     pmJobs={data.upcomingPmJobs}
 *   />
 * );
 * ```
 */
export function useExecutiveDashboard(filter?: DashboardFilter, enabled: boolean = true) {
  return useQuery<ExecutiveDashboard>({
    queryKey: dashboardKeys.executive(filter),
    queryFn: () => getExecutiveDashboard(filter),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false // Dashboard data doesn't need aggressive refetching
  });
}

// ============================================================================
// KPI CARDS HOOK (AC-12)
// ============================================================================

/**
 * Hook to fetch KPI cards data
 *
 * @param filter - Optional filter parameters (propertyId, startDate, endDate)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with KPI cards data
 *
 * @example
 * ```typescript
 * const { data: kpis, isLoading } = useKpiCards();
 *
 * return (
 *   <div className="grid grid-cols-4 gap-4">
 *     <KpiCard
 *       title="Net Profit/Loss"
 *       value={kpis.netProfitLoss.formattedValue}
 *       trend={kpis.netProfitLoss.trend}
 *       changePercent={kpis.netProfitLoss.changePercentage}
 *     />
 *   </div>
 * );
 * ```
 */
export function useKpiCards(filter?: DashboardFilter, enabled: boolean = true) {
  return useQuery<KpiCards>({
    queryKey: dashboardKeys.kpis(filter),
    queryFn: () => getKpiCards(filter),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// MAINTENANCE QUEUE HOOK (AC-13)
// ============================================================================

/**
 * Hook to fetch priority maintenance queue
 *
 * @param filter - Optional filter parameters (propertyId, limit)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with maintenance queue items
 *
 * @example
 * ```typescript
 * const { data: queue, isLoading } = useMaintenanceQueue({ limit: 5 });
 *
 * return (
 *   <MaintenanceQueueCard items={queue} isLoading={isLoading} />
 * );
 * ```
 */
export function useMaintenanceQueue(filter?: MaintenanceQueueFilter, enabled: boolean = true) {
  return useQuery<MaintenanceQueueItem[]>({
    queryKey: dashboardKeys.maintenanceQueue(filter),
    queryFn: () => getMaintenanceQueue(filter),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// PM JOBS CHART HOOK (AC-14)
// ============================================================================

/**
 * Hook to fetch upcoming PM jobs by category
 *
 * @param filter - Optional filter parameters (propertyId, days)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with PM job chart data
 *
 * @example
 * ```typescript
 * const { data: pmJobs, isLoading } = useUpcomingPmJobs({ days: 30 });
 *
 * return (
 *   <PmJobsChart data={pmJobs} isLoading={isLoading} />
 * );
 * ```
 */
export function useUpcomingPmJobs(filter?: PmJobsFilter, enabled: boolean = true) {
  return useQuery<PmJobChartData[]>({
    queryKey: dashboardKeys.pmJobs(filter),
    queryFn: () => getUpcomingPmJobs(filter),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// LEASE EXPIRATIONS HOOK (AC-15)
// ============================================================================

/**
 * Hook to fetch lease expiration timeline
 *
 * @param filter - Optional filter parameters (propertyId, months)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with lease expiration timeline data
 *
 * @example
 * ```typescript
 * const { data: expirations, isLoading } = useLeaseExpirations({ months: 12 });
 *
 * return (
 *   <LeaseExpirationTimeline data={expirations} isLoading={isLoading} />
 * );
 * ```
 */
export function useLeaseExpirations(filter?: LeaseExpirationsFilter, enabled: boolean = true) {
  return useQuery<LeaseExpirationTimeline[]>({
    queryKey: dashboardKeys.leaseExpirations(filter),
    queryFn: () => getLeaseExpirations(filter),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// CRITICAL ALERTS HOOK (AC-16)
// ============================================================================

/**
 * Hook to fetch critical alerts
 *
 * @param propertyId - Optional property filter
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with alert data
 *
 * @example
 * ```typescript
 * const { data: alerts, isLoading } = useCriticalAlerts();
 *
 * return (
 *   <AlertsPanel alerts={alerts} isLoading={isLoading} />
 * );
 * ```
 */
export function useCriticalAlerts(propertyId?: string, enabled: boolean = true) {
  return useQuery<Alert[]>({
    queryKey: dashboardKeys.alerts(propertyId),
    queryFn: () => getCriticalAlerts(propertyId),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}

// ============================================================================
// PROPERTY COMPARISON HOOK (AC-17)
// ============================================================================

/**
 * Hook to fetch property performance comparison
 *
 * @param filter - Optional filter parameters (startDate, endDate)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with property comparison data
 *
 * @example
 * ```typescript
 * const { data: properties, isLoading } = usePropertyComparison();
 *
 * return (
 *   <PropertyComparisonTable
 *     properties={properties}
 *     isLoading={isLoading}
 *     onSort={(column) => handleSort(column)}
 *   />
 * );
 * ```
 */
export function usePropertyComparison(filter?: PropertyComparisonFilter, enabled: boolean = true) {
  return useQuery<PropertyComparison[]>({
    queryKey: dashboardKeys.propertyComparison(filter),
    queryFn: () => getPropertyComparison(filter),
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    enabled,
    refetchOnWindowFocus: false
  });
}
