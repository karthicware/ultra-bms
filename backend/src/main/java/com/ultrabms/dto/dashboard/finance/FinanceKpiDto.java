package com.ultrabms.dto.dashboard.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for Finance Dashboard KPI cards (AC-1, AC-2, AC-3, AC-4)
 * Contains YTD financial metrics: Income, Expenses, Net Profit/Loss, VAT
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceKpiDto {

    /**
     * Total Income YTD (AC-1)
     * Sum of all payments received from January 1st to current date
     * Currency: AED
     */
    private BigDecimal totalIncomeYtd;

    /**
     * Total Income for same period last year
     * Used to calculate trend indicator
     */
    private BigDecimal totalIncomeLastYear;

    /**
     * Income trend percentage vs. same period last year
     * Positive = UP, Negative = DOWN, Zero = NEUTRAL
     */
    private Double incomeTrendPercentage;

    /**
     * Total Expenses YTD (AC-2)
     * Sum of all paid expenses from January 1st to current date
     * Currency: AED
     */
    private BigDecimal totalExpensesYtd;

    /**
     * Total Expenses for same period last year
     * Used to calculate trend indicator
     */
    private BigDecimal totalExpensesLastYear;

    /**
     * Expenses trend percentage vs. same period last year
     * Positive = UP (bad for expenses), Negative = DOWN (good for expenses)
     */
    private Double expensesTrendPercentage;

    /**
     * Net Profit/Loss YTD (AC-3)
     * Calculated as: totalIncomeYtd - totalExpensesYtd
     * Currency: AED
     * Positive = Profit (green), Negative = Loss (red)
     */
    private BigDecimal netProfitLossYtd;

    /**
     * Profit margin percentage (AC-3)
     * Calculated as: (netProfitLossYtd / totalIncomeYtd) * 100
     * Displayed alongside net profit/loss
     */
    private Double profitMarginPercentage;

    /**
     * VAT Paid YTD (AC-4)
     * Sum of VAT amounts from all transactions
     * Currency: AED
     */
    private BigDecimal vatPaidYtd;

    /**
     * VAT Paid for same period last year
     * Used to calculate trend indicator
     */
    private BigDecimal vatPaidLastYear;

    /**
     * VAT trend percentage vs. same period last year
     */
    private Double vatTrendPercentage;
}
