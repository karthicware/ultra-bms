'use client';

/**
 * Parking Spot Management Page - Complete Redesign
 * Story 3.8: Parking Spot Inventory Management
 *
 * Features:
 * - Modern card-based grid layout
 * - Visual KPI dashboard with progress indicators
 * - Tab-based status filtering
 * - Enhanced property selection experience
 * - Improved empty states and quick actions
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Car,
  MoreVertical,
  Building2,
  CheckCircle2,
  User2,
  Wrench,
  ChevronRight,
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  RefreshCw,
  LayoutGrid,
  List,
  Filter,
  X,
  AlertCircle,
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
  ParkingSpotStatus as ParkingStatus,
} from '@/types/parking';
import { ParkingSpotFormModal } from '@/components/parking/ParkingSpotFormModal';
import { ParkingSpotDeleteDialog } from '@/components/parking/ParkingSpotDeleteDialog';
import { ParkingSpotStatusChangeDialog } from '@/components/parking/ParkingSpotStatusChangeDialog';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

/**
 * Parking Spot Management Page
 */
export default function ParkingSpotListPage() {
  // Property selection state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [sortField, setSortField] = useState<string>('spotNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spotToDelete, setSpotToDelete] = useState<ParkingSpot | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [spotToChangeStatus, setSpotToChangeStatus] = useState<ParkingSpot | null>(null);

  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  // Get selected property details
  const selectedProperty = useMemo(() =>
    properties.find(p => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  );

  // Build filters for query
  const filters = useMemo(() => ({
    propertyId: selectedPropertyId || undefined,
    status: statusFilter !== 'all' ? statusFilter as ParkingSpotStatus : undefined,
    search: searchTerm || undefined,
    page: currentPage,
    size: pageSize,
    sort: `${sortField},${sortDirection}`,
  }), [selectedPropertyId, statusFilter, searchTerm, currentPage, pageSize, sortField, sortDirection]);

  // Fetch parking spots when property is selected
  const {
    data: parkingSpotData,
    isLoading,
    refetch: refetchSpots,
  } = useParkingSpots(filters, !!selectedPropertyId);

  // Fetch parking spot counts
  const { data: counts, refetch: refetchCounts } = useParkingSpotCounts(
    selectedPropertyId || undefined,
    !!selectedPropertyId
  );

  // Debounced search
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

  // Reset state when property changes
  useEffect(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(0);
  }, [selectedPropertyId]);

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
    refetchCounts();
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setSpotToDelete(null);
    refetchSpots();
    refetchCounts();
  };

  const handleStatusChangeSuccess = () => {
    setStatusDialogOpen(false);
    setSpotToChangeStatus(null);
    refetchSpots();
    refetchCounts();
  };

  const parkingSpots = parkingSpotData?.content || [];
  const totalElements = parkingSpotData?.totalElements || 0;

  // Calculate occupancy rate
  const occupancyRate = counts && counts.total > 0
    ? Math.round((counts.assigned / counts.total) * 100)
    : 0;

  // Status icon helper
  const getStatusIcon = (status: ParkingSpotStatus) => {
    switch (status) {
      case ParkingStatus.AVAILABLE:
        return <CheckCircle2 className="h-4 w-4" />;
      case ParkingStatus.ASSIGNED:
        return <User2 className="h-4 w-4" />;
      case ParkingStatus.UNDER_MAINTENANCE:
        return <Wrench className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  // Status color helper
  const getStatusColors = (status: ParkingSpotStatus) => {
    switch (status) {
      case ParkingStatus.AVAILABLE:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-700 dark:text-emerald-400',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
        };
      case ParkingStatus.ASSIGNED:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-400',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        };
      case ParkingStatus.UNDER_MAINTENANCE:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-400',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/30',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border shadow-sm">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Car className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Parking Management</h1>
                      <p className="text-muted-foreground">
                        Manage parking inventory, allocations, and maintenance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Property Selector */}
                  <Select
                    value={selectedPropertyId}
                    onValueChange={setSelectedPropertyId}
                    disabled={propertiesLoading}
                  >
                    <SelectTrigger className="w-full sm:w-[280px] h-11 bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <SelectValue placeholder={propertiesLoading ? "Loading..." : "Select property"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {property.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleCreateParkingSpot}
                    disabled={!selectedPropertyId}
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-5 w-5" />
                    Add Spot
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* No Property Selected State */}
          {!selectedPropertyId ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-2">Select a Property</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Choose a property from the dropdown above to view and manage its parking inventory.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>{properties.length} properties available</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Property Context Bar */}
              {selectedProperty && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedProperty.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Parking Spots</span>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPropertyId('')}
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Change Property
                    </Button>
                  </div>
                </div>
              )}

              {/* KPI Dashboard */}
              {counts && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Spots */}
                  <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Spots
                      </CardTitle>
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{counts.total}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Parking inventory
                      </p>
                    </CardContent>
                  </Card>

                  {/* Available */}
                  <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Available
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600">{counts.available}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ready for allocation
                      </p>
                    </CardContent>
                  </Card>

                  {/* Assigned */}
                  <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Assigned
                      </CardTitle>
                      <User2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{counts.assigned}</div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className="font-medium">{occupancyRate}%</span>
                        </div>
                        <Progress value={occupancyRate} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Under Maintenance */}
                  <Card className="relative overflow-hidden border-amber-200 dark:border-amber-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-8 translate-x-8" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Maintenance
                      </CardTitle>
                      <Wrench className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-amber-600">{counts.underMaintenance}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Temporarily unavailable
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filters & Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Status Tabs */}
                    <Tabs
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value);
                        setCurrentPage(0);
                      }}
                      className="w-full lg:w-auto"
                    >
                      <TabsList className="grid w-full lg:w-auto grid-cols-4 h-10">
                        <TabsTrigger value="all" className="gap-1.5 px-4">
                          <Filter className="h-3.5 w-3.5" />
                          All
                        </TabsTrigger>
                        <TabsTrigger value="AVAILABLE" className="gap-1.5 px-4">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Available
                        </TabsTrigger>
                        <TabsTrigger value="ASSIGNED" className="gap-1.5 px-4">
                          <User2 className="h-3.5 w-3.5" />
                          Assigned
                        </TabsTrigger>
                        <TabsTrigger value="UNDER_MAINTENANCE" className="gap-1.5 px-4">
                          <Wrench className="h-3.5 w-3.5" />
                          Maintenance
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search spots..."
                          defaultValue={searchTerm}
                          onChange={(e) => debouncedSearch(e.target.value)}
                          className="pl-9 h-10"
                        />
                      </div>

                      {/* View Toggle */}
                      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="h-8 px-3"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="h-8 px-3"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Area */}
              {isLoading ? (
                <div className={cn(
                  "grid gap-4",
                  viewMode === 'grid'
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                )}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className={viewMode === 'grid' ? "h-48" : "h-20"} />
                  ))}
                </div>
              ) : parkingSpots.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No parking spots found</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters to find what you\'re looking for.'
                        : `Get started by adding parking spots to ${selectedProperty?.name}.`}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Button onClick={handleCreateParkingSpot} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add First Spot
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {totalElements} parking spots
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        refetchSpots();
                        refetchCounts();
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  {/* Grid View */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {parkingSpots.map((spot) => {
                        const colors = getStatusColors(spot.status);
                        const canDelete = canDeleteParkingSpot(spot);
                        const canStatus = canChangeStatus(spot);
                        const availableTransitions = getAvailableStatusTransitions(spot.status);

                        return (
                          <Card
                            key={spot.id}
                            className={cn(
                              "relative group transition-all hover:shadow-md",
                              colors.border
                            )}
                          >
                            {/* Actions Menu */}
                            <div className="absolute top-3 right-3 z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditParkingSpot(spot)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {canStatus && availableTransitions.length > 0 && (
                                    <DropdownMenuItem onClick={() => handleChangeStatus(spot)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Change Status
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteParkingSpot(spot)}
                                    disabled={!canDelete}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <CardContent className="pt-4 pb-4 px-4">
                              {/* Status Badge & Icon */}
                              <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg mb-4",
                                colors.bg
                              )}>
                                <span className={colors.text}>
                                  {getStatusIcon(spot.status)}
                                </span>
                                <Badge variant="secondary" className={colors.badge}>
                                  {PARKING_SPOT_STATUS_CONFIG[spot.status].label}
                                </Badge>
                              </div>

                              {/* Spot Number */}
                              <div className="flex items-center gap-2 mb-3">
                                <Car className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xl font-bold">{spot.spotNumber}</span>
                              </div>

                              {/* Details */}
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground flex items-center gap-1.5">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    Monthly Fee
                                  </span>
                                  <span className="font-medium">{formatParkingFee(spot.defaultFee)}</span>
                                </div>

                                {spot.assignedTenantName && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                      <User2 className="h-3.5 w-3.5" />
                                      Tenant
                                    </span>
                                    <span className="font-medium truncate max-w-[120px]">
                                      {spot.assignedTenantName}
                                    </span>
                                  </div>
                                )}

                                {spot.assignedAt && (
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3" />
                                      Since
                                    </span>
                                    <span>
                                      {new Date(spot.assignedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Notes indicator */}
                              {spot.notes && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="truncate">{spot.notes}</span>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{spot.notes}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-2">
                      {parkingSpots.map((spot) => {
                        const colors = getStatusColors(spot.status);
                        const canDelete = canDeleteParkingSpot(spot);
                        const canStatus = canChangeStatus(spot);
                        const availableTransitions = getAvailableStatusTransitions(spot.status);

                        return (
                          <Card
                            key={spot.id}
                            className="transition-all hover:shadow-sm"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {/* Status Icon */}
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  colors.bg
                                )}>
                                  <span className={colors.text}>
                                    {getStatusIcon(spot.status)}
                                  </span>
                                </div>

                                {/* Spot Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">{spot.spotNumber}</span>
                                    <Badge variant="secondary" className={cn("text-xs", colors.badge)}>
                                      {PARKING_SPOT_STATUS_CONFIG[spot.status].label}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{formatParkingFee(spot.defaultFee)}</span>
                                    {spot.assignedTenantName && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{spot.assignedTenantName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditParkingSpot(spot)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {canStatus && availableTransitions.length > 0 && (
                                        <DropdownMenuItem onClick={() => handleChangeStatus(spot)}>
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Change Status
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteParkingSpot(spot)}
                                        disabled={!canDelete}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Modals */}
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
    </TooltipProvider>
  );
}
