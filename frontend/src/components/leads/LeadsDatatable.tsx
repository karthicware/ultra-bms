'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PencilIcon,
  Users,
  Trash2,
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
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { usePagination } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus, LeadSource } from '@/types/leads';
import { calculateDaysInPipeline } from '@/services/leads.service';

export type LeadItem = Lead;

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  NEW_LEAD: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  QUOTATION_SENT: 'bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
  CONVERTED: 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  LOST: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
};

interface LeadsDatatableProps {
  data: LeadItem[];
  onCreateQuotation?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  pageSize?: number;
}

const LeadsDatatable = ({
  data,
  onCreateQuotation,
  onDelete,
  pageSize: initialPageSize = 10,
}: LeadsDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const columns: ColumnDef<LeadItem>[] = useMemo(
    () => [
      {
        header: 'Lead #',
        accessorKey: 'leadNumber',
        cell: ({ row }) => (
          <Link
            href={`/leads/${row.original.id}`}
            className="font-mono text-sm font-medium text-primary hover:underline"
          >
            {row.getValue('leadNumber')}
          </Link>
        ),
        size: 120,
      },
      {
        header: 'Name',
        accessorKey: 'fullName',
        cell: ({ row }) => {
          const fullName = row.getValue('fullName') as string;
          const titleCaseName = fullName
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          return (
            <div className="flex flex-col">
              <span className="font-medium">{titleCaseName}</span>
              <span className="text-xs text-muted-foreground">{row.original.email}</span>
            </div>
          );
        },
        size: 200,
      },
      {
        header: 'Contact',
        accessorKey: 'contactNumber',
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue('contactNumber')}</span>
        ),
        size: 150,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.getValue('status') as LeadStatus;
          return (
            <Badge className={cn('rounded-sm border-none', LEAD_STATUS_STYLES[status])}>
              {status.replace('_', ' ')}
            </Badge>
          );
        },
        size: 130,
      },
      {
        header: 'Source',
        accessorKey: 'leadSource',
        cell: ({ row }) => {
          const source = row.getValue('leadSource') as LeadSource;
          return (
            <span className="text-sm text-muted-foreground">
              {source.replace('_', ' ')}
            </span>
          );
        },
        size: 120,
      },
      {
        header: 'Days in Pipeline',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-sm">
            {calculateDaysInPipeline(row.getValue('createdAt'))} days
          </span>
        ),
        size: 120,
      },
      {
        id: 'actions',
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Edit lead" asChild>
                  <Link href={`/leads/${row.original.id}/edit`}>
                    <PencilIcon className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="size-4.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lead? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => onDelete(row.original.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ),
        size: 100,
      },
    ],
    [onCreateQuotation, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
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
            <div className="grid grid-cols-1 gap-6 max-md:last:col-span-full sm:grid-cols-2 md:grid-cols-4">
              <Filter column={table.getColumn('status')!} label="Status" />
              <Filter column={table.getColumn('leadSource')!} label="Source" />
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
                          if (e.key === 'Enter' || e.key === ' ') {
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
                    <Users className="size-8 text-muted-foreground/50" />
                    <span>No leads found.</span>
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
          of <span>{table.getRowCount().toString()} leads</span>
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

export default LeadsDatatable;

function Filter({ column, label }: { column: Column<LeadItem, unknown>; label: string }) {
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
              {formatValue(String(value))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}