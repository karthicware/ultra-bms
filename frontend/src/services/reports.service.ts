/**
 * Financial Reporting and Analytics API Service
 * Story 6.4: Financial Reporting and Analytics
 *
 * All financial report-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  IncomeStatement,
  IncomeStatementResponse,
  CashFlowSummary,
  CashFlowResponse,
  ARAgingReport,
  ARAgingResponse,
  RevenueBreakdown,
  RevenueBreakdownResponse,
  ExpenseBreakdownReport,
  ExpenseBreakdownResponse,
  FinancialDashboard,
  FinancialDashboardResponse,
  ReportFilter,
  ARAgingFilter,
  ExportRequest,
  EmailReportRequest,
  EmailReportResponse,
  ReportType
} from '@/types/reports';

const REPORTS_BASE_PATH = '/v1/reports';

// ============================================================================
// INCOME STATEMENT (P&L)
// ============================================================================

/**
 * Get income statement (P&L) report
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 *
 * @returns Promise that resolves to IncomeStatement with revenue/expense breakdowns
 *
 * @throws {ValidationException} When date validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks ADMIN, PROPERTY_MANAGER, or FINANCE_MANAGER role (403)
 *
 * @example
 * ```typescript
 * const pnl = await getIncomeStatement({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * console.log(`Total Revenue: ${pnl.revenueBreakdown.totalRevenue}`);
 * console.log(`Total Expenses: ${pnl.expenseBreakdown.totalExpenses}`);
 * console.log(`Net P/L: ${pnl.netProfitLoss}`);
 * console.log(`Profit Margin: ${pnl.profitMarginPercentage}%`);
 * ```
 */
