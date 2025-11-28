/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Parking Spot Inventory Management
 * Story 3.8: Parking Spot Inventory Management
 *
 * Provides hooks for fetching, creating, updating parking spots
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getParkingSpots,
  getParkingSpotById,
  createParkingSpot,
  updateParkingSpot,
  deleteParkingSpot,
  changeParkingSpotStatus,
  bulkDeleteParkingSpots,
  bulkChangeParkingSpotStatus,
  getAvailableParkingSpots,
  getParkingSpotsByProperty,
  getParkingSpotCounts
} from '@/services/parking.service';
import type {
  ParkingSpot,
  ParkingSpotListResponse,
  ParkingSpotFilters,
  ParkingSpotStatus,
  CreateParkingSpotRequest,
  UpdateParkingSpotRequest,
  ChangeParkingSpotStatusRequest,
  BulkDeleteParkingSpotRequest,
  BulkStatusChangeParkingSpotRequest,
  BulkOperationResponse
} from '@/types/parking';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const parkingSpotKeys = {
  all: ['parkingSpots'] as const,
  lists: () => [...parkingSpotKeys.all, 'list'] as const,
  list: (filters: Partial<ParkingSpotFilters>) => [...parkingSpotKeys.lists(), filters] as const,
  details: () => [...parkingSpotKeys.all, 'detail'] as const,
  detail: (id: string) => [...parkingSpotKeys.details(), id] as const,
  available: (propertyId: string) => [...parkingSpotKeys.all, 'available', propertyId] as const,
  byProperty: (propertyId: string) => [...parkingSpotKeys.all, 'property', propertyId] as const,
  counts: (propertyId?: string) => [...parkingSpotKeys.all, 'counts', propertyId] as const
};

// ============================================================================
// LIST PARKING SPOTS HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of parking spots with filters
 *
 * @param filters - Optional filters (propertyId, status, search, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with parking spots data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useParkingSpots({
 *   propertyId: 'prop-uuid',
 *   status: ParkingSpotStatus.AVAILABLE,
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <ParkingSpotTable
 *     parkingSpots={data.content}
 *     pagination={data}
 *   />
 * );
 * ```
 */
export function useParkingSpots(filters?: Partial<ParkingSpotFilters>, enabled: boolean = true) {
  return useQuery<ParkingSpotListResponse>({
    queryKey: parkingSpotKeys.list(filters ?? {}),
    queryFn: () => getParkingSpots(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// GET PARKING SPOT BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single parking spot by ID
 *
 * @param id - Parking spot UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with parking spot detail data
 *
 * @example
 * ```typescript
 * const { data: spot, isLoading, error } = useParkingSpot(spotId);
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <ParkingSpotDetail spot={spot} />;
 * ```
 */
export function useParkingSpot(id: string, enabled: boolean = true) {
  return useQuery<ParkingSpot>({
    queryKey: parkingSpotKeys.detail(id),
    queryFn: () => getParkingSpotById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// CREATE PARKING SPOT HOOK
// ============================================================================

/**
 * Hook to create a new parking spot
 *
 * Handles success toast and cache invalidation
 *
 * @returns UseMutationResult for creating parking spot
 *
 * @example
 * ```typescript
 * const { mutate: createSpot, isPending } = useCreateParkingSpot();
 *
 * const handleSubmit = (data: CreateParkingSpotRequest) => {
 *   createSpot(data, {
 *     onSuccess: () => closeModal()
 *   });
 * };
 *
 * return (
 *   <ParkingSpotForm
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useCreateParkingSpot() {
  const queryClient = useQueryClient();

  return useMutation<ParkingSpot, Error, CreateParkingSpotRequest>({
    mutationFn: createParkingSpot,
    onSuccess: (data) => {
      // Invalidate parking spot list cache
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.counts() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.available(data.propertyId) });

      // Show success toast
      toast.success(`Parking spot ${data.spotNumber} created successfully!`);
    },
    onError: (error: any) => {
      // Handle 409 Conflict - duplicate spot number
      if (error.response?.status === 409) {
        toast.error('A parking spot with this number already exists in this building.');
        return;
      }
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create parking spot';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE PARKING SPOT HOOK
// ============================================================================

/**
 * Hook to update an existing parking spot
 *
 * Handles success toast and cache invalidation
 *
 * @returns UseMutationResult for updating parking spot
 *
 * @example
 * ```typescript
 * const { mutate: updateSpot, isPending } = useUpdateParkingSpot();
 *
 * const handleSubmit = (data: UpdateParkingSpotRequest) => {
 *   updateSpot({ id: spotId, data }, {
 *     onSuccess: () => closeModal()
 *   });
 * };
 * ```
 */
export function useUpdateParkingSpot() {
  const queryClient = useQueryClient();

  return useMutation<ParkingSpot, Error, { id: string; data: UpdateParkingSpotRequest }>({
    mutationFn: ({ id, data }) => updateParkingSpot(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate parking spot caches
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.counts() });

      // Show success toast
      toast.success('Parking spot updated successfully!');
    },
    onError: (error: any) => {
      // Handle 409 Conflict - duplicate spot number
      if (error.response?.status === 409) {
        toast.error('A parking spot with this number already exists in this building.');
        return;
      }
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update parking spot';
      toast.error(message);
    }
  });
}

// ============================================================================
// DELETE PARKING SPOT HOOK
// ============================================================================

/**
 * Hook to soft delete a parking spot
 *
 * @returns UseMutationResult for deleting parking spot
 *
 * @example
 * ```typescript
 * const { mutate: deleteSpot, isPending } = useDeleteParkingSpot();
 *
 * const handleDelete = () => {
 *   deleteSpot(spotId);
 * };
 * ```
 */
export function useDeleteParkingSpot() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteParkingSpot,
    onSuccess: (_, spotId) => {
      // Invalidate parking spot caches
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.detail(spotId) });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.counts() });

      // Show success toast
      toast.success('Parking spot deleted successfully!');
    },
    onError: (error: any) => {
      // Handle 400 Bad Request - cannot delete ASSIGNED spot
      if (error.response?.status === 400) {
        toast.error('Cannot delete an assigned parking spot. Unassign the tenant first.');
        return;
      }
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to delete parking spot';
      toast.error(message);
    }
  });
}

