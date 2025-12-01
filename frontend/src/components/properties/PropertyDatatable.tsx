'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  Building2,
  Home,
  Building,
  Layers,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { usePagination } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { Property, PropertyType } from '@/types/properties';

export type PropertyItem = Property;

const getOccupancyStyles = (rate: number): string => {
  if (rate >= 90) {
    return 'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40';
  }
  if (rate >= 70) {
    return 'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40';
  }
  return 'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40';
};

const getPropertyTypeIcon = (type: PropertyType) => {
  const icons = {
    RESIDENTIAL: <Home className="size-4 text-blue-600 dark:text-blue-400" />,
    COMMERCIAL: <Building className="size-4 text-purple-600 dark:text-purple-400" />,
    MIXED_USE: <Layers className="size-4 text-orange-600 dark:text-orange-400" />,
  };
  return icons[type] || <Building2 className="size-4" />;
};

const getPropertyTypeStyles = (type: PropertyType): string => {
  const styles = {
    RESIDENTIAL: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
    COMMERCIAL: 'bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
    MIXED_USE: 'bg-orange-600/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400',
  };
  return styles[type] || '';
};

interface PropertyDatatableProps {
  data: PropertyItem[];
  onDelete?: (id: string, name: string) => void;
  pageSize?: number;
}

const PropertyDatatable = ({ data, onDelete, pageSize: initialPageSize = 10 }: PropertyDatatableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const columns: ColumnDef<PropertyItem>[] = useMemo(
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
        header: 'Property',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{row.getValue('name')}</span>
              <span className="text-muted-foreground text-sm">{row.original.address}</span>
            </div>
          </div>
        ),
        size: 360,
      },
      {
        header: 'Type',
        accessorKey: 'propertyType',
        cell: ({ row }) => {
          const type = row.getValue('propertyType') as PropertyType;
          return (
            <div className="flex items-center gap-2">
              {getPropertyTypeIcon(type)}
              <Badge className={cn('rounded-sm border-none capitalize', getPropertyTypeStyles(type))}>
                {type.replace('_', ' ')}
              </Badge>
            </div>
          );
        },
      },
      {
        header: 'Total Units',
        accessorKey: 'totalUnitsCount',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.getValue('totalUnitsCount')}</span>
        ),
      },
      {
        header: 'Occupied',
        accessorKey: 'occupiedUnits',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.occupiedUnits || 0}</span>
        ),
      },
      {
        header: 'Occupancy',
        accessorKey: 'occupancyRate',
        cell: ({ row }) => {
          const rate = (row.getValue('occupancyRate') as number) || 0;
          return (
            <div className="flex flex-col items-center gap-1">
              <Badge className={cn('rounded-sm border-none', getOccupancyStyles(rate))}>
                {rate.toFixed(1)}%
              </Badge>
              <Progress value={rate} className="h-1.5 w-16" />
            </div>
          );
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const status = row.original.status;
          const isActive = status === 'ACTIVE';
          return (
            <Badge
              className={cn(
                'rounded-sm border-none capitalize',
                isActive
                  ? 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {status.toLowerCase()}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View property" asChild>
                  <Link href={`/properties/${row.original.id}`}>
                    <EyeIcon className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Edit property" asChild>
                  <Link href={`/properties/${row.original.id}/edit`}>
                    <PencilIcon className="size-4.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete property"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete?.(row.original.id, row.original.name)}
                >
                  <Trash2Icon className="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
            <RowActions propertyId={row.original.id} propertyName={row.original.name} onDelete={onDelete} />
          </div>
        ),
        enableHiding: false,
      },
    ],
    [onDelete]
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
              <Filter column={table.getColumn('propertyType')!} label="Type" />
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
                    <Building2 className="size-8 text-muted-foreground/50" />
                    <span>No properties found.</span>
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
          of <span>{table.getRowCount().toString()} properties</span>
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

export default PropertyDatatable;

function Filter({ column, label }: { column: Column<PropertyItem, unknown>; label: string }) {
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
    if (value === 'RESIDENTIAL') return 'Residential';
    if (value === 'COMMERCIAL') return 'Commercial';
    if (value === 'MIXED_USE') return 'Mixed Use';
    if (value === 'ACTIVE') return 'Active';
    if (value === 'INACTIVE') return 'Inactive';
    return value;
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
  propertyId,
  propertyName,
  onDelete,
}: {
  propertyId: string;
  propertyName: string;
  onDelete?: (id: string, name: string) => void;
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
            <Link href={`/properties/${propertyId}`}>View Details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/properties/${propertyId}/edit`}>Edit Property</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/properties/${propertyId}/units`}>Manage Units</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete?.(propertyId, propertyName)}
          >
            Delete Property
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
