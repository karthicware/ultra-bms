'use client';

/**
 * Deposit Calculation Step Component
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #6, #7 - Deposit calculation with deductions
 */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Calculator,
  DollarSign,
  AlertCircle,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  depositCalculationSchema,
  type DepositCalculationFormData,
} from '@/lib/validations/checkout';
import { checkoutService } from '@/services/checkout.service';
import type { TenantCheckout, DepositRefund, OutstandingAmounts } from '@/types/checkout';
import { DeductionType } from '@/types/checkout';

interface DepositCalculationStepProps {
  checkout: TenantCheckout;
  depositRefund: DepositRefund | null;
  outstandingAmounts: OutstandingAmounts | null;
  onDepositSaved: (refund: DepositRefund) => void;
  onBack: () => void;
}

// Deduction type labels
const DEDUCTION_LABELS: Record<DeductionType, string> = {
  [DeductionType.UNPAID_RENT]: 'Unpaid Rent',
  [DeductionType.UNPAID_UTILITIES]: 'Unpaid Utilities',
  [DeductionType.DAMAGE_REPAIRS]: 'Damage Repair',
  [DeductionType.CLEANING_FEE]: 'Cleaning Fee',
  [DeductionType.KEY_REPLACEMENT]: 'Key Replacement',
  [DeductionType.EARLY_TERMINATION_PENALTY]: 'Early Termination Fee',
  [DeductionType.OTHER]: 'Other',
};

export function DepositCalculationStep({
  checkout,
  depositRefund,
  outstandingAmounts,
  onDepositSaved,
  onBack,
}: DepositCalculationStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate initial deductions from outstanding amounts
  const getInitialDeductions = () => {
    const deductions: DepositCalculationFormData['deductions'] = [];

    if (depositRefund?.deductions) {
      return depositRefund.deductions.map((d) => ({
        type: d.type,
        description: d.description ?? '',
        amount: d.amount,
        notes: d.notes ?? '',
        autoCalculated: d.autoCalculated ?? false,
      }));
    }

    // Auto-populate from outstanding amounts
    if (outstandingAmounts) {
      if (outstandingAmounts.unpaidRent > 0) {
        deductions.push({
          type: DeductionType.UNPAID_RENT,
          description: 'Outstanding rent invoices',
          amount: outstandingAmounts.unpaidRent,
          notes: '',
          autoCalculated: true,
        });
      }
      if (outstandingAmounts.unpaidUtilities > 0) {
        deductions.push({
          type: DeductionType.UNPAID_UTILITIES,
          description: 'Outstanding utility charges',
          amount: outstandingAmounts.unpaidUtilities,
          notes: '',
          autoCalculated: true,
        });
      }
    }

    // Add early termination fee if applicable
    if (checkout.isEarlyTermination) {
      deductions.push({
        type: DeductionType.EARLY_TERMINATION_PENALTY,
        description: 'Early termination penalty',
        amount: checkout.monthlyRent ?? 0, // One month rent as penalty
        notes: 'As per lease agreement',
        autoCalculated: true,
      });
    }

    return deductions;
  };

  // Form setup
  const form = useForm<DepositCalculationFormData>({
    resolver: zodResolver(depositCalculationSchema),
    defaultValues: {
      originalDeposit: checkout.securityDeposit ?? 0,
      deductions: getInitialDeductions(),
      notes: depositRefund?.notes ?? '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'deductions',
  });

  const watchedDeductions = form.watch('deductions');
  const watchedOriginalDeposit = form.watch('originalDeposit');

  // Calculate totals
  const totalDeductions = watchedDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
  const netRefund = Math.max(0, watchedOriginalDeposit - totalDeductions);
  const amountOwed = Math.max(0, totalDeductions - watchedOriginalDeposit);

  // Add new deduction
  const handleAddDeduction = () => {
    append({
      type: DeductionType.OTHER,
      description: '',
      amount: 0,
      notes: '',
      autoCalculated: false,
    });
  };

  // Handle form submission
  const handleSubmit = async (data: DepositCalculationFormData) => {
    try {
      setIsSubmitting(true);

      const result = await checkoutService.saveDepositCalculation(
        checkout.tenantId,
        checkout.id,
        {
          originalDeposit: data.originalDeposit,
          deductions: data.deductions,
          notes: data.notes,
        }
      );

      // Fetch updated deposit refund
      const refund = await checkoutService.getDepositRefund(checkout.id);
      if (refund) {
        onDepositSaved(refund);
      }
    } catch (error) {
      console.error('Failed to save deposit calculation:', error);
      toast.error('Save Error', { description: 'Failed to save deposit calculation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calculation Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Deposit Calculation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Original Deposit</p>
              <p className="text-2xl font-bold">
                AED {watchedOriginalDeposit.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">
                - AED {totalDeductions.toLocaleString()}
              </p>
            </div>
            {netRefund > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Net Refund</p>
                <p className="text-2xl font-bold text-green-600">
                  AED {netRefund.toLocaleString()}
                </p>
              </div>
            )}
            {amountOwed > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600">Amount Owed</p>
                <p className="text-2xl font-bold text-amber-600">
                  AED {amountOwed.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Warning */}
      {outstandingAmounts && outstandingAmounts.totalOutstanding > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Outstanding Amounts Detected</AlertTitle>
          <AlertDescription className="text-amber-700">
            The tenant has AED {outstandingAmounts.totalOutstanding.toLocaleString()} in outstanding
            payments. These have been pre-populated as deductions below.
          </AlertDescription>
        </Alert>
      )}

      {/* Deposit Calculation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Deductions</CardTitle>
          <CardDescription>
            Add and manage deductions from the security deposit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Original Deposit */}
              <FormField
                control={form.control}
                name="originalDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Security Deposit (AED) *</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={0}
                        step={1}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormDescription>
                      The security deposit amount held for this tenant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Deductions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Deductions</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDeduction}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deduction
                  </Button>
                </div>

                {fields.length === 0 && (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No deductions added</p>
                    <p className="text-sm text-muted-foreground">
                      The full deposit will be refunded
                    </p>
                  </div>
                )}

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/30"
                  >
                    {/* Type */}
                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`deductions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(DEDUCTION_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`deductions.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Amount */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`deductions.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Amount (AED)</FormLabel>
                            <FormControl>
                              <NumberInput
                                min={0}
                                step={1}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`deductions.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Notes" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Calculation Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calculation Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any notes about the deposit calculation..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Original Deposit</span>
                  <span className="font-medium">
                    AED {watchedOriginalDeposit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Total Deductions</span>
                  <span className="font-medium">- AED {totalDeductions.toLocaleString()}</span>
                </div>
                <Separator />
                {netRefund > 0 && (
                  <div className="flex justify-between text-green-600 text-lg font-bold">
                    <span>Net Refund to Tenant</span>
                    <span>AED {netRefund.toLocaleString()}</span>
                  </div>
                )}
                {amountOwed > 0 && (
                  <div className="flex justify-between text-amber-600 text-lg font-bold">
                    <span>Amount Owed by Tenant</span>
                    <span>AED {amountOwed.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
