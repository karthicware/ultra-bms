/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for PDC (Post-Dated Cheque) Management
 * Story 6.3: Post-Dated Cheque (PDC) Management
 *
 * Provides hooks for fetching, creating PDCs and status transitions
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getPDCs,
  getPDCById,
  createPDC,
  createBulkPDCs,
  depositPDC,
  clearPDC,
  bouncePDC,
  replacePDC,
  withdrawPDC,
  cancelPDC,
  getPDCDashboard,
  getWithdrawals,
  exportWithdrawals,
  getTenantPDCHistory,
  getBankAccounts,
  getPDCHolder
} from '@/services/pdc.service';
import type {
  PDC,
  PDCDetail,
  PDCFilter,
  PDCCreateRequest,
  PDCBulkCreateRequest,
  PDCDepositRequest,
  PDCClearRequest,
  PDCBounceRequest,
  PDCReplaceRequest,
  PDCWithdrawRequest,
  PDCDashboard,
  PDCWithdrawalFilter,
  PDCListResponse,
  PDCReplaceResponse,
  TenantPDCHistoryResponse,
  PDCWithdrawalHistoryResponse,
  BankAccountOption,
  PDCHolder
} from '@/types/pdc';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const pdcKeys = {
  all: ['pdcs'] as const,
  lists: () => [...pdcKeys.all, 'list'] as const,
  list: (filters: PDCFilter) => [...pdcKeys.lists(), filters] as const,
  details: () => [...pdcKeys.all, 'detail'] as const,
  detail: (id: string) => [...pdcKeys.details(), id] as const,
  dashboard: () => [...pdcKeys.all, 'dashboard'] as const,
  withdrawals: () => [...pdcKeys.all, 'withdrawals'] as const,
  withdrawalList: (filters: PDCWithdrawalFilter) => [...pdcKeys.withdrawals(), filters] as const,
  tenantHistory: (tenantId: string) => [...pdcKeys.all, 'tenant', tenantId] as const,
  bankAccounts: () => [...pdcKeys.all, 'bank-accounts'] as const,
  holder: () => [...pdcKeys.all, 'holder'] as const
};

// ============================================================================
// LIST PDCS HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of PDCs with filters
 *
 * @param filters - Optional filters (status, tenant, bank, date range, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with PDCs data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = usePDCs({
 *   status: 'DUE',
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <PDCTable
 *     pdcs={data.data.content}
 *     pagination={data.data}
 *   />
 * );
 * ```
 */
export function usePDCs(filters?: PDCFilter, enabled: boolean = true) {
  return useQuery<PDCListResponse>({
    queryKey: pdcKeys.list(filters ?? {}),
    queryFn: () => getPDCs(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// GET PDC BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single PDC by ID
 *
 * @param id - PDC UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with PDC detail data
 *
 * @example
 * ```typescript
 * const { data: pdc, isLoading, error } = usePDC(pdcId);
 *
 * if (isLoading) return <PDCDetailSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <PDCDetailPage pdc={pdc} />;
 * ```
 */
export function usePDC(id: string, enabled: boolean = true) {
  return useQuery<PDCDetail>({
    queryKey: pdcKeys.detail(id),
    queryFn: () => getPDCById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// PDC DASHBOARD HOOK
// ============================================================================

/**
 * Hook to fetch PDC dashboard data (KPIs, upcoming, recently deposited)
 *
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with dashboard data
 *
 * @example
 * ```typescript
 * const { data: dashboard, isLoading } = usePDCDashboard();
 *
 * return (
 *   <PDCDashboardPage
 *     dashboard={dashboard}
 *     isLoading={isLoading}
 *   />
 * );
 * ```
 */
export function usePDCDashboard(enabled: boolean = true) {
  return useQuery<PDCDashboard>({
    queryKey: pdcKeys.dashboard(),
    queryFn: getPDCDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// CREATE PDC HOOKS
// ============================================================================

/**
 * Hook to create a new single PDC
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for creating PDC
 *
 * @example
 * ```typescript
 * const { mutate: createPDC, isPending } = useCreatePDC();
 *
 * const handleSubmit = (data: PDCCreateRequest) => {
 *   createPDC(data);
 * };
 * ```
 */
export function useCreatePDC() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<PDC, Error, PDCCreateRequest>({
    mutationFn: createPDC,
    onSuccess: (data) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.tenantId) });

      // Show success toast
      toast.success(`PDC ${data.chequeNumber} registered successfully!`);

      // Navigate to PDC detail page
      router.push(`/finance/pdc/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create PDC';
      toast.error(message);
    }
  });
}

/**
 * Hook to create multiple PDCs in bulk (atomic)
 *
 * @returns UseMutationResult for bulk PDC creation
 *
 * @example
 * ```typescript
 * const { mutate: createBulk, isPending } = useCreateBulkPDCs();
 *
 * const handleBulkSubmit = (data: PDCBulkCreateRequest) => {
 *   createBulk(data);
 * };
 * ```
 */
