package com.ultrabms.repository.impl;

import com.ultrabms.repository.AssetsDashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Implementation of AssetsDashboardRepository using native SQL queries for optimized aggregations.
 * All queries use database-level aggregation for performance.
 *
 * Story 8.7: Assets Dashboard
 */
@Repository
public class AssetsDashboardRepositoryImpl implements AssetsDashboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    @Override
    public Long countTotalRegisteredAssets() {
        String sql = """
            SELECT COUNT(*)
            FROM assets a
            WHERE a.is_deleted = false
            """;

        Query query = entityManager.createNativeQuery(sql);
        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Double sumTotalAssetValue() {
        String sql = """
            SELECT COALESCE(SUM(a.purchase_cost), 0)
            FROM assets a
            WHERE a.is_deleted = false
            """;

        Query query = entityManager.createNativeQuery(sql);
        Object result = query.getSingleResult();
        return result != null ? ((Number) result).doubleValue() : 0.0;
    }

    @Override
    public Long countAssetsWithOverduePm() {
        String sql = """
            SELECT COUNT(*)
            FROM assets a
            WHERE a.is_deleted = false
            AND a.status = 'ACTIVE'
            AND a.next_maintenance_date IS NOT NULL
            AND a.next_maintenance_date < CURRENT_DATE
            """;

        Query query = entityManager.createNativeQuery(sql);
        Object result = query.getSingleResult();
        return result != null ? ((Number) result).longValue() : 0L;
    }

    @Override
    public Object[] getMostExpensiveAssetByTco() {
        // TCO = purchase_cost + SUM(work_order.actual_cost)
        String sql = """
            SELECT
                a.id as asset_id,
                a.asset_name,
                a.asset_number,
                COALESCE(a.purchase_cost, 0) + COALESCE(wo_costs.total_maintenance_cost, 0) as tco
            FROM assets a
            LEFT JOIN (
                SELECT
                    wo.asset_id,
                    SUM(COALESCE(wo.actual_cost, 0)) as total_maintenance_cost
                FROM work_orders wo
                WHERE wo.asset_id IS NOT NULL
                AND wo.status IN ('COMPLETED', 'CLOSED')
                GROUP BY wo.asset_id
            ) wo_costs ON a.id = wo_costs.asset_id
            WHERE a.is_deleted = false
            ORDER BY tco DESC
            LIMIT 1
            """;

        Query query = entityManager.createNativeQuery(sql);
        try {
            return (Object[]) query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    // =================================================================
    // CHART DATA QUERIES (AC-5 to AC-6)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getAssetsByCategory() {
        String sql = """
            WITH total_count AS (
                SELECT COUNT(*) as total FROM assets WHERE is_deleted = false
            )
            SELECT
                a.category,
                CASE a.category
                    WHEN 'HVAC' THEN 'HVAC'
                    WHEN 'ELEVATOR' THEN 'Elevator'
                    WHEN 'GENERATOR' THEN 'Generator'
                    WHEN 'WATER_PUMP' THEN 'Water Pump'
                    WHEN 'FIRE_SYSTEM' THEN 'Fire System'
                    WHEN 'SECURITY_SYSTEM' THEN 'Security System'
                    WHEN 'ELECTRICAL_PANEL' THEN 'Electrical Panel'
                    WHEN 'PLUMBING_FIXTURE' THEN 'Plumbing Fixture'
                    WHEN 'APPLIANCE' THEN 'Appliance'
                    WHEN 'OTHER' THEN 'Other'
                    ELSE INITCAP(REPLACE(a.category, '_', ' '))
                END as category_display_name,
                COUNT(*) as count,
                CASE
                    WHEN tc.total > 0 THEN ROUND((CAST(COUNT(*) AS DECIMAL) / tc.total) * 100, 2)
                    ELSE 0
                END as percentage
            FROM assets a, total_count tc
            WHERE a.is_deleted = false
            GROUP BY a.category, tc.total
            ORDER BY count DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getTopMaintenanceSpend(int limit) {
        String sql = """
            SELECT
                a.id as asset_id,
                a.asset_name,
                a.asset_number,
                a.category,
                CASE a.category
                    WHEN 'HVAC' THEN 'HVAC'
                    WHEN 'ELEVATOR' THEN 'Elevator'
                    WHEN 'GENERATOR' THEN 'Generator'
                    WHEN 'WATER_PUMP' THEN 'Water Pump'
                    WHEN 'FIRE_SYSTEM' THEN 'Fire System'
                    WHEN 'SECURITY_SYSTEM' THEN 'Security System'
                    WHEN 'ELECTRICAL_PANEL' THEN 'Electrical Panel'
                    WHEN 'PLUMBING_FIXTURE' THEN 'Plumbing Fixture'
                    WHEN 'APPLIANCE' THEN 'Appliance'
                    WHEN 'OTHER' THEN 'Other'
                    ELSE INITCAP(REPLACE(a.category, '_', ' '))
                END as category_display_name,
                COALESCE(SUM(wo.actual_cost), 0) as maintenance_cost
            FROM assets a
            LEFT JOIN work_orders wo ON a.id = wo.asset_id
                AND wo.status IN ('COMPLETED', 'CLOSED')
            WHERE a.is_deleted = false
            GROUP BY a.id, a.asset_name, a.asset_number, a.category
            HAVING COALESCE(SUM(wo.actual_cost), 0) > 0
            ORDER BY maintenance_cost DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", limit);
        return query.getResultList();
    }

    // =================================================================
    // TABLE QUERIES (AC-7 to AC-8)
    // =================================================================

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getOverduePmAssets(int limit) {
        String sql = """
            SELECT
                a.id as asset_id,
                a.asset_name,
                a.asset_number,
                a.category,
                CASE a.category
                    WHEN 'HVAC' THEN 'HVAC'
                    WHEN 'ELEVATOR' THEN 'Elevator'
                    WHEN 'GENERATOR' THEN 'Generator'
                    WHEN 'WATER_PUMP' THEN 'Water Pump'
                    WHEN 'FIRE_SYSTEM' THEN 'Fire System'
                    WHEN 'SECURITY_SYSTEM' THEN 'Security System'
                    WHEN 'ELECTRICAL_PANEL' THEN 'Electrical Panel'
                    WHEN 'PLUMBING_FIXTURE' THEN 'Plumbing Fixture'
                    WHEN 'APPLIANCE' THEN 'Appliance'
                    WHEN 'OTHER' THEN 'Other'
                    ELSE INITCAP(REPLACE(a.category, '_', ' '))
                END as category_display_name,
                a.property_id,
                p.name as property_name,
                a.last_maintenance_date,
                a.next_maintenance_date,
                (CURRENT_DATE - a.next_maintenance_date) as days_overdue
            FROM assets a
            JOIN properties p ON a.property_id = p.id
            WHERE a.is_deleted = false
            AND a.status = 'ACTIVE'
            AND a.next_maintenance_date IS NOT NULL
            AND a.next_maintenance_date < CURRENT_DATE
            ORDER BY days_overdue DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", limit);
        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object[]> getRecentlyAddedAssets(int limit) {
        String sql = """
            SELECT
                a.id as asset_id,
                a.asset_name,
                a.asset_number,
                a.category,
                CASE a.category
                    WHEN 'HVAC' THEN 'HVAC'
                    WHEN 'ELEVATOR' THEN 'Elevator'
                    WHEN 'GENERATOR' THEN 'Generator'
                    WHEN 'WATER_PUMP' THEN 'Water Pump'
                    WHEN 'FIRE_SYSTEM' THEN 'Fire System'
                    WHEN 'SECURITY_SYSTEM' THEN 'Security System'
                    WHEN 'ELECTRICAL_PANEL' THEN 'Electrical Panel'
                    WHEN 'PLUMBING_FIXTURE' THEN 'Plumbing Fixture'
                    WHEN 'APPLIANCE' THEN 'Appliance'
                    WHEN 'OTHER' THEN 'Other'
                    ELSE INITCAP(REPLACE(a.category, '_', ' '))
                END as category_display_name,
                a.property_id,
                p.name as property_name,
                a.created_at,
                COALESCE(a.purchase_cost, 0) as value
            FROM assets a
            JOIN properties p ON a.property_id = p.id
            WHERE a.is_deleted = false
            ORDER BY a.created_at DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", limit);
        return query.getResultList();
    }

    // =================================================================
    // DEPRECIATION QUERY (AC-9)
    // =================================================================

    @Override
    public Object[] getDepreciationSummary() {
        // Straight-line depreciation:
        // annual_depreciation = purchase_cost / estimated_useful_life
        // years_in_service = EXTRACT(YEAR FROM AGE(CURRENT_DATE, installation_date))
        // accumulated_depreciation = MIN(years_in_service * annual_depreciation, purchase_cost)
        // current_value = MAX(purchase_cost - accumulated_depreciation, 0)
        String sql = """
            WITH depreciable_assets AS (
                SELECT
                    a.id,
                    a.purchase_cost as original_value,
                    a.estimated_useful_life,
                    a.installation_date,
                    CASE
                        WHEN a.estimated_useful_life IS NULL OR a.estimated_useful_life = 0
                            OR a.installation_date IS NULL OR a.purchase_cost IS NULL
                        THEN a.purchase_cost
                        ELSE GREATEST(
                            a.purchase_cost - (
                                EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.installation_date)) *
                                (a.purchase_cost / a.estimated_useful_life)
                            ),
                            0
                        )
                    END as current_value
                FROM assets a
                WHERE a.is_deleted = false
                AND a.purchase_cost IS NOT NULL
                AND a.purchase_cost > 0
            )
            SELECT
                COALESCE(SUM(original_value), 0) as original_value_total,
                COALESCE(SUM(current_value), 0) as current_value_total,
                COALESCE(SUM(original_value) - SUM(current_value), 0) as total_depreciation,
                CASE
                    WHEN COALESCE(SUM(original_value), 0) > 0
                    THEN ROUND(((SUM(original_value) - SUM(current_value)) / SUM(original_value)) * 100, 2)
                    ELSE 0
                END as depreciation_percentage,
                COUNT(*) as total_depreciable_assets,
                SUM(CASE WHEN current_value <= 0 THEN 1 ELSE 0 END) as fully_depreciated_assets
            FROM depreciable_assets
            """;

        Query query = entityManager.createNativeQuery(sql);
        try {
            return (Object[]) query.getSingleResult();
        } catch (NoResultException e) {
            return new Object[]{0.0, 0.0, 0.0, 0.0, 0L, 0L};
        }
    }
}
