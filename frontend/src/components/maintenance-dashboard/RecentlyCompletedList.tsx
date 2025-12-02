'use client';

/**
 * Recently Completed Jobs List Component (AC-9)
 * Displays last 5 completed jobs with View Details action
 * Story 8.4: Maintenance Dashboard
 */

import { useRouter } from 'next/navigation';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Eye, User, Building2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type { RecentlyCompletedJob } from '@/types/maintenance-dashboard';

interface RecentlyCompletedListProps {
  data: RecentlyCompletedJob[] | undefined;
  isLoading: boolean;
  onJobClick?: (jobId: string) => void;
}

export function RecentlyCompletedList({
  data,
  isLoading,
  onJobClick
}: RecentlyCompletedListProps) {
  const router = useRouter();

  const handleViewJob = (jobId: string) => {
    if (onJobClick) {
      onJobClick(jobId);
    } else {
      router.push(`/maintenance/work-orders/${jobId}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recently Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recently Completed</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No recently completed jobs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="recently-completed-list">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recently Completed</CardTitle>
        <p className="text-sm text-muted-foreground">
          Last {data.length} completed jobs
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((job) => {
            const completedDate = parseISO(job.completedAt);
            const timeAgo = formatDistanceToNow(completedDate, { addSuffix: true });

            return (
              <div
                key={job.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                data-testid={`completed-job-${job.id}`}
              >
                <div className="flex-shrink-0 p-2 rounded-full bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        <span className="text-muted-foreground mr-1.5">
                          {job.workOrderNumber}
                        </span>
                        {job.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {job.propertyName}
                        </div>

                        {job.completedByName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.completedByName}
                          </div>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-default">
                                <Clock className="h-3 w-3" />
                                {timeAgo}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{format(completedDate, 'PPpp')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => handleViewJob(job.id)}
                            data-testid={`view-completed-job-${job.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="mt-4 pt-3 border-t">
          <Button
            variant="link"
            className="p-0 h-auto font-medium"
            onClick={() => router.push('/maintenance/work-orders?status=COMPLETED,CLOSED')}
          >
            View all completed jobs →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentlyCompletedList;
