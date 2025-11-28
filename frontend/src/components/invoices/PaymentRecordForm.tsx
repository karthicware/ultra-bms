'use client';

/**
 * Payment Recording Form Component
 * Story 6.1: Rent Invoicing and Payment Management
 * AC #7: Payment recording with receipt generation
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { recordPayment } from '@/services/invoice.service';
import {
  paymentCreateSchema,
  createPaymentSchemaWithMaxAmount,
  paymentCreateDefaults,
  type PaymentCreateFormData,
} from '@/lib/validations/invoice';
import { PaymentMethod } from '@/types/tenant';
import { formatCurrency, PAYMENT_METHOD_OPTIONS } from '@/types/invoice';

interface PaymentRecordFormProps {
  invoiceId: string;
  balanceAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentRecordForm({
  invoiceId,
  balanceAmount,
  onSuccess,
  onCancel,
}: PaymentRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create schema with max amount validation
  const schema = createPaymentSchemaWithMaxAmount(balanceAmount);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentResolver: any = zodResolver(schema);
  const form = useForm<PaymentCreateFormData>({
    resolver: paymentResolver,
    defaultValues: {
      ...paymentCreateDefaults,
      amount: balanceAmount,
    },
  });

  const onSubmit = async (data: PaymentCreateFormData) => {
    try {
      setIsSubmitting(true);
      await recordPayment(invoiceId, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        transactionReference: data.transactionReference || undefined,
        notes: data.notes || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to record payment:', error);
      form.setError('root', {
        message: 'Failed to record payment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Outstanding balance: {formatCurrency(balanceAmount)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormItem>
              <FormLabel>Payment Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} max={new Date().toISOString().split('T')[0]} />
              </FormControl>
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
              <FormLabel>Transaction Reference (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Bank ref, cheque number, etc."
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Bank transfer reference, cheque number, or card authorization code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes..."
                  className="resize-none"
                  rows={2}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error message */}
        {form.formState.errors.root && (
          <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
