/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Financial Reporting and Analytics
 * Story 6.4: Financial Reporting and Analytics
 *
 * Provides hooks for fetching reports, exporting to PDF/Excel, and emailing reports
 * with automatic cache invalidation and stale time configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getIncomeStatement,
  getCashFlow,
  getARAging,
  getRevenueBreakdown,
  getExpenseBreakdown,
  getFinancialDashboard,
  refreshFinancialDashboard,
  exportPDF,
  downloadPDF,
  exportExcel,
  downloadExcel,
  emailReport,
  generateExportFilename
} from '@/services/reports.service';
import type {
  IncomeStatement,
  CashFlowSummary,
  ARAgingReport,
  RevenueBreakdown,
  ExpenseBreakdownReport,
  FinancialDashboard,
  ReportFilter,
  ARAgingFilter,
  ExportRequest,
  EmailReportRequest,
  ReportType
} from '@/types/reports';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const reportKeys = {
  all: ['reports'] as const,
  incomeStatement: (params: ReportFilter) => [...reportKeys.all, 'income-statement', params] as const,
  cashFlow: (params: ReportFilter) => [...reportKeys.all, 'cash-flow', params] as const,
  arAging: (params?: ARAgingFilter) => [...reportKeys.all, 'ar-aging', params] as const,
  revenueBreakdown: (params: ReportFilter) => [...reportKeys.all, 'revenue-breakdown', params] as const,
  expenseBreakdown: (params: ReportFilter) => [...reportKeys.all, 'expense-breakdown', params] as const,
  financialDashboard: (propertyId?: string) => [...reportKeys.all, 'financial-dashboard', propertyId] as const
};

// ============================================================================
// INCOME STATEMENT HOOK
// ============================================================================

/**
 * Hook to fetch income statement (P&L) report
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with income statement data
 *
 * @example
 * ```typescript
 * const { data: pnl, isLoading, error } = useIncomeStatement({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * if (isLoading) return <ReportSkeleton />;
 *
 * return (
 *   <IncomeStatementReport
 *     revenue={pnl.revenueBreakdown}
 *     expenses={pnl.expenseBreakdown}
 *     netProfitLoss={pnl.netProfitLoss}
 *   />
 * );
 * ```
 */
