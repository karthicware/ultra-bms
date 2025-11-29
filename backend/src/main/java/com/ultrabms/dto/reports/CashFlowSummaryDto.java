package com.ultrabms.dto.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Cash Flow Summary report data.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #2: Cash Flow page at /finance/reports/cash-flow
 * AC #11: Backend API for cash flow data
 */
public record CashFlowSummaryDto(
        LocalDate startDate,
        LocalDate endDate,
        UUID propertyId,
        String propertyName,
        BigDecimal totalInflows,
        BigDecimal totalOutflows,
        BigDecimal netCashFlow,
        List<MonthlyCashFlow> monthlyCashFlows,
        BigDecimal previousPeriodInflows,
        BigDecimal previousPeriodOutflows,
        BigDecimal previousPeriodNetCashFlow,
        BigDecimal inflowChange,
        BigDecimal outflowChange,
        BigDecimal netChange,
        LocalDateTime generatedAt
) {
    /**
     * Monthly cash flow data point for chart
     */
    public record MonthlyCashFlow(
            String month,
            BigDecimal inflows,
            BigDecimal outflows,
            BigDecimal net
    ) {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate startDate;
        private LocalDate endDate;
        private UUID propertyId;
        private String propertyName;
        private BigDecimal totalInflows = BigDecimal.ZERO;
        private BigDecimal totalOutflows = BigDecimal.ZERO;
        private BigDecimal netCashFlow = BigDecimal.ZERO;
        private List<MonthlyCashFlow> monthlyCashFlows = List.of();
        private BigDecimal previousPeriodInflows = BigDecimal.ZERO;
        private BigDecimal previousPeriodOutflows = BigDecimal.ZERO;
        private BigDecimal previousPeriodNetCashFlow = BigDecimal.ZERO;
        private BigDecimal inflowChange = BigDecimal.ZERO;
        private BigDecimal outflowChange = BigDecimal.ZERO;
        private BigDecimal netChange = BigDecimal.ZERO;
        private LocalDateTime generatedAt = LocalDateTime.now();

        public Builder startDate(LocalDate val) { this.startDate = val; return this; }
        public Builder endDate(LocalDate val) { this.endDate = val; return this; }
        public Builder propertyId(UUID val) { this.propertyId = val; return this; }
        public Builder propertyName(String val) { this.propertyName = val; return this; }
        public Builder totalInflows(BigDecimal val) { this.totalInflows = val; return this; }
        public Builder totalOutflows(BigDecimal val) { this.totalOutflows = val; return this; }
        public Builder netCashFlow(BigDecimal val) { this.netCashFlow = val; return this; }
        public Builder monthlyCashFlows(List<MonthlyCashFlow> val) { this.monthlyCashFlows = val; return this; }
        public Builder previousPeriodInflows(BigDecimal val) { this.previousPeriodInflows = val; return this; }
        public Builder previousPeriodOutflows(BigDecimal val) { this.previousPeriodOutflows = val; return this; }
        public Builder previousPeriodNetCashFlow(BigDecimal val) { this.previousPeriodNetCashFlow = val; return this; }
        public Builder inflowChange(BigDecimal val) { this.inflowChange = val; return this; }
        public Builder outflowChange(BigDecimal val) { this.outflowChange = val; return this; }
        public Builder netChange(BigDecimal val) { this.netChange = val; return this; }
        public Builder generatedAt(LocalDateTime val) { this.generatedAt = val; return this; }

        public CashFlowSummaryDto build() {
            return new CashFlowSummaryDto(startDate, endDate, propertyId, propertyName, totalInflows,
                    totalOutflows, netCashFlow, monthlyCashFlows, previousPeriodInflows, previousPeriodOutflows,
                    previousPeriodNetCashFlow, inflowChange, outflowChange, netChange, generatedAt);
        }
    }
}
