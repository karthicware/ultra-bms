/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Invoice and Payment Management
 * Story 6.1: Rent Invoicing and Payment Management
 *
 * Provides hooks for fetching, creating, updating invoices and recording payments
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  sendInvoice,
  cancelInvoice,
  recordPayment,
  getInvoicePayments,
  getPayments,
  getPaymentById,
  downloadPaymentReceipt,
  downloadInvoicePdf,
  getInvoiceSummary,
  applyLateFee,
  resendInvoiceEmail,
  getTenantInvoices,
  getTenantInvoiceById
} from '@/services/invoice.service';
import type {
  Invoice,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceFilter,
  InvoiceStatus,
  InvoiceCreateRequest,
  InvoiceUpdateRequest,
  InvoiceListResponse,
  Payment,
  PaymentListItem,
  PaymentFilter,
  PaymentCreateRequest,
  PaymentListResponse,
  InvoiceSummary,
  TenantInvoicesResponse
} from '@/types/invoice';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilter) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  payments: (invoiceId: string) => [...invoiceKeys.detail(invoiceId), 'payments'] as const,
  summary: (propertyId?: string) => [...invoiceKeys.all, 'summary', propertyId] as const,
  tenant: () => [...invoiceKeys.all, 'tenant'] as const,
  tenantList: (status?: InvoiceStatus) => [...invoiceKeys.tenant(), 'list', status] as const,
  tenantDetail: (id: string) => [...invoiceKeys.tenant(), 'detail', id] as const
};

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilter) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const
};

