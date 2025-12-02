package com.ultrabms.dto.dashboard.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Complete Finance Dashboard response DTO (AC-10)
 * Aggregates all dashboard components for GET /api/v1/dashboard/finance
 *
 * Story 8.6: Finance Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceDashboardDto {

    /**
     * KPI cards data (AC-1, AC-2, AC-3, AC-4)
     * Total Income YTD, Total Expenses YTD, Net Profit/Loss YTD, VAT Paid YTD
     */
    private FinanceKpiDto kpis;

    /**
     * Income vs Expense chart data (AC-5)
     * Last 12 months of income, expenses, and net profit/loss
     */
    private List<IncomeExpenseChartDto> incomeVsExpense;

    /**
     * Expense categories for donut chart (AC-6)
     * Segments: Maintenance, Utilities, Salaries, Insurance, Other
     */
    private List<ExpenseCategoryDto> expenseCategories;

    /**
     * Outstanding receivables summary (AC-7)
     * Total outstanding with aging breakdown
     */
    private OutstandingReceivablesDto outstandingReceivables;

    /**
     * Recent high-value transactions (AC-8)
     * Last 10 transactions above threshold (default 10,000 AED)
     */
    private List<RecentTransactionDto> recentTransactions;

    /**
     * PDC status summary (AC-9)
     * Due this week, due this month, awaiting clearance
     */
    private PdcStatusSummaryDto pdcStatus;
}
