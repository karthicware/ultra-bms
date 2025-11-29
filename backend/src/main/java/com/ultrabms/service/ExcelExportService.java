package com.ultrabms.service;

import com.ultrabms.dto.reports.*;

/**
 * Service interface for Excel report export.
 *
 * Story 6.4: Financial Reporting and Analytics
 * AC #17: Excel export for reports
 */
public interface ExcelExportService {

    /**
     * Generate Income Statement Excel report
     *
     * @param incomeStatement Income statement data
     * @return Excel file as byte array
     */
    byte[] generateIncomeStatementExcel(IncomeStatementDto incomeStatement);

    /**
     * Generate Cash Flow Summary Excel report
     *
     * @param cashFlow Cash flow summary data
     * @return Excel file as byte array
     */
    byte[] generateCashFlowExcel(CashFlowSummaryDto cashFlow);

    /**
     * Generate AR Aging Excel report
     *
     * @param arAging AR aging data
     * @return Excel file as byte array
     */
    byte[] generateARAgingExcel(ARAgingDto arAging);

    /**
     * Generate Revenue Breakdown Excel report
     *
     * @param revenueBreakdown Revenue breakdown data
     * @return Excel file as byte array
     */
    byte[] generateRevenueBreakdownExcel(RevenueBreakdownDto revenueBreakdown);

    /**
     * Generate Expense Breakdown Excel report
     *
     * @param expenseBreakdown Expense breakdown data
     * @return Excel file as byte array
     */
    byte[] generateExpenseBreakdownExcel(ExpenseBreakdownDto expenseBreakdown);

    /**
     * Generate Financial Dashboard Excel report
     *
     * @param dashboard Financial dashboard data
     * @return Excel file as byte array
     */
    byte[] generateFinancialDashboardExcel(FinancialDashboardDto dashboard);
}
