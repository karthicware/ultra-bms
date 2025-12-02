package com.ultrabms.repository;

import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Maintenance Dashboard data aggregation.
 * Uses native queries for optimized server-side calculations.
 *
 * Story 8.4: Maintenance Dashboard
 */
@Repository
public interface MaintenanceDashboardRepository {

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    /**
     * Count active jobs (status NOT IN COMPLETED, CLOSED)
     * AC-1: Active Jobs KPI card
     *
     * @param propertyId Optional property filter (null for all)
     * @return Count of active work orders
     */
    Long countActiveJobs(UUID propertyId);

    /**
     * Count overdue jobs
     * AC-2: Overdue Jobs KPI card
     * Overdue = scheduledDate < today AND status NOT IN (COMPLETED, CLOSED)
     *
     * @param asOfDate Current datetime for overdue check
     * @param propertyId Optional property filter (null for all)
     * @return Count of overdue work orders
     */
    Long countOverdueJobs(LocalDateTime asOfDate, UUID propertyId);

    /**
     * Count pending jobs (status = OPEN)
     * AC-3: Pending Jobs KPI card
     *
     * @param propertyId Optional property filter (null for all)
     * @return Count of pending work orders
     */
    Long countPendingJobs(UUID propertyId);

    /**
     * Count jobs completed in date range
     * AC-4: Jobs Completed This Month KPI card
     *
     * @param startDate Period start date
     * @param endDate Period end date
     * @param propertyId Optional property filter (null for all)
     * @return Count of completed work orders in period
     */
    Long countCompletedJobsInPeriod(LocalDateTime startDate, LocalDateTime endDate, UUID propertyId);

    // =================================================================
    // CHART DATA QUERIES (AC-5 to AC-7)
    // =================================================================

    /**
     * Get jobs grouped by status with counts
     * AC-5: Jobs by Status pie chart
     *
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [status, count]
     */
    List<Object[]> getJobsByStatus(UUID propertyId);

    /**
     * Get jobs grouped by priority with counts
     * AC-6: Jobs by Priority bar chart
     *
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [priority, count]
     */
    List<Object[]> getJobsByPriority(UUID propertyId);

    /**
     * Get jobs grouped by category with counts
     * AC-7: Jobs by Category horizontal bar chart
     * Sorted by count descending
     *
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [category, count]
     */
    List<Object[]> getJobsByCategory(UUID propertyId);

    // =================================================================
    // TABLE QUERIES (AC-8 to AC-9)
    // =================================================================

    /**
     * Get high priority and overdue jobs for table
     * AC-8: High Priority & Overdue Jobs table
     * Filter: priority IN (HIGH, URGENT) OR overdue
     *
     * @param asOfDate Current datetime for overdue check
     * @param offset Pagination offset
     * @param limit Pagination limit
     * @param propertyId Optional property filter (null for all)
     * @param statusFilter Optional status filter (null for all)
     * @return List of Object arrays: [id, workOrderNumber, propertyName, unitNumber, title, priority, status, assignedToName, scheduledDate, daysOverdue, isOverdue]
     */
    List<Object[]> getHighPriorityAndOverdueJobs(LocalDateTime asOfDate, int offset, int limit,
                                                  UUID propertyId, String statusFilter);

    /**
     * Count total high priority and overdue jobs
     * AC-8: For pagination
     *
     * @param asOfDate Current datetime for overdue check
     * @param propertyId Optional property filter (null for all)
     * @param statusFilter Optional status filter (null for all)
     * @return Total count
     */
    Long countHighPriorityAndOverdueJobs(LocalDateTime asOfDate, UUID propertyId, String statusFilter);

    /**
     * Get recently completed jobs
     * AC-9: Recently Completed Jobs list
     *
     * @param limit Maximum items to return (default 5)
     * @param propertyId Optional property filter (null for all)
     * @return List of Object arrays: [id, workOrderNumber, title, propertyName, completedAt, completedByName]
     */
    List<Object[]> getRecentlyCompletedJobs(int limit, UUID propertyId);
}
