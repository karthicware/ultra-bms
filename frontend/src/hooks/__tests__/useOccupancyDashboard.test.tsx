/**
 * Tests for useOccupancyDashboard hooks
 * Story 8.3: Occupancy Dashboard
 * AC-9 to AC-11: API integration and data fetching
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useOccupancyDashboard,
  useOccupancyLeaseExpirations,
  useRecentActivity,
  occupancyDashboardKeys
} from '../useOccupancyDashboard';
import {
  getOccupancyDashboard,
  getOccupancyLeaseExpirations,
  getRecentActivity
} from '@/services/occupancy-dashboard.service';
import type { OccupancyDashboard, LeaseExpirationItem, LeaseActivityItem } from '@/types';
import { TrendDirection, LeaseActivityType } from '@/types';

// Mock the service functions
jest.mock('@/services/occupancy-dashboard.service');

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock data
const mockOccupancyDashboard: OccupancyDashboard = {
  kpis: {
    portfolioOccupancy: {
      value: 92.5,
      previousValue: 90,
      changePercentage: 2.5,
      trend: TrendDirection.UP,
      formattedValue: '92.5%',
      unit: '%'
    },
    vacantUnits: {
      value: 8,
      previousValue: 10,
      changePercentage: -20,
      trend: TrendDirection.DOWN,
      formattedValue: '8',
      unit: 'units'
    },
    leasesExpiring: {
      value: 15,
      previousValue: 12,
      changePercentage: 25,
      trend: TrendDirection.UP,
      formattedValue: '15',
      unit: 'leases'
    },
    averageRentPerSqft: {
      value: 20.5,
      previousValue: 19.8,
      changePercentage: 3.5,
      trend: TrendDirection.UP,
      formattedValue: 'AED 20.50',
      unit: 'AED/sqft'
    }
  },
  occupancyChart: {
    totalUnits: 100,
    segments: [
      { status: 'Occupied', count: 85, percentage: 85, color: '#22c55e' },
      { status: 'Vacant', count: 8, percentage: 8, color: '#ef4444' },
      { status: 'Under Renovation', count: 4, percentage: 4, color: '#f59e0b' },
      { status: 'Notice Period', count: 3, percentage: 3, color: '#3b82f6' }
    ]
  },
  leaseExpirationChart: {
    monthlyData: [
      { month: 'Jan 2025', yearMonth: '2025-01', renewedCount: 3, pendingCount: 5, totalCount: 8 },
      { month: 'Feb 2025', yearMonth: '2025-02', renewedCount: 4, pendingCount: 3, totalCount: 7 }
    ],
    totalExpiring: 15
  },
  upcomingExpirations: [],
  recentActivity: [],
  expiryPeriodDays: 100
};

const mockLeaseExpirations: LeaseExpirationItem[] = [
  {
    tenantId: 'tenant-1',
    tenantName: 'John Doe',
    unitId: 'unit-1',
    unitNumber: 'A-101',
    propertyId: 'prop-1',
    propertyName: 'Marina Heights',
    expiryDate: '2025-02-15',
    daysRemaining: 45,
    isRenewed: false,
    renewalStatus: 'Pending'
  }
];

const mockRecentActivity: LeaseActivityItem[] = [
  {
    id: 'activity-1',
    activityType: LeaseActivityType.LEASE_CREATED,
    tenantId: 'tenant-1',
    tenantName: 'John Doe',
    unitId: 'unit-1',
    unitNumber: 'A-101',
    propertyName: 'Marina Heights',
    timestamp: '2025-01-01T10:00:00Z',
    description: 'New lease created',
    icon: 'file-plus',
    color: '#22c55e'
  }
];

describe('useOccupancyDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Keys', () => {
    it('should generate correct query keys', () => {
      expect(occupancyDashboardKeys.all).toEqual(['occupancy-dashboard']);
      expect(occupancyDashboardKeys.dashboard()).toEqual(['occupancy-dashboard', 'dashboard', undefined]);
      expect(occupancyDashboardKeys.dashboard({ propertyId: 'prop-1' })).toEqual([
        'occupancy-dashboard',
        'dashboard',
        { propertyId: 'prop-1' }
      ]);
    });
  });

  describe('useOccupancyDashboard hook - AC-9', () => {
    it('should fetch dashboard data successfully', async () => {
      (getOccupancyDashboard as jest.Mock).mockResolvedValue(mockOccupancyDashboard);

      const { result } = renderHook(() => useOccupancyDashboard(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOccupancyDashboard);
      expect(getOccupancyDashboard).toHaveBeenCalledWith(undefined);
    });

    it('should pass filter parameters to API', async () => {
      (getOccupancyDashboard as jest.Mock).mockResolvedValue(mockOccupancyDashboard);

      const filter = { propertyId: 'prop-1' };
      const { result } = renderHook(() => useOccupancyDashboard(filter), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getOccupancyDashboard).toHaveBeenCalledWith(filter);
    });

    it('should not fetch when enabled is false', () => {
      (getOccupancyDashboard as jest.Mock).mockResolvedValue(mockOccupancyDashboard);

      renderHook(() => useOccupancyDashboard(undefined, false), {
        wrapper: createWrapper()
      });

      expect(getOccupancyDashboard).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      (getOccupancyDashboard as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useOccupancyDashboard(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useOccupancyLeaseExpirations hook - AC-10', () => {
    it('should fetch lease expirations successfully', async () => {
      (getOccupancyLeaseExpirations as jest.Mock).mockResolvedValue(mockLeaseExpirations);

      const { result } = renderHook(() => useOccupancyLeaseExpirations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockLeaseExpirations);
    });

    it('should pass pagination parameters', async () => {
      (getOccupancyLeaseExpirations as jest.Mock).mockResolvedValue(mockLeaseExpirations);

      const filter = { page: 1, size: 20, days: 60 };
      const { result } = renderHook(() => useOccupancyLeaseExpirations(filter), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getOccupancyLeaseExpirations).toHaveBeenCalledWith(filter);
    });
  });

  describe('useRecentActivity hook - AC-11', () => {
    it('should fetch recent activity successfully', async () => {
      (getRecentActivity as jest.Mock).mockResolvedValue(mockRecentActivity);

      const { result } = renderHook(() => useRecentActivity(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecentActivity);
    });

    it('should pass limit parameter', async () => {
      (getRecentActivity as jest.Mock).mockResolvedValue(mockRecentActivity);

      const filter = { limit: 5 };
      const { result } = renderHook(() => useRecentActivity(filter), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getRecentActivity).toHaveBeenCalledWith(filter);
    });
  });
});
