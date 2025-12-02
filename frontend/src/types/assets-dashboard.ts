/**
 * Assets Dashboard Types and Interfaces
 * Story 8.7: Assets Dashboard
 */

import { AssetCategory } from './asset';

// ============================================================================
// KPI INTERFACES (AC-1 to AC-4)
// ============================================================================

/**
 * Most expensive asset by TCO details for KPI card (AC-4)
 * TCO = purchase_cost + SUM(maintenance_costs)
 */
export interface MostExpensiveAssetKpi {
  assetId: string;
  assetName: string;
  assetNumber: string;
  /** Total Cost of Ownership in AED */
  tco: number;
}

/**
 * Assets Dashboard KPIs (AC-1 to AC-4)
 */
export interface AssetKpi {
  /** AC-1: Total Registered Assets count */
  totalRegisteredAssets: number;
  /** AC-2: Total Asset Value in AED */
  totalAssetValue: number;
  /** AC-3: Assets with Overdue PM count */
  assetsWithOverduePm: number;
  /** AC-4: Most Expensive Asset by TCO */
  mostExpensiveAsset: MostExpensiveAssetKpi | null;
}

// ============================================================================
// CHART DATA INTERFACES (AC-5, AC-6)
// ============================================================================

/**
 * Assets by Category donut chart data (AC-5)
 */
export interface AssetsByCategory {
  category: AssetCategory;
  categoryDisplayName: string;
  count: number;
  percentage: number;
}

/**
 * Top Assets by Maintenance Spend bar chart data (AC-6)
 */
export interface TopMaintenanceSpend {
  assetId: string;
  assetName: string;
  assetNumber: string;
  category: AssetCategory;
  categoryDisplayName: string;
  /** Total maintenance cost in AED */
  maintenanceCost: number;
}

// ============================================================================
// TABLE DATA INTERFACES (AC-7, AC-8)
// ============================================================================

/**
 * Overdue PM Asset table row (AC-7)
 */
export interface OverduePmAsset {
  assetId: string;
  assetName: string;
  assetNumber: string;
  category: AssetCategory;
  categoryDisplayName: string;
  propertyId: string;
  propertyName: string;
  lastPmDate: string | null;
  nextPmDate: string;
  daysOverdue: number;
  /** True if > 30 days overdue - should be highlighted red */
  isCritical: boolean;
}

/**
 * Recently Added Asset table row (AC-8)
 */
export interface RecentAsset {
  assetId: string;
  assetName: string;
  assetNumber: string;
  category: AssetCategory;
  categoryDisplayName: string;
  propertyId: string;
  propertyName: string;
  addedDate: string;
  /** Purchase value in AED */
  value: number;
}

// ============================================================================
// DEPRECIATION INTERFACE (AC-9)
// ============================================================================

/**
 * Asset Depreciation Summary card data (AC-9)
 * Uses straight-line depreciation method:
 * annual_depreciation = original_value / estimated_useful_life
 * current_value = original_value - (years_in_service * annual_depreciation)
 */
export interface DepreciationSummary {
  /** Sum of all asset original purchase costs in AED */
  originalValueTotal: number;
  /** Sum of all asset current depreciated values in AED */
  currentValueTotal: number;
  /** Total depreciation in AED (originalValueTotal - currentValueTotal) */
  totalDepreciation: number;
  /** Depreciation as percentage of original value */
  depreciationPercentage: number;
  /** Count of assets with purchase cost and useful life data */
  totalDepreciableAssets: number;
  /** Count of assets where current value <= 0 */
  fullyDepreciatedAssets: number;
}

// ============================================================================
// COMPLETE DASHBOARD INTERFACE (AC-10)
// ============================================================================

/**
 * Complete Assets Dashboard data (AC-10)
 * Aggregates all dashboard sections
 */
