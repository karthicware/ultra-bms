'use client';

/**
 * Work Order Detail Page
 * Story 4.1: Work Order Creation and Management
 * Story 4.3: Work Order Assignment and Vendor Coordination
 * Displays complete work order information with timeline, photos, and comments
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AxiosError } from 'axios';
import Image from 'next/image';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  getWorkOrderById,
  getWorkOrderComments,
  getWorkOrderStatusHistory,
  cancelWorkOrder,
  assignWorkOrderToAssignee,
  startWork,
  addProgressUpdate,
  markComplete,
  getWorkOrderTimeline,
  reassignWorkOrder,
} from '@/services/work-orders.service';
import { AssignmentDialog } from '@/components/work-orders/AssignmentDialog';
import { ReassignmentDialog } from '@/components/work-orders/ReassignmentDialog';
import { StartWorkDialog } from '@/components/work-orders/StartWorkDialog';
import { ProgressUpdateDialog } from '@/components/work-orders/ProgressUpdateDialog';
import { MarkCompleteDialog } from '@/components/work-orders/MarkCompleteDialog';
import { ProgressTimeline } from '@/components/work-orders/ProgressTimeline';
import { BeforeAfterGallery } from '@/components/work-orders/BeforeAfterGallery';
import type { AssignWorkOrderFormData, ReassignWorkOrderFormData } from '@/lib/validations/work-order-assignment';
import {
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderCategory,
  type WorkOrder,
  type WorkOrderComment,
} from '@/types/work-orders';
import type { TimelineEntry } from '@/types/work-order-progress';
import { CommentsSection } from '@/components/work-orders/CommentsSection';
import { StatusTimeline } from '@/components/work-orders/StatusTimeline';
import { AssignmentHistory } from '@/components/work-orders/AssignmentHistory';
import {
  type LucideIcon,
  FileText,
  Pencil,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  Calendar,
  User,
  Building2,
  Home,
  DollarSign,
  Clock,
  Key,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Droplet,
  Zap,
  Wind,
  Tv,
  Hammer,
  Bug,
  Sparkles,
  Paintbrush,
  Sprout,
  Wrench,
  Play,
  MessageSquarePlus,
  CheckCircle,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/contexts/auth-context';

// Category icons mapping
const CATEGORY_ICONS: Record<WorkOrderCategory, LucideIcon> = {
  [WorkOrderCategory.PLUMBING]: Droplet,
  [WorkOrderCategory.ELECTRICAL]: Zap,
  [WorkOrderCategory.HVAC]: Wind,
  [WorkOrderCategory.APPLIANCE]: Tv,
  [WorkOrderCategory.CARPENTRY]: Hammer,
  [WorkOrderCategory.PEST_CONTROL]: Bug,
  [WorkOrderCategory.CLEANING]: Sparkles,
  [WorkOrderCategory.PAINTING]: Paintbrush,
  [WorkOrderCategory.LANDSCAPING]: Sprout,
  [WorkOrderCategory.OTHER]: Wrench,
};

// Status badge colors
const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.OPEN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [WorkOrderStatus.ASSIGNED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [WorkOrderStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [WorkOrderStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [WorkOrderStatus.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

// Priority badge colors
const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  [WorkOrderPriority.HIGH]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [WorkOrderPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [WorkOrderPriority.LOW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useUser();
  const workOrderId = params.id as string;

  // AC #25: Cost visibility based on user role (tenants should not see costs)
  const showCost = user?.role !== 'TENANT';

  // State
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [comments, setComments] = useState<WorkOrderComment[]>([]);
  const [_statusHistory, setStatusHistory] = useState<WorkOrderComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  // Story 4.3: Assignment state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  // Story 4.3: Reassignment state
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  // Story 4.4: Progress tracking state
  const [startWorkDialogOpen, setStartWorkDialogOpen] = useState(false);
  const [isStartingWork, setIsStartingWork] = useState(false);
  const [progressUpdateDialogOpen, setProgressUpdateDialogOpen] = useState(false);
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [markCompleteDialogOpen, setMarkCompleteDialogOpen] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);

  // Fetch work order details
  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        setIsLoading(true);
        setIsTimelineLoading(true);
        const [workOrderData, commentsData, historyData] = await Promise.all([
          getWorkOrderById(workOrderId),
          getWorkOrderComments(workOrderId),
          getWorkOrderStatusHistory(workOrderId),
        ]);
        setWorkOrder(workOrderData);
        setComments(commentsData);
        setStatusHistory(historyData);

        // Story 4.4: Fetch timeline
        try {
          const timelineData = await getWorkOrderTimeline(workOrderId);
          setTimeline(timelineData.data?.timeline || []);
        } catch {
          // Timeline not available yet, that's ok
          setTimeline([]);
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ error?: { message?: string } }>;
        toast({
          title: 'Error',
          description: axiosError.response?.data?.error?.message || 'Failed to load work order details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setIsTimelineLoading(false);
      }
    };

    if (workOrderId) {
      fetchWorkOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId]);

  // Refresh comments
  const refreshComments = async () => {
    try {
      const commentsData = await getWorkOrderComments(workOrderId);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  };

  // Handlers
  const handleEdit = () => {
    router.push(`/property-manager/work-orders/${workOrderId}/edit`);
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelWorkOrder(workOrderId);
      toast({
        title: 'Success',
        description: `Work Order #${workOrder?.workOrderNumber} has been cancelled`,
        variant: 'success',
      });
      router.push('/property-manager/work-orders');
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.error?.message || 'Failed to cancel work order',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  const handleStatusUpdate = (newStatus: WorkOrderStatus) => {
    // Status transitions are workflow-based per Story 4.4:
    // - OPEN → ASSIGNED: Use "Assign" button to assign vendor/staff
    // - ASSIGNED → IN_PROGRESS: Use "Start Work" button when work begins
    // - IN_PROGRESS → COMPLETED: Use "Mark Complete" button when work is done
    toast({
      title: 'Use Action Buttons',
      description: 'Please use the action buttons (Assign, Start Work, Mark Complete) to update the work order status.',
      variant: 'info',
    });
  };

  // Story 4.3: Open assignment dialog
  const handleAssign = () => {
    setAssignDialogOpen(true);
  };

  // Story 4.3: Handle assignment submission
  const handleAssignSubmit = async (data: AssignWorkOrderFormData) => {
    try {
      setIsAssigning(true);
      await assignWorkOrderToAssignee(workOrderId, {
        assigneeType: data.assigneeType,
        assigneeId: data.assigneeId,
        assignmentNotes: data.assignmentNotes || undefined,
      });

      // Refresh work order data
      const updatedWorkOrder = await getWorkOrderById(workOrderId);
      setWorkOrder(updatedWorkOrder);

      setAssignDialogOpen(false);
      toast({
        title: 'Success',
        description: `Work Order #${workOrder?.workOrderNumber} has been assigned successfully`,
        variant: 'success',
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast({
        title: 'Assignment Failed',
        description: axiosError.response?.data?.error?.message || 'Failed to assign work order',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Story 4.3: Open reassignment dialog
  const handleReassign = () => {
    setReassignDialogOpen(true);
  };

  // Story 4.3: Handle reassignment submission
  const handleReassignSubmit = async (data: ReassignWorkOrderFormData) => {
    try {
      setIsReassigning(true);
      await reassignWorkOrder(workOrderId, {
        newAssigneeType: data.newAssigneeType,
        newAssigneeId: data.newAssigneeId,
        reassignmentReason: data.reassignmentReason,
        assignmentNotes: data.assignmentNotes || undefined,
      });

      // Refresh work order data
      const updatedWorkOrder = await getWorkOrderById(workOrderId);
      setWorkOrder(updatedWorkOrder);

      setReassignDialogOpen(false);
      toast({
        title: 'Success',
        description: `Work Order #${workOrder?.workOrderNumber} has been reassigned successfully`,
        variant: 'success',
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast({
        title: 'Reassignment Failed',
        description: axiosError.response?.data?.error?.message || 'Failed to reassign work order',
        variant: 'destructive',
      });
    } finally {
      setIsReassigning(false);
    }
  };

  // Story 4.4: Refresh timeline
  const refreshTimeline = async () => {
    try {
      const timelineData = await getWorkOrderTimeline(workOrderId);
      setTimeline(timelineData.data?.timeline || []);
    } catch {
      // Silent fail
    }
  };

  // Story 4.4: Handle start work
  const handleStartWork = async (beforePhotos?: File[]) => {
    try {
      setIsStartingWork(true);
      await startWork(workOrderId, beforePhotos);

      // Refresh work order and timeline
      const updatedWorkOrder = await getWorkOrderById(workOrderId);
      setWorkOrder(updatedWorkOrder);
      await refreshTimeline();

      setStartWorkDialogOpen(false);
      toast({
        title: 'Work Started',
        description: `Work has been started on ${workOrder?.workOrderNumber}`,
        variant: 'success',
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.error?.message || 'Failed to start work',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsStartingWork(false);
    }
  };

  // Story 4.4: Handle add progress update
  const handleAddProgressUpdate = async (data: {
    progressNotes: string;
    photos?: File[];
    estimatedCompletionDate?: string;
  }) => {
    try {
      setIsAddingProgress(true);
      await addProgressUpdate(workOrderId, data);

      // Refresh work order and timeline
      const updatedWorkOrder = await getWorkOrderById(workOrderId);
      setWorkOrder(updatedWorkOrder);
      await refreshTimeline();

      setProgressUpdateDialogOpen(false);
      toast({
        title: 'Progress Updated',
        description: 'Progress update has been added successfully',
        variant: 'success',
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.error?.message || 'Failed to add progress update',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsAddingProgress(false);
    }
  };

  // Story 4.4: Handle mark complete
  const handleMarkComplete = async (data: {
    completionNotes: string;
    afterPhotos: File[];
    hoursSpent: number;
    totalCost: number;
    recommendations?: string;
    followUpRequired: boolean;
    followUpDescription?: string;
  }) => {
    try {
      setIsMarkingComplete(true);
      await markComplete(workOrderId, data);

      // Refresh work order and timeline
      const updatedWorkOrder = await getWorkOrderById(workOrderId);
      setWorkOrder(updatedWorkOrder);
      await refreshTimeline();

      setMarkCompleteDialogOpen(false);
      toast({
        title: 'Work Completed',
        description: `${workOrder?.workOrderNumber} has been marked as complete`,
        variant: 'success',
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast({
        title: 'Error',
        description: axiosError.response?.data?.error?.message || 'Failed to mark as complete',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const nextPhoto = () => {
    if (workOrder && currentPhotoIndex < workOrder.attachments.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Work Order not found</h3>
          <p className="text-muted-foreground mb-4">
            The work order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[workOrder.category];
  const canEdit = workOrder.status === WorkOrderStatus.OPEN || workOrder.status === WorkOrderStatus.ASSIGNED;
  const canCancel = workOrder.status === WorkOrderStatus.OPEN;

  return (
    <div className="container mx-auto py-6" data-testid="work-order-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/work-orders">Work Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{workOrder.workOrderNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{workOrder.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{workOrder.workOrderNumber}</Badge>
            <Badge className={STATUS_COLORS[workOrder.status]}>
              {workOrder.status.replace(/_/g, ' ')}
            </Badge>
            <Badge className={PRIORITY_COLORS[workOrder.priority]}>
              {workOrder.priority} PRIORITY
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {canEdit && (
            <Button variant="outline" onClick={handleEdit} data-testid="btn-edit-work-order">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {/* Story 4.3: AC #1 - Assign button for unassigned work orders */}
          {!workOrder.assignedTo && (
            <Button
              variant="outline"
              onClick={handleAssign}
              data-testid="btn-assign-work-order"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign
            </Button>
          )}
          {/* Story 4.3: AC #10 - Reassign button for already assigned work orders */}
          {workOrder.assignedTo && workOrder.status !== WorkOrderStatus.COMPLETED && workOrder.status !== WorkOrderStatus.CLOSED && (
            <Button
              variant="outline"
              onClick={handleReassign}
              data-testid="btn-reassign-work-order"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reassign
            </Button>
          )}
          {/* Story 4.4: AC #1 - Start Work button for assigned work orders */}
          {workOrder.status === WorkOrderStatus.ASSIGNED && workOrder.assignedTo && (
            <Button
              onClick={() => setStartWorkDialogOpen(true)}
              data-testid="btn-start-work"
              className="bg-green-600 hover:bg-green-700"
              title="Start working on this job"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Work
            </Button>
          )}
          {/* Story 4.4: AC #3, #11 - Progress Update and Mark Complete buttons for in-progress work orders */}
          {workOrder.status === WorkOrderStatus.IN_PROGRESS && (
            <>
              <Button
                variant="outline"
                onClick={() => setProgressUpdateDialogOpen(true)}
                data-testid="btn-add-progress-update"
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Add Progress
              </Button>
              <Button
                onClick={() => setMarkCompleteDialogOpen(true)}
                data-testid="btn-mark-complete"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Update Status</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {workOrder.status === WorkOrderStatus.OPEN && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(WorkOrderStatus.ASSIGNED)}>
                  Mark as Assigned
                </DropdownMenuItem>
              )}
              {(workOrder.status === WorkOrderStatus.OPEN || workOrder.status === WorkOrderStatus.ASSIGNED) && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(WorkOrderStatus.IN_PROGRESS)}>
                  Start Work
                </DropdownMenuItem>
              )}
              {workOrder.status === WorkOrderStatus.IN_PROGRESS && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(WorkOrderStatus.COMPLETED)}>
                  Mark as Completed
                </DropdownMenuItem>
              )}
              {workOrder.status === WorkOrderStatus.COMPLETED && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(WorkOrderStatus.CLOSED)}>
                  Close Work Order
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <Separator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => setCancelDialogOpen(true)}
                    className="text-destructive"
                  >
                    Cancel Work Order
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Property</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{workOrder.propertyName}</span>
                  </div>
                </div>
                {workOrder.unitNumber && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Unit</div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Unit {workOrder.unitNumber}</span>
                    </div>
                  </div>
                )}
                {/* Story 7.1: Asset Registry and Tracking - AC #16 */}
                {workOrder.assetId && workOrder.assetName && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Linked Asset</div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{workOrder.assetNumber} - {workOrder.assetName}</span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{workOrder.category.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                {workOrder.scheduledDate && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Scheduled Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(workOrder.scheduledDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Requested By</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{workOrder.requesterName || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Created</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(workOrder.createdAt), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-2">Description</div>
                <p className="text-sm leading-relaxed">{workOrder.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Access Instructions */}
          {workOrder.accessInstructions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Access Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{workOrder.accessInstructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery - Initial attachments */}
          {workOrder.attachments && workOrder.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Initial Photos</CardTitle>
                <CardDescription>{workOrder.attachments.length} photo(s) attached when created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {workOrder.attachments.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(index)}
                      className="relative aspect-square rounded-lg border overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={photo}
                        alt={`Work order photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Story 4.4: AC #21 - Before/After Photo Gallery for completed work orders */}
          {(workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CLOSED) && (
            <BeforeAfterGallery
              beforePhotos={workOrder.beforePhotos || []}
              afterPhotos={workOrder.afterPhotos || []}
            />
          )}

          {/* Story 4.4: AC #30 - Follow-up Required Banner */}
          {workOrder.followUpRequired && (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CLOSED) && (
            <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950" data-testid="banner-follow-up-required">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Follow-up Required</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {workOrder.followUpDescription || 'Additional follow-up work is needed for this work order.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Story 4.4: AC #22 - Progress Timeline */}
          {(workOrder.status === WorkOrderStatus.IN_PROGRESS ||
            workOrder.status === WorkOrderStatus.COMPLETED ||
            workOrder.status === WorkOrderStatus.CLOSED) && (
            <ProgressTimeline
              timeline={timeline}
              isLoading={isTimelineLoading}
              showCost={showCost}
            />
          )}

          {/* Comments Section */}
          <CommentsSection
            workOrderId={workOrderId}
            comments={comments}
            onCommentAdded={refreshComments}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workOrder.estimatedCost !== null && workOrder.estimatedCost !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Estimated Cost</div>
                  <div className="text-2xl font-bold">AED {workOrder.estimatedCost.toFixed(2)}</div>
                </div>
              )}
              {workOrder.actualCost !== null && workOrder.actualCost !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Actual Cost</div>
                  <div className="text-2xl font-bold">AED {workOrder.actualCost.toFixed(2)}</div>
                </div>
              )}
              {(!workOrder.estimatedCost && !workOrder.actualCost) && (
                <p className="text-sm text-muted-foreground">No cost information available</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned To */}
          {workOrder.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{workOrder.assigneeName || 'Unknown'}</div>
                    {workOrder.assignedAt && (
                      <div className="text-xs text-muted-foreground">
                        Assigned {format(new Date(workOrder.assignedAt), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Story 4.3: AC #11 - Assignment History */}
          <AssignmentHistory workOrderId={workOrderId} />

          {/* Status Timeline */}
          <StatusTimeline
            status={workOrder.status}
            createdAt={workOrder.createdAt}
            assignedAt={workOrder.assignedAt}
            startedAt={workOrder.startedAt}
            completedAt={workOrder.completedAt}
            closedAt={workOrder.closedAt}
          />
        </div>
      </div>

      {/* Photo Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Photo {currentPhotoIndex + 1} of {workOrder.attachments.length}
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video">
            <Image
              src={workOrder.attachments[currentPhotoIndex]}
              alt={`Work order photo ${currentPhotoIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevPhoto}
              disabled={currentPhotoIndex === 0}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={nextPhoto}
              disabled={currentPhotoIndex >= workOrder.attachments.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Work Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel work order #{workOrder.workOrderNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story 4.3: Assignment Dialog */}
      <AssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        workOrder={workOrder}
        onAssign={handleAssignSubmit}
        isSubmitting={isAssigning}
      />

      {/* Story 4.3: Reassignment Dialog */}
      <ReassignmentDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        workOrder={workOrder}
        onReassign={handleReassignSubmit}
        isSubmitting={isReassigning}
      />

      {/* Story 4.4: Start Work Dialog */}
      <StartWorkDialog
        open={startWorkDialogOpen}
        onOpenChange={setStartWorkDialogOpen}
        workOrder={workOrder}
        onStartWork={handleStartWork}
        isSubmitting={isStartingWork}
      />

      {/* Story 4.4: Progress Update Dialog */}
      <ProgressUpdateDialog
        open={progressUpdateDialogOpen}
        onOpenChange={setProgressUpdateDialogOpen}
        workOrder={workOrder}
        onSubmit={handleAddProgressUpdate}
        isSubmitting={isAddingProgress}
      />

      {/* Story 4.4: Mark Complete Dialog */}
      <MarkCompleteDialog
        open={markCompleteDialogOpen}
        onOpenChange={setMarkCompleteDialogOpen}
        workOrder={workOrder}
        onSubmit={handleMarkComplete}
        isSubmitting={isMarkingComplete}
      />
    </div>
  );
}
