/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit DataTable Component
 * Advanced datatable for units with filtering, sorting, pagination
 * Supports both grid and list view modes
 */

import { useId, useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Eye,
  Pencil,
  Trash2,
  DoorOpen,
  Home,
  Bed,
  Bath,
  Ruler,
  SearchIcon,
  MoreVertical,
} from 'lucide-react';

import { Separator } from '@/components/ui/separator';

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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePagination } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';
import type { Unit, UnitStatus } from '@/types/units';
import { UnitDeleteDialog } from './UnitDeleteDialog';

interface UnitDataTableProps {
  units: Unit[];
  viewMode: 'grid' | 'list';
  selectedUnits?: string[];
  onSelectionChange?: (unitIds: string[]) => void;
  onViewUnit?: (unitId: string) => void;
  onEditUnit?: (unitId: string) => void;
  onDeleteUnit?: (unitId: string) => void;
  onStatusChange?: (unitId: string) => void;
}

/**
 * Get status badge color
 */
const getStatusBadgeColor = (status: UnitStatus): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400';
    case 'OCCUPIED':
      return 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400';
    case 'UNDER_MAINTENANCE':
      return 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400';
    case 'RESERVED':
      return 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400';
    default:
      return 'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400';
  }
};

/**
 * Get status card background color for grid view
 */
const getStatusCardColor = (status: UnitStatus): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    case 'OCCUPIED':
      return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    case 'UNDER_MAINTENANCE':
      return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
    case 'RESERVED':
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    default:
      return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
  }
};

