/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Cancel Request Button Component
 * Story 3.5: Tenant Portal - Maintenance Request Submission
 *
 * Allows tenants to cancel request (only if status = SUBMITTED)
 * Shows confirmation dialog before cancelling
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cancelMaintenanceRequest } from '@/services/maintenance.service';

interface CancelRequestButtonProps {
  requestId: string;
  requestNumber: string;
}

export function CancelRequestButton({ requestId, requestNumber }: CancelRequestButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      await cancelMaintenanceRequest(requestId);

      toast({
        title: 'Request cancelled',
        description: `Request ${requestNumber} has been cancelled`,
        variant: 'success',
      });

      // Redirect to requests list
      router.push('/tenant/requests');
    } catch (error: any) {
      toast({
        title: 'Failed to cancel request',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
      setIsCancelling(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" data-testid="btn-cancel-request">
          <Trash2 className="mr-2 h-4 w-4" />
          Cancel Request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel maintenance request?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel request #{requestNumber}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>No, keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isCancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="btn-confirm-cancel"
          >
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCancelling ? 'Cancelling...' : 'Yes, cancel request'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
