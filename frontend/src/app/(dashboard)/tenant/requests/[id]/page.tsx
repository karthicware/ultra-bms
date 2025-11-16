'use client';

/**
 * Maintenance Request Details Page
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Features:
 * - Full request details with all fields
 * - Status timeline with completed/pending steps
 * - Photo gallery with lightbox
 * - Vendor information (if assigned)
 * - Feedback form (if completed)
 * - Cancel button (if SUBMITTED)
 * - Real-time status updates (polling every 30s)
 */

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tantml:parameter>
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, Clock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMaintenanceRequestById } from '@/services/maintenance.service';
import { MaintenanceStatus } from '@/types/maintenance';
import { StatusTimeline } from '@/components/maintenance/StatusTimeline';
import { PhotoGallery } from '@/components/maintenance/PhotoGallery';
import { FeedbackForm } from '@/components/maintenance/FeedbackForm';
import { CancelRequestButton } from '@/components/maintenance/CancelRequestButton';

const STATUS_COLORS = {
  [MaintenanceStatus.SUBMITTED]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [MaintenanceStatus.ASSIGNED]: 'bg-blue-100 text-blue-800 border-blue-300',
  [MaintenanceStatus.IN_PROGRESS]: 'bg-orange-100 text-orange-800 border-orange-300',
  [MaintenanceStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-300',
  [MaintenanceStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-300',
  [MaintenanceStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-300',
};

const PRIORITY_COLORS = {
  HIGH: 'bg-red-100 text-red-800 border-red-300',
  MEDIUM: 'bg-orange-100 text-orange-800 border-orange-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
};

const CATEGORY_ICONS: Record<string, string> = {
  PLUMBING: '🔧',
  ELECTRICAL: '⚡',
  HVAC: '❄️',
  APPLIANCE: '🔌',
  CARPENTRY: '🔨',
  PEST_CONTROL: '🐛',
  CLEANING: '🧹',
  OTHER: '📝',
};

export default function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ['maintenance-request', resolvedParams.id],
    queryFn: () => getMaintenanceRequestById(resolvedParams.id),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Refetch when tab becomes visible (for real-time updates)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['maintenance-request', resolvedParams.id] });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [resolvedParams.id, queryClient]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Request not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Requests
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{request.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground">Request #{request.requestNumber}</span>
              <Badge className={STATUS_COLORS[request.status]}>{request.status}</Badge>
              <Badge className={PRIORITY_COLORS[request.priority]}>{request.priority}</Badge>
              <Badge variant="outline">
                {CATEGORY_ICONS[request.category]} {request.category}
              </Badge>
            </div>
          </div>

          {/* Cancel Button (only if SUBMITTED) */}
          {request.status === MaintenanceStatus.SUBMITTED && (
            <CancelRequestButton requestId={request.id} requestNumber={request.requestNumber} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </CardContent>
          </Card>

          {/* Photos */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoGallery photos={request.attachments} />
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline request={request} />
            </CardContent>
          </Card>

          {/* Work Notes (if completed) */}
          {request.workNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Work Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{request.workNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Completion Photos */}
          {request.completionPhotos && request.completionPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoGallery photos={request.completionPhotos} />
              </CardContent>
            </Card>
          )}

          {/* Feedback Form (if completed and no feedback yet) */}
          {request.status === MaintenanceStatus.COMPLETED && !request.feedbackSubmittedAt && (
            <FeedbackForm requestId={request.id} />
          )}

          {/* Submitted Feedback (if exists) */}
          {request.feedbackSubmittedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Your Feedback</CardTitle>
                <CardDescription>
                  Submitted on {format(new Date(request.feedbackSubmittedAt), 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{'⭐'.repeat(request.rating || 0)}</span>
                  <span className="text-muted-foreground">
                    {request.rating} out of 5 stars
                  </span>
                </div>
                {request.feedback && (
                  <p className="text-gray-700 mt-4">{request.feedback}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Submitted</div>
                  <div className="font-medium">
                    {format(new Date(request.submittedAt), 'PPP')}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Preferred Time</div>
                  <div className="font-medium">{request.preferredAccessTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Preferred Date</div>
                  <div className="font-medium">
                    {format(new Date(request.preferredAccessDate), 'PP')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Info (if assigned) */}
          {request.assignedVendorName && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Vendor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{request.assignedVendorName}</div>
                    {request.assignedVendorContact && (
                      <div className="text-sm text-muted-foreground">
                        {request.assignedVendorContact}
                      </div>
                    )}
                  </div>
                </div>

                {request.estimatedCompletionDate && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <div className="text-muted-foreground">Estimated Completion</div>
                      <div className="font-medium">
                        {format(new Date(request.estimatedCompletionDate), 'PP')}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Skeleton className="h-10 w-32 mb-4" />
      <Skeleton className="h-10 w-96 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