export function useCreateBulkPDCs() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<PDC[], Error, PDCBulkCreateRequest>({
    mutationFn: createBulkPDCs,
    onSuccess: (data) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data[0].tenantId) });
      }

      // Show success toast
      toast.success(`${data.length} PDC(s) registered successfully!`);

      // Navigate to PDC list
      router.push('/finance/pdc/list');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to register PDCs';
      toast.error(message);
    }
  });
}

// ============================================================================
// PDC STATUS ACTION HOOKS
// ============================================================================

/**
 * Hook to deposit a PDC
 *
 * @returns UseMutationResult for depositing PDC
 *
 * @example
 * ```typescript
 * const { mutate: deposit, isPending } = useDepositPDC();
 *
 * const handleDeposit = (data: PDCDepositRequest) => {
 *   deposit({ id: pdcId, data });
 * };
 * ```
 */
export function useDepositPDC() {
  const queryClient = useQueryClient();

  return useMutation<PDC, Error, { id: string; data: PDCDepositRequest }>({
    mutationFn: ({ id, data }) => depositPDC(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.tenantId) });

      // Show success toast
      toast.success('PDC marked as deposited!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to deposit PDC';
      toast.error(message);
    }
  });
}

/**
 * Hook to clear a PDC (mark as payment confirmed)
 *
 * @returns UseMutationResult for clearing PDC
 *
 * @example
 * ```typescript
 * const { mutate: clear, isPending } = useClearPDC();
 *
 * const handleClear = (data: PDCClearRequest) => {
 *   clear({ id: pdcId, data });
 * };
 * ```
 */
export function useClearPDC() {
  const queryClient = useQueryClient();

  return useMutation<PDC, Error, { id: string; data: PDCClearRequest }>({
    mutationFn: ({ id, data }) => clearPDC(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.tenantId) });

      // Show success toast
      toast.success('PDC cleared! Payment confirmed.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to clear PDC';
      toast.error(message);
    }
  });
}

/**
 * Hook to bounce a PDC (mark as payment failed)
 *
 * @returns UseMutationResult for bouncing PDC
 *
 * @example
 * ```typescript
 * const { mutate: bounce, isPending } = useBouncePDC();
 *
 * const handleBounce = (data: PDCBounceRequest) => {
 *   bounce({ id: pdcId, data });
 * };
 * ```
 */
export function useBouncePDC() {
  const queryClient = useQueryClient();

  return useMutation<PDC, Error, { id: string; data: PDCBounceRequest }>({
    mutationFn: ({ id, data }) => bouncePDC(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.tenantId) });

      // Show warning toast
      toast.warning('PDC marked as bounced. Notifications sent.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to mark PDC as bounced';
      toast.error(message);
    }
  });
}

/**
 * Hook to replace a bounced PDC with a new cheque
 *
 * @returns UseMutationResult for replacing PDC
 *
 * @example
 * ```typescript
 * const { mutate: replace, isPending } = useReplacePDC();
 *
 * const handleReplace = (data: PDCReplaceRequest) => {
 *   replace({ id: pdcId, data });
 * };
 * ```
 */
export function useReplacePDC() {
  const queryClient = useQueryClient();

  return useMutation<PDCReplaceResponse['data'], Error, { id: string; data: PDCReplaceRequest }>({
    mutationFn: ({ id, data }) => replacePDC(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.original.tenantId) });

      // Show success toast
      toast.success(`Bounced PDC replaced with ${data.replacement.chequeNumber}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to replace PDC';
      toast.error(message);
    }
  });
}

/**
 * Hook to withdraw a PDC (return to tenant)
 *
 * @returns UseMutationResult for withdrawing PDC
 *
 * @example
 * ```typescript
 * const { mutate: withdraw, isPending } = useWithdrawPDC();
 *
 * const handleWithdraw = (data: PDCWithdrawRequest) => {
 *   withdraw({ id: pdcId, data });
 * };
 * ```
 */
export function useWithdrawPDC() {
  const queryClient = useQueryClient();

  return useMutation<PDC, Error, { id: string; data: PDCWithdrawRequest }>({
    mutationFn: ({ id, data }) => withdrawPDC(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.withdrawals() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.tenantId) });

      // Show success toast
      toast.success('PDC withdrawn successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to withdraw PDC';
      toast.error(message);
    }
  });
}

/**
 * Hook to cancel a PDC
 *
 * @returns UseMutationResult for cancelling PDC
 *
 * @example
 * ```typescript
 * const { mutate: cancel, isPending } = useCancelPDC();
 *
 * const handleCancel = () => {
 *   cancel(pdcId);
 * };
 * ```
 */
export function useCancelPDC() {
  const queryClient = useQueryClient();

  return useMutation<PDC, Error, string>({
    mutationFn: cancelPDC,
    onSuccess: (data, id) => {
      // Invalidate PDC caches
      queryClient.invalidateQueries({ queryKey: pdcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdcKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: pdcKeys.tenantHistory(data.tenantId) });

      // Show success toast
      toast.success('PDC cancelled!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to cancel PDC';
      toast.error(message);
    }
  });
}

// ============================================================================
// WITHDRAWAL HISTORY HOOKS
// ============================================================================

/**
 * Hook to fetch PDC withdrawal history
 *
 * @param filters - Optional filters (reason, date range, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with withdrawal history data
 *
 * @example
 * ```typescript
 * const { data: withdrawals, isLoading } = usePDCWithdrawals({
 *   withdrawalReason: 'Cheque Bounced',
 *   page: 0
 * });
 * ```
 */
export function usePDCWithdrawals(filters?: PDCWithdrawalFilter, enabled: boolean = true) {
  return useQuery<PDCWithdrawalHistoryResponse>({
    queryKey: pdcKeys.withdrawalList(filters ?? {}),
    queryFn: () => getWithdrawals(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

/**
 * Hook to export PDC withdrawal history
 *
 * @returns UseMutationResult for exporting withdrawals
 *
 * @example
 * ```typescript
 * const { mutate: exportData, isPending } = useExportPDCWithdrawals();
 *
 * const handleExport = () => {
 *   exportData({ format: 'excel', filters });
 * };
 * ```
 */
export function useExportPDCWithdrawals() {
  return useMutation<Blob, Error, { format: 'pdf' | 'excel'; filters?: PDCWithdrawalFilter }>({
    mutationFn: ({ format, filters }) => exportWithdrawals(format, filters),
    onSuccess: (blob, { format }) => {
      // Determine file extension
      const extension = format === 'pdf' ? '.pdf' : '.xlsx';
      const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // Create download link
      const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `pdc-withdrawals${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export withdrawals';
      toast.error(message);
    }
  });
}

