'use client';

/**
 * PDC Withdraw Modal
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #16-20: Withdrawal with reason, date, and optional replacement payment details
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Undo2, Loader2 } from 'lucide-react';
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
import { NumberInput } from '@/components/ui/number-input';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useWithdrawPDC, useBankAccounts } from '@/hooks/usePDCs';
import {
  PDCDetail,
  formatPDCCurrency,
  WITHDRAWAL_REASON_OPTIONS,
  NewPaymentMethod,
  NEW_PAYMENT_METHOD_OPTIONS,
} from '@/types/pdc';
import { useState } from 'react';

const withdrawSchema = z.object({
  withdrawalDate: z.string().min(1, 'Withdrawal date is required'),
  withdrawalReason: z.string().min(1, 'Withdrawal reason is required'),
  newPaymentMethod: z.nativeEnum(NewPaymentMethod).optional(),
  transactionDetails: z.object({
    amount: z.number().positive().optional(),
    transactionId: z.string().optional(),
    bankAccountId: z.string().optional(),
  }).optional(),
});

type WithdrawFormData = z.infer<typeof withdrawSchema>;

interface PDCWithdrawModalProps {
  pdc: PDCDetail;
  open: boolean;
  onClose: () => void;
}

export function PDCWithdrawModal({ pdc, open, onClose }: PDCWithdrawModalProps) {
  const { mutate: withdrawPDC, isPending } = useWithdrawPDC();
  const { data: bankAccounts } = useBankAccounts();
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      withdrawalDate: format(new Date(), 'yyyy-MM-dd'),
      withdrawalReason: '',
      newPaymentMethod: undefined,
      transactionDetails: {
        amount: pdc.amount,
        transactionId: '',
        bankAccountId: '',
      },
    },
  });

  const selectedPaymentMethod = form.watch('newPaymentMethod');

  const onSubmit = (data: WithdrawFormData) => {
    // Only include transaction details if bank transfer selected and all fields are present
    const transactionDetails = selectedPaymentMethod === NewPaymentMethod.BANK_TRANSFER &&
      data.transactionDetails?.amount &&
      data.transactionDetails?.transactionId &&
      data.transactionDetails?.bankAccountId
        ? {
            amount: data.transactionDetails.amount,
            transactionId: data.transactionDetails.transactionId,
            bankAccountId: data.transactionDetails.bankAccountId,
          }
        : undefined;

    const submitData = {
      withdrawalDate: data.withdrawalDate,
      withdrawalReason: data.withdrawalReason,
      newPaymentMethod: data.newPaymentMethod,
      transactionDetails,
    };

    withdrawPDC(
      { id: pdc.id, data: submitData },
      {
        onSuccess: () => {
          form.reset();
          setIsCustomReason(false);
          setShowPaymentDetails(false);
          onClose();
        },
      }
    );
  };

  const handleReasonChange = (value: string) => {
    if (value === 'Other') {
      setIsCustomReason(true);
      form.setValue('withdrawalReason', '');
    } else {
      setIsCustomReason(false);
      form.setValue('withdrawalReason', value);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === 'none') {
      form.setValue('newPaymentMethod', undefined);
      setShowPaymentDetails(false);
    } else {
      form.setValue('newPaymentMethod', value as NewPaymentMethod);
      setShowPaymentDetails(value === NewPaymentMethod.BANK_TRANSFER);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Withdraw PDC
          </DialogTitle>
          <DialogDescription>
            Return cheque #{pdc.chequeNumber} for {formatPDCCurrency(pdc.amount)} to the tenant.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Withdrawal Date */}
            <FormField
              control={form.control}
              name="withdrawalDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Date *</FormLabel>
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
                            format(new Date(field.value), 'MMM dd, yyyy')
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
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(date?.toISOString().split('T')[0] || '')
                        }
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Withdrawal Reason */}
            <FormField
              control={form.control}
              name="withdrawalReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Withdrawal *</FormLabel>
                  {!isCustomReason ? (
                    <Select onValueChange={handleReasonChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WITHDRAWAL_REASON_OPTIONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          placeholder="Enter custom reason"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => {
                          setIsCustomReason(false);
                          form.setValue('withdrawalReason', '');
                        }}
                      >
                        Select from list
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Payment Method */}
            <FormField
              control={form.control}
              name="newPaymentMethod"
              render={() => (
                <FormItem>
                  <FormLabel>Replacement Payment Method (Optional)</FormLabel>
                  <Select
                    onValueChange={handlePaymentMethodChange}
                    value={selectedPaymentMethod || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select if applicable" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No replacement payment</SelectItem>
                      {NEW_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If the tenant is providing alternative payment, select the method
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bank Transfer Details */}
            {showPaymentDetails && (
              <div className="space-y-4 p-4 rounded-md border bg-muted/50">
                <p className="text-sm font-medium">Bank Transfer Details</p>

                <FormField
                  control={form.control}
                  name="transactionDetails.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transfer Amount (AED)</FormLabel>
                      <FormControl>
                        <NumberInput
                          step={1}
                          min={0}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionDetails.transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Bank reference number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionDetails.bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received In Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                This will mark the PDC as withdrawn and record the return to the tenant.
                The withdrawal will appear in the withdrawal history report.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Withdrawal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PDCWithdrawModal;
