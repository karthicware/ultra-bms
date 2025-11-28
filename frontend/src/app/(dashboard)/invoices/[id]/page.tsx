'use client';

/**
 * Invoice Detail Page
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #5, #7, #8: View invoice details and record payments
 */

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getInvoiceById, sendInvoice, cancelInvoice } from '@/services/invoice.service';
import {
  InvoiceDetail,
  Payment,
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
  getPaymentMethodLabel,
  formatCurrency,
  canEditInvoice,
  canRecordPayment,
  canCancelInvoice,
  canSendInvoice,
} from '@/types/invoice';
import {
  ArrowLeft,
  Send,
  XCircle,
  Edit,
  Receipt,
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
  CreditCard,
  Plus,
} from 'lucide-react';
import PaymentRecordForm from '@/components/invoices/PaymentRecordForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Fetch invoice
  const fetchInvoice = useCallback(async () => {
    try {
      setIsLoading(true);
      const invoice = await getInvoiceById(id);
      setInvoice(invoice);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Handlers
  const handleSendInvoice = async () => {
    if (!invoice) return;
    try {
      setIsSending(true);
      await sendInvoice(invoice.id);
      toast({
        title: 'Success',
        description: 'Invoice sent successfully',
      });
      fetchInvoice();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoice) return;
    try {
      setIsCancelling(true);
      await cancelInvoice(invoice.id);
      toast({
        title: 'Success',
        description: 'Invoice cancelled successfully',
      });
      fetchInvoice();
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invoice',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePaymentRecorded = () => {
    setShowPaymentDialog(false);
    fetchInvoice();
    toast({
      title: 'Success',
      description: 'Payment recorded successfully',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Invoice not found</h3>
        <Button onClick={() => router.push('/invoices')} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <Badge className={getInvoiceStatusColor(invoice.status)}>
                {getInvoiceStatusLabel(invoice.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created on {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {canEditInvoice(invoice.status) && (
            <Button variant="outline" onClick={() => router.push(`/invoices/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canSendInvoice(invoice.status) && (
            <Button onClick={handleSendInvoice} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          )}
          {canRecordPayment(invoice.status) && (
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment against invoice {invoice.invoiceNumber}
                  </DialogDescription>
                </DialogHeader>
                <PaymentRecordForm
                  invoiceId={invoice.id}
                  balanceAmount={invoice.balanceAmount}
                  onSuccess={handlePaymentRecorded}
                  onCancel={() => setShowPaymentDialog(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          {canCancelInvoice(invoice.status, invoice.paidAmount) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isCancelling}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The invoice will be marked as cancelled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelInvoice}>
                    Cancel Invoice
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tenant & Property Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Tenant Name</div>
              <div className="font-medium">{invoice.tenantName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{invoice.tenantEmail}</div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <span className="text-sm">Property & Unit</span>
            </div>
            <div>
              <div className="font-medium">{invoice.propertyName}</div>
              <div className="text-sm text-muted-foreground">
                Unit {invoice.unitNumber}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Amounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Invoice Date</div>
                <div className="font-medium">
                  {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Due Date</div>
                <div className="font-medium">
                  {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                </div>
              </div>
            </div>
            {invoice.sentAt && (
              <div>
                <div className="text-sm text-muted-foreground">Sent At</div>
                <div className="font-medium">
                  {format(new Date(invoice.sentAt), 'dd MMM yyyy HH:mm')}
                </div>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <div className="text-sm text-muted-foreground">Paid At</div>
                <div className="font-medium text-green-600">
                  {format(new Date(invoice.paidAt), 'dd MMM yyyy HH:mm')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Amount Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Amount Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Rent</span>
              <span>{formatCurrency(invoice.baseRent)}</span>
            </div>
            {invoice.serviceCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charges</span>
                <span>{formatCurrency(invoice.serviceCharges)}</span>
              </div>
            )}
            {invoice.parkingFees > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parking Fees</span>
                <span>{formatCurrency(invoice.parkingFees)}</span>
              </div>
            )}
            {invoice.additionalCharges && invoice.additionalCharges.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="text-sm font-medium">Additional Charges</div>
                {invoice.additionalCharges.map((charge, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{charge.description}</span>
                    <span>{formatCurrency(charge.amount)}</span>
                  </div>
                ))}
              </>
            )}
            {invoice.lateFeeApplied && (
              <div className="flex justify-between text-red-600">
                <span>Late Fee Applied</span>
                <span>Included</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Paid Amount</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-600">
              <span>Balance Due</span>
              <span>{formatCurrency(invoice.balanceAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment History
          </CardTitle>
          <CardDescription>
            {invoice.payments?.length || 0} payments recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!invoice.payments || invoice.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-8 w-8 mb-2" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.transactionReference || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
