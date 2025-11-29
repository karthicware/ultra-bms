/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Asset Management
 * Story 7.1: Asset Registry and Tracking
 *
 * Provides hooks for fetching, creating, updating assets and managing documents
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  updateAssetStatus,
  deleteAsset,
  getAssetMaintenanceHistory,
  uploadAssetDocument,
  deleteAssetDocument,
  downloadAssetDocument,
  getDocumentDownloadUrl,
  getExpiringWarranties,
  getAssetsForDropdown
} from '@/services/asset.service';
import type {
  Asset,
  AssetDetail,
  AssetFilter,
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetStatusUpdateRequest,
  AssetDocument,
  AssetListResponse,
  AssetMaintenanceHistoryResponse,
  ExpiringWarrantyItem,
  AssetDocumentType,
  AssetListItem
} from '@/types/asset';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetFilter) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  maintenanceHistory: (id: string, page?: number) => [...assetKeys.all, 'maintenance-history', id, page] as const,
  expiringWarranties: (days?: number) => [...assetKeys.all, 'expiring-warranties', days] as const,
  dropdown: (propertyId?: string) => [...assetKeys.all, 'dropdown', propertyId] as const
};

// ============================================================================
// LIST ASSETS HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of assets with filters
 *
 * @param filters - Optional filters (propertyId, category, status, search, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with assets data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useAssets({
 *   status: 'ACTIVE',
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <AssetTable
 *     assets={data.data.content}
 *     pagination={data.data}
 *   />
 * );
 * ```
 */
export function useAssets(filters?: AssetFilter, enabled: boolean = true) {
  return useQuery<AssetListResponse>({
    queryKey: assetKeys.list(filters ?? {}),
    queryFn: () => getAssets(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// GET ASSET BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single asset by ID
 *
 * @param id - Asset UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with asset detail data
 *
 * @example
 * ```typescript
 * const { data: asset, isLoading, error } = useAsset(assetId);
 *
 * if (isLoading) return <AssetDetailSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <AssetDetailPage asset={asset} />;
 * ```
 */
export function useAsset(id: string, enabled: boolean = true) {
  return useQuery<AssetDetail>({
    queryKey: assetKeys.detail(id),
    queryFn: () => getAssetById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// CREATE ASSET HOOK
// ============================================================================

/**
 * Hook to create a new asset
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for creating asset
 *
 * @example
 * ```typescript
 * const { mutate: createAsset, isPending } = useCreateAsset();
 *
 * const handleSubmit = (data: AssetCreateRequest) => {
 *   createAsset(data);
 * };
 *
 * return (
 *   <AssetForm
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Asset, Error, AssetCreateRequest>({
    mutationFn: createAsset,
    onSuccess: (data) => {
      // Invalidate asset list cache
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.expiringWarranties() });
      queryClient.invalidateQueries({ queryKey: assetKeys.dropdown() });

      // Show success toast
      toast.success(`Asset ${data.assetNumber} created successfully!`);

      // Navigate to asset detail page
      router.push(`/assets/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create asset';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE ASSET HOOK
// ============================================================================

/**
 * Hook to update an existing asset
 *
 * Handles success toast, cache invalidation
 *
 * @returns UseMutationResult for updating asset
 *
 * @example
 * ```typescript
 * const { mutate: updateAsset, isPending } = useUpdateAsset();
 *
 * const handleSubmit = (data: AssetUpdateRequest) => {
 *   updateAsset({ id: assetId, data });
 * };
 * ```
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation<Asset, Error, { id: string; data: AssetUpdateRequest }>({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate asset caches
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.expiringWarranties() });
      queryClient.invalidateQueries({ queryKey: assetKeys.dropdown() });

      // Show success toast
      toast.success('Asset updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update asset';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE ASSET STATUS HOOK
// ============================================================================

/**
 * Hook to update asset status
 *
 * @returns UseMutationResult for updating asset status
 *
 * @example
 * ```typescript
 * const { mutate: updateStatus, isPending } = useUpdateAssetStatus();
 *
 * const handleStatusChange = (status: AssetStatus, notes?: string) => {
 *   updateStatus({ id: assetId, data: { status, notes } });
 * };
 * ```
 */
export function useUpdateAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation<Asset, Error, { id: string; data: AssetStatusUpdateRequest }>({
    mutationFn: ({ id, data }) => updateAssetStatus(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate asset caches
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.dropdown() });

      // Show success toast
      toast.success('Asset status updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update asset status';
      toast.error(message);
    }
  });
}

// ============================================================================
// DELETE ASSET HOOK
// ============================================================================

/**
 * Hook to soft delete an asset (dispose)
 *
 * @returns UseMutationResult for deleting asset
 *
 * @example
 * ```typescript
 * const { mutate: deleteAsset, isPending } = useDeleteAsset();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure you want to dispose this asset?')) {
 *     deleteAsset(assetId);
 *   }
 * };
 * ```
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, string>({
    mutationFn: deleteAsset,
    onSuccess: (_, assetId) => {
      // Invalidate asset caches
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.dropdown() });

      // Show success toast
      toast.success('Asset disposed successfully!');

      // Navigate to asset list
      router.push('/assets');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to dispose asset';
      toast.error(message);
    }
  });
}

// ============================================================================
// MAINTENANCE HISTORY HOOK
// ============================================================================

/**
 * Hook to fetch maintenance history for an asset
 *
 * @param assetId - Asset UUID
 * @param page - Page number (0-indexed)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with maintenance history data
 *
 * @example
 * ```typescript
 * const { data: history, isLoading } = useAssetMaintenanceHistory(assetId, page);
 *
 * return (
 *   <MaintenanceHistoryTable
 *     history={history?.data.content ?? []}
 *     totalCost={history?.data.totalMaintenanceCost ?? 0}
 *     pagination={history?.data}
 *   />
 * );
 * ```
 */
export function useAssetMaintenanceHistory(
  assetId: string,
  page: number = 0,
  enabled: boolean = true
) {
  return useQuery<AssetMaintenanceHistoryResponse>({
    queryKey: assetKeys.maintenanceHistory(assetId, page),
    queryFn: () => getAssetMaintenanceHistory(assetId, page),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!assetId
  });
}

// ============================================================================
// EXPIRING WARRANTIES HOOK
// ============================================================================

/**
 * Hook to fetch assets with expiring warranties
 *
 * @param days - Number of days to look ahead (default: 30)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expiring warranties data
 *
 * @example
 * ```typescript
 * const { data: expiring, isLoading } = useExpiringWarranties(30);
 *
 * return (
 *   <ExpiringWarrantiesList
 *     assets={expiring ?? []}
 *     isLoading={isLoading}
 *   />
 * );
 * ```
 */
export function useExpiringWarranties(days: number = 30, enabled: boolean = true) {
  return useQuery<ExpiringWarrantyItem[]>({
    queryKey: assetKeys.expiringWarranties(days),
    queryFn: () => getExpiringWarranties(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// ASSETS FOR DROPDOWN HOOK
// ============================================================================

/**
 * Hook to fetch assets for dropdown selection
 *
 * @param propertyId - Optional property UUID to filter by
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with asset list for dropdown
 *
 * @example
 * ```typescript
 * const { data: assets, isLoading } = useAssetsForDropdown(propertyId);
 *
 * return (
 *   <Select>
 *     {assets?.map(asset => (
 *       <SelectItem key={asset.id} value={asset.id}>
 *         {asset.assetName} ({asset.assetNumber})
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useAssetsForDropdown(propertyId?: string, enabled: boolean = true) {
  return useQuery<AssetListItem[]>({
    queryKey: assetKeys.dropdown(propertyId),
    queryFn: () => getAssetsForDropdown(propertyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// UPLOAD DOCUMENT HOOK
// ============================================================================

/**
 * Hook to upload a document for an asset
 *
 * @returns UseMutationResult for uploading document
 *
 * @example
 * ```typescript
 * const { mutate: uploadDocument, isPending } = useUploadAssetDocument();
 *
 * const handleUpload = (file: File, documentType: AssetDocumentType) => {
 *   uploadDocument({ assetId, file, documentType });
 * };
 * ```
 */
export function useUploadAssetDocument() {
  const queryClient = useQueryClient();

  return useMutation<AssetDocument, Error, { assetId: string; file: File; documentType: AssetDocumentType }>({
    mutationFn: ({ assetId, file, documentType }) => uploadAssetDocument(assetId, file, documentType),
    onSuccess: (_, { assetId }) => {
      // Invalidate asset detail cache
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });

      // Show success toast
      toast.success('Document uploaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to upload document';
      toast.error(message);
    }
  });
}

// ============================================================================
// DELETE DOCUMENT HOOK
// ============================================================================

/**
 * Hook to delete a document from an asset
 *
 * @returns UseMutationResult for deleting document
 *
 * @example
 * ```typescript
 * const { mutate: deleteDocument, isPending } = useDeleteAssetDocument();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     deleteDocument({ assetId, documentId });
 *   }
 * };
 * ```
 */
export function useDeleteAssetDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { assetId: string; documentId: string }>({
    mutationFn: ({ assetId, documentId }) => deleteAssetDocument(assetId, documentId),
    onSuccess: (_, { assetId }) => {
      // Invalidate asset detail cache
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });

      // Show success toast
      toast.success('Document deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to delete document';
      toast.error(message);
    }
  });
}

// ============================================================================
// DOWNLOAD DOCUMENT HOOK
// ============================================================================

/**
 * Hook to download an asset document
 *
 * @returns UseMutationResult for downloading document
 *
 * @example
 * ```typescript
 * const { mutate: downloadDocument, isPending } = useDownloadAssetDocument();
 *
 * const handleDownload = (doc: AssetDocument) => {
 *   downloadDocument({ assetId, documentId: doc.id, fileName: doc.fileName });
 * };
 * ```
 */
export function useDownloadAssetDocument() {
  return useMutation<Blob, Error, { assetId: string; documentId: string; fileName: string }>({
    mutationFn: ({ assetId, documentId }) => downloadAssetDocument(assetId, documentId),
    onSuccess: (blob, { fileName }) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to download document';
      toast.error(message);
    }
  });
}

/**
 * Hook to get document download URL (presigned S3 URL)
 *
 * @returns UseMutationResult for getting download URL
 */
export function useGetDocumentDownloadUrl() {
  return useMutation<string, Error, { assetId: string; documentId: string }>({
    mutationFn: ({ assetId, documentId }) => getDocumentDownloadUrl(assetId, documentId),
    onSuccess: (url) => {
      // Open in new tab
      window.open(url, '_blank');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to get document URL';
      toast.error(message);
    }
  });
}

// ============================================================================
// PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch asset detail for faster navigation
 *
 * @param queryClient - Query client instance
 * @param assetId - Asset UUID to prefetch
 */
export async function prefetchAssetDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  assetId: string
) {
  await queryClient.prefetchQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: () => getAssetById(assetId),
    staleTime: 2 * 60 * 1000
  });
}

/**
 * Prefetch expiring warranties for dashboard
 *
 * @param queryClient - Query client instance
 * @param days - Number of days to look ahead
 */
export async function prefetchExpiringWarranties(
  queryClient: ReturnType<typeof useQueryClient>,
  days: number = 30
) {
  await queryClient.prefetchQuery({
    queryKey: assetKeys.expiringWarranties(days),
    queryFn: () => getExpiringWarranties(days),
    staleTime: 5 * 60 * 1000
  });
}