// ============================================================================
// LIST INVOICES HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of invoices with filters
 *
 * @param filters - Optional filters (status, property, tenant, date range, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with invoices data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useInvoices({
 *   status: 'OVERDUE',
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <InvoiceTable
 *     invoices={data.data.content}
 *     pagination={data.data}
 *   />
 * );
 * ```
 */
export function useInvoices(filters?: InvoiceFilter, enabled: boolean = true) {
  return useQuery<InvoiceListResponse>({
    queryKey: invoiceKeys.list(filters ?? {}),
    queryFn: () => getInvoices(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (invoices change frequently)
    enabled
  });
}

// ============================================================================
// GET INVOICE BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single invoice by ID with payment history
 *
 * @param id - Invoice UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with invoice detail data including payments
 *
 * @example
 * ```typescript
 * const { data: invoice, isLoading, error } = useInvoice(invoiceId);
 *
 * if (isLoading) return <InvoiceDetailSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <InvoiceDetailPage invoice={invoice} />;
 * ```
 */
export function useInvoice(id: string, enabled: boolean = true) {
  return useQuery<InvoiceDetail>({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// CREATE INVOICE HOOK
// ============================================================================

/**
 * Hook to create a new invoice
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for creating invoice
 *
 * @example
 * ```typescript
 * const { mutate: createInvoice, isPending } = useCreateInvoice();
 *
 * const handleSubmit = (data: InvoiceCreateRequest) => {
 *   createInvoice(data);
 * };
 *
 * return (
 *   <InvoiceForm
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Invoice, Error, InvoiceCreateRequest>({
    mutationFn: createInvoice,
    onSuccess: (data) => {
      // Invalidate invoice list cache
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });

      // Show success toast
      toast.success(`Invoice ${data.invoiceNumber} created successfully!`);

      // Navigate to invoice detail page
      router.push(`/property-manager/finance/invoices/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create invoice';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE INVOICE HOOK
// ============================================================================

/**
 * Hook to update an existing invoice (DRAFT only)
 *
 * Handles success toast, cache invalidation
 *
 * @returns UseMutationResult for updating invoice
 *
 * @example
 * ```typescript
 * const { mutate: updateInvoice, isPending } = useUpdateInvoice();
 *
 * const handleSubmit = (data: InvoiceUpdateRequest) => {
 *   updateInvoice({ id: invoiceId, data });
 * };
 * ```
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, { id: string; data: InvoiceUpdateRequest }>({
    mutationFn: ({ id, data }) => updateInvoice(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate invoice caches
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });

      // Show success toast
      toast.success('Invoice updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update invoice';
      toast.error(message);
    }
  });
}

// ============================================================================
// SEND INVOICE HOOK
// ============================================================================

/**
 * Hook to send invoice to tenant via email
 *
 * @returns UseMutationResult for sending invoice
 *
 * @example
 * ```typescript
 * const { mutate: sendInvoice, isPending } = useSendInvoice();
 *
 * const handleSend = () => {
 *   sendInvoice(invoiceId);
 * };
 * ```
 */
export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation<{ data: { sentAt: string; status: InvoiceStatus } }, Error, string>({
    mutationFn: sendInvoice,
    onSuccess: (_, invoiceId) => {
      // Invalidate invoice caches
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });

      // Show success toast
      toast.success('Invoice sent to tenant successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to send invoice';
      toast.error(message);
    }
  });
}

// ============================================================================
// CANCEL INVOICE HOOK
// ============================================================================

/**
 * Hook to cancel an invoice
 *
 * @returns UseMutationResult for cancelling invoice
 *
 * @example
 * ```typescript
 * const { mutate: cancelInvoice, isPending } = useCancelInvoice();
 *
 * const handleCancel = () => {
 *   if (confirm('Are you sure?')) {
 *     cancelInvoice(invoiceId);
 *   }
 * };
 * ```
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: cancelInvoice,
    onSuccess: (_, invoiceId) => {
      // Invalidate invoice caches
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });

      // Show success toast
      toast.success('Invoice cancelled successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to cancel invoice';
      toast.error(message);
    }
  });
}

// ============================================================================
// RECORD PAYMENT HOOK
// ============================================================================

/**
 * Hook to record a payment against an invoice
 *
 * @returns UseMutationResult for recording payment
 *
 * @example
 * ```typescript
 * const { mutate: recordPayment, isPending } = useRecordPayment();
 *
 * const handleSubmit = (data: PaymentCreateRequest) => {
 *   recordPayment({ invoiceId, data });
 * };
 * ```
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, { invoiceId: string; data: PaymentCreateRequest }>({
    mutationFn: ({ invoiceId, data }) => recordPayment(invoiceId, data),
    onSuccess: (data, { invoiceId }) => {
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.payments(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });

      // Show success toast
      toast.success(`Payment ${data.paymentNumber} recorded successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to record payment';
      toast.error(message);
    }
  });
}

// ============================================================================
// GET INVOICE PAYMENTS HOOK
// ============================================================================

/**
 * Hook to fetch payments for a specific invoice
 *
 * @param invoiceId - Invoice UUID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with paginated payments
 */
export function useInvoicePayments(
  invoiceId: string,
  page: number = 0,
  size: number = 10,
  enabled: boolean = true
) {
  return useQuery<PaymentListResponse>({
    queryKey: [...invoiceKeys.payments(invoiceId), page, size],
    queryFn: () => getInvoicePayments(invoiceId, page, size),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!invoiceId
  });
}

// ============================================================================
// GET ALL PAYMENTS HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of all payments with filters
 *
 * @param filters - Optional filters (invoice, tenant, date range, method)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with payments data
 */
export function usePayments(filters?: PaymentFilter, enabled: boolean = true) {
  return useQuery<PaymentListResponse>({
    queryKey: paymentKeys.list(filters ?? {}),
    queryFn: () => getPayments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// GET PAYMENT BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single payment by ID
 *
 * @param id - Payment UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with payment detail data
 */
export function usePayment(id: string, enabled: boolean = true) {
  return useQuery<Payment>({
    queryKey: paymentKeys.detail(id),
    queryFn: () => getPaymentById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// DOWNLOAD PAYMENT RECEIPT HOOK
// ============================================================================

/**
 * Hook to download payment receipt PDF
 *
 * @returns UseMutationResult for downloading receipt
 */
export function useDownloadPaymentReceipt() {
  return useMutation<Blob, Error, { paymentId: string; paymentNumber: string }>({
    mutationFn: ({ paymentId }) => downloadPaymentReceipt(paymentId),
    onSuccess: (blob, { paymentNumber }) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to download receipt';
      toast.error(message);
    }
  });
}

// ============================================================================
// DOWNLOAD INVOICE PDF HOOK
// ============================================================================

/**
 * Hook to download invoice PDF
 *
 * @returns UseMutationResult for downloading invoice
 */
export function useDownloadInvoicePdf() {
  return useMutation<Blob, Error, { invoiceId: string; invoiceNumber: string }>({
    mutationFn: ({ invoiceId }) => downloadInvoicePdf(invoiceId),
    onSuccess: (blob, { invoiceNumber }) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to download invoice';
      toast.error(message);
    }
  });
}

// ============================================================================
// INVOICE SUMMARY HOOK
// ============================================================================

/**
 * Hook to fetch invoice summary for dashboard
 *
 * @param propertyId - Optional property UUID to filter by
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with invoice summary data
 */
export function useInvoiceSummary(propertyId?: string, enabled: boolean = true) {
  return useQuery<InvoiceSummary>({
    queryKey: invoiceKeys.summary(propertyId),
    queryFn: () => getInvoiceSummary(propertyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// APPLY LATE FEE HOOK
// ============================================================================

/**
 * Hook to apply late fee to overdue invoice
 *
 * @returns UseMutationResult for applying late fee
 */
export function useApplyLateFee() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, { invoiceId: string; amount: number }>({
    mutationFn: ({ invoiceId, amount }) => applyLateFee(invoiceId, amount),
    onSuccess: (_, { invoiceId }) => {
      // Invalidate invoice caches
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() });

      toast.success('Late fee applied successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to apply late fee';
      toast.error(message);
    }
  });
}

// ============================================================================
// RESEND INVOICE EMAIL HOOK
// ============================================================================

/**
 * Hook to resend invoice email to tenant
 *
 * @returns UseMutationResult for resending email
 */
export function useResendInvoiceEmail() {
  return useMutation<void, Error, string>({
    mutationFn: resendInvoiceEmail,
    onSuccess: () => {
      toast.success('Invoice email resent successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to resend invoice email';
      toast.error(message);
    }
  });
}

// ============================================================================
// TENANT PORTAL HOOKS
// ============================================================================

/**
 * Hook to fetch invoices for current tenant (tenant portal)
 *
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @param status - Optional status filter
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with paginated tenant invoices
 */
export function useTenantInvoices(
  page: number = 0,
  size: number = 10,
  status?: InvoiceStatus,
  enabled: boolean = true
) {
  return useQuery<TenantInvoicesResponse>({
    queryKey: [...invoiceKeys.tenantList(status), page, size],
    queryFn: () => getTenantInvoices(page, size, status),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

/**
 * Hook to fetch invoice detail for current tenant (tenant portal)
 *
 * @param id - Invoice UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with invoice detail
 */
export function useTenantInvoice(id: string, enabled: boolean = true) {
  return useQuery<InvoiceDetail>({
    queryKey: invoiceKeys.tenantDetail(id),
    queryFn: () => getTenantInvoiceById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!id
  });
}
