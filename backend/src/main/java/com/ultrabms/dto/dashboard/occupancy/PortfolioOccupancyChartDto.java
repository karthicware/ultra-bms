package com.ultrabms.dto.dashboard.occupancy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for Portfolio Occupancy Donut Chart (AC-5)
 * Displays segments: Occupied, Vacant, Under Renovation, Notice Period
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioOccupancyChartDto {

    /**
     * Total number of units across all properties
     */
    private Long totalUnits;

    /**
     * Breakdown by occupancy status
     */
    private List<OccupancySegment> segments;

    /**
     * Individual segment for the donut chart
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OccupancySegment {
        /**
         * Segment status name (e.g., "Occupied", "Vacant", "Under Renovation", "Notice Period")
         */
        private String status;

        /**
         * Number of units in this status
         */
        private Long count;

        /**
         * Percentage of total units
         */
        private BigDecimal percentage;

        /**
         * Color code for chart rendering (e.g., "#22c55e" for green)
         */
        private String color;
    }
}
