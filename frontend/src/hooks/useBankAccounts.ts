/**
 * React Query Hooks for Bank Account Management
 * Story 6.5: Bank Account Management
 * AC #24: React Query hooks (useBankAccounts, useCreateBankAccount, etc.)
 *
 * Provides hooks for fetching, creating, updating, and deleting bank accounts
 * with automatic cache invalidation and toast notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

/** API error response structure */
interface ApiErrorResponse {
  message?: string;
  error?: { message?: string };
}

/**
 * Extract error message from an error object (handles both Axios and generic errors)
 */
function getErrorMessage(error: Error, fallback: string): string {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error?.message ||
      fallback
    );
  }
  return error.message || fallback;
}
import {
  getBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  getPrimaryBankAccount,
  getBankAccountsForDropdown
} from '@/services/bank-account.service';
import type {
  BankAccount,
  BankAccountDetail,
  BankAccountDropdownItem,
  CreateBankAccountRequest,
  UpdateBankAccountRequest
} from '@/types/bank-account';

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Query key factory for bank account queries
 * Following React Query best practices for cache management
 */
export const bankAccountKeys = {
  all: ['bankAccounts'] as const,
  lists: () => [...bankAccountKeys.all, 'list'] as const,
  list: (search?: string) => [...bankAccountKeys.lists(), { search }] as const,
  details: () => [...bankAccountKeys.all, 'detail'] as const,
  detail: (id: string) => [...bankAccountKeys.details(), id] as const,
  primary: () => [...bankAccountKeys.all, 'primary'] as const,
  dropdown: () => [...bankAccountKeys.all, 'dropdown'] as const
};

// ============================================================================
// LIST BANK ACCOUNTS HOOK
// ============================================================================

/**
 * Hook to fetch all bank accounts with optional search filter
 * AC #14: GET /api/v1/bank-accounts returns list with masked values
 *
 * @param search - Optional search term for bank name or account name
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with bank accounts data, loading state, and error
 *
 * @example
 * ```typescript
 * const { data: accounts, isLoading, error } = useBankAccounts();
 *
 * // With search filter
 * const { data: filtered } = useBankAccounts('Emirates');
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <BankAccountsTable accounts={accounts} />;
 * ```
 */
export function useBankAccounts(search?: string, enabled: boolean = true) {
  return useQuery<BankAccount[]>({
    queryKey: bankAccountKeys.list(search),
    queryFn: () => getBankAccounts(search),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// GET BANK ACCOUNT BY ID HOOK
// ============================================================================

/**
 * Hook to fetch a single bank account by ID
 * AC #15: GET /api/v1/bank-accounts/{id} returns bank account details
 *
 * ADMIN/SUPER_ADMIN see full (decrypted) account numbers
 * FINANCE_MANAGER sees masked values
 *
 * @param id - Bank account UUID
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with bank account detail data
 *
 * @example
 * ```typescript
 * const { data: account, isLoading, error } = useBankAccount(accountId);
 *
 * if (isLoading) return <AccountDetailSkeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <BankAccountDetail account={account} />;
 * ```
 */
export function useBankAccount(id: string, enabled: boolean = true) {
  return useQuery<BankAccountDetail>({
    queryKey: bankAccountKeys.detail(id),
    queryFn: () => getBankAccountById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!id
  });
}

// ============================================================================
// CREATE BANK ACCOUNT HOOK
// ============================================================================

/**
 * Hook to create a new bank account
 * AC #16: POST /api/v1/bank-accounts creates new bank account
 *
 * Handles success toast and cache invalidation
 *
 * @param options.onSuccess - Optional callback on successful creation
 *
 * @returns UseMutationResult for creating bank account
 *
 * @example
 * ```typescript
 * const { mutate: create, isPending } = useCreateBankAccount({
 *   onSuccess: () => setDialogOpen(false)
 * });
 *
 * const handleSubmit = (data: CreateBankAccountRequest) => {
 *   create(data);
 * };
 *
 * return (
 *   <BankAccountForm
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useCreateBankAccount(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation<BankAccount, Error, CreateBankAccountRequest>({
    mutationFn: createBankAccount,
    onSuccess: (data) => {
      // Invalidate all bank account caches
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.dropdown() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.primary() });

      // Show success toast
      toast.success(`Bank account "${data.bankName}" created successfully!`);

      // Call optional success callback
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to create bank account'));
    }
  });
}

// ============================================================================
// UPDATE BANK ACCOUNT HOOK
// ============================================================================

/**
 * Hook to update an existing bank account
 * AC #17: PUT /api/v1/bank-accounts/{id} updates bank account
 *
 * Handles success toast and cache invalidation
 *
 * @param options.onSuccess - Optional callback on successful update
 *
 * @returns UseMutationResult for updating bank account
 *
 * @example
 * ```typescript
 * const { mutate: update, isPending } = useUpdateBankAccount({
 *   onSuccess: () => setDialogOpen(false)
 * });
 *
 * const handleSubmit = (data: UpdateBankAccountRequest) => {
 *   update({ id: accountId, data });
 * };
 *
 * return (
 *   <BankAccountForm
 *     account={existingAccount}
 *     onSubmit={handleSubmit}
 *     isLoading={isPending}
 *   />
 * );
 * ```
 */
export function useUpdateBankAccount(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation<BankAccount, Error, { id: string; data: UpdateBankAccountRequest }>({
    mutationFn: ({ id, data }) => updateBankAccount(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.dropdown() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.primary() });

      // Show success toast
      toast.success(`Bank account "${data.bankName}" updated successfully!`);

      // Call optional success callback
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to update bank account'));
    }
  });
}

// ============================================================================
// DELETE BANK ACCOUNT HOOK
// ============================================================================

/**
 * Hook to delete (deactivate) a bank account
 * AC #18: DELETE /api/v1/bank-accounts/{id} soft deletes bank account
 *
 * Validates no active PDCs are linked (server-side)
 * Validates at least one active account remains (server-side)
 *
 * @param options.onSuccess - Optional callback on successful deletion
 *
 * @returns UseMutationResult for deleting bank account
 *
 * @example
 * ```typescript
 * const { mutate: remove, isPending } = useDeleteBankAccount({
 *   onSuccess: () => setDeleteDialogOpen(false)
 * });
 *
 * const handleDelete = () => {
 *   remove(accountId);
 * };
 *
 * return (
 *   <AlertDialog>
 *     <AlertDialogAction onClick={handleDelete} disabled={isPending}>
 *       Delete
 *     </AlertDialogAction>
 *   </AlertDialog>
 * );
 * ```
 */
export function useDeleteBankAccount(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteBankAccount,
    onSuccess: () => {
      // Invalidate all bank account caches
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.dropdown() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.primary() });

      // Show success toast
      toast.success('Bank account deleted successfully!');

      // Call optional success callback
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to delete bank account'));
    }
  });
}

