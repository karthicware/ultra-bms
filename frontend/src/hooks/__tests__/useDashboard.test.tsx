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

// Mock data matching actual KpiCards type from dashboard.ts
const mockKpiCards = {
  netProfitLoss: {
    value: 150000,
    previousValue: 133333,
    changePercentage: 12.5,
    trend: 'UP' as const,
    formattedValue: 'AED 150,000',
    unit: 'AED',
  },
  occupancyRate: {
    value: 92.5,
    previousValue: 90,
    changePercentage: 2.78,
    trend: 'UP' as const,
    formattedValue: '92.5%',
    unit: '%',
  },
  overdueMaintenance: {
    value: 8,
    previousValue: 12,
    changePercentage: -33.3,
    trend: 'DOWN' as const,
    formattedValue: '8',
    unit: 'work orders',
  },
  outstandingReceivables: {
    totalAmount: 35000,
    changePercentage: 5.0,
    trend: 'UP' as const,
    aging: {
      current: 15000,
      thirtyPlus: 10000,
      sixtyPlus: 5000,
      ninetyPlus: 5000,
    },
  },
};

// Mock data matching actual MaintenanceQueueItem type from dashboard.ts
const mockMaintenanceQueue = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    workOrderNumber: 'WO-2025-0001',
    propertyName: 'Property A',
    unitNumber: '101',
    title: 'HVAC Repair',
    description: 'HVAC unit not cooling properly',
    priority: 'HIGH',
    status: 'OPEN',
    scheduledDate: '2025-01-15',
    daysOverdue: 0,
    isOverdue: false,
  },
];

// Mock data matching actual PmJobChartData type from dashboard.ts
const mockPmJobsChart = [
  { category: 'HVAC', scheduledCount: 5, overdueCount: 2, totalCount: 7 },
  { category: 'PLUMBING', scheduledCount: 3, overdueCount: 1, totalCount: 4 },
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
      expect(result.current.data?.occupancyRate.value).toBe(92.5);
      expect(result.current.data?.occupancyRate.formattedValue).toBe('92.5%');
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
      expect(result.current.data?.outstandingReceivables).toBeDefined();
      expect(result.current.data?.outstandingReceivables.aging).toBeDefined();
      expect(result.current.data?.outstandingReceivables.aging.current).toBe(15000);
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

    it('should return work orders with scheduled dates and overdue info', async () => {
      (dashboardService.getMaintenanceQueue as jest.Mock).mockResolvedValue(mockMaintenanceQueue);

      const { result } = renderHook(() => useMaintenanceQueue({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].scheduledDate).toBeDefined();
      expect(result.current.data?.[0].daysOverdue).toBeDefined();
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
