/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit Grid View Component
 * Displays units as cards in a responsive grid with color-coded status
 * AC: #5 - Unit grid view with status colors and filters
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Unit, UnitStatus } from '@/types/units';
import { UnitDeleteDialog } from './UnitDeleteDialog';
import { Eye, Pencil, Trash2, Home, DoorOpen, Bed, Bath, Ruler } from 'lucide-react';

interface UnitGridProps {
  units: Unit[];
  onViewUnit?: (unitId: string) => void;
  onEditUnit?: (unitId: string) => void;
  onDeleteUnit?: (unitId: string) => void;
  onStatusChange?: (unitId: string) => void;
}

/**
 * Get status background color for unit cards
 */
const getStatusColor = (status: UnitStatus): string => {
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

export function UnitGrid({ units, onViewUnit, onEditUnit, onDeleteUnit, onStatusChange }: UnitGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorMin, setFloorMin] = useState<string>('');
  const [floorMax, setFloorMax] = useState<string>('');
  const [bedroomFilter, setBedroomFilter] = useState<string>('all');
  const [rentMin, setRentMin] = useState<string>('');
  const [rentMax, setRentMax] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; unitNumber: string } | null>(null);

  // Filter units
  const filteredUnits = units.filter((unit) => {
    // Search filter
    if (searchTerm && !unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && unit.status !== statusFilter) {
      return false;
    }

    // Floor filter
    if (floorMin && unit.floor !== undefined && unit.floor < parseInt(floorMin)) {
      return false;
    }
    if (floorMax && unit.floor !== undefined && unit.floor > parseInt(floorMax)) {
      return false;
    }

    // Bedroom filter
    if (bedroomFilter !== 'all') {
      const bedrooms = unit.bedroomCount;
      switch (bedroomFilter) {
        case 'studio':
          if (bedrooms !== 0) return false;
          break;
        case '1':
          if (bedrooms !== 1) return false;
          break;
        case '2':
          if (bedrooms !== 2) return false;
          break;
        case '3+':
          if (bedrooms < 3) return false;
          break;
      }
    }

    // Rent filter
    if (rentMin && unit.monthlyRent < parseFloat(rentMin)) {
      return false;
    }
    if (rentMax && unit.monthlyRent > parseFloat(rentMax)) {
      return false;
    }

    return true;
  });

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
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search Unit Number</Label>
              <Input
                placeholder="Search by unit number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-units"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedroom Filter */}
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
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

            {/* Floor Range */}
            <div className="space-y-2">
              <Label>Floor Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={floorMin}
                  onChange={(e) => setFloorMin(e.target.value)}
                  data-testid="input-floor-min"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={floorMax}
                  onChange={(e) => setFloorMax(e.target.value)}
                  data-testid="input-floor-max"
                />
              </div>
            </div>

            {/* Rent Range */}
            <div className="space-y-2">
              <Label>Monthly Rent (AED)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={rentMin}
                  onChange={(e) => setRentMin(e.target.value)}
                  data-testid="input-rent-min"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={rentMax}
                  onChange={(e) => setRentMax(e.target.value)}
                  data-testid="input-rent-max"
                />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredUnits.length} of {units.length} units
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {filteredUnits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No units found</h3>
            <p className="text-muted-foreground">
              {units.length === 0
                ? 'No units have been added to this property yet'
                : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-testid="grid-units"
        >
          {filteredUnits.map((unit) => (
            <Card
              key={unit.id}
              className={`${getStatusColor(unit.status)} border-2 hover:shadow-lg transition-shadow`}
              data-testid={`card-unit-${unit.unitNumber}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl font-bold">
                    {unit.unitNumber}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeColor(unit.status)}
                  >
                    {unit.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Floor {unit.floor}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <p className="text-xl font-bold">
                    {formatCurrency(unit.monthlyRent)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewUnit?.(unit.id)}
                    data-testid={`btn-view-unit-${unit.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditUnit?.(unit.id)}
                    data-testid={`btn-edit-unit-${unit.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange?.(unit.id)}
                    data-testid={`btn-status-unit-${unit.id}`}
                  >
                    <DoorOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(unit.id, unit.unitNumber)}
                    data-testid={`btn-delete-unit-${unit.id}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
