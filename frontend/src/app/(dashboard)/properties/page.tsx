'use client';

/**
 * Property List Page
 * Displays all properties with filters, search, and grid view
 * AC: #1, #10 - Property list with search, filters, and occupancy display
 * Updated: Grid-only view with advanced filters and status indicators
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getProperties } from '@/services/properties.service';
import { Property, PropertyType, PropertyStatus } from '@/types/properties';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
import {
  Plus,
  Search,
  Building2,
  Building,
  Home,
  Store,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ImageIcon // Added for potential image placeholder in grid
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image'; // Import Image for proper image handling
import { getValidImageSrc, isExternalImage } from '@/lib/utils/image-url';


export default function PropertiesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch all properties
  const fetchProperties = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsFiltering(true);
      }
      // Prepare params
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page: 0,
        size: 1000, // Load all for client-side filtering if needed, but API supports params
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

  // Debounced fetch for filter changes (300ms as per Story 3.1 pattern)
  const debouncedFetchProperties = useMemo(
    () => debounce(() => fetchProperties(false), 300),
    [fetchProperties]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      // Initial load - show skeleton
      isFirstRender.current = false;
      fetchProperties(true);
    } else {
      // Filter changes - smooth update without skeleton
      debouncedFetchProperties();
    }
    return () => debouncedFetchProperties.cancel();
  }, [searchTerm, statusFilter, typeFilter, debouncedFetchProperties, fetchProperties]);

  // Handlers
  const handleCreateProperty = () => {
    router.push('/properties/create');
  };

  const handleDeleteProperty = (id: string, name: string) => {
    setPropertyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Refresh the property list after successful deletion
    fetchProperties();
  };

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Calculate quick stats
  const stats = useMemo(() => {
    const total = properties.length;
    const residential = properties.filter(p => p.propertyType === PropertyType.RESIDENTIAL).length;
    const commercial = properties.filter(p => p.propertyType === PropertyType.COMMERCIAL).length;
    const mixed = properties.filter(p => p.propertyType === PropertyType.MIXED_USE).length;
    // Simple average occupancy (if available in data)
    const avgOccupancy = total > 0
      ? (properties.reduce((acc, curr) => acc + (curr.occupancyRate || 0), 0) / total).toFixed(1)
      : '0.0';

    return { total, residential, commercial, mixed, avgOccupancy };
  }, [properties]);

  // Helper for status badge color
  const getStatusColor = (status: PropertyStatus) => {
    return status === PropertyStatus.ACTIVE
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 hover:bg-green-100'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 hover:bg-gray-100';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Properties
          </h1>
          <p className="text-muted-foreground">
            Manage your real estate portfolio and monitor performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateProperty}
            data-testid="btn-create-property"
            className="gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Property
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isInitialLoading ? <Skeleton className="h-8 w-12" /> : stats.total}</div>
            <div className="text-xs text-muted-foreground">
              {isInitialLoading ? <Skeleton className="h-3 w-24 mt-1" /> : 'Active in portfolio'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residential</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isInitialLoading ? <Skeleton className="h-8 w-12" /> : stats.residential}</div>
            <div className="text-xs text-muted-foreground">
              {isInitialLoading ? <Skeleton className="h-3 w-24 mt-1" /> : 'Properties'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commercial</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isInitialLoading ? <Skeleton className="h-8 w-12" /> : stats.commercial}</div>
            <p className="text-xs text-muted-foreground">
              {stats.mixed > 0 ? `+ ${stats.mixed} Mixed Use` : 'Properties'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Occupancy</CardTitle>
            <div className="h-4 w-4 text-muted-foreground font-bold">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isInitialLoading ? <Skeleton className="h-8 w-12" /> : `${stats.avgOccupancy}%`}</div>
            <p className="text-xs text-muted-foreground">
              Across portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Filters and Search Section */}
        <div className="space-y-4">
          <Separator />
          <h3 className="text-xl font-semibold">Filters</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 bg-background"
                data-testid="input-search-property"
              />
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={PropertyType.RESIDENTIAL}>Residential</SelectItem>
                  <SelectItem value={PropertyType.COMMERCIAL}>Commercial</SelectItem>
                  <SelectItem value={PropertyType.MIXED_USE}>Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={PropertyStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={PropertyStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Area - Grid Only */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
               <Skeleton key={i} className="h-[280px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isFiltering ? 'opacity-60' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {properties.map((property) => (
               <Card
                  key={property.id}
                  className="overflow-hidden hover:shadow-md transition-all group flex flex-col relative"
                >
                  {/* Card Header / Image Area */}
                  <div className="h-40 bg-muted relative group-hover:opacity-95 transition-opacity cursor-pointer" onClick={() => router.push(`/properties/${property.id}`)}>
                     {/* Property Image or Placeholder */}
                     {property.images && property.images.length > 0 ? (
                        <Image
                           src={getValidImageSrc(property.images[0].filePath)}
                           alt={property.name}
                           fill
                           className="object-cover"
                           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                           unoptimized={isExternalImage(getValidImageSrc(property.images[0].filePath))}
                        />
                     ) : property.thumbnailUrl ? (
                        <Image
                           src={getValidImageSrc(property.thumbnailUrl)}
                           alt={property.name}
                           fill
                           className="object-cover"
                           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                           unoptimized={isExternalImage(getValidImageSrc(property.thumbnailUrl))}
                        />
                     ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                           <ImageIcon className="h-16 w-16" />
                        </div>
                     )}

                     {/* Status Badge - Top Left */}
                     <div className="absolute top-2 left-2 z-[1]">
                        <Badge variant="secondary" className={`${getStatusColor(property.status)} shadow-sm`}>
                          {property.status}
                        </Badge>
                     </div>

                     {/* Occupancy - Bottom Right */}
                     <div className="absolute bottom-2 right-2 z-[1] bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold shadow-sm">
                        {property.occupancyRate?.toFixed(0)}% Occupied
                     </div>
                  </div>

                  {/* Action Menu - Top Right (Absolute, over image) */}
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/properties/${property.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Property
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProperty(property.id, property.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col gap-3 cursor-pointer" onClick={() => router.push(`/properties/${property.id}`)}>
                     <div>
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-semibold truncate" title={property.name}>{property.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 h-10" title={property.address}>
                           {property.address}
                        </p>
                     </div>

                     <div className="mt-auto pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                           <Building className="h-3 w-3" />
                           <span>{property.totalUnitsCount} Units</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                           <span className="capitalize bg-muted px-1.5 py-0.5 rounded">{property.propertyType.toLowerCase().replace('_', ' ')}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))}
             {properties.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                   No properties found matching your criteria.
                </div>
             )}
          </div>
          </div>
        )}
      </div>

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