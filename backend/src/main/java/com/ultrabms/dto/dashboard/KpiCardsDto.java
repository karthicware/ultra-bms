package com.ultrabms.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for GET /api/v1/dashboard/kpis
 * Contains all KPI card data (AC-12)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiCardsDto {

    /**
     * Net Profit/Loss KPI (AC-1)
     * Calculated as: Total Revenue - Total Expenses
     */
    private KpiCardDto netProfitLoss;

    /**
     * Overall Occupancy Rate KPI (AC-2)
     * Calculated as: Occupied Units / Total Units
     */
    private KpiCardDto occupancyRate;

    /**
     * Overdue Maintenance Jobs KPI (AC-3)
     * Count of work orders with status != COMPLETED and scheduledDate < today
     */
    private KpiCardDto overdueMaintenance;

    /**
     * Outstanding Receivables KPI (AC-4)
     * Total amount from unpaid invoices
     */
    private ReceivablesKpiDto outstandingReceivables;

    /**
     * Individual KPI card data with trend indicator
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiCardDto {
        private BigDecimal value;
        private BigDecimal previousValue;
        private BigDecimal changePercentage;
        private TrendDirection trend;
        private String formattedValue;
        private String unit; // "AED", "%", "count", etc.
    }

    /**
     * Receivables KPI with aging breakdown (AC-4)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceivablesKpiDto {
        private BigDecimal totalAmount;
        private BigDecimal changePercentage;
        private TrendDirection trend;
        private AgingBreakdown aging;
    }

    /**
     * Aging breakdown for receivables
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgingBreakdown {
        private BigDecimal current;       // 0-30 days
        private BigDecimal thirtyPlus;    // 30-60 days
        private BigDecimal sixtyPlus;     // 60-90 days
        private BigDecimal ninetyPlus;    // 90+ days
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