export async function getIncomeStatement(params: ReportFilter): Promise<IncomeStatement> {
  const response = await apiClient.get<IncomeStatementResponse>(
    `${REPORTS_BASE_PATH}/income-statement`,
    {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        propertyId: params.propertyId
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// CASH FLOW
// ============================================================================

/**
 * Get cash flow summary report
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 *
 * @returns Promise that resolves to CashFlowSummary with inflows, outflows, and trends
 *
 * @throws {ValidationException} When date validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const cashFlow = await getCashFlow({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * console.log(`Cash Inflows: ${cashFlow.cashInflows}`);
 * console.log(`Cash Outflows: ${cashFlow.cashOutflows}`);
 * console.log(`Net Cash Flow: ${cashFlow.netCashFlow}`);
 *
 * // Month-over-month comparison chart data
 * cashFlow.monthOverMonthComparison.forEach(month => {
 *   console.log(`${month.monthLabel}: +${month.inflows} / -${month.outflows} = ${month.net}`);
 * });
 * ```
 */
export async function getCashFlow(params: ReportFilter): Promise<CashFlowSummary> {
  const response = await apiClient.get<CashFlowResponse>(
    `${REPORTS_BASE_PATH}/cash-flow`,
    {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        propertyId: params.propertyId
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// AR AGING
// ============================================================================

/**
 * Get accounts receivable aging report
 *
 * @param params - AR aging filter parameters (asOfDate defaults to today; propertyId optional)
 *
 * @returns Promise that resolves to ARAgingReport with aging buckets
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const arAging = await getARAging({
 *   asOfDate: '2024-01-31'
 * });
 *
 * console.log(`Total Outstanding: ${arAging.totalOutstanding}`);
 * console.log(`Collection Rate: ${arAging.collectionRate}%`);
 *
 * // Aging buckets for table/chart
 * arAging.agingBuckets.forEach(bucket => {
 *   console.log(`${bucket.bucketLabel}: ${bucket.count} invoices, ${bucket.amount} (${bucket.percentage}%)`);
 * });
 * ```
 */
export async function getARAging(params?: ARAgingFilter): Promise<ARAgingReport> {
  const response = await apiClient.get<ARAgingResponse>(
    `${REPORTS_BASE_PATH}/receivables-aging`,
    {
      params: {
        asOfDate: params?.asOfDate,
        propertyId: params?.propertyId
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// REVENUE BREAKDOWN
// ============================================================================

/**
 * Get revenue breakdown report with charts data
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 *
 * @returns Promise that resolves to RevenueBreakdown with all chart data
 *
 * @throws {ValidationException} When date validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const revenue = await getRevenueBreakdown({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * // Property pie chart
 * revenue.byProperty.forEach(p => {
 *   console.log(`${p.propertyName}: ${p.amount} (${p.percentage}%)`);
 * });
 *
 * // Revenue type pie chart
 * revenue.byType.forEach(t => {
 *   console.log(`${t.typeLabel}: ${t.amount} (${t.percentage}%)`);
 * });
 *
 * // Monthly trend line chart (12 months)
 * revenue.monthlyTrend.forEach(m => {
 *   console.log(`${m.monthLabel}: ${m.amount}`);
 * });
 *
 * // Year-over-year bar chart
 * revenue.yearOverYear.forEach(y => {
 *   console.log(`${y.year}: ${y.amount}`);
 * });
 * ```
 */
export async function getRevenueBreakdown(params: ReportFilter): Promise<RevenueBreakdown> {
  const response = await apiClient.get<RevenueBreakdownResponse>(
    `${REPORTS_BASE_PATH}/revenue-breakdown`,
    {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        propertyId: params.propertyId
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// EXPENSE BREAKDOWN
// ============================================================================

/**
 * Get expense breakdown report with charts data
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 *
 * @returns Promise that resolves to ExpenseBreakdownReport with all chart data
 *
 * @throws {ValidationException} When date validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const expenses = await getExpenseBreakdown({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * // Category pie chart
 * expenses.byCategory.forEach(c => {
 *   console.log(`${c.categoryLabel}: ${c.amount} (${c.percentage}%)`);
 * });
 *
 * // Monthly trend line chart
 * expenses.monthlyTrend.forEach(m => {
 *   console.log(`${m.monthLabel}: ${m.amount}`);
 * });
 *
 * // Top 5 vendors bar chart
 * expenses.topVendors.forEach(v => {
 *   console.log(`${v.vendorName}: ${v.totalPaid}`);
 * });
 *
 * // Maintenance cost by property
 * expenses.maintenanceCostByProperty.forEach(p => {
 *   console.log(`${p.propertyName}: ${p.amount}`);
 * });
 * ```
 */
export async function getExpenseBreakdown(params: ReportFilter): Promise<ExpenseBreakdownReport> {
  const response = await apiClient.get<ExpenseBreakdownResponse>(
    `${REPORTS_BASE_PATH}/expense-breakdown`,
    {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        propertyId: params.propertyId
      }
    }
  );
  return response.data.data;
}

// ============================================================================
// FINANCIAL DASHBOARD
// ============================================================================

/**
 * Get financial dashboard KPIs and insights
 *
 * @param propertyId - Optional property UUID to filter by
 *
 * @returns Promise that resolves to FinancialDashboard with KPIs and insights
 *
 * @note This endpoint is cached server-side for 1 hour. Use refreshFinancialDashboard() to clear cache.
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const dashboard = await getFinancialDashboard();
 *
 * // KPI Cards
 * console.log(`Total Revenue: ${dashboard.kpis.totalRevenue}`);
 * console.log(`Total Expenses: ${dashboard.kpis.totalExpenses}`);
 * console.log(`Net P/L: ${dashboard.kpis.netProfitLoss}`);
 * console.log(`Collection Rate: ${dashboard.kpis.collectionRate}%`);
 * console.log(`Outstanding: ${dashboard.kpis.outstandingReceivables}`);
 * console.log(`Revenue Growth: ${dashboard.kpis.revenueGrowth}%`);
 * console.log(`Expense Growth: ${dashboard.kpis.expenseGrowth}%`);
 *
 * // Insights
 * if (dashboard.insights.topPerformingProperty) {
 *   console.log(`Top Property: ${dashboard.insights.topPerformingProperty.propertyName}`);
 * }
 * if (dashboard.insights.highestExpenseCategory) {
 *   console.log(`Highest Expense: ${dashboard.insights.highestExpenseCategory.categoryLabel}`);
 * }
 * ```
 */
export async function getFinancialDashboard(propertyId?: string): Promise<FinancialDashboard> {
  const response = await apiClient.get<FinancialDashboardResponse>(
    `${REPORTS_BASE_PATH}/financial-dashboard`,
    {
      params: propertyId ? { propertyId } : undefined
    }
  );
  return response.data.data;
}

/**
 * Refresh (evict) financial dashboard cache
 *
 * @returns Promise that resolves when cache is cleared
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await refreshFinancialDashboard();
 * // Cache cleared, next getFinancialDashboard() will fetch fresh data
 * const freshData = await getFinancialDashboard();
 * ```
 */
export async function refreshFinancialDashboard(): Promise<void> {
  await apiClient.post(`${REPORTS_BASE_PATH}/financial-dashboard/refresh`);
}

// ============================================================================
// EXPORT TO PDF
// ============================================================================

/**
 * Export report to PDF
 *
 * @param params - Export request parameters (reportType, startDate, endDate, propertyId)
 *
 * @returns Promise that resolves to PDF Blob for download
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const pdfBlob = await exportPDF({
 *   reportType: ReportType.INCOME_STATEMENT,
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * // Trigger download
 * const url = URL.createObjectURL(pdfBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `income-statement_2024-01-01_2024-01-31.pdf`;
 * a.click();
 * URL.revokeObjectURL(url);
 * ```
 */
export async function exportPDF(params: ExportRequest): Promise<Blob> {
  const response = await apiClient.get(
    `${REPORTS_BASE_PATH}/export/pdf`,
    {
      params: {
        reportType: params.reportType,
        startDate: params.startDate,
        endDate: params.endDate,
        propertyId: params.propertyId
      },
      responseType: 'blob'
    }
  );
  return response.data;
}

/**
 * Helper to download PDF with proper filename
 *
 * @param params - Export request parameters
 * @param filename - Optional custom filename (will be auto-generated if not provided)
 *
 * @example
 * ```typescript
 * await downloadPDF({
 *   reportType: ReportType.CASH_FLOW,
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 * // Downloads: cash-flow_2024-01-01_2024-12-31.pdf
 * ```
 */
export async function downloadPDF(params: ExportRequest, filename?: string): Promise<void> {
  const blob = await exportPDF(params);
  const defaultFilename = `${params.reportType}_${params.startDate}_${params.endDate}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORT TO EXCEL
// ============================================================================

/**
 * Export report to Excel
 *
 * @param params - Export request parameters (reportType, startDate, endDate, propertyId)
 *
 * @returns Promise that resolves to Excel Blob for download
 *
 * @throws {ValidationException} When validation fails (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const excelBlob = await exportExcel({
 *   reportType: ReportType.AR_AGING,
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * // Trigger download
 * const url = URL.createObjectURL(excelBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `ar-aging_2024-01-01_2024-01-31.xlsx`;
 * a.click();
 * URL.revokeObjectURL(url);
 * ```
 */
export async function exportExcel(params: ExportRequest): Promise<Blob> {
  const response = await apiClient.get(
    `${REPORTS_BASE_PATH}/export/excel`,
    {
      params: {
        reportType: params.reportType,
        startDate: params.startDate,
        endDate: params.endDate,
        propertyId: params.propertyId
      },
      responseType: 'blob'
    }
  );
  return response.data;
}

/**
 * Helper to download Excel with proper filename
 *
 * @param params - Export request parameters
 * @param filename - Optional custom filename (will be auto-generated if not provided)
 *
 * @example
 * ```typescript
 * await downloadExcel({
 *   reportType: ReportType.REVENUE_BREAKDOWN,
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 * // Downloads: revenue-breakdown_2024-01-01_2024-12-31.xlsx
 * ```
 */
export async function downloadExcel(params: ExportRequest, filename?: string): Promise<void> {
  const blob = await exportExcel(params);
  const defaultFilename = `${params.reportType}_${params.startDate}_${params.endDate}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EMAIL REPORT
// ============================================================================

/**
 * Email report to specified recipients
 *
 * @param params - Email report request (reportType, dates, recipients, optional message)
 *
 * @returns Promise that resolves when email is sent
 *
 * @throws {ValidationException} When validation fails (invalid email, too many recipients) (400)
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * await emailReport({
 *   reportType: ReportType.INCOME_STATEMENT,
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   recipients: ['finance@company.com', 'manager@company.com'],
 *   message: 'Please find the monthly P&L report attached.'
 * });
 * ```
 */
export async function emailReport(params: EmailReportRequest): Promise<void> {
  await apiClient.post<EmailReportResponse>(
    `${REPORTS_BASE_PATH}/email`,
    {
      reportType: params.reportType,
      startDate: params.startDate,
      endDate: params.endDate,
      propertyId: params.propertyId,
      recipients: params.recipients,
      message: params.message
    }
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get file extension for export format
 */
export function getExportFileExtension(reportType: ReportType, format: 'pdf' | 'excel'): string {
  return format === 'pdf' ? '.pdf' : '.xlsx';
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  reportType: ReportType,
  startDate: string,
  endDate: string,
  format: 'pdf' | 'excel'
): string {
  const extension = getExportFileExtension(reportType, format);
  return `${reportType}_${startDate}_${endDate}${extension}`;
}

// ============================================================================
// REPORTS SERVICE OBJECT
// ============================================================================

/**
 * Reports service object with all methods
 * Allows both named imports and object-style access
 */
export const reportsService = {
  // Report data
  getIncomeStatement,
  getCashFlow,
  getARAging,
  getRevenueBreakdown,
  getExpenseBreakdown,
  getFinancialDashboard,
  refreshFinancialDashboard,

  // Export operations
  exportPDF,
  downloadPDF,
  exportExcel,
  downloadExcel,

  // Email
  emailReport,

  // Utilities
  getExportFileExtension,
  generateExportFilename
};
