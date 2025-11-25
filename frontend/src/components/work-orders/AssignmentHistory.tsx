'use client';

/**
 * AssignmentHistory Component
 * Story 4.3: Work Order Assignment and Vendor Coordination
 *
 * Displays the assignment history for a work order
 * Features:
 * - AC #11: Assignment history shows all past assignments
 * - Shows assignee name, type, date, and any reassignment reason
 * - Chronological order with most recent first
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { User, Building2, Clock, Loader2, History, ChevronDown, ChevronUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { getAssignmentHistory } from '@/services/work-orders.service';
import { AssigneeType, type WorkOrderAssignment } from '@/types';

interface AssignmentHistoryProps {
  workOrderId: string;
  className?: string;
}

export function AssignmentHistory({ workOrderId, className }: AssignmentHistoryProps) {
  const [assignments, setAssignments] = useState<WorkOrderAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignmentHistory();
  }, [workOrderId]);

  async function loadAssignmentHistory() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAssignmentHistory(workOrderId);
      setAssignments(response.data?.assignments || []);
    } catch (err: any) {
      console.error('Failed to load assignment history:', err);
      setError('Failed to load assignment history');
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No assignment history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Assignment History
                <Badge variant="secondary" className="ml-2">
                  {assignments.length}
                </Badge>
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-4">
                {assignments.map((assignment, index) => (
                  <div
                    key={assignment.id}
                    className={`relative pl-6 pb-4 ${
                      index !== assignments.length - 1 ? 'border-l-2 border-muted ml-2' : 'ml-2'
                    }`}
                    data-testid={`assignment-history-item-${assignment.id}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      {assignment.assigneeType === AssigneeType.INTERNAL_STAFF ? (
                        <User className="h-2.5 w-2.5 text-primary-foreground" />
                      ) : (
                        <Building2 className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </div>

                    {/* Assignment details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{assignment.assigneeName}</span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {assignment.assigneeType === AssigneeType.INTERNAL_STAFF
                            ? 'Internal Staff'
                            : 'External Vendor'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(assignment.assignedDate), 'dd MMM yyyy HH:mm')}
                        </span>
                        <span className="mx-1">•</span>
                        <span>by {assignment.assignedByName}</span>
                      </div>

                      {/* Reassignment reason */}
                      {assignment.reassignmentReason && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                          <span className="font-medium">Reason for reassignment:</span>{' '}
                          <span className="text-muted-foreground">{assignment.reassignmentReason}</span>
                        </div>
                      )}

                      {/* Assignment notes */}
                      {assignment.assignmentNotes && (
                        <div className="mt-1 text-xs text-muted-foreground italic">
                          "{assignment.assignmentNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
