'use client';

/**
 * Expense Payment Dialog Component
 * Story 6.2: Expense Management and Vendor Payments
 * AC #7: Mark expense as paid functionality
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { CreditCard, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { markExpenseAsPaid } from '@/services/expense.service';
import type { ExpenseDetail, ExpensePayRequest } from '@/types/expense';
import { formatExpenseCurrency } from '@/types/expense';
import { PaymentMethod } from '@/types/tenant';

// Payment method options
const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PaymentMethod.CARD, label: 'Card' },
  { value: PaymentMethod.CHEQUE, label: 'Cheque' },
];

// Validation schema
const paymentSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod, {
    message: 'Payment method is required',
  }),
  paymentDate: z.date({
    message: 'Payment date is required',
  }),
  transactionReference: z.string().max(100, 'Transaction reference cannot exceed 100 characters').optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface ExpensePaymentDialogProps {
  /** Expense to mark as paid */
  expense: ExpenseDetail;
  /** Whether the dialog is open */
  open: boolean;
  /** Handler when dialog is closed */
  onClose: () => void;
  /** Handler when payment is successful */
  onSuccess: () => void;
}

export default function ExpensePaymentDialog({
  expense,
  open,
  onClose,
  onSuccess,
}: ExpensePaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(),
      transactionReference: '',
    },
  });

  const handleSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);

      const payRequest: ExpensePayRequest = {
        paymentMethod: data.paymentMethod,
        paymentDate: format(data.paymentDate, 'yyyy-MM-dd'),
        transactionReference: data.transactionReference || undefined,
      };

      await markExpenseAsPaid(expense.id, payRequest);
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to mark expense as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark expense as paid. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Mark Expense as Paid
          </DialogTitle>
          <DialogDescription>
            Record payment for expense {expense.expenseNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Expense Summary */}
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-lg font-bold">{formatExpenseCurrency(expense.amount)}</span>
          </div>
          {expense.vendorCompanyName && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendor</span>
              <span className="text-sm">{expense.vendorCompanyName}</span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                      placeholder="e.g., TXN-12345"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional reference number for tracking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
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
  );
}
