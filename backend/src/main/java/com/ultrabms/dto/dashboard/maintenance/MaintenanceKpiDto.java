package com.ultrabms.dto.dashboard.maintenance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Maintenance Dashboard KPI cards (AC-1, AC-2, AC-3, AC-4)
 * Contains counts for active, overdue, pending, and completed jobs
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceKpiDto {

    /**
     * Active Jobs count (AC-1)
     * Count of work orders with status NOT IN (COMPLETED, CLOSED)
     */
    private Long activeJobs;

    /**
     * Overdue Jobs count (AC-2)
     * Count where scheduledDate < today AND status NOT IN (COMPLETED, CLOSED)
     */
    private Long overdueJobs;

    /**
     * Pending Jobs count (AC-3)
     * Count with status = OPEN (not yet assigned)
     */
    private Long pendingJobs;

    /**
     * Jobs Completed This Month count (AC-4)
     */
    private Long completedThisMonth;

    /**
     * Jobs Completed Previous Month for comparison (AC-4)
     */
    private Long completedPreviousMonth;

    /**
     * Percentage change from previous month
     * Calculated as: ((completedThisMonth - completedPreviousMonth) / completedPreviousMonth) * 100
     */
    private Double monthOverMonthChange;
}
