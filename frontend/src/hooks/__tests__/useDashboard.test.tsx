/* eslint-disable react/display-name */
/**
 * Tests for useDashboard hooks
 * Story 8.1: Executive Summary Dashboard
 * AC-20: Frontend unit tests for useDashboard hooks
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useExecutiveDashboard,
  useKpiCards,
  useMaintenanceQueue,
  useUpcomingPmJobs,
  useLeaseExpirations,
  useCriticalAlerts,
  usePropertyComparison
} from '../useDashboard';
import * as dashboardService from '@/services/dashboard.service';

// Mock the service
jest.mock('@/services/dashboard.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock data
const mockKpiCards = {
  netProfitLoss: {
    value: 150000,
    trend: 'UP' as const,
    percentageChange: 12.5,
  },
  occupancyRate: {
    value: 92.5,
    occupiedUnits: 92,
    totalUnits: 100,
    trend: 'STABLE' as const,
  },
  overdueMaintenance: {
    value: 8,
    openWorkOrders: 24,
    trend: 'DOWN' as const,
  },
  receivables: {
    value: 35000,
    agingBreakdown: {
      current: 15000,
      days30: 10000,
      days60: 5000,
      over90Days: 5000,
    },
    trend: 'UP' as const,
  },
};

const mockMaintenanceQueue = [
  {
    workOrderId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'HVAC Repair',
    propertyName: 'Property A',
    unitNumber: '101',
    priority: 'HIGH',
    status: 'OPEN',
    dueDate: '2025-01-15',
    daysUntilDue: 2,
    isOverdue: false,
  },
];

const mockPmJobsChart = [
  { category: 'HVAC', scheduledCount: 5, overdueCount: 2 },
  { category: 'PLUMBING', scheduledCount: 3, overdueCount: 1 },
];

const mockLeaseExpirations = [
  { month: 1, year: 2025, monthName: 'January', expirationCount: 3, needsRenewalPlanning: false },
  { month: 2, year: 2025, monthName: 'February', expirationCount: 5, needsRenewalPlanning: false },
];

const mockAlerts = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Overdue Work Orders',
    description: '5 work orders are past due',
    severity: 'URGENT' as const,
    type: 'MAINTENANCE',
    count: 5,
    actionUrl: '/property-manager/work-orders?status=overdue',
  },
];

const mockPropertyComparison = [
  {
    propertyId: '123e4567-e89b-12d3-a456-426614174002',
    propertyName: 'Property A',
    occupancyRate: 95,
    maintenanceCost: 5000,
    revenue: 50000,
    openWorkOrders: 3,
    rank: 'TOP' as const,
  },
];

const mockExecutiveDashboard = {
  kpis: mockKpiCards,
  priorityMaintenanceQueue: mockMaintenanceQueue,
  upcomingPmJobs: mockPmJobsChart,
  leaseExpirations: mockLeaseExpirations,
  criticalAlerts: mockAlerts,
  propertyComparison: mockPropertyComparison,
};

describe('useDashboard hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // useExecutiveDashboard
  // ============================================================================

  describe('useExecutiveDashboard', () => {
    it('should fetch complete dashboard data successfully', async () => {
      (dashboardService.getExecutiveDashboard as jest.Mock).mockResolvedValue(mockExecutiveDashboard);

      const { result } = renderHook(() => useExecutiveDashboard({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockExecutiveDashboard);
    });

    it('should pass filters to service', async () => {
      (dashboardService.getExecutiveDashboard as jest.Mock).mockResolvedValue(mockExecutiveDashboard);

      const filters = {
        propertyId: '123e4567-e89b-12d3-a456-426614174003',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      };

      const { result } = renderHook(() => useExecutiveDashboard(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(dashboardService.getExecutiveDashboard).toHaveBeenCalledWith(filters);
    });

    it('should handle errors gracefully', async () => {
      (dashboardService.getExecutiveDashboard as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() => useExecutiveDashboard({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });
  });

  // ============================================================================
  // useKpiCards
  // ============================================================================

  describe('useKpiCards', () => {
    it('should fetch KPI cards data successfully', async () => {
      (dashboardService.getKpiCards as jest.Mock).mockResolvedValue(mockKpiCards);

      const { result } = renderHook(() => useKpiCards({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockKpiCards);
    });

    it('should include net profit/loss KPI - AC-1', async () => {
      (dashboardService.getKpiCards as jest.Mock).mockResolvedValue(mockKpiCards);

      const { result } = renderHook(() => useKpiCards({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.netProfitLoss).toBeDefined();
      expect(result.current.data?.netProfitLoss.value).toBe(150000);
    });

    it('should include occupancy rate KPI - AC-2', async () => {
      (dashboardService.getKpiCards as jest.Mock).mockResolvedValue(mockKpiCards);

      const { result } = renderHook(() => useKpiCards({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.occupancyRate).toBeDefined();
      expect(result.current.data?.occupancyRate.occupiedUnits).toBe(92);
      expect(result.current.data?.occupancyRate.totalUnits).toBe(100);
    });

    it('should include overdue maintenance KPI - AC-3', async () => {
      (dashboardService.getKpiCards as jest.Mock).mockResolvedValue(mockKpiCards);

      const { result } = renderHook(() => useKpiCards({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.overdueMaintenance).toBeDefined();
      expect(result.current.data?.overdueMaintenance.value).toBe(8);
    });

    it('should include receivables with aging breakdown - AC-4', async () => {
      (dashboardService.getKpiCards as jest.Mock).mockResolvedValue(mockKpiCards);

      const { result } = renderHook(() => useKpiCards({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.receivables).toBeDefined();
      expect(result.current.data?.receivables.agingBreakdown).toBeDefined();
      expect(result.current.data?.receivables.agingBreakdown.current).toBe(15000);
    });
  });

  // ============================================================================
  // useMaintenanceQueue
  // ============================================================================

  describe('useMaintenanceQueue', () => {
    it('should fetch maintenance queue successfully - AC-5', async () => {
      (dashboardService.getMaintenanceQueue as jest.Mock).mockResolvedValue(mockMaintenanceQueue);

      const { result } = renderHook(() => useMaintenanceQueue({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].priority).toBe('HIGH');
    });

    it('should return work orders with due dates', async () => {
      (dashboardService.getMaintenanceQueue as jest.Mock).mockResolvedValue(mockMaintenanceQueue);

      const { result } = renderHook(() => useMaintenanceQueue({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].dueDate).toBeDefined();
      expect(result.current.data?.[0].daysUntilDue).toBeDefined();
    });
  });

  // ============================================================================
  // useUpcomingPmJobs
  // ============================================================================

  describe('useUpcomingPmJobs', () => {
    it('should fetch PM jobs chart data - AC-6', async () => {
      (dashboardService.getUpcomingPmJobs as jest.Mock).mockResolvedValue(mockPmJobsChart);

      const { result } = renderHook(() => useUpcomingPmJobs({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].category).toBe('HVAC');
    });

    it('should include scheduled and overdue counts', async () => {
      (dashboardService.getUpcomingPmJobs as jest.Mock).mockResolvedValue(mockPmJobsChart);

      const { result } = renderHook(() => useUpcomingPmJobs({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].scheduledCount).toBe(5);
      expect(result.current.data?.[0].overdueCount).toBe(2);
    });
  });

  // ============================================================================
  // useLeaseExpirations
  // ============================================================================

  describe('useLeaseExpirations', () => {
    it('should fetch lease expirations timeline - AC-7', async () => {
      (dashboardService.getLeaseExpirations as jest.Mock).mockResolvedValue(mockLeaseExpirations);

      const { result } = renderHook(() => useLeaseExpirations({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].monthName).toBe('January');
    });

    it('should include renewal planning flag', async () => {
      (dashboardService.getLeaseExpirations as jest.Mock).mockResolvedValue(mockLeaseExpirations);

      const { result } = renderHook(() => useLeaseExpirations({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].needsRenewalPlanning).toBeDefined();
    });
  });

  // ============================================================================
  // useCriticalAlerts
  // ============================================================================

  describe('useCriticalAlerts', () => {
    it('should fetch alerts with severity - AC-8', async () => {
      (dashboardService.getCriticalAlerts as jest.Mock).mockResolvedValue(mockAlerts);

      const { result } = renderHook(() => useCriticalAlerts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].severity).toBe('URGENT');
    });

    it('should include action URLs for alerts', async () => {
      (dashboardService.getCriticalAlerts as jest.Mock).mockResolvedValue(mockAlerts);

      const { result } = renderHook(() => useCriticalAlerts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].actionUrl).toBeDefined();
    });
  });

  // ============================================================================
  // usePropertyComparison
  // ============================================================================

  describe('usePropertyComparison', () => {
    it('should fetch property comparison data - AC-9', async () => {
      (dashboardService.getPropertyComparison as jest.Mock).mockResolvedValue(mockPropertyComparison);

      const { result } = renderHook(() => usePropertyComparison({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].propertyName).toBe('Property A');
    });

    it('should include performance rankings', async () => {
      (dashboardService.getPropertyComparison as jest.Mock).mockResolvedValue(mockPropertyComparison);

      const { result } = renderHook(() => usePropertyComparison({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].rank).toBe('TOP');
    });
  });
});
