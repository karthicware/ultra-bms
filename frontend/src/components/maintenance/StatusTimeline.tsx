'use client';

/**
 * Status Timeline Component
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Displays request lifecycle timeline with completed/pending steps
 */

import { format } from 'date-fns';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MaintenanceRequest, MaintenanceStatus } from '@/types/maintenance';

interface StatusTimelineProps {
  request: MaintenanceRequest;
}

const TIMELINE_STEPS = [
  { status: MaintenanceStatus.SUBMITTED, label: 'Submitted', field: 'submittedAt' },
  { status: MaintenanceStatus.ASSIGNED, label: 'Assigned', field: 'assignedAt' },
  { status: MaintenanceStatus.IN_PROGRESS, label: 'In Progress', field: 'startedAt' },
  { status: MaintenanceStatus.COMPLETED, label: 'Completed', field: 'completedAt' },
  { status: MaintenanceStatus.CLOSED, label: 'Closed', field: 'closedAt' },
];

export function StatusTimeline({ request }: StatusTimelineProps) {
  const getCurrentStepIndex = () => {
    if (request.status === MaintenanceStatus.CANCELLED) return -1;
    return TIMELINE_STEPS.findIndex((step) => step.status === request.status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = request.status === MaintenanceStatus.CANCELLED;

  if (isCancelled) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Request was cancelled</p>
        {request.closedAt && (
          <p className="text-sm text-muted-foreground mt-1">
            Cancelled on {format(new Date(request.closedAt), 'PPP')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {TIMELINE_STEPS.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const timestamp = request[step.field as keyof MaintenanceRequest];

        return (
          <div
            key={step.status}
            className="relative pb-8 last:pb-0"
          >
            {/* Connector Line */}
            {index < TIMELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  'absolute left-4 top-8 h-full w-0.5',
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
            )}

            {/* Step */}
            <div
              className={cn(
                "flex items-start gap-4",
                isCompleted && 'completed',
                isCurrent && 'active',
                !isCompleted && !isCurrent && 'pending'
              )}
              data-testid={`checkpoint-${step.status}`}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white',
                  isCompleted
                    ? 'border-green-500 text-green-500'
                    : 'border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={cn(
                    'font-medium',
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.label}
                  {isCurrent && ' (Current)'}
                </p>
                {timestamp && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(timestamp as string), 'PPP p')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
