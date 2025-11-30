/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Vendor Document Management
 * Story 5.2: Vendor Document and License Management
 *
 * Provides hooks for fetching, uploading, replacing, and deleting vendor documents
 * with automatic cache invalidation and upload progress tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDocuments,
  uploadDocument,
  replaceDocument,
  deleteDocument,
  getExpiringDocuments
} from '@/services/vendor-documents.service';
import {
  ExpiryStatus,
  type VendorDocumentListItem,
  type VendorDocument,
  type ExpiringDocument
} from '@/types/vendor-documents';
import { vendorKeys } from './useVendors';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const vendorDocumentKeys = {
  all: ['vendor-documents'] as const,
  lists: () => [...vendorDocumentKeys.all, 'list'] as const,
  list: (vendorId: string) => [...vendorDocumentKeys.lists(), vendorId] as const,
  expiring: (days?: number) => [...vendorDocumentKeys.all, 'expiring', days] as const
};

// ============================================================================
// GET VENDOR DOCUMENTS HOOK
// ============================================================================

/**
 * Hook to fetch all documents for a vendor
 *
 * @param vendorId - Vendor UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with documents data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data: documents, isLoading, error } = useVendorDocuments(vendorId);
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <DocumentList documents={documents} />;
 * ```
 */
export function useVendorDocuments(vendorId: string, enabled: boolean = true) {
  return useQuery<VendorDocumentListItem[]>({
    queryKey: vendorDocumentKeys.list(vendorId),
    queryFn: () => getDocuments(vendorId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!vendorId
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
    queryKey: vendorDocumentKeys.expiring(days),
    queryFn: () => getExpiringDocuments(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// UPLOAD DOCUMENT HOOK
// ============================================================================

/**
 * Upload params - accepts either FormData or separate data/file
 */
interface UploadParams {
  vendorId: string;
  formData?: FormData;
  data?: {
    documentType: string;
    expiryDate?: string;
    notes?: string;
  };
  file?: File;
}

/**
 * Hook to upload a new document for a vendor
 *
 * Provides upload progress tracking via onUploadProgress callback
 *
 * @returns UseMutationResult with upload progress tracking
 *
 * @example
 * ```typescript
 * const { mutate: upload, isPending, uploadProgress } = useUploadDocument();
 *
 * const handleUpload = (data, file) => {
 *   upload({ vendorId, data, file });
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

  const mutation = useMutation<VendorDocument, Error, UploadParams>({
    mutationFn: ({ vendorId, formData, data, file }) => {
      // If FormData provided directly, use it; otherwise create from data/file
      let fd = formData;
      if (!fd && data && file) {
        fd = new FormData();
        fd.append('file', file);
        fd.append('documentType', data.documentType);
        if (data.expiryDate) {
          fd.append('expiryDate', data.expiryDate);
        }
        if (data.notes) {
          fd.append('notes', data.notes);
        }
      }
      if (!fd) {
        throw new Error('Either formData or data/file must be provided');
      }
      return uploadDocument(vendorId, fd, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: (data, { vendorId }) => {
      // Reset progress
      setUploadProgress(0);

      // Invalidate vendor documents cache
      queryClient.invalidateQueries({ queryKey: vendorDocumentKeys.list(vendorId) });

      // Invalidate expiring documents cache (might have added expiring doc)
      queryClient.invalidateQueries({ queryKey: vendorDocumentKeys.expiring() });

      // Invalidate vendor detail cache (document count might have changed)
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
    },
    onError: () => {
      setUploadProgress(0);
    }
  });

  return {
    ...mutation,
    uploadProgress
  };
}

// ============================================================================
// REPLACE DOCUMENT HOOK
// ============================================================================

/**
 * Replace params - accepts either FormData or separate data/file
 */
interface ReplaceParams {
  vendorId: string;
  documentId: string;
  formData?: FormData;
  data?: {
    documentType: string;
    expiryDate?: string;
    notes?: string;
  };
  file?: File;
}

/**
 * Hook to replace an existing document with a new file
 *
 * Provides upload progress tracking via onUploadProgress callback
 *
 * @returns UseMutationResult with upload progress tracking
 *
 * @example
 * ```typescript
 * const { mutate: replace, isPending, uploadProgress } = useReplaceDocument();
 *
 * const handleReplace = (data, file) => {
 *   replace({ vendorId, documentId, data, file });
 * };
 *
 * return (
 *   <Button onClick={handleReplace} disabled={isPending}>
 *     Replace
 *   </Button>
 * );
 * ```
 */
export function useReplaceDocument() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation<VendorDocument, Error, ReplaceParams>({
    mutationFn: ({ vendorId, documentId, formData, data, file }) => {
      // If FormData provided directly, use it; otherwise create from data/file
      let fd = formData;
      if (!fd && file) {
        fd = new FormData();
        fd.append('file', file);
        if (data?.expiryDate) {
          fd.append('expiryDate', data.expiryDate);
        }
        if (data?.notes) {
          fd.append('notes', data.notes);
        }
      }
      if (!fd) {
        throw new Error('Either formData or file must be provided');
      }
      return replaceDocument(vendorId, documentId, fd, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: (data, { vendorId }) => {
      // Reset progress
      setUploadProgress(0);

      // Invalidate vendor documents cache
      queryClient.invalidateQueries({ queryKey: vendorDocumentKeys.list(vendorId) });

      // Invalidate expiring documents cache (expiry date might have changed)
      queryClient.invalidateQueries({ queryKey: vendorDocumentKeys.expiring() });
    },
    onError: () => {
      setUploadProgress(0);
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
 * Hook to delete a vendor document
 *
 * Handles success toast and cache invalidation
 *
 * @returns UseMutationResult for deleting document
 *
 * @example
 * ```typescript
 * const { mutate: deleteDoc, isPending } = useDeleteDocument();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure you want to delete this document?')) {
 *     deleteDoc({ vendorId, documentId });
 *   }
 * };
 *
 * return (
 *   <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
 *     Delete
 *   </Button>
 * );
 * ```
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { vendorId: string; documentId: string }>({
    mutationFn: ({ vendorId, documentId }) => deleteDocument(vendorId, documentId),
    onSuccess: (_, { vendorId }) => {
      // Invalidate vendor documents cache
      queryClient.invalidateQueries({ queryKey: vendorDocumentKeys.list(vendorId) });

      // Invalidate expiring documents cache (might have removed expiring doc)
      queryClient.invalidateQueries({ queryKey: vendorDocumentKeys.expiring() });

      // Invalidate vendor detail cache (document count might have changed)
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });

      // Show success toast
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
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get document count for a vendor
 *
 * Useful for displaying document count in UI
 *
 * @param vendorId - Vendor UUID
 *
 * @returns Document count or undefined if loading
 */
export function useVendorDocumentCount(vendorId: string): number | undefined {
  const { data } = useVendorDocuments(vendorId);
  return data?.length;
}

/**
 * Hook to check if vendor has critical document issues
 *
 * Returns true if any TRADE_LICENSE or INSURANCE documents are expired or missing
 *
 * @param vendorId - Vendor UUID
 * @param documents - Optional pre-fetched documents (to avoid double fetch)
 *
 * @returns Object with hasExpiredCritical, hasMissingCritical flags and issues
 */
export function useVendorDocumentStatus(
  vendorId: string,
  documents?: VendorDocumentListItem[]
) {
  const { data: fetchedDocs, isLoading } = useVendorDocuments(vendorId, !documents);
  const docs = documents || fetchedDocs;

  if (isLoading || !docs) {
    return {
      isLoading,
      hasIssues: false,
      hasExpiredCritical: false,
      hasMissingCritical: false,
      hasExpiringSoonCritical: false,
      issues: []
    };
  }

  const criticalTypes = ['TRADE_LICENSE', 'INSURANCE'];
  const issues: string[] = [];

  // Check for expired critical documents
  const hasExpiredCritical = docs.some(
    (doc) => criticalTypes.includes(doc.documentType) && doc.expiryStatus === ExpiryStatus.EXPIRED
  );

  docs.forEach((doc) => {
    if (criticalTypes.includes(doc.documentType) && doc.expiryStatus === ExpiryStatus.EXPIRED) {
      issues.push(`${doc.documentType.replace('_', ' ')} has expired`);
    }
  });

  // Check for expiring soon critical documents
  const hasExpiringSoonCritical = docs.some(
    (doc) => criticalTypes.includes(doc.documentType) && doc.expiryStatus === ExpiryStatus.EXPIRING_SOON
  );

  docs.forEach((doc) => {
    if (criticalTypes.includes(doc.documentType) && doc.expiryStatus === ExpiryStatus.EXPIRING_SOON) {
      issues.push(
        `${doc.documentType.replace('_', ' ')} expires in ${doc.daysUntilExpiry} days`
      );
    }
  });

  // Check for missing critical documents
  const hasTradeLicense = docs.some((doc) => doc.documentType === 'TRADE_LICENSE');
  const hasInsurance = docs.some((doc) => doc.documentType === 'INSURANCE');
  const hasMissingCritical = !hasTradeLicense || !hasInsurance;

  if (!hasTradeLicense) {
    issues.push('Trade License document is missing');
  }
  if (!hasInsurance) {
    issues.push('Insurance Certificate is missing');
  }

  return {
    isLoading: false,
    hasIssues: issues.length > 0,
    hasExpiredCritical,
    hasMissingCritical,
    hasExpiringSoonCritical,
    issues
  };
}
