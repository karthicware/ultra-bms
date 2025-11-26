'use client';

/**
 * Vendor Registration Page
 * Story 5.1: Vendor Registration and Profile Management
 *
 * AC #5: Multi-section form for vendor registration
 * AC #11: Success feedback and navigation to vendor detail
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';

import { VendorForm } from '@/components/vendors/VendorForm';
import { createVendor } from '@/services/vendors.service';
import type { VendorRequest } from '@/types/vendors';

export default function NewVendorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: VendorRequest) => {
    try {
      setIsSubmitting(true);
      const response = await createVendor(data);

      toast({
        title: 'Vendor Registered Successfully',
        description: `${response.companyName} has been registered with vendor number ${response.vendorNumber}`,
      });

      // Navigate to vendor detail page
      router.push(`/property-manager/vendors/${response.id}`);
    } catch (error: unknown) {
      console.error('Failed to create vendor:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to register vendor. Please try again.';
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6" data-testid="new-vendor-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/vendors">Vendors</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Register New Vendor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="new-vendor-title">
          Register New Vendor
        </h1>
        <p className="text-muted-foreground mt-1">
          Add a new service provider to your vendor network
        </p>
      </div>

      {/* Vendor Form */}
      <div className="max-w-4xl">
        <VendorForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
