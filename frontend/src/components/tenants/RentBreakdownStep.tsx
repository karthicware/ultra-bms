'use client';

/**
 * Step 3: Rent Breakdown
 * Enter rent, fees, and deposits with real-time total calculation
 * SCP-2025-12-07: Redesigned to match Quotation page styling (CurrencyInput, 2-column grid, h-12 rounded-xl border-2)
 * SCP-2025-12-07: Added ChequeBreakdownSection for payment schedule
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Separator } from '@/components/ui/separator';
import { Shield, Receipt, Banknote } from 'lucide-react';

import { rentBreakdownSchema, formatCurrency, type RentBreakdownFormData } from '@/lib/validations/tenant';
import { ChequeBreakdownSection } from '@/components/quotations/ChequeBreakdownSection';
import { FirstMonthPaymentMethod, type ChequeBreakdownItem } from '@/types/quotations';
import { LeaseType } from '@/types/tenant';

// Extended form data to include cheque breakdown details
// SCP-2025-12-07: Added paymentDueDate - moved from Step 5 (Payment Schedule) to Step 3
interface ExtendedRentBreakdownFormData extends RentBreakdownFormData {
  yearlyRentAmount?: number;
  numberOfCheques?: number;
  firstMonthPaymentMethod?: FirstMonthPaymentMethod;
  chequeBreakdown?: ChequeBreakdownItem[];
  firstMonthTotal?: number;
  paymentDueDate?: number; // Day of month (1-31), defaults to 5
}

interface RentBreakdownStepProps {
  data: RentBreakdownFormData;
  onComplete: (data: ExtendedRentBreakdownFormData) => void;
  onBack: () => void;
  leaseStartDate?: Date;
  parkingFee?: number;
  leaseType?: LeaseType;
}

export function RentBreakdownStep({ data, onComplete, onBack, leaseStartDate = new Date(), parkingFee = 0, leaseType }: RentBreakdownStepProps) {
  // SCP-2025-12-07: Show monthly rent section only for FIXED_TERM lease type
  // MONTH_TO_MONTH and YEARLY should not show monthly rent breakdown
  const showMonthlyRent = leaseType === LeaseType.FIXED_TERM;
  // SCP-2025-12-07: Payment Summary section only for FIXED_TERM (not for MONTH_TO_MONTH or YEARLY)
  const showPaymentSummary = leaseType === LeaseType.FIXED_TERM;
  const form = useForm<RentBreakdownFormData>({
    resolver: zodResolver(rentBreakdownSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: data,
  });

  // SCP-2025-12-07: Cheque breakdown state
  const extendedData = data as ExtendedRentBreakdownFormData;
  const [yearlyRentAmount, setYearlyRentAmount] = useState(extendedData.yearlyRentAmount || (data.baseRent * 12));
  const [numberOfCheques, setNumberOfCheques] = useState(extendedData.numberOfCheques || 1);
  const [firstMonthPaymentMethod, setFirstMonthPaymentMethod] = useState<FirstMonthPaymentMethod>(
    extendedData.firstMonthPaymentMethod || FirstMonthPaymentMethod.CHEQUE
  );
  const [chequeBreakdown, setChequeBreakdown] = useState<ChequeBreakdownItem[]>(extendedData.chequeBreakdown || []);
  const [firstMonthTotal, setFirstMonthTotal] = useState(extendedData.firstMonthTotal || 0);
  // SCP-2025-12-07: Payment due date moved from Step 5 to Step 3, default to 5th of month
  const [paymentDueDate, setPaymentDueDate] = useState(extendedData.paymentDueDate || 5);

  const baseRent = form.watch('baseRent') || 0;
  const serviceCharge = form.watch('serviceCharge') || 0;
  const adminFee = form.watch('adminFee') || 0;
  const securityDeposit = form.watch('securityDeposit') || 0;

  // Real-time calculation
  const totalMonthlyRent = baseRent + serviceCharge;
  const totalFirstPayment = securityDeposit + adminFee + totalMonthlyRent;

  // Update yearly rent when base rent changes
  const handleYearlyRentChange = useCallback((value: number) => {
    setYearlyRentAmount(value);
  }, []);

  const handleChequeBreakdownChange = useCallback((breakdown: ChequeBreakdownItem[]) => {
    setChequeBreakdown(breakdown);
  }, []);

  const handleFirstMonthTotalChange = useCallback((value: number) => {
    setFirstMonthTotal(value);
  }, []);

  const onSubmit = (values: RentBreakdownFormData) => {
    // SCP-2025-12-07: Include cheque breakdown data and payment due date in submission
    onComplete({
      ...values,
      yearlyRentAmount,
      numberOfCheques,
      firstMonthPaymentMethod,
      chequeBreakdown,
      firstMonthTotal,
      paymentDueDate, // SCP-2025-12-07: Moved from Step 5 to Step 3
    });
  };

  return (
    <Card data-testid="step-rent-breakdown" className="overflow-visible">
      <CardHeader>
        <CardTitle>Rent Breakdown</CardTitle>
        <CardDescription>
          Enter rent, service charges, fees, and deposits
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-visible">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* SCP-2025-12-07: Monthly Rent Section - only for FIXED_TERM and MONTH_TO_MONTH lease types */}
            {showMonthlyRent && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Monthly Rent
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="baseRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Base Rent (Monthly) *</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-12 rounded-xl border-2"
                            data-testid="input-base-rent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceCharge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Service Charge (Monthly)</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            min={0}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            className="h-12 rounded-xl border-2"
                            data-testid="input-service-charge"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Fees & Deposits Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Fees & Deposits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Security Deposit *</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          min={0}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="h-12 rounded-xl border-2"
                          data-testid="input-security-deposit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Admin Fee (One-time)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          min={0}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="h-12 rounded-xl border-2"
                          data-testid="input-admin-fee"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SCP-2025-12-07: Payment Summary Section - only for FIXED_TERM lease type */}
            {showPaymentSummary && (
              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Rent</span>
                    <span className="font-medium tabular-nums">{formatCurrency(baseRent)}</span>
                  </div>
                  {serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Charge</span>
                      <span className="font-medium tabular-nums">{formatCurrency(serviceCharge)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Monthly Rent</span>
                    <span className="text-primary tabular-nums" data-testid="text-total-monthly-rent">
                      {formatCurrency(totalMonthlyRent)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span className="font-medium tabular-nums">{formatCurrency(securityDeposit)}</span>
                  </div>
                  {adminFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Admin Fee</span>
                      <span className="font-medium tabular-nums">{formatCurrency(adminFee)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total First Payment</span>
                    <span className="text-primary tabular-nums" data-testid="text-total-first-payment">
                      {formatCurrency(totalFirstPayment)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    First payment includes security deposit, admin fee, and first month&apos;s rent
                  </p>
                </div>
              </div>
            )}

            {/* SCP-2025-12-07: Payment Breakdown Section (Cheque/Cash schedule) */}
            <ChequeBreakdownSection
              yearlyRentAmount={yearlyRentAmount}
              numberOfCheques={numberOfCheques}
              firstMonthPaymentMethod={firstMonthPaymentMethod}
              leaseStartDate={leaseStartDate}
              chequeBreakdown={chequeBreakdown}
              paymentDueDate={paymentDueDate}
              onPaymentDueDateChange={setPaymentDueDate}
              securityDeposit={securityDeposit}
              adminFee={adminFee}
              serviceCharges={serviceCharge}
              parkingFee={parkingFee}
              onYearlyRentAmountChange={handleYearlyRentChange}
              onNumberOfChequesChange={setNumberOfCheques}
              onFirstMonthPaymentMethodChange={setFirstMonthPaymentMethod}
              onChequeBreakdownChange={handleChequeBreakdownChange}
              onFirstMonthTotalChange={handleFirstMonthTotalChange}
            />

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
