/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit List View Component
 * Displays units in a table with sortable columns and multi-select
 * AC: #5 - Unit list view with status badges and bulk actions
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Unit, UnitStatus } from '@/types/units';
import { UnitDeleteDialog } from './UnitDeleteDialog';
import { Eye, Pencil, Trash2, ArrowUpDown, DoorOpen } from 'lucide-react';

interface UnitListProps {
  units: Unit[];
  selectedUnits?: string[];
  onSelectionChange?: (unitIds: string[]) => void;
  onViewUnit?: (unitId: string) => void;
  onEditUnit?: (unitId: string) => void;
  onDeleteUnit?: (unitId: string) => void;
  onStatusChange?: (unitId: string) => void;
}

type SortField = 'unitNumber' | 'floor' | 'monthlyRent' | 'status';
type SortDirection = 'asc' | 'desc';

/**
 * Get status badge color
 */
const getStatusBadgeColor = (status: UnitStatus): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'OCCUPIED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'UNDER_MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'RESERVED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

export function UnitList({
  units,
  selectedUnits = [],
  onSelectionChange,
  onViewUnit,
  onEditUnit,
  onDeleteUnit,
  onStatusChange,
}: UnitListProps) {
  const [sortField, setSortField] = useState<SortField>('unitNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; unitNumber: string } | null>(null);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort units
  const sortedUnits = [...units].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    // Handle string comparison for unitNumber and status
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(units.map((u) => u.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  // Handle individual selection
  const handleSelectUnit = (unitId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedUnits, unitId]);
    } else {
      onSelectionChange?.(selectedUnits.filter((id) => id !== unitId));
    }
  };

  const allSelected = units.length > 0 && selectedUnits.length === units.length;
  const someSelected = selectedUnits.length > 0 && selectedUnits.length < units.length;

  // Handle delete with confirmation dialog
  const handleDelete = (unitId: string, unitNumber: string) => {
    setUnitToDelete({ id: unitId, unitNumber });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Call parent callback if provided
    if (onDeleteUnit && unitToDelete) {
      onDeleteUnit(unitToDelete.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {selectedUnits.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedUnits.length} unit{selectedUnits.length > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // This will be implemented in Task 13
              console.log('Bulk status update');
            }}
            data-testid="btn-bulk-status-update"
          >
            <DoorOpen className="h-4 w-4 mr-2" />
            Change Status
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table data-testid="table-units">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all units"
                  data-testid="checkbox-select-all"
                  className={someSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('unitNumber')}
                  className="hover:bg-transparent"
                >
                  Unit Number
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('floor')}
                  className="hover:bg-transparent"
                >
                  Floor
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bathrooms</TableHead>
              <TableHead>Sqft</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('monthlyRent')}
                  className="hover:bg-transparent"
                >
                  Rent
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="hover:bg-transparent"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No units found
                </TableCell>
              </TableRow>
            ) : (
              sortedUnits.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="hover:bg-muted/50"
                  data-testid={`row-unit-${unit.id}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={(checked) =>
                        handleSelectUnit(unit.id, checked as boolean)
                      }
                      aria-label={`Select unit ${unit.unitNumber}`}
                      data-testid={`checkbox-unit-${unit.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                  <TableCell>{unit.floor}</TableCell>
                  <TableCell>
                    {unit.bedroomCount === 0
                      ? 'Studio'
                      : `${unit.bedroomCount} BR`}
                  </TableCell>
                  <TableCell>{unit.bathroomCount}</TableCell>
                  <TableCell>
                    {unit.squareFootage
                      ? unit.squareFootage.toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>{formatCurrency(unit.monthlyRent)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeColor(unit.status)}
                    >
                      {unit.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewUnit?.(unit.id)}
                        data-testid={`btn-view-unit-${unit.id}`}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUnit?.(unit.id)}
                        data-testid={`btn-edit-unit-${unit.id}`}
                        title="Edit Unit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStatusChange?.(unit.id)}
                        data-testid={`btn-status-unit-${unit.id}`}
                        title="Change Status"
                      >
                        <DoorOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(unit.id, unit.unitNumber)}
                        data-testid={`btn-delete-unit-${unit.id}`}
                        title="Delete Unit"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
