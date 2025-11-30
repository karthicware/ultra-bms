'use client';

/**
 * Final Settlement Step Component
 * Story 3.7: Tenant Checkout and Deposit Refund Processing
 * AC: #8 - Final settlement and checkout completion
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  AlertTriangle,
  CreditCard,
  Building2,
  Banknote,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  finalSettlementSchema,
  type FinalSettlementFormData,
} from '@/lib/validations/checkout';
import { checkoutService } from '@/services/checkout.service';
import type { TenantCheckout, DepositRefund, OutstandingAmounts } from '@/types/checkout';
import { RefundMethod, RefundStatus } from '@/types/checkout';

interface FinalSettlementStepProps {
  checkout: TenantCheckout;
  depositRefund: DepositRefund;
  outstandingAmounts: OutstandingAmounts | null;
  onCompleted: () => void;
  onBack: () => void;
}

export function FinalSettlementStep({
  checkout,
  depositRefund,
  outstandingAmounts,
  onCompleted,
  onBack,
}: FinalSettlementStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const hasRefund = depositRefund.netRefund && depositRefund.netRefund > 0;
  const refundProcessed = depositRefund.refundStatus === RefundStatus.COMPLETED;

  // Form setup
  const form = useForm<FinalSettlementFormData>({
    resolver: zodResolver(finalSettlementSchema),
    defaultValues: {
      settlementType: hasRefund ? 'FULL' : 'PARTIAL',
      settlementNotes: '',
      acknowledgeFinalization: false,
      refundMethod: RefundMethod.BANK_TRANSFER,
      bankName: '',
      accountHolderName: '',
      iban: '',
      swiftCode: '',
      chequeNumber: '',
    },
  });

  const watchedRefundMethod = form.watch('refundMethod');
  const watchedAcknowledge = form.watch('acknowledgeFinalization');

  // Handle refund processing
  const handleProcessRefund = async () => {
    if (!hasRefund) return;

    const values = form.getValues();

    // Ensure refund method is selected
    if (!values.refundMethod) {
      toast.error('Selection Required', { description: 'Please select a refund method' });
      return;
    }

    try {
      setIsProcessingRefund(true);

      await checkoutService.processRefund(checkout.id, {
        refundMethod: values.refundMethod,
        bankName: values.refundMethod === RefundMethod.BANK_TRANSFER ? values.bankName : undefined,
        accountHolderName:
          values.refundMethod === RefundMethod.BANK_TRANSFER ? values.accountHolderName : undefined,
        iban: values.refundMethod === RefundMethod.BANK_TRANSFER ? values.iban : undefined,
        swiftCode: values.refundMethod === RefundMethod.BANK_TRANSFER ? values.swiftCode : undefined,
        chequeNumber: values.refundMethod === RefundMethod.CHEQUE ? values.chequeNumber : undefined,
        notes: values.settlementNotes ?? undefined,
      });

      toast.success('Refund Processed', { description: 'Refund processed successfully!' });
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Refund Error', { description: 'Failed to process refund' });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Handle form submission (complete checkout)
  const handleSubmit = async (data: FinalSettlementFormData) => {
    if (!data.acknowledgeFinalization) {
      toast.error('Acknowledgement Required', { description: 'Please acknowledge the checkout finalization' });
      return;
    }

    try {
      setIsSubmitting(true);

      await checkoutService.completeCheckout(checkout.tenantId, checkout.id, {
        settlementType: data.settlementType,
        settlementNotes: data.settlementNotes ?? undefined,
        acknowledgeFinalization: data.acknowledgeFinalization,
      });

      onCompleted();
    } catch (error) {
      console.error('Failed to complete checkout:', error);
      toast.error('Checkout Error', { description: 'Failed to complete checkout' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settlement Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Settlement Summary
          </CardTitle>
          <CardDescription>Review the final settlement details before completion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Checkout Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Checkout Number</span>
              <p className="font-mono font-medium">{checkout.checkoutNumber}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tenant</span>
              <p className="font-medium">{checkout.tenantName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Unit</span>
              <p className="font-medium">
                {checkout.propertyName} - {checkout.unitNumber}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Move-out Date</span>
              <p className="font-medium">
                {checkout.expectedMoveOutDate
                  ? format(new Date(checkout.expectedMoveOutDate), 'dd MMM yyyy')
                  : 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Summary
            </h4>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Original Security Deposit</span>
                <span className="font-medium">
                  AED {depositRefund.originalDeposit?.toLocaleString() ?? '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Deductions</span>
                <span className="font-medium">
                  - AED {depositRefund.totalDeductions?.toLocaleString() ?? '0.00'}
                </span>
              </div>
              <Separator />
              {hasRefund && (
                <div className="flex justify-between text-green-600 text-lg font-bold">
                  <span>Net Refund</span>
                  <span>AED {depositRefund.netRefund?.toLocaleString() ?? '0.00'}</span>
                </div>
              )}
              {depositRefund.amountOwedByTenant && depositRefund.amountOwedByTenant > 0 && (
                <div className="flex justify-between text-amber-600 text-lg font-bold">
                  <span>Amount Owed by Tenant</span>
                  <span>AED {depositRefund.amountOwedByTenant.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deductions Breakdown */}
          {depositRefund.deductions && depositRefund.deductions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Deductions Breakdown</h4>
              <div className="border rounded-lg divide-y">
                {depositRefund.deductions.map((deduction, index) => (
                  <div key={index} className="flex justify-between p-3">
                    <div>
                      <span className="font-medium">
                        {deduction.type.replace(/_/g, ' ')}
                      </span>
                      {deduction.description && (
                        <p className="text-sm text-muted-foreground">{deduction.description}</p>
                      )}
                    </div>
                    <span className="text-red-600">
                      - AED {deduction.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Processing Card (if applicable) */}
      {hasRefund && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Refund Processing
            </CardTitle>
            <CardDescription>
              {refundProcessed
                ? 'Refund has been processed'
                : 'Select refund method and enter payment details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refundProcessed ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Refund Processed</AlertTitle>
                <AlertDescription className="text-green-700">
                  The refund of AED {depositRefund.netRefund?.toLocaleString()} has been processed
                  via {depositRefund.refundMethod?.replace(/_/g, ' ')}.
                  {depositRefund.transactionId && (
                    <span className="block mt-1">
                      Transaction ID: {depositRefund.transactionId}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <div className="space-y-6">
                  {/* Refund Method */}
                  <FormField
                    control={form.control}
                    name="refundMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refund Method *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select refund method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={RefundMethod.BANK_TRANSFER}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Bank Transfer
                              </div>
                            </SelectItem>
                            <SelectItem value={RefundMethod.CHEQUE}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Cheque
                              </div>
                            </SelectItem>
                            <SelectItem value={RefundMethod.CASH}>
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Cash
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bank Transfer Fields */}
                  {watchedRefundMethod === RefundMethod.BANK_TRANSFER && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Emirates NBD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name as on account" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input placeholder="AE..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="swiftCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SWIFT Code (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="SWIFT/BIC code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Cheque Fields */}
                  {watchedRefundMethod === RefundMethod.CHEQUE && (
                    <div className="p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name="chequeNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cheque Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Cheque number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Process Refund Button */}
                  <Button
                    type="button"
                    onClick={handleProcessRefund}
                    disabled={isProcessingRefund}
                    className="w-full"
                  >
                    {isProcessingRefund ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Refund...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Process Refund (AED {depositRefund.netRefund?.toLocaleString()})
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Final Settlement Form */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Checkout</CardTitle>
          <CardDescription>
            Finalize the checkout process. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Settlement Type */}
              <FormField
                control={form.control}
                name="settlementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FULL">Full Settlement</SelectItem>
                        <SelectItem value="PARTIAL">Partial Settlement</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Full settlement means all outstanding amounts have been cleared
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Settlement Notes */}
              <FormField
                control={form.control}
                name="settlementNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settlement Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any final notes about the settlement..."
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

              {/* Warning */}
              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Important</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Completing the checkout will:
                  <ul className="list-disc list-inside mt-2">
                    <li>Mark the tenant as "Moved Out"</li>
                    <li>Release the unit for new tenants</li>
                    <li>Generate final settlement documents</li>
                    <li>Send completion notification to the tenant</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Acknowledgement */}
              <FormField
                control={form.control}
                name="acknowledgeFinalization"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I acknowledge and confirm</FormLabel>
                      <FormDescription>
                        I confirm that all checkout procedures have been completed, the unit has
                        been inspected, and all financial settlements have been reviewed and
                        approved.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !watchedAcknowledge}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Checkout
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
