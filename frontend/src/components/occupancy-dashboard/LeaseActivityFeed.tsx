'use client';

/**
 * Lease Activity Feed Component
 * Story 8.3: Occupancy Dashboard
 * AC-8: Activity feed showing recent lease activities
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FilePlus,
  RefreshCw,
  LogOut,
  Bell,
  ChevronRight,
  Clock,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaseActivityItem } from '@/types';
import { LeaseActivityType, getActivityTypeInfo } from '@/types';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface LeaseActivityFeedProps {
  activities: LeaseActivityItem[] | null;
  isLoading?: boolean;
  maxItems?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIVITY_ICONS: Record<LeaseActivityType, React.ComponentType<{ className?: string }>> = {
  [LeaseActivityType.LEASE_CREATED]: FilePlus,
  [LeaseActivityType.LEASE_RENEWED]: RefreshCw,
  [LeaseActivityType.LEASE_TERMINATED]: LogOut,
  [LeaseActivityType.NOTICE_GIVEN]: Bell
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FeedSkeleton({ items = 5 }: { items?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Activity className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No Recent Activity</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Lease activities will appear here as they happen.
      </p>
    </div>
  );
}

function ActivityIcon({ type }: { type: LeaseActivityType }) {
  const typeInfo = getActivityTypeInfo(type);
  const Icon = ACTIVITY_ICONS[type] || Activity;

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full',
        typeInfo.bgClass
      )}
    >
      <Icon className={cn('h-5 w-5', typeInfo.textClass)} />
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return timestamp;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LeaseActivityFeed({
  activities,
  isLoading = false,
  maxItems = 10
}: LeaseActivityFeedProps) {
  const router = useRouter();

  if (isLoading || !activities) {
    return <FeedSkeleton items={maxItems} />;
  }

  const displayActivities = activities.slice(0, maxItems);

  const handleActivityClick = (activity: LeaseActivityItem) => {
    router.push(`/tenants/${activity.tenantId}`);
  };

  return (
    <Card data-testid="lease-activity-feed">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {displayActivities.map((activity, index) => {
              const typeInfo = getActivityTypeInfo(activity.activityType);

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'group flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50',
                    index !== displayActivities.length - 1 && 'border-b pb-3'
                  )}
                  onClick={() => handleActivityClick(activity)}
                  data-testid={`activity-item-${activity.id}`}
                >
                  <ActivityIcon type={activity.activityType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {activity.description}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {activity.tenantName}
                          </span>
                          <span>•</span>
                          <span>Unit {activity.unitNumber}</span>
                          <span>•</span>
                          <span>{activity.propertyName}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity type summary */}
        {displayActivities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {Object.values(LeaseActivityType).map((type) => {
              const count = activities.filter(
                (a) => a.activityType === type
              ).length;
              if (count === 0) return null;

              const typeInfo = getActivityTypeInfo(type);

              return (
                <div
                  key={type}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                    typeInfo.bgClass
                  )}
                >
                  <span className={typeInfo.textClass}>{count}</span>
                  <span className={cn('text-muted-foreground', typeInfo.textClass)}>
                    {typeInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