export interface AssetsDashboard {
  /** KPI cards section (AC-1 to AC-4) */
  kpis: AssetKpi;
  /** Assets by Category donut chart data (AC-5) */
  assetsByCategory: AssetsByCategory[];
  /** Top 5 Assets by Maintenance Spend bar chart data (AC-6) */
  topMaintenanceSpend: TopMaintenanceSpend[];
  /** Overdue PM Assets table data (AC-7) */
  overduePmAssets: OverduePmAsset[];
  /** Recently Added Assets table data (AC-8) */
  recentlyAddedAssets: RecentAsset[];
  /** Depreciation Summary card data (AC-9) */
  depreciationSummary: DepreciationSummary;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response from assets dashboard endpoint
 */
export interface AssetsDashboardResponse {
  success: boolean;
  message: string;
  data: AssetsDashboard;
  timestamp: string;
}

/**
 * Response from assets KPIs endpoint
 */
export interface AssetKpiResponse {
  success: boolean;
  message: string;
  data: AssetKpi;
  timestamp: string;
}

/**
 * Response from assets by category endpoint
 */
export interface AssetsByCategoryResponse {
  success: boolean;
  message: string;
  data: AssetsByCategory[];
  timestamp: string;
}

/**
 * Response from top maintenance spend endpoint
 */
export interface TopMaintenanceSpendResponse {
  success: boolean;
  message: string;
  data: TopMaintenanceSpend[];
  timestamp: string;
}

/**
 * Response from overdue PM assets endpoint
 */
export interface OverduePmAssetsResponse {
  success: boolean;
  message: string;
  data: OverduePmAsset[];
  timestamp: string;
}

/**
 * Response from recently added assets endpoint
 */
export interface RecentAssetsResponse {
  success: boolean;
  message: string;
  data: RecentAsset[];
  timestamp: string;
}

/**
 * Response from depreciation summary endpoint
 */
export interface DepreciationSummaryResponse {
  success: boolean;
  message: string;
  data: DepreciationSummary;
  timestamp: string;
}

// ============================================================================
// CHART COLOR MAPPING
// ============================================================================

/**
 * Chart colors for assets by category donut
 * Maps to category display
 */
export const ASSET_CATEGORY_CHART_COLORS: Record<AssetCategory, string> = {
  [AssetCategory.HVAC]: '#3b82f6',           // blue-500
  [AssetCategory.ELEVATOR]: '#8b5cf6',       // purple-500
  [AssetCategory.GENERATOR]: '#f97316',      // orange-500
  [AssetCategory.WATER_PUMP]: '#06b6d4',     // cyan-500
  [AssetCategory.FIRE_SYSTEM]: '#ef4444',    // red-500
  [AssetCategory.SECURITY_SYSTEM]: '#22c55e', // green-500
  [AssetCategory.ELECTRICAL_PANEL]: '#eab308', // yellow-500
  [AssetCategory.PLUMBING_FIXTURE]: '#6366f1', // indigo-500
  [AssetCategory.APPLIANCE]: '#ec4899',      // pink-500
  [AssetCategory.OTHER]: '#6b7280'           // gray-500
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency as AED (AC-21)
 */
export function formatAssetDashboardCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return 'AED 0.00';
  }
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format large currency values compactly (e.g., AED 1.5M)
 */
export function formatCompactCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return 'AED 0';
  }
  if (amount >= 1000000) {
    return `AED ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `AED ${(amount / 1000).toFixed(1)}K`;
  }
  return formatAssetDashboardCurrency(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Get status class for overdue days
 * > 30 days = critical (red)
 * <= 30 days = warning (amber)
 */
export function getOverdueSeverityClass(daysOverdue: number): string {
  if (daysOverdue > 30) {
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  }
  return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
}

/**
 * Get status badge class for overdue severity
 */
export function getOverdueBadgeClass(isCritical: boolean): string {
  if (isCritical) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
}

/**
 * Get chart color for category
 */
export function getCategoryChartColor(category: AssetCategory): string {
  return ASSET_CATEGORY_CHART_COLORS[category] || ASSET_CATEGORY_CHART_COLORS[AssetCategory.OTHER];
}

/**
 * Format date for display in tables
 */
export function formatDashboardDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return '-';
  }
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

/**
 * Format datetime for display
 */
export function formatDashboardDateTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return '-';
  }
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}
