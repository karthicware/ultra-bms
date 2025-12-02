package com.ultrabms.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Finance Dashboard data queries.
 * Provides aggregation methods for financial KPIs, charts, and summaries.
 *
 * Story 8.6: Finance Dashboard
 */
public interface FinanceDashboardRepository {

    // =================================================================
    // KPI QUERIES (AC-1 to AC-4)
    // =================================================================

    /**
     * Get total income YTD (sum of all payments received)
     *
     * @param startDate Start of the period (Jan 1 of current year)
     * @param endDate End of the period (current date)
     * @param propertyId Optional property filter
     * @return Total income in AED
     */
    BigDecimal getTotalIncomeInPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Get total expenses YTD (sum of all paid expenses)
     *
     * @param startDate Start of the period
     * @param endDate End of the period
     * @param propertyId Optional property filter
     * @return Total expenses in AED
     */
    BigDecimal getTotalExpensesInPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Get total VAT paid YTD
     *
     * @param startDate Start of the period
     * @param endDate End of the period
     * @param propertyId Optional property filter
     * @return Total VAT in AED
     */
    BigDecimal getTotalVatInPeriod(LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // CHART DATA QUERIES (AC-5, AC-6)
    // =================================================================

    /**
     * Get monthly income and expense data for the last 12 months
     * Returns: month_year, income, expenses
     *
     * @param startDate Start of 12-month period
     * @param endDate End of period
     * @param propertyId Optional property filter
     * @return List of [month_year, income, expenses]
     */
    List<Object[]> getIncomeVsExpenseByMonth(LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Get expense breakdown by category YTD
     * Returns: category, amount, count
     *
     * @param startDate Start of period
     * @param endDate End of period
     * @param propertyId Optional property filter
     * @return List of [category, amount, count]
     */
    List<Object[]> getExpensesByCategory(LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // RECEIVABLES QUERIES (AC-7)
    // =================================================================

    /**
     * Get outstanding receivables with aging breakdown
     * Returns total, current (0-30), 30+ days, 60+ days, 90+ days
     *
     * @param asOfDate Date for aging calculation
     * @param propertyId Optional property filter
     * @return List of [aging_bucket, amount, count]
     */
    List<Object[]> getOutstandingReceivablesByAging(LocalDate asOfDate, UUID propertyId);

    /**
     * Get total outstanding receivables amount
     *
     * @param asOfDate Date for calculation
     * @param propertyId Optional property filter
     * @return Total outstanding amount
     */
    BigDecimal getTotalOutstandingReceivables(LocalDate asOfDate, UUID propertyId);

    // =================================================================
    // TRANSACTIONS QUERIES (AC-8)
    // =================================================================

    /**
     * Get recent high-value transactions (income and expenses)
     * Returns: id, date, type, description, amount, category, reference_number
     *
     * @param threshold Minimum amount threshold (default 10000 AED)
     * @param limit Number of records to return
     * @param propertyId Optional property filter
     * @return List of transaction data
     */
    List<Object[]> getRecentHighValueTransactions(BigDecimal threshold, int limit, UUID propertyId);

    // =================================================================
    // PDC QUERIES (AC-9)
    // =================================================================

    /**
     * Get PDC status summary
     * Returns counts and amounts for: due this week, due this month, awaiting clearance
     *
     * @param weekEndDate End of current week
     * @param monthEndDate End of current month
     * @param propertyId Optional property filter
     * @return List of [category, count, amount]
     */
    List<Object[]> getPdcStatusSummary(LocalDate weekEndDate, LocalDate monthEndDate, UUID propertyId);

    /**
     * Get count and amount of PDCs due within a date range
     *
     * @param startDate Start date
     * @param endDate End date
     * @param propertyId Optional property filter
     * @return [count, amount]
     */
    Object[] getPdcsDueInRange(LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Get count and amount of PDCs awaiting clearance (status = DEPOSITED)
     *
     * @param propertyId Optional property filter
     * @return [count, amount]
     */
    Object[] getPdcsAwaitingClearance(UUID propertyId);
}
