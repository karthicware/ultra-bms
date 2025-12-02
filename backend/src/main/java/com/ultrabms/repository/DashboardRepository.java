package com.ultrabms.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Executive Dashboard data aggregation.
 * Uses native queries for optimized server-side calculations (AC-19).
 *
 * Story 8.1: Executive Summary Dashboard
 */
@Repository
public interface DashboardRepository {

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    /**
     * Get total revenue for period (from invoices)
     * AC-1: Net Profit/Loss calculation (revenue part)
     *
     * @param startDate Period start date
     * @param endDate   Period end date
     * @param propertyId Optional property filter (null for all)
     * @return Total revenue amount
     */
    BigDecimal getTotalRevenueForPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Get total expenses for period
     * AC-1: Net Profit/Loss calculation (expenses part)
     *
     * @param startDate Period start date
     * @param endDate   Period end date
     * @param propertyId Optional property filter (null for all)
     * @return Total expense amount
     */
    BigDecimal getTotalExpensesForPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Get occupancy statistics
     * AC-2: Occupancy Rate calculation
     *
     * @param propertyId Optional property filter (null for all)
     * @return Object array: [totalUnits, occupiedUnits]
     */
    Object[] getOccupancyStats(UUID propertyId);

    /**
     * Count overdue maintenance jobs
     * AC-3: Overdue Maintenance Jobs count
     *
     * @param asOfDate Current date for overdue check
     * @param propertyId Optional property filter (null for all)
     * @return Count of overdue work orders
     */
    Long countOverdueMaintenanceJobs(LocalDateTime asOfDate, UUID propertyId);

    /**
     * Get outstanding receivables with aging breakdown
     * AC-4: Outstanding Receivables with aging
     *
     * @param asOfDate Date for aging calculation
     * @param propertyId Optional property filter (null for all)
     * @return Object array: [totalOutstanding, current, thirtyPlus, sixtyPlus, ninetyPlus]
     */
    Object[] getReceivablesAging(LocalDate asOfDate, UUID propertyId);

    // =================================================================
    // PRIORITY MAINTENANCE QUEUE (AC-5)
    // =================================================================

    /**
     * Get high priority maintenance queue
     * AC-5: Priority Maintenance Queue (HIGH priority, OPEN/ASSIGNED)
     *
     * @param limit Maximum items to return (default 5)
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [id, workOrderNumber, propertyName, unitNumber, title, description, priority, status, scheduledDate, daysOverdue, isOverdue]
     */
    List<Object[]> getHighPriorityMaintenanceQueue(int limit, UUID propertyId);

    // =================================================================
    // UPCOMING PM JOBS (AC-6)
    // =================================================================

    /**
     * Get upcoming PM jobs by category for next N days
     * AC-6: Upcoming PM Jobs chart data
     *
     * @param days Number of days to look ahead (default 30)
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [category, scheduledCount, overdueCount, totalCount]
     */
    List<Object[]> getUpcomingPmJobsByCategory(int days, UUID propertyId);

    // =================================================================
    // LEASE EXPIRATIONS (AC-7)
    // =================================================================

    /**
     * Get lease expirations timeline for next N months
     * AC-7: Lease Expirations Timeline
     *
     * @param months Number of months to forecast (default 12)
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [year, month, expirationCount]
     */
    List<Object[]> getLeaseExpirationTimeline(int months, UUID propertyId);

    // =================================================================
    // CRITICAL ALERTS (AC-8)
    // =================================================================

    /**
     * Get critical alerts count by type
     * AC-8: Critical Alerts Panel
     *
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [alertType, severity, count]
     */
    List<Object[]> getCriticalAlerts(UUID propertyId);

    // =================================================================
    // PROPERTY COMPARISON (AC-9)
    // =================================================================

    /**
     * Get property performance comparison data
     * AC-9: Property Performance Comparison table
     *
     * @param startDate Period start date
     * @param endDate   Period end date
     * @return List of Object arrays: [propertyId, propertyName, occupancyRate, maintenanceCost, revenue, openWorkOrders]
     */
    List<Object[]> getPropertyComparison(LocalDate startDate, LocalDate endDate);
}
