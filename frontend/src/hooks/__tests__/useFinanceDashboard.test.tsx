/**
 * Unit tests for useFinanceDashboard hooks
 * Story 8.6: Finance Dashboard
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useFinanceDashboard,
  useFinanceKpis,
  useIncomeVsExpense,
  useExpenseCategories,
  useOutstandingReceivables,
  useRecentTransactions,
  usePdcStatus,
  financeDashboardKeys,
} from '../useFinanceDashboard';
import { financeDashboardService } from '@/services/finance-dashboard.service';
import type {
  FinanceDashboard,
  FinanceKpi,
  IncomeExpenseChartData,
  ExpenseCategoryData,
  OutstandingReceivables,
  RecentTransaction,
  PdcStatusSummary,
} from '@/types/finance-dashboard';
import { TransactionType } from '@/types/finance-dashboard';
import { ExpenseCategory } from '@/types/expense';

// Mock the service
jest.mock('@/services/finance-dashboard.service');

const mockService = financeDashboardService as jest.Mocked<typeof financeDashboardService>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

describe('useFinanceDashboard hooks', () => {
  const mockKpis: FinanceKpi = {
    totalIncomeYtd: 5000000,
    totalIncomeLastYear: 4500000,
    incomeTrendPercentage: 11.1,
    totalExpensesYtd: 3500000,
    totalExpensesLastYear: 3200000,
    expensesTrendPercentage: 9.4,
    netProfitLossYtd: 1500000,
    profitMarginPercentage: 30.0,
    vatPaidYtd: 250000,
    vatPaidLastYear: 225000,
    vatTrendPercentage: 11.1,
  };

  const mockIncomeVsExpense: IncomeExpenseChartData[] = [
    {
      month: 'Jan',
      monthYear: '2024-01',
      income: 400000,
      expenses: 280000,
      netProfitLoss: 120000,
    },
    {
      month: 'Feb',
      monthYear: '2024-02',
      income: 420000,
      expenses: 300000,
      netProfitLoss: 120000,
    },
  ];

  const mockExpenseCategories: ExpenseCategoryData[] = [
    {
      category: ExpenseCategory.MAINTENANCE,
      categoryName: 'Maintenance',
      amount: 1200000,
      percentage: 34.3,
      count: 150,
    },
    {
      category: ExpenseCategory.UTILITIES,
      categoryName: 'Utilities',
      amount: 800000,
      percentage: 22.9,
      count: 100,
    },
  ];

  const mockOutstandingReceivables: OutstandingReceivables = {
    totalOutstanding: 750000,
    totalInvoiceCount: 45,
    currentAmount: 400000,
    currentCount: 25,
    thirtyPlusAmount: 200000,
    thirtyPlusCount: 12,
    sixtyPlusAmount: 100000,
    sixtyPlusCount: 5,
    ninetyPlusAmount: 50000,
    ninetyPlusCount: 3,
    currentPercentage: 53.3,
    thirtyPlusPercentage: 26.7,
    sixtyPlusPercentage: 13.3,
    ninetyPlusPercentage: 6.7,
  };

  const mockRecentTransactions: RecentTransaction[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      date: '2024-01-15',
      type: TransactionType.INCOME,
      description: 'Rent Collection - January',
      amount: 50000,
      category: 'Rent',
      referenceNumber: 'INV-2024-001',
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      date: '2024-01-14',
      type: TransactionType.EXPENSE,
      description: 'HVAC Maintenance',
      amount: 15000,
      category: 'Maintenance',
      referenceNumber: 'EXP-2024-001',
    },
  ];

  const mockPdcStatus: PdcStatusSummary = {
    dueThisWeekCount: 3,
    dueThisWeekAmount: 45000,
    dueThisMonthCount: 12,
    dueThisMonthAmount: 180000,
    awaitingClearanceCount: 5,
    awaitingClearanceAmount: 75000,
    totalPdcsCount: 35,
    totalPdcsAmount: 525000,
  };

  const mockDashboardData: FinanceDashboard = {
    kpis: mockKpis,
    incomeVsExpense: mockIncomeVsExpense,
    expenseCategories: mockExpenseCategories,
    outstandingReceivables: mockOutstandingReceivables,
    recentTransactions: mockRecentTransactions,
    pdcStatus: mockPdcStatus,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('financeDashboardKeys', () => {
    it('should generate correct query keys', () => {
      expect(financeDashboardKeys.all).toEqual(['financeDashboard']);
      expect(financeDashboardKeys.dashboard()).toEqual(['financeDashboard', 'complete', 'all']);
      expect(financeDashboardKeys.dashboard('prop-123')).toEqual([
        'financeDashboard',
        'complete',
        'prop-123',
      ]);
      expect(financeDashboardKeys.kpis()).toEqual(['financeDashboard', 'kpis', 'all']);
      expect(financeDashboardKeys.kpis('prop-123')).toEqual([
        'financeDashboard',
        'kpis',
        'prop-123',
      ]);
      expect(financeDashboardKeys.incomeVsExpense()).toEqual([
        'financeDashboard',
        'incomeVsExpense',
        'all',
      ]);
      expect(financeDashboardKeys.expenseCategories()).toEqual([
        'financeDashboard',
        'expenseCategories',
        'all',
      ]);
      expect(financeDashboardKeys.outstandingReceivables()).toEqual([
        'financeDashboard',
        'receivables',
        'all',
      ]);
      expect(financeDashboardKeys.recentTransactions(10000)).toEqual([
        'financeDashboard',
        'transactions',
        10000,
        'all',
      ]);
      expect(financeDashboardKeys.pdcStatus()).toEqual(['financeDashboard', 'pdcStatus', 'all']);
    });
  });

  describe('useFinanceDashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      mockService.getFinanceDashboard.mockResolvedValue(mockDashboardData);

      const { result } = renderHook(() => useFinanceDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData);
      expect(mockService.getFinanceDashboard).toHaveBeenCalledWith(undefined);
    });

    it('should fetch dashboard data with property filter', async () => {
      mockService.getFinanceDashboard.mockResolvedValue(mockDashboardData);

      const { result } = renderHook(() => useFinanceDashboard('prop-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.getFinanceDashboard).toHaveBeenCalledWith('prop-123');
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch finance dashboard');
      mockService.getFinanceDashboard.mockRejectedValue(error);

      const { result } = renderHook(() => useFinanceDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe('useFinanceKpis', () => {
    it('should fetch KPIs successfully', async () => {
      mockService.getFinanceKpis.mockResolvedValue(mockKpis);

      const { result } = renderHook(() => useFinanceKpis(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockKpis);
    });

    it('should fetch KPIs with property filter', async () => {
      mockService.getFinanceKpis.mockResolvedValue(mockKpis);

      const { result } = renderHook(() => useFinanceKpis('prop-456'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.getFinanceKpis).toHaveBeenCalledWith('prop-456');
    });
  });

  describe('useIncomeVsExpense', () => {
    it('should fetch income vs expense data', async () => {
      mockService.getIncomeVsExpense.mockResolvedValue(mockIncomeVsExpense);

      const { result } = renderHook(() => useIncomeVsExpense(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockIncomeVsExpense);
      expect(mockService.getIncomeVsExpense).toHaveBeenCalledWith(undefined);
    });
  });

  describe('useExpenseCategories', () => {
    it('should fetch expense categories', async () => {
      mockService.getExpenseCategories.mockResolvedValue(mockExpenseCategories);

      const { result } = renderHook(() => useExpenseCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockExpenseCategories);
    });
  });

  describe('useOutstandingReceivables', () => {
    it('should fetch outstanding receivables', async () => {
      mockService.getOutstandingReceivables.mockResolvedValue(mockOutstandingReceivables);

      const { result } = renderHook(() => useOutstandingReceivables(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockOutstandingReceivables);
    });
  });

  describe('useRecentTransactions', () => {
    it('should fetch recent transactions with default threshold', async () => {
      mockService.getRecentTransactions.mockResolvedValue(mockRecentTransactions);

      const { result } = renderHook(() => useRecentTransactions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecentTransactions);
      expect(mockService.getRecentTransactions).toHaveBeenCalledWith(10000, undefined);
    });

    it('should fetch with custom threshold', async () => {
      mockService.getRecentTransactions.mockResolvedValue(mockRecentTransactions);

      const { result } = renderHook(() => useRecentTransactions(50000), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.getRecentTransactions).toHaveBeenCalledWith(50000, undefined);
    });

    it('should fetch with property filter', async () => {
      mockService.getRecentTransactions.mockResolvedValue(mockRecentTransactions);

      const { result } = renderHook(() => useRecentTransactions(10000, 'prop-789'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.getRecentTransactions).toHaveBeenCalledWith(10000, 'prop-789');
    });
  });

  describe('usePdcStatus', () => {
    it('should fetch PDC status', async () => {
      mockService.getPdcStatus.mockResolvedValue(mockPdcStatus);

      const { result } = renderHook(() => usePdcStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPdcStatus);
    });

    it('should fetch PDC status with property filter', async () => {
      mockService.getPdcStatus.mockResolvedValue(mockPdcStatus);

      const { result } = renderHook(() => usePdcStatus('prop-999'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.getPdcStatus).toHaveBeenCalledWith('prop-999');
    });
  });
});
