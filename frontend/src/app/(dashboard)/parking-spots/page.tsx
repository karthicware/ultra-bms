 
'use client';

/**
 * Parking Spot List Page
 * Story 3.8: Parking Spot Inventory Management
 * AC#1, AC#2, AC#3, AC#4: Table with columns, status badges, search, filters, pagination, sorting
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Car,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useParkingSpots, useParkingSpotCounts } from '@/hooks/useParkingSpots';
import { getProperties } from '@/services/properties.service';
import type { ParkingSpot, ParkingSpotStatus } from '@/types/parking';
import type { Property } from '@/types/properties';
import {
  PARKING_SPOT_STATUS_CONFIG,
  formatParkingFee,
  canDeleteParkingSpot,
  canChangeStatus,
  getAvailableStatusTransitions,
} from '@/types/parking';
import { ParkingSpotFormModal } from '@/components/parking/ParkingSpotFormModal';
import { ParkingSpotDeleteDialog } from '@/components/parking/ParkingSpotDeleteDialog';
import { ParkingSpotStatusChangeDialog } from '@/components/parking/ParkingSpotStatusChangeDialog';
import { BulkActionsBar } from '@/components/parking/BulkActionsBar';

/**
 * Parking Spot List Page Component
 */
export default function ParkingSpotListPage() {
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string>('spotNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spotToDelete, setSpotToDelete] = useState<ParkingSpot | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [spotToChangeStatus, setSpotToChangeStatus] = useState<ParkingSpot | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Properties for filter dropdown
  const [properties, setProperties] = useState<Property[]>([]);

  // Build filters object for query
  const filters = useMemo(() => ({
    propertyId: propertyFilter !== 'all' ? propertyFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter as ParkingSpotStatus : undefined,
    search: searchTerm || undefined,
    page: currentPage,
    size: pageSize,
    sort: `${sortField},${sortDirection}`,
  }), [propertyFilter, statusFilter, searchTerm, currentPage, pageSize, sortField, sortDirection]);

  // Fetch parking spots
  const {
    data: parkingSpotData,
    isLoading,
    refetch: refetchSpots,
  } = useParkingSpots(filters);

  // Fetch parking spot counts
  const { data: counts } = useParkingSpotCounts(
    propertyFilter !== 'all' ? propertyFilter : undefined
  );

  // Debounced search (300ms)
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(0);
    }, 300),
    []
  );

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getProperties({ size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setProperties([]);
      }
    };
    fetchProperties();
  }, []);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
    setIsAllSelected(false);
  }, [propertyFilter, statusFilter, searchTerm, currentPage]);

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Handlers
  const handleCreateParkingSpot = () => {
    setEditingSpot(null);
    setFormModalOpen(true);
  };

  const handleEditParkingSpot = (spot: ParkingSpot) => {
    setEditingSpot(spot);
    setFormModalOpen(true);
  };

  const handleDeleteParkingSpot = (spot: ParkingSpot) => {
    setSpotToDelete(spot);
    setDeleteDialogOpen(true);
  };

  const handleChangeStatus = (spot: ParkingSpot) => {
    setSpotToChangeStatus(spot);
    setStatusDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setEditingSpot(null);
    refetchSpots();
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setSpotToDelete(null);
    refetchSpots();
  };

  const handleStatusChangeSuccess = () => {
    setStatusDialogOpen(false);
    setSpotToChangeStatus(null);
    refetchSpots();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(0);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && parkingSpotData?.content) {
      setSelectedIds(new Set(parkingSpotData.content.map(spot => spot.id)));
      setIsAllSelected(true);
    } else {
      setSelectedIds(new Set());
      setIsAllSelected(false);
    }
  }, [parkingSpotData?.content]);

  const handleSelectOne = useCallback((spotId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(spotId);
      } else {
        newSet.delete(spotId);
      }
      return newSet;
    });
    setIsAllSelected(false);
  }, []);

  const handleBulkActionComplete = () => {
    setSelectedIds(new Set());
    setIsAllSelected(false);
    refetchSpots();
  };

  // Get property name by ID
  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Unknown';
  };

  const parkingSpots = parkingSpotData?.content || [];
  const totalPages = parkingSpotData?.totalPages || 0;
  const totalElements = parkingSpotData?.totalElements || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Parking Spots</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Parking Spots</h1>
            <p className="text-muted-foreground">
              Manage parking spot inventory and allocations
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateParkingSpot}
          data-testid="btn-create-parking-spot"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Parking Spot
        </Button>
      </div>

      {/* Summary Stats */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {(counts.AVAILABLE || 0) + (counts.ASSIGNED || 0) + (counts.UNDER_MAINTENANCE || 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Spots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{counts.AVAILABLE || 0}</div>
              <p className="text-sm text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{counts.ASSIGNED || 0}</div>
              <p className="text-sm text-muted-foreground">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{counts.UNDER_MAINTENANCE || 0}</div>
              <p className="text-sm text-muted-foreground">Under Maintenance</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by spot number or tenant..."
                defaultValue={searchTerm}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-parking-spot"
              />
            </div>

            {/* Property Filter */}
            <Select value={propertyFilter} onValueChange={(value) => {
              setPropertyFilter(value);
              setCurrentPage(0);
            }}>
              <SelectTrigger data-testid="select-filter-property">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(0);
            }}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>

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
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {parkingSpots.length} of {totalElements} parking spots
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSpots()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          selectedSpots={parkingSpots.filter(s => selectedIds.has(s.id))}
          onActionComplete={handleBulkActionComplete}
          onClearSelection={() => {
            setSelectedIds(new Set());
            setIsAllSelected(false);
          }}
        />
      )}

      {/* Parking Spots Table */}
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
          ) : parkingSpots.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No parking spots found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || propertyFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first parking spot'}
              </p>
              {!searchTerm && propertyFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={handleCreateParkingSpot} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Parking Spot
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-parking-spots">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected || (selectedIds.size > 0 && selectedIds.size === parkingSpots.length)}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('spotNumber')}
                        className="h-8 p-0 hover:bg-transparent"
                        data-testid="btn-sort-spot-number"
                      >
                        Spot Number
                        {getSortIcon('spotNumber')}
                      </Button>
                    </TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('defaultFee')}
                        className="h-8 p-0 hover:bg-transparent"
                        data-testid="btn-sort-fee"
                      >
                        Monthly Fee
                        {getSortIcon('defaultFee')}
                      </Button>
                    </TableHead>
                    <TableHead>Assigned Tenant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parkingSpots.map((spot) => {
                    const statusConfig = PARKING_SPOT_STATUS_CONFIG[spot.status];
                    const canDelete = canDeleteParkingSpot(spot);
                    const canStatus = canChangeStatus(spot);
                    const availableTransitions = getAvailableStatusTransitions(spot.status);

                    return (
                      <TableRow
                        key={spot.id}
                        className="hover:bg-muted/50"
                        data-testid="parking-spot-row"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(spot.id)}
                            onCheckedChange={(checked) => handleSelectOne(spot.id, checked as boolean)}
                            aria-label={`Select ${spot.spotNumber}`}
                            data-testid={`checkbox-select-${spot.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {spot.spotNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {spot.propertyName || getPropertyName(spot.propertyId)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig.className}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatParkingFee(spot.defaultFee)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {spot.assignedTenantName || (spot.assignedTenantId ? 'Unknown Tenant' : '-')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`btn-actions-${spot.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditParkingSpot(spot)}
                                data-testid={`btn-edit-${spot.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {canStatus && availableTransitions.length > 0 && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeStatus(spot)}
                                  data-testid={`btn-status-${spot.id}`}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Change Status
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteParkingSpot(spot)}
                                disabled={!canDelete}
                                className="text-destructive focus:text-destructive"
                                data-testid={`btn-delete-${spot.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create/Edit Modal */}
      <ParkingSpotFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        parkingSpot={editingSpot}
        onSuccess={handleFormSuccess}
        properties={properties}
      />

      {/* Delete Confirmation Dialog */}
      {spotToDelete && (
        <ParkingSpotDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          parkingSpot={spotToDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Status Change Dialog */}
      {spotToChangeStatus && (
        <ParkingSpotStatusChangeDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          parkingSpot={spotToChangeStatus}
          onSuccess={handleStatusChangeSuccess}
        />
      )}
    </div>
  );
}
