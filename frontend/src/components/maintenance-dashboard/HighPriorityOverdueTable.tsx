'use client';

/**
 * High Priority & Overdue Jobs Table Component (AC-8)
 * Sortable data table with quick actions and pagination
 * Story 8.4: Maintenance Dashboard
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { HighPriorityJob, HighPriorityJobsPage } from '@/types/maintenance-dashboard';
import { MaintenanceJobPriority, PRIORITY_COLORS, PRIORITY_LABELS } from '@/types/maintenance-dashboard';
import { WorkOrderStatus } from '@/types/work-orders';

interface HighPriorityOverdueTableProps {
  data: HighPriorityJobsPage | undefined;
  isLoading: boolean;
  onPageChange?: (page: number) => void;
  onJobClick?: (jobId: string) => void;
}

type SortField = 'workOrderNumber' | 'priority' | 'status' | 'daysOverdue' | 'scheduledDate';
type SortDirection = 'asc' | 'desc';

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.OPEN]: 'Open',
  [WorkOrderStatus.ASSIGNED]: 'Assigned',
  [WorkOrderStatus.IN_PROGRESS]: 'In Progress',
  [WorkOrderStatus.COMPLETED]: 'Completed',
  [WorkOrderStatus.CLOSED]: 'Closed'
};

const STATUS_VARIANTS: Record<WorkOrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [WorkOrderStatus.OPEN]: 'default',
  [WorkOrderStatus.ASSIGNED]: 'secondary',
  [WorkOrderStatus.IN_PROGRESS]: 'default',
  [WorkOrderStatus.COMPLETED]: 'secondary',
  [WorkOrderStatus.CLOSED]: 'outline'
};

const PRIORITY_ORDER: Record<MaintenanceJobPriority, number> = {
  [MaintenanceJobPriority.URGENT]: 4,
  [MaintenanceJobPriority.HIGH]: 3,
  [MaintenanceJobPriority.MEDIUM]: 2,
  [MaintenanceJobPriority.LOW]: 1
};

export function HighPriorityOverdueTable({
  data,
  isLoading,
  onPageChange,
  onJobClick
}: HighPriorityOverdueTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('daysOverdue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewJob = (jobId: string) => {
    if (onJobClick) {
      onJobClick(jobId);
    } else {
      router.push(`/maintenance/work-orders/${jobId}`);
    }
  };

  const sortedData = data?.content ? [...data.content].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'workOrderNumber':
        return multiplier * a.workOrderNumber.localeCompare(b.workOrderNumber);
      case 'priority':
        return multiplier * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      case 'status':
        return multiplier * a.status.localeCompare(b.status);
      case 'daysOverdue':
        return multiplier * (a.daysOverdue - b.daysOverdue);
      case 'scheduledDate':
        if (!a.scheduledDate && !b.scheduledDate) return 0;
        if (!a.scheduledDate) return multiplier;
        if (!b.scheduledDate) return -multiplier;
        return multiplier * a.scheduledDate.localeCompare(b.scheduledDate);
      default:
        return 0;
    }
  }) : [];

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          'h-3 w-3',
          sortField === field ? 'opacity-100' : 'opacity-40'
        )} />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">High Priority & Overdue Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.empty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">High Priority & Overdue Jobs</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No high priority or overdue jobs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="high-priority-overdue-table">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">High Priority & Overdue Jobs</CardTitle>
          <Badge variant="secondary" className="font-normal">
            {data.totalElements} total
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Jobs requiring immediate attention
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="workOrderNumber">Job #</SortableHeader>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Title</TableHead>
                <SortableHeader field="priority">Priority</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <TableHead>Assigned To</TableHead>
                <SortableHeader field="daysOverdue">Days Overdue</SortableHeader>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((job) => (
                <TableRow
                  key={job.id}
                  className={cn(
                    job.isOverdue && 'bg-red-50/50 hover:bg-red-50'
                  )}
                  data-testid={`job-row-${job.id}`}
                >
                  <TableCell className="font-medium">
                    {job.workOrderNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{job.propertyName}</span>
                      {job.unitNumber && (
                        <span className="text-xs text-muted-foreground">
                          Unit {job.unitNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate max-w-[200px] block">
                            {job.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{job.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: PRIORITY_COLORS[job.priority],
                        color: 'white'
                      }}
                    >
                      {PRIORITY_LABELS[job.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[job.status]}>
                      {STATUS_LABELS[job.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.assignedToName ? (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {job.assignedToName}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.isOverdue ? (
                      <div className="flex items-center gap-1 text-red-600 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        {job.daysOverdue} days
                      </div>
                    ) : job.scheduledDate ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(job.scheduledDate), 'MMM d')}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewJob(job.id)}
                            data-testid={`view-job-${job.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {data.number + 1} of {data.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(data.number - 1)}
                disabled={data.first}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(data.number + 1)}
                disabled={data.last}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HighPriorityOverdueTable;
