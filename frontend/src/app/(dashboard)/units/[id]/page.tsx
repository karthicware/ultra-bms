'use client';

/**
 * Unit Detail Page
 * Displays comprehensive unit information with tenant details and history
 * AC: #13 - Unit detail page with breadcrumb, info cards, tenant info, and history
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getUnitById, getUnitHistory } from '@/services/units.service';
import type { Unit, UnitHistory, UnitStatus } from '@/types/units';
import { UnitDeleteDialog } from '@/components/properties/UnitDeleteDialog';
import { UnitFormModal } from '@/components/properties/UnitFormModal';
import {
  Home,
  Pencil,
  Trash2,
  Bed,
  Bath,
  Ruler,
  DollarSign,
  Calendar,
  User,
  History as HistoryIcon,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Get status badge color
 */
const getStatusBadgeColor = (status: UnitStatus): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'OCCUPIED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'UNDER_MAINTENANCE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    case 'RESERVED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800';
  }
};

/**
 * Get status icon
 */
const getStatusIcon = (status: UnitStatus) => {
  switch (status) {
    case 'AVAILABLE':
      return <CheckCircle2 className="h-4 w-4 mr-1" />;
    case 'OCCUPIED':
      return <User className="h-4 w-4 mr-1" />;
    case 'UNDER_MAINTENANCE':
      return <AlertCircle className="h-4 w-4 mr-1" />;
    case 'RESERVED':
      return <Clock className="h-4 w-4 mr-1" />;
    default:
      return <Building2 className="h-4 w-4 mr-1" />;
  }
};

