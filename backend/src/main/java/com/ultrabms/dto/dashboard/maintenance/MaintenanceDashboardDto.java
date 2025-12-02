package com.ultrabms.dto.dashboard.maintenance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Complete Maintenance Dashboard response DTO (AC-10)
 * Aggregates all dashboard components for GET /api/v1/dashboard/maintenance
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceDashboardDto {

    /**
     * KPI cards data (AC-1, AC-2, AC-3, AC-4)
     * Active jobs, overdue jobs, pending jobs, completed this month
     */
    private MaintenanceKpiDto kpis;

    /**
     * Jobs by Status for pie chart (AC-5)
     * Segments: OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED
     */
    private List<JobsByStatusDto> jobsByStatus;

    /**
     * Jobs by Priority for bar chart (AC-6)
     * Bars: LOW, MEDIUM, HIGH, URGENT
     */
    private List<JobsByPriorityDto> jobsByPriority;

    /**
     * Jobs by Category for horizontal bar chart (AC-7)
     * Categories sorted by count descending
     */
    private List<JobsByCategoryDto> jobsByCategory;

    /**
     * High Priority & Overdue jobs for table (AC-8)
     * First page (default 10 items)
     */
    private List<HighPriorityJobDto> highPriorityOverdueJobs;

    /**
     * Total count of high priority and overdue jobs
     * Used for pagination
     */
    private Long highPriorityOverdueTotal;

    /**
     * Recently completed jobs list (AC-9)
     * Last 5 completed jobs
     */
    private List<RecentlyCompletedJobDto> recentlyCompletedJobs;
}
