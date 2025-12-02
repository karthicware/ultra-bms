package com.ultrabms.dto.dashboard.assets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Complete DTO for Assets Dashboard (AC-10)
 *
 * Story 8.7: Assets Dashboard
 *
 * Contains all dashboard sections:
 * - KPI cards (AC-1 through AC-4)
 * - Assets by Category donut chart (AC-5)
 * - Top 5 Assets by Maintenance Spend bar chart (AC-6)
 * - Overdue PM list (AC-7)
 * - Recently Added Assets list (AC-8)
 * - Depreciation Summary card (AC-9)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetsDashboardDto {

    /**
     * KPI cards section (AC-1 through AC-4)
     */
    private AssetKpiDto kpis;

    /**
     * Assets by Category donut chart data (AC-5)
     */
    private List<AssetsByCategoryDto> assetsByCategory;

    /**
     * Top 5 Assets by Maintenance Spend bar chart data (AC-6)
     */
    private List<TopMaintenanceSpendDto> topMaintenanceSpend;

    /**
     * Overdue Preventive Maintenance table data (AC-7)
     */
    private List<OverduePmAssetDto> overduePmAssets;

    /**
     * Recently Added Assets table data (AC-8)
     */
    private List<RecentAssetDto> recentlyAddedAssets;

    /**
     * Asset Depreciation Summary card data (AC-9)
     */
    private DepreciationSummaryDto depreciationSummary;
}
