'use client';

/**
 * Expense Detail Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #7: Expense detail view with payment functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import {
  getExpenseById,
  deleteExpense,
  getReceiptDownloadUrl,
} from '@/services/expense.service';
import {
  ExpenseDetail,
  PaymentStatus,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatExpenseCurrency,
} from '@/types/expense';
import { PaymentMethod } from '@/types/tenant';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  Receipt,
  Building2,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  User,
  Briefcase,
  ClipboardList,
} from 'lucide-react';
import ExpensePaymentDialog from '@/components/expenses/ExpensePaymentDialog';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const expenseId = params.id as string;

  // State
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Fetch expense
  const fetchExpense = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExpenseById(expenseId);
      setExpense(data);
    } catch (error) {
      console.error('Failed to fetch expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense details',
        variant: 'destructive',
      });
      router.push('/expenses');
    } finally {
      setIsLoading(false);
    }
  }, [expenseId, toast, router]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  // Handlers
  const handleBack = () => {
    router.push('/expenses');
  };

  const handleEdit = () => {
    router.push(`/expenses/${expenseId}/edit`);
  };

  const handleDelete = async () => {
    if (!expense) return;

    try {
      setIsDeleting(true);
      await deleteExpense(expenseId);
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
        variant: 'success',
      });
      router.push('/expenses');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!expense?.receiptFilePath) return;

    try {
      const downloadUrl = await getReceiptDownloadUrl(expenseId);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to get receipt URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    fetchExpense();
    toast({
      title: 'Success',
      description: 'Expense marked as paid',
      variant: 'success',
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: PaymentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'default';
      case PaymentStatus.PENDING:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!expense) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="page-expense-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {expense.expenseNumber}
            </h1>
            <p className="text-muted-foreground">
              Expense Details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {expense.canBePaid && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          {expense.editable && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Expense Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={getStatusBadgeVariant(expense.paymentStatus)}>
                {PAYMENT_STATUS_LABELS[expense.paymentStatus]}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline">
                {EXPENSE_CATEGORY_LABELS[expense.category]}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold">
                {formatExpenseCurrency(expense.amount)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Expense Date</span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
              </span>
            </div>
            <Separator />
            <div>
              <span className="text-muted-foreground block mb-2">Description</span>
              <p className="text-sm">{expense.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expense.paymentStatus === PaymentStatus.PAID ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>
                    {expense.paymentMethod
                      ? PAYMENT_METHOD_LABELS[expense.paymentMethod as PaymentMethod]
                      : '-'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Date</span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {expense.paymentDate
                      ? format(new Date(expense.paymentDate), 'dd MMM yyyy')
                      : '-'}
                  </span>
                </div>
                {expense.transactionReference && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Transaction Ref</span>
                      <span className="font-mono text-sm">
                        {expense.transactionReference}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Payment pending
                </p>
                {expense.canBePaid && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Related Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expense.vendorCompanyName && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Vendor
                  </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => router.push(`/property-manager/vendors/${expense.vendorId}`)}
                  >
                    {expense.vendorCompanyName}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <Separator />
              </>
            )}
            {expense.propertyName && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property
                  </span>
                  <span>{expense.propertyName}</span>
                </div>
                <Separator />
              </>
            )}
            {expense.workOrderNumber && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Work Order
                  </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => router.push(`/property-manager/work-orders/${expense.workOrderId}`)}
                  >
                    {expense.workOrderNumber}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <Separator />
              </>
            )}
            {!expense.vendorCompanyName && !expense.propertyName && !expense.workOrderNumber && (
              <div className="text-center py-8 text-muted-foreground">
                No related entities
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expense.receiptFilePath ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{expense.receiptFileName || 'Receipt'}</p>
                    <p className="text-sm text-muted-foreground">
                      Click to download
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDownloadReceipt}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  No receipt uploaded
                </p>
                {expense.editable && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleEdit}
                  >
                    Upload Receipt
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Audit Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <span className="text-muted-foreground text-sm">Recorded By</span>
              <p className="font-medium">{expense.recordedByName || 'System'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Created At</span>
              <p className="font-medium">
                {format(new Date(expense.createdAt), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Last Updated</span>
              <p className="font-medium">
                {format(new Date(expense.updatedAt), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete expense {expense.expenseNumber}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <ExpensePaymentDialog
          expense={expense}
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
