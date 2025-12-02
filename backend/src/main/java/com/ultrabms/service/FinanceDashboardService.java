package com.ultrabms.service;

import com.ultrabms.dto.dashboard.finance.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Finance Dashboard operations.
 * Provides methods for financial KPIs, charts, and summaries.
 *
 * Story 8.6: Finance Dashboard
 */
public interface FinanceDashboardService {

    /**
     * Get complete finance dashboard data (AC-10)
     *
     * @param propertyId Optional property filter
     * @return Complete finance dashboard DTO
     */
    FinanceDashboardDto getFinanceDashboard(UUID propertyId);

    /**
     * Get finance KPIs (AC-1, AC-2, AC-3, AC-4)
     *
     * @param propertyId Optional property filter
     * @return Finance KPI DTO with YTD metrics
     */
    FinanceKpiDto getFinanceKpis(UUID propertyId);

    /**
     * Get income vs expense chart data (AC-5, AC-11)
     *
     * @param propertyId Optional property filter
     * @return List of monthly income vs expense data
     */
    List<IncomeExpenseChartDto> getIncomeVsExpense(UUID propertyId);

    /**
     * Get expense categories breakdown (AC-6, AC-12)
     *
     * @param propertyId Optional property filter
     * @return List of expense categories with amounts
     */
    List<ExpenseCategoryDto> getExpenseCategories(UUID propertyId);

    /**
     * Get outstanding receivables summary (AC-7, AC-13)
     *
     * @param propertyId Optional property filter
     * @return Outstanding receivables with aging breakdown
     */
    OutstandingReceivablesDto getOutstandingReceivables(UUID propertyId);

    /**
     * Get recent high-value transactions (AC-8, AC-14)
     *
     * @param threshold Minimum amount threshold (default 10000 AED)
     * @param propertyId Optional property filter
     * @return List of recent high-value transactions
     */
    List<RecentTransactionDto> getRecentTransactions(BigDecimal threshold, UUID propertyId);

    /**
     * Get PDC status summary (AC-9, AC-15)
     *
     * @param propertyId Optional property filter
     * @return PDC status summary DTO
     */
    PdcStatusSummaryDto getPdcStatus(UUID propertyId);
}
