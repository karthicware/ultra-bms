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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getPropertyById, getPropertyImages } from '@/services/properties.service';
import { getUnitsByProperty } from '@/services/units.service';
import { getTenantsByProperty } from '@/services/tenant.service';
import type { TenantResponse } from '@/types/tenant';
import TenantsDatatable from '@/components/tenants/TenantsDatatable';
import type { PropertyResponse, PropertyType, PropertyImage } from '@/types/properties';
import type { Unit } from '@/types/units';
import { PropertyDeleteDialog } from '@/components/properties/PropertyDeleteDialog';
import { UnitFormModal } from '@/components/properties/UnitFormModal';
import { UnitDataTable } from '@/components/properties/UnitDataTable';
import { PageBackButton } from '@/components/common/PageBackButton';
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
  ArrowLeft,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Building,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/**
 * Get occupancy badge color
 */
const getOccupancyColor = (occupancyRate: number): string => {
  if (occupancyRate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
  if (occupancyRate >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800';
};

/**
 * Get property type badge color
 */
const getPropertyTypeBadge = (type: PropertyType) => {
  const colors: Record<PropertyType, string> = {
    RESIDENTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    COMMERCIAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    MIXED_USE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  };
  
  const icons: Record<PropertyType, React.ReactNode> = {
    RESIDENTIAL: <Home className="h-3 w-3 mr-1" />,
    COMMERCIAL: <Building2 className="h-3 w-3 mr-1" />,
    MIXED_USE: <Building className="h-3 w-3 mr-1" />,
  };

  return (
    <Badge variant="outline" className={`${colors[type]} flex items-center`}>
      {icons[type]}
      {type.replace('_', ' ')}
    </Badge>
  );
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

  // Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // Tenants state
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

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
      } catch (error) {
        console.error("Error fetching property data:", error);
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
  }, [propertyId, refetchTrigger, toast]);

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
      } catch (error) {
        console.error("Error fetching units:", error);
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
  }, [propertyId, refetchTrigger, toast]);

  // Fetch tenants when property loads
  useEffect(() => {
    const fetchTenants = async () => {
      if (!propertyId) return;
      try {
        setTenantsLoading(true);
        const tenantsData = await getTenantsByProperty(propertyId);
        setTenants(tenantsData);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        toast({
          title: 'Error',
          description: 'Failed to load tenants.',
          variant: 'destructive',
        });
        setTenants([]);
      } finally {
        setTenantsLoading(false);
      }
    };

    fetchTenants();
  }, [propertyId, refetchTrigger, toast]);

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
  
  const handleBack = () => {
    router.push('/properties');
  };

  // Gallery Handlers
  const openGallery = (index: number = 0) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'Escape') setGalleryOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center py-24">
        <div className="bg-muted/30 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Property Not Found</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The property you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => router.push('/properties')}>Back to Properties</Button>
      </div>
    );
  }

  const occupancyRate = property.occupancyRate || 0;
  const occupiedUnits = property.unitCounts?.occupied || 0;
  const totalUnits = property.totalUnitsCount || 0;
  const availableUnits = property.unitCounts?.available || (totalUnits - occupiedUnits);

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-6xl space-y-8" data-testid="property-detail-page">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageBackButton href="/properties" aria-label="Back to properties" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {property.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
               {getPropertyTypeBadge(property.propertyType)}
               <div className="text-sm text-muted-foreground flex items-center gap-1 ml-2">
                 <MapPin className="h-3.5 w-3.5" />
                 <span className="break-words max-w-[200px] sm:max-w-none truncate">{property.address}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="hidden sm:flex gap-2">
             <Button onClick={handleEdit} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Property
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="btn-delete-property"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
           </div>
           
           {/* Mobile Actions Menu */}
           <div className="sm:hidden">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="icon">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={handleEdit}>
                   <Pencil className="h-4 w-4 mr-2" /> Edit Property
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                   <Trash2 className="h-4 w-4 mr-2" /> Delete Property
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Sidebar - Key Info */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Summary Card */}
          <Card className="overflow-hidden border-t-4 border-t-primary/20 shadow-sm">
             {images && images.length > 0 ? (
                <div 
                  className="relative h-48 w-full bg-muted cursor-pointer group"
                  onClick={() => openGallery(0)}
                >
                  <Image
                    src={getValidImageSrc(images[0].filePath)}
                    alt={images[0].fileName || property.name}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-90"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={isExternalImage(getValidImageSrc(images[0].filePath))}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Button variant="secondary" size="sm" className="gap-2 pointer-events-none">
                      <Eye className="h-4 w-4" /> View All Photos
                    </Button>
                  </div>
                  {images.length > 1 && (
                     <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                       <ImageIcon className="h-3 w-3" />
                       <span>+{images.length - 1} more</span>
                     </div>
                  )}
                </div>
             ) : (
                <div className="h-32 bg-muted flex items-center justify-center border-b">
                   <Building2 className="h-12 w-12 text-muted-foreground/30" />
                </div>
             )}
             
            <CardContent className="pt-6 space-y-6">
              {/* Occupancy Status */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Occupancy</span>
                    <span className="text-sm font-bold">{occupancyRate.toFixed(1)}%</span>
                 </div>
                 <Progress value={occupancyRate} className="h-2" />
                 <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span className="flex items-center"><CheckCircle2 className="h-3 w-3 mr-1 text-green-500"/> {occupiedUnits} Occupied</span>
                    <span className="flex items-center"><AlertCircle className="h-3 w-3 mr-1 text-green-500"/> {availableUnits} Available</span>
                 </div>
              </div>

              <Separator />

              {/* Property Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Home className="h-3.5 w-3.5 mr-1.5" /> Total Units
                    </div>
                    <div className="text-xl font-medium pl-5">
                      {totalUnits}
                    </div>
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Ruler className="h-3.5 w-3.5 mr-1.5" /> Area
                    </div>
                    <div className="text-xl font-medium pl-5">
                      {property.totalSquareFootage ? property.totalSquareFootage.toLocaleString() : '-'} <span className="text-xs font-normal text-muted-foreground">sq ft</span>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" /> Built
                    </div>
                    <div className="text-xl font-medium pl-5">
                      {property.yearBuilt || '-'}
                    </div>
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Users className="h-3.5 w-3.5 mr-1.5" /> Tenants
                    </div>
                    <div className="text-xl font-medium pl-5">
                      {/* Placeholder for tenant count if not occupiedUnits */}
                      {occupiedUnits}
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Manager Card */}
          <Card data-testid="card-manager-info">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center">
                 <User className="h-4 w-4 mr-2 text-primary" /> Property Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.manager ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                  <Avatar className="h-10 w-10 shrink-0 border">
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
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-muted-foreground">No manager assigned</p>
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

          {/* Amenities List */}
          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs font-normal">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Content - Tabs & Details */}
        <div className="lg:col-span-8 space-y-6">
           <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
            data-testid="tabs-property"
          >
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-6">
              <TabsTrigger 
                value="units" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2"
              >
                <Home className="h-4 w-4 mr-2" />
                Units
                <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5 min-w-[20px] justify-center">{units.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="tenants"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2"
              >
                <Users className="h-4 w-4 mr-2" />
                Tenants
                <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5 min-w-[20px] justify-center">{tenants.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Units Tab */}
            <TabsContent value="units" className="space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="space-y-1">
                   <h3 className="text-lg font-medium">Unit Directory</h3>
                   <p className="text-sm text-muted-foreground">Manage all units within this property.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   {/* View Toggle */}
                  <div className="flex border rounded-md mr-2">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none h-9 w-9"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none h-9 w-9"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <UnitFormModal propertyId={propertyId} onSuccess={refetchProperty} />
                </div>
              </div>

              {unitsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : (
                <Card className="border-none shadow-none bg-transparent">
                   <CardContent className="p-0">
                      <UnitDataTable
                        units={units}
                        viewMode={viewMode}
                        selectedUnits={selectedUnits}
                        onSelectionChange={setSelectedUnits}
                        onViewUnit={handleViewUnit}
                        onEditUnit={handleEditUnit}
                        onDeleteUnit={handleDeleteUnit}
                      />
                   </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tenants Tab */}
            <TabsContent value="tenants" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Directory</CardTitle>
                  <CardDescription>Current residents and lease holders for this property.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {tenantsLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : tenants.length > 0 ? (
                    <TenantsDatatable data={tenants} pageSize={10} />
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                      <div className="bg-muted/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-8 w-8 opacity-50" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No Tenants</h3>
                      <p className="text-sm max-w-xs mx-auto">
                        There are currently no tenants associated with this property. Tenants will appear here once units are leased.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                   <CardTitle>Property History</CardTitle>
                   <CardDescription>Audit log of all property-related activities.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 text-center text-muted-foreground">
                   <div className="bg-muted/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                     <History className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No History Available</h3>
                  <p className="text-sm max-w-xs mx-auto">
                    Timeline of property changes, maintenance requests, and financial events will appear here.
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

      {/* Image Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black/95 border-none" onKeyDown={handleKeyDown}>
          <DialogTitle className="sr-only">Image Gallery</DialogTitle>
          <div className="relative w-full h-full flex flex-col">
            {/* Header / Close */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setGalleryOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Main Image */}
            <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
              {images.length > 0 && (
                <div className="relative w-full h-full max-w-7xl max-h-[85vh]">
                  <Image
                    src={getValidImageSrc(images[currentImageIndex].filePath)}
                    alt={`Property image ${currentImageIndex + 1}`}
                    fill
                    className="object-contain"
                    unoptimized={isExternalImage(getValidImageSrc(images[currentImageIndex].filePath))}
                    priority
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>

            {/* Footer / Thumbnails */}
            <div className="h-20 bg-black/50 backdrop-blur p-2 flex justify-center items-center gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    currentImageIndex === idx ? 'border-primary scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={getValidImageSrc(img.filePath)}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={isExternalImage(getValidImageSrc(img.filePath))}
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
