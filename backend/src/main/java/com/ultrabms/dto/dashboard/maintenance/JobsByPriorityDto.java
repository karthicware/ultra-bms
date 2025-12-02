package com.ultrabms.dto.dashboard.maintenance;

import com.ultrabms.entity.enums.WorkOrderPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Jobs by Priority bar chart (AC-6)
 * Each instance represents one priority level bar
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobsByPriorityDto {

    /**
     * Work order priority (LOW, MEDIUM, HIGH, URGENT)
     */
    private WorkOrderPriority priority;

    /**
     * Display label for the priority
     */
    private String label;

    /**
     * Count of jobs with this priority
     */
    private Long count;

    /**
     * Hex color code for the bar (green to red gradient)
     * LOW = green, MEDIUM = yellow, HIGH = orange, URGENT = red
     */
    private String color;
}
