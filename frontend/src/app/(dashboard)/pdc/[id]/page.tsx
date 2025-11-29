'use client';

/**
 * PDC Detail Page
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #14: PDC Detail with header, holder info, status timeline
 * AC #15: Action buttons based on current status
 */

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { usePDC, usePDCHolder } from '@/hooks/usePDCs';
import { PDCStatusBadge } from '@/components/pdc/PDCStatusBadge';
import {
  formatPDCCurrency,
  PDCStatus,
  canDepositPDC,
  canClearPDC,
  canBouncePDC,
  canReplacePDC,
  canWithdrawPDC,
  canCancelPDC,
  isPDCFinalState,
  getNewPaymentMethodLabel,
} from '@/types/pdc';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Undo2,
  Ban,
  Calendar,
  User,
  FileText,
  Clock,
  CreditCard,
  Building,
  ExternalLink,
  Hash,
  Phone,
  Mail,
} from 'lucide-react';
import { useState } from 'react';
import { PDCDepositModal } from '@/components/pdc/PDCDepositModal';
import { PDCClearModal } from '@/components/pdc/PDCClearModal';
import { PDCBounceModal } from '@/components/pdc/PDCBounceModal';
import { PDCReplaceModal } from '@/components/pdc/PDCReplaceModal';
import { PDCWithdrawModal } from '@/components/pdc/PDCWithdrawModal';
import { PDCCancelDialog } from '@/components/pdc/PDCCancelDialog';

type ActionModalType = 'deposit' | 'clear' | 'bounce' | 'replace' | 'withdraw' | 'cancel' | null;

// Helper to get initial modal from URL
function getInitialModalFromUrl(searchParams: URLSearchParams): ActionModalType {
  const action = searchParams.get('action');
  if (action && ['deposit', 'clear', 'bounce', 'replace', 'withdraw', 'cancel'].includes(action)) {
    return action as ActionModalType;
  }
  return null;
}

