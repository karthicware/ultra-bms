'use client';

/**
 * Pending Payments Page
 * Story 6.2: Expense Management and Vendor Payments
 * AC #8: Pending payments page with vendor accordion
 * AC #9: Batch payment processing
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getPendingPaymentsByVendor,
  processBatchPayment,
} from '@/services/expense.service';
import type {
  VendorExpenseGroup,
  ExpenseListItem,
  BatchPaymentRequest,
} from '@/types/expense';
import {
  formatExpenseCurrency,
  EXPENSE_CATEGORY_LABELS,
} from '@/types/expense';
import { PaymentMethod } from '@/types/tenant';
import {
  ArrowLeft,
  CreditCard,
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle,
  DollarSign,
  Loader2,
  Receipt,
} from 'lucide-react';

// Payment method options
const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PaymentMethod.CARD, label: 'Card' },
  { value: PaymentMethod.CHEQUE, label: 'Cheque' },
];

// Batch payment validation schema
const batchPaymentSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod, {
    message: 'Payment method is required',
  }),
  paymentDate: z.date({
    message: 'Payment date is required',
  }),
  transactionReference: z.string().max(100, 'Transaction reference cannot exceed 100 characters').optional(),
});

type BatchPaymentFormData = z.infer<typeof batchPaymentSchema>;

export default function PendingPaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [vendorGroups, setVendorGroups] = useState<VendorExpenseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form for batch payment
  const form = useForm<BatchPaymentFormData>({
    resolver: zodResolver(batchPaymentSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(),
      transactionReference: '',
    },
  });

  // Fetch pending payments
  const fetchPendingPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const groups = await getPendingPaymentsByVendor();
      setVendorGroups(groups);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending payments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  // Calculate selected totals
  const selectedTotal = Array.from(selectedExpenses).reduce((sum, expenseId) => {
    for (const group of vendorGroups) {
      const expense = group.expenses.find((e) => e.id === expenseId);
      if (expense) {
        return sum + expense.amount;
      }
    }
    return sum;
  }, 0);

  // Toggle single expense selection
  const toggleExpense = (expenseId: string) => {
    const newSelection = new Set(selectedExpenses);
    if (newSelection.has(expenseId)) {
      newSelection.delete(expenseId);
    } else {
      newSelection.add(expenseId);
    }
    setSelectedExpenses(newSelection);
  };

  // Toggle all expenses in a vendor group
  const toggleVendorExpenses = (vendorId: string, expenses: ExpenseListItem[]) => {
    const newSelection = new Set(selectedExpenses);
    const vendorExpenseIds = expenses.map((e) => e.id);
    const allSelected = vendorExpenseIds.every((id) => newSelection.has(id));

    if (allSelected) {
      vendorExpenseIds.forEach((id) => newSelection.delete(id));
    } else {
      vendorExpenseIds.forEach((id) => newSelection.add(id));
    }
    setSelectedExpenses(newSelection);
  };

  // Select all expenses
  const toggleSelectAll = () => {
    if (selectedExpenses.size === getTotalExpenseCount()) {
      setSelectedExpenses(new Set());
    } else {
      const allIds = vendorGroups.flatMap((g) => g.expenses.map((e) => e.id));
      setSelectedExpenses(new Set(allIds));
    }
  };

  // Get total expense count
  const getTotalExpenseCount = () => {
    return vendorGroups.reduce((sum, g) => sum + g.expenses.length, 0);
  };

  // Process batch payment
  const handleBatchPayment = async (data: BatchPaymentFormData) => {
    if (selectedExpenses.size === 0) {
      toast({
        title: 'No expenses selected',
        description: 'Please select at least one expense to process',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const request: BatchPaymentRequest = {
        expenseIds: Array.from(selectedExpenses),
        paymentMethod: data.paymentMethod,
        paymentDate: format(data.paymentDate, 'yyyy-MM-dd'),
        transactionReference: data.transactionReference || undefined,
      };

      const response = await processBatchPayment(request);

      toast({
        title: 'Batch payment processed',
        description: `${response.data.processedCount} expenses marked as paid${
          response.data.failedCount > 0 ? `, ${response.data.failedCount} failed` : ''
        }`,
      });

      // Reset and refresh
      setSelectedExpenses(new Set());
      setShowBatchDialog(false);
      form.reset();
      fetchPendingPayments();
    } catch (error) {
      console.error('Failed to process batch payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process batch payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-vendor-payments">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/expenses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pending Payments</h1>
            <p className="text-muted-foreground">
              Process vendor payments in batch
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowBatchDialog(true)}
          disabled={selectedExpenses.size === 0}
          data-testid="btn-process-payment"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Selected ({selectedExpenses.size})
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedExpenses.size === getTotalExpenseCount() && getTotalExpenseCount() > 0}
                onCheckedChange={toggleSelectAll}
                disabled={getTotalExpenseCount() === 0}
              />
              <span className="text-sm text-muted-foreground">
                {selectedExpenses.size} of {getTotalExpenseCount()} expenses selected
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Selected Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {formatExpenseCurrency(selectedTotal)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Groups */}
      {vendorGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground">
                No pending payments at the moment
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/expenses')}
              >
                View All Expenses
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {vendorGroups.map((group) => {
            const vendorExpenseIds = group.expenses.map((e) => e.id);
            const selectedCount = vendorExpenseIds.filter((id) => selectedExpenses.has(id)).length;
            const allSelected = selectedCount === group.expenses.length;
            const someSelected = selectedCount > 0 && selectedCount < group.expenses.length;

            return (
              <AccordionItem
                key={group.vendorId || 'no-vendor'}
                value={group.vendorId || 'no-vendor'}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el && someSelected) {
                            (el as unknown as HTMLInputElement).indeterminate = true;
                          }
                        }}
                        onCheckedChange={() => toggleVendorExpenses(group.vendorId || 'no-vendor', group.expenses)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {group.vendorCompanyName || 'No Vendor'}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedCount > 0 && (
                        <Badge variant="outline" className="bg-primary/10">
                          {selectedCount} selected
                        </Badge>
                      )}
                      <span className="font-bold text-lg">
                        {formatExpenseCurrency(group.totalAmount)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-4">
                    {group.expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedExpenses.has(expense.id)
                            ? 'bg-primary/5 border-primary/20'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => toggleExpense(expense.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedExpenses.has(expense.id)}
                            onCheckedChange={() => toggleExpense(expense.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{expense.expenseNumber}</span>
                              <Badge variant="outline" className="text-xs">
                                {EXPENSE_CATEGORY_LABELS[expense.category]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate max-w-md">
                              {expense.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                          </span>
                          <span className="font-medium">
                            {formatExpenseCurrency(expense.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/expenses/${expense.id}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Batch Payment Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Process Batch Payment
            </DialogTitle>
            <DialogDescription>
              Pay {selectedExpenses.size} selected expense{selectedExpenses.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Payment Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                {formatExpenseCurrency(selectedTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="text-sm">{selectedExpenses.size} items</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleBatchPayment)} className="space-y-4">
              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isProcessing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isProcessing}
                          >
                            {field.value ? (
                              format(field.value, 'dd MMM yyyy')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Reference */}
              <FormField
                control={form.control}
                name="transactionReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., BATCH-TXN-12345"
                        {...field}
                        disabled={isProcessing}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional reference for all payments in this batch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBatchDialog(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
