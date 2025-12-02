package com.ultrabms.dto.dashboard.maintenance;

import com.ultrabms.entity.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Jobs by Status pie chart segment (AC-5)
 * Each instance represents one status segment in the pie chart
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobsByStatusDto {

    /**
     * Work order status (OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED)
     */
    private WorkOrderStatus status;

    /**
     * Display label for the status
     */
    private String label;

    /**
     * Count of jobs with this status
     */
    private Long count;

    /**
     * Percentage of total jobs
     */
    private Double percentage;

    /**
     * Hex color code for the chart segment
     */
    private String color;
}