/**
 * Format currency to AED
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function UnitDataTable({
  units,
  viewMode,
  selectedUnits = [],
  onSelectionChange,
  onViewUnit,
  onEditUnit,
  onDeleteUnit,
  onStatusChange,
}: UnitDataTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; unitNumber: string } | null>(null);

  const pageSize = viewMode === 'grid' ? 12 : 10;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Define columns for the table
  const columns: ColumnDef<Unit>[] = useMemo(
    () => [
      {
        header: 'Unit',
        accessorKey: 'unitNumber',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.unitNumber}</span>
            <span className="text-muted-foreground text-xs">Floor {row.original.floor}</span>
          </div>
        ),
        size: 120,
      },
      {
        header: 'Type',
        accessorKey: 'bedroomCount',
        cell: ({ row }) => (
          <span>{row.original.bedroomCount === 0 ? 'Studio' : `${row.original.bedroomCount} BR`}</span>
        ),
        filterFn: (row, id, value) => {
          if (value === 'all') return true;
          if (value === 'studio') return row.original.bedroomCount === 0;
          if (value === '1') return row.original.bedroomCount === 1;
          if (value === '2') return row.original.bedroomCount === 2;
          if (value === '3+') return row.original.bedroomCount >= 3;
          return true;
        },
      },
      {
        header: 'Bathrooms',
        accessorKey: 'bathroomCount',
        cell: ({ row }) => <span>{row.original.bathroomCount}</span>,
      },
      {
        header: 'Sqft',
        accessorKey: 'squareFootage',
        cell: ({ row }) => (
          <span>{row.original.squareFootage ? row.original.squareFootage.toLocaleString() : '-'}</span>
        ),
      },
      {
        header: 'Rent',
        accessorKey: 'monthlyRent',
        cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.monthlyRent)}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge className={cn('rounded-sm border-none capitalize', getStatusBadgeColor(row.original.status))}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewUnit?.(row.original.id)}
                  aria-label="View unit"
                >
                  <Eye className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditUnit?.(row.original.id)}
                  aria-label="Edit unit"
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onStatusChange?.(row.original.id)}
                  aria-label="Change status"
                >
                  <DoorOpen className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change Status</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(row.original.id, row.original.unitNumber)}
                  aria-label="Delete unit"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        ),
        enableHiding: false,
      },
    ],
    [onViewUnit, onEditUnit, onStatusChange]
  );

  const table = useReactTable({
    data: units,
    columns,
    state: {
      columnFilters,
      pagination,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    globalFilterFn: (row, columnId, filterValue) => {
      const unitNumber = row.original.unitNumber.toLowerCase();
      return unitNumber.includes(filterValue.toLowerCase());
    },
  });

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 2,
  });

  const handleDelete = (unitId: string, unitNumber: string) => {
    setUnitToDelete({ id: unitId, unitNumber });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    if (onDeleteUnit && unitToDelete) {
      onDeleteUnit(unitToDelete.id);
    }
  };

  const filteredRows = table.getRowModel().rows;

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search Unit</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by unit number..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-units"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Filter column={table.getColumn('status')!} label="Status" />

            {/* Bedroom Filter */}
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Select
                value={(table.getColumn('bedroomCount')?.getFilterValue() as string) ?? 'all'}
                onValueChange={(value) => {
                  table.getColumn('bedroomCount')?.setFilterValue(value === 'all' ? undefined : value);
                }}
              >
                <SelectTrigger data-testid="select-bedroom-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="1">1 BR</SelectItem>
                  <SelectItem value="2">2 BR</SelectItem>
                  <SelectItem value="3+">3+ BR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground pb-2">
                Showing {filteredRows.length} of {units.length} units
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Content */}
      {filteredRows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No units found</h3>
            <p className="text-muted-foreground">
              {units.length === 0 ? 'No units have been added to this property yet' : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-units">
          {filteredRows.map((row) => {
            const unit = row.original;
            return (
              <Card
                key={unit.id}
                className={cn('border-2 hover:shadow-lg transition-shadow flex flex-col', getStatusCardColor(unit.status))}
                data-testid={`card-unit-${unit.unitNumber}`}
              >
                <CardHeader className="pb-3 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CardTitle className="text-2xl font-bold truncate">{unit.unitNumber}</CardTitle>
                      <Badge className={cn('rounded-sm border-none capitalize shrink-0', getStatusBadgeColor(unit.status))}>
                        {unit.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          data-testid={`btn-more-actions-unit-${unit.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewUnit?.(unit.id)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUnit?.(unit.id)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit Unit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(unit.id)}>
                          <DoorOpen className="h-4 w-4 mr-2" /> Change Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(unit.id, unit.unitNumber)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Unit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground px-4">Floor {unit.floor}</p>
                  <Separator className="mt-2" />
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4 px-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">Details</h4>
                  {/* Unit Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span>{unit.bedroomCount} Bed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{unit.bathroomCount} Bath</span>
                    </div>
                    {unit.squareFootage && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span>{unit.squareFootage.toLocaleString()} sq ft</span>
                      </div>
                    )}
                  </div>

                  {/* Rent */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                    <p className="text-xl font-bold">{formatCurrency(unit.monthlyRent)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List/Table View */
        <Card>
          <Table data-testid="table-units">
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
              {filteredRows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 first:pl-4 last:px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {filteredRows.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-2 py-4 max-sm:flex-col">
          <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
            Showing{' '}
            <span>
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                table.getRowCount()
              )}
            </span>{' '}
            of <span>{table.getRowCount()} units</span>
          </p>

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
                      className={cn(
                        !isActive &&
                          'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'
                      )}
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
      )}

      {/* Delete Confirmation Dialog */}
      {unitToDelete && (
        <UnitDeleteDialog
          unitId={unitToDelete.id}
          unitNumber={unitToDelete.unitNumber}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}

function Filter({ column, label }: { column: Column<any, unknown>; label: string }) {
  const id = useId();
  const columnFilterValue = column.getFilterValue();

  const facetedUniqueValues = column.getFacetedUniqueValues(); // Extracted
  const sortedUniqueValues = useMemo(() => {
    const values = Array.from(facetedUniqueValues.keys());
    return Array.from(new Set(values)).sort();
  }, [facetedUniqueValues]);

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-select`}>{label}</Label>
      <Select
        value={columnFilterValue?.toString() ?? 'all'}
        onValueChange={(value) => {
          column.setFilterValue(value === 'all' ? undefined : value);
        }}
      >
        <SelectTrigger id={`${id}-select`} className="w-full capitalize" data-testid={`select-${label.toLowerCase()}-filter`}>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {sortedUniqueValues.map((value) => (
            <SelectItem key={String(value)} value={String(value)} className="capitalize">
              {String(value).replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
