/**
 * React Query hook for tenant dashboard data
 */
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/services/tenant-portal.service';
import type { DashboardData } from '@/types/tenant-portal';

export function useTenantDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['tenant', 'dashboard'],
    queryFn: getDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
