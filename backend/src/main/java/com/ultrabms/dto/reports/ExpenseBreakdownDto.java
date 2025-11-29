package com.ultrabms.dto.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Expense Breakdown report data.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #8: Expense Breakdown page at /finance/reports/expenses
 * AC #14: Backend API for expense breakdown data
 */
public record ExpenseBreakdownDto(
        LocalDate startDate,
        LocalDate endDate,
        UUID propertyId,
        String propertyName,
        BigDecimal totalExpenses,
        List<CategoryExpense> expenseByCategory,
        List<MonthlyExpenseTrend> monthlyTrend,
        List<VendorPayment> topVendors,
        List<PropertyMaintenanceCost> maintenanceCostByProperty,
        LocalDateTime generatedAt
) {
    /**
     * Expense by category
     */
    public record CategoryExpense(
            String category,
            String categoryLabel,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    /**
     * Monthly expense trend
     */
    public record MonthlyExpenseTrend(
            String month,
            BigDecimal amount
    ) {}

    /**
     * Top vendor by payment
     */
    public record VendorPayment(
            UUID vendorId,
            String vendorName,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    /**
     * Maintenance cost by property
     */
    public record PropertyMaintenanceCost(
            UUID propertyId,
            String propertyName,
            BigDecimal amount
    ) {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate startDate;
        private LocalDate endDate;
        private UUID propertyId;
        private String propertyName;
        private BigDecimal totalExpenses = BigDecimal.ZERO;
        private List<CategoryExpense> expenseByCategory = List.of();
        private List<MonthlyExpenseTrend> monthlyTrend = List.of();
        private List<VendorPayment> topVendors = List.of();
        private List<PropertyMaintenanceCost> maintenanceCostByProperty = List.of();
        private LocalDateTime generatedAt = LocalDateTime.now();

        public Builder startDate(LocalDate val) { this.startDate = val; return this; }
        public Builder endDate(LocalDate val) { this.endDate = val; return this; }
        public Builder propertyId(UUID val) { this.propertyId = val; return this; }
        public Builder propertyName(String val) { this.propertyName = val; return this; }
        public Builder totalExpenses(BigDecimal val) { this.totalExpenses = val; return this; }
        public Builder expenseByCategory(List<CategoryExpense> val) { this.expenseByCategory = val; return this; }
        public Builder monthlyTrend(List<MonthlyExpenseTrend> val) { this.monthlyTrend = val; return this; }
        public Builder topVendors(List<VendorPayment> val) { this.topVendors = val; return this; }
        public Builder maintenanceCostByProperty(List<PropertyMaintenanceCost> val) { this.maintenanceCostByProperty = val; return this; }
        public Builder generatedAt(LocalDateTime val) { this.generatedAt = val; return this; }

        public ExpenseBreakdownDto build() {
            return new ExpenseBreakdownDto(startDate, endDate, propertyId, propertyName, totalExpenses,
                    expenseByCategory, monthlyTrend, topVendors, maintenanceCostByProperty, generatedAt);
        }
    }
}
