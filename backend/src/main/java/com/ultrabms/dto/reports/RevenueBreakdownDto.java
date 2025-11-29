package com.ultrabms.dto.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Revenue Breakdown report data.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #7: Revenue Breakdown page at /finance/reports/revenue
 * AC #13: Backend API for revenue breakdown data
 */
public record RevenueBreakdownDto(
        LocalDate startDate,
        LocalDate endDate,
        UUID propertyId,
        String propertyName,
        BigDecimal totalRevenue,
        List<PropertyRevenue> revenueByProperty,
        List<TypeRevenue> revenueByType,
        List<MonthlyRevenueTrend> monthlyTrend,
        List<YearOverYearRevenue> yearOverYearComparison,
        LocalDateTime generatedAt
) {
    /**
     * Revenue by property
     */
    public record PropertyRevenue(
            UUID propertyId,
            String propertyName,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    /**
     * Revenue by type
     */
    public record TypeRevenue(
            String type,
            String typeLabel,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    /**
     * Monthly revenue trend
     */
    public record MonthlyRevenueTrend(
            String month,
            BigDecimal amount
    ) {}

    /**
     * Year-over-year revenue
     */
    public record YearOverYearRevenue(
            int year,
            BigDecimal amount,
            BigDecimal change
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
        private List<PropertyRevenue> revenueByProperty = List.of();
        private List<TypeRevenue> revenueByType = List.of();
        private List<MonthlyRevenueTrend> monthlyTrend = List.of();
        private List<YearOverYearRevenue> yearOverYearComparison = List.of();
        private LocalDateTime generatedAt = LocalDateTime.now();

        public Builder startDate(LocalDate val) { this.startDate = val; return this; }
        public Builder endDate(LocalDate val) { this.endDate = val; return this; }
        public Builder propertyId(UUID val) { this.propertyId = val; return this; }
        public Builder propertyName(String val) { this.propertyName = val; return this; }
        public Builder totalRevenue(BigDecimal val) { this.totalRevenue = val; return this; }
        public Builder revenueByProperty(List<PropertyRevenue> val) { this.revenueByProperty = val; return this; }
        public Builder revenueByType(List<TypeRevenue> val) { this.revenueByType = val; return this; }
        public Builder monthlyTrend(List<MonthlyRevenueTrend> val) { this.monthlyTrend = val; return this; }
        public Builder yearOverYearComparison(List<YearOverYearRevenue> val) { this.yearOverYearComparison = val; return this; }
        public Builder generatedAt(LocalDateTime val) { this.generatedAt = val; return this; }

        public RevenueBreakdownDto build() {
            return new RevenueBreakdownDto(startDate, endDate, propertyId, propertyName, totalRevenue,
                    revenueByProperty, revenueByType, monthlyTrend, yearOverYearComparison, generatedAt);
        }
    }
}
