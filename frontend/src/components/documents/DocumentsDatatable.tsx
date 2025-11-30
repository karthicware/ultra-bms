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
  Download,
  FileText,
  Building2,
  User,
  Wrench,
  Package,
  FolderOpen,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
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
import type { DocumentListItem, DocumentEntityType, DocumentAccessLevel, DocumentExpiryStatus } from '@/types/document';
import {
  ENTITY_TYPE_OPTIONS,
  ACCESS_LEVEL_OPTIONS,
  getEntityTypeColor,
  getAccessLevelColor,
  getExpiryStatusColor,
  getExpiryStatusLabel,
  formatFileSize,
} from '@/types/document';

export type DocumentItem = DocumentListItem;

interface DocumentsDatatableProps {
  data: DocumentItem[];
  pageSize?: number;
  onDownload?: (id: string) => void;
}

const DocumentsDatatable = ({
  data,
  pageSize: initialPageSize = 10,
  onDownload,
}: DocumentsDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Entity type icon helper
  const getEntityTypeIcon = (entityType: DocumentEntityType) => {
    switch (entityType) {
      case 'PROPERTY':
        return <Building2 className="h-3 w-3" />;
      case 'TENANT':
        return <User className="h-3 w-3" />;
      case 'VENDOR':
        return <Wrench className="h-3 w-3" />;
      case 'ASSET':
        return <Package className="h-3 w-3" />;
      case 'GENERAL':
      default:
        return <FolderOpen className="h-3 w-3" />;
    }
  };

  // Access level icon helper
  const getAccessLevelIcon = (accessLevel: DocumentAccessLevel) => {
    switch (accessLevel) {
      case 'PUBLIC':
        return <Unlock className="h-3 w-3" />;
      case 'RESTRICTED':
        return <Lock className="h-3 w-3" />;
      case 'INTERNAL':
      default:
        return <ShieldCheck className="h-3 w-3" />;
    }
  };

  // Expiry status icon helper
  const getExpiryStatusIcon = (status: DocumentExpiryStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-3 w-3" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-3 w-3" />;
      case 'expired':
        return <XCircle className="h-3 w-3" />;
      case 'no_expiry':
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const columns: ColumnDef<DocumentItem>[] = useMemo(
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
        header: 'Document #',
        accessorKey: 'documentNumber',
        cell: ({ row }) => (
          <Link
            href={`/documents/${row.original.id}`}
            className="font-mono text-sm font-medium text-primary hover:underline"
          >
            {row.getValue('documentNumber')}
          </Link>
        ),
        size: 120,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.getValue('title')}>
            <span className="font-medium">{row.getValue('title')}</span>
          </div>
        ),
        size: 200,
      },
      {
        header: 'Type',
        accessorKey: 'documentType',
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-slate-50">
            {row.getValue('documentType')}
          </Badge>
        ),
        size: 120,
      },
      {
        header: 'Entity',
        accessorKey: 'entityType',
        cell: ({ row }) => {
          const entityType = row.getValue('entityType') as DocumentEntityType;
          return (
            <Badge className={`${getEntityTypeColor(entityType)} flex items-center gap-1 w-fit`}>
              {getEntityTypeIcon(entityType)}
              {row.original.entityName || ENTITY_TYPE_OPTIONS.find(o => o.value === entityType)?.label}
            </Badge>
          );
        },
        size: 140,
      },
      {
        header: 'Access',
        accessorKey: 'accessLevel',
        cell: ({ row }) => {
          const accessLevel = row.getValue('accessLevel') as DocumentAccessLevel;
          return (
            <Badge className={`${getAccessLevelColor(accessLevel)} flex items-center gap-1 w-fit`}>
              {getAccessLevelIcon(accessLevel)}
              {ACCESS_LEVEL_OPTIONS.find(o => o.value === accessLevel)?.label}
            </Badge>
          );
        },
        size: 120,
      },
      {
        header: 'Expiry',
        accessorKey: 'expiryStatus',
        cell: ({ row }) => {
          if (!row.original.expiryDate) {
            return <span className="text-gray-400 text-sm">No expiry</span>;
          }
          const status = row.getValue('expiryStatus') as DocumentExpiryStatus;
          return (
            <Badge className={`${getExpiryStatusColor(status)} flex items-center gap-1 w-fit`}>
              {getExpiryStatusIcon(status)}
              {getExpiryStatusLabel(status, row.original.daysUntilExpiry)}
            </Badge>
          );
        },
        size: 140,
      },
      {
        header: 'Size',
        accessorKey: 'fileSize',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatFileSize(row.getValue('fileSize'))}</span>
        ),
        size: 100,
      },
      {
        header: 'Uploaded',
        accessorKey: 'uploadedAt',
        cell: ({ row }) => (
          <span className="text-sm">{format(new Date(row.getValue('uploadedAt')), 'dd MMM yyyy')}</span>
        ),
        size: 110,
      },
      {
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View document" asChild>
                  <Link href={`/documents/${row.original.id}`}>
                    <EyeIcon className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
            {onDownload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Download document"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(row.original.id);
                    }}
                  >
                    <Download className="size-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
        enableHiding: false,
      },
    ],
    [onDownload]
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
            <Filter
              column={table.getColumn('entityType')!}
              label="Entity Type"
              options={ENTITY_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            />
            <Filter
              column={table.getColumn('accessLevel')!}
              label="Access Level"
              options={ACCESS_LEVEL_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            />
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => window.location.href = `/documents/${row.original.id}`}
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
                    <FileText className="size-8 text-muted-foreground/50" />
                    <span>No documents found.</span>
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
          of <span>{table.getRowCount().toString()} documents</span>
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

export default DocumentsDatatable;

function Filter({
  column,
  label,
  options,
}: {
  column: Column<DocumentItem, unknown>;
  label: string;
  options?: { value: string; label: string }[];
}) {
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
      const option = options.find((opt) => opt.value === value);
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
