/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Document Management
 * Story 7.2: Document Management System
 *
 * Provides hooks for fetching, uploading, updating, replacing, and deleting documents
 * with automatic cache invalidation and upload progress tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  replaceDocument,
  deleteDocument,
  getVersionHistory,
  downloadDocument,
  previewDocument,
  getExpiringDocuments,
  getPropertyDocuments,
  getTenantDocuments,
  getVendorDocuments,
  getAssetDocuments
} from '@/services/document.service';
import type {
  Document,
  DocumentListItem,
  DocumentVersion,
  ExpiringDocument,
  DocumentFilters,
  DocumentUpdate,
  DocumentEntityType
} from '@/types/document';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  versions: (id: string) => [...documentKeys.all, 'versions', id] as const,
  expiring: (days?: number) => [...documentKeys.all, 'expiring', days] as const,
  entityDocs: (entityType: DocumentEntityType, entityId: string) =>
    [...documentKeys.all, 'entity', entityType, entityId] as const
};

// ============================================================================
// GET DOCUMENTS LIST HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of documents with optional filters
 *
 * @param filters - Optional filter parameters
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with paginated documents data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useDocuments({
 *   entityType: DocumentEntityType.PROPERTY,
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <DocumentTable documents={data.content} />;
 * ```
 */
export function useDocuments(filters?: DocumentFilters, enabled: boolean = true) {
  return useQuery<{
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }>({
    queryKey: documentKeys.list(filters),
    queryFn: () => getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// GET DOCUMENT DETAIL HOOK
// ============================================================================

/**
 * Hook to fetch a single document by ID
 *
 * @param documentId - Document UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with document data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data: document, isLoading, error } = useDocument(documentId);
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <DocumentDetail document={document} />;
 * ```
 */
export function useDocument(documentId: string, enabled: boolean = true) {
  return useQuery<Document>({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocument(documentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!documentId
  });
}

// ============================================================================
// GET EXPIRING DOCUMENTS HOOK
// ============================================================================

/**
 * Hook to fetch documents expiring within specified days
 *
 * @param days - Days until expiry threshold (default 30)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expiring documents data
 *
 * @example
 * ```typescript
 * const { data: expiringDocs, isLoading } = useExpiringDocuments(30);
 *
 * if (isLoading) return <CardSkeleton />;
 *
 * return (
 *   <ExpiringDocumentsCard documents={expiringDocs} />
 * );
 * ```
 */
export function useExpiringDocuments(days: number = 30, enabled: boolean = true) {
  return useQuery<ExpiringDocument[]>({
    queryKey: documentKeys.expiring(days),
    queryFn: () => getExpiringDocuments(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// GET DOCUMENT VERSIONS HOOK
// ============================================================================

/**
 * Hook to fetch version history for a document
 *
 * @param documentId - Document UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with versions data
 *
 * @example
 * ```typescript
 * const { data: versions, isLoading } = useDocumentVersions(documentId);
 *
 * return (
 *   <VersionHistory versions={versions} />
 * );
 * ```
 */
export function useDocumentVersions(documentId: string, enabled: boolean = true) {
  return useQuery<DocumentVersion[]>({
    queryKey: documentKeys.versions(documentId),
    queryFn: () => getVersionHistory(documentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!documentId
  });
}

// ============================================================================
// GET ENTITY DOCUMENTS HOOKS
// ============================================================================

/**
 * Hook to fetch documents for a specific entity
 *
 * @param entityType - Entity type (PROPERTY, TENANT, VENDOR, ASSET)
 * @param entityId - Entity UUID
 * @param filters - Additional filter parameters
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with paginated documents for the entity
 */
export function useEntityDocuments(
  entityType: DocumentEntityType,
  entityId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>,
  enabled: boolean = true
) {
  return useQuery<{
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }>({
    queryKey: documentKeys.entityDocs(entityType, entityId),
    queryFn: () =>
      getDocuments({
        ...filters,
        entityType,
        entityId
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!entityId
  });
}

/**
 * Hook to fetch documents for a property
 */
export function usePropertyDocuments(
  propertyId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>,
  enabled: boolean = true
) {
  return useQuery<{
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }>({
    queryKey: [...documentKeys.all, 'property', propertyId, filters],
    queryFn: () => getPropertyDocuments(propertyId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!propertyId
  });
}

/**
 * Hook to fetch documents for a tenant
 */
export function useTenantDocuments(
  tenantId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>,
  enabled: boolean = true
) {
  return useQuery<{
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }>({
    queryKey: [...documentKeys.all, 'tenant', tenantId, filters],
    queryFn: () => getTenantDocuments(tenantId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!tenantId
  });
}

/**
 * Hook to fetch documents for a vendor
 */
export function useVendorDocs(
  vendorId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>,
  enabled: boolean = true
) {
  return useQuery<{
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }>({
    queryKey: [...documentKeys.all, 'vendor', vendorId, filters],
    queryFn: () => getVendorDocuments(vendorId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!vendorId
  });
}

/**
 * Hook to fetch documents for an asset
 */
export function useAssetDocuments(
  assetId: string,
  filters?: Omit<DocumentFilters, 'entityType' | 'entityId'>,
  enabled: boolean = true
) {
  return useQuery<{
    content: DocumentListItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }>({
    queryKey: [...documentKeys.all, 'asset', assetId, filters],
    queryFn: () => getAssetDocuments(assetId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!assetId
  });
}

// ============================================================================
// UPLOAD DOCUMENT HOOK
// ============================================================================

/**
 * Hook to upload a new document
 *
 * Provides upload progress tracking via uploadProgress state
 *
 * @returns UseMutationResult with upload progress tracking
 *
 * @example
 * ```typescript
 * const { mutate: upload, isPending, uploadProgress } = useUploadDocument();
 *
 * const handleUpload = (formData) => {
 *   upload(formData, {
 *     onSuccess: (document) => {
 *       toast.success(`Document ${document.documentNumber} uploaded!`);
 *       router.push(`/documents/${document.id}`);
 *     }
 *   });
 * };
 *
 * return (
 *   <div>
 *     <Button onClick={handleUpload} disabled={isPending}>
 *       Upload
 *     </Button>
 *     {isPending && <Progress value={uploadProgress} />}
 *   </div>
 * );
 * ```
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation<Document, Error, FormData>({
    mutationFn: (formData) => {
      return uploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: () => {
      // Reset progress
      setUploadProgress(0);

      // Invalidate all document list caches
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      // Invalidate expiring documents cache
      queryClient.invalidateQueries({ queryKey: documentKeys.expiring() });

      toast.success('Document uploaded successfully!');
    },
    onError: (error: any) => {
      setUploadProgress(0);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to upload document';
      toast.error(message);
    }
  });

  return {
    ...mutation,
    uploadProgress
  };
}

// ============================================================================
// UPDATE DOCUMENT HOOK
// ============================================================================

/**
 * Hook to update document metadata
 *
 * @returns UseMutationResult for updating document
 *
 * @example
 * ```typescript
 * const { mutate: update, isPending } = useUpdateDocument();
 *
 * const handleUpdate = (data) => {
 *   update({ documentId, data }, {
 *     onSuccess: () => {
 *       toast.success('Document updated!');
 *     }
 *   });
 * };
 * ```
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation<Document, Error, { documentId: string; data: DocumentUpdate }>({
    mutationFn: ({ documentId, data }) => updateDocument(documentId, data),
    onSuccess: (result, { documentId }) => {
      // Invalidate specific document cache
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });

      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      // Invalidate expiring documents cache (expiry date might have changed)
      queryClient.invalidateQueries({ queryKey: documentKeys.expiring() });

      toast.success('Document updated successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to update document';
      toast.error(message);
    }
  });
}

// ============================================================================
// REPLACE DOCUMENT HOOK
// ============================================================================

/**
 * Hook to replace document file with new version
 *
 * Provides upload progress tracking
 *
 * @returns UseMutationResult with upload progress tracking
 *
 * @example
 * ```typescript
 * const { mutate: replace, isPending, uploadProgress } = useReplaceDocument();
 *
 * const handleReplace = (formData) => {
 *   replace({ documentId, formData }, {
 *     onSuccess: (doc) => {
 *       toast.success(`Version ${doc.version} created!`);
 *     }
 *   });
 * };
 * ```
 */
export function useReplaceDocument() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation<Document, Error, { documentId: string; formData: FormData }>({
    mutationFn: ({ documentId, formData }) => {
      return replaceDocument(documentId, formData, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: (result, { documentId }) => {
      // Reset progress
      setUploadProgress(0);

      // Invalidate specific document cache
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });

      // Invalidate version history cache
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(documentId) });

      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      toast.success(`Document replaced! Now at version ${result.version}`);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to replace document';
      toast.error(message);
    }
  });

  return {
    ...mutation,
    uploadProgress
  };
}

// ============================================================================
// DELETE DOCUMENT HOOK
// ============================================================================

/**
 * Hook to soft delete a document
 *
 * @returns UseMutationResult for deleting document
 *
 * @example
 * ```typescript
 * const { mutate: deleteDoc, isPending } = useDeleteDocument();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure you want to delete this document?')) {
 *     deleteDoc(documentId, {
 *       onSuccess: () => {
 *         router.push('/documents');
 *       }
 *     });
 *   }
 * };
 * ```
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (documentId) => deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      // Invalidate specific document cache
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });

      // Invalidate all document list caches
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      // Invalidate expiring documents cache
      queryClient.invalidateQueries({ queryKey: documentKeys.expiring() });

      toast.success('Document deleted successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to delete document';
      toast.error(message);
    }
  });
}

// ============================================================================
// DOWNLOAD DOCUMENT HOOK
// ============================================================================

/**
 * Hook to get document download URL
 *
 * @returns UseMutationResult for downloading document
 *
 * @example
 * ```typescript
 * const { mutate: download, isPending } = useDownloadDocument();
 *
 * const handleDownload = () => {
 *   download(documentId);
 * };
 * ```
 */
export function useDownloadDocument() {
  return useMutation<{ downloadUrl: string; fileName: string; fileType: string }, Error, string>({
    mutationFn: (documentId) => downloadDocument(documentId),
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to download document';
      toast.error(message);
    }
  });
}

// ============================================================================
// PREVIEW DOCUMENT HOOK
// ============================================================================

/**
 * Hook to get document preview URL
 *
 * @returns UseMutationResult for previewing document
 *
 * @example
 * ```typescript
 * const { mutate: preview, data: previewData, isPending } = usePreviewDocument();
 *
 * const handlePreview = () => {
 *   preview(documentId);
 * };
 *
 * if (previewData?.canPreview) {
 *   // Show preview modal
 * }
 * ```
 */
export function usePreviewDocument() {
  return useMutation<
    { previewUrl: string; fileName: string; fileType: string; canPreview: boolean },
    Error,
    string
  >({
    mutationFn: (documentId) => previewDocument(documentId),
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to load preview';
      toast.error(message);
    }
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get total document count
 *
 * @param filters - Optional filter parameters
 *
 * @returns Total document count or undefined if loading
 */
export function useDocumentCount(filters?: DocumentFilters): number | undefined {
  const { data } = useDocuments(filters);
  return data?.totalElements;
}

/**
 * Hook to prefetch document detail
 *
 * @param documentId - Document UUID
 */
export function usePrefetchDocument() {
  const queryClient = useQueryClient();

  return (documentId: string) => {
    queryClient.prefetchQuery({
      queryKey: documentKeys.detail(documentId),
      queryFn: () => getDocument(documentId),
      staleTime: 5 * 60 * 1000
    });
  };
}

/**
 * Hook to check if there are expiring documents
 *
 * @param days - Days until expiry threshold (default 30)
 *
 * @returns Object with hasExpiring flag and count
 */
export function useHasExpiringDocuments(days: number = 30) {
  const { data, isLoading } = useExpiringDocuments(days);

  return {
    isLoading,
    hasExpiring: (data?.length ?? 0) > 0,
    count: data?.length ?? 0
  };
}
