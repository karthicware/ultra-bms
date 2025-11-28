package com.ultrabms.dto.expenses;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for expense summary dashboard data.
 *
 * Story 6.2: Expense Management and Vendor Payments
 * AC #12: Expense summary dashboard with category breakdown pie chart and monthly trend
 */
public record ExpenseSummaryDto(
        // Totals
        BigDecimal totalExpenses,
        BigDecimal totalPending,
        BigDecimal totalPaid,
        long expenseCount,
        long pendingCount,
        long paidCount,

        // Category breakdown (for pie chart)
        List<CategoryBreakdown> categoryBreakdown,

        // Monthly trend (for line chart)
        List<MonthlyTrend> monthlyTrend
) {
    /**
     * Category breakdown for pie chart
     */
    public record CategoryBreakdown(
            String category,
            String categoryDisplayName,
            BigDecimal amount,
            long count,
            double percentage
    ) {}

    /**
     * Monthly expense trend for line chart
     */
    public record MonthlyTrend(
            int year,
            int month,
            String monthName,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            BigDecimal pendingAmount
    ) {}

    /**
     * Builder for ExpenseSummaryDto
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BigDecimal totalExpenses = BigDecimal.ZERO;
        private BigDecimal totalPending = BigDecimal.ZERO;
        private BigDecimal totalPaid = BigDecimal.ZERO;
        private long expenseCount = 0;
        private long pendingCount = 0;
        private long paidCount = 0;
        private List<CategoryBreakdown> categoryBreakdown = List.of();
        private List<MonthlyTrend> monthlyTrend = List.of();

        public Builder totalExpenses(BigDecimal totalExpenses) {
            this.totalExpenses = totalExpenses;
            return this;
        }

        public Builder totalPending(BigDecimal totalPending) {
            this.totalPending = totalPending;
            return this;
        }

        public Builder totalPaid(BigDecimal totalPaid) {
            this.totalPaid = totalPaid;
            return this;
        }

        public Builder expenseCount(long expenseCount) {
            this.expenseCount = expenseCount;
            return this;
        }

        public Builder pendingCount(long pendingCount) {
            this.pendingCount = pendingCount;
            return this;
        }

        public Builder paidCount(long paidCount) {
            this.paidCount = paidCount;
            return this;
        }

        public Builder categoryBreakdown(List<CategoryBreakdown> categoryBreakdown) {
            this.categoryBreakdown = categoryBreakdown;
            return this;
        }

        public Builder monthlyTrend(List<MonthlyTrend> monthlyTrend) {
            this.monthlyTrend = monthlyTrend;
            return this;
        }

        public ExpenseSummaryDto build() {
            return new ExpenseSummaryDto(
                    totalExpenses, totalPending, totalPaid,
                    expenseCount, pendingCount, paidCount,
                    categoryBreakdown, monthlyTrend
            );
        }
    }
}
