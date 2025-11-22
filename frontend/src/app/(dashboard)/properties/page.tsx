'use client';

/**
 * Property List Page
 * Displays all properties with filters, search, and pagination
 * AC: #1, #10 - Property list with search, filters, and occupancy display
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { getProperties } from '@/services/properties.service';
import type { Property, PropertyType } from '@/types/properties';
import { getPropertyManagers, type PropertyManager } from '@/services/users.service';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
import { Plus, Search, Eye, Pencil, Trash2, Building2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Get occupancy badge color based on percentage
 * Green: ≥90%, Yellow: 70-89%, Red: <70%
 */
const getOccupancyColor = (occupancyRate: number): string => {
  if (occupancyRate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (occupancyRate >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
};

/**
 * Get property type badge color
 */
const PROPERTY_TYPE_COLORS: Record<PropertyType, string> = {
  RESIDENTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  COMMERCIAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  MIXED_USE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export default function PropertiesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [occupancyMin, setOccupancyMin] = useState<string>('');
  const [occupancyMax, setOccupancyMax] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [managers, setManagers] = useState<PropertyManager[]>([]);

  // Fetch property managers on mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await getPropertyManagers();
        setManagers(response.content);
      } catch (error) {
        console.error('Failed to load property managers:', error);
      }
    };
    fetchManagers();
  }, []);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getProperties({
        page: currentPage,
        size: pageSize,
        search: searchTerm || undefined,
        types: propertyTypeFilter !== 'all' ? [propertyTypeFilter as PropertyType] : undefined,
        managerId: managerFilter !== 'all' ? (managerFilter === 'unassigned' ? undefined : managerFilter) : undefined,
        occupancyMin: occupancyMin ? parseFloat(occupancyMin) : undefined,
        occupancyMax: occupancyMax ? parseFloat(occupancyMax) : undefined,
        sort: sortField,
        direction: sortDirection,
      });

      setProperties(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load properties. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, propertyTypeFilter, managerFilter, occupancyMin, occupancyMax, sortField, sortDirection, toast]);

  // Debounced search (300ms as per Story 3.1 pattern)
  const debouncedFetchProperties = useMemo(
    () => debounce(fetchProperties, 300),
    [fetchProperties]
  );

  useEffect(() => {
    debouncedFetchProperties();
    return () => debouncedFetchProperties.cancel();
  }, [debouncedFetchProperties]);

  // Handlers
  const handleCreateProperty = () => {
    router.push('/properties/create');
  };

  const handleViewProperty = (id: string) => {
    router.push(`/properties/${id}`);
  };

  const handleEditProperty = (id: string) => {
    router.push(`/properties/${id}/edit`);
  };

  const handleDeleteProperty = (id: string, name: string) => {
    setPropertyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Refresh the property list after successful deletion
    fetchProperties();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(0); // Reset to first page
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-4 w-4 ml-1" /> :
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">
              Manage properties and track occupancy rates
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateProperty}
          data-testid="btn-create-property"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Property
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-property"
              />
            </div>

            {/* Property Type Filter */}
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger data-testid="select-filter-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="MIXED_USE">Mixed Use</SelectItem>
              </SelectContent>
            </Select>

            {/* Property Manager Filter */}
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger data-testid="select-filter-manager">
                <SelectValue placeholder="All Managers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Occupancy Range Min */}
            <Input
              type="number"
              placeholder="Min Occupancy %"
              value={occupancyMin}
              onChange={(e) => setOccupancyMin(e.target.value)}
              min="0"
              max="100"
              data-testid="input-occupancy-min"
            />

            {/* Occupancy Range Max */}
            <Input
              type="number"
              placeholder="Max Occupancy %"
              value={occupancyMax}
              onChange={(e) => setOccupancyMax(e.target.value)}
              min="0"
              max="100"
              data-testid="input-occupancy-max"
            />

            {/* Page Size Selector */}
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger data-testid="select-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {properties.length} of {totalElements} properties
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : properties.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || propertyTypeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first property'}
              </p>
              {!searchTerm && propertyTypeFilter === 'all' && (
                <Button onClick={handleCreateProperty} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Property
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-properties">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 p-0 hover:bg-transparent"
                      data-testid="btn-sort-name"
                    >
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalUnitsCount')}
                      className="h-8 p-0 hover:bg-transparent"
                      data-testid="sort-total-units"
                    >
                      Total Units
                      {getSortIcon('totalUnitsCount')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Occupied</TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('occupancyRate')}
                      className="h-8 p-0 hover:bg-transparent"
                      data-testid="btn-sort-occupancy"
                    >
                      Occupancy
                      {getSortIcon('occupancyRate')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => {
                  const occupancyRate = property.occupancyRate || 0;
                  const occupiedUnits = property.occupiedUnits || 0;
                  const totalUnits = property.totalUnitsCount || 0;

                  return (
                    <TableRow key={property.id} className="hover:bg-muted/50" data-testid="property-row">
                      <TableCell className="font-medium">
                        {property.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {property.address}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={PROPERTY_TYPE_COLORS[property.propertyType]}
                        >
                          {property.propertyType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {totalUnits}
                      </TableCell>
                      <TableCell className="text-center">
                        {occupiedUnits}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 cursor-help">
                                <Badge
                                  variant="outline"
                                  className={getOccupancyColor(occupancyRate)}
                                  data-testid={`badge-occupancy-${property.id}`}
                                >
                                  {occupancyRate.toFixed(1)}%
                                </Badge>
                                <Progress
                                  value={occupancyRate}
                                  className="w-16 h-2"
                                  data-testid={`progress-occupancy-${property.id}`}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{occupiedUnits} of {totalUnits} units occupied</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProperty(property.id)}
                            data-testid={`btn-view-property-${property.id}`}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProperty(property.id)}
                            data-testid={`btn-edit-property-${property.id}`}
                            title="Edit Property"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProperty(property.id, property.name)}
                            data-testid={`btn-delete-property-${property.id}`}
                            title="Delete Property"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              data-testid="btn-prev-page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              data-testid="btn-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {propertyToDelete && (
        <PropertyDeleteDialog
          propertyId={propertyToDelete.id}
          propertyName={propertyToDelete.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
