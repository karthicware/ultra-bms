/**
 * Finance Dashboard API Service
 * Story 8.6: Finance Dashboard
 *
 * Provides API client methods for finance dashboard endpoints
 */

import { apiClient } from '@/lib/api';
import {
  FinanceDashboard,
  FinanceKpi,
  IncomeExpenseChartData,
  ExpenseCategoryData,
  OutstandingReceivables,
  RecentTransaction,
  PdcStatusSummary,
} from '@/types/finance-dashboard';

const BASE_URL = '/api/v1/dashboard/finance';

/**
 * Finance Dashboard Service
 * API client methods for all finance dashboard endpoints
 */
export const financeDashboardService = {
  /**
   * Get complete finance dashboard data (AC-10)
   *
   * @param propertyId - Optional property filter
   * @returns Complete finance dashboard DTO
   */
  async getFinanceDashboard(propertyId?: string): Promise<FinanceDashboard> {
    const params = propertyId ? { propertyId } : {};
    const response = await apiClient.get<FinanceDashboard>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get finance KPIs (AC-1 to AC-4)
   * This is a convenience method - KPIs are also included in getFinanceDashboard
   *
   * @param propertyId - Optional property filter
   * @returns Finance KPI DTO
   */
  async getFinanceKpis(propertyId?: string): Promise<FinanceKpi> {
    const dashboard = await this.getFinanceDashboard(propertyId);
    return dashboard.kpis;
  },

  /**
   * Get income vs expense chart data (AC-5, AC-11)
   *
   * @param propertyId - Optional property filter
   * @returns List of monthly income vs expense data
   */
  async getIncomeVsExpense(propertyId?: string): Promise<IncomeExpenseChartData[]> {
    const params = propertyId ? { propertyId } : {};
    const response = await apiClient.get<IncomeExpenseChartData[]>(
      `${BASE_URL}/income-vs-expense`,
      { params }
    );
    return response.data;
  },

  /**
   * Get expense categories breakdown (AC-6, AC-12)
   *
   * @param propertyId - Optional property filter
   * @returns List of expense categories with amounts
   */
  async getExpenseCategories(propertyId?: string): Promise<ExpenseCategoryData[]> {
    const params = propertyId ? { propertyId } : {};
    const response = await apiClient.get<ExpenseCategoryData[]>(
      `${BASE_URL}/expense-categories`,
      { params }
    );
    return response.data;
  },

  /**
   * Get outstanding receivables summary (AC-7, AC-13)
   *
   * @param propertyId - Optional property filter
   * @returns Outstanding receivables with aging breakdown
   */
  async getOutstandingReceivables(propertyId?: string): Promise<OutstandingReceivables> {
    const params = propertyId ? { propertyId } : {};
    const response = await apiClient.get<OutstandingReceivables>(
      `${BASE_URL}/outstanding-receivables`,
      { params }
    );
    return response.data;
  },

  /**
   * Get recent high-value transactions (AC-8, AC-14)
   *
   * @param threshold - Minimum amount threshold (default 10000 AED)
   * @param propertyId - Optional property filter
   * @returns List of recent high-value transactions
   */
  async getRecentTransactions(
    threshold: number = 10000,
    propertyId?: string
  ): Promise<RecentTransaction[]> {
    const params: Record<string, string | number> = { threshold };
    if (propertyId) {
      params.propertyId = propertyId;
    }
    const response = await apiClient.get<RecentTransaction[]>(
      `${BASE_URL}/recent-transactions`,
      { params }
    );
    return response.data;
  },

  /**
   * Get PDC status summary (AC-9, AC-15)
   *
   * @param propertyId - Optional property filter
   * @returns PDC status summary DTO
   */
  async getPdcStatus(propertyId?: string): Promise<PdcStatusSummary> {
    const params = propertyId ? { propertyId } : {};
    const response = await apiClient.get<PdcStatusSummary>(
      `${BASE_URL}/pdc-status`,
      { params }
    );
    return response.data;
  },
};

export default financeDashboardService;
