'use client';

/**
 * Inspection Detail Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #30: Inspection history per schedule with results
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Calendar,
  Building2,
  User,
  Phone,
  Building,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

import { PageBackButton } from '@/components/common/PageBackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import {
  type InspectionDetail,
  InspectionStatus,
  InspectionResult,
  getInspectionStatusColor,
  getInspectionStatusLabel,
  getInspectionResultColor,
  getInspectionResultLabel,
} from '@/types/compliance';

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const inspectionId = params.id as string;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setIsLoading(true);
        const inspection = await complianceService.getInspectionById(inspectionId);
        setInspection(inspection);
      } catch (error) {
        console.error('Failed to load inspection:', error);
        toast({
          title: 'Error',
          description: 'Failed to load inspection details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (inspectionId) {
      fetchInspection();
    }
  }, [inspectionId, toast]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="text-center py-12">
          <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inspection not found</h3>
          <p className="text-muted-foreground mb-4">
            The inspection you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusColorClass = getInspectionStatusColor(inspection.status);
  const resultColorClass = inspection.result ? getInspectionResultColor(inspection.result) : '';

  return (
    <div className="container mx-auto space-y-6" data-testid="inspection-detail-page">      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Inspection Details
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColorClass}>
              {getInspectionStatusLabel(inspection.status)}
            </Badge>
            {inspection.result && (
              <Badge className={resultColorClass}>
                {getInspectionResultLabel(inspection.result)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <PageBackButton href="/property-manager/compliance/inspections" aria-label="Back to inspections" />
          {inspection.status === InspectionStatus.SCHEDULED && (
            <Button onClick={() => router.push(`/property-manager/compliance/inspections/${inspectionId}/record`)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Record Results
            </Button>
          )}
        </div>
      </div>

      {/* Failed inspection alert */}
      {inspection.result === InspectionResult.FAILED && (
        <Alert className="mb-6 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Inspection Failed</strong> - This inspection did not meet compliance requirements.
            {inspection.remediationWorkOrderId && (
              <span className="block mt-1">
                A remediation work order has been created.{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-red-800 dark:text-red-200 underline"
                  onClick={() => router.push(`/property-manager/work-orders/${inspection.remediationWorkOrderId}`)}
                >
                  View Work Order
                </Button>
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property & Requirement */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Property</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{inspection.propertyName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Requirement</div>
                  <span className="font-medium">{inspection.complianceSchedule?.requirementName}</span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Scheduled Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(inspection.scheduledDate)}</span>
                  </div>
                </div>
                {inspection.inspectionDate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Inspection Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(inspection.inspectionDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inspector Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inspector Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Inspector Name</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{inspection.inspectorName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results (if completed) */}
          {inspection.status !== InspectionStatus.SCHEDULED && inspection.status !== InspectionStatus.CANCELLED && (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {inspection.result === InspectionResult.PASSED ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : inspection.result === InspectionResult.FAILED ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  )}
                  <div>
                    <div className="font-semibold text-lg">
                      {inspection.result ? getInspectionResultLabel(inspection.result) : 'Pending'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {inspection.result === InspectionResult.PASSED
                        ? 'All compliance requirements met'
                        : inspection.result === InspectionResult.FAILED
                        ? 'Failed to meet compliance requirements'
                        : 'Conditionally passed with remediation needed'}
                    </div>
                  </div>
                </div>

                {inspection.issuesFound && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Issues Found</div>
                      <p className="text-sm">{inspection.issuesFound}</p>
                    </div>
                  </>
                )}

                {inspection.recommendations && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Recommendations</div>
                      <p className="text-sm">{inspection.recommendations}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {inspection.status === InspectionStatus.PASSED ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : inspection.status === InspectionStatus.FAILED ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : inspection.status === InspectionStatus.CANCELLED ? (
                    <XCircle className="h-8 w-8 text-gray-500" />
                  ) : (
                    <Clock className="h-8 w-8 text-blue-500" />
                  )}
                  <div>
                    <div className="font-semibold">{getInspectionStatusLabel(inspection.status)}</div>
                    <div className="text-sm text-muted-foreground">
                      {inspection.status === InspectionStatus.SCHEDULED
                        ? 'Awaiting inspection'
                        : inspection.status === InspectionStatus.CANCELLED
                        ? 'Inspection was cancelled'
                        : 'Inspection completed'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inspection.status === InspectionStatus.SCHEDULED && (
                <Button
                  className="w-full justify-start"
                  onClick={() => router.push(`/property-manager/compliance/inspections/${inspectionId}/record`)}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Record Results
                </Button>
              )}
              {inspection.remediationWorkOrderId && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/property-manager/work-orders/${inspection.remediationWorkOrderId}`)}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  View Remediation Work Order
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/property-manager/compliance/schedules/${inspection.complianceScheduleId}`)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Compliance Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm font-medium">{formatDate(inspection.createdAt)}</div>
              </div>
              {inspection.updatedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm font-medium">{formatDate(inspection.updatedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
