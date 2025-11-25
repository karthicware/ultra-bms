'use client';

/**
 * Work Order Detail Page
 * Story 4.1: Work Order Creation and Management
 * Displays complete work order information with timeline, photos, and comments
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
} from '@/services/work-orders.service';
import {
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderCategory,
  type WorkOrder,
  type WorkOrderComment,
} from '@/types/work-orders';
import { CommentsSection } from '@/components/work-orders/CommentsSection';
import { StatusTimeline } from '@/components/work-orders/StatusTimeline';
import {
  FileText,
  Pencil,
  UserPlus,
  ChevronLeft,
  Calendar,
  User,
  Building2,
  Home,
  DollarSign,
  Clock,
  Key,
  X,
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
} from 'lucide-react';
import { format } from 'date-fns';

// Category icons mapping
const CATEGORY_ICONS: Record<WorkOrderCategory, any> = {
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
  const workOrderId = params.id as string;

  // State
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [comments, setComments] = useState<WorkOrderComment[]>([]);
  const [statusHistory, setStatusHistory] = useState<WorkOrderComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Fetch work order details
  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        setIsLoading(true);
        const [workOrderData, commentsData, historyData] = await Promise.all([
          getWorkOrderById(workOrderId),
          getWorkOrderComments(workOrderId),
          getWorkOrderStatusHistory(workOrderId),
        ]);
        setWorkOrder(workOrderData);
        setComments(commentsData);
        setStatusHistory(historyData);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.error?.message || 'Failed to load work order details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (workOrderId) {
      fetchWorkOrder();
    }
  }, [workOrderId, toast]);

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
      });
      router.push('/property-manager/work-orders');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to cancel work order',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  const handleStatusUpdate = (newStatus: WorkOrderStatus) => {
    // TODO: Implement status update dialog
    toast({
      title: 'Coming Soon',
      description: 'Status update functionality will be implemented next',
    });
  };

  const handleAssign = () => {
    // TODO: Implement assign dialog
    toast({
      title: 'Coming Soon',
      description: 'Assignment functionality will be implemented in Story 4.3',
    });
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
          {!workOrder.assignedTo && (
            <Button variant="outline" onClick={handleAssign}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign
            </Button>
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

          {/* Photo Gallery */}
          {workOrder.attachments && workOrder.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>{workOrder.attachments.length} photo(s) attached</CardDescription>
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

          {/* Assigned Vendor */}
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
    </div>
  );
}