// ============================================================================
// CHANGE STATUS HOOK
// ============================================================================

/**
 * Hook to change parking spot status
 *
 * @returns UseMutationResult for changing status
 *
 * @example
 * ```typescript
 * const { mutate: changeStatus, isPending } = useChangeParkingSpotStatus();
 *
 * const handleStatusChange = (newStatus: ParkingSpotStatus) => {
 *   changeStatus({ id: spotId, data: { status: newStatus } });
 * };
 * ```
 */
export function useChangeParkingSpotStatus() {
  const queryClient = useQueryClient();

  return useMutation<ParkingSpot, Error, { id: string; data: ChangeParkingSpotStatusRequest }>({
    mutationFn: ({ id, data }) => changeParkingSpotStatus(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate parking spot caches
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.counts() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.available(data.propertyId) });

      // Show success toast
      toast.success(`Parking spot status changed to ${data.status.replace('_', ' ').toLowerCase()}!`);
    },
    onError: (error: any) => {
      // Handle 400 Bad Request - cannot change ASSIGNED spot status
      if (error.response?.status === 400) {
        toast.error('Cannot change status of an assigned parking spot.');
        return;
      }
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to change status';
      toast.error(message);
    }
  });
}

// ============================================================================
// BULK DELETE HOOK
// ============================================================================

/**
 * Hook to bulk delete parking spots
 *
 * @returns UseMutationResult for bulk delete operation
 *
 * @example
 * ```typescript
 * const { mutate: bulkDelete, isPending } = useBulkDeleteParkingSpots();
 *
 * const handleBulkDelete = (ids: string[]) => {
 *   bulkDelete({ ids });
 * };
 * ```
 */
export function useBulkDeleteParkingSpots() {
  const queryClient = useQueryClient();

  return useMutation<BulkOperationResponse, Error, BulkDeleteParkingSpotRequest>({
    mutationFn: bulkDeleteParkingSpots,
    onSuccess: (response) => {
      // Invalidate parking spot caches
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.counts() });

      // Show appropriate toast
      const { successCount, failedCount } = response;
      if (failedCount === 0) {
        toast.success(`${successCount} parking spot(s) deleted successfully!`);
      } else {
        toast.warning(`${successCount} deleted, ${failedCount} skipped (assigned spots cannot be deleted).`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to delete parking spots';
      toast.error(message);
    }
  });
}

// ============================================================================
// BULK STATUS CHANGE HOOK
// ============================================================================

