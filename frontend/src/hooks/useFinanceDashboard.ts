/**
 * Finance Dashboard React Query Hooks
 * Story 8.6: Finance Dashboard
 *
 * Provides React Query hooks for finance dashboard data fetching
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { financeDashboardService } from '@/services/finance-dashboard.service';
import {
  FinanceDashboard,
  FinanceKpi,
  IncomeExpenseChartData,
  ExpenseCategoryData,
  OutstandingReceivables,
  RecentTransaction,
  PdcStatusSummary,
} from '@/types/finance-dashboard';

// Query keys for cache management
export const financeDashboardKeys = {
  all: ['financeDashboard'] as const,
  dashboard: (propertyId?: string) =>
    [...financeDashboardKeys.all, 'complete', propertyId || 'all'] as const,
  kpis: (propertyId?: string) =>
    [...financeDashboardKeys.all, 'kpis', propertyId || 'all'] as const,
  incomeVsExpense: (propertyId?: string) =>
    [...financeDashboardKeys.all, 'incomeVsExpense', propertyId || 'all'] as const,
  expenseCategories: (propertyId?: string) =>
    [...financeDashboardKeys.all, 'expenseCategories', propertyId || 'all'] as const,
  outstandingReceivables: (propertyId?: string) =>
    [...financeDashboardKeys.all, 'receivables', propertyId || 'all'] as const,
  recentTransactions: (threshold: number, propertyId?: string) =>
    [...financeDashboardKeys.all, 'transactions', threshold, propertyId || 'all'] as const,
  pdcStatus: (propertyId?: string) =>
    [...financeDashboardKeys.all, 'pdcStatus', propertyId || 'all'] as const,
};

// Default stale time (2 minutes) - coordinates with backend 5-minute cache
const DEFAULT_STALE_TIME = 2 * 60 * 1000;

/**
 * Hook for fetching complete finance dashboard data (AC-10)
 *
 * @param propertyId - Optional property filter
 * @returns Query result with complete finance dashboard
 */
export function useFinanceDashboard(
  propertyId?: string
): UseQueryResult<FinanceDashboard, Error> {
  return useQuery({
    queryKey: financeDashboardKeys.dashboard(propertyId),
    queryFn: () => financeDashboardService.getFinanceDashboard(propertyId),
    staleTime: DEFAULT_STALE_TIME,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

/**
 * Hook for fetching finance KPIs (AC-1 to AC-4)
 *
 * @param propertyId - Optional property filter
 * @returns Query result with finance KPIs
 */
export function useFinanceKpis(
  propertyId?: string
): UseQueryResult<FinanceKpi, Error> {
  return useQuery({
    queryKey: financeDashboardKeys.kpis(propertyId),
    queryFn: () => financeDashboardService.getFinanceKpis(propertyId),
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook for fetching income vs expense chart data (AC-5, AC-11)
 *
 * @param propertyId - Optional property filter
 * @returns Query result with income vs expense data
 */
export function useIncomeVsExpense(
  propertyId?: string
): UseQueryResult<IncomeExpenseChartData[], Error> {
  return useQuery({
    queryKey: financeDashboardKeys.incomeVsExpense(propertyId),
    queryFn: () => financeDashboardService.getIncomeVsExpense(propertyId),
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook for fetching expense categories breakdown (AC-6, AC-12)
 *
 * @param propertyId - Optional property filter
 * @returns Query result with expense categories
 */
export function useExpenseCategories(
  propertyId?: string
): UseQueryResult<ExpenseCategoryData[], Error> {
  return useQuery({
    queryKey: financeDashboardKeys.expenseCategories(propertyId),
    queryFn: () => financeDashboardService.getExpenseCategories(propertyId),
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook for fetching outstanding receivables (AC-7, AC-13)
 *
 * @param propertyId - Optional property filter
 * @returns Query result with outstanding receivables
 */
export function useOutstandingReceivables(
  propertyId?: string
): UseQueryResult<OutstandingReceivables, Error> {
  return useQuery({
    queryKey: financeDashboardKeys.outstandingReceivables(propertyId),
    queryFn: () => financeDashboardService.getOutstandingReceivables(propertyId),
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook for fetching recent high-value transactions (AC-8, AC-14)
 *
 * @param threshold - Minimum amount threshold (default 10000 AED)
 * @param propertyId - Optional property filter
 * @returns Query result with recent transactions
 */
export function useRecentTransactions(
  threshold: number = 10000,
  propertyId?: string
): UseQueryResult<RecentTransaction[], Error> {
  return useQuery({
    queryKey: financeDashboardKeys.recentTransactions(threshold, propertyId),
    queryFn: () => financeDashboardService.getRecentTransactions(threshold, propertyId),
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook for fetching PDC status summary (AC-9, AC-15)
 *
 * @param propertyId - Optional property filter
 * @returns Query result with PDC status summary
 */
export function usePdcStatus(
  propertyId?: string
): UseQueryResult<PdcStatusSummary, Error> {
  return useQuery({
    queryKey: financeDashboardKeys.pdcStatus(propertyId),
    queryFn: () => financeDashboardService.getPdcStatus(propertyId),
    staleTime: DEFAULT_STALE_TIME,
  });
}
