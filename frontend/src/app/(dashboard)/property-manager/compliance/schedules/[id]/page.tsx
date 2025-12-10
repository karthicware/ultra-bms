'use client';

/**
 * Compliance Schedule Detail Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #28: View schedule details with status and history
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ClipboardCheck,
} from 'lucide-react';

import { PageBackButton } from '@/components/common/PageBackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { complianceService } from '@/services/compliance.service';
import {
  type ComplianceScheduleDetail,
  getScheduleStatusColor,
  getScheduleStatusLabel,
  getCategoryLabel,
  getFrequencyLabel,
  ComplianceScheduleStatus,
} from '@/types/compliance';

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<ComplianceScheduleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const schedule = await complianceService.getScheduleById(scheduleId);
        setSchedule(schedule);
      } catch (error) {
        console.error('Failed to load schedule:', error);
        toast({
          title: 'Error',
          description: 'Failed to load compliance schedule details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (scheduleId) {
      fetchSchedule();
    }
  }, [scheduleId, toast]);

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

  if (!schedule) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="text-center py-12">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Schedule not found</h3>
          <p className="text-muted-foreground mb-4">
            The compliance schedule you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusColorClass = getScheduleStatusColor(schedule.status);

  return (
    <div className="container mx-auto space-y-6" data-testid="schedule-detail-page">      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {schedule.requirementName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {schedule.requirementNumber && (
              <Badge variant="outline" className="font-mono">{schedule.requirementNumber}</Badge>
            )}
            <Badge className={statusColorClass}>
              {getScheduleStatusLabel(schedule.status)}
            </Badge>
            <Badge variant="outline">
              {getCategoryLabel(schedule.category)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <PageBackButton href="/property-manager/compliance/schedules" aria-label="Back to schedules" />
          {schedule.status !== ComplianceScheduleStatus.COMPLETED && (
            <Button onClick={() => router.push(`/property-manager/compliance/schedules/${scheduleId}/complete`)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Details */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Property</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{schedule.propertyName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Requirement</div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{schedule.requirementName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <span className="font-medium">{getCategoryLabel(schedule.category)}</span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Frequency</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getFrequencyLabel(schedule.frequency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(schedule.dueDate)}</span>
                  </div>
                </div>
                {schedule.completedDate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Completed</div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{formatDate(schedule.completedDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certificate Info (if completed) */}
          {(schedule.certificateFilePath || schedule.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedule.certificateFilePath && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Certificate</div>
                    <Link
                      href={schedule.certificateFilePath}
                      target="_blank"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      View Certificate
                    </Link>
                  </div>
                )}
                {schedule.notes && (
                  <>
                    {schedule.certificateFilePath && <Separator />}
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Notes</div>
                      <p className="text-sm">{schedule.notes}</p>
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
                  {schedule.status === ComplianceScheduleStatus.COMPLETED ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : schedule.status === ComplianceScheduleStatus.OVERDUE ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : (
                    <Clock className="h-8 w-8 text-yellow-500" />
                  )}
                  <div>
                    <div className="font-semibold">{getScheduleStatusLabel(schedule.status)}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.status === ComplianceScheduleStatus.COMPLETED
                        ? 'Compliance requirements met'
                        : schedule.status === ComplianceScheduleStatus.OVERDUE
                        ? 'Action required immediately'
                        : 'Action required before due date'}
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
                onClick={() => router.push('/property-manager/compliance/inspections/new')}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Schedule Inspection
              </Button>
              {schedule.status !== ComplianceScheduleStatus.COMPLETED && (
                <Button
                  className="w-full justify-start"
                  onClick={() => router.push(`/property-manager/compliance/schedules/${scheduleId}/complete`)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
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
                <div className="text-sm font-medium">{formatDate(schedule.createdAt)}</div>
              </div>
              {schedule.updatedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm font-medium">{formatDate(schedule.updatedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
