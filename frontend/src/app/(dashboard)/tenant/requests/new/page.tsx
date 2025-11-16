'use client';

/**
 * New Maintenance Request Page
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Allows tenants to submit maintenance requests with:
 * - Category selection with priority auto-suggestion
 * - Title and description with validation
 * - Photo upload (max 5, with compression)
 * - Preferred access time and date
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceRequestForm } from '@/components/maintenance/MaintenanceRequestForm';

export default function NewMaintenanceRequestPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Submit Maintenance Request</h1>
        <p className="text-gray-600 mt-2">
          Report an issue and our maintenance team will address it promptly
        </p>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Please provide detailed information about the maintenance issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceRequestForm />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}
