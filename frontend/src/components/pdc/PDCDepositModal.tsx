'use client';

/**
 * PDC Deposit Modal
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #8: Mark PDC as deposited with date and bank account selection
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Building2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { useDepositPDC, useBankAccounts } from '@/hooks/usePDCs';
import { PDCDetail, formatPDCCurrency } from '@/types/pdc';

const depositSchema = z.object({
  depositDate: z.string().min(1, 'Deposit date is required'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface PDCDepositModalProps {
  pdc: PDCDetail;
  open: boolean;
  onClose: () => void;
}

export function PDCDepositModal({ pdc, open, onClose }: PDCDepositModalProps) {
  const { mutate: depositPDC, isPending } = useDepositPDC();
  const { data: bankAccounts, isLoading: loadingAccounts } = useBankAccounts();

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      depositDate: format(new Date(), 'yyyy-MM-dd'),
      bankAccountId: '',
    },
  });

  const onSubmit = (data: DepositFormData) => {
    depositPDC(
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mark as Deposited
          </DialogTitle>
          <DialogDescription>
            Record the deposit of cheque #{pdc.chequeNumber} for {formatPDCCurrency(pdc.amount)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Deposit Date */}
            <FormField
              control={form.control}
              name="depositDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Date *</FormLabel>
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

            {/* Bank Account */}
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit To Bank Account *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingAccounts ? 'Loading...' : 'Select bank account'} />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Deposit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PDCDepositModal;
