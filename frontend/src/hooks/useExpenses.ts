/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Query Hooks for Expense Management
 * Story 6.2: Expense Management and Vendor Payments
 *
 * Provides hooks for fetching, creating, updating expenses and processing payments
 * with automatic cache invalidation and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  markExpenseAsPaid,
  processBatchPayment,
  getPendingPaymentsByVendor,
  getExpenseSummary,
  getReceiptDownloadUrl,
  downloadReceipt,
  getExpensesByWorkOrder
} from '@/services/expense.service';
import type {
  Expense,
  ExpenseDetail,
  ExpenseFilter,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpensePayRequest,
  BatchPaymentRequest,
  ExpenseListResponse,
  ExpensePayResponse,
  BatchPaymentResponse,
  VendorExpenseGroup,
  ExpenseSummary
} from '@/types/expense';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseFilter) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  pendingByVendor: (vendorId?: string) => [...expenseKeys.all, 'pending-by-vendor', vendorId] as const,
  summary: (propertyId?: string, fromDate?: string, toDate?: string) =>
    [...expenseKeys.all, 'summary', propertyId, fromDate, toDate] as const,
  byWorkOrder: (workOrderId: string) => [...expenseKeys.all, 'work-order', workOrderId] as const
};

// ============================================================================
// LIST EXPENSES HOOK
// ============================================================================

/**
 * Hook to fetch paginated list of expenses with filters
 *
 * @param filters - Optional filters (category, status, property, vendor, date range, pagination)
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expenses data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useExpenses({
 *   paymentStatus: 'PENDING',
 *   page: 0,
 *   size: 20
 * });
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <ExpenseTable
 *     expenses={data.data.content}
 *     pagination={data.data}
 *   />
 * );
 * ```
 */