/**
 * Hook to bulk change parking spot status
 *
 * @returns UseMutationResult for bulk status change operation
 *
 * @example
 * ```typescript
 * const { mutate: bulkChangeStatus, isPending } = useBulkChangeParkingSpotStatus();
 *
 * const handleBulkStatusChange = (ids: string[], status: ParkingSpotStatus) => {
 *   bulkChangeStatus({ ids, status });
 * };
 * ```
 */
export function useBulkChangeParkingSpotStatus() {
  const queryClient = useQueryClient();

  return useMutation<BulkOperationResponse, Error, BulkStatusChangeParkingSpotRequest>({
    mutationFn: bulkChangeParkingSpotStatus,
    onSuccess: (response, { status }) => {
      // Invalidate parking spot caches
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: parkingSpotKeys.counts() });

      // Show appropriate toast
      const { successCount, failedCount } = response;
      const statusLabel = status.replace('_', ' ').toLowerCase();
      if (failedCount === 0) {
        toast.success(`${successCount} parking spot(s) changed to ${statusLabel}!`);
      } else {
        toast.warning(`${successCount} changed, ${failedCount} skipped (assigned spots cannot be modified).`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to change parking spot status';
      toast.error(message);
    }
  });
}

// ============================================================================
// AVAILABLE PARKING SPOTS HOOK
// ============================================================================

/**
 * Hook to fetch available parking spots for a property
 * Used in tenant onboarding for parking allocation dropdown
 *
 * @param propertyId - Property UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with available parking spots
 *
 * @example
 * ```typescript
 * const { data: availableSpots, isLoading } = useAvailableParkingSpots(propertyId);
 *
 * return (
 *   <Select>
 *     {availableSpots?.map(spot => (
 *       <SelectItem key={spot.id} value={spot.id}>
 *         {spot.spotNumber} - AED {spot.defaultFee}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useAvailableParkingSpots(propertyId: string, enabled: boolean = true) {
  return useQuery<ParkingSpot[]>({
    queryKey: parkingSpotKeys.available(propertyId),
    queryFn: () => getAvailableParkingSpots(propertyId),
    staleTime: 1 * 60 * 1000, // 1 minute - shorter for allocation scenarios
    enabled: enabled && !!propertyId
  });
}

// ============================================================================
// PARKING SPOTS BY PROPERTY HOOK
// ============================================================================

/**
 * Hook to fetch parking spots for a specific property
 *
 * @param propertyId - Property UUID
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with paginated parking spots
 */
export function useParkingSpotsByProperty(
  propertyId: string,
  page: number = 0,
  size: number = 20,
  enabled: boolean = true
) {
  return useQuery<ParkingSpotListResponse>({
    queryKey: parkingSpotKeys.byProperty(propertyId),
    queryFn: () => getParkingSpotsByProperty(propertyId, page, size),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!propertyId
  });
}

// ============================================================================
// PARKING SPOT COUNTS HOOK
// ============================================================================

/**
 * Hook to fetch parking spot counts by status
 *
 * @param propertyId - Optional property UUID to filter
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with counts per status
 *
 * @example
 * ```typescript
 * const { data: counts, isLoading } = useParkingSpotCounts();
 *
 * return (
 *   <div>
 *     <span>Available: {counts?.AVAILABLE ?? 0}</span>
 *     <span>Assigned: {counts?.ASSIGNED ?? 0}</span>
 *   </div>
 * );
 * ```
 */
export function useParkingSpotCounts(propertyId?: string, enabled: boolean = true) {
  return useQuery<Record<ParkingSpotStatus, number>>({
    queryKey: parkingSpotKeys.counts(propertyId),
    queryFn: () => getParkingSpotCounts(propertyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch parking spot detail for faster navigation
 *
 * @param queryClient - Query client instance
 * @param spotId - Parking spot UUID to prefetch
 */
export async function prefetchParkingSpotDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  spotId: string
) {
  await queryClient.prefetchQuery({
    queryKey: parkingSpotKeys.detail(spotId),
    queryFn: () => getParkingSpotById(spotId),
    staleTime: 2 * 60 * 1000
  });
}

/**
 * Prefetch available parking spots for property
 *
 * @param queryClient - Query client instance
 * @param propertyId - Property UUID
 */
export async function prefetchAvailableParkingSpots(
  queryClient: ReturnType<typeof useQueryClient>,
  propertyId: string
) {
  await queryClient.prefetchQuery({
    queryKey: parkingSpotKeys.available(propertyId),
    queryFn: () => getAvailableParkingSpots(propertyId),
    staleTime: 1 * 60 * 1000
  });
}
