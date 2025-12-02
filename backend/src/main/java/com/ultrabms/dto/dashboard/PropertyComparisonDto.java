package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for property performance comparison table (AC-9, AC-17)
 * Sortable table with visual highlighting for top/bottom performers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyComparisonDto {

    private UUID propertyId;
    private String propertyName;
    private BigDecimal occupancyRate;
    private BigDecimal maintenanceCost;
    private BigDecimal revenue;
    private Integer openWorkOrders;
    private PerformanceRank rank;

    /**
     * Performance ranking for visual highlighting
     */
    public enum PerformanceRank {
        TOP,      // Top performer (green highlight)
        MIDDLE,   // Average performer (no highlight)
        BOTTOM    // Bottom performer (red highlight)
    }
}
