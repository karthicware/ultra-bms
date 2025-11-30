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
  Pencil,
  Wrench,
  Droplet,
  Zap,
  Wind,
  Tv,
  Hammer,
  Bug,
  Sparkles,
  Paintbrush,
  Sprout,
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
import type { WorkOrderListItem, WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from '@/types/work-orders';

export type WorkOrderItem = WorkOrderListItem;

// Category icons mapping
const CATEGORY_ICONS: Record<WorkOrderCategory, React.ElementType> = {
  PLUMBING: Droplet,
  ELECTRICAL: Zap,
  HVAC: Wind,
  APPLIANCE: Tv,
  CARPENTRY: Hammer,
  PEST_CONTROL: Bug,
  CLEANING: Sparkles,
  PAINTING: Paintbrush,
  LANDSCAPING: Sprout,
  OTHER: Wrench,
};

// Status badge colors
const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  OPEN: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  ASSIGNED: 'bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
  IN_PROGRESS: 'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400',
  COMPLETED: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  CLOSED: 'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400',
};

// Priority badge colors
const PRIORITY_STYLES: Record<WorkOrderPriority, string> = {
  HIGH: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
  MEDIUM: 'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400',
  LOW: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
};

interface WorkOrdersDatatableProps {
  data: WorkOrderItem[];
  pageSize?: number;
}

const WorkOrdersDatatable = ({
  data,
  pageSize: initialPageSize = 10,
}: WorkOrdersDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const columns: ColumnDef<WorkOrderItem>[] = useMemo(
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
        header: 'Work Order #',
        accessorKey: 'workOrderNumber',
        cell: ({ row }) => (
          <Link
            href={`/property-manager/work-orders/${row.original.id}`}
            className="font-mono text-sm font-medium text-primary hover:underline"
          >
            {row.getValue('workOrderNumber')}
          </Link>
        ),
        size: 130,
      },
      {
        header: 'Property / Unit',
        accessorKey: 'propertyName',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue('propertyName') || '-'}</span>
            {row.original.unitNumber && (
              <span className="text-sm text-muted-foreground">Unit {row.original.unitNumber}</span>
            )}
          </div>
        ),
        size: 160,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate block">{row.getValue('title')}</span>
        ),
        size: 200,
      },
      {
        header: 'Category',
        accessorKey: 'category',
        cell: ({ row }) => {
          const category = row.getValue('category') as WorkOrderCategory;
          const CategoryIcon = CATEGORY_ICONS[category];
          return (
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{category.replace(/_/g, ' ')}</span>
            </div>
          );
        },
        size: 140,
      },
      {
        header: 'Priority',
        accessorKey: 'priority',
        cell: ({ row }) => {
          const priority = row.getValue('priority') as WorkOrderPriority;
          return (
            <Badge className={cn('rounded-sm border-none', PRIORITY_STYLES[priority])}>
              {priority}
            </Badge>
          );
        },
        size: 100,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.getValue('status') as WorkOrderStatus;
          return (
            <div className="flex items-center gap-2">
              <Badge className={cn('rounded-sm border-none', STATUS_STYLES[status])}>
                {status.replace(/_/g, ' ')}
              </Badge>
              {row.original.isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
          );
        },
        size: 150,
      },
      {
        header: 'Scheduled',
        accessorKey: 'scheduledDate',
        cell: ({ row }) => {
          const date = row.getValue('scheduledDate') as string | undefined;
          return (
            <span className="text-sm">{date ? format(new Date(date), 'dd MMM yyyy') : '-'}</span>
          );
        },
        size: 110,
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigneeName',
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue('assigneeName') || 'Unassigned'}</span>
        ),
        size: 130,
      },
      {
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => {
          const status = row.original.status;
          const canEdit = status === 'OPEN' || status === 'ASSIGNED';
          return (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="View work order" asChild>
                    <Link href={`/property-manager/work-orders/${row.original.id}`}>
                      <EyeIcon className="size-4.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Edit work order" asChild>
                      <Link href={`/property-manager/work-orders/${row.original.id}/edit`}>
                        <Pencil className="size-4.5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
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
            <Filter column={table.getColumn('status')!} label="Status" />
            <Filter column={table.getColumn('priority')!} label="Priority" />
            <Filter column={table.getColumn('category')!} label="Category" />
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
        <Table data-testid="table-work-orders">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
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
                    <Wrench className="size-8 text-muted-foreground/50" />
                    <span>No work orders found.</span>
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
          of <span>{table.getRowCount().toString()} work orders</span>
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

export default WorkOrdersDatatable;

function Filter({ column, label }: { column: Column<WorkOrderItem, unknown>; label: string }) {
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
              {String(value).replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
