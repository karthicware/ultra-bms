'use client';

/**
 * Step 5: Payment Schedule
 * Configure payment frequency, due date, and method
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { paymentScheduleSchema, formatCurrency, type PaymentScheduleFormData } from '@/lib/validations/tenant';
import { PaymentFrequency, PaymentMethod } from '@/types/tenant';

interface PaymentScheduleStepProps {
  data: PaymentScheduleFormData;
  totalMonthlyRent: number;
  onComplete: (data: PaymentScheduleFormData) => void;
  onBack: () => void;
}

export function PaymentScheduleStep({ data, totalMonthlyRent, onComplete, onBack }: PaymentScheduleStepProps) {
  const form = useForm<PaymentScheduleFormData>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: data,
  });

  const paymentMethod = form.watch('paymentMethod');

  const onSubmit = (values: PaymentScheduleFormData) => {
    onComplete(values);
  };

  return (
    <Card data-testid="step-payment-schedule">
      <CardHeader>
        <CardTitle>Payment Schedule</CardTitle>
        <CardDescription>
          Configure payment frequency, due date, and payment method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Monthly Rent Display */}
            <Alert>
              <AlertDescription>
                <div className="flex justify-between">
                  <span className="font-medium">Total Monthly Rent:</span>
                  <span className="font-bold text-lg">{formatCurrency(totalMonthlyRent)}</span>
                </div>
              </AlertDescription>
            </Alert>

            {/* Payment Frequency */}
            <FormField
              control={form.control}
              name="paymentFrequency"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Frequency *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentFrequency.MONTHLY} data-testid="radio-monthly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Monthly - Pay every month
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentFrequency.QUARTERLY} data-testid="radio-quarterly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Quarterly - Pay every 3 months
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentFrequency.YEARLY} data-testid="radio-yearly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Yearly - Pay annually
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Due Date */}
            <FormField
              control={form.control}
              name="paymentDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Due Date (Day of Month) *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-due-date">
                        <SelectValue placeholder="Select day of month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Payment must be received by this day each period
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
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentMethod.BANK_TRANSFER} data-testid="radio-bank-transfer" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Bank Transfer
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentMethod.CHEQUE} data-testid="radio-cheque" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Cheque
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentMethod.PDC} data-testid="radio-pdc" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Post-Dated Cheques (PDC)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentMethod.CASH} data-testid="radio-cash" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Cash
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentMethod.ONLINE} data-testid="radio-online" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Online Payment
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PDC Cheque Count (conditional) */}
            {paymentMethod === PaymentMethod.PDC && (
              <FormField
                control={form.control}
                name="pdcChequeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of PDC Cheques *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="12"
                        placeholder="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-pdc-count"
                      />
                    </FormControl>
                    <FormDescription>
                      Number of post-dated cheques (1-12)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                data-testid="btn-back"
              >
                Back
              </Button>
              <Button type="submit" data-testid="btn-next">
                Next: Document Upload
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
