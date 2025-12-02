package com.ultrabms.service;

import com.ultrabms.dto.dashboard.maintenance.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for Maintenance Dashboard operations.
 * Provides KPI calculations, chart data, and job lists.
 *
 * Story 8.4: Maintenance Dashboard
 */
public interface MaintenanceDashboardService {

    // =================================================================
    // COMPLETE DASHBOARD (AC-10)
    // =================================================================

    /**
     * Get complete maintenance dashboard data in a single call
     * AC-10: GET /api/v1/dashboard/maintenance endpoint
     *
     * @param propertyId Optional property filter (null for all properties)
     * @return Complete maintenance dashboard data
     */
    MaintenanceDashboardDto getMaintenanceDashboard(UUID propertyId);

    // =================================================================
    // CHART DATA ENDPOINTS
    // =================================================================

    /**
     * Get jobs grouped by status for pie chart
     * AC-11: GET /api/v1/dashboard/maintenance/jobs-by-status endpoint
     *
     * @param propertyId Optional property filter
     * @return List of jobs by status for chart
     */
    List<JobsByStatusDto> getJobsByStatus(UUID propertyId);

    /**
     * Get jobs grouped by priority for bar chart
     * AC-12: GET /api/v1/dashboard/maintenance/jobs-by-priority endpoint
     *
     * @param propertyId Optional property filter
     * @return List of jobs by priority for chart
     */
    List<JobsByPriorityDto> getJobsByPriority(UUID propertyId);

    /**
     * Get jobs grouped by category for horizontal bar chart
     * AC-13: GET /api/v1/dashboard/maintenance/jobs-by-category endpoint
     *
     * @param propertyId Optional property filter
     * @return List of jobs by category for chart (sorted by count desc)
     */
    List<JobsByCategoryDto> getJobsByCategory(UUID propertyId);

    // =================================================================
    // LIST DATA ENDPOINTS
    // =================================================================

    /**
     * Get high priority and overdue jobs with pagination
     * AC-14: GET /api/v1/dashboard/maintenance/high-priority-overdue endpoint
     *
     * @param propertyId Optional property filter
     * @param statusFilter Optional status filter for click-to-filter
     * @param pageable Pagination parameters
     * @return Page of high priority and overdue jobs
     */
    Page<HighPriorityJobDto> getHighPriorityAndOverdueJobs(UUID propertyId, String statusFilter, Pageable pageable);

    /**
     * Get recently completed jobs
     * AC-15: GET /api/v1/dashboard/maintenance/recently-completed endpoint
     *
     * @param propertyId Optional property filter
     * @param limit Maximum items to return (default 5)
     * @return List of recently completed jobs
     */
    List<RecentlyCompletedJobDto> getRecentlyCompletedJobs(UUID propertyId, int limit);
}
