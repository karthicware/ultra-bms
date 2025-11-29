'use client';

/**
 * Bank Account Delete Dialog Component
 * Story 6.5: Bank Account Management
 * AC #5: Delete button with confirmation dialog
 *
 * Server-side validation:
 * - Cannot delete if linked to active PDCs
 * - Cannot delete if only active account remaining
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Info } from 'lucide-react';
import type { BankAccount } from '@/types/bank-account';
import { useDeleteBankAccount } from '@/hooks/useBankAccounts';

interface BankAccountDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount;
  onSuccess: () => void;
}

export function BankAccountDeleteDialog({
  open,
  onOpenChange,
  bankAccount,
  onSuccess,
}: BankAccountDeleteDialogProps) {
  const { mutate: deleteAccount, isPending } = useDeleteBankAccount({
    onSuccess: () => onSuccess(),
  });

  const handleDelete = () => {
    deleteAccount(bankAccount.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-delete-bank-account">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Bank Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the bank account{' '}
                <strong>&quot;{bankAccount.bankName}&quot;</strong> ({bankAccount.accountName})?
              </p>

              {bankAccount.isPrimary && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This is your <strong>primary</strong> bank account.
                    Deleting it will remove the primary designation.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> This action will soft-delete the account by
                  setting its status to Inactive. The account data will be preserved
                  for historical records.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                The deletion will fail if:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Active PDCs are linked to this account</li>
                <li>This is the only active bank account</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="btn-confirm-delete"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
