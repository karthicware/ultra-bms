'use client';

/**
 * Tenant Detail Page
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #12 - Admin can view checkout status from tenant profile
 * AC: #17 - Tenant status updated to 'Moving Out' during process
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import {
  User,
  Building2,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Edit,
  LogOut,
  Home,
  CreditCard,
  Users,
  Key,
  Car,
  Download,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { getTenantById } from '@/services/tenant.service';
import { checkoutService } from '@/services/checkout.service';
import type { TenantResponse, TenantStatus } from '@/types/tenant';
import type { TenantCheckout, CheckoutStatus } from '@/types/checkout';

// Status badge configuration for tenant
const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', variant: 'secondary', icon: Clock },
  ACTIVE: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', variant: 'destructive', icon: AlertCircle },
  TERMINATED: { label: 'Terminated', variant: 'destructive', icon: XCircle },
};

// Checkout status config
const CHECKOUT_STATUS_CONFIG: Record<CheckoutStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  PENDING: { label: 'Pending', variant: 'secondary', color: 'text-yellow-600' },
  INSPECTION_SCHEDULED: { label: 'Inspection Scheduled', variant: 'secondary', color: 'text-blue-600' },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', variant: 'default', color: 'text-blue-600' },
  DEPOSIT_CALCULATED: { label: 'Deposit Calculated', variant: 'default', color: 'text-purple-600' },
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'outline', color: 'text-amber-600' },
  APPROVED: { label: 'Approved', variant: 'default', color: 'text-green-600' },
  REFUND_PROCESSING: { label: 'Refund Processing', variant: 'secondary', color: 'text-blue-600' },
  REFUND_PROCESSED: { label: 'Refund Processed', variant: 'default', color: 'text-green-600' },
  COMPLETED: { label: 'Completed', variant: 'default', color: 'text-green-600' },
  ON_HOLD: { label: 'On Hold', variant: 'destructive', color: 'text-red-600' },
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  // State
  const [tenant, setTenant] = useState<TenantResponse | null>(null);
  const [checkout, setCheckout] = useState<TenantCheckout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  // Load tenant data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const tenantData = await getTenantById(tenantId);
      setTenant(tenantData);

      // Check if tenant has an active checkout
      setIsCheckoutLoading(true);
      const checkoutData = await checkoutService.getCheckoutByTenant(tenantId);
      setCheckout(checkoutData);
    } catch (error) {
      console.error('Failed to load tenant:', error);
      toast.error('Load Error', { description: 'Failed to load tenant details' });
    } finally {
      setIsLoading(false);
      setIsCheckoutLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle start checkout
  const handleStartCheckout = () => {
    if (checkout) {
      // If checkout exists, navigate to it
      router.push(`/checkouts/${tenantId}`);
    } else {
      // Show confirmation dialog
      setShowCheckoutDialog(true);
    }
  };

  // Confirm start checkout
  const confirmStartCheckout = () => {
    setShowCheckoutDialog(false);
    router.push(`/checkouts/${tenantId}`);
  };

  // Calculate lease days remaining
  const getDaysRemaining = () => {
    if (!tenant?.leaseEndDate) return null;
    return differenceInDays(new Date(tenant.leaseEndDate), new Date());
  };

  const daysRemaining = getDaysRemaining();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tenant Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested tenant could not be found.
            </p>
            <Button onClick={() => router.push('/tenants')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = TENANT_STATUS_CONFIG[tenant.status];
  const StatusIcon = statusConfig?.icon ?? Clock;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageBackButton href="/tenants" aria-label="Back to tenants" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {tenant.firstName} {tenant.lastName}
              </h1>
              <Badge variant={statusConfig?.variant ?? 'secondary'}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig?.label ?? tenant.status}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono">{tenant.tenantNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Checkout Button */}
          {tenant.status === 'ACTIVE' && (
            <Button
              variant={checkout ? 'outline' : 'default'}
              onClick={handleStartCheckout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {checkout ? 'View Checkout' : 'Start Checkout'}
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Checkout Status Alert */}
      {checkout && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Checkout In Progress</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <span>Status: </span>
                <Badge
                  variant={CHECKOUT_STATUS_CONFIG[checkout.status]?.variant ?? 'secondary'}
                  className="ml-1"
                >
                  {CHECKOUT_STATUS_CONFIG[checkout.status]?.label ?? checkout.status}
                </Badge>
                {checkout.expectedMoveOutDate && (
                  <span className="ml-3">
                    Expected Move-out: {format(new Date(checkout.expectedMoveOutDate), 'dd MMM yyyy')}
                  </span>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push(`/checkouts/${tenantId}`)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Lease Expiry Warning */}
      {daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0 && !checkout && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Lease Expiring Soon</AlertTitle>
          <AlertDescription className="text-amber-700">
            This tenant's lease expires in {daysRemaining} days (
            {format(new Date(tenant.leaseEndDate), 'dd MMM yyyy')}). Consider initiating a renewal
            or checkout process.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">{tenant.property?.name ?? 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="font-medium">{tenant.unit?.unitNumber ?? 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">AED {tenant.totalMonthlyRent?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lease Ends</p>
                <p className="font-medium">
                  {tenant.leaseEndDate
                    ? format(new Date(tenant.leaseEndDate), 'dd MMM yyyy')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {tenant.firstName} {tenant.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {tenant.dateOfBirth
                        ? format(new Date(tenant.dateOfBirth), 'dd MMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">National ID</p>
                    <p className="font-medium font-mono">{tenant.nationalId ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{tenant.nationality ?? 'N/A'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.phone ?? 'N/A'}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Emergency Contact</p>
                  <div className="space-y-1">
                    <p className="font-medium">{tenant.emergencyContactName ?? 'N/A'}</p>
                    <p className="text-muted-foreground">{tenant.emergencyContactPhone ?? 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Property & Unit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-medium">{tenant.property?.name ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{tenant.property?.address ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Number</p>
                    <p className="font-medium">{tenant.unit?.unitNumber ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Floor</p>
                    <p className="font-medium">{tenant.unit?.floor ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{tenant.unit?.bedrooms ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{tenant.unit?.bathrooms ?? 'N/A'}</p>
                  </div>
                </div>

                {tenant.parkingSpots > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Parking Allocation
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Parking Spots</p>
                          <p className="font-medium">{tenant.parkingSpots}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Spot Numbers</p>
                          <p className="font-medium">{tenant.spotNumbers ?? 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fee per Spot</p>
                          <p className="font-medium">
                            AED {tenant.parkingFeePerSpot?.toLocaleString()}/month
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lease Tab */}
        <TabsContent value="lease" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lease Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lease Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lease Type</p>
                    <p className="font-medium">{tenant.leaseType?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{tenant.leaseDuration} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {tenant.leaseStartDate
                        ? format(new Date(tenant.leaseStartDate), 'dd MMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {tenant.leaseEndDate
                        ? format(new Date(tenant.leaseEndDate), 'dd MMM yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Renewal Option</p>
                    <p className="font-medium">{tenant.renewalOption ? 'Yes' : 'No'}</p>
                  </div>
                  {daysRemaining !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Days Remaining</p>
                      <p
                        className={`font-medium ${
                          daysRemaining <= 30
                            ? 'text-red-600'
                            : daysRemaining <= 60
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      >
                        {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rent Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Rent Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Rent</span>
                    <span>AED {tenant.baseRent?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin Fee</span>
                    <span>AED {tenant.adminFee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span>AED {tenant.serviceCharge?.toLocaleString()}</span>
                  </div>
                  {tenant.parkingSpots > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Parking ({tenant.parkingSpots} spots)
                      </span>
                      <span>
                        AED {(tenant.parkingSpots * tenant.parkingFeePerSpot).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Monthly Rent</span>
                    <span>AED {tenant.totalMonthlyRent?.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Security Deposit</p>
                  <p className="text-xl font-bold text-primary">
                    AED {tenant.securityDeposit?.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-medium">{tenant.paymentFrequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">Day {tenant.paymentDueDate} of each month</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{tenant.paymentMethod?.replace('_', ' ')}</p>
                  </div>
                  {tenant.pdcChequeCount && tenant.pdcChequeCount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">PDC Cheques</p>
                      <p className="font-medium">{tenant.pdcChequeCount} cheques</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Payment History</h3>
              <p className="text-muted-foreground">
                Payment history and invoices will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>Tenant documents and files</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.documents && tenant.documents.length > 0 ? (
                <div className="space-y-2">
                  {tenant.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.documentType.replace('_', ' ')} •{' '}
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Start Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Checkout Process</DialogTitle>
            <DialogDescription>
              You are about to initiate the checkout process for{' '}
              <strong>
                {tenant.firstName} {tenant.lastName}
              </strong>
              . This will:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground py-4">
            <li>Update the tenant status to &quot;Moving Out&quot;</li>
            <li>Create a checkout record</li>
            <li>Send notification to the tenant</li>
            <li>Start the deposit refund process</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStartCheckout}>
              <LogOut className="h-4 w-4 mr-2" />
              Start Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
