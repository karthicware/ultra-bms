'use client';

/**
 * PDC List Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #13: PDC list with filtering, sorting, and pagination
 */

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { usePDCs } from '@/hooks/usePDCs';
import { PDCStatusBadge } from '@/components/pdc/PDCStatusBadge';
import { formatPDCCurrency, PDCStatus, PDCFilter, PDC_STATUS_OPTIONS } from '@/types/pdc';
import {
  Plus,
  Search,
  Eye,
  Building2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowUpDown,
  Undo2,
  Ban,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { debounce } from 'lodash';

function PDCListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initialStatus = searchParams.get('status') as PDCStatus | null;

  // Filter state
  const [filters, setFilters] = useState<PDCFilter>({
    search: '',
    status: initialStatus || 'ALL',
    page: 0,
    size: 10,
    sortBy: 'chequeDate',
    sortDirection: 'ASC',
  });
  const [searchInput, setSearchInput] = useState('');

  // Fetch PDCs
  const { data: response, isLoading } = usePDCs(filters);
  const pdcs = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 0;
  const totalElements = response?.data?.totalElements || 0;

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

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value as PDCStatus | 'ALL', page: 0 }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      status: 'ALL',
      page: 0,
      size: 10,
      sortBy: 'chequeDate',
      sortDirection: 'ASC',
    });
  };

  const hasActiveFilters = filters.search || (filters.status && filters.status !== 'ALL');

  // Navigation handlers
  const handleView = (id: string) => {
    router.push(`/pdc/${id}`);
  };

  const handleAction = (id: string, action: string) => {
    router.push(`/pdc/${id}?action=${action}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-pdc-list">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post-Dated Cheques</h1>
          <p className="text-muted-foreground">
            {totalElements} PDC{totalElements !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button asChild>
          <Link href="/pdc/new">
            <Plus className="mr-2 h-4 w-4" />
            Register PDC
          </Link>
        </Button>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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

            {/* Status Filter */}
            <Select value={filters.status as string} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {PDC_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
          ) : pdcs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No PDCs found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Register your first PDC to get started'}
              </p>
              {!hasActiveFilters && (
                <Button className="mt-4" asChild>
                  <Link href="/pdc/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Register PDC
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('chequeNumber')}
                    >
                      <div className="flex items-center gap-1">
                        Cheque No.
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
                    <TableHead>Bank</TableHead>
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
                      onClick={() => handleSort('chequeDate')}
                    >
                      <div className="flex items-center gap-1">
                        Cheque Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pdcs.map((pdc) => (
                    <TableRow key={pdc.id}>
                      <TableCell className="font-medium">{pdc.chequeNumber}</TableCell>
                      <TableCell>{pdc.tenantName}</TableCell>
                      <TableCell>{pdc.bankName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPDCCurrency(pdc.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {format(new Date(pdc.chequeDate), 'MMM dd, yyyy')}
                          {pdc.isDue && (
                            <span className="text-amber-600 text-xs">(Due soon)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PDCStatusBadge status={pdc.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(pdc.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {pdc.status === PDCStatus.DUE && (
                              <DropdownMenuItem onClick={() => handleAction(pdc.id, 'deposit')}>
                                <Building2 className="mr-2 h-4 w-4" />
                                Mark as Deposited
                              </DropdownMenuItem>
                            )}
                            {pdc.status === PDCStatus.DEPOSITED && (
                              <>
                                <DropdownMenuItem onClick={() => handleAction(pdc.id, 'clear')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Mark as Cleared
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction(pdc.id, 'bounce')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Report Bounce
                                </DropdownMenuItem>
                              </>
                            )}
                            {(pdc.status === PDCStatus.RECEIVED || pdc.status === PDCStatus.DUE) && (
                              <>
                                <DropdownMenuItem onClick={() => handleAction(pdc.id, 'withdraw')}>
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Withdraw
                                </DropdownMenuItem>
                                {pdc.status === PDCStatus.RECEIVED && (
                                  <DropdownMenuItem onClick={() => handleAction(pdc.id, 'cancel')}>
                                    <Ban className="mr-2 h-4 w-4 text-red-600" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {pdcs.length} of {totalElements} PDCs
                </div>

                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => (filters.page || 0) > 0 && handlePageChange((filters.page || 0) - 1)}
                          className={(filters.page || 0) === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {(filters.page || 0) > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(0)} className="cursor-pointer">1</PaginationLink>
                          </PaginationItem>
                          {(filters.page || 0) > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                        </>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i)
                        .filter(page => Math.abs(page - (filters.page || 0)) <= 2)
                        .map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === (filters.page || 0)}
                              className="cursor-pointer"
                            >
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                      {(filters.page || 0) < totalPages - 3 && (
                        <>
                          {(filters.page || 0) < totalPages - 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(totalPages - 1)} className="cursor-pointer">{totalPages}</PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => (filters.page || 0) < totalPages - 1 && handlePageChange((filters.page || 0) + 1)}
                          className={(filters.page || 0) >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}

                <div className="text-sm text-muted-foreground">
                  Page {(filters.page || 0) + 1} of {totalPages || 1}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PDCListPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6"><Skeleton className="h-96 w-full" /></div>}>
      <PDCListContent />
    </Suspense>
  );
}
