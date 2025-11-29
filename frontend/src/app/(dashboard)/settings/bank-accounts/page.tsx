 
'use client';

/**
 * Bank Accounts Management Page
 * Story 6.5: Bank Account Management
 * AC #1: Bank Accounts page accessible via sidebar navigation
 * AC #2: Table columns: Bank Name, Account Name, Account Number (masked), IBAN (masked), SWIFT, Status, Primary badge
 * AC #25: Bank accounts list component with table, search, and actions
 */

import { useState, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  MoreHorizontal,
  RefreshCw,
  Star,
  Shield,
} from 'lucide-react';
import { useBankAccounts, useSetPrimaryBankAccount } from '@/hooks/useBankAccounts';
import type { BankAccount } from '@/types/bank-account';
import {
  BANK_ACCOUNT_STATUS_CONFIG,
  canDeleteBankAccount,
  canSetAsPrimary,
} from '@/types/bank-account';
import { BankAccountFormModal } from '@/components/bank-accounts/BankAccountFormModal';
import { BankAccountDeleteDialog } from '@/components/bank-accounts/BankAccountDeleteDialog';

/**
 * Bank Accounts Management Page Component
 */
export default function BankAccountsPage() {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  // Fetch bank accounts
  const {
    data: bankAccounts,
    isLoading,
    refetch: refetchAccounts,
  } = useBankAccounts(debouncedSearch || undefined);

  // Set primary mutation
  const { mutate: setPrimary, isPending: isSettingPrimary } = useSetPrimaryBankAccount();

  // Debounced search (300ms)
  const debouncedSearchHandler = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearch(value);
    }, 300),
    []
  );

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSearchHandler.cancel();
  }, [debouncedSearchHandler]);

  // Handlers
  const handleCreateAccount = () => {
    setEditingAccount(null);
    setFormModalOpen(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setFormModalOpen(true);
  };

  const handleDeleteAccount = (account: BankAccount) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleSetPrimary = (account: BankAccount) => {
    setPrimary(account.id);
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearchHandler(value);
  };

  const accounts = bankAccounts || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Bank Accounts</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
            <p className="text-muted-foreground">
              Manage company bank accounts for PDC deposits and payments
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateAccount}
          data-testid="btn-create-bank-account"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="flex items-center gap-3 pt-6">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Sensitive Data:</strong> Account numbers and IBANs are encrypted at rest.
            Only administrators can view full account details.
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search by bank name or account name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bank accounts..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
                data-testid="input-search-bank-account"
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchAccounts()}
              className="shrink-0"
              data-testid="btn-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {accounts.length} bank account{accounts.length !== 1 ? 's' : ''} found
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bank accounts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by adding your first bank account'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateAccount} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Bank Account
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-bank-accounts">
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>SWIFT/BIC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => {
                    const statusConfig = BANK_ACCOUNT_STATUS_CONFIG[account.status];
                    const canDelete = canDeleteBankAccount(account);
                    const canSetPrimary = canSetAsPrimary(account);

                    return (
                      <TableRow
                        key={account.id}
                        className="hover:bg-muted/50"
                        data-testid="bank-account-row"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {account.bankName}
                            {account.isPrimary && (
                              <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                                <Star className="h-3 w-3" />
                                Primary
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {account.accountName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.accountNumberMasked}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.ibanMasked}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.swiftCode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig.className}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`btn-actions-${account.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditAccount(account)}
                                data-testid={`btn-edit-${account.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {canSetPrimary && (
                                <DropdownMenuItem
                                  onClick={() => handleSetPrimary(account)}
                                  disabled={isSettingPrimary}
                                  data-testid={`btn-set-primary-${account.id}`}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Set as Primary
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteAccount(account)}
                                disabled={!canDelete}
                                className="text-destructive focus:text-destructive"
                                data-testid={`btn-delete-${account.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <BankAccountFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        bankAccount={editingAccount}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      {accountToDelete && (
        <BankAccountDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          bankAccount={accountToDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