// ============================================================================
// TENANT PDC HISTORY HOOK
// ============================================================================

/**
 * Hook to fetch PDC history for a specific tenant
 *
 * @param tenantId - Tenant UUID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with tenant PDC history and bounce rate
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useTenantPDCHistory(tenantId);
 *
 * console.log(`Bounce rate: ${data?.data.bounceRate}%`);
 * ```
 */
export function useTenantPDCHistory(
  tenantId: string,
  page: number = 0,
  size: number = 20,
  enabled: boolean = true
) {
  return useQuery<TenantPDCHistoryResponse>({
    queryKey: pdcKeys.tenantHistory(tenantId),
    queryFn: () => getTenantPDCHistory(tenantId, page, size),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!tenantId
  });
}

// ============================================================================
// BANK ACCOUNTS HOOK
// ============================================================================

/**
 * Hook to fetch available bank accounts for PDC deposit
 *
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with bank account options
 *
 * @example
 * ```typescript
 * const { data: bankAccounts } = useBankAccounts();
 *
 * return (
 *   <Select>
 *     {bankAccounts?.map(account => (
 *       <SelectItem key={account.id} value={account.id}>
 *         {account.displayName}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useBankAccounts(enabled: boolean = true) {
  return useQuery<BankAccountOption[]>({
    queryKey: pdcKeys.bankAccounts(),
    queryFn: getBankAccounts,
    staleTime: 10 * 60 * 1000, // 10 minutes (bank accounts change infrequently)
    enabled
  });
}

// ============================================================================
// PDC HOLDER HOOK
// ============================================================================

/**
 * Hook to fetch PDC holder info (company profile)
 *
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with PDC holder info
 *
 * @example
 * ```typescript
 * const { data: holder } = usePDCHolder();
 *
 * return <p>Holder: {holder?.companyName}</p>;
 * ```
 */
export function usePDCHolder(enabled: boolean = true) {
  return useQuery<PDCHolder>({
    queryKey: pdcKeys.holder(),
    queryFn: getPDCHolder,
    staleTime: 30 * 60 * 1000, // 30 minutes (company profile changes infrequently)
    enabled
  });
}

// ============================================================================
// PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch PDC detail for faster navigation
 *
 * @param queryClient - Query client instance
 * @param pdcId - PDC UUID to prefetch
 */
export async function prefetchPDCDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  pdcId: string
) {
  await queryClient.prefetchQuery({
    queryKey: pdcKeys.detail(pdcId),
    queryFn: () => getPDCById(pdcId),
    staleTime: 2 * 60 * 1000
  });
}

/**
 * Prefetch PDC dashboard for faster navigation
 *
 * @param queryClient - Query client instance
 */
export async function prefetchPDCDashboard(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.prefetchQuery({
    queryKey: pdcKeys.dashboard(),
    queryFn: getPDCDashboard,
    staleTime: 2 * 60 * 1000
  });
}

/**
 * Prefetch bank accounts for deposit modal
 *
 * @param queryClient - Query client instance
 */
export async function prefetchBankAccounts(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.prefetchQuery({
    queryKey: pdcKeys.bankAccounts(),
    queryFn: getBankAccounts,
    staleTime: 10 * 60 * 1000
  });
}
