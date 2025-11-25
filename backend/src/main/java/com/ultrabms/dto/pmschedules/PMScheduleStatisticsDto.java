package com.ultrabms.dto.pmschedules;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for PM schedule statistics.
 * Included in detail view to show schedule performance.
 *
 * Story 4.2: Preventive Maintenance Scheduling
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PMScheduleStatisticsDto {

    /**
     * Total work orders generated from this schedule
     */
    private long totalGenerated;

    /**
     * Number of completed work orders
     */
    private long completedCount;

    /**
     * Number of overdue work orders (not completed, past scheduled date)
     */
    private long overdueCount;

    /**
     * Average days to complete work orders (null if no completed work orders)
     */
    private Double avgCompletionDays;
}