export function useExpenses(filters?: ExpenseFilter, enabled: boolean = true) {
  return useQuery<ExpenseListResponse>({
    queryKey: expenseKeys.list(filters ?? {}),
    queryFn: () => getExpenses(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// GET EXPENSE BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single expense by ID
 *
 * @param id - Expense UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expense detail data
 *
 * @example
 * ```typescript
 * const { data: expense, isLoading, error } = useExpense(expenseId);
 *
 * if (isLoading) return <ExpenseDetailSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <ExpenseDetailPage expense={expense} />;
 * ```
 */
export function useExpense(id: string, enabled: boolean = true) {
  return useQuery<ExpenseDetail>({
    queryKey: expenseKeys.detail(id),
    queryFn: () => getExpenseById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// CREATE EXPENSE HOOK
// ============================================================================

/**
 * Hook to create a new expense with optional receipt upload
 *
 * Handles success toast, cache invalidation, and navigation
 *
 * @returns UseMutationResult for creating expense
 *
 * @example
 * ```typescript
 * const { mutate: createExpense, isPending } = useCreateExpense();
 *
 * const handleSubmit = (data: ExpenseCreateRequest, receiptFile?: File) => {
 *   createExpense({ data, receiptFile });
 * };
 *
 * return (
 *   <ExpenseForm
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<Expense, Error, { data: ExpenseCreateRequest; receiptFile?: File }>({
    mutationFn: ({ data, receiptFile }) => createExpense(data, receiptFile),
    onSuccess: (data) => {
      // Invalidate expense list cache
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingByVendor() });

      // Show success toast
      toast.success(`Expense ${data.expenseNumber} created successfully!`);

      // Navigate to expense detail page
      router.push(`/property-manager/finance/expenses/${data.id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create expense';
      toast.error(message);
    }
  });
}

// ============================================================================
// UPDATE EXPENSE HOOK
// ============================================================================

/**
 * Hook to update an existing expense (PENDING only)
 *
 * Handles success toast, cache invalidation
 *
 * @returns UseMutationResult for updating expense
 *
 * @example
 * ```typescript
 * const { mutate: updateExpense, isPending } = useUpdateExpense();
 *
 * const handleSubmit = (data: ExpenseUpdateRequest) => {
 *   updateExpense({ id: expenseId, data });
 * };
 * ```
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: string; data: ExpenseUpdateRequest; receiptFile?: File }>({
    mutationFn: ({ id, data, receiptFile }) => updateExpense(id, data, receiptFile),
    onSuccess: (data, { id }) => {
      // Invalidate expense caches
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingByVendor() });

      // Show success toast
      toast.success('Expense updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to update expense';
      toast.error(message);
    }
  });
}

// ============================================================================
// DELETE EXPENSE HOOK
// ============================================================================

/**
 * Hook to soft delete an expense (PENDING only)
 *
 * @returns UseMutationResult for deleting expense
 *
 * @example
 * ```typescript
 * const { mutate: deleteExpense, isPending } = useDeleteExpense();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     deleteExpense(expenseId);
 *   }
 * };
 * ```
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, string>({
    mutationFn: deleteExpense,
    onSuccess: (_, expenseId) => {
      // Invalidate expense caches
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expenseId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingByVendor() });

      // Show success toast
      toast.success('Expense deleted successfully!');

      // Navigate to expense list
      router.push('/property-manager/finance/expenses');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to delete expense';
      toast.error(message);
    }
  });
}

// ============================================================================
// MARK EXPENSE AS PAID HOOK
// ============================================================================

/**
 * Hook to mark a single expense as paid
 *
 * @returns UseMutationResult for marking expense as paid
 *
 * @example
 * ```typescript
 * const { mutate: markAsPaid, isPending } = useMarkExpenseAsPaid();
 *
 * const handlePay = (paymentData: ExpensePayRequest) => {
 *   markAsPaid({ id: expenseId, data: paymentData });
 * };
 * ```
 */
export function useMarkExpenseAsPaid() {
  const queryClient = useQueryClient();

  return useMutation<ExpensePayResponse, Error, { id: string; data: ExpensePayRequest }>({
    mutationFn: ({ id, data }) => markExpenseAsPaid(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate expense caches
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingByVendor() });

      // Show success toast
      toast.success('Expense marked as paid!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to mark expense as paid';
      toast.error(message);
    }
  });
}

// ============================================================================
// BATCH PAYMENT HOOK
// ============================================================================

/**
 * Hook to process batch payment for multiple expenses
 *
 * @returns UseMutationResult for batch payment processing
 *
 * @example
 * ```typescript
 * const { mutate: processBatch, isPending } = useBatchPayment();
 *
 * const handleBatchPay = (data: BatchPaymentRequest) => {
 *   processBatch(data);
 * };
 * ```
 */
export function useBatchPayment() {
  const queryClient = useQueryClient();

  return useMutation<BatchPaymentResponse, Error, BatchPaymentRequest>({
    mutationFn: processBatchPayment,
    onSuccess: (response) => {
      // Invalidate expense caches
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingByVendor() });

      // Show success toast
      const { processedCount, failedCount } = response.data;
      if (failedCount === 0) {
        toast.success(`${processedCount} expenses paid successfully!`);
      } else {
        toast.warning(`${processedCount} paid, ${failedCount} failed. Check results.`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to process batch payment';
      toast.error(message);
    }
  });
}

// ============================================================================
// PENDING PAYMENTS BY VENDOR HOOK
// ============================================================================

/**
 * Hook to fetch pending expenses grouped by vendor
 *
 * @param vendorId - Optional vendor UUID to filter by specific vendor
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with vendor expense groups
 *
 * @example
 * ```typescript
 * const { data: groups, isLoading } = usePendingPaymentsByVendor();
 *
 * return (
 *   <VendorPaymentsList
 *     groups={groups ?? []}
 *     isLoading={isLoading}
 *   />
 * );
 * ```
 */
export function usePendingPaymentsByVendor(vendorId?: string, enabled: boolean = true) {
  return useQuery<VendorExpenseGroup[]>({
    queryKey: expenseKeys.pendingByVendor(vendorId),
    queryFn: () => getPendingPaymentsByVendor(vendorId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled
  });
}

// ============================================================================
// EXPENSE SUMMARY HOOK
// ============================================================================

/**
 * Hook to fetch expense summary for dashboard
 *
 * @param propertyId - Optional property UUID to filter by
 * @param fromDate - Optional start date for period
 * @param toDate - Optional end date for period
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expense summary data
 *
 * @example
 * ```typescript
 * const { data: summary, isLoading } = useExpenseSummary();
 *
 * return (
 *   <ExpenseDashboard
 *     summary={summary}
 *     isLoading={isLoading}
 *   />
 * );
 * ```
 */
export function useExpenseSummary(
  propertyId?: string,
  fromDate?: string,
  toDate?: string,
  enabled: boolean = true
) {
  return useQuery<ExpenseSummary>({
    queryKey: expenseKeys.summary(propertyId, fromDate, toDate),
    queryFn: () => getExpenseSummary(propertyId, fromDate, toDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// DOWNLOAD RECEIPT HOOK
// ============================================================================

/**
 * Hook to download expense receipt
 *
 * @returns UseMutationResult for downloading receipt
 *
 * @example
 * ```typescript
 * const { mutate: downloadReceipt, isPending } = useDownloadExpenseReceipt();
 *
 * const handleDownload = () => {
 *   downloadReceipt({ expenseId, expenseNumber });
 * };
 * ```
 */
export function useDownloadExpenseReceipt() {
  return useMutation<Blob, Error, { expenseId: string; expenseNumber: string }>({
    mutationFn: ({ expenseId }) => downloadReceipt(expenseId),
    onSuccess: (blob, { expenseNumber }) => {
      // Determine file extension from blob type
      const extension = blob.type === 'application/pdf' ? '.pdf' :
                       blob.type === 'image/jpeg' ? '.jpg' :
                       blob.type === 'image/png' ? '.png' : '';

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${expenseNumber}${extension}`;
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

/**
 * Hook to get receipt download URL (presigned S3 URL)
 *
 * @returns UseMutationResult for getting download URL
 */
export function useGetReceiptDownloadUrl() {
  return useMutation<string, Error, string>({
    mutationFn: getReceiptDownloadUrl,
    onSuccess: (url) => {
      // Open in new tab
      window.open(url, '_blank');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to get receipt URL';
      toast.error(message);
    }
  });
}

// ============================================================================
// EXPENSES BY WORK ORDER HOOK
// ============================================================================

/**
 * Hook to fetch expenses linked to a specific work order
 *
 * @param workOrderId - Work order UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with expenses linked to work order
 *
 * @example
 * ```typescript
 * const { data: expenses, isLoading } = useExpensesByWorkOrder(workOrderId);
 *
 * return (
 *   <WorkOrderExpenses
 *     expenses={expenses ?? []}
 *     isLoading={isLoading}
 *   />
 * );
 * ```
 */
export function useExpensesByWorkOrder(workOrderId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: expenseKeys.byWorkOrder(workOrderId),
    queryFn: () => getExpensesByWorkOrder(workOrderId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!workOrderId
  });
}

// ============================================================================
// PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch expense detail for faster navigation
 *
 * @param queryClient - Query client instance
 * @param expenseId - Expense UUID to prefetch
 */
export async function prefetchExpenseDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  expenseId: string
) {
  await queryClient.prefetchQuery({
    queryKey: expenseKeys.detail(expenseId),
    queryFn: () => getExpenseById(expenseId),
    staleTime: 2 * 60 * 1000
  });
}

/**
 * Prefetch expense summary for dashboard
 *
 * @param queryClient - Query client instance
 * @param propertyId - Optional property UUID
 */
export async function prefetchExpenseSummary(
  queryClient: ReturnType<typeof useQueryClient>,
  propertyId?: string
) {
  await queryClient.prefetchQuery({
    queryKey: expenseKeys.summary(propertyId),
    queryFn: () => getExpenseSummary(propertyId),
    staleTime: 5 * 60 * 1000
  });
}
