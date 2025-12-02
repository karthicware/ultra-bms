/**
 * Zod validation schemas for Assets Dashboard
 * Story 8.7: Assets Dashboard
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const assetCategorySchema = z.enum([
  'HVAC',
  'ELEVATOR',
  'GENERATOR',
  'WATER_PUMP',
  'FIRE_SYSTEM',
  'SECURITY_SYSTEM',
  'ELECTRICAL_PANEL',
  'PLUMBING_FIXTURE',
  'APPLIANCE',
  'OTHER'
]);

// ============================================================================
// KPI SCHEMAS (AC-1 to AC-4)
// ============================================================================

export const mostExpensiveAssetKpiSchema = z.object({
  assetId: z.string().uuid(),
  assetName: z.string(),
  assetNumber: z.string(),
  tco: z.number().min(0)
});

export const assetKpiSchema = z.object({
  totalRegisteredAssets: z.number().int().min(0),
  totalAssetValue: z.number().min(0),
  assetsWithOverduePm: z.number().int().min(0),
  mostExpensiveAsset: mostExpensiveAssetKpiSchema.nullable()
});

// ============================================================================
// CHART DATA SCHEMAS (AC-5, AC-6)
// ============================================================================

export const assetsByCategorySchema = z.object({
  category: assetCategorySchema,
  categoryDisplayName: z.string(),
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100)
});

export const topMaintenanceSpendSchema = z.object({
  assetId: z.string().uuid(),
  assetName: z.string(),
  assetNumber: z.string(),
  category: assetCategorySchema,
  categoryDisplayName: z.string(),
  maintenanceCost: z.number().min(0)
});

// ============================================================================
// TABLE DATA SCHEMAS (AC-7, AC-8)
// ============================================================================

export const overduePmAssetSchema = z.object({
  assetId: z.string().uuid(),
  assetName: z.string(),
  assetNumber: z.string(),
  category: assetCategorySchema,
  categoryDisplayName: z.string(),
  propertyId: z.string().uuid(),
  propertyName: z.string(),
  lastPmDate: z.string().nullable(),
  nextPmDate: z.string(),
  daysOverdue: z.number().int().min(0),
  isCritical: z.boolean()
});

export const recentAssetSchema = z.object({
  assetId: z.string().uuid(),
  assetName: z.string(),
  assetNumber: z.string(),
  category: assetCategorySchema,
  categoryDisplayName: z.string(),
  propertyId: z.string().uuid(),
  propertyName: z.string(),
  addedDate: z.string(),
  value: z.number().min(0)
});

// ============================================================================
// DEPRECIATION SCHEMA (AC-9)
// ============================================================================

export const depreciationSummarySchema = z.object({
  originalValueTotal: z.number().min(0),
  currentValueTotal: z.number().min(0),
  totalDepreciation: z.number().min(0),
  depreciationPercentage: z.number().min(0).max(100),
  totalDepreciableAssets: z.number().int().min(0),
  fullyDepreciatedAssets: z.number().int().min(0)
});

// ============================================================================
// COMPLETE DASHBOARD SCHEMA (AC-10)
// ============================================================================

export const assetsDashboardSchema = z.object({
  kpis: assetKpiSchema,
  assetsByCategory: z.array(assetsByCategorySchema),
  topMaintenanceSpend: z.array(topMaintenanceSpendSchema),
  overduePmAssets: z.array(overduePmAssetSchema),
  recentlyAddedAssets: z.array(recentAssetSchema),
  depreciationSummary: depreciationSummarySchema
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const assetsDashboardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: assetsDashboardSchema,
  timestamp: z.string()
});

export const assetKpiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: assetKpiSchema,
  timestamp: z.string()
});

export const assetsByCategoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(assetsByCategorySchema),
  timestamp: z.string()
});

export const topMaintenanceSpendResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(topMaintenanceSpendSchema),
  timestamp: z.string()
});

export const overduePmAssetsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(overduePmAssetSchema),
  timestamp: z.string()
});

export const recentAssetsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(recentAssetSchema),
  timestamp: z.string()
});

export const depreciationSummaryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: depreciationSummarySchema,
  timestamp: z.string()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AssetCategorySchemaType = z.infer<typeof assetCategorySchema>;
export type MostExpensiveAssetKpiSchemaType = z.infer<typeof mostExpensiveAssetKpiSchema>;
export type AssetKpiSchemaType = z.infer<typeof assetKpiSchema>;
export type AssetsByCategorySchemaType = z.infer<typeof assetsByCategorySchema>;
export type TopMaintenanceSpendSchemaType = z.infer<typeof topMaintenanceSpendSchema>;
export type OverduePmAssetSchemaType = z.infer<typeof overduePmAssetSchema>;
export type RecentAssetSchemaType = z.infer<typeof recentAssetSchema>;
export type DepreciationSummarySchemaType = z.infer<typeof depreciationSummarySchema>;
export type AssetsDashboardSchemaType = z.infer<typeof assetsDashboardSchema>;
