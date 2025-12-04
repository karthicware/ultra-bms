'use client';

/**
 * Notice Details Step Component
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #1, #2 - Checkout initiation with notice details
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, addMonths } from 'date-fns';
import {
  CalendarIcon,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Info,
  DollarSign,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import {
  noticeDetailsSchema,
  type NoticeDetailsFormData,
} from '@/lib/validations/checkout';
import { checkoutService } from '@/services/checkout.service';
import type {
  TenantCheckoutSummary,
  TenantCheckout,
  OutstandingAmounts,
} from '@/types/checkout';
import { CheckoutReason } from '@/types/checkout';

interface NoticeDetailsStepProps {
  tenantId: string;
  tenantSummary: TenantCheckoutSummary;
  checkout: TenantCheckout | null;
  outstandingAmounts: OutstandingAmounts | null;
  onCheckoutInitiated: (checkout: TenantCheckout) => void;
}

export function NoticeDetailsStep({
  tenantId,
  tenantSummary,
  checkout,
  outstandingAmounts,
  onCheckoutInitiated,
}: NoticeDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate if this is early termination
  const isEarlyTermination = tenantSummary.leaseEndDate
    ? new Date() < new Date(tenantSummary.leaseEndDate)
    : false;

  // Form setup
  const form = useForm<NoticeDetailsFormData>({
    resolver: zodResolver(noticeDetailsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      noticeDate: checkout?.noticeDate ? new Date(checkout.noticeDate) : new Date(),
      expectedMoveOutDate: checkout?.expectedMoveOutDate
        ? new Date(checkout.expectedMoveOutDate)
        : addMonths(new Date(), 1),
      checkoutReason: checkout?.checkoutReason ?? CheckoutReason.LEASE_END,
      reasonNotes: checkout?.reasonNotes ?? '',
    },
  });

  const watchedReason = form.watch('checkoutReason');

  // Handle form submission
  const handleSubmit = async (data: NoticeDetailsFormData) => {
    try {
      setIsSubmitting(true);

      const result = await checkoutService.initiateCheckout(tenantId, {
        noticeDate: format(data.noticeDate, 'yyyy-MM-dd'),
        expectedMoveOutDate: format(data.expectedMoveOutDate, 'yyyy-MM-dd'),
        checkoutReason: data.checkoutReason,
        reasonNotes: data.reasonNotes ?? undefined,
      });

      // Fetch the full checkout details after initiating
      const fullCheckout = await checkoutService.getCheckoutByTenant(tenantId);
      if (fullCheckout) {
        onCheckoutInitiated(fullCheckout);
      }
    } catch (error) {
      console.error('Failed to initiate checkout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If checkout already exists, show read-only summary
  if (checkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notice Details</CardTitle>
          <CardDescription>Checkout has been initiated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
              <Info className="h-5 w-5" />
              Checkout Initiated
            </div>
            <p className="text-sm text-green-700">
              Checkout number: <span className="font-mono">{checkout.checkoutNumber}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Notice Date</span>
              <p className="font-medium">
                {checkout.noticeDate
                  ? format(new Date(checkout.noticeDate), 'dd MMM yyyy')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Expected Move-out</span>
              <p className="font-medium">
                {checkout.expectedMoveOutDate
                  ? format(new Date(checkout.expectedMoveOutDate), 'dd MMM yyyy')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Checkout Reason</span>
              <p className="font-medium">{checkout.checkoutReason?.replace(/_/g, ' ') ?? 'N/A'}</p>
            </div>
            {checkout.isEarlyTermination && (
              <div>
                <span className="text-sm text-muted-foreground">Early Termination</span>
                <p className="font-medium text-amber-600">Yes</p>
              </div>
            )}
          </div>

          {checkout.reasonNotes && (
            <div>
              <span className="text-sm text-muted-foreground">Notes</span>
              <p className="text-sm mt-1 p-3 bg-muted rounded">{checkout.reasonNotes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" onClick={() => form.handleSubmit(handleSubmit)()}>
              Continue to Inspection
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notice Details</CardTitle>
        <CardDescription>Enter checkout notice information to begin the process</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Early Termination Warning */}
        {isEarlyTermination && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Early Termination</AlertTitle>
            <AlertDescription>
              The lease has not yet expired. Early termination fees may apply as per the lease
              agreement.
            </AlertDescription>
          </Alert>
        )}

        {/* Outstanding Amount Warning */}
        {outstandingAmounts && outstandingAmounts.totalOutstanding > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Outstanding Payments</AlertTitle>
            <AlertDescription className="text-amber-700">
              This tenant has AED {outstandingAmounts.totalOutstanding.toLocaleString()} in
              outstanding payments. These will be addressed during the deposit calculation step.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Notice Date */}
            <FormField
              control={form.control}
              name="noticeDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Notice Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Select notice date</span>}
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
                  <FormDescription>Date the checkout notice was received</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expected Move-out Date */}
            <FormField
              control={form.control}
              name="expectedMoveOutDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Move-out Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select expected move-out date</span>
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
                        disabled={(date) => date < addDays(new Date(), 1)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>When the tenant expects to vacate the unit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Date Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  form.setValue('expectedMoveOutDate', addDays(new Date(), 30))
                }
              >
                30 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  form.setValue('expectedMoveOutDate', addDays(new Date(), 60))
                }
              >
                60 days
              </Button>
              {tenantSummary.leaseEndDate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form.setValue(
                      'expectedMoveOutDate',
                      new Date(tenantSummary.leaseEndDate!)
                    )
                  }
                >
                  Lease End ({format(new Date(tenantSummary.leaseEndDate), 'dd MMM')})
                </Button>
              )}
            </div>

            {/* Checkout Reason */}
            <FormField
              control={form.control}
              name="checkoutReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Checkout Reason *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select checkout reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CheckoutReason.LEASE_END}>Lease End</SelectItem>
                      <SelectItem value={CheckoutReason.EARLY_TERMINATION}>
                        Early Termination
                      </SelectItem>
                      <SelectItem value={CheckoutReason.MUTUAL_AGREEMENT}>
                        Mutual Agreement
                      </SelectItem>
                      <SelectItem value={CheckoutReason.EVICTION}>Eviction</SelectItem>
                      <SelectItem value={CheckoutReason.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Notes */}
            <FormField
              control={form.control}
              name="reasonNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Additional Notes{' '}
                    {(watchedReason === CheckoutReason.OTHER ||
                      watchedReason === CheckoutReason.EARLY_TERMINATION) &&
                      '*'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional details about the checkout..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchedReason === CheckoutReason.EARLY_TERMINATION
                      ? 'Please provide the reason for early termination'
                      : 'Optional notes about the checkout'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    Initiate Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
