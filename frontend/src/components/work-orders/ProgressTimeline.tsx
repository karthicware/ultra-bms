/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Progress Timeline Component
 * Story 4.4: Job Progress Tracking and Completion
 * AC #22: Display timeline of all work order events
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { getValidImageSrc, isExternalImage } from '@/lib/utils/image-url';
import { format } from 'date-fns';
import {
  FileText,
  UserPlus,
  Play,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TimelineEntry, TimelineEntryType } from '@/types/work-order-progress';

interface ProgressTimelineProps {
  timeline: TimelineEntry[];
  isLoading: boolean;
  showCost?: boolean;
}

const ENTRY_ICONS: Record<TimelineEntryType, any> = {
  CREATED: FileText,
  ASSIGNED: UserPlus,
  REASSIGNED: UserPlus,
  STARTED: Play,
  PROGRESS_UPDATE: MessageSquare,
  COMPLETED: CheckCircle,
  CLOSED: XCircle,
};

const ENTRY_COLORS: Record<TimelineEntryType, string> = {
  CREATED: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  ASSIGNED: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  REASSIGNED: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  STARTED: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
  PROGRESS_UPDATE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  COMPLETED: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400',
};

const ENTRY_LABELS: Record<TimelineEntryType, string> = {
  CREATED: 'Work Order Created',
  ASSIGNED: 'Assigned',
  REASSIGNED: 'Reassigned',
  STARTED: 'Work Started',
  PROGRESS_UPDATE: 'Progress Update',
  COMPLETED: 'Work Completed',
  CLOSED: 'Closed',
};

export function ProgressTimeline({ timeline, isLoading, showCost = true }: ProgressTimelineProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleEntry = (entryId: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="timeline-work-order-progress">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

          <div className="space-y-6" role="list" aria-label="Activity timeline">
            {timeline.map((entry, index) => {
              const Icon = ENTRY_ICONS[entry.type] || MessageSquare;
              const isExpanded = expandedEntries.has(entry.id);
              const hasDetails = entry.notes || (entry.photoUrls && entry.photoUrls.length > 0);

              return (
                <div
                  key={entry.id}
                  className="relative flex gap-4"
                  role="listitem"
                >
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ENTRY_COLORS[entry.type]}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {ENTRY_LABELS[entry.type]}
                          {entry.actorName && (
                            <span className="text-muted-foreground font-normal">
                              {' '}by {entry.actorName}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.timestamp), 'MMM dd, yyyy \'at\' h:mm a')}
                        </p>
                      </div>

                      {/* Cost badge for completion */}
                      {showCost && entry.type === 'COMPLETED' && entry.totalCost !== undefined && (
                        <Badge variant="outline" className="shrink-0">
                          AED {entry.totalCost.toFixed(2)}
                        </Badge>
                      )}
                    </div>

                    {/* Expandable details */}
                    {hasDetails && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEntry(entry.id)}
                          className="mt-2 h-auto p-0 text-muted-foreground hover:text-foreground"
                          aria-expanded={isExpanded}
                          aria-controls={`entry-details-${entry.id}`}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show details
                              {entry.photoUrls && entry.photoUrls.length > 0 && (
                                <span className="ml-1 text-xs">
                                  ({entry.photoUrls.length} photo{entry.photoUrls.length !== 1 ? 's' : ''})
                                </span>
                              )}
                            </>
                          )}
                        </Button>

                        {isExpanded && (
                          <div
                            id={`entry-details-${entry.id}`}
                            className="mt-3 space-y-3 p-3 rounded-lg bg-muted/50"
                          >
                            {/* Notes */}
                            {entry.notes && (
                              <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                            )}

                            {/* Hours and Cost */}
                            {(entry.hoursSpent !== undefined || entry.totalCost !== undefined) && showCost && (
                              <div className="flex gap-4 text-sm">
                                {entry.hoursSpent !== undefined && (
                                  <span>
                                    <span className="text-muted-foreground">Hours:</span>{' '}
                                    {entry.hoursSpent}
                                  </span>
                                )}
                                {entry.totalCost !== undefined && (
                                  <span>
                                    <span className="text-muted-foreground">Cost:</span>{' '}
                                    AED {entry.totalCost.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Recommendations */}
                            {entry.recommendations && (
                              <div className="text-sm">
                                <span className="font-medium">Recommendations:</span>
                                <p className="text-muted-foreground">{entry.recommendations}</p>
                              </div>
                            )}

                            {/* Follow-up */}
                            {entry.followUpRequired && (
                              <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900 text-sm">
                                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                  Follow-up Required:
                                </span>
                                <p className="text-yellow-700 dark:text-yellow-300">
                                  {entry.followUpDescription}
                                </p>
                              </div>
                            )}

                            {/* Photos */}
                            {entry.photoUrls && entry.photoUrls.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {entry.photoUrls.map((url, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="relative aspect-square rounded-lg overflow-hidden border"
                                  >
                                    <Image
                                      src={getValidImageSrc(url)}
                                      alt={`Photo ${photoIndex + 1}`}
                                      fill
                                      className="object-cover"
                                      unoptimized={isExternalImage(getValidImageSrc(url))}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