/**
 * Format currency to AED
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const unitId = params.id as string;

  // State
  const [unit, setUnit] = useState<Unit | null>(null);
  const [history, setHistory] = useState<UnitHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch unit details
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setIsLoading(true);
        const [unitData, historyData] = await Promise.all([
          getUnitById(unitId),
          getUnitHistory(unitId),
        ]);
        setUnit(unitData);
        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching unit:', error);
        toast({
          title: 'Error',
          description: 'Failed to load unit details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (unitId) {
      fetchUnit();
    }
  }, [unitId, refetchTrigger, toast]);

  // Handlers
  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Redirect to property detail page after successful deletion
    if (unit?.propertyId) {
      router.push(`/properties/${unit.propertyId}`);
    } else {
      router.push('/properties');
    }
  };

  const handleBack = () => {
    if (unit?.propertyId) {
      router.push(`/properties/${unit.propertyId}`);
    } else {
      router.back();
    }
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

  if (!unit) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center py-24">
        <div className="bg-muted/30 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <Home className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Unit Not Found</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The unit you're looking for doesn't exist or has been deleted. It might have been moved or removed from the property.
        </p>
        <Button onClick={() => router.push('/properties')}>Back to Properties</Button>
      </div>
    );
  }

  const rentPerSqft = unit.squareFootage
    ? unit.monthlyRent / unit.squareFootage
    : 0;

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-6xl space-y-8" data-testid="unit-detail-page">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Unit {unit.unitNumber}
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>Property Reference: {unit.propertyId.substring(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="hidden sm:flex gap-2">
             <Button onClick={handleEdit} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Unit
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                   <Pencil className="h-4 w-4 mr-2" /> Edit Unit
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                   <Trash2 className="h-4 w-4 mr-2" /> Delete Unit
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Sidebar - Key Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Status Card */}
          <Card className="overflow-hidden border-t-4 border-t-primary/20 shadow-sm">
            <CardHeader className="pb-2 space-y-1">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium text-muted-foreground">Monthly Rent</CardTitle>
                <Badge variant="outline" className={getStatusBadgeColor(unit.status)}>
                   {getStatusIcon(unit.status)}
                   {unit.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(unit.monthlyRent)}
              </div>
               {unit.squareFootage && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(rentPerSqft)} / sq ft
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Bed className="h-3.5 w-3.5 mr-1.5" /> Bedrooms
                    </div>
                    <div className="text-lg font-medium pl-5">
                      {unit.bedroomCount === 0 ? 'Studio' : unit.bedroomCount}
                    </div>
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Bath className="h-3.5 w-3.5 mr-1.5" /> Bathrooms
                    </div>
                    <div className="text-lg font-medium pl-5">
                      {unit.bathroomCount}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Ruler className="h-3.5 w-3.5 mr-1.5" /> Area
                    </div>
                    <div className="text-lg font-medium pl-5">
                      {unit.squareFootage ? unit.squareFootage.toLocaleString() : '-'} <span className="text-xs font-normal text-muted-foreground">sq ft</span>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <Building2 className="h-3.5 w-3.5 mr-1.5" /> Floor
                    </div>
                    <div className="text-lg font-medium pl-5">
                      {unit.floor}
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Summary (Moved to sidebar if short, but let's keep features here if it's a list) */}
          {unit.features && Object.keys(unit.features).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center">
                   Features & Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                   {Object.entries(unit.features).map(([key, value]) => (
                    <div key={key} className="flex items-center bg-muted/50 px-2.5 py-1.5 rounded-md text-sm">
                       <span className="font-medium capitalize mr-1.5">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                       <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Content - Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tenant Information */}
          <Card className={unit.status !== 'OCCUPIED' ? 'opacity-60 grayscale' : ''} data-testid="unit-tenant-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Current Tenant
                {unit.status !== 'OCCUPIED' && <Badge variant="secondary" className="ml-2">Vacant</Badge>}
              </CardTitle>
              {unit.status !== 'OCCUPIED' && (
                <CardDescription>
                  This unit is currently not occupied. No tenant information to display.
                </CardDescription>
              )}
            </CardHeader>
            {unit.status === 'OCCUPIED' && (
              <CardContent>
                <div className="bg-muted/20 rounded-lg border p-8 text-center">
                   <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground/50" />
                   </div>
                   <h3 className="text-lg font-medium mb-1">Tenant Data Unavailable</h3>
                   <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                     Full tenant profiles and lease management will be available in Epic 3.
                   </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* History Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HistoryIcon className="h-5 w-5 text-primary" />
                Unit History
              </CardTitle>
              <CardDescription>
                Recent status changes and maintenance events.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mb-3 opacity-20" />
                  <p>No history records found</p>
                </div>
              ) : (
                <div className="relative pl-2 space-y-8 before:absolute before:inset-0 before:ml-2 before:h-full before:w-px before:bg-border">
                  {history.map((record, index) => (
                    <div key={record.id || index} className="relative flex gap-4 pl-4">
                       {/* Timeline Dot */}
                      <div className="absolute left-0 top-1 ml-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background shadow-sm -translate-x-1/2 mt-0.5" />
                      
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                           <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-normal bg-background hover:bg-background">
                                {record.oldStatus.replace('_', ' ')}
                              </Badge>
                              <span className="text-muted-foreground text-xs">→</span>
                              <Badge variant="secondary" className={`${getStatusBadgeColor(record.newStatus)} text-xs`}>
                                {record.newStatus.replace('_', ' ')}
                              </Badge>
                           </div>
                           <span className="text-xs text-muted-foreground whitespace-nowrap">
                             {formatDate(record.changedAt)}
                           </span>
                        </div>
                        
                        {record.reason && (
                          <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded mt-1">
                            {record.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {unit && (
        <>
          <UnitDeleteDialog
            unitId={unit.id}
            unitNumber={unit.unitNumber}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={handleDeleteSuccess}
          />

          {/* Edit Modal */}
          <UnitFormModal
            propertyId={unit.propertyId}
            unit={unit}
            mode="edit"
            isOpen={editModalOpen}
            onOpenChange={setEditModalOpen}
            onSuccess={handleEditSuccess}
            trigger={null}
          />
        </>
      )}
    </div>
  );
}