export default function PDCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pdcId = params?.id as string;

  const { data: pdc, isLoading, error, refetch } = usePDC(pdcId);
  const { data: holder } = usePDCHolder();

  // Modal state - initialize from URL param
  const [activeModal, setActiveModal] = useState<ActionModalType>(() =>
    getInitialModalFromUrl(searchParams)
  );

  const closeModal = () => {
    setActiveModal(null);
    // Remove action param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    window.history.replaceState({}, '', url.toString());
    // Refetch data after action
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !pdc) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load PDC details. The PDC may not exist or you may not have permission to view it.
            <Button variant="link" onClick={() => router.back()} className="ml-2">
              Go Back
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-pdc-detail">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                PDC #{pdc.chequeNumber}
              </h1>
              <PDCStatusBadge status={pdc.status} />
            </div>
            <p className="text-muted-foreground">
              {pdc.bankName} &bull; {formatPDCCurrency(pdc.amount)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!isPDCFinalState(pdc.status) && (
          <div className="flex flex-wrap gap-2">
            {canDepositPDC(pdc.status) && (
              <Button onClick={() => setActiveModal('deposit')}>
                <Building2 className="mr-2 h-4 w-4" />
                Mark as Deposited
              </Button>
            )}
            {canClearPDC(pdc.status) && (
              <Button
                variant="outline"
                className="text-green-600 hover:text-green-700"
                onClick={() => setActiveModal('clear')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Cleared
              </Button>
            )}
            {canBouncePDC(pdc.status) && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setActiveModal('bounce')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Report Bounce
              </Button>
            )}
            {canReplacePDC(pdc.status) && (
              <Button onClick={() => setActiveModal('replace')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Replace with New PDC
              </Button>
            )}
            {canWithdrawPDC(pdc.status) && (
              <Button variant="outline" onClick={() => setActiveModal('withdraw')}>
                <Undo2 className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            )}
            {canCancelPDC(pdc.status) && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setActiveModal('cancel')}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bounced Alert */}
      {pdc.status === PDCStatus.BOUNCED && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Bounced Cheque</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              This cheque bounced on {pdc.bouncedDate && format(new Date(pdc.bouncedDate), 'MMM dd, yyyy')}.
              {pdc.bounceReason && ` Reason: ${pdc.bounceReason}`}
            </p>
            <p className="text-sm">
              Please register a replacement cheque from the tenant to resolve this issue.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - PDC Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* PDC Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cheque Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cheque Number</p>
                  <p className="font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {pdc.chequeNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {pdc.bankName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold text-primary">
                    {formatPDCCurrency(pdc.amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cheque Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(pdc.chequeDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Deposit Info */}
              {pdc.depositDate && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Deposit Date</p>
                    <p className="font-medium">
                      {format(new Date(pdc.depositDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  {pdc.bankAccount && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Deposited To</p>
                      <p className="font-medium">
                        {pdc.bankAccount.bankName} ({pdc.bankAccount.maskedAccountNumber})
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cleared/Bounced Info */}
              {pdc.clearedDate && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <CheckCircle className="inline mr-2 h-4 w-4" />
                    Cleared on {format(new Date(pdc.clearedDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              )}

              {pdc.bouncedDate && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <AlertTriangle className="inline mr-2 h-4 w-4" />
                    Bounced on {format(new Date(pdc.bouncedDate), 'MMMM dd, yyyy')}
                    {pdc.bounceReason && ` - ${pdc.bounceReason}`}
                  </p>
                </div>
              )}

              {/* Withdrawal Info */}
              {pdc.withdrawalDate && (
                <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-900/20">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <Undo2 className="inline mr-2 h-4 w-4" />
                    Withdrawn on {format(new Date(pdc.withdrawalDate), 'MMMM dd, yyyy')}
                    {pdc.withdrawalReason && ` - ${pdc.withdrawalReason}`}
                  </p>
                  {pdc.newPaymentMethod && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Replacement payment method: {getNewPaymentMethodLabel(pdc.newPaymentMethod)}
                    </p>
                  )}
                </div>
              )}

              {/* Replacement Info */}
              {pdc.status === PDCStatus.REPLACED && pdc.replacementChequeNumber && (
                <div className="p-3 rounded-md bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <RefreshCw className="inline mr-2 h-4 w-4" />
                    Replaced with cheque #{pdc.replacementChequeNumber}
                    <Button
                      variant="link"
                      size="sm"
                      className="text-purple-600 p-0 h-auto ml-2"
                      onClick={() => router.push(`/pdc/${pdc.replacementChequeId}`)}
                    >
                      View <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </p>
                </div>
              )}

              {/* Original Cheque Info */}
              {pdc.originalChequeNumber && (
                <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-muted-foreground">
                    This is a replacement for bounced cheque #{pdc.originalChequeNumber}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-2"
                      onClick={() => router.push(`/pdc/${pdc.originalChequeId}`)}
                    >
                      View Original <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </p>
                </div>
              )}

              {/* Notes */}
              {pdc.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{pdc.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {pdc.statusHistory && pdc.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {pdc.statusHistory.map((transition, index) => (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < pdc.statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-1" />
                        )}
                      </div>

                      {/* Timeline Content */}
                      <div className="flex-1 -mt-1">
                        <div className="flex items-center gap-2">
                          <PDCStatusBadge status={transition.toStatus} showIcon={false} />
                          {transition.fromStatus && (
                            <span className="text-sm text-muted-foreground">
                              from {transition.fromStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(transition.transitionDate), 'MMM dd, yyyy HH:mm')}
                          {' '}&bull;{' '}
                          by {transition.performedByName}
                        </p>
                        {transition.notes && (
                          <p className="text-sm mt-1">{transition.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Replacement Chain (if bounced PDC was replaced) */}
          {pdc.replacementChain && pdc.replacementChain.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Replacement Chain
                </CardTitle>
                <CardDescription>
                  History of cheques in this replacement chain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pdc.replacementChain.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-8">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{item.chequeNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.chequeDate), 'MMM dd, yyyy')} &bull; {formatPDCCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PDCStatusBadge status={item.status} showIcon={false} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/pdc/${item.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tenant & Links */}
        <div className="space-y-6">
          {/* PDC Holder Card */}
          {holder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  PDC Holder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{holder.companyName}</p>
                {holder.legalCompanyName && (
                  <p className="text-sm text-muted-foreground">
                    {holder.legalCompanyName}
                  </p>
                )}
                {holder.tradeLicenseNumber && (
                  <p className="text-sm text-muted-foreground mt-1">
                    TL#: {holder.tradeLicenseNumber}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tenant Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{pdc.tenant?.fullName || pdc.tenantName}</p>
              </div>
              {pdc.tenant?.email && (
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {pdc.tenant.email}
                </p>
              )}
              {pdc.tenant?.phone && (
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {pdc.tenant.phone}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/tenants/${pdc.tenantId}`)}
              >
                View Tenant Profile
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Lease Info Card */}
          {pdc.lease && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Linked Lease
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">
                  Unit {pdc.lease.unitNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pdc.lease.propertyName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(pdc.lease.startDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(pdc.lease.endDate), 'MMM dd, yyyy')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/leases/${pdc.leaseId}`)}
                >
                  View Lease
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Invoice Info Card */}
          {pdc.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Linked Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">
                  {pdc.invoice.invoiceNumber}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span>{formatPDCCurrency(pdc.invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={pdc.invoice.balanceAmount > 0 ? 'text-amber-600' : 'text-green-600'}>
                    {formatPDCCurrency(pdc.invoice.balanceAmount)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/invoices/${pdc.invoiceId}`)}
                >
                  View Invoice
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Created Info */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(pdc.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created By</span>
                <span>{pdc.createdByName || pdc.createdBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{format(new Date(pdc.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Modals */}
      <PDCDepositModal
        pdc={pdc}
        open={activeModal === 'deposit'}
        onClose={closeModal}
      />
      <PDCClearModal
        pdc={pdc}
        open={activeModal === 'clear'}
        onClose={closeModal}
      />
      <PDCBounceModal
        pdc={pdc}
        open={activeModal === 'bounce'}
        onClose={closeModal}
      />
      <PDCReplaceModal
        pdc={pdc}
        open={activeModal === 'replace'}
        onClose={closeModal}
      />
      <PDCWithdrawModal
        pdc={pdc}
        open={activeModal === 'withdraw'}
        onClose={closeModal}
      />
      <PDCCancelDialog
        pdc={pdc}
        open={activeModal === 'cancel'}
        onClose={closeModal}
      />
    </div>
  );
}
