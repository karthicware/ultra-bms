/**
 * Tests for useMaintenanceDashboard hooks
 * Story 8.4: Maintenance Dashboard
 * AC-10 to AC-15: Dashboard API hooks
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import {
  useMaintenanceDashboard,
  useJobsByStatus,
  useJobsByPriority,
  useJobsByCategory,
  useHighPriorityOverdueJobs,
  useRecentlyCompletedJobs,
  useMaintenanceDashboardWithFilters,
  maintenanceDashboardKeys
} from '../useMaintenanceDashboard';
import { maintenanceDashboardService } from '@/services/maintenance-dashboard.service';
import type { MaintenanceDashboard } from '@/types/maintenance-dashboard';
import { WorkOrderStatus } from '@/types/work-orders';

// Mock the service
jest.mock('@/services/maintenance-dashboard.service', () => ({
  maintenanceDashboardService: {
    getMaintenanceDashboard: jest.fn(),
    getJobsByStatus: jest.fn(),
    getJobsByPriority: jest.fn(),
    getJobsByCategory: jest.fn(),
    getHighPriorityOverdueJobs: jest.fn(),
    getRecentlyCompletedJobs: jest.fn()
  }
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('maintenanceDashboardKeys', () => {
  it('should generate correct query keys', () => {
    expect(maintenanceDashboardKeys.all).toEqual(['maintenanceDashboard']);
    expect(maintenanceDashboardKeys.dashboard({ propertyId: '123' })).toEqual([
      'maintenanceDashboard',
      'dashboard',
      { propertyId: '123' }
    ]);
    expect(maintenanceDashboardKeys.jobsByStatus()).toEqual([
      'maintenanceDashboard',
      'jobsByStatus',
      undefined
    ]);
    expect(maintenanceDashboardKeys.highPriorityOverdue({ page: 0, size: 10 })).toEqual([
      'maintenanceDashboard',
      'highPriorityOverdue',
      { page: 0, size: 10 }
    ]);
  });
});

describe('useMaintenanceDashboard', () => {
  const mockDashboard: MaintenanceDashboard = {
    kpis: {
      activeJobs: 45,
      overdueJobs: 8,
      pendingJobs: 12,
      completedThisMonth: 67,
      completedPreviousMonth: 58,
      monthOverMonthChange: 15.5
    },
    jobsByStatus: [],
    jobsByPriority: [],
    jobsByCategory: [],
    highPriorityOverdueJobs: [],
    highPriorityOverdueTotal: 0,
    recentlyCompletedJobs: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard data - AC-10', async () => {
    (maintenanceDashboardService.getMaintenanceDashboard as jest.Mock).mockResolvedValue(
      mockDashboard
    );

    const { result } = renderHook(() => useMaintenanceDashboard(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDashboard);
    expect(maintenanceDashboardService.getMaintenanceDashboard).toHaveBeenCalledWith(
      undefined
    );
  });

  it('should pass filters to API call', async () => {
    (maintenanceDashboardService.getMaintenanceDashboard as jest.Mock).mockResolvedValue(
      mockDashboard
    );
    const filters = { propertyId: 'prop-123' };

    const { result } = renderHook(() => useMaintenanceDashboard(filters), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(maintenanceDashboardService.getMaintenanceDashboard).toHaveBeenCalledWith(
      filters
    );
  });

  it('should handle API error', async () => {
    const error = new Error('API Error');
    (maintenanceDashboardService.getMaintenanceDashboard as jest.Mock).mockRejectedValue(
      error
    );

    const { result } = renderHook(() => useMaintenanceDashboard(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useJobsByStatus', () => {
  const mockStatusData = [
    { status: 'OPEN', label: 'Open', count: 15, percentage: 25, color: '#3b82f6' }
  ];

  it('should fetch jobs by status - AC-11', async () => {
    (maintenanceDashboardService.getJobsByStatus as jest.Mock).mockResolvedValue(
      mockStatusData
    );

    const { result } = renderHook(() => useJobsByStatus(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStatusData);
  });
});

describe('useJobsByPriority', () => {
  const mockPriorityData = [
    { priority: 'HIGH', label: 'High', count: 20, color: '#f97316' }
  ];

  it('should fetch jobs by priority - AC-12', async () => {
    (maintenanceDashboardService.getJobsByPriority as jest.Mock).mockResolvedValue(
      mockPriorityData
    );

    const { result } = renderHook(() => useJobsByPriority(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPriorityData);
  });
});

describe('useJobsByCategory', () => {
  const mockCategoryData = [
    { category: 'PLUMBING', label: 'Plumbing', count: 30, color: '#3b82f6' }
  ];

  it('should fetch jobs by category - AC-13', async () => {
    (maintenanceDashboardService.getJobsByCategory as jest.Mock).mockResolvedValue(
      mockCategoryData
    );

    const { result } = renderHook(() => useJobsByCategory(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCategoryData);
  });
});

describe('useHighPriorityOverdueJobs', () => {
  const mockPageData = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: true
  };

  it('should fetch high priority jobs with pagination - AC-14', async () => {
    (maintenanceDashboardService.getHighPriorityOverdueJobs as jest.Mock).mockResolvedValue(
      mockPageData
    );

    const { result } = renderHook(
      () => useHighPriorityOverdueJobs({ page: 0, size: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(maintenanceDashboardService.getHighPriorityOverdueJobs).toHaveBeenCalledWith({
      page: 0,
      size: 10
    });
  });
});

describe('useRecentlyCompletedJobs', () => {
  const mockCompletedJobs = [
    {
      id: '1',
      workOrderNumber: 'WO-001',
      title: 'Test Job',
      propertyName: 'Test Property',
      completedAt: '2024-01-15T10:00:00Z',
      completedByName: 'John Smith'
    }
  ];

  it('should fetch recently completed jobs - AC-15', async () => {
    (maintenanceDashboardService.getRecentlyCompletedJobs as jest.Mock).mockResolvedValue(
      mockCompletedJobs
    );

    const { result } = renderHook(() => useRecentlyCompletedJobs(undefined, 5), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(maintenanceDashboardService.getRecentlyCompletedJobs).toHaveBeenCalledWith(
      undefined,
      5
    );
    expect(result.current.data).toEqual(mockCompletedJobs);
  });
});

describe('useMaintenanceDashboardWithFilters', () => {
  const mockDashboard: MaintenanceDashboard = {
    kpis: {
      activeJobs: 45,
      overdueJobs: 8,
      pendingJobs: 12,
      completedThisMonth: 67,
      completedPreviousMonth: 58,
      monthOverMonthChange: 15.5
    },
    jobsByStatus: [],
    jobsByPriority: [],
    jobsByCategory: [],
    highPriorityOverdueJobs: [],
    highPriorityOverdueTotal: 0,
    recentlyCompletedJobs: []
  };

  const mockPageData = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (maintenanceDashboardService.getMaintenanceDashboard as jest.Mock).mockResolvedValue(
      mockDashboard
    );
    (maintenanceDashboardService.getHighPriorityOverdueJobs as jest.Mock).mockResolvedValue(
      mockPageData
    );
  });

  it('should provide filter state management', async () => {
    const { result } = renderHook(() => useMaintenanceDashboardWithFilters(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check initial filter state
    expect(result.current.filters.propertyId).toBeUndefined();
    expect(result.current.filters.statusFilter).toBeUndefined();
    expect(result.current.filters.page).toBe(0);
    expect(result.current.filters.pageSize).toBe(10);
  });

  it('should update property filter - AC-16', async () => {
    const { result } = renderHook(() => useMaintenanceDashboardWithFilters(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPropertyId('prop-123');
    });

    expect(result.current.filters.propertyId).toBe('prop-123');
    // Should reset page when property changes
    expect(result.current.filters.page).toBe(0);
  });

  it('should update status filter for click-to-filter - AC-17', async () => {
    const { result } = renderHook(() => useMaintenanceDashboardWithFilters(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter(WorkOrderStatus.OPEN);
    });

    expect(result.current.filters.statusFilter).toBe(WorkOrderStatus.OPEN);
    expect(result.current.filters.page).toBe(0); // Reset pagination
  });

  it('should handle pagination', async () => {
    const { result } = renderHook(() => useMaintenanceDashboardWithFilters(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.filters.page).toBe(2);

    act(() => {
      result.current.setPageSize(20);
    });

    expect(result.current.filters.pageSize).toBe(20);
    expect(result.current.filters.page).toBe(0); // Reset to first page
  });

  it('should clear all filters', async () => {
    const { result } = renderHook(() => useMaintenanceDashboardWithFilters(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set some filters first
    act(() => {
      result.current.setPropertyId('prop-123');
      result.current.setStatusFilter(WorkOrderStatus.OPEN);
      result.current.setPage(3);
    });

    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.propertyId).toBeUndefined();
    expect(result.current.filters.statusFilter).toBeUndefined();
    expect(result.current.filters.page).toBe(0);
  });
});
