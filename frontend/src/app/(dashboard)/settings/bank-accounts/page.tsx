'use client';

/**
 * Bank Accounts Management Page - Premium Redesign
 * Story 6.5: Bank Account Management
 * Modern financial dashboard aesthetic matching Invoices & Leads pages
 */

import { useState, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  MoreVertical,
  RefreshCw,
  Star,
  Shield,
  Landmark,
  CreditCard,
  Wallet,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import { useBankAccounts, useSetPrimaryBankAccount } from '@/hooks/useBankAccounts';
import type { BankAccount } from '@/types/bank-account';
import {
  BankAccountStatus,
  BANK_ACCOUNT_STATUS_CONFIG,
  canDeleteBankAccount,
  canSetAsPrimary,
} from '@/types/bank-account';
import { BankAccountFormModal } from '@/components/bank-accounts/BankAccountFormModal';
import { BankAccountDeleteDialog } from '@/components/bank-accounts/BankAccountDeleteDialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

/**
 * Bank account status styles with premium financial aesthetic
 */
const BANK_STATUS_STYLES: Record<BankAccountStatus, { badge: string; dot: string; icon: React.ReactNode; gradient: string }> = {
  [BankAccountStatus.ACTIVE]: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  [BankAccountStatus.INACTIVE]: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200',
    dot: 'bg-slate-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
    gradient: 'from-slate-500/10 to-slate-500/5',
  },
};

export default function BankAccountsPage() {
  const { toast } = useToast();

  // State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
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

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let result = bankAccounts || [];

    if (statusFilter !== 'all') {
      result = result.filter(acc => acc.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(acc =>
        acc.bankName?.toLowerCase().includes(query) ||
        acc.accountName?.toLowerCase().includes(query) ||
        acc.accountNumberMasked?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bankAccounts, statusFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const accounts = bankAccounts || [];
    const total = accounts.length;
    const active = accounts.filter(a => a.status === BankAccountStatus.ACTIVE).length;
    const inactive = accounts.filter(a => a.status === BankAccountStatus.INACTIVE).length;
    const primary = accounts.find(a => a.isPrimary);

    return { total, active, inactive, primary };
  }, [bankAccounts]);

  // Handlers
  const handleCreateAccount = () => {
    setEditingAccount(null);
    setModalMode('create');
    setFormModalOpen(true);
  };

  const handleViewAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setModalMode('view');
    setFormModalOpen(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setModalMode('edit');
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

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                      <Landmark className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
                      <p className="text-muted-foreground">
                        Manage company bank accounts for PDC deposits and payments
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => refetchAccounts()}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleCreateAccount}
                    size="lg"
                    className="gap-2 shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white"
                    data-testid="btn-create-bank-account"
                  >
                    <Plus className="h-5 w-5" />
                    Add Bank Account
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice - Refined */}
          <Card className="border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-800/30">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Bank-Grade Security
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
                  Account numbers and IBANs are encrypted at rest. Only administrators can view full account details.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-100/50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                  <Lock className="h-3 w-3 mr-1" />
                  AES-256 Encrypted
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Accounts */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Accounts
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered accounts
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Accounts */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-emerald-600">{stats.active}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ready for transactions
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Inactive Accounts */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactive
                </CardTitle>
                <XCircle className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">{stats.inactive}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Disabled accounts
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Primary Account */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Primary Account
                </CardTitle>
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : stats.primary ? (
                  <>
                    <div className="text-lg font-bold truncate">{stats.primary.bankName}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {stats.primary.accountNumberMasked}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-muted-foreground">Not Set</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set a primary account
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filters & Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Status Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full lg:w-auto grid-cols-3 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-4">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value={BankAccountStatus.ACTIVE} className="gap-1.5 px-4">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </TabsTrigger>
                    <TabsTrigger value={BankAccountStatus.INACTIVE} className="gap-1.5 px-4">
                      <XCircle className="h-3.5 w-3.5" />
                      Inactive
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by bank name, account..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 h-10"
                    data-testid="input-search-bank-account"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${filteredAccounts.length} ${filteredAccounts.length === 1 ? 'account' : 'accounts'} found`
              )}
            </span>
            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="gap-2"
              >
                Clear Filter
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                  <Landmark className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No bank accounts found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filters."
                    : "Get started by adding your first bank account."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleCreateAccount} className="gap-2 bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4" />
                    Add Bank Account
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAccounts.map((account) => {
                    const statusStyles = BANK_STATUS_STYLES[account.status];
                    const canDelete = canDeleteBankAccount(account);
                    const canMakePrimary = canSetAsPrimary(account);

                    return (
                      <Card
                        key={account.id}
                        className={cn(
                          "overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col",
                          account.isPrimary && "ring-2 ring-amber-500/50 shadow-amber-500/10"
                        )}
                        data-testid="bank-account-row"
                      >
                        {/* Header */}
                        <div className={cn("relative h-24 bg-gradient-to-br", statusStyles.gradient, "to-muted")}>
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                              {BANK_ACCOUNT_STATUS_CONFIG[account.status].label}
                            </Badge>
                          </div>

                          {/* Primary Badge */}
                          {account.isPrimary && (
                            <div className="absolute top-3 right-12">
                              <Badge className="bg-amber-500 text-white hover:bg-amber-600 shadow-sm gap-1">
                                <Star className="h-3 w-3 fill-white" />
                                Primary
                              </Badge>
                            </div>
                          )}

                          {/* Actions Menu */}
                          <div className="absolute top-3 right-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`btn-actions-${account.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditAccount(account)}
                                  data-testid={`btn-edit-bank-account-${account.id}`}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                {canMakePrimary && (
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
                                  data-testid={`btn-delete-bank-account-${account.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Bank Icon */}
                          <div className="absolute -bottom-6 left-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background ring-4 ring-background shadow-lg">
                              <Building2 className="h-6 w-6 text-amber-600" />
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 pt-8 flex-1 flex flex-col">
                          <div className="mb-1">
                            <h3 className="font-semibold text-lg truncate" title={account.bankName}>
                              {account.bankName}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {account.accountName}
                            </p>
                          </div>

                          <div className="space-y-2.5 mt-4 text-sm">
                            {/* Account Number */}
                            <div className="flex items-center justify-between group/copy">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5" />
                                Account
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                  {account.accountNumberMasked}
                                </span>
                              </div>
                            </div>

                            {/* IBAN */}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Wallet className="h-3.5 w-3.5" />
                                IBAN
                              </span>
                              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                {account.ibanMasked}
                              </span>
                            </div>

                            {/* SWIFT */}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Landmark className="h-3.5 w-3.5" />
                                SWIFT
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCopyToClipboard(account.swiftCode, 'SWIFT code')}
                                    className="font-mono text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    {account.swiftCode}
                                    <Copy className="h-3 w-3 opacity-50" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Click to copy</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Verified</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAccount(account)}
                              className="h-8 px-2 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
          )}

          {/* Quick Actions Footer */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
              onClick={handleCreateAccount}
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Add New Account</div>
                <div className="text-xs text-muted-foreground">Register a new bank account</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
              onClick={() => setStatusFilter(BankAccountStatus.ACTIVE)}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Active Accounts</div>
                <div className="text-xs text-muted-foreground">{stats.active} accounts ready</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 justify-start px-4 gap-3 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
              onClick={() => setStatusFilter('all')}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">View All</div>
                <div className="text-xs text-muted-foreground">{stats.total} total accounts</div>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <BankAccountFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        bankAccount={editingAccount}
        onSuccess={handleFormSuccess}
        mode={modalMode}
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
    </TooltipProvider>
  );
}
