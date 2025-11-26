'use client';

/**
 * Vendor Detail Page
 * Story 5.1: Vendor Registration and Profile Management
 *
 * AC #13: Display all vendor information in organized sections
 * AC #14: Status management (activate, deactivate, suspend)
 * AC #18: Display work order history
 * AC #19: Performance metrics placeholder
 */

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  Star,
  Calendar,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  History,
} from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

import { useVendor, useVendorWorkOrders, useUpdateVendorStatus, useDeleteVendor } from '@/hooks/useVendors';
import {
  VendorStatus,
  getVendorStatusColor,
  getValidStatusTransitions,
} from '@/types/vendors';

// Status action labels
const STATUS_ACTION_LABELS: Record<VendorStatus, { label: string; icon: React.ReactNode; description: string }> = {
  [VendorStatus.ACTIVE]: {
    label: 'Activate',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Vendor will be able to receive work orders',
  },
  [VendorStatus.INACTIVE]: {
    label: 'Deactivate',
    icon: <XCircle className="h-4 w-4" />,
    description: 'Vendor will not receive new work orders',
  },
  [VendorStatus.SUSPENDED]: {
    label: 'Suspend',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Vendor access will be suspended pending review',
  },
};

// Work Order Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

// Work Order Status colors
const WO_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch vendor data
  const { data: vendor, isLoading, error, refetch } = useVendor(id);

  // Fetch work orders
  const { data: workOrdersData, isLoading: workOrdersLoading } = useVendorWorkOrders(id, 0, 10);

  // Mutations
  const updateStatusMutation = useUpdateVendorStatus();
  const deleteMutation = useDeleteVendor();

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<VendorStatus | null>(null);

  // Status change handler
  const handleStatusChange = (newStatus: VendorStatus) => {
    setTargetStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!targetStatus || !vendor) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: vendor.id,
        status: targetStatus,
      });
      toast({
        title: 'Status Updated',
        description: `Vendor status changed to ${targetStatus}`,
      });
      setStatusDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update vendor status',
        variant: 'destructive',
      });
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!vendor) return;

    try {
      await deleteMutation.mutateAsync(vendor.id);
      toast({
        title: 'Vendor Deleted',
        description: `${vendor.companyName} has been deleted`,
      });
      router.push('/property-manager/vendors');
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete vendor',
        variant: 'destructive',
      });
    }
  };

  // Get available status transitions
  const getStatusActions = () => {
    if (!vendor) return [];
    return getValidStatusTransitions(vendor.status);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-12 w-96 mb-8" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !vendor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vendor Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The vendor you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/property-manager/vendors')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6" data-testid="vendor-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/property-manager/vendors">Vendors</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{vendor.companyName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="vendor-company-name">
              {vendor.companyName}
            </h1>
            <Badge className={getVendorStatusColor(vendor.status)} data-testid="vendor-status-badge">
              {vendor.status}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono" data-testid="vendor-number">
            {vendor.vendorNumber}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Status Actions Dropdown */}
          {getStatusActions().length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="status-actions-menu">
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getStatusActions().map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    data-testid={`status-action-${status}`}
                  >
                    {STATUS_ACTION_LABELS[status].icon}
                    <span className="ml-2">{STATUS_ACTION_LABELS[status].label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="outline"
            onClick={() => router.push(`/property-manager/vendors/${id}/edit`)}
            data-testid="edit-vendor-button"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            data-testid="delete-vendor-button"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
          <TabsTrigger value="work-orders" data-testid="tab-work-orders">Work Orders</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Company Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium" data-testid="vendor-contact-person">
                    {vendor.contactPersonName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emirates ID / Trade License</p>
                  <p className="font-medium" data-testid="vendor-emirates-id">
                    {vendor.emiratesIdOrTradeLicense}
                  </p>
                </div>
                {vendor.trn && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Registration Number</p>
                    <p className="font-medium" data-testid="vendor-trn">
                      {vendor.trn}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Registered</p>
                  <p className="font-medium">
                    {vendor.createdAt && format(new Date(vendor.createdAt), 'PPP')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <CardTitle>Contact Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${vendor.email}`}
                    className="text-primary hover:underline"
                    data-testid="vendor-email"
                  >
                    {vendor.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${vendor.phoneNumber}`}
                    className="text-primary hover:underline"
                    data-testid="vendor-phone"
                  >
                    {vendor.phoneNumber}
                  </a>
                </div>
                {vendor.secondaryPhoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${vendor.secondaryPhoneNumber}`}
                      className="text-primary hover:underline"
                    >
                      {vendor.secondaryPhoneNumber}
                    </a>
                    <span className="text-xs text-muted-foreground">(Secondary)</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm" data-testid="vendor-address">
                    {vendor.address}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle>Service Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Service Categories</p>
                  <div className="flex flex-wrap gap-2" data-testid="vendor-categories">
                    {vendor.serviceCategories?.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                {vendor.serviceAreas && vendor.serviceAreas.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Service Areas</p>
                    <div className="flex flex-wrap gap-2" data-testid="vendor-areas">
                      {vendor.serviceAreas.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Payment Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="text-xl font-semibold" data-testid="vendor-hourly-rate">
                      AED {vendor.hourlyRate?.toFixed(2)}
                    </p>
                  </div>
                  {vendor.emergencyCalloutFee && (
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Fee</p>
                      <p className="text-xl font-semibold" data-testid="vendor-emergency-fee">
                        AED {vendor.emergencyCalloutFee.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-medium" data-testid="vendor-payment-terms">
                    {vendor.paymentTerms?.replace(/_/g, ' ')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics (AC #19 placeholder) */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <CardTitle>Performance Metrics</CardTitle>
                </div>
                <CardDescription>Performance data from completed work orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Rating</p>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold" data-testid="vendor-rating">
                        {vendor.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Jobs Completed</p>
                    <p className="text-2xl font-bold" data-testid="vendor-jobs-completed">
                      {vendor.totalJobsCompleted || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Work Orders</p>
                    <p className="text-2xl font-bold" data-testid="vendor-work-order-count">
                      {vendor.workOrderCount || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Avg. Completion Time</p>
                    <p className="text-2xl font-bold" data-testid="vendor-avg-completion">
                      {vendor.averageCompletionTime
                        ? `${vendor.averageCompletionTime.toFixed(1)} days`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="work-orders">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Work Order History</CardTitle>
              </div>
              <CardDescription>Work orders assigned to this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {workOrdersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !workOrdersData?.data?.content || workOrdersData.data.content.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mb-4" />
                  <p>No work orders assigned to this vendor yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Order #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrdersData.data.content.map((wo) => (
                      <TableRow key={wo.id} data-testid={`work-order-row-${wo.id}`}>
                        <TableCell className="font-mono text-sm">
                          {wo.workOrderNumber}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {wo.title}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {wo.category?.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={PRIORITY_COLORS[wo.priority] || ''}>
                            {wo.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={WO_STATUS_COLORS[wo.status] || ''}>
                            {wo.status?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {wo.scheduledDate && (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(wo.scheduledDate), 'dd MMM yyyy')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/property-manager/work-orders/${wo.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetStatus && STATUS_ACTION_LABELS[targetStatus].label} Vendor
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetStatus && STATUS_ACTION_LABELS[targetStatus].description}
              <br /><br />
              Are you sure you want to change the status of <strong>{vendor.companyName}</strong> from{' '}
              <strong>{vendor.status}</strong> to <strong>{targetStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
              data-testid="confirm-status-change"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{vendor.companyName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-vendor"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
