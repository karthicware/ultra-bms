'use client';

/**
 * Property Detail Page
 * Displays property details with tabs for units, tenants, and history
 * AC: #1, #12 - Property detail page with comprehensive information
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getPropertyById } from '@/services/properties.service';
import type { PropertyResponse, PropertyType } from '@/types/properties';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
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
  Plus,
  ImageIcon,
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('units');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const property = await getPropertyById(propertyId);
        setProperty(property);
      } catch (error) {
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
      fetchProperty();
    }
  }, [propertyId, toast]);

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

  const handleAddUnit = () => {
    // TODO: Implement in Task 8 - Unit Form Modal
    toast({
      title: 'Not Implemented',
      description: 'Add Unit functionality will be implemented in Task 8',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" data-testid="property-detail-page">
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
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Property not found</h3>
          <p className="text-muted-foreground mb-4">
            The property you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/properties')}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const occupancyRate = property.occupancyRate || 0;
  const occupiedUnits = property.occupiedUnits || 0;
  const totalUnits = property.totalUnitsCount || 0;
  const availableUnits = totalUnits - occupiedUnits;

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="property-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/properties">Properties</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{property.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{property.address}</span>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            data-testid="btn-delete-property"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {property.images && property.images.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <Carousel className="w-full max-w-3xl mx-auto">
              <CarouselContent>
                {property.images.map((image, index) => (
                  <CarouselItem key={image.id || index}>
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={image.filePath}
                        alt={image.fileName || `Property image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No images available for this property</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        data-testid="property-info-cards"
      >
        {/* Total Units */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              units in property
            </p>
          </CardContent>
        </Card>

        {/* Occupied Units */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {availableUnits} available
            </p>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
              <Badge variant="outline" className={getOccupancyColor(occupancyRate)}>
                {occupancyRate >= 90 ? 'High' : occupancyRate >= 70 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <Progress value={occupancyRate} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Unit Status Breakdown */}
      {property.unitCounts && (
        <Card>
          <CardHeader>
            <CardTitle>Unit Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{property.unitCounts.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Available</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {property.unitCounts.available}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Occupied</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {property.unitCounts.occupied}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {property.unitCounts.underMaintenance}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Reserved</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {property.unitCounts.reserved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Assigned Manager */}
        <Card data-testid="card-manager-info">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Property Manager</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {property.manager ? (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/properties/${propertyId}/edit`)}
                  data-testid="btn-reassign-manager"
                >
                  Reassign Manager
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      {(property.yearBuilt || property.totalSquareFootage || property.amenities) && (
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {property.yearBuilt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Year Built</p>
                  <p className="text-sm text-muted-foreground">{property.yearBuilt}</p>
                </div>
              </div>
            )}
            {property.totalSquareFootage && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Area</p>
                  <p className="text-sm text-muted-foreground">
                    {property.totalSquareFootage.toLocaleString()} sq ft
                  </p>
                </div>
              </div>
            )}
            {property.amenities && property.amenities.length > 0 && (
              <div className="md:col-span-3">
                <p className="text-sm font-medium mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
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
            <h3 className="text-lg font-semibold">Units ({totalUnits})</h3>
            <Button onClick={handleAddUnit} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          </div>
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Home className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Unit grid/list view will be implemented in Tasks 10 & 11</p>
              <p className="text-sm mt-2">
                This will show unit cards and table with filters
              </p>
            </CardContent>
          </Card>
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
