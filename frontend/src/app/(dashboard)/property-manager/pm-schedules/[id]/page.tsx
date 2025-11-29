 
'use client';

/**
 * PM Schedule Detail Page
 * Story 4.2: Preventive Maintenance Scheduling
 * Displays PM schedule details, statistics, history, and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Calendar,
  Building2,
  Clock,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getPMScheduleById,
  updatePMScheduleStatus,
  generateWorkOrderNow,
  getPMScheduleHistory,
  deletePMSchedule,
} from '@/services/pm-schedule.service';
import {
  PMSchedule,
  PMScheduleStatus,
  GeneratedWorkOrder,
  getPMScheduleStatusInfo,
  getRecurrenceTypeInfo,
} from '@/types/pm-schedule';
import { WorkOrderPriority, WorkOrderStatus } from '@/types/work-orders';
import { cn } from '@/lib/utils';

export default function PMScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const scheduleId = params.id as string;

  // State
  const [schedule, setSchedule] = useState<PMSchedule | null>(null);
  const [history, setHistory] = useState<GeneratedWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
  });

  // Dialog states
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch schedule details
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPMScheduleById(scheduleId);
      setSchedule(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load PM schedule details',
        variant: 'destructive',
      });
      router.push('/property-manager/pm-schedules');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, router, toast]);

  // Fetch history
  const fetchHistory = useCallback(async (page = 0) => {
    try {
      setLoadingHistory(true);
      const response = await getPMScheduleHistory(scheduleId, page, 10);
      setHistory(response.data);
      setHistoryPagination({
        currentPage: response.pagination.currentPage,
        pageSize: response.pagination.pageSize,
        totalPages: response.pagination.totalPages,
        totalElements: response.pagination.totalElements,
      });
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [scheduleId]);

  // Initial load
  useEffect(() => {
    fetchSchedule();
    fetchHistory();
  }, [fetchSchedule, fetchHistory]);

  // Handle pause/resume
  const handleStatusChange = async (newStatus: PMScheduleStatus) => {
    try {
      setActionLoading(newStatus);
      await updatePMScheduleStatus(scheduleId, newStatus);
      toast({
        title: 'Success',
        description: `Schedule ${newStatus === PMScheduleStatus.ACTIVE ? 'resumed' : newStatus === PMScheduleStatus.PAUSED ? 'paused' : 'completed'} successfully`,
      });
      await fetchSchedule();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to update schedule status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle generate now
  const handleGenerateNow = async () => {
    try {
      setActionLoading('generate');
      const response = await generateWorkOrderNow(scheduleId);
      setShowGenerateDialog(false);
      toast({
        title: 'Success',
        description: `Work Order #${response.workOrderNumber} generated successfully`,
      });
      await fetchSchedule();
      await fetchHistory();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to generate work order',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setActionLoading('delete');
      await deletePMSchedule(scheduleId);
      setShowDeleteDialog(false);
      toast({
        title: 'Success',
        description: 'PM schedule deleted successfully',
      });
      router.push('/property-manager/pm-schedules');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error?.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Status badge
  const getStatusBadge = (status: PMScheduleStatus) => {
    const statusInfo = getPMScheduleStatusInfo(status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge className={cn(statusInfo.badgeClass, 'text-sm px-3 py-1')}>
        {status === PMScheduleStatus.ACTIVE && <Play className="mr-1 h-3 w-3" />}
        {status === PMScheduleStatus.PAUSED && <Pause className="mr-1 h-3 w-3" />}
        {status === PMScheduleStatus.COMPLETED && <CheckCircle className="mr-1 h-3 w-3" />}
        {statusInfo.label}
      </Badge>
    );
  };

  // Priority badge
  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case WorkOrderPriority.HIGH:
        return <Badge variant="destructive">HIGH</Badge>;
      case WorkOrderPriority.MEDIUM:
        return <Badge className="bg-yellow-500">MEDIUM</Badge>;
      case WorkOrderPriority.LOW:
        return <Badge variant="secondary">LOW</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Work order status badge
  const getWorkOrderStatusBadge = (status: WorkOrderStatus, isOverdue: boolean) => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }

    switch (status) {
      case WorkOrderStatus.OPEN:
        return <Badge variant="outline">Open</Badge>;
      case WorkOrderStatus.ASSIGNED:
        return <Badge className="bg-blue-500">Assigned</Badge>;
      case WorkOrderStatus.IN_PROGRESS:
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case WorkOrderStatus.COMPLETED:
        return <Badge className="bg-green-500">Completed</Badge>;
      case WorkOrderStatus.CLOSED:
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  const recurrenceInfo = getRecurrenceTypeInfo(schedule.recurrenceType);
  const canEdit = schedule.status !== PMScheduleStatus.COMPLETED && schedule.status !== PMScheduleStatus.DELETED;
  const canDelete = schedule.statistics?.totalGenerated === 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/property-manager/pm-schedules')}
            className="mb-2"
            data-testid="btn-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedules
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{schedule.scheduleName}</h1>
            {getStatusBadge(schedule.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            {schedule.propertyName ? (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {schedule.propertyName}
              </span>
            ) : (
              'All Properties'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {schedule.status === PMScheduleStatus.ACTIVE && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusChange(PMScheduleStatus.PAUSED)}
                disabled={actionLoading !== null}
                data-testid="btn-pause"
              >
                {actionLoading === PMScheduleStatus.PAUSED ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                Pause
              </Button>
              <Button
                onClick={() => setShowGenerateDialog(true)}
                disabled={actionLoading !== null}
                data-testid="btn-generate-now"
              >
                {actionLoading === 'generate' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate Now
              </Button>
            </>
          )}
          {schedule.status === PMScheduleStatus.PAUSED && (
            <Button
              onClick={() => handleStatusChange(PMScheduleStatus.ACTIVE)}
              disabled={actionLoading !== null}
              data-testid="btn-resume"
            >
              {actionLoading === PMScheduleStatus.ACTIVE ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Resume
            </Button>
          )}
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/property-manager/pm-schedules/${scheduleId}/edit`)}
                data-testid="btn-edit"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange(PMScheduleStatus.COMPLETED)}
                disabled={actionLoading !== null}
                data-testid="btn-complete"
              >
                {actionLoading === PMScheduleStatus.COMPLETED ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Complete
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={actionLoading !== null}
              data-testid="btn-delete"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedule.statistics?.totalGenerated || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{schedule.statistics?.completedCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{schedule.statistics?.overdueCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedule.statistics?.avgCompletionDays ? `${schedule.statistics.avgCompletionDays} days` : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium capitalize">{schedule.category.toLowerCase().replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium">{recurrenceInfo?.label || schedule.recurrenceType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default Priority</p>
                {getPriorityBadge(schedule.defaultPriority)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default Assignee</p>
                <p className="font-medium">{schedule.defaultAssigneeName || 'Unassigned'}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm whitespace-pre-wrap">{schedule.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(schedule.startDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {schedule.endDate ? format(new Date(schedule.endDate), 'MMM d, yyyy') : 'No end date'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Generation</p>
                <p className="font-medium flex items-center gap-1">
                  {schedule.nextGenerationDate ? (
                    <>
                      <Clock className="h-4 w-4" />
                      {format(new Date(schedule.nextGenerationDate), 'MMM d, yyyy')}
                    </>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Generated</p>
                <p className="font-medium">
                  {schedule.lastGeneratedDate
                    ? format(new Date(schedule.lastGeneratedDate), 'MMM d, yyyy')
                    : 'Never'}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p>Created: {format(new Date(schedule.createdAt), 'PPp')}</p>
                <p>By: {schedule.createdByName || 'Unknown'}</p>
              </div>
              <div>
                <p>Updated: {format(new Date(schedule.updatedAt), 'PPp')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Work Orders History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generated Work Orders
          </CardTitle>
          <CardDescription>
            History of work orders generated from this schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No work orders generated yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order #</TableHead>
                    <TableHead>Generated Date</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days to Complete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((wo) => (
                    <TableRow
                      key={wo.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/property-manager/work-orders/${wo.id}`)}
                    >
                      <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                      <TableCell>{format(new Date(wo.generatedDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {wo.scheduledDate ? format(new Date(wo.scheduledDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>{getWorkOrderStatusBadge(wo.status, wo.isOverdue)}</TableCell>
                      <TableCell>
                        {wo.daysToComplete !== null ? `${wo.daysToComplete} days` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* History Pagination */}
              {historyPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {historyPagination.currentPage * historyPagination.pageSize + 1} to{' '}
                    {Math.min(
                      (historyPagination.currentPage + 1) * historyPagination.pageSize,
                      historyPagination.totalElements
                    )}{' '}
                    of {historyPagination.totalElements}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchHistory(historyPagination.currentPage - 1)}
                      disabled={historyPagination.currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {historyPagination.currentPage + 1} / {historyPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchHistory(historyPagination.currentPage + 1)}
                      disabled={historyPagination.currentPage >= historyPagination.totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Now Confirmation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Work Order Now?</DialogTitle>
            <DialogDescription>
              This will immediately generate a work order from this PM schedule. This is in addition
              to the automatic scheduled generation and will not affect the next scheduled date.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateNow} disabled={actionLoading === 'generate'}>
              {actionLoading === 'generate' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PM Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This PM schedule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
