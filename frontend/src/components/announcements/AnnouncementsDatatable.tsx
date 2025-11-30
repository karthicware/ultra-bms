'use client';

import { useId, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EyeIcon,
  Edit,
  Trash2,
  Send,
  Archive,
  Copy,
  MoreHorizontal,
  Megaphone,
  Paperclip,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { usePagination } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { AnnouncementListItem, AnnouncementStatus } from '@/types/announcement';

export type AnnouncementItem = AnnouncementListItem;

// Status badge styling
const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  DRAFT: 'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400',
  PUBLISHED: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  EXPIRED: 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  ARCHIVED: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
};

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

interface AnnouncementsDatatableProps {
  data: AnnouncementItem[];
  pageSize?: number;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onPublish?: (id: string) => void;
  onArchive?: (id: string) => void;
  onCopy?: (id: string) => void;
  onDelete?: (announcement: AnnouncementItem) => void;
}

const AnnouncementsDatatable = ({
  data,
  pageSize: initialPageSize = 10,
  onView,
  onEdit,
  onPublish,
  onArchive,
  onCopy,
  onDelete,
}: AnnouncementsDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Get available actions based on status
  const getRowActions = (announcement: AnnouncementItem) => {
    const actions = [];

    // View is always available
    if (onView) {
      actions.push({
        label: 'View',
        icon: EyeIcon,
        onClick: () => onView(announcement.id),
      });
    }

    // Edit only for DRAFT
    if (announcement.status === 'DRAFT') {
      if (onEdit) {
        actions.push({
          label: 'Edit',
          icon: Edit,
          onClick: () => onEdit(announcement.id),
        });
      }
      if (onPublish) {
        actions.push({
          label: 'Publish',
          icon: Send,
          onClick: () => onPublish(announcement.id),
        });
      }
    }

    // Archive for PUBLISHED or EXPIRED
    if ((announcement.status === 'PUBLISHED' || announcement.status === 'EXPIRED') && onArchive) {
      actions.push({
        label: 'Archive',
        icon: Archive,
        onClick: () => onArchive(announcement.id),
      });
    }

    // Copy is always available
    if (onCopy) {
      actions.push({
        label: 'Copy',
        icon: Copy,
        onClick: () => onCopy(announcement.id),
      });
    }

    // Delete only for DRAFT
    if (announcement.status === 'DRAFT' && onDelete) {
      actions.push({
        label: 'Delete',
        icon: Trash2,
        onClick: () => onDelete(announcement),
        variant: 'destructive' as const,
      });
    }

    return actions;
  };

  const columns: ColumnDef<AnnouncementItem>[] = useMemo(
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
        header: 'Number',
        accessorKey: 'announcementNumber',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.getValue('announcementNumber')}</span>
        ),
        size: 120,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue('title')}</span>
            {row.original.hasAttachment && (
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ),
        size: 250,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.getValue('status') as AnnouncementStatus;
          return (
            <Badge className={cn('rounded-sm border-none', STATUS_STYLES[status])}>
              {STATUS_LABELS[status]}
            </Badge>
          );
        },
        size: 100,
      },
      {
        header: 'Expires',
        accessorKey: 'expiresAt',
        cell: ({ row }) => (
          <span className="text-sm">{format(new Date(row.getValue('expiresAt')), 'dd MMM yyyy')}</span>
        ),
        size: 110,
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-sm">{format(new Date(row.getValue('createdAt')), 'dd MMM yyyy')}</span>
        ),
        size: 110,
      },
      {
        header: 'Created By',
        accessorKey: 'createdByName',
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue('createdByName') || '-'}</span>
        ),
        size: 130,
      },
      {
        id: 'actions',
        header: () => '',
        cell: ({ row }) => {
          const actions = getRowActions(row.original);
          if (actions.length === 0) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <div key={action.label}>
                    {action.label === 'Delete' && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      className={action.variant === 'destructive' ? 'text-red-600' : ''}
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 60,
        enableHiding: false,
      },
    ],
    [onView, onEdit, onPublish, onArchive, onCopy, onDelete]
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
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-14 border-t">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="text-muted-foreground first:pl-4 last:px-4"
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
                  data-testid={`announcement-row-${row.original.id}`}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 first:w-12.5 first:pl-4 last:w-16 last:px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Megaphone className="size-8 text-muted-foreground/50" />
                    <span>No announcements found.</span>
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
          of <span>{table.getRowCount().toString()} announcements</span>
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

export default AnnouncementsDatatable;

function Filter({ column, label }: { column: Column<AnnouncementItem, unknown>; label: string }) {
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
              {STATUS_LABELS[value as AnnouncementStatus] || String(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
