'use client';

/**
 * Step 3: Rent Breakdown
 * Enter rent, fees, and deposits with real-time total calculation
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
import { Alert, AlertDescription } from '@/components/ui/alert';

import { rentBreakdownSchema, formatCurrency, type RentBreakdownFormData } from '@/lib/validations/tenant';

interface RentBreakdownStepProps {
  data: RentBreakdownFormData;
  onComplete: (data: RentBreakdownFormData) => void;
  onBack: () => void;
}

export function RentBreakdownStep({ data, onComplete, onBack }: RentBreakdownStepProps) {
  const form = useForm<RentBreakdownFormData>({
    resolver: zodResolver(rentBreakdownSchema),
    defaultValues: data,
  });

  const baseRent = form.watch('baseRent') || 0;
  const serviceCharge = form.watch('serviceCharge') || 0;
  const adminFee = form.watch('adminFee') || 0;
  const securityDeposit = form.watch('securityDeposit') || 0;

  // Real-time calculation
  const totalMonthlyRent = baseRent + serviceCharge;
  const totalFirstPayment = securityDeposit + adminFee + totalMonthlyRent;

  const onSubmit = (values: RentBreakdownFormData) => {
    onComplete({
      ...values,
      totalMonthlyRent,
    });
  };

  return (
    <Card data-testid="step-rent-breakdown">
      <CardHeader>
        <CardTitle>Rent Breakdown</CardTitle>
        <CardDescription>
          Enter rent, service charges, fees, and deposits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Base Rent */}
            <FormField
              control={form.control}
              name="baseRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Rent (Monthly) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">AED</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-base-rent"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Monthly base rent amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Charge */}
            <FormField
              control={form.control}
              name="serviceCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Charge (Monthly)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">AED</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-service-charge"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Monthly service charge (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Fee */}
            <FormField
              control={form.control}
              name="adminFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Fee (One-time)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">AED</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-admin-fee"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    One-time administrative fee (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Security Deposit */}
            <FormField
              control={form.control}
              name="securityDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security Deposit *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">AED</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-security-deposit"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Typically 1-2 months rent (refundable)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Monthly Rent:</span>
                    <span className="font-semibold" data-testid="text-total-monthly-rent">
                      {formatCurrency(totalMonthlyRent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total First Payment:</span>
                    <span className="font-semibold" data-testid="text-total-first-payment">
                      {formatCurrency(totalFirstPayment)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    First payment = Security Deposit + Admin Fee + First Month Rent
                  </p>
                </div>
              </AlertDescription>
            </Alert>

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
                Next: Parking Allocation
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
