/**
 * React Query hooks for Assets Dashboard
 * Story 8.7: Assets Dashboard
 *
 * Provides data fetching hooks with auto-refresh for assets dashboard.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  fetchAssetsDashboard,
  fetchAssetKpis,
  fetchAssetsByCategory,
  fetchTopMaintenanceSpend,
  fetchOverduePmAssets,
  fetchRecentlyAddedAssets,
  fetchDepreciationSummary,
} from '@/services/assets-dashboard.service';
import type {
  AssetsDashboard,
  AssetKpi,
  AssetsByCategory,
  TopMaintenanceSpend,
  OverduePmAsset,
  RecentAsset,
  DepreciationSummary,
} from '@/types/assets-dashboard';

// Query key factory for type-safe query keys
export const assetsDashboardKeys = {
  all: ['assetsDashboard'] as const,
  dashboard: () => [...assetsDashboardKeys.all, 'dashboard'] as const,
  kpis: () => [...assetsDashboardKeys.all, 'kpis'] as const,
  byCategory: () => [...assetsDashboardKeys.all, 'byCategory'] as const,
  topMaintenanceSpend: () => [...assetsDashboardKeys.all, 'topMaintenanceSpend'] as const,
  overduePm: () => [...assetsDashboardKeys.all, 'overduePm'] as const,
  recentlyAdded: () => [...assetsDashboardKeys.all, 'recentlyAdded'] as const,
  depreciationSummary: () => [...assetsDashboardKeys.all, 'depreciationSummary'] as const,
};

// Default stale time: 2 minutes (backend has 5-minute cache per AC-18)
const DEFAULT_STALE_TIME = 2 * 60 * 1000;

/**
 * Hook for complete assets dashboard data (AC-10)
 */
export function useAssetsDashboard(
  options?: Omit<UseQueryOptions<AssetsDashboard, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.dashboard(),
    queryFn: fetchAssetsDashboard,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for assets KPIs only (AC-1 to AC-4)
 */
export function useAssetKpis(
  options?: Omit<UseQueryOptions<AssetKpi, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.kpis(),
    queryFn: fetchAssetKpis,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for assets by category donut chart (AC-5, AC-11)
 */
export function useAssetsByCategory(
  options?: Omit<UseQueryOptions<AssetsByCategory[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.byCategory(),
    queryFn: fetchAssetsByCategory,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for top maintenance spend bar chart (AC-6, AC-12)
 */
export function useTopMaintenanceSpend(
  options?: Omit<UseQueryOptions<TopMaintenanceSpend[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.topMaintenanceSpend(),
    queryFn: fetchTopMaintenanceSpend,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for overdue PM assets table (AC-7, AC-13)
 */
export function useOverduePmAssets(
  options?: Omit<UseQueryOptions<OverduePmAsset[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.overduePm(),
    queryFn: fetchOverduePmAssets,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for recently added assets table (AC-8, AC-14)
 */
export function useRecentlyAddedAssets(
  options?: Omit<UseQueryOptions<RecentAsset[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.recentlyAdded(),
    queryFn: fetchRecentlyAddedAssets,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for depreciation summary card (AC-9, AC-15)
 */
export function useDepreciationSummary(
  options?: Omit<UseQueryOptions<DepreciationSummary, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: assetsDashboardKeys.depreciationSummary(),
    queryFn: fetchDepreciationSummary,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

// Export all hooks as a named collection
export const assetsDashboardHooks = {
  useAssetsDashboard,
  useAssetKpis,
  useAssetsByCategory,
  useTopMaintenanceSpend,
  useOverduePmAssets,
  useRecentlyAddedAssets,
  useDepreciationSummary,
};
