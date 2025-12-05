'use client';

/**
 * Property List Page - Complete Redesign
 * Displays all properties with modern UI, filters, and grid view
 *
 * Features:
 * - Modern hero header with gradient styling
 * - Enhanced KPI dashboard with visual progress indicators
 * - Improved property cards with hover effects
 * - Tab-based type filtering
 * - Grid/List view toggle
 * - Better empty states and loading UI
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { getProperties } from '@/services/properties.service';
import { Property, PropertyType, PropertyStatus } from '@/types/properties';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
import { getValidImageSrc, isExternalImage } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Building2,
  Building,
  Home,
  Store,
  MoreVertical,
  Pencil,
  Trash2,
  ImageIcon,
  MapPin,
  Users,
  TrendingUp,
  LayoutGrid,
  List,
  Filter,
  ChevronRight,
  Sparkles,
  Eye,
  ExternalLink,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

export default function PropertiesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Fetch all properties
  const fetchProperties = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsFiltering(true);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page: 0,
        size: 1000,
        search: searchTerm || undefined,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter as PropertyStatus;
      }

      if (typeFilter !== 'all') {
        params.types = [typeFilter as PropertyType];
      }

      const response = await getProperties(params);
      setProperties(response.content || []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load properties. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
      setIsFiltering(false);
    }
  }, [searchTerm, statusFilter, typeFilter, toast]);

  // Initial load
  const isFirstRender = useRef(true);

  // Debounced fetch for filter changes
  const debouncedFetchProperties = useMemo(
    () => debounce(() => fetchProperties(false), 300),
    [fetchProperties]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchProperties(true);
    } else {
      debouncedFetchProperties();
    }
    return () => debouncedFetchProperties.cancel();
  }, [searchTerm, statusFilter, typeFilter, debouncedFetchProperties, fetchProperties]);

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Handlers
  const handleCreateProperty = () => {
    router.push('/properties/create');
  };

  const handleDeleteProperty = (id: string, name: string) => {
    setPropertyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchProperties();
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = properties.length;
    const residential = properties.filter(p => p.propertyType === PropertyType.RESIDENTIAL).length;
    const commercial = properties.filter(p => p.propertyType === PropertyType.COMMERCIAL).length;
    const mixed = properties.filter(p => p.propertyType === PropertyType.MIXED_USE).length;
    const active = properties.filter(p => p.status === PropertyStatus.ACTIVE).length;
    const totalUnits = properties.reduce((acc, curr) => acc + (curr.totalUnitsCount || 0), 0);
    const occupiedUnits = properties.reduce((acc, curr) => acc + (curr.occupiedUnits || 0), 0);
    const avgOccupancy = total > 0
      ? properties.reduce((acc, curr) => acc + (curr.occupancyRate || 0), 0) / total
      : 0;

    return { total, residential, commercial, mixed, active, totalUnits, occupiedUnits, avgOccupancy };
  }, [properties]);

  // Property type icon helper
  const getTypeIcon = (type: PropertyType) => {
    switch (type) {
      case PropertyType.RESIDENTIAL:
        return <Home className="h-4 w-4" />;
      case PropertyType.COMMERCIAL:
        return <Store className="h-4 w-4" />;
      case PropertyType.MIXED_USE:
        return <Layers className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  // Status styling helper
  const getStatusStyles = (status: PropertyStatus) => {
    if (status === PropertyStatus.ACTIVE) {
      return {
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    }
    return {
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
      dot: 'bg-gray-400',
    };
  };

  // Occupancy color helper
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
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
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
                      <p className="text-muted-foreground">
                        Manage your real estate portfolio and monitor performance
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateProperty}
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="h-5 w-5" />
                  Add Property
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Properties */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Properties
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400">
                        {stats.active} Active
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Units */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Units
                </CardTitle>
                <Layers className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-blue-600">{stats.totalUnits}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.occupiedUnits} occupied
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Average Occupancy */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Occupancy
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className={cn("text-3xl font-bold", getOccupancyColor(stats.avgOccupancy))}>
                      {stats.avgOccupancy.toFixed(1)}%
                    </div>
                    <div className="mt-2">
                      <Progress value={stats.avgOccupancy} className="h-1.5" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Property Types */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  By Type
                </CardTitle>
                <Activity className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {isInitialLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30">
                          <Home className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-600">{stats.residential}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Residential</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30">
                          <Store className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-600">{stats.commercial}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Commercial</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30">
                          <Layers className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-600">{stats.mixed}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Mixed Use</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filters & Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Type Tabs */}
                <Tabs
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full lg:w-auto grid-cols-4 h-10">
                    <TabsTrigger value="all" className="gap-1.5 px-4">
                      <Filter className="h-3.5 w-3.5" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value={PropertyType.RESIDENTIAL} className="gap-1.5 px-4">
                      <Home className="h-3.5 w-3.5" />
                      Residential
                    </TabsTrigger>
                    <TabsTrigger value={PropertyType.COMMERCIAL} className="gap-1.5 px-4">
                      <Store className="h-3.5 w-3.5" />
                      Commercial
                    </TabsTrigger>
                    <TabsTrigger value={PropertyType.MIXED_USE} className="gap-1.5 px-4">
                      <Layers className="h-3.5 w-3.5" />
                      Mixed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search properties..."
                      defaultValue={searchTerm}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={PropertyStatus.ACTIVE}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value={PropertyStatus.INACTIVE}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          Inactive
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

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

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isInitialLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} found`
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchProperties()}
              className="gap-2"
              disabled={isFiltering}
            >
              <RefreshCw className={cn("h-4 w-4", isFiltering && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Content Area */}
          {isInitialLoading ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid'
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-72" : "h-24"} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-2">No Properties Found</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by adding your first property to the portfolio."}
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button onClick={handleCreateProperty} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Property
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "transition-opacity duration-200",
              isFiltering ? "opacity-60" : "opacity-100"
            )}>
              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {properties.map((property) => {
                    const statusStyles = getStatusStyles(property.status);
                    const occupancyRate = property.occupancyRate || 0;

                    return (
                      <Card
                        key={property.id}
                        className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                        onClick={() => router.push(`/properties/${property.id}`)}
                      >
                        {/* Image Area */}
                        <div className="relative h-44 bg-muted overflow-hidden">
                          {property.images && property.images.length > 0 ? (
                            <Image
                              src={getValidImageSrc(property.images[0].filePath)}
                              alt={property.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              unoptimized={isExternalImage(getValidImageSrc(property.images[0].filePath))}
                            />
                          ) : property.thumbnailUrl ? (
                            <Image
                              src={getValidImageSrc(property.thumbnailUrl)}
                              alt={property.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              unoptimized={isExternalImage(getValidImageSrc(property.thumbnailUrl))}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <ImageIcon className="h-16 w-16 text-muted-foreground/20" />
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn("shadow-sm", statusStyles.badge)}>
                              <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5", statusStyles.dot)} />
                              {property.status}
                            </Badge>
                          </div>

                          {/* Type Badge */}
                          <div className="absolute top-3 right-12">
                            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-sm">
                              {getTypeIcon(property.propertyType)}
                            </Badge>
                          </div>

                          {/* Actions Menu */}
                          <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}/edit`)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProperty(property.id, property.name)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Occupancy Indicator */}
                          <div className="absolute bottom-3 right-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm shadow-sm">
                              <div className={cn("h-2 w-2 rounded-full", {
                                "bg-emerald-500": occupancyRate >= 90,
                                "bg-blue-500": occupancyRate >= 70 && occupancyRate < 90,
                                "bg-amber-500": occupancyRate >= 50 && occupancyRate < 70,
                                "bg-red-500": occupancyRate < 50,
                              })} />
                              <span className="text-xs font-semibold">{occupancyRate.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold text-lg truncate mb-1" title={property.name}>
                            {property.name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-start gap-1.5 mb-4 line-clamp-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {property.address}
                          </p>

                          <div className="mt-auto pt-3 border-t flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Building className="h-4 w-4" />
                              <span>{property.totalUnitsCount} Units</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{property.occupiedUnits || 0} Occupied</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {properties.map((property) => {
                    const statusStyles = getStatusStyles(property.status);
                    const occupancyRate = property.occupancyRate || 0;

                    return (
                      <Card
                        key={property.id}
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/properties/${property.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Thumbnail */}
                            <div className="relative h-20 w-28 rounded-lg overflow-hidden bg-muted shrink-0">
                              {property.images && property.images.length > 0 ? (
                                <Image
                                  src={getValidImageSrc(property.images[0].filePath)}
                                  alt={property.name}
                                  fill
                                  className="object-cover"
                                  sizes="112px"
                                  unoptimized={isExternalImage(getValidImageSrc(property.images[0].filePath))}
                                />
                              ) : property.thumbnailUrl ? (
                                <Image
                                  src={getValidImageSrc(property.thumbnailUrl)}
                                  alt={property.name}
                                  fill
                                  className="object-cover"
                                  sizes="112px"
                                  unoptimized={isExternalImage(getValidImageSrc(property.thumbnailUrl))}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{property.name}</h3>
                                <Badge variant="secondary" className={cn("text-xs shrink-0", statusStyles.badge)}>
                                  {property.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mb-2">
                                {property.address}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {getTypeIcon(property.propertyType)}
                                  {property.propertyType.replace('_', ' ')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building className="h-3.5 w-3.5" />
                                  {property.totalUnitsCount} Units
                                </span>
                                <span className={cn("flex items-center gap-1 font-medium", getOccupancyColor(occupancyRate))}>
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {occupancyRate.toFixed(0)}% Occupied
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/properties/${property.id}/edit`)}
                                className="h-9 w-9"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProperty(property.id, property.name)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
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
            </div>
          )}
        </div>

        {/* Delete Dialog */}
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
    </TooltipProvider>
  );
}
