'use client';

/**
 * Status Timeline Component
 * Story 4.1: Work Order Creation and Management
 * Displays a visual timeline of work order status progression
 */

import { format } from 'date-fns';
import { Check, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WorkOrderStatus } from '@/types/work-orders';

interface TimelineCheckpoint {
  status: WorkOrderStatus;
  label: string;
  timestamp?: string;
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface StatusTimelineProps {
  status: WorkOrderStatus;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
}

export function StatusTimeline({
  status,
  createdAt,
  assignedAt,
  startedAt,
  completedAt,
  closedAt,
}: StatusTimelineProps) {
  // Determine which checkpoints are completed and current
  const getCheckpointStatus = (checkpointStatus: WorkOrderStatus): { isCompleted: boolean; isCurrent: boolean } => {
    const statusOrder = [
      WorkOrderStatus.OPEN,
      WorkOrderStatus.ASSIGNED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.CLOSED,
    ];

    const currentIndex = statusOrder.indexOf(status);
    const checkpointIndex = statusOrder.indexOf(checkpointStatus);

    return {
      isCompleted: checkpointIndex < currentIndex,
      isCurrent: checkpointIndex === currentIndex,
    };
  };

  // Build timeline checkpoints
  const checkpoints: TimelineCheckpoint[] = [
    {
      status: WorkOrderStatus.OPEN,
      label: 'Created',
      timestamp: createdAt,
      description: 'Work order has been created',
      ...getCheckpointStatus(WorkOrderStatus.OPEN),
    },
    {
      status: WorkOrderStatus.ASSIGNED,
      label: 'Assigned',
      timestamp: assignedAt,
      description: assignedAt ? 'Work order has been assigned to a vendor' : undefined,
      ...getCheckpointStatus(WorkOrderStatus.ASSIGNED),
    },
    {
      status: WorkOrderStatus.IN_PROGRESS,
      label: 'In Progress',
      timestamp: startedAt,
      description: startedAt ? 'Work has started' : undefined,
      ...getCheckpointStatus(WorkOrderStatus.IN_PROGRESS),
    },
    {
      status: WorkOrderStatus.COMPLETED,
      label: 'Completed',
      timestamp: completedAt,
      description: completedAt ? 'Work has been completed' : undefined,
      ...getCheckpointStatus(WorkOrderStatus.COMPLETED),
    },
    {
      status: WorkOrderStatus.CLOSED,
      label: 'Closed',
      timestamp: closedAt,
      description: closedAt ? 'Work order has been closed' : undefined,
      ...getCheckpointStatus(WorkOrderStatus.CLOSED),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {checkpoints.map((checkpoint, index) => {
            const isLast = index === checkpoints.length - 1;
            const hasTimestamp = Boolean(checkpoint.timestamp);

            return (
              <div key={checkpoint.status} className="flex gap-4" data-testid={`checkpoint-${checkpoint.status}`}>
                {/* Icon and Connector */}
                <div className="flex flex-col items-center">
                  {/* Checkpoint Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                      checkpoint.isCompleted && 'bg-primary border-primary text-primary-foreground completed',
                      checkpoint.isCurrent && 'bg-primary border-primary text-primary-foreground active',
                      !checkpoint.isCompleted && !checkpoint.isCurrent && 'bg-background border-muted-foreground/30 pending'
                    )}
                  >
                    {checkpoint.isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : checkpoint.isCurrent ? (
                      <Circle className="h-3 w-3 fill-current" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>

                  {/* Connector Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 h-16 my-1 transition-colors',
                        checkpoint.isCompleted ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>

                {/* Checkpoint Content */}
                <div className={cn('flex-1 pb-8', isLast && 'pb-0')}>
                  <div
                    className={cn(
                      'font-medium text-sm mb-1',
                      (checkpoint.isCompleted || checkpoint.isCurrent) && 'text-foreground',
                      !checkpoint.isCompleted && !checkpoint.isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {checkpoint.label}
                  </div>

                  {hasTimestamp && checkpoint.timestamp ? (
                    <>
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(new Date(checkpoint.timestamp), 'dd MMM yyyy, HH:mm')}
                      </div>
                      {checkpoint.description && (
                        <div className="text-xs text-muted-foreground">{checkpoint.description}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">Pending</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
