 
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';

/**
 * Get status badge color
 */
const getStatusBadgeColor = (status: UnitStatus): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'OCCUPIED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'UNDER_MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'RESERVED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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
    month: 'long',
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
  }, [unitId, refetchTrigger]); // Removed toast from dependencies

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" data-testid="unit-detail-page">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unit not found</h3>
          <p className="text-muted-foreground mb-4">
            The unit you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const rentPerSqft = unit.squareFootage
    ? unit.monthlyRent / unit.squareFootage
    : 0;

  return (
    <div className="container mx-auto space-y-6" data-testid="unit-detail-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Home className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Unit {unit.unitNumber}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Floor {unit.floor}</span>
            <span>•</span>
            <span>
              {unit.bedroomCount === 0 ? 'Studio' : `${unit.bedroomCount} BED`} /{' '}
              {unit.bathroomCount} BATH
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusBadgeColor(unit.status)}>
              {unit.status.replace('_', ' ')}
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
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="unit-info-card">
        {/* Rent Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {formatCurrency(unit.monthlyRent)}
            </div>
            {unit.squareFootage && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(rentPerSqft)}/sq ft
              </p>
            )}
          </CardContent>
        </Card>

        {/* Area */}
        {unit.squareFootage && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Area</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {unit.squareFootage.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">square feet</p>
            </CardContent>
          </Card>
        )}

        {/* Unit Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unit Type</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span>{unit.bedroomCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span>{unit.bathroomCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      {unit.features && Object.keys(unit.features).length > 0 && (
        <Card data-testid="unit-features-section">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(unit.features).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenant Information */}
      {unit.status === 'OCCUPIED' && (
        <Card data-testid="unit-tenant-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>Tenant information will be available after Epic 3 completion</p>
              <p className="text-sm mt-2">
                Will show tenant name, lease dates, contact information
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No history available</p>
              <p className="text-sm mt-2">
                Status changes will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record, index) => (
                <div
                  key={record.id || index}
                  className="flex gap-4 pb-4 border-b last:border-0"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusBadgeColor(record.oldStatus)}
                      >
                        {record.oldStatus.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm">→</span>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeColor(record.newStatus)}
                      >
                        {record.newStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    {record.reason && (
                      <p className="text-sm text-muted-foreground">
                        Reason: {record.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.changedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
