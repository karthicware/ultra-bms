package com.ultrabms.dto.dashboard.occupancy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for individual Occupancy KPI cards (AC-1 through AC-4)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyKpiDto {

    /**
     * Portfolio Occupancy KPI (AC-1)
     * Percentage of occupied units vs total units
     */
    private KpiValue portfolioOccupancy;

    /**
     * Vacant Units KPI (AC-2)
     * Count of available/vacant units
     */
    private KpiValue vacantUnits;

    /**
     * Leases Expiring KPI (AC-3)
     * Count of leases expiring within configurable period
     */
    private KpiValue leasesExpiring;

    /**
     * Average Rent per SqFt KPI (AC-4)
     * Currency amount (AED) per square foot from active leases
     */
    private KpiValue averageRentPerSqft;

    /**
     * Individual KPI value with trend and display metadata
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiValue {
        private BigDecimal value;
        private BigDecimal previousValue;
        private BigDecimal changePercentage;
        private TrendDirection trend;
        private String formattedValue;
        private String unit; // "%", "count", "AED", etc.
    }

    /**
     * Trend direction for KPI change indicators
     */
    public enum TrendDirection {
        UP,
        DOWN,
        NEUTRAL
    }
}
