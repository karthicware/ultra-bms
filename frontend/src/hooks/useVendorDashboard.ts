/**
 * React Query hooks for Vendor Dashboard
 * Story 8.5: Vendor Dashboard
 *
 * Provides data fetching hooks with auto-refresh for vendor dashboard.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  fetchVendorDashboard,
  fetchVendorKpis,
  fetchJobsBySpecialization,
  fetchPerformanceSnapshot,
  fetchExpiringDocuments,
  fetchTopVendors,
} from '@/services/vendor-dashboard.service';
import type {
  VendorDashboard,
  VendorKpi,
  JobsBySpecialization,
  VendorPerformanceSnapshot,
  ExpiringDocument,
  TopVendor,
  ExpiringDocumentsParams,
  TopVendorsParams,
} from '@/types/vendor-dashboard';

// Query key factory for type-safe query keys
export const vendorDashboardKeys = {
  all: ['vendorDashboard'] as const,
  dashboard: () => [...vendorDashboardKeys.all, 'dashboard'] as const,
  kpis: () => [...vendorDashboardKeys.all, 'kpis'] as const,
  jobsBySpecialization: () => [...vendorDashboardKeys.all, 'jobsBySpecialization'] as const,
  performanceSnapshot: () => [...vendorDashboardKeys.all, 'performanceSnapshot'] as const,
  expiringDocuments: (params?: ExpiringDocumentsParams) =>
    [...vendorDashboardKeys.all, 'expiringDocuments', params ?? {}] as const,
  topVendors: (params?: TopVendorsParams) =>
    [...vendorDashboardKeys.all, 'topVendors', params ?? {}] as const,
};

// Default stale time: 2 minutes (backend has 5-minute cache)
const DEFAULT_STALE_TIME = 2 * 60 * 1000;

/**
 * Hook for complete vendor dashboard data (AC-9)
 */
export function useVendorDashboard(
  options?: Omit<UseQueryOptions<VendorDashboard, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vendorDashboardKeys.dashboard(),
    queryFn: fetchVendorDashboard,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for vendor KPIs only (AC-1 to AC-4)
 */
export function useVendorKpis(
  options?: Omit<UseQueryOptions<VendorKpi, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vendorDashboardKeys.kpis(),
    queryFn: fetchVendorKpis,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for jobs by specialization bar chart (AC-5, AC-10)
 */
export function useJobsBySpecialization(
  options?: Omit<UseQueryOptions<JobsBySpecialization[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vendorDashboardKeys.jobsBySpecialization(),
    queryFn: fetchJobsBySpecialization,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for vendor performance scatter plot (AC-6, AC-11)
 */
export function usePerformanceSnapshot(
  options?: Omit<UseQueryOptions<VendorPerformanceSnapshot[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vendorDashboardKeys.performanceSnapshot(),
    queryFn: fetchPerformanceSnapshot,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for expiring documents list (AC-7, AC-12)
 */
export function useExpiringDocuments(
  params?: ExpiringDocumentsParams,
  options?: Omit<UseQueryOptions<ExpiringDocument[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vendorDashboardKeys.expiringDocuments(params),
    queryFn: () => fetchExpiringDocuments(params),
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for top vendors by jobs (AC-8, AC-13)
 */
export function useTopVendors(
  params?: TopVendorsParams,
  options?: Omit<UseQueryOptions<TopVendor[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: vendorDashboardKeys.topVendors(params),
    queryFn: () => fetchTopVendors(params),
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

// Export all hooks as a named collection
export const vendorDashboardHooks = {
  useVendorDashboard,
  useVendorKpis,
  useJobsBySpecialization,
  usePerformanceSnapshot,
  useExpiringDocuments,
  useTopVendors,
};
