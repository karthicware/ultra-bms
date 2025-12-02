/**
 * React Query Hooks for Maintenance Dashboard
 * Story 8.4: Maintenance Dashboard
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { maintenanceDashboardService } from '@/services/maintenance-dashboard.service';
import type {
  MaintenanceDashboard,
  JobsByStatus,
  JobsByPriority,
  JobsByCategory,
  HighPriorityJobsPage,
  RecentlyCompletedJob,
  MaintenanceDashboardFilters,
  HighPriorityJobsFilters
} from '@/types/maintenance-dashboard';
import { WorkOrderStatus } from '@/types/work-orders';

// Query keys for cache management
export const maintenanceDashboardKeys = {
  all: ['maintenanceDashboard'] as const,
  dashboard: (filters?: MaintenanceDashboardFilters) =>
    [...maintenanceDashboardKeys.all, 'dashboard', filters] as const,
  jobsByStatus: (filters?: MaintenanceDashboardFilters) =>
    [...maintenanceDashboardKeys.all, 'jobsByStatus', filters] as const,
  jobsByPriority: (filters?: MaintenanceDashboardFilters) =>
    [...maintenanceDashboardKeys.all, 'jobsByPriority', filters] as const,
  jobsByCategory: (filters?: MaintenanceDashboardFilters) =>
    [...maintenanceDashboardKeys.all, 'jobsByCategory', filters] as const,
  highPriorityOverdue: (filters?: HighPriorityJobsFilters) =>
    [...maintenanceDashboardKeys.all, 'highPriorityOverdue', filters] as const,
  recentlyCompleted: (filters?: MaintenanceDashboardFilters, limit?: number) =>
    [...maintenanceDashboardKeys.all, 'recentlyCompleted', filters, limit] as const
};

// Default stale time: 2 minutes (data is cached on backend for 5 minutes)
const DEFAULT_STALE_TIME = 2 * 60 * 1000;

/**
 * Hook to fetch complete maintenance dashboard data
 * AC-10: GET /api/v1/dashboard/maintenance
 */
export function useMaintenanceDashboard(filters?: MaintenanceDashboardFilters) {
  return useQuery<MaintenanceDashboard, Error>({
    queryKey: maintenanceDashboardKeys.dashboard(filters),
    queryFn: () => maintenanceDashboardService.getMaintenanceDashboard(filters),
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true
  });
}

/**
 * Hook to fetch jobs by status for pie chart
 * AC-11: GET /api/v1/dashboard/maintenance/jobs-by-status
 */
export function useJobsByStatus(filters?: MaintenanceDashboardFilters) {
  return useQuery<JobsByStatus[], Error>({
    queryKey: maintenanceDashboardKeys.jobsByStatus(filters),
    queryFn: () => maintenanceDashboardService.getJobsByStatus(filters),
    staleTime: DEFAULT_STALE_TIME
  });
}

/**
 * Hook to fetch jobs by priority for bar chart
 * AC-12: GET /api/v1/dashboard/maintenance/jobs-by-priority
 */
export function useJobsByPriority(filters?: MaintenanceDashboardFilters) {
  return useQuery<JobsByPriority[], Error>({
    queryKey: maintenanceDashboardKeys.jobsByPriority(filters),
    queryFn: () => maintenanceDashboardService.getJobsByPriority(filters),
    staleTime: DEFAULT_STALE_TIME
  });
}

/**
 * Hook to fetch jobs by category for horizontal bar chart
 * AC-13: GET /api/v1/dashboard/maintenance/jobs-by-category
 */
export function useJobsByCategory(filters?: MaintenanceDashboardFilters) {
  return useQuery<JobsByCategory[], Error>({
    queryKey: maintenanceDashboardKeys.jobsByCategory(filters),
    queryFn: () => maintenanceDashboardService.getJobsByCategory(filters),
    staleTime: DEFAULT_STALE_TIME
  });
}

/**
 * Hook to fetch high priority and overdue jobs with pagination
 * AC-14: GET /api/v1/dashboard/maintenance/high-priority-overdue
 */
export function useHighPriorityOverdueJobs(filters?: HighPriorityJobsFilters) {
  return useQuery<HighPriorityJobsPage, Error>({
    queryKey: maintenanceDashboardKeys.highPriorityOverdue(filters),
    queryFn: () => maintenanceDashboardService.getHighPriorityOverdueJobs(filters),
    staleTime: DEFAULT_STALE_TIME
  });
}

/**
 * Hook to fetch recently completed jobs
 * AC-15: GET /api/v1/dashboard/maintenance/recently-completed
 */
export function useRecentlyCompletedJobs(
  filters?: MaintenanceDashboardFilters,
  limit: number = 5
) {
  return useQuery<RecentlyCompletedJob[], Error>({
    queryKey: maintenanceDashboardKeys.recentlyCompleted(filters, limit),
    queryFn: () => maintenanceDashboardService.getRecentlyCompletedJobs(filters, limit),
    staleTime: DEFAULT_STALE_TIME
  });
}

/**
 * Combined hook for maintenance dashboard with filter state management
 * Handles chart click-to-filter functionality (AC-17)
 */
export function useMaintenanceDashboardWithFilters(
  initialFilters?: MaintenanceDashboardFilters
) {
  const queryClient = useQueryClient();

  // Filter state
  const [propertyId, setPropertyId] = useState<string | undefined>(
    initialFilters?.propertyId
  );
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | undefined>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Build filter objects
  const dashboardFilters: MaintenanceDashboardFilters = {
    propertyId
  };

  const highPriorityFilters: HighPriorityJobsFilters = {
    propertyId,
    status: statusFilter,
    page,
    size: pageSize
  };

  // Queries
  const dashboardQuery = useMaintenanceDashboard(dashboardFilters);
  const highPriorityQuery = useHighPriorityOverdueJobs(highPriorityFilters);

  // Filter handlers
  const handlePropertyChange = useCallback((newPropertyId: string | undefined) => {
    setPropertyId(newPropertyId);
    setPage(0); // Reset pagination when property changes
    setStatusFilter(undefined); // Clear status filter
  }, []);

  /**
   * Handle chart click-to-filter (AC-17)
   * When user clicks on a status segment in the pie chart, filter the table
   */
  const handleStatusFilterChange = useCallback((status: WorkOrderStatus | undefined) => {
    setStatusFilter(status);
    setPage(0); // Reset to first page when filter changes
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0); // Reset to first page when page size changes
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setPropertyId(undefined);
    setStatusFilter(undefined);
    setPage(0);
  }, []);

  // Invalidate all dashboard queries (for manual refresh)
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: maintenanceDashboardKeys.all });
  }, [queryClient]);

  return {
    // Query results
    dashboard: dashboardQuery.data,
    highPriorityJobs: highPriorityQuery.data,

    // Loading states
    isLoading: dashboardQuery.isLoading,
    isHighPriorityLoading: highPriorityQuery.isLoading,

    // Error states
    error: dashboardQuery.error,
    highPriorityError: highPriorityQuery.error,

    // Current filters
    filters: {
      propertyId,
      statusFilter,
      page,
      pageSize
    },

    // Filter handlers
    setPropertyId: handlePropertyChange,
    setStatusFilter: handleStatusFilterChange,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    clearFilters,

    // Refresh
    invalidateAll,
    refetch: () => {
      dashboardQuery.refetch();
      highPriorityQuery.refetch();
    }
  };
}

export default useMaintenanceDashboard;
