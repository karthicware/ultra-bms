 
'use client';

/**
 * Property Detail Page
 * Displays property details with tabs for units, tenants, and history
 * AC: #1, #12 - Property detail page with comprehensive information
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getValidImageSrc, isExternalImage } from '@/lib/utils/image-url';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getPropertyById, getPropertyImages } from '@/services/properties.service';
import { getUnitsByProperty } from '@/services/units.service';
import type { PropertyResponse, PropertyType, PropertyImage } from '@/types/properties';
import type { Unit } from '@/types/units';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
import { UnitFormModal } from '@/components/properties/UnitFormModal';
import { UnitGrid } from '@/components/properties/UnitGrid';
import { UnitList } from '@/components/properties/UnitList';
import {
  Building2,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Ruler,
  User,
  Home,
  Users,
  History,
  ImageIcon,
  LayoutGrid,
  List,
} from 'lucide-react';

/**
 * Get occupancy badge color
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

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const propertyId = params.id as string;

  // State
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('units');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // Fetch property details and images
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoading(true);
        const [propertyData, imagesData] = await Promise.all([
          getPropertyById(propertyId),
          getPropertyImages(propertyId),
        ]);
        setProperty(propertyData);
        setImages(imagesData);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load property details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyData();
    }
  }, [propertyId, refetchTrigger]); // Removed toast from dependencies

  // Fetch units when property loads
  useEffect(() => {
    const fetchUnits = async () => {
      if (!propertyId) return;
      try {
        setUnitsLoading(true);
        const unitsData = await getUnitsByProperty(propertyId);
        // Handle both array and paginated response formats
        const unitsArray = Array.isArray(unitsData)
          ? unitsData
          : (unitsData as unknown as { content?: Unit[]; units?: Unit[] })?.content ||
            (unitsData as unknown as { content?: Unit[]; units?: Unit[] })?.units ||
            [];
        setUnits(unitsArray);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load units.',
          variant: 'destructive',
        });
        setUnits([]);
      } finally {
        setUnitsLoading(false);
      }
    };

    fetchUnits();
  }, [propertyId, refetchTrigger]);

  const refetchProperty = () => setRefetchTrigger((prev) => prev + 1);

  // Unit handlers
  const handleViewUnit = (unitId: string) => {
    router.push(`/units/${unitId}`);
  };

  const handleEditUnit = (unitId: string) => {
    router.push(`/units/${unitId}/edit`);
  };

  const handleDeleteUnit = () => {
    // Refresh the units list after deletion
    setRefetchTrigger((prev) => prev + 1);
  };

  // Handlers
  const handleEdit = () => {
    router.push(`/properties/${propertyId}/edit`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Redirect to properties list after successful deletion
    router.push('/properties');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6" data-testid="property-detail-page">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Property not found</h3>
        <p className="text-muted-foreground mb-4">
          The property you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push('/properties')}>
          Back to Properties
        </Button>
      </div>
    );
  }

  const occupancyRate = property.occupancyRate || 0;
  const occupiedUnits = property.unitCounts?.occupied || 0;
  const totalUnits = property.totalUnitsCount || 0;
  const availableUnits = property.unitCounts?.available || (totalUnits - occupiedUnits);

  return (
    <div className="container mx-auto space-y-6" data-testid="property-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{property.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={PROPERTY_TYPE_COLORS[property.propertyType]}
            >
              {property.propertyType.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {property.status || 'ACTIVE'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="break-words">{property.address}</span>
            </span>
            {property.yearBuilt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 shrink-0" />
                Built {property.yearBuilt}
              </span>
            )}
            {property.totalSquareFootage && (
              <span className="flex items-center gap-1">
                <Ruler className="h-4 w-4 shrink-0" />
                {property.totalSquareFootage.toLocaleString()} sq ft
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleEdit} variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            data-testid="btn-delete-property"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Stats Row - Responsive Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="property-info-cards"
      >
        {/* Total Units */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-2xl font-bold">{totalUnits}</div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
              <span className="text-xs text-green-600 dark:text-green-400">{availableUnits} available</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
              <span className="text-xs text-red-600 dark:text-red-400">{occupiedUnits} occupied</span>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
              <Badge variant="outline" className={getOccupancyColor(occupancyRate)}>
                {occupancyRate >= 90 ? 'High' : occupancyRate >= 70 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <Progress value={occupancyRate} className="h-2" />
          </CardContent>
        </Card>

        {/* Unit Status */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unit Status</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 dark:text-yellow-400">Maintenance</span>
                <span className="font-medium">{property.unitCounts?.underMaintenance || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 dark:text-blue-400">Reserved</span>
                <span className="font-medium">{property.unitCounts?.reserved || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Manager */}
        <Card className="flex flex-col" data-testid="card-manager-info">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Property Manager</CardTitle>
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="flex-1">
            {property.manager ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={property.manager.avatar} />
                  <AvatarFallback>
                    {property.manager.firstName?.[0]}
                    {property.manager.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {property.manager.firstName} {property.manager.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {property.manager.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/properties/${propertyId}/edit`)}
                  data-testid="btn-assign-manager"
                >
                  Assign Manager
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Amenities - Compact inline display */}
      {property.amenities && property.amenities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Amenities:</span>
          {property.amenities.map((amenity, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
        </div>
      )}

      {/* Main Content: Images + Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Sidebar - Images (1 column on large screens) */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0" />
                Photos {images.length > 0 && `(${images.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {images && images.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-2 gap-2">
                  {images.slice(0, 4).map((image, index) => (
                    <div
                      key={image.id || index}
                      className="relative aspect-square bg-muted rounded-md overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <Image
                        src={getValidImageSrc(image.filePath)}
                        alt={image.fileName || `Property image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 10vw"
                        unoptimized={isExternalImage(getValidImageSrc(image.filePath))}
                      />
                      {index === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">+{images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">No images</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Tabs (4 columns on large screens) */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
            data-testid="tabs-property"
          >
            <TabsList>
              <TabsTrigger value="units">
                <Home className="h-4 w-4 mr-2" />
                Units
              </TabsTrigger>
              <TabsTrigger value="tenants">
                <Users className="h-4 w-4 mr-2" />
                Tenants
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Units Tab */}
            <TabsContent value="units" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Units ({units.length})</h3>
                  {/* View Toggle */}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <UnitFormModal propertyId={propertyId} onSuccess={refetchProperty} />
              </div>

              {unitsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-40" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : units.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <Home className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No units found</p>
                    <p className="text-sm mt-2">Add units to this property using the button above</p>
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
                <UnitGrid
                  units={units}
                  onViewUnit={handleViewUnit}
                  onEditUnit={handleEditUnit}
                  onDeleteUnit={handleDeleteUnit}
                />
              ) : (
                <UnitList
                  units={units}
                  selectedUnits={selectedUnits}
                  onSelectionChange={setSelectedUnits}
                  onViewUnit={handleViewUnit}
                  onEditUnit={handleEditUnit}
                  onDeleteUnit={handleDeleteUnit}
                />
              )}
            </TabsContent>

            {/* Tenants Tab */}
            <TabsContent value="tenants">
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Tenants list will be available after Epic 3 completion</p>
                  <p className="text-sm mt-2">
                    Shows all tenants currently living in this property
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Property history will be available in future updates</p>
                  <p className="text-sm mt-2">
                    Timeline of property changes and events
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {property && (
        <PropertyDeleteDialog
          propertyId={property.id}
          propertyName={property.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
