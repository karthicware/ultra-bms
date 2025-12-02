package com.ultrabms.service;

import com.ultrabms.dto.dashboard.assets.AssetKpiDto;
import com.ultrabms.dto.dashboard.assets.AssetsByCategoryDto;
import com.ultrabms.dto.dashboard.assets.AssetsDashboardDto;
import com.ultrabms.dto.dashboard.assets.DepreciationSummaryDto;
import com.ultrabms.dto.dashboard.assets.OverduePmAssetDto;
import com.ultrabms.dto.dashboard.assets.RecentAssetDto;
import com.ultrabms.dto.dashboard.assets.TopMaintenanceSpendDto;

import java.util.List;

/**
 * Service interface for Assets Dashboard operations.
 *
 * Story 8.7: Assets Dashboard
 */
public interface AssetsDashboardService {

    /**
     * Get complete assets dashboard data (AC-10)
     * Aggregates all dashboard sections: KPIs, charts, and tables
     *
     * @return AssetsDashboardDto with all sections
     */
    AssetsDashboardDto getAssetsDashboard();

    /**
     * Get KPI cards data (AC-1 through AC-4)
     *
     * @return AssetKpiDto with all KPIs
     */
    AssetKpiDto getKpis();

    /**
     * Get assets by category for donut chart (AC-5, AC-11)
     *
     * @return List of assets grouped by category with counts and percentages
     */
    List<AssetsByCategoryDto> getAssetsByCategory();

    /**
     * Get top assets by maintenance spend for bar chart (AC-6, AC-12)
     *
     * @return List of top 5 assets by maintenance cost
     */
    List<TopMaintenanceSpendDto> getTopMaintenanceSpend();

    /**
     * Get overdue PM assets list (AC-7, AC-13)
     *
     * @return List of assets with overdue preventive maintenance
     */
    List<OverduePmAssetDto> getOverduePmAssets();

    /**
     * Get recently added assets list (AC-8, AC-14)
     *
     * @return List of last 5 recently added assets
     */
    List<RecentAssetDto> getRecentlyAddedAssets();

    /**
     * Get depreciation summary data (AC-9, AC-15)
     *
     * @return DepreciationSummaryDto with depreciation totals
     */
    DepreciationSummaryDto getDepreciationSummary();
}
