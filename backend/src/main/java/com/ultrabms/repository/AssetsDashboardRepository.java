package com.ultrabms.repository;

import java.util.List;

/**
 * Repository interface for Assets Dashboard data retrieval.
 * Uses native SQL queries for optimized aggregations.
 *
 * Story 8.7: Assets Dashboard
 */
public interface AssetsDashboardRepository {

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    /**
     * Count all registered assets (not deleted)
     * AC-1: Total Registered Assets
     *
     * @return Count of all assets
     */
    Long countTotalRegisteredAssets();

    /**
     * Sum of all asset purchase costs
     * AC-2: Total Asset Value
     *
     * @return Sum in AED
     */
    Double sumTotalAssetValue();

    /**
     * Count assets with overdue preventive maintenance
     * AC-3: Assets with Overdue PM
     * Overdue = next_maintenance_date < today
     *
     * @return Count of assets with overdue PM
     */
    Long countAssetsWithOverduePm();

    /**
     * Get asset with highest Total Cost of Ownership
     * AC-4: Most Expensive Asset (TCO)
     * TCO = purchase_cost + SUM(work_order.actual_cost where asset_id matches)
     *
     * @return Object[] with [asset_id, asset_name, asset_number, tco]
     */
    Object[] getMostExpensiveAssetByTco();

    // =================================================================
    // CHART DATA QUERIES (AC-5 to AC-6)
    // =================================================================

    /**
     * Get asset counts grouped by category
     * AC-5: Assets by Category donut chart
     *
     * @return List of Object[] with [category, display_name, count, percentage]
     */
    List<Object[]> getAssetsByCategory();

    /**
     * Get top 5 assets by maintenance spend
     * AC-6: Top 5 Assets by Maintenance Spend bar chart
     *
     * @param limit Number of assets to return (default 5)
     * @return List of Object[] with [asset_id, asset_name, asset_number, category, category_display_name, maintenance_cost]
     */
    List<Object[]> getTopMaintenanceSpend(int limit);

    // =================================================================
    // TABLE QUERIES (AC-7 to AC-8)
    // =================================================================

    /**
     * Get assets with overdue preventive maintenance
     * AC-7: Overdue PM table
     *
     * @param limit Maximum number of records to return
     * @return List of Object[] with [asset_id, asset_name, asset_number, category, category_display_name,
     *         property_id, property_name, last_maintenance_date, next_maintenance_date, days_overdue]
     */
    List<Object[]> getOverduePmAssets(int limit);

    /**
     * Get recently added assets
     * AC-8: Recently Added Assets table
     *
     * @param limit Maximum number of records to return (default 5)
     * @return List of Object[] with [asset_id, asset_name, asset_number, category, category_display_name,
     *         property_id, property_name, created_at, purchase_cost]
     */
    List<Object[]> getRecentlyAddedAssets(int limit);

    // =================================================================
    // DEPRECIATION QUERY (AC-9)
    // =================================================================

    /**
     * Get depreciation summary data
     * AC-9: Depreciation Summary card
     * Uses straight-line depreciation: current_value = original_value - (years_in_service * annual_depreciation)
     * annual_depreciation = original_value / estimated_useful_life
     *
     * @return Object[] with [original_value_total, current_value_total, total_depreciation,
     *         depreciation_percentage, total_depreciable_assets, fully_depreciated_assets]
     */
    Object[] getDepreciationSummary();
}
