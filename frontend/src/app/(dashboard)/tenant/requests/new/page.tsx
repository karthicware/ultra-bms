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
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceRequestForm } from '@/components/maintenance/MaintenanceRequestForm';

export default function NewMaintenanceRequestPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/tenant/requests')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Submit Maintenance Request</h1>
            </div>
            <p className="text-muted-foreground">
              Report an issue and our maintenance team will address it promptly
            </p>
          </div>
        </div>
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
