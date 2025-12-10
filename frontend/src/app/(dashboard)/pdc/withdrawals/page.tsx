'use client';

/**
 * PDC Withdrawal History Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #21-25: Withdrawal history with filtering, sorting, pagination, and export
 */

import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { usePDCWithdrawals, useExportPDCWithdrawals } from '@/hooks/usePDCs';
import {
  formatPDCCurrency,
  PDCWithdrawalFilter,
  getNewPaymentMethodLabel,
  WITHDRAWAL_REASON_OPTIONS,
} from '@/types/pdc';
import {
  Search,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Filter,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Undo2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import { PageBackButton } from '@/components/common/PageBackButton';

function WithdrawalHistoryContent() {
  const router = useRouter();

  // Filter state
  const [filters, setFilters] = useState<PDCWithdrawalFilter>({
    search: '',
    withdrawalReason: 'ALL',
    fromDate: '',
    toDate: '',
    page: 0,
    size: 20,
    sortBy: 'withdrawalDate',
    sortDirection: 'DESC',
  });
  const [searchInput, setSearchInput] = useState('');

  // Fetch withdrawals
  const { data: response, isLoading } = usePDCWithdrawals(filters);
  const withdrawals = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 0;
  const totalElements = response?.data?.totalElements || 0;

  // Export mutation
  const { mutate: exportData, isPending: isExporting } = useExportPDCWithdrawals();

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters((prev) => ({ ...prev, search: value, page: 0 }));
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleReasonFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, withdrawalReason: value, page: 0 }));
  };

  const handleDateFilter = (type: 'from' | 'to', date: Date | undefined) => {
    const dateStr = date?.toISOString().split('T')[0] || '';
    setFilters((prev) => ({
      ...prev,
      [type === 'from' ? 'fromDate' : 'toDate']: dateStr,
      page: 0,
    }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'DESC' ? 'ASC' : 'DESC',
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      withdrawalReason: 'ALL',
      fromDate: '',
      toDate: '',
      page: 0,
      size: 20,
      sortBy: 'withdrawalDate',
      sortDirection: 'DESC',
    });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.withdrawalReason && filters.withdrawalReason !== 'ALL') ||
    filters.fromDate ||
    filters.toDate;

  const handleExport = (format: 'pdf' | 'excel') => {
    exportData({ format, filters });
  };

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-pdc-withdrawals">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <PageBackButton href="/pdc" aria-label="Back to PDC management" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Withdrawal History</h1>
            <p className="text-muted-foreground">
              {totalElements} withdrawal{totalElements !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>

        {/* Export Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isExporting || withdrawals.length === 0}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" />
              Export to PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by cheque number or tenant..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            {/* Reason Filter */}
            <Select value={filters.withdrawalReason as string} onValueChange={handleReasonFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Reasons</SelectItem>
                {WITHDRAWAL_REASON_OPTIONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[130px] justify-start text-left font-normal',
                      !filters.fromDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.fromDate
                      ? format(new Date(filters.fromDate), 'MMM dd')
                      : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fromDate ? new Date(filters.fromDate) : undefined}
                    onSelect={(date) => handleDateFilter('from', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[130px] justify-start text-left font-normal',
                      !filters.toDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.toDate
                      ? format(new Date(filters.toDate), 'MMM dd')
                      : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.toDate ? new Date(filters.toDate) : undefined}
                    onSelect={(date) => handleDateFilter('to', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Undo2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No withdrawals found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No PDCs have been withdrawn yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('originalChequeNumber')}
                    >
                      <div className="flex items-center gap-1">
                        Original Cheque
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('tenantName')}
                    >
                      <div className="flex items-center gap-1">
                        Tenant
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('withdrawalDate')}
                    >
                      <div className="flex items-center gap-1">
                        Withdrawal Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Replacement Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">
                        {withdrawal.originalChequeNumber}
                      </TableCell>
                      <TableCell>{withdrawal.tenantName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPDCCurrency(withdrawal.amount)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(withdrawal.withdrawalDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{withdrawal.withdrawalReason}</TableCell>
                      <TableCell>
                        {withdrawal.newPaymentMethod ? (
                          <div>
                            <p className="text-sm">
                              {getNewPaymentMethodLabel(withdrawal.newPaymentMethod)}
                            </p>
                            {withdrawal.associatedChequeNumber && (
                              <p className="text-xs text-muted-foreground">
                                New: #{withdrawal.associatedChequeNumber}
                              </p>
                            )}
                            {withdrawal.transactionId && (
                              <p className="text-xs text-muted-foreground">
                                Ref: {withdrawal.transactionId}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/pdc/${withdrawal.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t px-4 py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(0, (filters.page || 0) - 1))}
                          className={
                            (filters.page || 0) === 0
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={(filters.page || 0) === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(Math.min(totalPages - 1, (filters.page || 0) + 1))
                          }
                          className={
                            (filters.page || 0) >= totalPages - 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WithdrawalHistoryPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6"><Skeleton className="h-96 w-full" /></div>}>
      <WithdrawalHistoryContent />
    </Suspense>
  );
}
