'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EyeIcon,
  Package,
  Shield,
  AlertTriangle,
  XCircle,
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
import type { AssetListItem, AssetStatus, AssetCategory } from '@/types/asset';
import { ASSET_CATEGORY_OPTIONS, ASSET_STATUS_OPTIONS } from '@/types/asset';

export type AssetItem = AssetListItem;

const STATUS_STYLES: Record<AssetStatus, string> = {
  ACTIVE: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  UNDER_MAINTENANCE: 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  OUT_OF_SERVICE: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
  DISPOSED: 'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400',
};

interface AssetsDatatableProps {
  data: AssetItem[];
  pageSize?: number;
}

const AssetsDatatable = ({
  data,
  pageSize: initialPageSize = 10,
}: AssetsDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const getWarrantyBadge = (warrantyStatus: string | null, daysRemaining: number | null) => {
    if (!warrantyStatus || warrantyStatus === 'NO_WARRANTY') {
      return <span className="text-gray-400 text-sm">No warranty</span>;
    }

    const badgeConfig: Record<string, { className: string; icon: React.ReactNode }> = {
      ACTIVE: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <Shield className="h-3 w-3 mr-1" />,
      },
      EXPIRING_SOON: {
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      },
      EXPIRED: {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
    };

    const config = badgeConfig[warrantyStatus] || badgeConfig.EXPIRED;
    const label = daysRemaining !== null && daysRemaining > 0
      ? `${daysRemaining} days`
      : warrantyStatus === 'EXPIRED'
        ? 'Expired'
        : warrantyStatus.replace('_', ' ');

    return (
      <Badge className={`${config.className} border flex items-center`}>
        {config.icon}
        {label}
      </Badge>
    );
  };

  const columns: ColumnDef<AssetItem>[] = useMemo(
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
        header: 'Asset #',
        accessorKey: 'assetNumber',
        cell: ({ row }) => (
          <Link
            href={`/assets/${row.original.id}`}
            className="font-mono text-sm font-medium text-primary hover:underline"
          >
            {row.getValue('assetNumber')}
          </Link>
        ),
        size: 120,
      },
      {
        header: 'Name',
        accessorKey: 'assetName',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('assetName')}</span>
        ),
        size: 180,
      },
      {
        header: 'Category',
        accessorKey: 'category',
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {row.original.categoryDisplayName}
          </Badge>
        ),
        size: 140,
      },
      {
        header: 'Property',
        accessorKey: 'propertyName',
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue('propertyName') || 'N/A'}</span>
        ),
        size: 150,
      },
      {
        header: 'Location',
        accessorKey: 'location',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.getValue('location')}</span>
        ),
        size: 150,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.getValue('status') as AssetStatus;
          return (
            <Badge className={cn('rounded-sm border-none', STATUS_STYLES[status])}>
              {row.original.statusDisplayName}
            </Badge>
          );
        },
        size: 140,
      },
      {
        header: 'Warranty',
        accessorKey: 'warrantyStatus',
        cell: ({ row }) => getWarrantyBadge(row.original.warrantyStatus, row.original.warrantyDaysRemaining),
        size: 130,
      },
      {
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View asset" asChild>
                  <Link href={`/assets/${row.original.id}`}>
                    <EyeIcon className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
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
      <div className="border-b">
        <div className="flex flex-col gap-4 p-6">
          <span className="text-xl font-semibold">Filter</span>
          <div className="grid grid-cols-1 gap-6 max-md:last:col-span-full sm:grid-cols-2 md:grid-cols-4">
            <Filter column={table.getColumn('category')!} label="Category" options={ASSET_CATEGORY_OPTIONS} />
            <Filter column={table.getColumn('status')!} label="Status" options={ASSET_STATUS_OPTIONS} />
            <div className="w-full space-y-2">
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
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-14 border-t">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="text-muted-foreground first:pl-4 last:px-4 last:text-center"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          header.column.getCanSort() &&
                            'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
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
                          asc: <ChevronUpIcon className="shrink-0 opacity-60" size={16} aria-hidden="true" />,
                          desc: <ChevronDownIcon className="shrink-0 opacity-60" size={16} aria-hidden="true" />,
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-transparent cursor-pointer" onClick={() => window.location.href = `/assets/${row.original.id}`}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 first:w-12.5 first:pl-4 last:w-20 last:px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="size-8 text-muted-foreground/50" />
                    <span>No assets found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col">
        <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
          Showing{' '}
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{' '}
          of <span>{table.getRowCount().toString()} assets</span>
        </p>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  className="disabled:pointer-events-none disabled:opacity-50"
                  variant="ghost"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon aria-hidden="true" />
                  Previous
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
                      size="icon"
                      className={`${!isActive && 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'}`}
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
                  className="disabled:pointer-events-none disabled:opacity-50"
                  variant="ghost"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  Next
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default AssetsDatatable;

function Filter({ column, label, options }: { column: Column<AssetItem, unknown>; label: string; options?: { value: string; label: string }[] }) {
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

  const getLabel = (value: string) => {
    if (options) {
      const option = options.find(opt => opt.value === value);
      return option?.label || value;
    }
    return value.replace(/_/g, ' ');
  };

  return (
    <div className="w-full space-y-2">
      <Label htmlFor={`${id}-select`}>Select {label}</Label>
      <Select
        value={columnFilterValue?.toString() ?? 'all'}
        onValueChange={(value) => {
          column.setFilterValue(value === 'all' ? undefined : value);
        }}
      >
        <SelectTrigger id={`${id}-select`} className="w-full capitalize">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {sortedUniqueValues.map((value) => (
            <SelectItem key={String(value)} value={String(value)} className="capitalize">
              {getLabel(String(value))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
