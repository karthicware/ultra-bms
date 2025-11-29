package com.ultrabms.dto.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Income Statement (P&L) report data.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #1: Income Statement page at /finance/reports/income-statement
 * AC #10: Backend API for income statement data
 */
public record IncomeStatementDto(
        LocalDate startDate,
        LocalDate endDate,
        UUID propertyId,
        String propertyName,
        BigDecimal totalRevenue,
        List<RevenueBreakdownDetail> revenueBreakdown,
        BigDecimal totalExpenses,
        List<ExpenseBreakdownDetail> expenseBreakdown,
        BigDecimal netIncome,
        BigDecimal netMargin,
        BigDecimal previousPeriodRevenue,
        BigDecimal previousPeriodExpenses,
        BigDecimal previousPeriodNetIncome,
        BigDecimal revenueChange,
        BigDecimal expenseChange,
        BigDecimal netIncomeChange,
        LocalDateTime generatedAt
) {
    /**
     * Revenue breakdown by category
     */
    public record RevenueBreakdownDetail(
            String category,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    /**
     * Expense breakdown by category
     */
    public record ExpenseBreakdownDetail(
            String category,
            String categoryLabel,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate startDate;
        private LocalDate endDate;
        private UUID propertyId;
        private String propertyName;
        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private List<RevenueBreakdownDetail> revenueBreakdown = List.of();
        private BigDecimal totalExpenses = BigDecimal.ZERO;
        private List<ExpenseBreakdownDetail> expenseBreakdown = List.of();
        private BigDecimal netIncome = BigDecimal.ZERO;
        private BigDecimal netMargin = BigDecimal.ZERO;
        private BigDecimal previousPeriodRevenue = BigDecimal.ZERO;
        private BigDecimal previousPeriodExpenses = BigDecimal.ZERO;
        private BigDecimal previousPeriodNetIncome = BigDecimal.ZERO;
        private BigDecimal revenueChange = BigDecimal.ZERO;
        private BigDecimal expenseChange = BigDecimal.ZERO;
        private BigDecimal netIncomeChange = BigDecimal.ZERO;
        private LocalDateTime generatedAt = LocalDateTime.now();

        public Builder startDate(LocalDate val) { this.startDate = val; return this; }
        public Builder endDate(LocalDate val) { this.endDate = val; return this; }
        public Builder propertyId(UUID val) { this.propertyId = val; return this; }
        public Builder propertyName(String val) { this.propertyName = val; return this; }
        public Builder totalRevenue(BigDecimal val) { this.totalRevenue = val; return this; }
        public Builder revenueBreakdown(List<RevenueBreakdownDetail> val) { this.revenueBreakdown = val; return this; }
        public Builder totalExpenses(BigDecimal val) { this.totalExpenses = val; return this; }
        public Builder expenseBreakdown(List<ExpenseBreakdownDetail> val) { this.expenseBreakdown = val; return this; }
        public Builder netIncome(BigDecimal val) { this.netIncome = val; return this; }
        public Builder netMargin(BigDecimal val) { this.netMargin = val; return this; }
        public Builder previousPeriodRevenue(BigDecimal val) { this.previousPeriodRevenue = val; return this; }
        public Builder previousPeriodExpenses(BigDecimal val) { this.previousPeriodExpenses = val; return this; }
        public Builder previousPeriodNetIncome(BigDecimal val) { this.previousPeriodNetIncome = val; return this; }
        public Builder revenueChange(BigDecimal val) { this.revenueChange = val; return this; }
        public Builder expenseChange(BigDecimal val) { this.expenseChange = val; return this; }
        public Builder netIncomeChange(BigDecimal val) { this.netIncomeChange = val; return this; }
        public Builder generatedAt(LocalDateTime val) { this.generatedAt = val; return this; }

        public IncomeStatementDto build() {
            return new IncomeStatementDto(startDate, endDate, propertyId, propertyName, totalRevenue,
                    revenueBreakdown, totalExpenses, expenseBreakdown, netIncome, netMargin,
                    previousPeriodRevenue, previousPeriodExpenses, previousPeriodNetIncome,
                    revenueChange, expenseChange, netIncomeChange, generatedAt);
        }
    }
}
