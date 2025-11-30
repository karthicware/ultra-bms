'use client';

/**
 * Vendor Edit Page
 * Story 5.1: Vendor Registration and Profile Management
 *
 * AC #15: Edit vendor information with pre-populated form
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import { VendorForm } from '@/components/vendors/VendorForm';
import { useVendor, useUpdateVendor } from '@/hooks/useVendors';
import type { VendorRequest } from '@/types/vendors';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditVendorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch vendor data
  const { data: vendor, isLoading, error } = useVendor(id);

  // Update mutation
  const updateMutation = useUpdateVendor();

  const handleSubmit = async (data: VendorRequest) => {
    try {
      await updateMutation.mutateAsync({ id, data });

      toast({
        title: 'Vendor Updated',
        description: `${data.companyName} has been updated successfully`,
      });

      // Navigate back to vendor detail page
      router.push(`/property-manager/vendors/${id}`);
    } catch (error: unknown) {
      console.error('Failed to update vendor:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update vendor. Please try again.';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-12 w-96 mb-8" />
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !vendor) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vendor Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The vendor you&apos;re trying to edit doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/property-manager/vendors')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="edit-vendor-page">      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="edit-vendor-title">
          Edit Vendor
        </h1>
        <p className="text-muted-foreground mt-1">
          Update information for {vendor.companyName}
        </p>
      </div>

      {/* Vendor Form */}
      <div className="max-w-4xl">
        <VendorForm
          mode="edit"
          initialData={vendor}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
