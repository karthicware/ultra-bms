 
'use client';

/**
 * Parking Spot List Page
 * Story 3.8: Parking Spot Inventory Management
 * AC#1, AC#2, AC#3, AC#4: Table with columns, status badges, search, filters, pagination, sorting
 *
 * Updated: Property selection is now required before showing parking spots data.
 * Data is filtered by property to ensure visibility control.
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Building2,
  Info,
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
 * Requires property selection before showing parking spots data
 */
export default function ParkingSpotListPage() {
  // Property selection is required - empty string means no selection
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Filter and search state (only used after property is selected)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
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

  // Properties for dropdown
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  // Get selected property details
  const selectedProperty = useMemo(() =>
    properties.find(p => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  );

  // Build filters object for query - only when property is selected
  const filters = useMemo(() => ({
    propertyId: selectedPropertyId || undefined,
    status: statusFilter !== 'all' ? statusFilter as ParkingSpotStatus : undefined,
    search: searchTerm || undefined,
    page: currentPage,
    size: pageSize,
    sort: `${sortField},${sortDirection}`,
  }), [selectedPropertyId, statusFilter, searchTerm, currentPage, pageSize, sortField, sortDirection]);

  // Only fetch parking spots when a property is selected
  const {
    data: parkingSpotData,
    isLoading,
    refetch: refetchSpots,
  } = useParkingSpots(filters, !!selectedPropertyId);

  // Fetch parking spot counts for selected property (only when property is selected)
  const { data: counts, refetch: refetchCounts } = useParkingSpotCounts(
    selectedPropertyId || undefined,
    !!selectedPropertyId
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
      setPropertiesLoading(true);
      try {
        const response = await getProperties({ size: 100 });
        setProperties(response.content || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setProperties([]);
      } finally {
        setPropertiesLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Clear selection and reset filters when property changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedIds(new Set());
    setIsAllSelected(false);
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedPropertyId]);

  // Clear selection when other filters change
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedIds(new Set());
    setIsAllSelected(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [statusFilter, searchTerm, currentPage]);

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
    // Refresh both the list and counts for immediate UI update
    refetchSpots();
    refetchCounts();
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setSpotToDelete(null);
    // Refresh both the list and counts for immediate UI update
    refetchSpots();
    refetchCounts();
  };

  const handleStatusChangeSuccess = () => {
    setStatusDialogOpen(false);
    setSpotToChangeStatus(null);
    // Refresh both the list and counts for immediate UI update
    refetchSpots();
    refetchCounts();
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
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
    // Refresh both the list and counts for immediate UI update
    refetchSpots();
    refetchCounts();
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
    <div className="container mx-auto space-y-6">
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
          disabled={!selectedPropertyId}
        >
          <Plus className="h-4 w-4" />
          Add Parking Spot
        </Button>
      </div>

      {/* Property Selection Card - Always visible at top */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Select Property
          </CardTitle>
          <CardDescription>
            Choose a property to view and manage its parking spots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            disabled={propertiesLoading}
          >
            <SelectTrigger
              className="w-full md:w-[400px]"
              data-testid="select-property"
            >
              <SelectValue placeholder={propertiesLoading ? "Loading properties..." : "Select a property"} />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{property.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Show content only when property is selected */}
      {!selectedPropertyId ? (
        /* No Property Selected - Show placeholder */
        <Card className="py-12">
          <CardContent className="text-center">
            <Car className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select a Property</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please select a property above to view and manage its parking spots.
              Each property's parking inventory is managed separately.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats - Only show when property is selected */}
          {counts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {counts.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Spots</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{counts.available || 0}</div>
                  <p className="text-sm text-muted-foreground">Available</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{counts.assigned || 0}</div>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{counts.underMaintenance || 0}</div>
                  <p className="text-sm text-muted-foreground">Under Maintenance</p>
                </CardContent>
              </Card>
            </div>
          )}

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

      {/* Unified Datatable Card */}
      <Card className="py-0">
        {/* Filters Section - Search and Status filter only (property is selected above) */}
        <div className="border-b">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">
                {selectedProperty?.name} - Parking Spots
              </span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by spot number or tenant..."
                  defaultValue={searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-parking-spot"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(0);
              }}>
                <SelectTrigger data-testid="select-filter-status" className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>

              {/* Page Size Selector - Right aligned */}
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger data-testid="select-page-size" className="w-full md:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="border-b">
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
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : `No parking spots configured for ${selectedProperty?.name || 'this property'}`}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleCreateParkingSpot} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Parking Spot
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-parking-spots">
                <TableHeader className="bg-muted/50">
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
        </div>

        {/* Pagination Section */}
        {!isLoading && parkingSpots.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col">
            <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
              Showing {parkingSpots.length} of {totalElements} parking spots
            </p>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                      className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      data-testid="btn-prev-page"
                    />
                  </PaginationItem>

                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(0)} className="cursor-pointer">1</PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                    </>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(page => Math.abs(page - currentPage) <= 2)
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {currentPage < totalPages - 3 && (
                    <>
                      {currentPage < totalPages - 4 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(totalPages - 1)} className="cursor-pointer">{totalPages}</PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages - 1 && handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      data-testid="btn-next-page"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </Card>
        </>
      )}

      {/* Create/Edit Modal */}
      <ParkingSpotFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        parkingSpot={editingSpot}
        onSuccess={handleFormSuccess}
        properties={properties}
        defaultPropertyId={selectedPropertyId}
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
