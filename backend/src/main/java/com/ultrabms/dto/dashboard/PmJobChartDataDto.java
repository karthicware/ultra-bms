package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for upcoming PM jobs chart data (AC-6, AC-14)
 * Bar chart showing PM jobs by category for next 30 days
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PmJobChartDataDto {

    private String category;
    private Integer scheduledCount;
    private Integer overdueCount;
    private Integer totalCount;
}
