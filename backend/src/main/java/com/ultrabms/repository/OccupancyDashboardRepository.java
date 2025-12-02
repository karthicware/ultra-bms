package com.ultrabms.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Occupancy Dashboard data queries.
 * All queries support optional property filtering.
 *
 * Story 8.3: Occupancy Dashboard
 */
public interface OccupancyDashboardRepository {

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    /**
     * Get occupancy statistics breakdown by unit status (AC-1, AC-5)
     * Returns: total_units, occupied_units, vacant_units, under_renovation_units, notice_period_units
     */
    Object[] getOccupancyBreakdown(UUID propertyId);

    /**
     * Get previous period occupancy stats for trend calculation (AC-1)
     */
    Object[] getPreviousPeriodOccupancyStats(UUID propertyId, LocalDate asOfDate);

    /**
     * Count vacant units (AC-2)
     */
    Long countVacantUnits(UUID propertyId);

    /**
     * Count leases expiring within specified days (AC-3)
     */
    Long countExpiringLeases(int days, UUID propertyId);

    /**
     * Calculate average rent per square foot from active leases (AC-4)
     * Returns: [total_rent, total_sqft, avg_rent_per_sqft]
     */
    Object[] getAverageRentPerSqft(UUID propertyId);

    // =================================================================
    // CHART QUERIES (AC-5, AC-6)
    // =================================================================

    /**
     * Get lease expirations grouped by month for next 12 months (AC-6)
     * Returns: year, month, renewed_count, pending_count
     */
    List<Object[]> getLeaseExpirationsByMonth(int months, UUID propertyId);

    // =================================================================
    // LIST QUERIES (AC-7, AC-8)
    // =================================================================

    /**
     * Get upcoming lease expirations with tenant/unit details (AC-7)
     * Returns: tenant_id, tenant_name, unit_id, unit_number, property_id, property_name,
     *          expiry_date, days_remaining, is_renewed, renewal_status
     */
    List<Object[]> getUpcomingLeaseExpirations(int days, int limit, int offset, UUID propertyId);

    /**
     * Count total upcoming lease expirations for pagination
     */
    Long countUpcomingLeaseExpirations(int days, UUID propertyId);

    /**
     * Get recent lease activity feed (AC-8)
     * Returns: id, activity_type, tenant_id, tenant_name, unit_id, unit_number,
     *          property_name, timestamp, description
     */
    List<Object[]> getRecentLeaseActivity(int limit, UUID propertyId);

    // =================================================================
    // TREND CALCULATION (AC-1)
    // =================================================================

    /**
     * Get lease activity counts for trend calculation (AC-1)
     * Counts new leases and checkouts in the specified period to determine occupancy trend.
     * Returns: [new_leases_count, checkouts_count]
     */
    Object[] getActivityCountsForTrend(int daysBack, UUID propertyId);
}
