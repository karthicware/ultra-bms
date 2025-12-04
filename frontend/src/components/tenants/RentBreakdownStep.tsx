'use client';

/**
 * Step 3: Rent Breakdown
 * Enter rent, fees, and deposits with real-time total calculation
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
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
    mode: 'onBlur',
    reValidateMode: 'onChange',
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
    onComplete(values);
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
                <FormItem className="space-y-2">
                  <Label htmlFor="baseRent" className="flex items-center gap-1">
                    Base Rent (Monthly) <span className="text-destructive">*</span>
                  </Label>
                  <FormControl>
                    <NumberInput
                      id="baseRent"
                      step={1}
                      min={0}
                      placeholder="0.00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      data-testid="input-base-rent"
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Monthly base rent amount (AED)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Charge */}
            <FormField
              control={form.control}
              name="serviceCharge"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="serviceCharge">Service Charge (Monthly)</Label>
                  <FormControl>
                    <NumberInput
                      id="serviceCharge"
                      step={1}
                      min={0}
                      placeholder="0.00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      data-testid="input-service-charge"
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Monthly service charge - optional (AED)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Fee */}
            <FormField
              control={form.control}
              name="adminFee"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="adminFee">Admin Fee (One-time)</Label>
                  <FormControl>
                    <NumberInput
                      id="adminFee"
                      step={1}
                      min={0}
                      placeholder="0.00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      data-testid="input-admin-fee"
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    One-time administrative fee - optional (AED)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Security Deposit */}
            <FormField
              control={form.control}
              name="securityDeposit"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="securityDeposit" className="flex items-center gap-1">
                    Security Deposit <span className="text-destructive">*</span>
                  </Label>
                  <FormControl>
                    <NumberInput
                      id="securityDeposit"
                      step={1}
                      min={0.01}
                      placeholder="0.00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      data-testid="input-security-deposit"
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Typically 1-2 months rent - refundable (AED)
                  </p>
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
