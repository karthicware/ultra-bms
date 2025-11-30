'use client';

/**
 * Vendor List Page
 * Story 5.1: Vendor Registration and Profile Management
 * Using shadcn-studio datatable for consistent UX
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Users,
  Trophy,
  Scale,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import { getVendors, deleteVendor } from '@/services/vendors.service';
import type { VendorListItem } from '@/types/vendors';
import VendorsDatatable from '@/components/vendors/VendorsDatatable';

export default function VendorsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load vendors
  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getVendors({
        page: 0,
        size: 1000, // Fetch all for client-side filtering
        sortBy: 'companyName',
        sortDirection: 'ASC',
      });

      setVendors(response.data?.content || []);
      setTotalElements(response.data?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Handlers
  const handleRefresh = () => {
    loadVendors();
  };

  const handleDeleteClick = (id: string, name: string) => {
    setVendorToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;

    try {
      setIsDeleting(true);
      await deleteVendor(vendorToDelete.id);
      toast({
        title: 'Vendor Deleted',
        description: `${vendorToDelete.name} has been deleted successfully`,
        variant: 'success',
      });
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
      loadVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="vendors-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="vendors-page-title">
            Vendors
          </h1>
          <p className="text-muted-foreground">
            {totalElements} vendor{totalElements !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/property-manager/vendors/ranking')}
            data-testid="view-rankings-button"
          >
            <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
            Rankings
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/property-manager/vendors/compare')}
            data-testid="compare-vendors-button"
          >
            <Scale className="mr-2 h-4 w-4" />
            Compare
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/property-manager/vendors/new')} data-testid="add-vendor-button">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Datatable */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No vendors found</h3>
              <p className="text-sm mb-4">Get started by adding your first vendor</p>
              <Button onClick={() => router.push('/property-manager/vendors/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </div>
          ) : (
            <VendorsDatatable
              data={vendors}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{vendorToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-vendor"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
