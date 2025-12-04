'use client';

/**
 * PDC Cancel Dialog
 * Story 6.3: Post-Dated Cheque (PDC) Management
 * Confirmation dialog for cancelling a PDC
 */

import { Ban, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCancelPDC } from '@/hooks/usePDCs';
import { PDCDetail, formatPDCCurrency } from '@/types/pdc';

interface PDCCancelDialogProps {
  pdc: PDCDetail;
  open: boolean;
  onClose: () => void;
}

export function PDCCancelDialog({ pdc, open, onClose }: PDCCancelDialogProps) {
  const { mutate: cancelPDC, isPending } = useCancelPDC();

  const handleCancel = () => {
    cancelPDC(pdc.id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-5 w-5" />
            Cancel PDC
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to cancel cheque #{pdc.chequeNumber} for{' '}
              <strong>{formatPDCCurrency(pdc.amount)}</strong>?
            </p>
            <p className="text-sm">
              This action will void the PDC. It cannot be deposited or processed after cancellation.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Keep PDC
          </Button>
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleCancel} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Cancel PDC
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default PDCCancelDialog;
