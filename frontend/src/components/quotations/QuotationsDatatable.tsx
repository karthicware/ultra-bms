'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  Send,
  Download,
  FileText,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { usePagination } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { Quotation, QuotationStatus } from '@/types/quotations';
import { formatCurrency } from '@/lib/validations/quotations';

export type QuotationItem = Quotation;

const QUOTATION_STATUS_STYLES: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400',
  SENT: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  ACCEPTED: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  REJECTED: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
  EXPIRED: 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  CONVERTED: 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
};

interface QuotationsDatatableProps {
  data: QuotationItem[];
  onSend?: (id: string, quotationNumber: string) => void;
  onDownload?: (id: string, quotationNumber: string) => void;
  pageSize?: number;
}

const QuotationsDatatable = ({
  data,
  onSend,
  onDownload,
  pageSize: initialPageSize = 10,
}: QuotationsDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const columns: ColumnDef<QuotationItem>[] = useMemo(
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
        header: 'Quotation #',
        accessorKey: 'quotationNumber',
        cell: ({ row }) => (
          <Link
            href={`/quotations/${row.original.id}`}
            className="font-mono text-sm font-medium text-primary hover:underline"
          >
            {row.getValue('quotationNumber')}
          </Link>
        ),
        size: 140,
      },
      {
        header: 'Lead Name',
        accessorKey: 'leadName',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('leadName') || 'N/A'}</span>
        ),
        size: 180,
      },
      {
        header: 'Property',
        accessorKey: 'propertyName',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm">{row.getValue('propertyName') || 'N/A'}</span>
            {row.original.unitNumber && (
              <span className="text-xs text-muted-foreground">Unit {row.original.unitNumber}</span>
            )}
          </div>
        ),
        size: 200,
      },
      {
        header: 'Amount',
        accessorKey: 'totalFirstPayment',
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.getValue('totalFirstPayment'))}</span>
        ),
        size: 120,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.getValue('status') as QuotationStatus;
          return (
            <Badge className={cn('rounded-sm border-none capitalize', QUOTATION_STATUS_STYLES[status])}>
              {status.toLowerCase()}
            </Badge>
          );
        },
        size: 100,
      },
      {
        header: 'Issue Date',
        accessorKey: 'issueDate',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.getValue('issueDate')), 'dd MMM yyyy')}
          </span>
        ),
        size: 120,
      },
      {
        header: 'Expiry Date',
        accessorKey: 'validityDate',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.getValue('validityDate')), 'dd MMM yyyy')}
          </span>
        ),
        size: 120,
      },
      {
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View quotation" asChild>
                  <Link href={`/quotations/${row.original.id}`}>
                    <EyeIcon className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>
            {row.original.status === 'DRAFT' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Edit quotation" asChild>
                    <Link href={`/quotations/${row.original.id}/edit`}>
                      <PencilIcon className="size-4.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Download PDF"
                  onClick={() => onDownload?.(row.original.id, row.original.quotationNumber)}
                >
                  <Download className="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>
            <RowActions
              quotation={row.original}
              onSend={onSend}
              onDownload={onDownload}
            />
          </div>
        ),
        enableHiding: false,
      },
    ],
    [onSend, onDownload]
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
        {data.length > 0 && (
          <div className="flex flex-col gap-4 p-6">
            <span className="text-xl font-semibold">Filter</span>
            <div className="grid grid-cols-1 gap-6 max-md:last:col-span-full sm:grid-cols-2 md:grid-cols-3">
              <Filter column={table.getColumn('status')!} label="Status" />
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
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-14 border-t">
                {headerGroup.headers.map((header) => {
                  return (
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
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-transparent">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 first:w-12.5 first:pl-4 last:w-36 last:px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="size-8 text-muted-foreground/50" />
                    <span>No quotations found.</span>
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
          of <span>{table.getRowCount().toString()} quotations</span>
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

export default QuotationsDatatable;

function Filter({ column, label }: { column: Column<QuotationItem, unknown>; label: string }) {
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

  const formatValue = (value: string) => {
    const formatMap: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Sent',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired',
      CONVERTED: 'Converted',
    };
    return formatMap[value] || value;
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
              {formatValue(String(value))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RowActions({
  quotation,
  onSend,
  onDownload,
}: {
  quotation: QuotationItem;
  onSend?: (id: string, quotationNumber: string) => void;
  onDownload?: (id: string, quotationNumber: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex">
          <Button size="icon" variant="ghost" className="rounded-full p-2" aria-label="More actions">
            <EllipsisVerticalIcon className="size-4.5" aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/quotations/${quotation.id}`}>View Details</Link>
          </DropdownMenuItem>
          {quotation.status === 'DRAFT' && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/quotations/${quotation.id}/edit`}>Edit Quotation</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSend?.(quotation.id, quotation.quotationNumber)}>
                <Send className="mr-2 h-4 w-4" />
                Send Quotation
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => onDownload?.(quotation.id, quotation.quotationNumber)}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
