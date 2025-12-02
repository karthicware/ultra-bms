/**
 * Assets Dashboard API Service
 * Story 8.7: Assets Dashboard
 *
 * Provides API client methods for assets dashboard endpoints.
 */

import { apiClient } from '@/lib/api';
import {
  assetsDashboardSchema,
  assetKpiSchema,
  assetsByCategorySchema,
  topMaintenanceSpendSchema,
  overduePmAssetSchema,
  recentAssetSchema,
  depreciationSummarySchema,
} from '@/lib/validations/assets-dashboard';
import type {
  AssetsDashboard,
  AssetKpi,
  AssetsByCategory,
  TopMaintenanceSpend,
  OverduePmAsset,
  RecentAsset,
  DepreciationSummary,
} from '@/types/assets-dashboard';
import { z } from 'zod';

const BASE_URL = '/api/v1/dashboard/assets';

/**
 * Fetch complete assets dashboard data (AC-10)
 * GET /api/v1/dashboard/assets
 */
export async function fetchAssetsDashboard(): Promise<AssetsDashboard> {
  const response = await apiClient.get<AssetsDashboard>(BASE_URL);
  return assetsDashboardSchema.parse(response.data) as AssetsDashboard;
}

/**
 * Fetch assets KPIs only (AC-1 to AC-4)
 * GET /api/v1/dashboard/assets (uses KPIs from full response)
 */
export async function fetchAssetKpis(): Promise<AssetKpi> {
  const response = await apiClient.get<AssetsDashboard>(BASE_URL);
  const dashboard = assetsDashboardSchema.parse(response.data);
  return dashboard.kpis as AssetKpi;
}

/**
 * Fetch assets by category for donut chart (AC-5, AC-11)
 * GET /api/v1/dashboard/assets/by-category
 */
export async function fetchAssetsByCategory(): Promise<AssetsByCategory[]> {
  const response = await apiClient.get<AssetsByCategory[]>(`${BASE_URL}/by-category`);
  return z.array(assetsByCategorySchema).parse(response.data) as AssetsByCategory[];
}

/**
 * Fetch top 5 assets by maintenance spend for bar chart (AC-6, AC-12)
 * GET /api/v1/dashboard/assets/top-maintenance-spend
 */
export async function fetchTopMaintenanceSpend(): Promise<TopMaintenanceSpend[]> {
  const response = await apiClient.get<TopMaintenanceSpend[]>(`${BASE_URL}/top-maintenance-spend`);
  return z.array(topMaintenanceSpendSchema).parse(response.data) as TopMaintenanceSpend[];
}

/**
 * Fetch assets with overdue PM (AC-7, AC-13)
 * GET /api/v1/dashboard/assets/overdue-pm
 */
export async function fetchOverduePmAssets(): Promise<OverduePmAsset[]> {
  const response = await apiClient.get<OverduePmAsset[]>(`${BASE_URL}/overdue-pm`);
  return z.array(overduePmAssetSchema).parse(response.data) as OverduePmAsset[];
}

/**
 * Fetch recently added assets (AC-8, AC-14)
 * GET /api/v1/dashboard/assets/recently-added
 */
export async function fetchRecentlyAddedAssets(): Promise<RecentAsset[]> {
  const response = await apiClient.get<RecentAsset[]>(`${BASE_URL}/recently-added`);
  return z.array(recentAssetSchema).parse(response.data) as RecentAsset[];
}

/**
 * Fetch depreciation summary (AC-9, AC-15)
 * GET /api/v1/dashboard/assets/depreciation-summary
 */
export async function fetchDepreciationSummary(): Promise<DepreciationSummary> {
  const response = await apiClient.get<DepreciationSummary>(`${BASE_URL}/depreciation-summary`);
  return depreciationSummarySchema.parse(response.data) as DepreciationSummary;
}

// Export all functions as a service object for convenient importing
export const assetsDashboardService = {
  fetchAssetsDashboard,
  fetchAssetKpis,
  fetchAssetsByCategory,
  fetchTopMaintenanceSpend,
  fetchOverduePmAssets,
  fetchRecentlyAddedAssets,
  fetchDepreciationSummary,
};

export default assetsDashboardService;
