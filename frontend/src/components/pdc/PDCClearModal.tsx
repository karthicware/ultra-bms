'use client';

/**
 * PDC Clear Modal
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #9: Mark PDC as cleared with clearance date
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, Loader2 } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useClearPDC } from '@/hooks/usePDCs';
import { PDCDetail, formatPDCCurrency } from '@/types/pdc';

const clearSchema = z.object({
  clearedDate: z.string().min(1, 'Clearance date is required'),
});

type ClearFormData = z.infer<typeof clearSchema>;

interface PDCClearModalProps {
  pdc: PDCDetail;
  open: boolean;
  onClose: () => void;
}

export function PDCClearModal({ pdc, open, onClose }: PDCClearModalProps) {
  const { mutate: clearPDC, isPending } = useClearPDC();

  const form = useForm<ClearFormData>({
    resolver: zodResolver(clearSchema),
    defaultValues: {
      clearedDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = (data: ClearFormData) => {
    clearPDC(
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
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Mark as Cleared
          </DialogTitle>
          <DialogDescription>
            Confirm that cheque #{pdc.chequeNumber} for {formatPDCCurrency(pdc.amount)} has cleared.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Clearance Date */}
            <FormField
              control={form.control}
              name="clearedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clearance Date *</FormLabel>
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

            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                This will record the cheque as successfully cleared and add the amount to collected revenue.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Clearance
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PDCClearModal;
