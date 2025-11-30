'use client';

/**
 * Renewal Requests Management Page
 * Story 3.6: Tenant Lease Extension and Renewal (AC: #11)
 *
 * Property manager view for reviewing and processing tenant renewal requests
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  Filter,
  Loader2,
} from 'lucide-react';

import {
  getRenewalRequests,
  approveRenewalRequest,
  rejectRenewalRequest,
  getPendingRenewalRequestsCount,
} from '@/services/lease.service';
import { getProperties } from '@/services/tenant.service';
import type { RenewalRequest, RenewalRequestFilters, RenewalRequestPage } from '@/types/lease';
import { RenewalRequestStatus } from '@/types/lease';
import type { Property } from '@/types';

/**
 * Get status badge styling
 */
function getStatusBadge(status: RenewalRequestStatus) {
  switch (status) {
    case RenewalRequestStatus.PENDING:
      return {
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock,
        label: 'Pending',
      };
    case RenewalRequestStatus.APPROVED:
      return {
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle2,
        label: 'Approved',
      };
    case RenewalRequestStatus.REJECTED:
      return {
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle,
        label: 'Rejected',
      };
    default:
      return {
        className: '',
        icon: FileText,
        label: status,
      };
  }
}

/**
 * Rejection Dialog Component
 */
function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  request,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  request: RenewalRequest | null;
  isSubmitting: boolean;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Renewal Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this renewal request. The tenant will be notified
            via email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {request && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <div className="font-medium">{request.tenant?.firstName} {request.tenant?.lastName}</div>
              <div className="text-muted-foreground">{request.requestNumber}</div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for rejecting this request..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows={4}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Request Details Dialog
 */
function RequestDetailsDialog({
  isOpen,
  onClose,
  request,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: RenewalRequest | null;
}) {
  if (!request) return null;

  const statusBadge = getStatusBadge(request.status as RenewalRequestStatus);
  const StatusIcon = statusBadge.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Renewal Request Details</DialogTitle>
          <DialogDescription>{request.requestNumber}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Tenant
              </span>
              <p className="font-medium">
                {request.tenant?.firstName} {request.tenant?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{request.tenant?.tenantNumber}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <div>
                <Badge className={statusBadge.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusBadge.label}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Requested On
              </span>
              <p className="font-medium">
                {format(new Date(request.requestedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Preferred Term</span>
              <p className="font-medium">{request.preferredTerm.replace('_', ' ')}</p>
            </div>
          </div>

          {request.comments && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Tenant Comments
              </span>
              <p className="text-sm bg-muted rounded-lg p-3">{request.comments}</p>
            </div>
          )}

          {request.status === 'REJECTED' && request.rejectedReason && (
            <div className="space-y-1">
              <span className="text-sm text-destructive font-medium">Rejection Reason</span>
              <p className="text-sm bg-red-50 text-red-800 rounded-lg p-3 dark:bg-red-950 dark:text-red-300">
                {request.rejectedReason}
              </p>
            </div>
          )}

          {request.processedAt && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Processed On</span>
              <p className="font-medium">
                {format(new Date(request.processedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Main Renewal Requests Management Page
 */
export default function RenewalRequestsPage() {
  const router = useRouter();

  // State
  const [requests, setRequests] = useState<RenewalRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [propertyFilter, setPropertyFilter] = useState<string>('');

  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const filters: RenewalRequestFilters = {};
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter as RenewalRequestStatus;
      }
      if (propertyFilter) {
        filters.propertyId = propertyFilter;
      }

      const [requestsData, propertiesData, count] = await Promise.all([
        getRenewalRequests(filters, currentPage, pageSize),
        getProperties(),
        getPendingRenewalRequestsCount(),
      ]);

      setRequests(requestsData.content);
      setTotalPages(requestsData.totalPages);
      setTotalElements(requestsData.totalElements);
      setProperties(propertiesData);
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to fetch renewal requests:', error);
      toast.error('Load Error', { description: 'Failed to load renewal requests' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, propertyFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleApprove = async (request: RenewalRequest) => {
    try {
      setIsProcessing(true);
      await approveRenewalRequest(request.id);
      toast.success('Request Approved', { description: 'Redirecting to lease extension...' });
      // Redirect to lease extension page for the tenant
      router.push(`/leases/extensions/${request.tenantId}`);
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Approval Failed', { description: 'Failed to approve request' });
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      await rejectRenewalRequest(selectedRequest.id, { reason });
      toast.success('Request Rejected', { description: 'Tenant has been notified.' });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Rejection Failed', { description: 'Failed to reject request' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (request: RenewalRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleOpenRejectDialog = (request: RenewalRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Renewal Requests</h1>
            <p className="text-muted-foreground">
              Review and process tenant lease renewal requests
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                {pendingCount}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{totalElements}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              onClick={() => setStatusFilter('PENDING')}
              className="mt-2"
            >
              View Pending
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {!isLoading && pendingCount > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Requests Awaiting Review</AlertTitle>
          <AlertDescription className="text-yellow-700">
            There are {pendingCount} renewal requests pending your review.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Property</Label>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Renewal Requests</CardTitle>
          <CardDescription>
            Showing {requests.length} of {totalElements} requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No renewal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Preferred Term</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const statusBadge = getStatusBadge(request.status as RenewalRequestStatus);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.requestNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {request.tenant?.firstName} {request.tenant?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {request.tenant?.tenantNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{request.preferredTerm.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {format(new Date(request.requestedAt), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              View
                            </Button>
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleApprove(request)}
                                  disabled={isProcessing}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleOpenRejectDialog(request)}
                                  disabled={isProcessing}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <RequestDetailsDialog
        isOpen={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      <RejectDialog
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleReject}
        request={selectedRequest}
        isSubmitting={isProcessing}
      />
    </div>
  );
}
