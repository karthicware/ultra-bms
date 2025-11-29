package com.ultrabms.dto.reports;

import com.ultrabms.entity.enums.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Financial Dashboard KPIs and insights.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #6: Financial Dashboard page at /finance/reports
 * AC #15: Backend API for dashboard KPIs
 * AC #29: Dashboard caching with @Cacheable (1 hour TTL)
 */
public record FinancialDashboardDto(
        FinancialKPIs kpis,
        FinancialInsights insights,
        String currentMonth,
        String previousMonth,
        UUID propertyId,
        String propertyName,
        LocalDateTime cachedAt
) {
    /**
     * Financial KPIs
     */
    public record FinancialKPIs(
            BigDecimal totalRevenue,
            BigDecimal totalExpenses,
            BigDecimal netProfitLoss,
            BigDecimal collectionRate,
            BigDecimal outstandingReceivables,
            BigDecimal revenueGrowth,
            BigDecimal expenseGrowth
    ) {
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private BigDecimal totalRevenue = BigDecimal.ZERO;
            private BigDecimal totalExpenses = BigDecimal.ZERO;
            private BigDecimal netProfitLoss = BigDecimal.ZERO;
            private BigDecimal collectionRate = BigDecimal.ZERO;
            private BigDecimal outstandingReceivables = BigDecimal.ZERO;
            private BigDecimal revenueGrowth = BigDecimal.ZERO;
            private BigDecimal expenseGrowth = BigDecimal.ZERO;

            public Builder totalRevenue(BigDecimal val) { this.totalRevenue = val; return this; }
            public Builder totalExpenses(BigDecimal val) { this.totalExpenses = val; return this; }
            public Builder netProfitLoss(BigDecimal val) { this.netProfitLoss = val; return this; }
            public Builder collectionRate(BigDecimal val) { this.collectionRate = val; return this; }
            public Builder outstandingReceivables(BigDecimal val) { this.outstandingReceivables = val; return this; }
            public Builder revenueGrowth(BigDecimal val) { this.revenueGrowth = val; return this; }
            public Builder expenseGrowth(BigDecimal val) { this.expenseGrowth = val; return this; }

            public FinancialKPIs build() {
                return new FinancialKPIs(totalRevenue, totalExpenses, netProfitLoss, collectionRate, outstandingReceivables, revenueGrowth, expenseGrowth);
            }
        }
    }

    /**
     * Financial insights
     */
    public record FinancialInsights(
            TopPerformingProperty topPerformingProperty,
            HighestExpenseCategory highestExpenseCategory
    ) {}

    /**
     * Top performing property insight
     */
    public record TopPerformingProperty(
            UUID propertyId,
            String propertyName,
            BigDecimal revenue
    ) {}

    /**
     * Highest expense category insight
     */
    public record HighestExpenseCategory(
            ExpenseCategory category,
            String categoryLabel,
            BigDecimal amount
    ) {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private FinancialKPIs kpis;
        private FinancialInsights insights;
        private String currentMonth;
        private String previousMonth;
        private UUID propertyId;
        private String propertyName;
        private LocalDateTime cachedAt = LocalDateTime.now();

        public Builder kpis(FinancialKPIs val) { this.kpis = val; return this; }
        public Builder insights(FinancialInsights val) { this.insights = val; return this; }
        public Builder currentMonth(String val) { this.currentMonth = val; return this; }
        public Builder previousMonth(String val) { this.previousMonth = val; return this; }
        public Builder propertyId(UUID val) { this.propertyId = val; return this; }
        public Builder propertyName(String val) { this.propertyName = val; return this; }
        public Builder cachedAt(LocalDateTime val) { this.cachedAt = val; return this; }

        public FinancialDashboardDto build() {
            return new FinancialDashboardDto(kpis, insights, currentMonth, previousMonth, propertyId, propertyName, cachedAt);
        }
    }
}
