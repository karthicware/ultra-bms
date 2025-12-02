package com.ultrabms.service;

import com.ultrabms.dto.dashboard.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Executive Dashboard operations.
 * Provides KPI calculations, chart data, and alert aggregations.
 *
 * Story 8.1: Executive Summary Dashboard
 */
public interface DashboardService {

    // =================================================================
    // COMPLETE DASHBOARD (AC-11)
    // =================================================================

    /**
     * Get complete executive dashboard data in a single call
     * AC-11: GET /api/v1/dashboard/executive endpoint
     *
     * @param propertyId Optional property filter (null for all properties)
     * @param startDate  Optional period start date (defaults to current year start)
     * @param endDate    Optional period end date (defaults to today)
     * @return Complete executive dashboard data
     */
    ExecutiveDashboardDto getExecutiveDashboard(UUID propertyId, LocalDate startDate, LocalDate endDate);

    // =================================================================
    // KPI DATA (AC-12)
    // =================================================================

    /**
     * Get all KPI card data with trend calculations
     * AC-12: GET /api/v1/dashboard/kpis endpoint
     *
     * @param propertyId Optional property filter
     * @param startDate  Period start date
     * @param endDate    Period end date
     * @return KPI cards with values and trends
     */
    KpiCardsDto getKpiCards(UUID propertyId, LocalDate startDate, LocalDate endDate);

    // =================================================================
    // PRIORITY MAINTENANCE QUEUE (AC-13)
    // =================================================================

    /**
     * Get high priority maintenance queue
     * AC-13: GET /api/v1/dashboard/maintenance-queue endpoint
     *
     * @param propertyId Optional property filter
     * @param limit      Maximum items to return (default 5)
     * @return List of high priority maintenance items
     */
    List<MaintenanceQueueItemDto> getPriorityMaintenanceQueue(UUID propertyId, int limit);

    // =================================================================
    // PM JOBS CHART DATA (AC-14)
    // =================================================================

    /**
     * Get upcoming PM jobs by category for chart
     * AC-14: GET /api/v1/dashboard/pm-jobs endpoint
     *
     * @param propertyId Optional property filter
     * @param days       Number of days to look ahead (default 30)
     * @return List of PM job chart data by category
     */
    List<PmJobChartDataDto> getUpcomingPmJobs(UUID propertyId, int days);

    // =================================================================
    // LEASE EXPIRATIONS TIMELINE (AC-15)
    // =================================================================

    /**
     * Get lease expiration timeline for chart
     * AC-15: GET /api/v1/dashboard/lease-expirations endpoint
     *
     * @param propertyId Optional property filter
     * @param months     Number of months to forecast (default 12)
     * @return List of lease expiration timeline data
     */
    List<LeaseExpirationTimelineDto> getLeaseExpirationTimeline(UUID propertyId, int months);

    // =================================================================
    // CRITICAL ALERTS (AC-16)
    // =================================================================

    /**
     * Get critical alerts panel data
     * AC-16: GET /api/v1/dashboard/alerts endpoint
     *
     * @param propertyId Optional property filter
     * @return List of critical alerts with counts
     */
    List<AlertDto> getCriticalAlerts(UUID propertyId);

    // =================================================================
    // PROPERTY COMPARISON (AC-17)
    // =================================================================

    /**
     * Get property performance comparison data
     * AC-17: GET /api/v1/dashboard/property-comparison endpoint
     *
     * @param startDate Period start date
     * @param endDate   Period end date
     * @return List of property comparison data
     */
    List<PropertyComparisonDto> getPropertyComparison(LocalDate startDate, LocalDate endDate);
}
