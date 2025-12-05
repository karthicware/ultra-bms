 
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
import { Card, CardContent } from '@/components/ui/card';
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
  Square,
  CheckCircle,
  User,
  Wrench,
  Calendar
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
    setSelectedIds(new Set());
    setIsAllSelected(false);
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(0);
  }, [selectedPropertyId]);

  // Clear selection when other filters change
  useEffect(() => {
    setSelectedIds(new Set());
    setIsAllSelected(false);
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

  // Date for header
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="container mx-auto space-y-8 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Parking Management</h1>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
            <span className="text-border">|</span>
            <span>Manage parking spot inventory and allocations</span>
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

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            disabled={propertiesLoading}
          >
            <SelectTrigger
              className="w-full md:w-[300px] bg-background"
              data-testid="select-property"
            >
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={propertiesLoading ? "Loading properties..." : "Select a property"} />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {/* Show content only when property is selected */}
      {!selectedPropertyId ? (
        /* No Property Selected - Show placeholder */
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Car className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select a Property</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Please select a property from the dropdown above to view and manage its parking inventory.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          {counts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Square className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Spots</p>
                    <h3 className="text-2xl font-bold">{counts.total || 0}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Available</p>
                    <h3 className="text-2xl font-bold text-green-600">{counts.available || 0}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Assigned</p>
                    <h3 className="text-2xl font-bold text-blue-600">{counts.assigned || 0}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Wrench className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Maintenance</p>
                    <h3 className="text-2xl font-bold text-yellow-600">{counts.underMaintenance || 0}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Card */}
          <Card className="shadow-sm">
            <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by spot number or tenant..."
                  defaultValue={searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-parking-spot"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
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
                    <SelectItem value="UNDER_MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger data-testid="select-page-size" className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : parkingSpots.length === 0 ? (
              <div className="p-12 text-center">
                <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No parking spots found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : `No parking spots configured for ${selectedProperty?.name}.`}
                </p>
              </div>
            ) : (
              <>
                <Table data-testid="table-parking-spots">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[50px] pl-6">
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
                          className="h-8 p-0 hover:bg-transparent font-semibold"
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
                          className="h-8 p-0 hover:bg-transparent font-semibold"
                          data-testid="btn-sort-fee"
                        >
                          Monthly Fee
                          {getSortIcon('defaultFee')}
                        </Button>
                      </TableHead>
                      <TableHead>Assigned Tenant</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
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
                          className="hover:bg-muted/50 transition-colors"
                          data-testid="parking-spot-row"
                        >
                          <TableCell className="pl-6">
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
                          <TableCell className="text-muted-foreground text-sm">
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
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
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
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
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

                {/* Pagination */}
                <div className="border-t p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-muted-foreground text-sm whitespace-nowrap">
                      Showing {parkingSpots.length} of {totalElements} spots
                    </p>

                    {totalPages > 1 && (
                      <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => currentPage > 0 && handlePageChange(currentPage - 1)}
                              className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* Modals remain the same */}
      <ParkingSpotFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        parkingSpot={editingSpot}
        onSuccess={handleFormSuccess}
        properties={properties}
        defaultPropertyId={selectedPropertyId}
      />

      {spotToDelete && (
        <ParkingSpotDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          parkingSpot={spotToDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}

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
