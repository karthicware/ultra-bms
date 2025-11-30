'use client';

/**
 * Violation Detail Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #32: Record and track violations
 * AC #33: Track fines and resolutions
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  Calendar,
  Building2,
  DollarSign,
  FileWarning,
  Pencil,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import {
  type ViolationDetail,
  FineStatus,
  getFineStatusColor,
  getFineStatusLabel,
} from '@/types/compliance';

export default function ViolationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const violationId = params.id as string;

  const [violation, setViolation] = useState<ViolationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViolation = async () => {
      try {
        setIsLoading(true);
        const violation = await complianceService.getViolationById(violationId);
        setViolation(violation);
      } catch (error) {
        console.error('Failed to load violation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load violation details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (violationId) {
      fetchViolation();
    }
  }, [violationId, toast]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
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

  if (!violation) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="text-center py-12">
          <FileWarning className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Violation not found</h3>
          <p className="text-muted-foreground mb-4">
            The violation you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const fineStatusColorClass = getFineStatusColor(violation.fineStatus);

  return (
    <div className="container mx-auto space-y-6" data-testid="violation-detail-page">      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Violation {violation.violationNumber}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{violation.violationNumber}</Badge>
            <Badge className={fineStatusColorClass}>
              {getFineStatusLabel(violation.fineStatus)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => router.push(`/property-manager/compliance/violations/${violationId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Violation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Violation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Property</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{violation.propertyName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Requirement</div>
                  <span className="font-medium">{violation.requirementName}</span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Violation Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(violation.violationDate)}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-2">Description</div>
                <p className="text-sm leading-relaxed">{violation.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Fine Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fine Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {violation.fineAmount ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fine Amount</div>
                      <div className="text-2xl font-bold">{formatCurrency(violation.fineAmount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <Badge className={fineStatusColorClass}>
                        {getFineStatusLabel(violation.fineStatus)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No fine associated with this violation</p>
              )}
            </CardContent>
          </Card>

          {/* Resolution Details */}
          {violation.resolutionDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Resolution Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(violation.resolutionDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fine Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {violation.fineStatus === FineStatus.PAID ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : violation.fineStatus === FineStatus.OVERDUE ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : violation.fineStatus === FineStatus.PENDING ? (
                    <Clock className="h-8 w-8 text-yellow-500" />
                  ) : violation.fineStatus === FineStatus.WAIVED ? (
                    <CheckCircle className="h-8 w-8 text-blue-500" />
                  ) : (
                    <FileWarning className="h-8 w-8 text-gray-500" />
                  )}
                  <div>
                    <div className="font-semibold">{getFineStatusLabel(violation.fineStatus)}</div>
                    <div className="text-sm text-muted-foreground">
                      {violation.fineStatus === FineStatus.PAID
                        ? 'Fine has been paid'
                        : violation.fineStatus === FineStatus.OVERDUE
                        ? 'Payment is overdue'
                        : violation.fineStatus === FineStatus.PENDING
                        ? 'Payment pending'
                        : violation.fineStatus === FineStatus.WAIVED
                        ? 'Fine has been waived'
                        : 'No fine applicable'}
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/property-manager/compliance/violations/${violationId}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Violation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/property-manager/compliance/schedules/${violation.complianceScheduleId}`)}
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
                <div className="text-sm font-medium">{formatDate(violation.createdAt)}</div>
              </div>
              {violation.updatedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm font-medium">{formatDate(violation.updatedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
