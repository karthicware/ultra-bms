'use client';

/**
 * PDC Bounce Modal
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * AC #10: Report bounced PDC with date and reason
 * AC #11: Notification trigger on bounce
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBouncePDC } from '@/hooks/usePDCs';
import { PDCDetail, formatPDCCurrency, BOUNCE_REASON_OPTIONS } from '@/types/pdc';
import { useState } from 'react';

const bounceSchema = z.object({
  bouncedDate: z.string().min(1, 'Bounce date is required'),
  bounceReason: z.string().min(1, 'Bounce reason is required'),
});

type BounceFormData = z.infer<typeof bounceSchema>;

interface PDCBounceModalProps {
  pdc: PDCDetail;
  open: boolean;
  onClose: () => void;
}

export function PDCBounceModal({ pdc, open, onClose }: PDCBounceModalProps) {
  const { mutate: bouncePDC, isPending } = useBouncePDC();
  const [isCustomReason, setIsCustomReason] = useState(false);

  const form = useForm<BounceFormData>({
    resolver: zodResolver(bounceSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      bouncedDate: format(new Date(), 'yyyy-MM-dd'),
      bounceReason: '',
    },
  });

  const onSubmit = (data: BounceFormData) => {
    bouncePDC(
      { id: pdc.id, data },
      {
        onSuccess: () => {
          form.reset();
          setIsCustomReason(false);
          onClose();
        },
      }
    );
  };

  const handleReasonChange = (value: string) => {
    if (value === 'Other') {
      setIsCustomReason(true);
      form.setValue('bounceReason', '');
    } else {
      setIsCustomReason(false);
      form.setValue('bounceReason', value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Report Bounced Cheque
          </DialogTitle>
          <DialogDescription>
            Record that cheque #{pdc.chequeNumber} for {formatPDCCurrency(pdc.amount)} has bounced.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bounce Date */}
            <FormField
              control={form.control}
              name="bouncedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bounce Date *</FormLabel>
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

            {/* Bounce Reason */}
            <FormField
              control={form.control}
              name="bounceReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bounce Reason *</FormLabel>
                  {!isCustomReason ? (
                    <Select onValueChange={handleReasonChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOUNCE_REASON_OPTIONS.map((reason) => (
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
                          form.setValue('bounceReason', '');
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

            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 space-y-2">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                This action will:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                <li>Mark this PDC as bounced</li>
                <li>Send a notification email to the tenant</li>
                <li>Alert property managers about the bounce</li>
                <li>Allow you to register a replacement cheque</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Bounce
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PDCBounceModal;
