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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSignIcon } from 'lucide-react';

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
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSignIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="baseRent"
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-9 pr-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-base-rent"
                      />
                    </FormControl>
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                      AED
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Monthly base rent amount
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
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSignIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="serviceCharge"
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-9 pr-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-service-charge"
                      />
                    </FormControl>
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                      AED
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Monthly service charge (optional)
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
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSignIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="adminFee"
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-9 pr-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-admin-fee"
                      />
                    </FormControl>
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                      AED
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    One-time administrative fee (optional)
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
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSignIcon className="size-4" />
                    </div>
                    <FormControl>
                      <Input
                        id="securityDeposit"
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-9 pr-14"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-security-deposit"
                      />
                    </FormControl>
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm">
                      AED
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Typically 1-2 months rent (refundable)
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
