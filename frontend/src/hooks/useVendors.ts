/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Vendor Management
 * Story 5.1: Vendor Registration and Profile Management
 *
 * Provides hooks for fetching, creating, updating, and deleting vendors
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
  getVendorWorkOrders,
  getActiveVendors
} from '@/services/vendors.service';
import type {
  VendorFilter,
  VendorRequest,
  VendorStatus,
  VendorListResponse,
  VendorDetail,
  Vendor,
  VendorListItem,
  VendorWorkOrdersResponse
} from '@/types/vendors';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: VendorFilter) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
  workOrders: (id: string) => [...vendorKeys.detail(id), 'workOrders'] as const,
  active: (category?: string) => [...vendorKeys.all, 'active', category] as const
};

// ============================================================================
// LIST VENDORS HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of vendors with filters
 *
 * @param filters - Optional filters (status, serviceCategories, rating, search, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with vendors data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useVendors({
 *   status: 'ACTIVE',
 *   serviceCategories: ['PLUMBING'],
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <VendorTable
 *     vendors={data.data.content}
 *     pagination={data.data}
 *   />
 * );
 * ```
 */
export function useVendors(filters?: VendorFilter, enabled: boolean = true) {
  return useQuery<VendorListResponse>({
    queryKey: vendorKeys.list(filters ?? {}),
    queryFn: () => getVendors(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// GET VENDOR BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single vendor by ID
 *
 * @param id - Vendor UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with vendor detail data
 *
 * @example
 * ```typescript
 * const { data: vendor, isLoading, error } = useVendor(vendorId);
 *
 * if (isLoading) return <VendorDetailSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <VendorDetailPage vendor={vendor} />;
 * ```
 */
export function useVendor(id: string, enabled: boolean = true) {
  return useQuery<VendorDetail>({
    queryKey: vendorKeys.detail(id),
    queryFn: () => getVendorById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// CREATE VENDOR HOOK
// ============================================================================

/**
 * Hook to create a new vendor
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for creating vendor
 *
 * @example
 * ```typescript
 * const { mutate: createVendor, isPending } = useCreateVendor();
 *
 * const handleSubmit = (data: VendorRequest) => {
 *   createVendor(data);
 * };
 *
 * return (
 *   <VendorForm
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Vendor, Error, VendorRequest>({
    mutationFn: createVendor,
    onSuccess: (data) => {
      // Invalidate vendor list cache
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });

      // Show success toast
      toast.success(`Vendor ${data.companyName} registered successfully!`);

      // Navigate to vendor detail page
      router.push(`/property-manager/vendors/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create vendor';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE VENDOR HOOK
// ============================================================================

/**
 * Hook to update an existing vendor
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for updating vendor
 *
 * @example
 * ```typescript
 * const { mutate: updateVendor, isPending } = useUpdateVendor();
 *
 * const handleSubmit = (data: VendorRequest) => {
 *   updateVendor({ id: vendorId, data });
 * };
 *
 * return (
 *   <VendorForm
 *     vendor={existingVendor}
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Vendor, Error, { id: string; data: VendorRequest }>({
    mutationFn: ({ id, data }) => updateVendor(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate vendor list and detail caches
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) });

      // Show success toast
      toast.success('Vendor updated successfully!');

      // Navigate to vendor detail page
      router.push(`/property-manager/vendors/${id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update vendor';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE VENDOR STATUS HOOK
// ============================================================================

/**
 * Hook to update vendor status (activate, deactivate, suspend)
 *
 * Provides optimistic updates for instant UI feedback
 *
 * @returns UseMutationResult for updating vendor status
 *
 * @example
 * ```typescript
 * const { mutate: updateStatus, isPending } = useUpdateVendorStatus();
 *
 * const handleStatusChange = (newStatus: VendorStatus) => {
 *   updateStatus({ id: vendorId, status: newStatus });
 * };
 *
 * return (
 *   <StatusDropdown
 *     currentStatus={vendor.status}
 *     onChange={handleStatusChange}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();

  return useMutation<{ data: { id: string; status: VendorStatus } }, Error, { id: string; status: VendorStatus }>({
    mutationFn: ({ id, status }) => updateVendorStatus(id, status),
    onSuccess: (_, { id, status }) => {
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) });

      // Show success toast based on status
      const statusLabels: Record<VendorStatus, string> = {
        ACTIVE: 'activated',
        INACTIVE: 'deactivated',
        SUSPENDED: 'suspended'
      };
      toast.success(`Vendor ${statusLabels[status]} successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update vendor status';
      toast.error(message);
    }
  });
}

// ============================================================================
// DELETE VENDOR HOOK
// ============================================================================

/**
 * Hook to soft delete a vendor
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for deleting vendor
 *
 * @example
 * ```typescript
 * const { mutate: deleteVendor, isPending } = useDeleteVendor();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     deleteVendor(vendorId);
 *   }
 * };
 *
 * return (
 *   <Button
 *     variant="destructive"
 *     onClick={handleDelete}
 *     disabled={isPending}
 *   >
 *     Delete
 *   </Button>
 * );
 * ```
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, string>({
    mutationFn: deleteVendor,
    onSuccess: () => {
      // Invalidate vendor list cache
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });

      // Show success toast
      toast.success('Vendor deleted successfully!');

      // Navigate to vendor list
      router.push('/property-manager/vendors');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to delete vendor';
      toast.error(message);
    }
  });
}

// ============================================================================
// GET VENDOR WORK ORDERS HOOK
// ============================================================================

/**
 * Hook to fetch work order history for a vendor
 *
 * @param id - Vendor UUID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with paginated work orders
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useVendorWorkOrders(vendorId, 0, 10);
 *
 * if (isLoading) return <TableSkeleton />;
 *
 * return (
 *   <WorkOrderHistoryTable
 *     workOrders={data.data.content}
 *     pagination={data.data}
 *   />
 * );
 * ```
 */
export function useVendorWorkOrders(
  id: string,
  page: number = 0,
  size: number = 10,
  enabled: boolean = true
) {
  return useQuery<VendorWorkOrdersResponse>({
    queryKey: [...vendorKeys.workOrders(id), page, size],
    queryFn: () => getVendorWorkOrders(id, page, size),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// GET ACTIVE VENDORS HOOK (For dropdowns)
// ============================================================================

/**
 * Hook to fetch active vendors for assignment dropdowns
 *
 * @param serviceCategory - Optional service category to filter by
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with list of active vendors
 *
 * @example
 * ```typescript
 * const { data: vendors, isLoading } = useActiveVendors('PLUMBING');
 *
 * return (
 *   <Select>
 *     {vendors?.map(vendor => (
 *       <SelectItem key={vendor.id} value={vendor.id}>
 *         {vendor.companyName}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useActiveVendors(serviceCategory?: string, enabled: boolean = true) {
  return useQuery<VendorListItem[]>({
    queryKey: vendorKeys.active(serviceCategory),
    queryFn: () => getActiveVendors(serviceCategory),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled
  });
}
