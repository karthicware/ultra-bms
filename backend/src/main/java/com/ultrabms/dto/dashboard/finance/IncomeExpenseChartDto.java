package com.ultrabms.dto.dashboard.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Income vs Expense chart data (AC-5)
 * Monthly data point for stacked bar chart with line overlay
 * X-axis: month, Y-axis: amount in AED
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeExpenseChartDto {

    /**
     * Month name (e.g., "Jan", "Feb", etc.)
     */
    private String month;

    /**
     * Full month-year for navigation (e.g., "2024-01")
     */
    private String monthYear;

    /**
     * Total income for the month (green stacked bar)
     * Currency: AED
     */
    private BigDecimal income;

    /**
     * Total expenses for the month (red stacked bar)
     * Currency: AED
     */
    private BigDecimal expenses;

    /**
     * Net profit/loss for the month (line overlay)
     * Calculated as: income - expenses
     * Currency: AED
     */
    private BigDecimal netProfitLoss;
}
