'use client';

/**
 * PDC Replace Modal
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #12: Replace bounced PDC with new cheque details
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, RefreshCw, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useReplacePDC } from '@/hooks/usePDCs';
import { PDCDetail, formatPDCCurrency } from '@/types/pdc';

const replaceSchema = z.object({
  newChequeNumber: z.string().min(1, 'Cheque number is required').max(50),
  bankName: z.string().min(1, 'Bank name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  chequeDate: z.string().min(1, 'Cheque date is required'),
  notes: z.string().max(500).optional(),
});

type ReplaceFormData = z.infer<typeof replaceSchema>;

interface PDCReplaceModalProps {
  pdc: PDCDetail;
  open: boolean;
  onClose: () => void;
}

export function PDCReplaceModal({ pdc, open, onClose }: PDCReplaceModalProps) {
  const { mutate: replacePDC, isPending } = useReplacePDC();

  const form = useForm<ReplaceFormData>({
    resolver: zodResolver(replaceSchema),
    defaultValues: {
      newChequeNumber: '',
      bankName: pdc.bankName, // Default to same bank
      amount: pdc.amount, // Default to same amount
      chequeDate: '',
      notes: '',
    },
  });

  const onSubmit = (data: ReplaceFormData) => {
    replacePDC(
      { id: pdc.id, data },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Replace Bounced PDC
          </DialogTitle>
          <DialogDescription>
            Register a replacement cheque for bounced #{pdc.chequeNumber} ({formatPDCCurrency(pdc.amount)})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* New Cheque Number */}
              <FormField
                control={form.control}
                name="newChequeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Cheque Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bank Name */}
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Emirates NBD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (AED) *</FormLabel>
                    <FormControl>
                      <NumberInput
                        step={0.01}
                        min={0.01}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormDescription>
                      Original: {formatPDCCurrency(pdc.amount)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cheque Date */}
              <FormField
                control={form.control}
                name="chequeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cheque Date *</FormLabel>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this replacement..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-3">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                The original bounced PDC will be marked as &quot;Replaced&quot; and linked to this new cheque.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Replacement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PDCReplaceModal;
