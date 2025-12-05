'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EyeIcon,
  Users,
  UserPlus,
  Building2,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

import type { Column, ColumnDef, ColumnFiltersState, PaginationState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { usePagination } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { TenantResponse, TenantStatus } from '@/types/tenant';

export type TenantItem = TenantResponse;

const STATUS_STYLES: Record<TenantStatus, string> = {
  ACTIVE: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  PENDING: 'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400',
  EXPIRED: 'bg-orange-600/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400',
  TERMINATED: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
};

interface TenantsDatatableProps {
  data: TenantItem[];
  pageSize?: number;
  showFilters?: boolean;
}

const TenantsDatatable = ({
  data,
  pageSize: initialPageSize = 10,
  showFilters = true,
}: TenantsDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  // Calculate days until lease end
  const getDaysUntilExpiry = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const leaseEnd = new Date(dateString);
      const today = new Date();
      const diffTime = leaseEnd.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const columns: ColumnDef<TenantItem>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 50,
      },
      {
        header: 'Tenant',
        accessorKey: 'firstName',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
              {row.original.firstName?.[0]?.toUpperCase()}{row.original.lastName?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/tenants/${row.original.id}`}
                className="font-medium hover:text-primary hover:underline truncate"
              >
                {row.original.firstName} {row.original.lastName}
              </Link>
              <span className="text-xs text-muted-foreground font-mono">
                {row.original.tenantNumber || '-'}
              </span>
            </div>
          </div>
        ),
        size: 220,
      },
      {
        header: 'Contact',
        accessorKey: 'email',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate text-muted-foreground">{row.getValue('email') || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{row.original.phone || '-'}</span>
            </div>
          </div>
        ),
        size: 220,
      },
      {
        header: 'Property / Unit',
        accessorKey: 'property',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{row.original.property?.name || '-'}</span>
              <span className="text-xs text-muted-foreground">Unit {row.original.unit?.unitNumber || '-'}</span>
            </div>
          </div>
        ),
        size: 200,
      },
      {
        header: 'Lease End',
        accessorKey: 'leaseEndDate',
        cell: ({ row }) => {
          const daysLeft = getDaysUntilExpiry(row.getValue('leaseEndDate'));
          const status = row.original.status;

          // Only show days indicator for active tenants
          const showDaysIndicator = status === 'ACTIVE' && daysLeft !== null;
          const isUrgent = showDaysIndicator && daysLeft <= 30;
          const isWarning = showDaysIndicator && daysLeft > 30 && daysLeft <= 60;

          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{formatDate(row.getValue('leaseEndDate'))}</span>
              </div>
              {showDaysIndicator && (
                <span className={cn(
                  "text-xs",
                  isUrgent && "text-red-600 dark:text-red-400 font-medium",
                  isWarning && "text-amber-600 dark:text-amber-400",
                  !isUrgent && !isWarning && "text-muted-foreground"
                )}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                </span>
              )}
            </div>
          );
        },
        size: 140,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.getValue('status') as TenantStatus;
          return (
            <Badge className={cn('rounded-full border-none font-medium', STATUS_STYLES[status])}>
              {status}
            </Badge>
          );
        },
        size: 110,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <Link href={`/tenants/${row.original.id}`}>
                    <EyeIcon className="h-4 w-4" />
                    <span className="sr-only">View tenant</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 60,
        enableHiding: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2,
  });

  return (
    <div className="w-full">
      {/* Filters - shown conditionally */}
      {showFilters && data.length > 0 && (
        <div className="border-b p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Filter column={table.getColumn('status')!} label="Status" />
            <div className="w-full sm:w-40 space-y-2">
              <Label>Page Size</Label>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => {
                  setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table data-testid="table-tenants">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12 bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground first:pl-4 last:pr-4"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          header.column.getCanSort() &&
                            'flex h-full cursor-pointer items-center gap-1.5 select-none hover:text-foreground transition-colors'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUpIcon className="shrink-0 opacity-60" size={14} aria-hidden="true" />,
                          desc: <ChevronDownIcon className="shrink-0 opacity-60" size={14} aria-hidden="true" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="group hover:bg-muted/50 transition-colors"
                  data-testid="tenant-row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 first:pl-4 last:pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-80">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">No tenants found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {data.length === 0
                          ? "Get started by adding your first tenant to the system."
                          : "Try adjusting your search or filter criteria."}
                      </p>
                    </div>
                    {data.length === 0 && (
                      <Button asChild className="gap-2 mt-2">
                        <Link href="/tenants/create">
                          <UserPlus className="h-4 w-4" />
                          Add Your First Tenant
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getRowCount() > 0 && (
        <div className="flex items-center justify-between gap-4 border-t px-4 py-3 max-sm:flex-col">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground whitespace-nowrap" aria-live="polite">
              Showing{' '}
              <span className="font-medium text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium text-foreground">
                {Math.min(
                  table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  table.getRowCount()
                )}
              </span>
              {' '}of{' '}
              <span className="font-medium text-foreground">{table.getRowCount()}</span>
            </p>

            {/* Page size selector - compact for bottom */}
            {!showFilters && (
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => {
                  setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="gap-1 h-8"
                >
                  <ChevronLeftIcon size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              </PaginationItem>
              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              {pages.map((page) => {
                const isActive = page === table.getState().pagination.pageIndex + 1;
                return (
                  <PaginationItem key={page}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                );
              })}
              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="gap-1 h-8"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRightIcon size={16} />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TenantsDatatable;

function Filter({ column, label }: { column: Column<TenantItem, unknown>; label: string }) {
  const id = useId();
  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = useMemo(() => {
    const values = Array.from(column.getFacetedUniqueValues().keys());
    const flattenedValues = values.reduce((acc: string[], curr) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr];
      }
      return [...acc, curr];
    }, []);
    return Array.from(new Set(flattenedValues)).sort();
  }, [column.getFacetedUniqueValues()]);

  return (
    <div className="w-full sm:w-40 space-y-2">
      <Label htmlFor={`${id}-select`}>Filter by {label}</Label>
      <Select
        value={columnFilterValue?.toString() ?? 'all'}
        onValueChange={(value) => {
          column.setFilterValue(value === 'all' ? undefined : value);
        }}
      >
        <SelectTrigger id={`${id}-select`} className="w-full capitalize">
          <SelectValue placeholder={`All ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {sortedUniqueValues.map((value) => (
            <SelectItem key={String(value)} value={String(value)} className="capitalize">
              {String(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
