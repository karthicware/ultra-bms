/**
 * Maintenance Dashboard API Service
 * Story 8.4: Maintenance Dashboard
 */

import { apiClient } from '@/lib/api';
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

const MAINTENANCE_DASHBOARD_URL = '/v1/dashboard/maintenance';

/**
 * Helper to build query params
 */
const buildParams = (filters: Record<string, unknown>): URLSearchParams => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params;
};

/**
 * Maintenance Dashboard Service
 * Provides API client methods for all maintenance dashboard endpoints
 */
export const maintenanceDashboardService = {
  /**
   * Get complete maintenance dashboard data (AC-10)
   * GET /api/v1/dashboard/maintenance
   */
  async getMaintenanceDashboard(
    filters?: MaintenanceDashboardFilters
  ): Promise<MaintenanceDashboard> {
    const params = buildParams((filters || {}) as Record<string, unknown>);
    const response = await apiClient.get<MaintenanceDashboard>(
      `${MAINTENANCE_DASHBOARD_URL}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get jobs by status for pie chart (AC-11)
   * GET /api/v1/dashboard/maintenance/jobs-by-status
   */
  async getJobsByStatus(
    filters?: MaintenanceDashboardFilters
  ): Promise<JobsByStatus[]> {
    const params = buildParams((filters || {}) as Record<string, unknown>);
    const response = await apiClient.get<JobsByStatus[]>(
      `${MAINTENANCE_DASHBOARD_URL}/jobs-by-status?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get jobs by priority for bar chart (AC-12)
   * GET /api/v1/dashboard/maintenance/jobs-by-priority
   */
  async getJobsByPriority(
    filters?: MaintenanceDashboardFilters
  ): Promise<JobsByPriority[]> {
    const params = buildParams((filters || {}) as Record<string, unknown>);
    const response = await apiClient.get<JobsByPriority[]>(
      `${MAINTENANCE_DASHBOARD_URL}/jobs-by-priority?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get jobs by category for horizontal bar chart (AC-13)
   * GET /api/v1/dashboard/maintenance/jobs-by-category
   */
  async getJobsByCategory(
    filters?: MaintenanceDashboardFilters
  ): Promise<JobsByCategory[]> {
    const params = buildParams((filters || {}) as Record<string, unknown>);
    const response = await apiClient.get<JobsByCategory[]>(
      `${MAINTENANCE_DASHBOARD_URL}/jobs-by-category?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get high priority and overdue jobs with pagination (AC-14)
   * GET /api/v1/dashboard/maintenance/high-priority-overdue
   */
  async getHighPriorityOverdueJobs(
    filters?: HighPriorityJobsFilters
  ): Promise<HighPriorityJobsPage> {
    const params = buildParams({
      propertyId: filters?.propertyId,
      status: filters?.status,
      page: filters?.page ?? 0,
      size: filters?.size ?? 10
    });
    const response = await apiClient.get<HighPriorityJobsPage>(
      `${MAINTENANCE_DASHBOARD_URL}/high-priority-overdue?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get recently completed jobs (AC-15)
   * GET /api/v1/dashboard/maintenance/recently-completed
   */
  async getRecentlyCompletedJobs(
    filters?: MaintenanceDashboardFilters,
    limit: number = 5
  ): Promise<RecentlyCompletedJob[]> {
    const params = buildParams({
      ...filters,
      limit
    });
    const response = await apiClient.get<RecentlyCompletedJob[]>(
      `${MAINTENANCE_DASHBOARD_URL}/recently-completed?${params.toString()}`
    );
    return response.data;
  }
};

export default maintenanceDashboardService;
