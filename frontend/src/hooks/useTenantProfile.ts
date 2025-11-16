/**
 * React Query hook for tenant profile data
 */
import { useQuery } from '@tanstack/react-query';
import { getTenantProfile } from '@/services/tenant-portal.service';
import type { TenantProfile } from '@/types/tenant-portal';

export function useTenantProfile() {
  return useQuery<TenantProfile>({
    queryKey: ['tenant', 'profile'],
    queryFn: getTenantProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
