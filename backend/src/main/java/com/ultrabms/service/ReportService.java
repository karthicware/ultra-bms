package com.ultrabms.service;

import com.ultrabms.dto.reports.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service interface for Financial Reporting and Analytics.
 * Provides methods to generate various financial reports with property-level filtering.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #21: Backend service layer for report generation
 */
public interface ReportService {

    // =================================================================
    // INCOME STATEMENT / P&L REPORT
    // =================================================================

    /**
     * Generate Income Statement (P&L Report)
     * AC #1, #2: Income Statement with revenue/expense breakdown, MoM comparison
     *
     * @param startDate  Report period start date
     * @param endDate    Report period end date
     * @param propertyId Optional property filter (null for all properties)
     * @return Income statement DTO with revenue, expenses, and net income
     */
    IncomeStatementDto getIncomeStatement(LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // CASH FLOW REPORT
    // =================================================================

    /**
     * Generate Cash Flow Summary Report
     * AC #3: Cash Flow Report showing inflows, outflows, net position
     *
     * @param startDate  Report period start date
     * @param endDate    Report period end date
     * @param propertyId Optional property filter (null for all properties)
     * @return Cash flow summary DTO
     */
    CashFlowSummaryDto getCashFlowSummary(LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // ACCOUNTS RECEIVABLE AGING REPORT
    // =================================================================

    /**
     * Generate Accounts Receivable Aging Report
     * AC #4, #5: AR Aging with aging buckets and tenant drill-down
     *
     * @param asOfDate   Date to calculate aging as of
     * @param propertyId Optional property filter (null for all properties)
     * @return AR aging DTO with bucket breakdown and tenant details
     */
    ARAgingDto getARAgingReport(LocalDate asOfDate, UUID propertyId);

    // =================================================================
    // REVENUE BREAKDOWN REPORT
    // =================================================================

    /**
     * Generate Revenue Breakdown Report
     * AC #7: Revenue by property and type (rent, CAM, parking, etc.)
     *
     * @param startDate  Report period start date
     * @param endDate    Report period end date
     * @param propertyId Optional property filter (null for all properties)
     * @return Revenue breakdown DTO with multi-dimensional analysis
     */
    RevenueBreakdownDto getRevenueBreakdown(LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // EXPENSE BREAKDOWN REPORT
    // =================================================================

    /**
     * Generate Expense Breakdown Report
     * AC #8: Expense by category, vendor, and property
     *
     * @param startDate  Report period start date
     * @param endDate    Report period end date
     * @param propertyId Optional property filter (null for all properties)
     * @return Expense breakdown DTO with category and vendor analysis
     */
    ExpenseBreakdownDto getExpenseBreakdown(LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // FINANCIAL DASHBOARD
    // =================================================================

    /**
     * Get Financial Dashboard with KPIs
     * AC #6, #15, #29: Dashboard page with caching (1 hour TTL)
     *
     * @param propertyId Optional property filter (null for all properties)
     * @return Financial dashboard DTO with KPIs and insights
     */
    FinancialDashboardDto getFinancialDashboard(UUID propertyId);

    /**
     * Refresh Financial Dashboard cache
     * AC #29: Cache refresh functionality
     *
     * @param propertyId Optional property filter (null for all properties)
     * @return Fresh financial dashboard data
     */
    FinancialDashboardDto refreshFinancialDashboard(UUID propertyId);

    // =================================================================
    // EXPORT OPERATIONS
    // =================================================================

    /**
     * Export report to PDF
     * AC #16, #30: PDF export with consistent formatting
     *
     * @param reportType Type of report to export
     * @param startDate  Report period start date
     * @param endDate    Report period end date
     * @param propertyId Optional property filter
     * @return PDF file as byte array
     */
    byte[] exportToPdf(String reportType, LocalDate startDate, LocalDate endDate, UUID propertyId);

    /**
     * Export report to Excel
     * AC #17, #30: Excel export with formatted spreadsheet
     *
     * @param reportType Type of report to export
     * @param startDate  Report period start date
     * @param endDate    Report period end date
     * @param propertyId Optional property filter
     * @return Excel file as byte array
     */
    byte[] exportToExcel(String reportType, LocalDate startDate, LocalDate endDate, UUID propertyId);

    // =================================================================
    // EMAIL REPORTS
    // =================================================================

    /**
     * Email report to specified recipients
     * AC #9: Email reports functionality
     *
     * @param emailReportDto Email report request with recipients and report parameters
     */
    void emailReport(EmailReportDto emailReportDto);
}