// ============================================================================
// SET PRIMARY BANK ACCOUNT HOOK
// ============================================================================

/**
 * Hook to set a bank account as the primary account
 * AC #19: PATCH /api/v1/bank-accounts/{id}/primary sets bank account as primary
 *
 * Only one account can be primary at a time.
 * Previous primary account is automatically demoted.
 *
 * @returns UseMutationResult for setting primary account
 *
 * @example
 * ```typescript
 * const { mutate: setPrimary, isPending } = useSetPrimaryBankAccount();
 *
 * const handleSetPrimary = () => {
 *   setPrimary(accountId);
 * };
 *
 * return (
 *   <Button
 *     variant="outline"
 *     size="sm"
 *     onClick={handleSetPrimary}
 *     disabled={isPending || account.isPrimary}
 *   >
 *     <Star className="h-4 w-4 mr-2" />
 *     Set as Primary
 *   </Button>
 * );
 * ```
 */
export function useSetPrimaryBankAccount() {
  const queryClient = useQueryClient();

  return useMutation<BankAccount, Error, string>({
    mutationFn: setPrimaryBankAccount,
    onSuccess: (data) => {
      // Invalidate all bank account caches (primary status changed on multiple accounts)
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.details() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.dropdown() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.primary() });

      // Show success toast
      toast.success(`"${data.bankName}" set as primary bank account!`);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, 'Failed to set primary bank account'));
    }
  });
}

// ============================================================================
// GET PRIMARY BANK ACCOUNT HOOK
// ============================================================================

/**
 * Hook to fetch the primary bank account
 *
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with primary bank account or null
 *
 * @example
 * ```typescript
 * const { data: primary, isLoading } = usePrimaryBankAccount();
 *
 * if (primary) {
 *   console.log('Primary account:', primary.bankName);
 * }
 * ```
 */
export function usePrimaryBankAccount(enabled: boolean = true) {
  return useQuery<BankAccount | null>({
    queryKey: bankAccountKeys.primary(),
    queryFn: getPrimaryBankAccount,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });
}

// ============================================================================
// GET BANK ACCOUNTS FOR DROPDOWN HOOK
// ============================================================================

/**
 * Hook to fetch active bank accounts for dropdown selection
 * Used by PDC management for deposit destination selection
 *
 * @param enabled - Whether the query should execute (default: true)
 *
 * @returns UseQueryResult with bank accounts for dropdown
 *
 * @example
 * ```typescript
 * const { data: accounts, isLoading } = useBankAccountsDropdown();
 *
 * return (
 *   <Select>
 *     {accounts?.map(account => (
 *       <SelectItem key={account.id} value={account.id}>
 *         {account.bankName} - {account.accountNumberMasked}
 *         {account.isPrimary && ' (Primary)'}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useBankAccountsDropdown(enabled: boolean = true) {
  return useQuery<BankAccountDropdownItem[]>({
    queryKey: bankAccountKeys.dropdown(),
    queryFn: getBankAccountsForDropdown,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled
  });
}