export function useIncomeStatement(params: ReportFilter, enabled: boolean = true) {
  return useQuery<IncomeStatement>({
    queryKey: reportKeys.incomeStatement(params),
    queryFn: () => getIncomeStatement(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!params.startDate && !!params.endDate
  });
}

// ============================================================================
// CASH FLOW HOOK
// ============================================================================

/**
 * Hook to fetch cash flow summary report
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with cash flow data
 *
 * @example
 * ```typescript
 * const { data: cashFlow, isLoading } = useCashFlow({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * return (
 *   <CashFlowChart
 *     inflows={cashFlow.cashInflows}
 *     outflows={cashFlow.cashOutflows}
 *     monthlyData={cashFlow.monthOverMonthComparison}
 *   />
 * );
 * ```
 */
export function useCashFlow(params: ReportFilter, enabled: boolean = true) {
  return useQuery<CashFlowSummary>({
    queryKey: reportKeys.cashFlow(params),
    queryFn: () => getCashFlow(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!params.startDate && !!params.endDate
  });
}

// ============================================================================
// AR AGING HOOK
// ============================================================================

/**
 * Hook to fetch accounts receivable aging report
 *
 * @param params - AR aging filter parameters (asOfDate defaults to today; propertyId optional)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with AR aging data
 *
 * @example
 * ```typescript
 * const { data: arAging, isLoading } = useARAging({
 *   asOfDate: '2024-01-31'
 * });
 *
 * return (
 *   <AgingTable
 *     buckets={arAging.agingBuckets}
 *     totalOutstanding={arAging.totalOutstanding}
 *     collectionRate={arAging.collectionRate}
 *   />
 * );
 * ```
 */
export function useARAging(params?: ARAgingFilter, enabled: boolean = true) {
  return useQuery<ARAgingReport>({
    queryKey: reportKeys.arAging(params),
    queryFn: () => getARAging(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// REVENUE BREAKDOWN HOOK
// ============================================================================

/**
 * Hook to fetch revenue breakdown report
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with revenue breakdown data
 *
 * @example
 * ```typescript
 * const { data: revenue, isLoading } = useRevenueBreakdown({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * return (
 *   <>
 *     <PropertyRevenueChart data={revenue.byProperty} />
 *     <RevenueTypeChart data={revenue.byType} />
 *     <MonthlyTrendChart data={revenue.monthlyTrend} />
 *     <YearOverYearChart data={revenue.yearOverYear} />
 *   </>
 * );
 * ```
 */
export function useRevenueBreakdown(params: ReportFilter, enabled: boolean = true) {
  return useQuery<RevenueBreakdown>({
    queryKey: reportKeys.revenueBreakdown(params),
    queryFn: () => getRevenueBreakdown(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!params.startDate && !!params.endDate
  });
}

// ============================================================================
// EXPENSE BREAKDOWN HOOK
// ============================================================================

/**
 * Hook to fetch expense breakdown report
 *
 * @param params - Report filter parameters (startDate, endDate required; propertyId optional)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expense breakdown data
 *
 * @example
 * ```typescript
 * const { data: expenses, isLoading } = useExpenseBreakdown({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * return (
 *   <>
 *     <CategoryExpenseChart data={expenses.byCategory} />
 *     <MonthlyExpenseTrendChart data={expenses.monthlyTrend} />
 *     <TopVendorsChart data={expenses.topVendors} />
 *     <MaintenanceCostChart data={expenses.maintenanceCostByProperty} />
 *   </>
 * );
 * ```
 */
export function useExpenseBreakdown(params: ReportFilter, enabled: boolean = true) {
  return useQuery<ExpenseBreakdownReport>({
    queryKey: reportKeys.expenseBreakdown(params),
    queryFn: () => getExpenseBreakdown(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!params.startDate && !!params.endDate
  });
}

// ============================================================================
// FINANCIAL DASHBOARD HOOK
// ============================================================================

/**
 * Hook to fetch financial dashboard KPIs and insights
 *
 * @param propertyId - Optional property UUID to filter by
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with financial dashboard data
 *
 * @note Server-side cached for 1 hour. Use useRefreshFinancialDashboard() to clear cache.
 *
 * @example
 * ```typescript
 * const { data: dashboard, isLoading, refetch } = useFinancialDashboard();
 * const { mutate: refresh, isPending: isRefreshing } = useRefreshFinancialDashboard();
 *
 * return (
 *   <FinancialDashboard
 *     kpis={dashboard.kpis}
 *     insights={dashboard.insights}
 *     onRefresh={() => refresh(undefined, { onSuccess: () => refetch() })}
 *     isRefreshing={isRefreshing}
 *   />
 * );
 * ```
 */
export function useFinancialDashboard(propertyId?: string, enabled: boolean = true) {
  return useQuery<FinancialDashboard>({
    queryKey: reportKeys.financialDashboard(propertyId),
    queryFn: () => getFinancialDashboard(propertyId),
    staleTime: 60 * 60 * 1000, // 1 hour (matches server cache)
    enabled
  });
}

// ============================================================================
// REFRESH FINANCIAL DASHBOARD HOOK
// ============================================================================

/**
 * Hook to refresh (evict) financial dashboard cache
 *
 * @returns UseMutationResult for refreshing dashboard cache
 *
 * @example
 * ```typescript
 * const { mutate: refresh, isPending } = useRefreshFinancialDashboard();
 *
 * <Button onClick={() => refresh()} disabled={isPending}>
 *   {isPending ? 'Refreshing...' : 'Refresh Dashboard'}
 * </Button>
 * ```
 */
export function useRefreshFinancialDashboard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: refreshFinancialDashboard,
    onSuccess: () => {
      // Invalidate all financial dashboard queries
      queryClient.invalidateQueries({
        queryKey: reportKeys.all
      });
      toast.success('Dashboard data refreshed!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to refresh dashboard';
      toast.error(message);
    }
  });
}

// ============================================================================
// EXPORT PDF HOOK
// ============================================================================

/**
 * Hook to export report to PDF
 *
 * @returns UseMutationResult for PDF export
 *
 * @example
 * ```typescript
 * const { mutate: exportPDF, isPending } = useExportPDF();
 *
 * const handleExport = () => {
 *   exportPDF({
 *     reportType: ReportType.INCOME_STATEMENT,
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31'
 *   });
 * };
 * ```
 */
export function useExportPDF() {
  return useMutation<void, Error, ExportRequest>({
    mutationFn: (params) => downloadPDF(params),
    onSuccess: (_, params) => {
      toast.success('PDF downloaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export PDF';
      toast.error(message);
    }
  });
}

/**
 * Hook to get PDF blob (for custom handling)
 *
 * @returns UseMutationResult with PDF Blob
 */
export function useExportPDFBlob() {
  return useMutation<Blob, Error, ExportRequest>({
    mutationFn: exportPDF,
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export PDF';
      toast.error(message);
    }
  });
}

// ============================================================================
// EXPORT EXCEL HOOK
// ============================================================================

/**
 * Hook to export report to Excel
 *
 * @returns UseMutationResult for Excel export
 *
 * @example
 * ```typescript
 * const { mutate: exportExcel, isPending } = useExportExcel();
 *
 * const handleExport = () => {
 *   exportExcel({
 *     reportType: ReportType.AR_AGING,
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31'
 *   });
 * };
 * ```
 */
export function useExportExcel() {
  return useMutation<void, Error, ExportRequest>({
    mutationFn: (params) => downloadExcel(params),
    onSuccess: () => {
      toast.success('Excel file downloaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export Excel';
      toast.error(message);
    }
  });
}

/**
 * Hook to get Excel blob (for custom handling)
 *
 * @returns UseMutationResult with Excel Blob
 */
export function useExportExcelBlob() {
  return useMutation<Blob, Error, ExportRequest>({
    mutationFn: exportExcel,
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export Excel';
      toast.error(message);
    }
  });
}

// ============================================================================
// EMAIL REPORT HOOK
// ============================================================================

/**
 * Hook to email report to recipients
 *
 * @returns UseMutationResult for emailing report
 *
 * @example
 * ```typescript
 * const { mutate: sendEmail, isPending } = useEmailReport();
 *
 * const handleSendEmail = (recipients: string[], message?: string) => {
 *   sendEmail({
 *     reportType: ReportType.INCOME_STATEMENT,
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31',
 *     recipients,
 *     message
 *   });
 * };
 * ```
 */
export function useEmailReport() {
  return useMutation<void, Error, EmailReportRequest>({
    mutationFn: emailReport,
    onSuccess: (_, params) => {
      const recipientCount = params.recipients.length;
      toast.success(`Report sent to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send email';
      toast.error(message);
    }
  });
}

// ============================================================================
// COMBINED EXPORT HOOK
// ============================================================================

/**
 * Combined hook for all export operations
 *
 * @returns Object with PDF, Excel, and email mutation functions
 *
 * @example
 * ```typescript
 * const { exportPDF, exportExcel, sendEmail, isExporting } = useReportExport();
 *
 * return (
 *   <ExportDropdown
 *     onPDF={() => exportPDF(params)}
 *     onExcel={() => exportExcel(params)}
 *     onEmail={(recipients) => sendEmail({ ...params, recipients })}
 *     disabled={isExporting}
 *   />
 * );
 * ```
 */
export function useReportExport() {
  const pdfMutation = useExportPDF();
  const excelMutation = useExportExcel();
  const emailMutation = useEmailReport();

  return {
    exportPDF: pdfMutation.mutate,
    exportPDFAsync: pdfMutation.mutateAsync,
    isPDFExporting: pdfMutation.isPending,

    exportExcel: excelMutation.mutate,
    exportExcelAsync: excelMutation.mutateAsync,
    isExcelExporting: excelMutation.isPending,

    sendEmail: emailMutation.mutate,
    sendEmailAsync: emailMutation.mutateAsync,
    isEmailSending: emailMutation.isPending,

    isExporting: pdfMutation.isPending || excelMutation.isPending || emailMutation.isPending
  };
}

// ============================================================================
// PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch income statement for faster navigation
 */
export async function prefetchIncomeStatement(
  queryClient: ReturnType<typeof useQueryClient>,
  params: ReportFilter
) {
  await queryClient.prefetchQuery({
    queryKey: reportKeys.incomeStatement(params),
    queryFn: () => getIncomeStatement(params),
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Prefetch cash flow for faster navigation
 */
export async function prefetchCashFlow(
  queryClient: ReturnType<typeof useQueryClient>,
  params: ReportFilter
) {
  await queryClient.prefetchQuery({
    queryKey: reportKeys.cashFlow(params),
    queryFn: () => getCashFlow(params),
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Prefetch AR aging for faster navigation
 */
export async function prefetchARAging(
  queryClient: ReturnType<typeof useQueryClient>,
  params?: ARAgingFilter
) {
  await queryClient.prefetchQuery({
    queryKey: reportKeys.arAging(params),
    queryFn: () => getARAging(params),
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Prefetch financial dashboard for faster navigation
 */
export async function prefetchFinancialDashboard(
  queryClient: ReturnType<typeof useQueryClient>,
  propertyId?: string
) {
  await queryClient.prefetchQuery({
    queryKey: reportKeys.financialDashboard(propertyId),
    queryFn: () => getFinancialDashboard(propertyId),
    staleTime: 60 * 60 * 1000
  });
}

// ============================================================================
// INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate all report caches (use after significant data changes)
 */
export function invalidateAllReports(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: reportKeys.all });
}

/**
 * Invalidate specific report cache
 */
export function invalidateReport(
  queryClient: ReturnType<typeof useQueryClient>,
  reportType: ReportType,
  params: ReportFilter | ARAgingFilter
) {
  switch (reportType) {
    case 'income-statement':
      queryClient.invalidateQueries({ queryKey: reportKeys.incomeStatement(params as ReportFilter) });
      break;
    case 'cash-flow':
      queryClient.invalidateQueries({ queryKey: reportKeys.cashFlow(params as ReportFilter) });
      break;
    case 'receivables-aging':
      queryClient.invalidateQueries({ queryKey: reportKeys.arAging(params as ARAgingFilter) });
      break;
    case 'revenue-breakdown':
      queryClient.invalidateQueries({ queryKey: reportKeys.revenueBreakdown(params as ReportFilter) });
      break;
    case 'expense-breakdown':
      queryClient.invalidateQueries({ queryKey: reportKeys.expenseBreakdown(params as ReportFilter) });
      break;
    case 'financial-dashboard':
      queryClient.invalidateQueries({ queryKey: reportKeys.financialDashboard() });
      break;
  }
}
