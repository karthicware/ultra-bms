package com.ultrabms.dto.dashboard.maintenance;

import com.ultrabms.entity.enums.WorkOrderCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Jobs by Category horizontal bar chart (AC-7)
 * Each instance represents one category bar, sorted by count descending
 *
 * Story 8.4: Maintenance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobsByCategoryDto {

    /**
     * Work order category (PLUMBING, ELECTRICAL, HVAC, etc.)
     */
    private WorkOrderCategory category;

    /**
     * Display label for the category
     */
    private String label;

    /**
     * Count of jobs in this category
     */
    private Long count;

    /**
     * Hex color code for the bar
     */
    private String color;
}
