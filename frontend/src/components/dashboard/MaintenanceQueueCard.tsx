'use client';

/**
 * Maintenance Queue Card Component
 * Story 8.1: Executive Summary Dashboard
 * AC-5: Display HIGH priority work orders requiring immediate attention
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ArrowRight, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MaintenanceQueueItem } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface MaintenanceQueueCardProps {
  items: MaintenanceQueueItem[] | null;
  isLoading?: boolean;
  limit?: number;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MaintenanceQueueItemRow({ item }: { item: MaintenanceQueueItem }) {
  return (
    <Link
      href={`/work-orders/${item.id}`}
      className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary">
              {item.workOrderNumber}
            </span>
            {item.isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {item.daysOverdue} days overdue
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-medium">{item.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{item.propertyName}</span>
            {item.unitNumber && (
              <>
                <span>•</span>
                <span>Unit {item.unitNumber}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <Badge
            variant={item.status === 'OPEN' ? 'outline' : 'secondary'}
            className="text-xs"
          >
            {item.status}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

function MaintenanceQueueSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-lg border p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MaintenanceQueueCard({
  items,
  isLoading = false,
  limit = 5
}: MaintenanceQueueCardProps) {
  const displayItems = items?.slice(0, limit) ?? [];
  const hasItems = displayItems.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg">Priority Maintenance Queue</CardTitle>
        </div>
        {hasItems && (
          <Badge variant="destructive" className="font-semibold">
            {items?.length ?? 0} items
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MaintenanceQueueSkeleton />
        ) : hasItems ? (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <MaintenanceQueueItemRow key={item.id} item={item} />
            ))}
            {items && items.length > limit && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/work-orders?priority=HIGH&status=OPEN,ASSIGNED">
                  View all {items.length} items
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No high priority items in queue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
